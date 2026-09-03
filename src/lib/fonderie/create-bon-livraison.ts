import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { generateBonLivraison } from "@/lib/pdf/pdf-actions";
import { formatDate } from "@/lib/format";
import type { BijouxStock } from "@/types/bijoux";
import type { Fonderie } from "@/types/fonderie";
import type { BonLivraisonGroupData } from "@/lib/pdf/blocks";

interface CoursMap {
  [metal: string]: number;
}

async function fetchCours(): Promise<CoursMap> {
  const supabase = createClient();
  const { data: parametres } = await supabase
    .from("parametres")
    .select("prix_or, prix_argent, prix_platine")
    .eq("id", 1)
    .single();

  return {
    Or: parametres?.prix_or ?? 0,
    Argent: parametres?.prix_argent ?? 0,
    Platine: parametres?.prix_platine ?? 0,
  };
}

/**
 * Ce qu'on envoie fondre, quelle qu'en soit la provenance.
 *
 * Un bijou de l'inventaire est une piece unique, qui passe au statut « fondu ».
 * Un produit d'investissement est un compteur : on en envoie une quantite, et
 * le catalogue diminue d'autant. Les deux se valorisent pareil — poids, titre,
 * cours — d'ou une forme commune plutot que deux chemins paralleles.
 */
export interface ArticleAFondre {
  id: string;
  source: "stock" | "or_investissement";
  designation: string;
  metal: string | null;
  titrage: string | null;
  /** Poids d'un exemplaire, en grammes. */
  poids: number | null;
  quantite: number;
}

/** Un bijou de l'inventaire, vu comme un article a fondre. */
export function articleDepuisStock(item: BijouxStock): ArticleAFondre {
  return {
    id: item.id,
    source: "stock",
    designation: item.nom,
    metal: item.metaux,
    titrage: item.qualite,
    poids: item.poids_net ?? item.poids,
    quantite: 1,
  };
}

/**
 * Un produit du catalogue, vu comme un article a fondre.
 *
 * La prime ne survit pas a la fonte : un napoleon envoye au fondeur ne vaut
 * plus que son or. La valeur estimee ici est donc volontairement celle du
 * metal, sans coefficient — c'est ce que la fonderie paiera.
 */
export function articleDepuisCatalogue(
  item: { id: string; designation: string; metal: string | null; titre: string | null; poids: number | null },
  quantite: number
): ArticleAFondre {
  return {
    id: item.id,
    source: "or_investissement",
    designation: item.designation,
    metal: item.metal,
    titrage: item.titre,
    poids: item.poids,
    quantite,
  };
}

export function buildLignesPayload(
  bdlId: string,
  articles: ArticleAFondre[],
  coursMap: CoursMap
) {
  return articles.map((article) => {
    const coursMetal = coursMap[article.metal ?? ""] ?? 0;
    const titrage = parseInt(article.titrage ?? "0") || 0;
    const coursGramme = coursMetal * (titrage / 1000);
    const poidsTotal = (article.poids ?? 0) * article.quantite;
    const valeur = poidsTotal * coursGramme;

    return {
      bon_livraison_id: bdlId,
      bijoux_stock_id: article.source === "stock" ? article.id : null,
      or_investissement_id: article.source === "or_investissement" ? article.id : null,
      quantite: article.quantite,
      designation: article.designation,
      metal: article.metal,
      titrage_declare: article.titrage,
      // Le poids declare est celui du paquet : deux napoleons pesent deux fois
      // un napoleon, et c'est ce total que la fonderie repesera.
      poids_declare: Math.round(poidsTotal * 100) / 100,
      cours_utilise: Math.round(coursGramme * 100) / 100,
      valeur_estimee: Math.round(valeur * 100) / 100,
    };
  });
}

function buildGroupes(lignesPayload: ReturnType<typeof buildLignesPayload>) {
  const groupMap = new Map<string, BonLivraisonGroupData>();
  for (const lp of lignesPayload) {
    const key = `${lp.metal ?? "Autre"}-${lp.titrage_declare ?? "?"}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        metal: lp.metal ?? "Autre",
        titrage: lp.titrage_declare ?? "?",
        lignes: [],
        sousTotal: { pieces: 0, poids: 0, valeur: 0 },
      });
    }
    const group = groupMap.get(key)!;
    group.lignes.push({
      designation: lp.designation,
      metal: lp.metal ?? "",
      titrage: lp.titrage_declare ?? "",
      poids: lp.poids_declare ?? 0,
      cours: lp.cours_utilise ?? 0,
      valeur: lp.valeur_estimee ?? 0,
    });
    group.sousTotal.pieces += lp.quantite ?? 1;
    group.sousTotal.poids += lp.poids_declare ?? 0;
    group.sousTotal.valeur += lp.valeur_estimee ?? 0;
  }
  return Array.from(groupMap.values());
}

/**
 * Create a single bon de livraison for one fonderie with the given items.
 * Handles: insert BDL, insert lignes, mark stock as fondu, generate PDF.
 */
export async function createBonLivraison(params: {
  fonderieId: string;
  items: ArticleAFondre[];
  fonderie: Fonderie;
  coursMap?: CoursMap;
}): Promise<{ bdlId: string } | { error: string }> {
  const { fonderieId, items, fonderie, coursMap: providedCours } = params;
  const supabase = createClient();
  const coursMap = providedCours ?? await fetchCours();

  // Create BDL
  const { data: bdl, error: bdlError } = await mutate(
    supabase
      .from("bons_livraison")
      .insert({ fonderie_id: fonderieId, numero: "" })
      .select()
      .single(),
    "Erreur lors de la création du bon de livraison",
    "Bon de livraison généré"
  );
  if (bdlError || !bdl) return { error: bdlError ?? "Erreur inconnue" };

  // Insert lignes
  const lignesPayload = buildLignesPayload(bdl.id, items, coursMap);
  const { error: lignesError } = await mutate(
    supabase.from("bon_livraison_lignes").insert(lignesPayload),
    "Erreur lors de la création des lignes du bon de livraison",
    "Lignes créées"
  );
  if (lignesError) return { error: lignesError };

  // Un bijou de l'inventaire est unique : il passe au statut « fondu ».
  const idsStock = items.filter((i) => i.source === "stock").map((i) => i.id);
  if (idsStock.length > 0) {
    const { error: stockError } = await mutate(
      supabase.from("bijoux_stock").update({ statut: "fondu" }).in("id", idsStock),
      "Erreur lors de la mise à jour du statut des articles",
      "Statut des articles mis à jour"
    );
    if (stockError) return { error: stockError };
  }

  // Un produit du catalogue est un compteur : il diminue de ce qu'on envoie.
  // La decrementation passe par la base, sous verrou de ligne — deux envois
  // simultanes lus puis ecrits depuis le navigateur passeraient tous les deux
  // sous zero, ce que R-021 interdit.
  for (const article of items.filter((i) => i.source === "or_investissement")) {
    const { error: sortieError } = await mutate(
      supabase.rpc("sortir_or_investissement", {
        p_or_investissement_id: article.id,
        p_quantite: article.quantite,
      }),
      `Stock insuffisant pour ${article.designation}`,
      "Catalogue mis à jour"
    );
    if (sortieError) return { error: sortieError };
  }

  // Generate PDF
  const groupes = buildGroupes(lignesPayload);
  const poidsTotal = lignesPayload.reduce((s, l) => s + (l.poids_declare ?? 0), 0);
  const valeurEstimee = lignesPayload.reduce((s, l) => s + (l.valeur_estimee ?? 0), 0);

  await generateBonLivraison(bdl.id, {
    date: formatDate(new Date().toISOString()),
    fonderie: {
      nom: fonderie.nom,
      adresse: fonderie.adresse ?? undefined,
      codePostal: fonderie.code_postal ?? undefined,
      ville: fonderie.ville ?? undefined,
      telephone: fonderie.telephone ?? undefined,
      email: fonderie.email ?? undefined,
    },
    groupes,
    poidsTotal,
    valeurEstimee,
  });

  return { bdlId: bdl.id };
}

/**
 * Create multiple BDLs from fonderie-grouped assignments.
 * Used by bons-livraison-list (assign fonderie per item → generate BDLs).
 */
export async function createBonsLivraison(params: {
  groups: Map<string, ArticleAFondre[]>;
  fonderies: Fonderie[];
}): Promise<{ success: boolean; error?: string }> {
  const { groups, fonderies } = params;
  const coursMap = await fetchCours();

  for (const [fonderieId, items] of groups) {
    const fonderie = fonderies.find((f) => f.id === fonderieId);
    if (!fonderie) continue;
    const result = await createBonLivraison({ fonderieId, items, fonderie, coursMap });
    if ("error" in result) return { success: false, error: result.error };
  }

  return { success: true };
}
