import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { construireCsv, nombreFr, type ColonneExport } from "@/lib/export-csv";
import { formatDate } from "@/lib/format";
import type { RegistreObjet } from "@/types/registre";

/**
 * Export intégral du registre des objets mobiliers.
 *
 * L'export passe par le serveur et non par les lignes affichées : un registre se
 * présente en entier à un contrôle, et n'exporter que la page consultée en
 * livrerait une version tronquée sans que rien ne le signale.
 *
 * L'ordre est celui des numéros d'ordre, comme un registre papier.
 */
const COLONNES: ColonneExport<RegistreObjet>[] = [
  { entete: "N° d'ordre", valeur: (r) => r.numero_ordre },
  { entete: "Date d'entrée", valeur: (r) => formatDate(r.date_entree) },
  { entete: "Qualité", valeur: (r) => r.cedant_qualite },
  { entete: "Nom", valeur: (r) => r.cedant_nom },
  { entete: "Prénoms", valeur: (r) => r.cedant_prenoms },
  { entete: "Domicile", valeur: (r) => r.cedant_domicile },
  { entete: "Nature de la pièce", valeur: (r) => r.piece_nature },
  { entete: "N° de la pièce", valeur: (r) => r.piece_numero },
  { entete: "Autorité de délivrance", valeur: (r) => r.piece_autorite },
  {
    entete: "Date de délivrance",
    valeur: (r) => (r.piece_date_delivrance ? formatDate(r.piece_date_delivrance) : ""),
  },
  { entete: "Nature de l'objet", valeur: (r) => r.objet_nature },
  { entete: "Description", valeur: (r) => r.objet_description },
  { entete: "Provenance", valeur: (r) => r.objet_provenance },
  { entete: "Métal", valeur: (r) => r.objet_metal },
  { entete: "Titrage", valeur: (r) => r.objet_titrage },
  { entete: "Poids (g)", valeur: (r) => nombreFr(r.objet_poids) },
  { entete: "Quantité", valeur: (r) => r.objet_quantite },
  { entete: "Prix (€)", valeur: (r) => nombreFr(r.prix) },
  { entete: "Référence", valeur: (r) => r.reference },
];

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

  // Pagination interne : la limite par requête de PostgREST plafonnerait
  // silencieusement un registre de plusieurs milliers de lignes.
  const lignes: RegistreObjet[] = [];
  const taille = 1000;
  for (let debut = 0; ; debut += taille) {
    const { data, error } = await supabase
      .from("registre_objets")
      .select("*")
      .order("numero_ordre", { ascending: true })
      .range(debut, debut + taille - 1);

    if (error) {
      return NextResponse.json(
        { error: "Le registre n'a pas pu être exporté." },
        { status: 500 }
      );
    }
    if (!data || data.length === 0) break;
    lignes.push(...(data as RegistreObjet[]));
    if (data.length < taille) break;
  }

  const csv = construireCsv(lignes, COLONNES);
  const nom = `registre-objets-mobiliers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nom}"`,
    },
  });
}
