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

  const { error } = await supabase
    .from("parametres")
    .update(resultat.cours)
    .eq("id", 1);

  if (error) {
    return NextResponse.json(
      { error: "Les cours ont été récupérés mais n'ont pas pu être enregistrés." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    cours: resultat.cours,
    actualise_le: new Date().toISOString(),
  });
}
