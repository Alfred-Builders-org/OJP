"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CircleNotch,
  DeviceMobile,
  MagnifyingGlassPlus,
  Plus,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PHOTOS_MAX_PAR_SESSION } from "@/types/photo";
import { SessionTelephone } from "@/components/photos/session-telephone";

interface PhotosUploadProps {
  /** Chemins dans le bucket, dans l'ordre d'affichage. */
  chemins: string[];
  /** Appele a chaque ajout comme a chaque retrait, avec la liste complete. */
  onChange: (chemins: string[]) => void;
  /** Dossier de rangement dans le bucket, generalement l'identifiant du lot. */
  prefixe: string;
  bucket?: string;
  /**
   * Cible de la session telephone. Renseignee, le telephone inscrit lui-meme
   * les photos a la galerie — l'onglet du poste peut etre ferme entre-temps.
   */
  lotId?: string | null;
  referenceId?: string | null;
  /** Affiche sur le telephone, pour savoir ce qu'on photographie. */
  libelle?: string;
  disabled?: boolean;
  max?: number;
}

/**
 * Galerie de photos.
 *
 * Trois voies d'entree, parce que le comptoir n'a pas de camera : le glisser-
 * deposer et le selecteur de fichiers pour ce qui est deja sur le poste, et le
 * QR code pour ce qui ne l'est pas encore — c'est-a-dire le cas courant, un
 * bijou pose devant soi et un telephone dans la main.
 *
 * Le bucket est prive : chaque vignette passe par une URL signee, demandee en
 * un seul appel pour toute la galerie et renouvelee quand la liste change.
 */
export function PhotosUpload({
  chemins,
  onChange,
  prefixe,
  bucket = "lot-photos",
  lotId,
  referenceId,
  libelle,
  disabled,
  max = PHOTOS_MAX_PAR_SESSION,
}: PhotosUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apercus, setApercus] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [glisse, setGlisse] = useState(false);
  const [qrOuvert, setQrOuvert] = useState(false);
  const [agrandie, setAgrandie] = useState<string | null>(null);

  const cle = chemins.join("|");

  useEffect(() => {
    if (chemins.length === 0) {
      setApercus({});
      return;
    }
    let annule = false;
    const supabase = createClient();
    supabase.storage
      .from(bucket)
      .createSignedUrls(chemins, 3600)
      .then(({ data }) => {
        if (annule || !data) return;
        const carte: Record<string, string> = {};
        data.forEach((entree, i) => {
          if (entree.signedUrl) carte[chemins[i]] = entree.signedUrl;
        });
        setApercus(carte);
      });
    return () => {
      annule = true;
    };
    // `cle` resume la liste : un tableau recree a chaque rendu relancerait
    // l'appel en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, bucket]);

  const ajouterChemins = useCallback(
    (nouveaux: string[]) => {
      if (nouveaux.length === 0) return;
      onChange([...chemins, ...nouveaux.filter((c) => !chemins.includes(c))]);
    },
    [chemins, onChange]
  );

  async function envoyer(liste: FileList | File[] | null) {
    if (!liste) return;
    const fichiers = Array.from(liste).filter((f) => f.type.startsWith("image/"));
    if (fichiers.length === 0) return;

    const place = max - chemins.length;
    if (place <= 0) {
      toast.error(`Limite de ${max} photos atteinte`);
      return;
    }

    setEnvoi(true);
    const supabase = createClient();
    const deposes: string[] = [];

    for (const fichier of fichiers.slice(0, place)) {
      const extension = (fichier.name.split(".").pop() ?? "jpg").toLowerCase();
      const chemin = `${prefixe}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(bucket).upload(chemin, fichier);
      if (error) {
        toast.error(`« ${fichier.name} » n'a pas pu être enregistrée`);
        continue;
      }
      deposes.push(chemin);
    }

    setEnvoi(false);
    ajouterChemins(deposes);
  }

  async function retirer(chemin: string) {
    const supabase = createClient();
    await supabase.storage.from(bucket).remove([chemin]);
    onChange(chemins.filter((c) => c !== chemin));
  }

  const plein = chemins.length >= max;

  return (
    <div className="space-y-3">
      {chemins.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {chemins.map((chemin, i) => (
            <div key={chemin} className="group relative">
              {apercus[chemin] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={apercus[chemin]}
                    alt={`Photo ${i + 1}`}
                    className="aspect-square w-full rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Agrandir la photo"
                    className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100"
                    onClick={() => setAgrandie(apercus[chemin])}
                  >
                    <MagnifyingGlassPlus size={22} weight="duotone" className="text-white" />
                  </button>
                </>
              ) : (
                <div className="aspect-square w-full animate-pulse rounded-md border bg-muted" />
              )}

              {!disabled && (
                <button
                  type="button"
                  aria-label="Supprimer cette photo"
                  className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
                  onClick={() => retirer(chemin)}
                >
                  <X size={12} className="text-destructive" />
                </button>
              )}
            </div>
          ))}

          {!disabled && !plein && (
            <button
              type="button"
              disabled={envoi}
              aria-label="Ajouter des photos"
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-input text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
              onClick={() => inputRef.current?.click()}
            >
              {envoi ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : (
                <Plus size={20} weight="bold" />
              )}
            </button>
          )}
        </div>
      )}

      {chemins.length === 0 && (
        <button
          type="button"
          disabled={disabled || envoi}
          className={cn(
            "flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-sm transition-colors disabled:opacity-50",
            glisse
              ? "border-primary bg-primary/5 text-foreground"
              : "border-input text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setGlisse(true);
          }}
          onDragLeave={() => setGlisse(false)}
          onDrop={(e) => {
            e.preventDefault();
            setGlisse(false);
            envoyer(e.dataTransfer.files);
          }}
        >
          {envoi ? (
            <>
              <CircleNotch size={22} className="animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Camera size={22} weight="duotone" />
              <span>{glisse ? "Déposer les images" : "Glisser des photos ou parcourir"}</span>
            </>
          )}
        </button>
      )}

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={plein}
          onClick={() => setQrOuvert(true)}
        >
          <DeviceMobile size={16} weight="duotone" />
          Prendre avec mon téléphone
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          envoyer(e.target.files);
          e.target.value = "";
        }}
      />

      <SessionTelephone
        ouvert={qrOuvert}
        onOuvertChange={setQrOuvert}
        prefixe={prefixe}
        bucket={bucket}
        lotId={lotId}
        referenceId={referenceId}
        libelle={libelle}
        onPhotos={ajouterChemins}
      />

      <Dialog open={agrandie !== null} onOpenChange={(o) => !o && setAgrandie(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
            <DialogDescription className="sr-only">
              Agrandissement de la photo sélectionnée
            </DialogDescription>
          </DialogHeader>
          {agrandie && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={agrandie}
              alt="Photo agrandie"
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
