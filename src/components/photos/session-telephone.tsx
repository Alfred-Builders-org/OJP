"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle, CircleNotch, Copy, DeviceMobile } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SESSION_DUREE_MINUTES } from "@/types/photo";

interface SessionTelephoneProps {
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
  prefixe: string;
  bucket: string;
  lotId?: string | null;
  referenceId?: string | null;
  libelle?: string;
  /** Appele a chaque arrivee, avec les seuls chemins nouveaux. */
  onPhotos: (chemins: string[]) => void;
}

/** Intervalle d'interrogation de la session, en millisecondes. */
const CADENCE_MS = 2500;

/**
 * Session de prise de vue au telephone.
 *
 * Le poste ouvre une session, affiche son QR code, et attend. Le telephone
 * scanne, photographie, envoie ; les photos remontent ici et rejoignent la
 * galerie sans que personne n'actualise quoi que ce soit.
 *
 * L'attente se fait par interrogation reguliere plutot que par Realtime : c'est
 * une poignee de requetes sur les trente minutes de vie d'un jeton, contre un
 * abonnement WebSocket a etablir, a authentifier et a defaire — pour un ecran
 * qu'on garde ouvert deux minutes.
 */
export function SessionTelephone({
  ouvert,
  onOuvertChange,
  prefixe,
  bucket,
  lotId,
  referenceId,
  libelle,
  onPhotos,
}: SessionTelephoneProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [lien, setLien] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recues, setRecues] = useState(0);

  const sessionRef = useRef<string | null>(null);
  const vusRef = useRef<Set<string>>(new Set());
  // `onPhotos` est recree a chaque rendu du parent : le garder dans une ref
  // evite de relancer l'interrogation en boucle.
  const onPhotosRef = useRef(onPhotos);
  useEffect(() => {
    onPhotosRef.current = onPhotos;
  }, [onPhotos]);

  const ouvrirSession = useCallback(async () => {
    setErreur(null);
    setQr(null);
    setRecues(0);
    vusRef.current = new Set();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErreur("Session expirée. Rechargez la page.");
      return;
    }

    // 256 bits tires par le generateur cryptographique du navigateur : le jeton
    // tient lieu d'autorisation, il ne doit pas etre devinable.
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

    const { data, error } = await supabase
      .from("photo_sessions")
      .insert({
        token,
        prefixe,
        bucket,
        lot_id: lotId ?? null,
        reference_id: referenceId ?? null,
        libelle: libelle ?? null,
        created_by: user.id,
      })
      .select("id, token")
      .single();

    if (error || !data) {
      setErreur("Le lien de prise de vue n'a pas pu être créé.");
      return;
    }

    sessionRef.current = data.id;

    // L'origine du navigateur est la seule adresse dont on soit sur qu'elle
    // corresponde a ce que l'utilisateur a sous les yeux.
    const origine = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = `${origine}/photo/${data.token}`;
    setLien(url);

    const image = await QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    setQr(image);
  }, [prefixe, bucket, lotId, referenceId, libelle]);

  useEffect(() => {
    if (!ouvert) {
      sessionRef.current = null;
      return;
    }
    // Differe d'un tour : la remise a zero de l'etat est synchrone, et la
    // declencher pendant l'effet relancerait un rendu en cascade.
    const t = setTimeout(() => ouvrirSession(), 0);
    return () => clearTimeout(t);
  }, [ouvert, ouvrirSession]);

  // Interrogation de la session tant que le dialogue est ouvert.
  useEffect(() => {
    if (!ouvert) return;

    const supabase = createClient();
    let actif = true;

    async function relever() {
      const sessionId = sessionRef.current;
      if (!sessionId || !actif) return;

      const { data } = await supabase
        .from("photo_session_fichiers")
        .select("chemin")
        .eq("session_id", sessionId)
        .order("created_at");

      if (!data || !actif) return;

      const nouveaux = data
        .map((f) => f.chemin as string)
        .filter((c) => !vusRef.current.has(c));

      if (nouveaux.length > 0) {
        nouveaux.forEach((c) => vusRef.current.add(c));
        setRecues(vusRef.current.size);
        onPhotosRef.current(nouveaux);
        toast.success(
          `${nouveaux.length} photo${nouveaux.length > 1 ? "s" : ""} reçue${nouveaux.length > 1 ? "s" : ""} du téléphone`
        );
      }
    }

    const id = setInterval(relever, CADENCE_MS);
    return () => {
      actif = false;
      clearInterval(id);
    };
  }, [ouvert]);

  function copier() {
    if (!lien) return;
    navigator.clipboard.writeText(lien);
    toast.success("Lien copié");
  }

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DeviceMobile size={20} weight="duotone" />
            Prendre avec mon téléphone
          </DialogTitle>
          <DialogDescription>
            Scannez ce code avec l&apos;appareil photo de votre téléphone. Les photos
            arrivent ici automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          {erreur ? (
            <p className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-500 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {erreur}
            </p>
          ) : qr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="QR code de prise de vue"
                className="h-56 w-56 rounded-lg border bg-white p-2"
              />
              <p className="text-center text-xs text-muted-foreground">
                Lien valable {SESSION_DUREE_MINUTES} minutes. Aucune connexion
                n&apos;est demandée sur le téléphone.
              </p>
            </>
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-lg border">
              <CircleNotch size={28} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {recues > 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
              <CheckCircle size={16} weight="duotone" />
              {recues} photo{recues > 1 ? "s" : ""} reçue{recues > 1 ? "s" : ""}
            </div>
          ) : (
            qr && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleNotch size={14} className="animate-spin" />
                En attente des photos...
              </div>
            )
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={copier} disabled={!lien}>
            <Copy size={16} weight="duotone" />
            Copier le lien
          </Button>
          <Button type="button" variant="outline" onClick={() => onOuvertChange(false)}>
            {recues > 0 ? "Terminé" : "Fermer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
