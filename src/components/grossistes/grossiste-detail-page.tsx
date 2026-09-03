"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  ChartBar,
  Diamond,
  FloppyDisk,
  MapPin,
  NotePencil,
  PencilSimple,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";
import { formatDate, formatCurrency } from "@/lib/format";
import type { Grossiste, AchatGrossisteAvecArticles } from "@/types/grossiste";

function DetailRow({
  label,
  value,
  editing,
  editValue,
  onEditChange,
  type = "text",
}: {
  label: string;
  value: React.ReactNode;
  editing?: boolean;
  editValue?: string;
  onEditChange?: (val: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {editing && onEditChange ? (
        <Input
          type={type}
          value={editValue ?? ""}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-64"
        />
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}

interface GrossisteForm {
  nom: string;
  raisonSociale: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
}

interface GrossisteDetailPageProps {
  grossiste: Grossiste;
  achats: AchatGrossisteAvecArticles[];
  nbArticles: number;
}

export function GrossisteDetailPage({
  grossiste,
  achats,
  nbArticles,
}: GrossisteDetailPageProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<GrossisteForm>({
    nom: grossiste.nom,
    raisonSociale: grossiste.raison_sociale ?? "",
    siret: grossiste.siret ?? "",
    adresse: grossiste.adresse ?? "",
    codePostal: grossiste.code_postal ?? "",
    ville: grossiste.ville ?? "",
    telephone: grossiste.telephone ?? "",
    email: grossiste.email ?? "",
  });

  function updateField(field: keyof GrossisteForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(grossiste.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const totalAchats = achats.reduce((sum, a) => sum + (a.montant_total ?? 0), 0);
  const totalRevente = achats.reduce((sum, a) => sum + (a.montant_revente ?? 0), 0);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await mutate(
      supabase
        .from("grossistes")
        .update({
          nom: form.nom,
          raison_sociale: form.raisonSociale || null,
          siret: form.siret || null,
          adresse: form.adresse || null,
          code_postal: form.codePostal || null,
          ville: form.ville || null,
          telephone: form.telephone || null,
          email: form.email || null,
        })
        .eq("id", grossiste.id),
      "Erreur lors de la mise à jour du grossiste",
      "Grossiste mis à jour"
    );
    setSaving(false);
    if (error) return;
    setEditing(false);
    router.refresh();
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    const supabase = createClient();
    const { error } = await mutate(
      supabase
        .from("grossistes")
        .update({ notes: notes || null })
        .eq("id", grossiste.id),
      "Erreur lors de la mise à jour des notes",
      "Notes sauvegardées"
    );
    setSavingNotes(false);
    if (error) return;
    setEditingNotes(false);
    router.refresh();
  }

  return (
    <>
      <Header
        title={grossiste.nom}
        backAction={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Retour"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} weight="regular" />
          </Button>
        }
      >
        {editing ? (
          <Button size="sm" disabled={saving} onClick={handleSave}>
            <FloppyDisk size={16} weight="duotone" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setEditing(true)}>
            <PencilSimple size={16} weight="duotone" />
            Modifier
          </Button>
        )}
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {achats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar size={20} weight="duotone" />
                Résumé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Achats</p>
                  <p className="text-lg font-bold tabular-nums">{achats.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Articles en stock</p>
                  <p className="text-lg font-bold tabular-nums">{nbArticles}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Montant achete</p>
                  <p className="text-lg font-bold">{formatCurrency(totalAchats)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Valeur de revente</p>
                  <p className="text-lg font-bold">{formatCurrency(totalRevente)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Buildings size={20} weight="duotone" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Nom"
                value={grossiste.nom}
                editing={editing}
                editValue={form.nom}
                onEditChange={(v) => updateField("nom", v)}
              />
              <DetailRow
                label="Raison sociale"
                value={grossiste.raison_sociale ?? "—"}
                editing={editing}
                editValue={form.raisonSociale}
                onEditChange={(v) => updateField("raisonSociale", v)}
              />
              <DetailRow
                label="SIRET"
                value={grossiste.siret ?? "—"}
                editing={editing}
                editValue={form.siret}
                onEditChange={(v) => updateField("siret", v)}
              />
              <DetailRow
                label="Téléphone"
                value={grossiste.telephone ?? "—"}
                editing={editing}
                editValue={form.telephone}
                onEditChange={(v) => updateField("telephone", v)}
                type="tel"
              />
              <DetailRow
                label="Email"
                value={grossiste.email ?? "—"}
                editing={editing}
                editValue={form.email}
                onEditChange={(v) => updateField("email", v)}
                type="email"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} weight="duotone" />
                Adresse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Adresse"
                value={grossiste.adresse ?? "—"}
                editing={editing}
                editValue={form.adresse}
                onEditChange={(v) => updateField("adresse", v)}
              />
              <DetailRow
                label="Code postal"
                value={grossiste.code_postal ?? "—"}
                editing={editing}
                editValue={form.codePostal}
                onEditChange={(v) => updateField("codePostal", v)}
              />
              <DetailRow
                label="Ville"
                value={grossiste.ville ?? "—"}
                editing={editing}
                editValue={form.ville}
                onEditChange={(v) => updateField("ville", v)}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Diamond size={20} weight="duotone" />
              Achats ({achats.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {achats.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                Aucun achat enregistré chez ce grossiste.
              </p>
            ) : (
              <div className="divide-y">
                {achats.map((achat) => (
                  <Link
                    key={achat.id}
                    href={`/achats/${achat.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{achat.numero}</span>
                        {achat.numero_facture && (
                          <span className="text-xs text-muted-foreground">
                            facture {achat.numero_facture}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {achat.nb_articles} article{achat.nb_articles > 1 ? "s" : ""} ·{" "}
                        {formatDate(achat.date_achat)}
                      </p>
                    </div>
                    <span className="text-sm font-bold shrink-0 tabular-nums">
                      {formatCurrency(achat.montant_total ?? 0)}
                    </span>
                    <ArrowRight
                      size={14}
                      weight="regular"
                      className="text-muted-foreground shrink-0"
                    />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <NotePencil size={20} weight="duotone" />
              Notes
            </CardTitle>
            {editingNotes ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={savingNotes}
                onClick={handleSaveNotes}
              >
                <FloppyDisk size={14} weight="duotone" />
                {savingNotes ? "Enregistrement..." : "Enregistrer"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingNotes(true)}
                aria-label="Modifier les notes"
              >
                <PencilSimple size={16} weight="duotone" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingNotes ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions, contact commercial, délais de livraison..."
                className="min-h-[100px] resize-none"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {grossiste.notes ?? "Aucune note."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
