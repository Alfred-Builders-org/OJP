import { releveCoursDuJour } from "@/lib/cours/maj-quotidienne";

/**
 * Déclenche le relevé quotidien des cours au premier chargement du tableau
 * de bord de la journée. N'affiche rien.
 *
 * À monter sous un <Suspense> : le reste du tableau de bord s'affiche sans
 * attendre la réponse de goldapi. Les jours suivants — et pour tous les
 * utilisateurs après le premier — la réservation échoue immédiatement et le
 * composant ne coûte qu'un aller-retour en base.
 */
export async function ReleveCoursQuotidien() {
  await releveCoursDuJour();
  return null;
}
