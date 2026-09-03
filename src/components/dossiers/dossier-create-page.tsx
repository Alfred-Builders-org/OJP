"use client";

import { Field, FieldError } from "@/components/ui/field";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Buildings,
  Factory,
  FloppyDisk,
  FolderOpen as PhFolderOpen,
  NotePencil as PhNotePencil,
  Plus,
  User as PhUser,
  Users,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";
import { cn } from "@/lib/utils";
import { ClientCreateDialog } from "@/components/clients/client-create-dialog";
import type { Client } from "@/types/client";
import type { Grossiste } from "@/types/grossiste";
import type { Fonderie } from "@/types/fonderie";

type TiersType = "client" | "grossiste" | "fonderie";

interface DossierCreatePageProps {
  validClients: Client[];
  grossistes: Grossiste[];
  fonderies: Fonderie[];
}

interface OptionTiers {
  type: TiersType;
  icone: Icon;
  titre: string;
  description: string;
}

const OPTIONS: OptionTiers[] = [
  {
    type: "client",
    icone: Users,
    titre: "Client",
    description: "Un particulier qui vend ou achète au comptoir.",
  },
  {
    type: "grossiste",
    icone: Buildings,
    titre: "Grossiste",
    description: "Un fournisseur professionnel à qui l'on rachète des bijoux.",
  },
  {
    type: "fonderie",
    icone: Factory,
    titre: "Fonderie",
    description: "Une fonderie partenaire, à qui l'on vend de l'or à fondre ou de qui l'on rachète.",
  },
];

export function DossierCreatePage({
  validClients,
  grossistes,
  fonderies,
}: DossierCreatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clients, setClients] = useState(validClients);
  const [showClientCreate, setShowClientCreate] = useState(false);

  // Un dossier ouvert depuis « /dossiers/new?client_id=… » présélectionne le
  // client — cas conservé de l'ancien parcours.
  const paramClientId = searchParams.get("client_id") ?? "";
  const isParamValid = clients.some((c) => c.id === paramClientId);

  const [tiersType, setTiersType] = useState<TiersType>(isParamValid ? "client" : "client");
  const [clientId, setClientId] = useState(isParamValid ? paramClientId : "");
  const [grossisteId, setGrossisteId] = useState("");
  const [fonderieId, setFonderieId] = useState("");
  const [notes, setNotes] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const selectedGrossiste = grossistes.find((g) => g.id === grossisteId) ?? null;
  const selectedFonderie = fonderies.find((f) => f.id === fonderieId) ?? null;

  function handleClientCreated(newClient: Client) {
    setClients((prev) => [...prev, newClient]);
    setClientId(newClient.id);
  }

  function changerType(t: TiersType) {
    setTiersType(t);
    // Vider les autres sélections : un dossier porte un tiers, et un seul.
    if (t !== "client") setClientId("");
    if (t !== "grossiste") setGrossisteId("");
    if (t !== "fonderie") setFonderieId("");
    setErrors({});
  }

  async function handleCreate() {
    const fieldErrors: Record<string, string> = {};
    if (tiersType === "client" && !clientId) fieldErrors.tiers = "Choisissez un client.";
    if (tiersType === "grossiste" && !grossisteId) fieldErrors.tiers = "Choisissez un grossiste.";
    if (tiersType === "fonderie" && !fonderieId) fieldErrors.tiers = "Choisissez une fonderie.";
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload: Record<string, unknown> = {
      numero: "",
      tiers_type: tiersType,
      client_id: tiersType === "client" ? clientId : null,
      grossiste_id: tiersType === "grossiste" ? grossisteId : null,
      fonderie_id: tiersType === "fonderie" ? fonderieId : null,
      notes: notes || null,
      created_by: user?.id ?? "",
    };

    const { data, error } = await supabase.from("dossiers").insert(payload).select().single();

    setSaving(false);

    if (error) {
      setErrors({ _form: `Erreur lors de la création du dossier. ${error.message}` });
      return;
    }

    toast.success("Dossier créé");
    router.replace(`/dossiers/${data.id}`);
  }

  return (
    <>
      <Header
        title="Nouveau dossier"
        backAction={
          <Button variant="ghost" size="icon-sm" aria-label="Retour" onClick={() => router.back()}>
            <ArrowLeft size={16} weight="regular" />
          </Button>
        }
      >
        <Button size="sm" disabled={saving} onClick={handleCreate}>
          <FloppyDisk size={16} weight="duotone" />
          {saving ? "Création..." : "Créer"}
        </Button>
      </Header>
      <div className="flex-1 p-6">
        {errors._form && <FieldError className="mb-4">{errors._form}</FieldError>}

        {/* 1. Choix du type de tiers : trois cartes cliquables. Le tiers d'un
               dossier détermine ce qu'on pourra y faire — c'est la première
               question à poser. */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">Type de dossier</p>
          <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Type de dossier">
            {OPTIONS.map((opt) => {
              const Ic = opt.icone;
              const actif = tiersType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => changerType(opt.type)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                    actif
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      actif ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Ic size={20} weight="duotone" />
                  </div>
                  <div className="space-y-1">
                    <p className={cn("font-semibold", actif ? "text-primary" : "text-foreground")}>
                      {opt.titre}
                    </p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations du dossier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhFolderOpen size={20} weight="duotone" />
                Informations du dossier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Numéro</span>
                <span className="font-medium text-muted-foreground italic">Auto-généré</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Statut</span>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                  Ouvert
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tiers sélectionné selon le type */}
          {tiersType === "client" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhUser size={20} weight="duotone" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label required>Client</Label>
                  <p className="text-xs text-muted-foreground">
                    Seuls les clients avec une pièce d&apos;identité valide sont affichés.
                  </p>
                  <Select value={clientId} onValueChange={(val) => setClientId(val ?? "")}>
                    <SelectTrigger>
                      {selectedClient ? (
                        <span className="truncate">{`${selectedClient.civility === "M" ? "M." : "Mme"} ${selectedClient.first_name} ${selectedClient.last_name}`}</span>
                      ) : (
                        <SelectValue placeholder="Sélectionner un client" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent cursor-pointer"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowClientCreate(true);
                        }}
                      >
                        <Plus size={14} weight="bold" />
                        Nouveau client
                      </button>
                      <div className="my-1 h-px bg-border" />
                      {clients.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Aucun client valide disponible.
                        </div>
                      ) : (
                        clients.map((client) => {
                          const name = `${client.civility === "M" ? "M." : "Mme"} ${client.first_name} ${client.last_name}`;
                          return (
                            <SelectItem key={client.id} value={client.id}>
                              {name}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {errors.tiers && <FieldError>{errors.tiers}</FieldError>}
                </div>
                {selectedClient && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Téléphone</span>
                      <span className="font-medium">{selectedClient.phone ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedClient.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Ville</span>
                      <span className="font-medium">{selectedClient.city ?? "—"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tiersType === "grossiste" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Buildings size={20} weight="duotone" />
                  Grossiste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label required>Grossiste</Label>
                  <Select value={grossisteId} onValueChange={(val) => setGrossisteId(val ?? "")}>
                    <SelectTrigger>
                      {selectedGrossiste ? (
                        <span className="truncate">
                          {selectedGrossiste.raison_sociale ?? selectedGrossiste.nom}
                        </span>
                      ) : (
                        <SelectValue placeholder="Sélectionner un grossiste" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {grossistes.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Aucun grossiste. Créez-en un depuis <b>Stock → Grossistes</b>.
                        </div>
                      ) : (
                        grossistes.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.raison_sociale ?? g.nom}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.tiers && <FieldError>{errors.tiers}</FieldError>}
                </div>
                {selectedGrossiste && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">SIRET</span>
                      <span className="font-medium">{selectedGrossiste.siret ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Téléphone</span>
                      <span className="font-medium">{selectedGrossiste.telephone ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Ville</span>
                      <span className="font-medium">{selectedGrossiste.ville ?? "—"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tiersType === "fonderie" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory size={20} weight="duotone" />
                  Fonderie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label required>Fonderie</Label>
                  <Select value={fonderieId} onValueChange={(val) => setFonderieId(val ?? "")}>
                    <SelectTrigger>
                      {selectedFonderie ? (
                        <span className="truncate">{selectedFonderie.nom}</span>
                      ) : (
                        <SelectValue placeholder="Sélectionner une fonderie" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {fonderies.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Aucune fonderie. Créez-en une depuis <b>Fonderie → Fonderies</b>.
                        </div>
                      ) : (
                        fonderies.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nom}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.tiers && <FieldError>{errors.tiers}</FieldError>}
                </div>
                {selectedFonderie && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Téléphone</span>
                      <span className="font-medium">{selectedFonderie.telephone ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{selectedFonderie.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Ville</span>
                      <span className="font-medium">{selectedFonderie.ville ?? "—"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhNotePencil size={20} weight="duotone" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Notes" error={errors.notes}>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes sur le dossier..."
                  className="min-h-[150px] resize-none"
                />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
      <ClientCreateDialog
        open={showClientCreate}
        onOpenChange={setShowClientCreate}
        onClientCreated={handleClientCreated}
      />
    </>
  );
}
