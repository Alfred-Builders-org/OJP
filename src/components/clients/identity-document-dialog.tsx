"use client";

import { useRef, useState } from "react";
import { Camera, X, FloppyDisk } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { NationalitySelect } from "@/components/ui/nationality-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectItems,
} from "@/components/ui/select";
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/validations/client";
import type { ClientIdentityDocument } from "@/types/client";

export interface SaisiePiece {
  documentType: string;
  documentNumber: string;
  issueDate: Date | undefined;
  expiryDate: Date | undefined;
  nationality: string;
  photoFile: File | null;
  photoPreview: string | null;
}

interface IdentityDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pièce en cours de modification, ou `null` pour un ajout. */
  document: ClientIdentityDocument | null;
  valeurs: SaisiePiece;
  onChange: (patch: Partial<SaisiePiece>) => void;
  errors: Record<string, string>;
  saving: boolean;
  onSubmit: () => void;
}

/**
 * Saisie d'une pièce d'identité, en modale.
 *
 * Le formulaire existait en double dans la liste — une version pour l'ajout, une
 * pour la modification, à quelques lignes près identiques. Une seule modale sert
 * désormais les deux cas.
 *
 * La nationalité passe en tête : c'est elle qui détermine le type de pièce
 * recevable, on la renseigne donc avant.
 */
export function IdentityDocumentDialog({
  open,
  onOpenChange,
  document,
  valeurs,
  onChange,
  errors,
  saving,
  onSubmit,
}: IdentityDocumentDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [glisse, setGlisse] = useState(false);

  function prendreFichier(file: File | undefined) {
    if (!file) return;
    if (valeurs.photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(valeurs.photoPreview);
    }
    onChange({ photoFile: file, photoPreview: URL.createObjectURL(file) });
  }

  function retirerPhoto() {
    if (valeurs.photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(valeurs.photoPreview);
    }
    onChange({ photoFile: null, photoPreview: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {document ? "Modifier la pièce d'identité" : "Ajouter une pièce d'identité"}
          </DialogTitle>
          <DialogDescription>
            Tous les champs sont requis. Une pièce déjà expirée ne peut pas être
            enregistrée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Field label="Nationalité" required error={errors.nationality}>
            <NationalitySelect
              value={valeurs.nationality}
              onValueChange={(v) => onChange({ nationality: v })}
            />
          </Field>

          <Field label="Type de document" required error={errors.document_type}>
            <Select
              value={valeurs.documentType}
              onValueChange={(val) => onChange({ documentType: val ?? "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder="Sélectionner"
                  items={selectItems(DOCUMENT_TYPE_OPTIONS)}
                />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Numéro" required error={errors.document_number}>
            <Input
              value={valeurs.documentNumber}
              onChange={(e) => onChange({ documentNumber: e.target.value })}
              placeholder="123456789"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date d'émission" required error={errors.issue_date}>
              <DatePicker
                value={valeurs.issueDate}
                onChange={(d) => onChange({ issueDate: d })}
                placeholder="Sélectionner"
              />
            </Field>
            <Field label="Date d'expiration" required error={errors.expiry_date}>
              <DatePicker
                value={valeurs.expiryDate}
                onChange={(d) => onChange({ expiryDate: d })}
                placeholder="Sélectionner"
              />
            </Field>
          </div>

          <Field label="Photo du document" required error={errors.photo}>
            {valeurs.photoPreview ? (
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-32 overflow-hidden rounded-md border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={valeurs.photoPreview}
                    alt="Aperçu"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={retirerPhoto}
                  aria-label="Supprimer la photo"
                >
                  <X size={14} weight="regular" className="text-destructive" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className={
                  "flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm transition-colors " +
                  (glisse
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-input text-muted-foreground hover:border-foreground/30 hover:text-foreground")
                }
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setGlisse(true);
                }}
                onDragLeave={() => setGlisse(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setGlisse(false);
                  prendreFichier(e.dataTransfer.files?.[0]);
                }}
              >
                <Camera size={20} weight="duotone" />
                <span>{glisse ? "Déposer l'image" : "Cliquer ou déposer une photo"}</span>
                <span className="text-xs text-muted-foreground">JPG ou PNG</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => prendreFichier(e.target.files?.[0])}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            <FloppyDisk size={16} weight="duotone" />
            {saving ? "Enregistrement..." : document ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
