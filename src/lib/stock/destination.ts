import type { ReferenceDestination } from "@/types/lot";

/**
 * Ou part la marchandise, et sous quel statut elle entre en stock.
 *
 * La destination choisie sur la fiche du lot n'etait lue par aucune logique
 * metier : tout bijou rachete entrait en « a_fondre », statut que la page Stock
 * excluait de ses requetes. Les articles disparaissaient donc entre le rachat et
 * l'inventaire, quel que soit le choix de l'utilisateur.
 *
 * Une destination absente vaut « stock boutique » : a l'expiration du delai, la
 * marchandise rejoint l'inventaire plutot que de rester introuvable.
 *
 * Fonction pure, dans son propre module : elle est appelee aussi bien depuis les
 * actions serveur que depuis le dialogue de reglement, cote client.
 */
export function statutsPourDestination(
  destination: ReferenceDestination | null | undefined,
  isDepotVente: boolean
): { stock: string; reference: string } {
  if (isDepotVente) {
    return { stock: "en_depot_vente", reference: "en_depot_vente" };
  }
  if (destination === "fonderie") {
    return { stock: "a_fondre", reference: "route_fonderie" };
  }
  return { stock: "en_stock", reference: "route_stock" };
}
