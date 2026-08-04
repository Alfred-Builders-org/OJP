import "server-only";
import { createClient } from "@/lib/supabase/server";
import { recupererCours } from "@/lib/cours/goldapi";

/**
 * Relève les cours une fois par jour.
 *
 * Règle métier : le cours du jour est figé au premier relevé et sert à tous
 * les lots créés dans la journée. Deux clients expertisés le matin et
 * l'après-midi sont ainsi traités au même cours.
 *
 * La réservation est atomique côté base (`reserver_maj_cours`) : si plusieurs
 * personnes ouvrent l'application en même temps, une seule déclenche l'appel.
 *
 * Cette fonction ne lève jamais : un cours indisponible ne doit pas empêcher
 * l'ouverture de l'application. On conserve alors les cours de la veille, et
 * le propriétaire garde le bouton « Actualiser au cours du marché ».
 */
export async function releveCoursDuJour(): Promise<void> {
  try {
    const supabase = await createClient();

    // Le jeton est à usage unique : il autorise cette écriture-ci, y compris
    // pour un vendeur qui n'a pas le droit d'écrire dans parametres.
    const { data: jeton, error } = await supabase.rpc("reserver_maj_cours");
    if (error || !jeton) return;

    const resultat = await recupererCours(process.env.GOLDAPI_KEY ?? "");
    if (!resultat.ok) {
      console.error("Relevé quotidien des cours échoué :", resultat.erreur);
      return;
    }

    const { error: erreurEcriture } = await supabase.rpc("appliquer_cours", {
      p_or: resultat.cours.prix_or,
      p_argent: resultat.cours.prix_argent,
      p_platine: resultat.cours.prix_platine,
      p_jeton: jeton,
    });

    if (erreurEcriture) {
      console.error("Enregistrement des cours échoué :", erreurEcriture.message);
    }
  } catch (err) {
    console.error("Relevé quotidien des cours interrompu :", err);
  }
}
