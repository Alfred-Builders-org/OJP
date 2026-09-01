import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

interface Composant {
  longText: string;
  shortText: string;
  types: string[];
}

function composant(composants: Composant[], type: string): string {
  return composants.find((c) => c.types.includes(type))?.longText ?? "";
}

/**
 * Détail d'une adresse choisie, éclaté en champs.
 *
 * Le formulaire conserve `address` / `postal_code` / `city` / `country` comme
 * source pour les documents : ce sont eux qui figurent sur les contrats. Les
 * champs d'origine (numéro, voie, coordonnées, identifiant du lieu) sont
 * conservés à côté, pour pouvoir retrouver la fiche sans redemander l'adresse.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
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

  const { placeId } = await params;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": cle,
          "X-Goog-FieldMask": "addressComponents,formattedAddress,location",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Adresse introuvable" }, { status: 404 });
    }

    const data = await res.json();
    const composants: Composant[] = data.addressComponents ?? [];

    const numero = composant(composants, "street_number");
    const voie = composant(composants, "route");

    return NextResponse.json({
      address: [numero, voie].filter(Boolean).join(" "),
      postal_code: composant(composants, "postal_code"),
      city:
        composant(composants, "locality") ||
        composant(composants, "postal_town"),
      country: composant(composants, "country"),
      street_number: numero || null,
      route: voie || null,
      formatted_address: data.formattedAddress ?? null,
      place_id: placeId,
      latitude: data.location?.latitude ?? null,
      longitude: data.location?.longitude ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Adresse introuvable" }, { status: 404 });
  }
}
