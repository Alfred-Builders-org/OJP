---
id: F-047
slug: seuils-metier-reglables
title: Régler sans code les seuils et délais du métier
epic: E-017
surface: standard
dependencies: none
personas: [PER-001]
---

# Objectif

Rétractation, validité du devis, acompte, commission, préavis, pénalités et frais : treize réglages du métier vivent dans l'application et non dans le code. Le propriétaire les change lui-même depuis l'écran des paramètres, sans attendre une livraison.

## Intention

Ces valeurs bougent au rythme du métier et de la réglementation, pas à celui des versions. Tant qu'elles sont écrites dans le code, changer la part d'acompte ou la commission d'un dépositaire demande de solliciter un tiers et d'attendre : le propriétaire ne décide plus de ses propres conditions commerciales. En les rangeant dans un écran nommé en français clair, avec leur unité affichée à côté du champ, on rend au comptoir la main sur ses délais et ses pourcentages, et on rend lisibles les règles qui parlent d'une échéance sans la chiffrer.

C'est aussi une question de mémoire : quand un seuil est écrit quelque part et porte un nom, on sait ce qu'il vaut aujourd'hui, et on peut le discuter. Quand il est enfoui dans un calcul, personne au comptoir ne sait plus pourquoi le délai est de deux jours.

## Hors-scope

- l'application des seuils : le rachat, la vente et le dépôt-vente lisent chacun la valeur à leur moment, ce périmètre se contente de la ranger et de la rendre modifiable
- les opérations déjà ouvertes, qui conservent la valeur qui avait cours le jour où elles ont commencé
- les textes contractuels, les préfixes de numérotation et l'apparence des pièces, qui se règlent du côté des documents
- les coefficients de rachat et de vente, qui ont leur propre écran

## Cas d'erreur

- le délai de rétractation réglé à 72 h n'est pas suivi partout : une validation faite depuis la fiche du lot pose bien une échéance à 72 h, alors que la finalisation groupée de la journée pose toujours une échéance à 48 h
- neuf des treize réglages sont enregistrés et réaffichés mais ne sont relus par aucun calcul : validité du devis, délai de paiement du solde, durée du contrat de dépôt-vente, préavis de résiliation, pénalité de retrait, forfait de nettoyage, frais de garde mensuels, délai de paiement du déposant et part de solde

## Brief produit

### Purpose

Rendre au propriétaire la main sur les treize valeurs qui gouvernent ses délais, ses parts et ses frais, et faire que ces valeurs aient un nom lisible plutôt qu'une existence cachée.

### User

Le propriétaire du comptoir, seul rôle habilité à ouvrir les paramètres. Le vendeur et le déposant en subissent l'effet sans jamais voir l'écran.

### Content

Trois cartes. Rachat : durée de rétractation en heures (48 par défaut, avec la note « 48 h = 2 jours ») et validité d'un devis en heures (48). Vente or investissement : part d'acompte en pourcentage (10), part de solde affichée en lecture seule comme le complément à 100, délai de paiement du solde en heures (48). Dépôt-vente : commission du dépositaire (40 %), durée du contrat (12 mois), préavis de résiliation (7 jours), pénalité de retrait (10 %), forfait de nettoyage (20 €), frais de garde (10 € par mois), délai de paiement du déposant (15 jours), et seuil d'alerte d'expiration de pièce d'identité (30 jours). L'enregistrement confirme par « Règles métier sauvegardées ».

## Notes techniques

Les valeurs vivent dans la table `settings` sous la clé `business_rules` (migration `038_create_settings.sql`), typées par `BusinessRulesSettings` dans `src/types/settings.ts`. L'écran est `src/components/parametres/regles-metier-tab.tsx` : `updateNum` ignore silencieusement toute saisie non numérique, et `doSave` recalcule systématiquement `solde_pct = 100 - acompte_pct` avant l'appel.

Quatre clés seulement sont réellement consommées : `seuil_alerte_identite_jours` par les alertes du tableau de bord, `acompte_pct` par le calcul de l'acompte et des paiements dus, `commission_dv_pct` par le prix de revente en dépôt-vente, et `retractation_heures` côté client via `getSettingClient` dans `lot-detail-page.tsx:134`, propagé par `ActionContext.retractationMs` jusqu'à `lib/actions/lot-actions.ts` et `reference-actions.ts`. La server action `finalize-actions.ts` ignore le réglage et utilise la constante `RETRACTATION_DELAY_MS = 48 * 60 * 60 * 1000` (ligne 18), d'où la divergence relevée en cas d'erreur. R-024 porte l'inventaire des treize.
