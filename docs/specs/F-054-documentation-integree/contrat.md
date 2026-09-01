---
id: F-054
---

## Criteres d'acceptation

### AC-001 : Le catalogue mène directement à la fiche cherchée et à ses étapes

**Given** la page Documentation ouverte, qui publie 11 fiches réparties entre « Procédures », « Pages » et « Configuration »
**When** le vendeur choisit « Effectuer un rachat » dans la colonne de navigation
**Then** la fiche s'affiche à partir de son titre et déroule ses 6 étapes, de « Créer le lot de rachat » à « Répondre à un devis »

anchoring: [PER-002]
recette: [RS-054-01]

### AC-002 : Une fiche cherchée en vain ne renvoie vers aucune autre aide

**Given** un vendeur qui cherche la marche à suivre pour réceptionner une livraison de fonderie, sujet absent des 11 fiches publiées
**When** il parcourt les 3 catégories de la page Documentation
**Then** aucune fiche ne traite le sujet, et le catalogue ne propose ni recherche ni renvoi vers une autre forme d'aide

anchoring: [PER-002]
recette: [RS-054-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-054-01 | choisir « Effectuer un rachat » dans la navigation affiche la fiche et ses 6 étapes titrées | manuel |
| RS-054-02 | chercher la réception d'une livraison de fonderie dans les 3 catégories ne rend aucune fiche ni aucun renvoi | manuel |
