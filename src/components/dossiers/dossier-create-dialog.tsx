"use client";

import { Field, FieldError } from "@/components/ui/field";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  User as PhUser,
  Plus,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClientCreateDialog } from "@/components/clients/client-create-dialog";
import type { Client } from "@/types/client";

interface DossierCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validClients: Client[];
}

export function DossierCreateDialog({ open, onOpenChange, validClients: initialClients }: DossierCreateDialogProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState(initialClients);
  const [showClientCreate, setShowClientCreate] = useState(false);
  const [rechercheClient, setRechercheClient] = useState("");
  const [notes, setNotes] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  const clientsFiltres = rechercheClient.trim()
    ? clients.filter((c) =>
        [c.first_name, c.last_name, c.email, c.phone, c.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(rechercheClient.trim().toLowerCase())
      )
    : clients;

  function handleClose() {
    setClientId("");
    setError("");
    setRechercheClient("");
    setNotes("");
    onOpenChange(false);
  }

  function handleClientCreated(newClient: Client) {
    setClients((prev) => [...prev, newClient]);
    setClientId(newClient.id);
  }

  async function handleCreateDossier() {
    if (!clientId) {
      setError("Veuillez sélectionner un client");
      return;
    }
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error: insertError } = await supabase
      .from("dossiers")
      .insert({
        numero: "",
        client_id: clientId,
        notes: notes || null,
        created_by: user?.id ?? "",
      })
      .select()
      .single();

    setSaving(false);

    if (insertError) {
      toast.error("Erreur lors de la création du dossier");
      return;
    }

    handleClose();
    toast.success("Dossier créé");
    router.push(`/dossiers/${data.id}`);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus size={20} weight="duotone" />
              Nouveau dossier
            </DialogTitle>
            <DialogDescription>
              Sélectionnez un client pour créer un nouveau dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label required>Client</Label>
              <p className="text-xs text-muted-foreground">
                Seuls les clients avec une pièce d&apos;identité valide sont affichés.
              </p>
              <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
                <SelectTrigger>
                  {selectedClient
                    ? <span className="truncate">{`${selectedClient.civility === "M" ? "M." : "Mme"} ${selectedClient.first_name} ${selectedClient.last_name}`}</span>
                    : <SelectValue placeholder="Sélectionner un client" />}
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {/* La boutique compte plusieurs centaines de clients : sans
                      recherche, la selection devient un defilement interminable. */}
                  <div className="flex items-center gap-2 px-2 pb-2 sticky top-0 bg-popover z-10">
                    <MagnifyingGlass size={14} className="shrink-0 text-muted-foreground" />
                    <input
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Rechercher un client..."
                      value={rechercheClient}
                      onChange={(e) => setRechercheClient(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
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
                  {clientsFiltres.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      {clients.length === 0
                        ? "Aucun client valide disponible."
                        : "Aucun client ne correspond."}
                    </div>
                  ) : (
                    clientsFiltres.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {`${client.civility === "M" ? "M." : "Mme"} ${client.first_name} ${client.last_name}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {error && <FieldError>{error}</FieldError>}
            </div>
            <Field label="Notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contexte, demande particuliere du client..."
                className="min-h-[80px] resize-none"
              />
            </Field>

            {selectedClient && (
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <PhUser size={14} weight="duotone" />
                  Infos client
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span>{selectedClient.phone ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span>{selectedClient.email ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ville</span>
                  <span>{selectedClient.city ?? "—"}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>
              Annuler
            </Button>
            <Button size="sm" disabled={saving} onClick={handleCreateDossier}>
              <FolderPlus size={14} weight="duotone" />
              {saving ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ClientCreateDialog
        open={showClientCreate}
        onOpenChange={setShowClientCreate}
        onClientCreated={handleClientCreated}
      />
    </>
  );
}
