"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Photos d'une reference, du chargement jusqu'au rattachement.
 *
 * Les deux formulaires de reference — bijoux et or d'investissement — ont le
 * meme probleme : en creation, la reference n'a pas encore d'identifiant, alors
 * que les photos, elles, sont deja dans le bucket. Les cliches attendent donc
 * ici et sont rattaches une fois l'enregistrement fait.
 *
 * @param lotId       Le lot proprietaire, connu des le depart.
 * @param referenceId L'identifiant de la reference en edition, vide en creation.
 * @param onClose     Fermeture du formulaire, enveloppee pour nettoyer.
 */
export function usePhotosReference(
  lotId: string,
  referenceId: string | null | undefined,
  onClose: () => void
) {
  const [photos, setPhotos] = useState<string[]>([]);
  // Ce qui etait deja en base au chargement : la difference avec `photos` dit
  // ce qu'il faut inscrire et ce qu'il faut retirer a l'enregistrement.
  const initialesRef = useRef<string[]>([]);
  const enregistreRef = useRef(false);

  useEffect(() => {
    if (!referenceId) return;
    let annule = false;
    createClient()
      .from("lot_photos")
      .select("chemin")
      .eq("reference_id", referenceId)
      .order("created_at")
      .order("rang")
      .then(({ data }) => {
        if (annule) return;
        const chemins = (data ?? []).map((p) => p.chemin as string);
        initialesRef.current = chemins;
        setPhotos(chemins);
      });
    return () => {
      annule = true;
    };
  }, [referenceId]);

  /**
   * Rattache la galerie a la reference une fois son identifiant connu.
   *
   * `ignoreDuplicates` : en edition, le telephone a pu inscrire la meme photo
   * lui-meme quelques secondes plus tot.
   */
  async function rattacher(refId: string) {
    const dejaEnBase = initialesRef.current;
    const ajouts = photos.filter((c) => !dejaEnBase.includes(c));
    const retraits = dejaEnBase.filter((c) => !photos.includes(c));
    enregistreRef.current = true;

    const supabase = createClient();

    if (ajouts.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("lot_photos").upsert(
        ajouts.map((chemin, i) => ({
          lot_id: lotId,
          reference_id: refId,
          chemin,
          rang: i,
          created_by: user?.id ?? null,
        })),
        { onConflict: "chemin", ignoreDuplicates: true }
      );
    }

    if (retraits.length > 0) {
      await supabase.from("lot_photos").delete().in("chemin", retraits);
    }
  }

  /** Un formulaire abandonne ne laisse pas ses cliches dans le bucket. */
  function fermer() {
    if (!enregistreRef.current && !referenceId && photos.length > 0) {
      createClient().storage.from("lot-photos").remove(photos);
    }
    onClose();
  }

  return { photos, setPhotos, rattacher, fermer };
}
