"use server";

import { createClient } from "@/lib/supabase/server";
import { envoyerRecapCloture } from "@/lib/email/recap-cloture";

/**
 * Le pont entre le comptoir et l'envoi du recapitulatif.
 *
 * Un dossier se cloture par deux chemins. Le premier, `finaliserDossierAction`,
 * tourne deja sur le serveur et appelle l'envoi directement. Le second passe par
 * les actions de lot, executees dans le navigateur : la derniere reference
 * validee cloture son lot, le dernier lot cloture son dossier, et personne
 * cote serveur n'en sait rien.
 *
 * Ce chemin-la ne peut pas ecrire au client lui-meme — la cle de service qui
 * lit les dossiers et descend les pieces jointes n'a rien a faire dans un
 * navigateur. Il demande donc au serveur de le faire.
 *
 * La verification d'identite n'est pas decorative : sans elle, cette action
 * accepterait n'importe quel identifiant de dossier venu de n'importe ou, et
 * ferait partir un courriel au nom de la boutique.
 */
export async function notifierClotureDossier(dossierId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await envoyerRecapCloture(dossierId);
}
