import { redirect } from "next/navigation";

/**
 * Le catalogue vit desormais dans les parametres, section « Or investissement ».
 *
 * L'adresse est conservee plutot que supprimee : elle est marquee dans des
 * favoris, citee dans la documentation, et la fiche d'une piece
 * (`/or-investissement/<id>`) continue de s'ouvrir depuis le tableau.
 */
export default function OrInvestissementPage() {
  redirect("/parametres?section=or-investissement");
}
