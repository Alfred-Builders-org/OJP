"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAndStoreFactureReparation } from "@/lib/pdf/generate-and-store";
import { formatDate, formatTime } from "@/lib/format";
import type { ClientInfo } from "@/lib/pdf/blocks";

/**
 * Émet la facture d'une réparation.
 *
 * Prend le propriétaire et l'objet de la réparation, produit le PDF (TVA 20 %,
 * prestation), le range dans les documents et le rattache à la réparation. Une
 * réparation sans propriétaire ne peut pas être facturée : on ne saurait pas à
 * qui l'adresser.
 */
export async function emettreFactureReparation(
  reparationId: string,
): Promise<{ numero: string } | { error: string }> {
  const supabase = await createClient();

  const { data: rep, error } = await supabase
    .from("reparations")
    .select(
      "id, designation, description, prix_facture, client:clients(civility, first_name, last_name, address, postal_code, city, phone, email), bijou:bijoux_stock(nom)",
    )
    .eq("id", reparationId)
    .single();

  if (error || !rep) return { error: "Réparation introuvable." };
  if (!rep.client) return { error: "Cette réparation n'a pas de propriétaire à facturer." };
  if (!rep.prix_facture || rep.prix_facture <= 0) {
    return { error: "Renseignez un prix client avant de facturer." };
  }

  // `client` et `bijou` sont des relations to-one, mais le client Supabase les
  // type en tableau : on prend le premier élément.
  const client = Array.isArray(rep.client) ? rep.client[0] : rep.client;
  const bijou = Array.isArray(rep.bijou) ? rep.bijou[0] : rep.bijou;

  const clientInfo: ClientInfo = {
    civilite: client.civility === "M" ? "M." : "Mme",
    nom: client.last_name,
    prenom: client.first_name,
    adresse: client.address ?? undefined,
    codePostal: client.postal_code ?? undefined,
    ville: client.city ?? undefined,
    telephone: client.phone ?? undefined,
    email: client.email ?? undefined,
  };

  const now = new Date();
  const resultat = await generateAndStoreFactureReparation(reparationId, {
    client: clientInfo,
    dossier: {
      numeroDossier: "—",
      numeroLot: "—",
      date: formatDate(now.toISOString()),
      heure: formatTime(now),
    },
    designation: rep.designation ?? bijou?.nom ?? "Réparation",
    travail: rep.description ?? undefined,
    prixTTC: rep.prix_facture,
  });

  if ("error" in resultat) return { error: resultat.error };
  return { numero: resultat.numero };
}
