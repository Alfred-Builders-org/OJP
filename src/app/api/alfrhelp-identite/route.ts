import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

/**
 * Identité signée pour le widget de support Alfrhelp.
 *
 * Signer prouve qui écrit. Sans signature l'identité reste « déclarée » : le
 * support l'affiche mais ne la rapproche d'aucune fiche de contact — sinon
 * taper l'adresse du dirigeant dans une console suffirait à lire son
 * historique.
 *
 * La clé privée ne sort jamais du serveur : elle vit dans `ALFRHELP_KEY`, et
 * cette route est le seul endroit qui la lit.
 */

// `iat` est refusé au-delà de 5 minutes d'écart avec l'heure d'Alfrhelp : on
// signe à la demande, et rien de tout ceci ne se met en cache.
export const dynamic = "force-dynamic";

type Identite = {
  email?: string;
  name?: string;
  externalId?: string;
  iat: number;
  traits?: Record<string, string>;
};

/**
 * Construit la chaîne à signer. `JSON.stringify` ne convient pas : son ordre de
 * clés et son échappement varient d'un langage à l'autre, alors que la
 * signature doit être reproductible à l'octet près.
 *
 * Une ligne `clé=valeur` par champ présent, les traits préfixés `traits.`, le
 * tout trié par ordre alphabétique et joint par des sauts de ligne.
 */
function chaineCanonique(identite: Identite): string {
  const { traits, ...champs } = identite;

  const lignes = [
    ...Object.entries(champs),
    ...Object.entries(traits ?? {}).map(
      ([cle, valeur]) => [`traits.${cle}`, valeur] as const
    ),
  ]
    .filter(([, valeur]) => valeur !== undefined && valeur !== null && valeur !== "")
    .map(([cle, valeur]) => `${cle}=${valeur}`)
    .sort();

  return lignes.join("\n");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Personne de connecté : le support reste joignable, simplement anonyme.
  if (!user) {
    return NextResponse.json({}, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .single();

  const nom = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const role = (profile?.role ?? "vendeur") as UserRole;

  const identite: Identite = {
    email: user.email,
    name: nom || undefined,
    externalId: user.id,
    iat: Date.now(),
    traits: { role },
  };

  const secret = process.env.ALFRHELP_KEY;

  // Sans clé, on rend l'identité non signée plutôt que rien : le canal de
  // support ne doit pas dépendre d'une variable d'environnement absente.
  if (!secret) {
    return NextResponse.json(identite, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const signature = createHmac("sha256", secret)
    .update(chaineCanonique(identite))
    .digest("hex");

  return NextResponse.json(
    { ...identite, signature },
    { headers: { "Cache-Control": "no-store" } }
  );
}
