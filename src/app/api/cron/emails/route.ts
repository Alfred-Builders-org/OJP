import { NextResponse, type NextRequest } from "next/server";
import { executerBalayage } from "@/lib/email/rappels";

/**
 * L'heure qui sonne.
 *
 * `pg_cron` appelle cette route toutes les heures, depuis la base, par `pg_net`.
 * L'ordonnanceur vit donc dans Postgres — c'est lui qui sait compter le temps —
 * mais tout ce qui se decide et tout ce qui s'ecrit reste dans l'application.
 *
 * L'alternative aurait ete de faire partir les courriels depuis le SQL, comme
 * le faisaient les anciennes fonctions `notify_*`. Elle imposait de tenir le
 * texte des messages en deux endroits, et c'est toujours celui qu'on ne relit
 * pas qui part au client.
 *
 * L'appelant n'est pas un utilisateur : aucune session ne peut l'authentifier.
 * C'est un secret partage qui fait foi, et sans secret configure la route
 * refuse tout — un balayage muet vaut mieux qu'une porte ouverte sur l'envoi de
 * courriels au nom de la boutique.
 */
export async function POST(request: NextRequest) {
  const attendu = process.env.CRON_SECRET;

  if (!attendu) {
    console.error("[cron] CRON_SECRET absent : balayage refusé");
    return NextResponse.json({ error: "Balayage non configuré" }, { status: 503 });
  }

  const entete = request.headers.get("authorization") ?? "";
  const fourni = entete.startsWith("Bearer ")
    ? entete.slice(7)
    : request.headers.get("x-cron-secret") ?? "";

  if (fourni !== attendu) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const rapport = await executerBalayage();
    console.log("[cron] balayage terminé :", rapport);
    return NextResponse.json(rapport);
  } catch (err) {
    const motif = err instanceof Error ? err.message : "Erreur inattendue";
    console.error("[cron] balayage en échec :", motif);
    return NextResponse.json({ error: motif }, { status: 500 });
  }
}
