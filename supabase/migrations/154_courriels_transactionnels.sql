-- ============================================================
-- Migration 153 : les courriels reviennent dans le code
--
-- Onze modeles vivaient en base, modifiables depuis un ecran de reglages, avec
-- des variables `{{client_nom}}` remplacees a l'envoi. Un dossier ordinaire en
-- declenchait quatre ou cinq le meme apres-midi — devis, contrat, facture
-- d'acompte, facture de solde — et rien ne signalait qu'un gabarit modifie
-- partait avec une accolade orpheline ou un montant absent.
--
-- Il en reste quatre, ecrits dans `src/lib/email/gabarits.ts`, sous revue comme
-- le reste du code :
--   1. la cloture d'un dossier, avec son recapitulatif et ses pieces jointes ;
--   2. un devis qui expire dans vingt-quatre heures ;
--   3. une commande dont le dernier article vient d'arriver ;
--   4. le solde a regler, rappele a la moitie du delai accorde.
--
-- Les trois derniers ne repondent a aucun clic. C'est `pg_cron` qui les
-- reveille, en appelant l'application : l'ordonnanceur vit dans la base, la
-- regle et le texte restent en TypeScript. Les anciennes fonctions faisaient
-- l'inverse — elles fabriquaient le HTML en SQL et appelaient Resend
-- directement — ce qui imposait de tenir chaque message en deux endroits.
--
-- `email_logs` reste intacte : c'est la qu'on regarde quand quelqu'un dit
-- n'avoir rien reçu, et c'est elle qui empeche un rappel de partir deux fois.
-- ============================================================

-- ============================================================
-- 1. Les anciens automatismes s'arretent
-- ============================================================

-- Ces trois taches n'ont jamais tourne : `pg_cron` n'etait pas installe et les
-- `cron.schedule` correspondants sont restes en commentaire dans les migrations
-- 034 et 057. On les deprogramme malgre tout, au cas ou l'une aurait ete posee
-- a la main depuis l'editeur SQL.
DO $$
DECLARE
  tache TEXT;
BEGIN
  FOREACH tache IN ARRAY ARRAY[
    'notify-lots-finalisables',
    'notify-acomptes-expires',
    'notify-depot-vente-invendus'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = tache) THEN
      PERFORM cron.unschedule(tache);
    END IF;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.notify_lots_finalisables();
DROP FUNCTION IF EXISTS public.notify_acomptes_expires();
DROP FUNCTION IF EXISTS public.notify_depot_vente_invendus();

-- ============================================================
-- 2. Les modeles editables disparaissent
-- ============================================================

-- Le trigger `email_templates_updated_at` part avec la table : le supprimer
-- d'abord aurait echoue si la table n'existait plus, `IF EXISTS` ne portant
-- alors que sur le trigger, jamais sur la relation qui le porte.
DROP TABLE IF EXISTS public.email_templates CASCADE;

-- ============================================================
-- 3. L'heure qui sonne
-- ============================================================

/**
 * Ou frapper, et avec quel secret.
 *
 * Ces deux valeurs different d'un environnement a l'autre : la base de staging
 * reveille l'application de staging, celle de production la sienne. Elles ne
 * peuvent donc pas vivre dans le depot — et le secret n'y aurait de toute façon
 * pas sa place.
 *
 * Le premier reflexe avait ete de les poser en parametres de base
 * (`ALTER DATABASE postgres SET app.app_url = ...`), comme le suggeraient les
 * anciennes migrations. Supabase le refuse : le role disponible n'est pas
 * superuser, et la commande rend « permission denied to set parameter ». D'ou
 * cette table, que la cle de service sait remplir.
 *
 * Elle porte un secret : la securite au niveau ligne est activee et **aucune
 * politique n'est definie**, ce qui la rend invisible a `anon` comme a
 * `authenticated`. Seuls la cle de service et les fonctions `SECURITY DEFINER`
 * la lisent.
 */
CREATE TABLE IF NOT EXISTS public.cron_config (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cron_config ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.cron_config IS
  'Adresse publique et secret partagé du balayage horaire. Aucune politique RLS : hors de portée des utilisateurs.';

/**
 * Reveille l'application pour qu'elle fasse son balayage.
 *
 * La fonction ne sait rien des courriels : elle frappe a une porte, et c'est
 * l'application qui decide qui doit recevoir quoi. Elle s'abstient tant que
 * l'adresse et le secret ne sont pas connus — un appel sans secret serait
 * refuse par la route, et un appel vers une adresse inconnue n'irait nulle
 * part.
 */
CREATE OR REPLACE FUNCTION public.declencher_balayage_courriels()
RETURNS void AS $$
DECLARE
  adresse TEXT;
  secret  TEXT;
BEGIN
  SELECT valeur INTO adresse FROM public.cron_config WHERE cle = 'app_url';
  SELECT valeur INTO secret  FROM public.cron_config WHERE cle = 'cron_secret';

  IF adresse IS NULL OR adresse = '' OR secret IS NULL OR secret = '' THEN
    RAISE NOTICE 'Balayage des courriels ignoré : app_url ou cron_secret absent de cron_config';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := adresse || '/api/cron/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

COMMENT ON FUNCTION public.declencher_balayage_courriels() IS
  'Appelle /api/cron/emails toutes les heures. La règle et le texte des courriels vivent dans l''application, pas ici.';

-- Toutes les heures. Un devis rappele a la minute pres n'apporte rien, et un
-- client prevenu que sa commande est arrivee moins d'une heure apres le dernier
-- article receptionne arrive toujours avant lui en boutique.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'balayage-courriels') THEN
    PERFORM cron.unschedule('balayage-courriels');
  END IF;

  PERFORM cron.schedule(
    'balayage-courriels',
    '0 * * * *',
    'SELECT public.declencher_balayage_courriels()'
  );
END $$;
