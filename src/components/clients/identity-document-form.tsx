"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash,
  IdentificationCard,
  X,
  DotsThree,
  Eye,
  PencilSimple,
  Star,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IdentityPhotosCard } from "@/components/photos/identity-photos-card";
import { identityDocumentSchema } from "@/lib/validations/client";
import { formatDate, formatDateISO } from "@/lib/format";
import {
  IdentityDocumentDialog,
  type SaisiePiece,
} from "@/components/clients/identity-document-dialog";
import type { ClientIdentityDocument } from "@/types/client";

const documentTypeLabels: Record<string, string> = {
  cni: "CNI",
  passeport: "Passeport",
  titre_sejour: "Titre de séjour",
  permis_conduire: "Permis de conduire",
};

const SAISIE_VIDE: SaisiePiece = {
  documentType: "",
  documentNumber: "",
  issueDate: undefined,
  expiryDate: undefined,
  nationality: "Française",
  photoFile: null,
  photoPreview: null,
};

async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from("identity-documents")
    .createSignedUrl(path, 300); // 5 min
  return data?.signedUrl ?? null;
}

export function IdentityDocumentSection({
  clientId,
  documents,
}: {
  clientId: string;
  documents: ClientIdentityDocument[];
}) {
  const router = useRouter();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [docEnEdition, setDocEnEdition] = useState<ClientIdentityDocument | null>(null);
  const [saisie, setSaisie] = useState<SaisiePiece>(SAISIE_VIDE);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  function majSaisie(patch: Partial<SaisiePiece>) {
    setSaisie((prev) => ({ ...prev, ...patch }));
  }

  function fermerDialog() {
    if (saisie.photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(saisie.photoPreview);
    }
    setSaisie(SAISIE_VIDE);
    setErrors({});
    setDocEnEdition(null);
    setDialogOuvert(false);
  }

  function ouvrirAjout() {
    setSaisie(SAISIE_VIDE);
    setErrors({});
    setDocEnEdition(null);
    setDialogOuvert(true);
  }

  async function ouvrirEdition(doc: ClientIdentityDocument) {
    if (saving) return;
    setDocEnEdition(doc);
    setErrors({});
    setSaisie({
      documentType: doc.document_type,
      documentNumber: doc.document_number,
      issueDate: doc.issue_date ? new Date(doc.issue_date) : undefined,
      expiryDate: doc.expiry_date ? new Date(doc.expiry_date) : undefined,
      nationality: doc.nationality ?? "Française",
      photoFile: null,
      photoPreview: doc.photo_url ? await getSignedUrl(doc.photo_url) : null,
    });
    setDialogOuvert(true);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!saisie.photoFile) return null;
    const supabase = createClient();
    const ext = saisie.photoFile.name.split(".").pop();
    const path = `${clientId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("identity-documents")
      .upload(path, saisie.photoFile);
    return error ? null : path;
  }

  /** Validation commune à l'ajout et à la modification. */
  function valider(): { issue: string; expiry: string } | null {
    const issueDateStr = saisie.issueDate ? formatDateISO(saisie.issueDate) : "";
    const expiryDateStr = saisie.expiryDate ? formatDateISO(saisie.expiryDate) : "";

    const result = identityDocumentSchema.safeParse({
      document_type: saisie.documentType,
      document_number: saisie.documentNumber,
      issue_date: issueDateStr,
      expiry_date: expiryDateStr,
      nationality: saisie.nationality,
      is_primary: docEnEdition ? docEnEdition.is_primary : documents.length === 0,
    });

    const fieldErrors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
    }

    // La photo n'est pas dans le schéma : elle ne transite pas par zod, mais
    // reste obligatoire — une pièce sans image n'est pas vérifiable.
    if (!saisie.photoFile && !docEnEdition?.photo_url) {
      fieldErrors.photo = "La photo du document est requise";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return null;
    }

    setErrors({});
    return { issue: issueDateStr, expiry: expiryDateStr };
  }

  async function handleSubmit() {
    const dates = valider();
    if (!dates) return;

    setSaving(true);
    const supabase = createClient();

    if (docEnEdition) {
      let photoUrl = docEnEdition.photo_url;
      if (saisie.photoFile) {
        if (docEnEdition.photo_url) {
          await supabase.storage
            .from("identity-documents")
            .remove([docEnEdition.photo_url]);
        }
        photoUrl = await uploadPhoto();
      }

      const { error } = await supabase
        .from("client_identity_documents")
        .update({
          document_type: saisie.documentType,
          document_number: saisie.documentNumber,
          issue_date: dates.issue,
          expiry_date: dates.expiry,
          nationality: saisie.nationality,
          photo_url: photoUrl,
        })
        .eq("id", docEnEdition.id);

      setSaving(false);
      if (error) {
        toast.error("Erreur lors de la mise à jour du document");
        return;
      }
      toast.success("Document mis à jour");
    } else {
      const photoUrl = await uploadPhoto();

      const { error } = await supabase.from("client_identity_documents").insert({
        client_id: clientId,
        document_type: saisie.documentType,
        document_number: saisie.documentNumber,
        issue_date: dates.issue,
        expiry_date: dates.expiry,
        nationality: saisie.nationality,
        photo_url: photoUrl,
        is_primary: documents.length === 0,
      });

      setSaving(false);
      if (error) {
        toast.error("Erreur lors de l'ajout du document");
        return;
      }
      toast.success("Document ajouté");
    }

    fermerDialog();
    router.refresh();
  }

  async function handleDelete(docId: string, photoPath: string | null) {
    const supabase = createClient();
    if (photoPath) {
      await supabase.storage.from("identity-documents").remove([photoPath]);
    }
    const { error } = await supabase
      .from("client_identity_documents")
      .delete()
      .eq("id", docId);
    if (error) {
      toast.error("Erreur lors de la suppression du document");
      return;
    }
    toast.success("Document supprimé");
    setConfirmDeleteId(null);
    router.refresh();
  }

  async function handleSetPrimary(docId: string) {
    const supabase = createClient();
    const { error: resetError } = await supabase
      .from("client_identity_documents")
      .update({ is_primary: false })
      .eq("client_id", clientId);
    if (resetError) {
      toast.error("Erreur lors de la mise à jour du document principal");
      return;
    }
    const { error } = await supabase
      .from("client_identity_documents")
      .update({ is_primary: true })
      .eq("id", docId);
    if (error) {
      toast.error("Erreur lors de la mise à jour du document principal");
      return;
    }
    toast.success("Document principal défini");
    router.refresh();
  }

  async function handleViewPhoto(photoPath: string | null) {
    if (!photoPath) return;
    setLoadingPhoto(true);
    const url = await getSignedUrl(photoPath);
    setLoadingPhoto(false);
    if (url) setViewingPhotoUrl(url);
  }

  /**
   * Les mêmes actions alimentent le menu à trois points et le clic droit :
   * elles sont décrites une fois, et rendues avec le composant d'item attendu
   * par chaque menu.
   */
  function actionsPour(
    doc: ClientIdentityDocument,
    Item: typeof DropdownMenuItem | typeof ContextMenuItem
  ) {
    return (
      <>
        {doc.photo_url && (
          <Item onClick={() => handleViewPhoto(doc.photo_url)}>
            <Eye size={14} weight="duotone" />
            Voir la pièce
          </Item>
        )}
        {!doc.is_primary && (
          <Item onClick={() => handleSetPrimary(doc.id)}>
            <Star size={14} weight="duotone" />
            Définir comme principal
          </Item>
        )}
        <Item onClick={() => ouvrirEdition(doc)}>
          <PencilSimple size={14} weight="duotone" />
          Modifier
        </Item>
        <Item
          className="text-destructive focus:text-destructive"
          onClick={() => setConfirmDeleteId(doc.id)}
        >
          <Trash size={14} weight="duotone" />
          Supprimer
        </Item>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 && (
        <button
          type="button"
          onClick={ouvrirAjout}
          className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-input text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <IdentificationCard size={24} weight="duotone" />
          <span className="font-medium">Ajouter une pièce d&apos;identité</span>
          <span className="text-xs">CNI, passeport, titre de séjour ou permis</span>
        </button>
      )}

      {documents.map((doc) => (
        <div key={doc.id}>
          {confirmDeleteId === doc.id ? (
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-medium">Supprimer cette pièce d&apos;identité ?</p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.photo_url)}
                >
                  <Trash size={14} weight="duotone" />
                  Supprimer
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger className="block w-full">
                <div className="flex items-start justify-between rounded-lg border p-3 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <IdentificationCard size={16} weight="duotone" className="text-muted-foreground" />
                      <Badge variant="outline">
                        {documentTypeLabels[doc.document_type] ?? doc.document_type}
                      </Badge>
                      {doc.is_primary && (
                        <Badge variant="secondary" className="text-xs">Principal</Badge>
                      )}
                      {doc.expiry_date ? (
                        new Date(doc.expiry_date) >= new Date() ? (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30">Valide</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30">Expiré</Badge>
                        )
                      ) : null}
                    </div>
                    <p className="text-sm font-medium">{doc.document_number}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Émis : {formatDate(doc.issue_date)}</span>
                      <span>Expire : {formatDate(doc.expiry_date)}</span>
                    </div>
                    {doc.nationality && (
                      <p className="text-xs text-muted-foreground">
                        Nationalité : {doc.nationality}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div className="inline-flex size-6 items-center justify-center rounded-[min(var(--radius-md),10px)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <DotsThree size={16} weight="regular" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px]">
                      {actionsPour(doc, DropdownMenuItem)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>{actionsPour(doc, ContextMenuItem)}</ContextMenuContent>
            </ContextMenu>
          )}

          {/* Recto, verso, et ce que le titre de sejour exige en plus. Le QR
              code ouvre la prise de vue au telephone : le poste du comptoir n'a
              pas de camera utilisable pour photographier une carte posee. */}
          {confirmDeleteId !== doc.id && (
            <div className="mt-2 rounded-lg border border-dashed p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Photos de la pièce
              </p>
              <IdentityPhotosCard
                documentId={doc.id}
                libelle={`${documentTypeLabels[doc.document_type] ?? doc.document_type} — ${doc.document_number}`}
              />
            </div>
          )}
        </div>
      ))}

      {documents.length > 0 && (
        <Button variant="outline" size="sm" onClick={ouvrirAjout}>
          <Plus size={14} weight="bold" />
          Ajouter un document
        </Button>
      )}

      <IdentityDocumentDialog
        open={dialogOuvert}
        onOpenChange={(v) => (v ? setDialogOuvert(true) : fermerDialog())}
        document={docEnEdition}
        valeurs={saisie}
        onChange={majSaisie}
        errors={errors}
        saving={saving}
        onSubmit={handleSubmit}
      />

      {/* Visionneuse — sur Dialog, pour hériter du portail, du piège de focus et
          de la fermeture au clavier. L'overlay était auparavant fait main. */}
      <Dialog
        open={viewingPhotoUrl !== null}
        onOpenChange={(v) => !v && setViewingPhotoUrl(null)}
      >
        <DialogContent
          className="sm:max-w-3xl"
          showCloseButton={false}
        >
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>Pièce d&apos;identité</DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fermer"
              onClick={() => setViewingPhotoUrl(null)}
            >
              <X size={16} weight="regular" />
            </Button>
          </DialogHeader>
          {viewingPhotoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={viewingPhotoUrl}
              alt="Pièce d'identité"
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {loadingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-lg bg-background px-4 py-3 text-sm shadow-lg">
            Chargement...
          </div>
        </div>
      )}
    </div>
  );
}
