"use client";

import { useEffect, useState } from "react";
import { Camera } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotosUpload } from "@/components/photos/photos-upload";

interface LotPhotosCardProps {
  lotId: string;
  numero: string;
  /** Un lot finalise ne se rephotographie pas : la galerie devient une archive. */
  disabled?: boolean;
}

/**
 * Galerie du lot.
 *
 * Exigee sur un rachat comme sur un depot-vente : c'est la preuve de ce que le
 * client a remis, et le seul recours si la composition du lot venait a etre
 * contestee. La finalisation la reclame.
 *
 * La carte lit ses propres photos plutot que de les recevoir de la page : elle
 * est la seule a en avoir besoin, et le telephone peut en ajouter pendant
 * qu'on est sur l'ecran.
 */
export function LotPhotosCard({ lotId, numero, disabled }: LotPhotosCardProps) {
  const [chemins, setChemins] = useState<string[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    let annule = false;
    const supabase = createClient();
    supabase
      .from("lot_photos")
      .select("chemin")
      .eq("lot_id", lotId)
      .is("reference_id", null)
      .order("created_at")
      .order("rang")
      .then(({ data }) => {
        if (annule) return;
        setChemins((data ?? []).map((p) => p.chemin as string));
        setCharge(true);
      });
    return () => {
      annule = true;
    };
  }, [lotId]);

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
        supabase.from("lot_photos").upsert(
          ajouts.map((chemin, i) => ({
            lot_id: lotId,
            reference_id: null,
            chemin,
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
        supabase.from("lot_photos").delete().in("chemin", retraits),
        "La photo n'a pas pu être supprimée"
      );
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <Camera size={20} weight="duotone" />
          Photos du lot
          {charge && chemins.length === 0 && !disabled && (
            <Badge
              variant="outline"
              className="border-red-300 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
            >
              Requise
            </Badge>
          )}
          {chemins.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {chemins.length}
            </Badge>
          )}
        </CardTitle>
        <span className="shrink-0 text-xs text-muted-foreground">
          preuve de la marchandise
        </span>
      </CardHeader>
      <CardContent>
        <PhotosUpload
          chemins={chemins}
          onChange={enregistrer}
          prefixe={lotId}
          lotId={lotId}
          libelle={`Lot ${numero}`}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
