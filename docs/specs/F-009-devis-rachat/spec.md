---
id: F-009
slug: devis-rachat
title: Émettre un devis de rachat valable un temps donné
epic: E-003
domaine: [DOM-004, DOM-005, DOM-012]
surface: standard
dependencies: [F-007, F-035]
personas: [PER-002, PER-004]
---

# Objectif

Proposer un prix ferme, avec une durée de validité réglable. Le client repart avec une pièce datée et numérotée qui dit ce qu'on lui offre et jusqu'à quand.

## Intention

Un prix annoncé de vive voix ne survit pas à la porte du magasin. Le client rentre chez lui, compare, revient trois jours plus tard, et plus personne ne sait ce qui avait été dit ni au cours de quel jour. Le devis fige la proposition dans un document que le client emporte et reçoit par courriel, et lui donne un temps de réflexion borné plutôt qu'une pression immédiate. Côté comptoir, le vendeur sait exactement ce qu'il a promis, à qui, et jusqu'à quelle heure ; il n'a plus à s'en remettre à sa mémoire quand le client rappelle.

## Hors-scope

- le chiffrage lui-même, arrêté en amont au cours figé du lot
- la réponse du client, acceptation ou refus, qui appartient à la capacité voisine
- la fermeture automatique d'un devis resté sans réponse : passé l'échéance annoncée, le devis reste ouvert et c'est le comptoir qui tranche

## Cas d'erreur

- la durée « Validité d'un devis » est portée à 72 heures dans les paramètres : le devis émis reste valable 48 heures et l'annonce faite au client continue de dire 48 heures

## Brief produit

### Purpose

Transformer une proposition orale en engagement écrit, borné dans le temps, opposable des deux côtés du comptoir.

### User

Le vendeur au comptoir, qui chiffre l'or apporté et remet la proposition. Le client particulier, qui ne verra du produit que ce devis et le courriel qui l'accompagne.

### Content

Le devis porte le numéro de l'opération, le détail de ce qui a été pesé et titré, le montant total proposé et la durée de validité. Le courriel qui l'emporte a pour objet « Votre devis {numéro} - Or au Juste Prix » et annonce la même durée que la pièce jointe. Au comptoir, l'objet chiffré passe en attente de réponse et l'opération est marquée en cours.

## Notes techniques

La bascule en `devis_envoye` se joue à la finalisation du dossier dans `src/lib/actions/finalize-actions.ts`, qui pose `date_envoi = now()` et `date_fin_delai = now() + RETRACTATION_DELAY_MS` (constante de 48 h en dur, ligne 18). Le PDF est produit par `src/lib/pdf/devis-rachat.ts` sous le préfixe `DEV` via `generate-and-store.ts`. Le gabarit de courriel `devis_envoye` vient de `supabase/migrations/033_create_email_templates.sql`, dont le corps contient la phrase « Ce devis est valable 48 heures. » écrite en dur. Le réglage `devis_validite_heures` existe dans `BusinessRulesSettings` et s'édite dans `src/components/parametres/regles-metier-tab.tsx` (ligne 93) mais n'est lu nulle part : c'est l'écart décrit en cas d'erreur.
