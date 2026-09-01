import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Suggestions d'adresses (Google Places Autocomplete, API « New »).
 *
 * La clé reste côté serveur : exposée dans le navigateur, elle serait
 * consommable par n'importe qui et facturée à la boutique.
 *
 * Sans clé configurée, la route répond 503 et l'interface bascule d'elle-même en
 * saisie manuelle — l'écran de création de client ne doit jamais dépendre d'un
 * service tiers pour rester utilisable.
 */
export async function GET(request: NextRequest) {
  const { success } = await apiLimiter.limit(getClientIp(request));
  if (!success) return rateLimitResponse();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const cle = process.env.GOOGLE_PLACES_API_KEY;
  if (!cle) {
    return NextResponse.json(
      { error: "Recherche d'adresse non configurée" },
      { status: 503 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": cle,
      },
      body: JSON.stringify({
        input: q,
        languageCode: "fr",
        // La boutique reçoit une clientèle très majoritairement française et
        // frontalière ; restreindre limite le bruit et le coût par requête.
        includedRegionCodes: ["fr", "be", "ch", "lu", "mc"],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await res.json();
    const suggestions = (data.suggestions ?? [])
      .filter((s: { placePrediction?: unknown }) => s.placePrediction)
      .map((s: { placePrediction: { placeId: string; text: { text: string } } }) => ({
        place_id: s.placePrediction.placeId,
        description: s.placePrediction.text.text,
      }));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
