import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recupererCours } from "@/lib/cours/goldapi";
import {
  sensitiveApiLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

/**
 * Actualise les cours des métaux depuis goldapi.io.
 *
 * Réservé au propriétaire : ce sont les cours qui déterminent tous les prix
 * de rachat et de vente. Un vendeur peut les lire (migration 129), pas les
 * modifier.
 */
export async function POST(request: NextRequest) {
  // Quota goldapi oblige : limite basse (5 appels/min par IP).
  const { success } = await sensitiveApiLimiter.limit(getClientIp(request));
  if (!success) return rateLimitResponse();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "proprietaire" && profile?.role !== "super_admin") {
    return NextResponse.json(
      { error: "Seul un propriétaire peut actualiser les cours." },
      { status: 403 }
    );
  }

  const resultat = await recupererCours(process.env.GOLDAPI_KEY ?? "");

  if (!resultat.ok) {
    return NextResponse.json(
      { error: resultat.erreur },
      { status: resultat.statut }
    );
  }

  // Même point d'écriture que le relevé quotidien : la date de relevé reste
  // ainsi cohérente, qu'il soit automatique ou forcé depuis les paramètres.
  const { error } = await supabase.rpc("appliquer_cours", {
    p_or: resultat.cours.prix_or,
    p_argent: resultat.cours.prix_argent,
    p_platine: resultat.cours.prix_platine,
  });

  if (error) {
    // Le contrôle de vraisemblance (migration 136) rédige un message destiné
    // à être lu : il nomme le métal et l'écart constaté. Le masquer derrière
    // un message générique priverait le propriétaire de l'information utile.
    const estRejetVraisemblance = error.message.includes("invraisemblable");
    return NextResponse.json(
      {
        error: estRejetVraisemblance
          ? error.message
          : "Les cours ont été récupérés mais n'ont pas pu être enregistrés.",
      },
      { status: estRejetVraisemblance ? 409 : 500 }
    );
  }

  return NextResponse.json({
    cours: resultat.cours,
    actualise_le: new Date().toISOString(),
  });
}

/**
 * Enregistre des cours saisis à la main.
 *
 * La page Paramètres écrivait jusqu'ici directement dans la table `parametres`.
 * Le contrôle de vraisemblance posé par la migration 136 vit dans la fonction
 * `appliquer_cours` : en la contournant, la saisie manuelle — précisément celle
 * qui peut porter une virgule mal placée — n'était soumise à aucun garde-fou.
 * Un argent à 45 €/g passait sans un mot.
 *
 * `forcer` laisse le propriétaire enregistrer un écart réel, après que le
 * message d'erreur le lui a signalé.
 */
export async function PUT(request: NextRequest) {
  const { success } = await sensitiveApiLimiter.limit(getClientIp(request));
  if (!success) return rateLimitResponse();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "proprietaire" && profile?.role !== "super_admin") {
    return NextResponse.json(
      { error: "Seul un propriétaire peut modifier les cours." },
      { status: 403 }
    );
  }

  let body: { prix_or?: unknown; prix_argent?: unknown; prix_platine?: unknown; forcer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const or = Number(body.prix_or);
  const argent = Number(body.prix_argent);
  const platine = Number(body.prix_platine);

  if (![or, argent, platine].every((v) => Number.isFinite(v) && v > 0)) {
    return NextResponse.json(
      { error: "Les trois cours doivent être des nombres strictement positifs." },
      { status: 400 }
    );
  }

  const { error } = await supabase.rpc("appliquer_cours", {
    p_or: or,
    p_argent: argent,
    p_platine: platine,
    p_forcer: body.forcer === true,
  });

  if (error) {
    const estRejetVraisemblance = error.message.includes("invraisemblable");
    return NextResponse.json(
      {
        error: estRejetVraisemblance
          ? error.message
          : "Les cours n'ont pas pu être enregistrés.",
        // Permet à l'interface de proposer de forcer, plutôt que de laisser
        // l'utilisateur devant un refus sans issue.
        peut_forcer: estRejetVraisemblance,
      },
      { status: estRejetVraisemblance ? 409 : 500 }
    );
  }

  return NextResponse.json({ actualise_le: new Date().toISOString() });
}
