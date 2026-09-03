"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { PhotosUpload } from "@/components/photos/photos-upload";

interface IdentityPhotosCardProps {
  documentId: string;
  /** Ce que le telephone affiche : « CNI de Mme Dupont ». */
  libelle: string;
  disabled?: boolean;
}

/**
 * Les cliches d'une piece d'identite.
 *
 * Une piece se photographie des deux cotes — le recto porte la photographie et
 * l'etat civil, le verso l'adresse et la bande de lecture — et un titre de
 * sejour en demande parfois davantage. La colonne `photo_url` n'en gardait
 * qu'un : elle reste, tenue par declencheur, comme vignette des ecrans qui ne
 * montrent qu'une image.
 *
 * Le bucket est prive et le jeton du telephone n'est pas authentifie : la
 * session ouverte ici ne vit que dix minutes (R-025), le temps du geste.
 */
export function IdentityPhotosCard({
  documentId,
  libelle,
  disabled,
}: IdentityPhotosCardProps) {
  const [chemins, setChemins] = useState<string[]>([]);

  useEffect(() => {
    let annule = false;
    const supabase = createClient();
    supabase
      .from("identity_document_photos")
      .select("chemin")
      .eq("document_id", documentId)
      .order("created_at")
      .order("rang")
      .then(({ data }) => {
        if (annule) return;
        setChemins((data ?? []).map((p) => p.chemin as string));
      });
    return () => {
      annule = true;
    };
  }, [documentId]);

  async function enregistrer(nouveaux: string[]) {
    const ajouts = nouveaux.filter((c) => !chemins.includes(c));
    const retraits = chemins.filter((c) => !nouveaux.includes(c));
    setChemins(nouveaux);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (ajouts.length > 0) {
      // `ignoreDuplicates` : le telephone a pu inscrire la meme photo lui-meme,
      // quelques secondes plus tot.
      await mutate(
        supabase.from("identity_document_photos").upsert(
          ajouts.map((chemin, i) => ({
            document_id: documentId,
            chemin,
            bucket: "identity-documents",
            rang: i,
            created_by: user?.id ?? null,
          })),
          { onConflict: "chemin", ignoreDuplicates: true }
        ),
        "Les photos n'ont pas pu être enregistrées"
      );
    }

    if (retraits.length > 0) {
      await mutate(
        supabase.from("identity_document_photos").delete().in("chemin", retraits),
        "La photo n'a pas pu être supprimée"
      );
    }
  }

  return (
    <PhotosUpload
      chemins={chemins}
      onChange={enregistrer}
      prefixe={documentId}
      bucket="identity-documents"
      clientIdentityDocumentId={documentId}
      libelle={libelle}
      disabled={disabled}
      max={6}
    />
  );
}
