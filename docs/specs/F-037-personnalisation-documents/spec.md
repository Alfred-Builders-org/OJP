---
id: F-037
slug: personnalisation-documents
title: Personnaliser mentions légales, préfixes de numérotation et style des PDF
epic: E-013
surface: standard
domaine: [DOM-012]
dependencies: [F-035]
personas: [PER-001]
---

# Objectif

Donner au propriétaire un endroit unique pour régler ce qui habille les pièces contractuelles : le préfixe de numérotation de chacun des douze types, les textes contractuels et l'apparence. Le préfixe réglé pour le bon de livraison est repris dès l'émission suivante.

## Intention

Un comptoir change de dénomination, ajuste une clause après un conseil juridique, ou veut simplement que ses quittances se reconnaissent au premier coup d'œil. Aujourd'hui, chacun de ces changements passe par une intervention technique, ce qui le rend lent, coûteux et intimidant : on renonce à corriger une virgule dans une clause parce que la demande paraît disproportionnée.

Le propriétaire est le seul à décider de ces choses, et il est le seul à y avoir accès. L'endroit du réglage doit donc être aussi ordinaire qu'une page de paramètres : on ouvre l'onglet, on modifie, on enregistre. Un préfixe de numérotation est de la même nature qu'un choix de dénomination : c'est une décision de gestion, pas un sujet d'ingénierie.

Une couleur mal saisie ne doit pas se découvrir sur la première pièce remise à un client. Elle se signale au moment de la saisie, avec le format attendu, pendant que la personne est encore devant le champ.

## Hors-scope

- la reprise des textes contractuels et de l'apparence dans les pièces produites : les gabarits portent aujourd'hui leurs onze clauses de dépôt-vente, leurs conditions et leur couleur d'accentuation figées
- la reprise du préfixe réglé par les onze autres types de pièces, dont le numéro est attribué à l'émission sur une table de préfixes fixe
- l'identité de la société, le logo et les coordonnées, réglés ailleurs dans les Paramètres
- l'accès de ces réglages à un vendeur, fermé par les droits de l'application

## Cas d'erreur

- la couleur principale saisie n'est pas au format hexadécimal à six caractères : le réglage est signalé à la sortie du champ et le format attendu est rappelé

## Brief produit

### Purpose

Rendre au propriétaire la main sur l'habillage de ses pièces, sans passer par une intervention technique et sans risquer de découvrir une erreur de saisie sur un document déjà remis.

### User

Le propriétaire du comptoir, seul habilité aux Paramètres, qui décide de la dénomination, des clauses et de l'allure des pièces. Le client particulier, destinataire de ces pièces, pour qui la formulation et l'allure sont le produit.

### Content

Un onglet « Documents » dans les Paramètres, en trois blocs.

« Préfixes de numérotation » : une ligne par type de pièce, des douze libellés Quittance de rachat à Reçu de remboursement, chaque préfixe saisi en majuscules et limité à six caractères.

« Textes légaux » : un sélecteur listant Conditions confié, Conditions achat (rachat), Conditions contrat (rétractation), Validité devis, Conditions quittance dépôt-vente, CGV Vente, CGV Acompte, Conditions bon de commande, plus « Clauses contrat dépôt-vente (11) » dont chaque clause a son titre et son corps éditables.

« Apparence » : une « Couleur principale » saisie au format hexadécimal, avec le nuancier et le champ texte alignés sur la même valeur, et une « Police » à choisir entre Courier et Helvetica.

## Notes techniques

`src/components/parametres/documents-tab.tsx` écrit `settings.document_prefixes`, `settings.legal_texts` et `settings.pdf_style` (`supabase/migrations/038_create_settings.sql`). Validation `HEX_REGEX = /^#[0-9A-Fa-f]{6}$/` sur `onBlur`, toast `Format de couleur invalide` avec la description `Utilisez le format hexadécimal #RRGGBB.`. Seul `document_prefixes` est relu, et uniquement par `generateAndStoreBonLivraison` (`src/lib/pdf/generate-and-store.ts:242`, repli `DEFAULT_PREFIX_MAP`), qui compose `{prefix}-{annee}-{seq sur 4 chiffres}`. Les onze autres types passent par le trigger `generate_document_numero` dont la table de préfixes est en dur (R-023). `legal_texts` et `pdf_style` ne sont relus par aucun gabarit : `src/lib/pdf/blocks.ts` porte les constantes `CDV_CLAUSES`, `TEXTE_CONDITIONS_CONFIE`, `TEXTE_CONDITIONS_ACHAT_TMP`, `TEXTE_CONDITIONS_ACHAT_TFOP`, `TEXTE_CONDITIONS_CONTRAT`, `TEXTE_DEVIS_VALIDITE`, `TEXTE_CONDITIONS_QUITTANCE_DV`, `TEXTE_CGV_VENTE`, `TEXTE_CONDITIONS_BON_COMMANDE`, `TEXTE_CONDITIONS_BON_LIVRAISON`, `TEXTE_CGV_ACOMPTE` et les couleurs `GOLD = "#C8A84E"`, `DARK`, `GRAY`.
