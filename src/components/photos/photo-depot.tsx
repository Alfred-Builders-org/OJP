"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, CircleNotch, Images, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PHOTOS_MAX_PAR_SESSION } from "@/types/photo";

interface PhotoDepotProps {
  token: string;
  libelle: string | null;
  expireAt: string;
}

interface Cliche {
  fichier: File;
  apercu: string;
}

/**
 * Prise de vue au telephone.
 *
 * L'ecran est fait pour une main et pour la lumiere du comptoir : deux boutons
 * pleine largeur, des vignettes assez grandes pour verifier qu'on a bien le
 * poinçon, et un bouton d'envoi qui dit combien de photos partent.
 *
 * On accumule avant d'envoyer plutot que d'envoyer a chaque declenchement : le
 * vendeur enchaine les vues d'un meme lot, et un aller-retour reseau entre
 * chaque le ferait attendre trois fois pour rien. Les deux entrees de fichier
 * sont distinctes parce que `capture` et la selection multiple s'excluent —
 * l'une ouvre l'appareil, l'autre la pellicule.
 */
export function PhotoDepot({ token, libelle, expireAt }: PhotoDepotProps) {
  const appareilRef = useRef<HTMLInputElement>(null);
  const pellicheRef = useRef<HTMLInputElement>(null);
  const [cliches, setCliches] = useState<Cliche[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [envoyees, setEnvoyees] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [restant, setRestant] = useState<string>("");

  // Les apercus sont des URL d'objet : sans revocation, chaque prise de vue
  // laisse son image en memoire jusqu'a la fermeture de l'onglet.
  useEffect(() => {
    return () => cliches.forEach((c) => URL.revokeObjectURL(c.apercu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function tick() {
      const ms = new Date(expireAt).getTime() - Date.now();
      if (ms <= 0) {
        setRestant("expiré");
        return;
      }
      const minutes = Math.floor(ms / 60_000);
      setRestant(minutes >= 1 ? `${minutes} min` : "moins d'une minute");
    }
    const t = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [expireAt]);

  function ajouter(liste: FileList | null) {
    if (!liste?.length) return;
    setErreur(null);
    const place = PHOTOS_MAX_PAR_SESSION - envoyees - cliches.length;
    const retenus = Array.from(liste).slice(0, Math.max(0, place));
    setCliches((actuels) => [
      ...actuels,
      ...retenus.map((fichier) => ({ fichier, apercu: URL.createObjectURL(fichier) })),
    ]);
  }

  function retirer(index: number) {
    setCliches((actuels) => {
      URL.revokeObjectURL(actuels[index].apercu);
      return actuels.filter((_, i) => i !== index);
    });
  }

  async function envoyerTout() {
    if (cliches.length === 0) return;
    setEnvoi(true);
    setErreur(null);

    const formData = new FormData();
    cliches.forEach((c) => formData.append("fichiers", c.fichier));

    try {
      const reponse = await fetch(`/api/photo/${token}`, {
        method: "POST",
        body: formData,
      });
      const corps = await reponse.json();

      if (!reponse.ok) {
        setErreur(corps.error ?? "L'envoi a échoué.");
        return;
      }

      cliches.forEach((c) => URL.revokeObjectURL(c.apercu));
      setEnvoyees((n) => n + cliches.length);
      setCliches([]);
      if (appareilRef.current) appareilRef.current.value = "";
      if (pellicheRef.current) pellicheRef.current.value = "";
    } catch {
      setErreur("Connexion perdue. Vérifiez le réseau et réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  const plein = envoyees + cliches.length >= PHOTOS_MAX_PAR_SESSION;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Photos du lot</h1>
        {libelle && <p className="text-sm text-muted-foreground">{libelle}</p>}
        <p className="text-xs text-muted-foreground">
          Lien valable {restant}. Les photos arrivent directement sur la fiche.
        </p>
      </header>

      {envoyees > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle size={18} weight="duotone" />
          {envoyees} photo{envoyees > 1 ? "s" : ""} envoyée{envoyees > 1 ? "s" : ""}
        </div>
      )}

      {erreur && (
        <div className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-500 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {erreur}
        </div>
      )}

      {cliches.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {cliches.map((c, i) => (
            <div key={c.apercu} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.apercu}
                alt={`Photo ${i + 1}`}
                className="aspect-square w-full rounded-md border object-cover"
              />
              <button
                type="button"
                aria-label="Retirer cette photo"
                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
                onClick={() => retirer(i)}
                disabled={envoi}
              >
                <X size={12} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto space-y-2">
        <Button
          type="button"
          size="lg"
          className="h-14 w-full text-base"
          disabled={envoi || plein}
          onClick={() => appareilRef.current?.click()}
        >
          <Camera size={22} weight="duotone" />
          Prendre une photo
        </Button>

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 w-full"
          disabled={envoi || plein}
          onClick={() => pellicheRef.current?.click()}
        >
          <Images size={20} weight="duotone" />
          Choisir dans la galerie
        </Button>

        {cliches.length > 0 && (
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="h-14 w-full text-base"
            disabled={envoi}
            onClick={envoyerTout}
          >
            {envoi ? (
              <>
                <CircleNotch size={20} className="animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <CheckCircle size={22} weight="duotone" />
                Envoyer {cliches.length} photo{cliches.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}

        {plein && (
          <p className="text-center text-xs text-muted-foreground">
            Limite de {PHOTOS_MAX_PAR_SESSION} photos atteinte pour ce lien.
          </p>
        )}
      </div>

      <input
        ref={appareilRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => ajouter(e.target.files)}
      />
      <input
        ref={pellicheRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => ajouter(e.target.files)}
      />
    </div>
  );
}
