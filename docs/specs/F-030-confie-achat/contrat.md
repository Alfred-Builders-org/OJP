---
id: F-030
---

## Criteres d'acceptation

### AC-001 : Les articles confiés se comptent hors du stock détenu

**Given** un comptoir qui détient 12 bijoux, dont 3 lui ont été confiés au titre d'un dépôt-vente
**When** le vendeur ouvre la page Bijoux puis la page Confié d'achat
**Then** la page Bijoux montre les 9 bijoux appartenant à la maison, et la page Confié d'achat les 3 articles confiés, chacun avec le nom du déposant, le numéro du dépôt et la date de dépôt

anchoring: [PER-002, PER-004]
recette: [RS-030-01]

### AC-002 : Une fiche dont le déposant est introuvable reste lisible

**Given** un article confié dont le dépôt d'origine n'a pas pu être retrouvé
**When** le vendeur ouvre la fiche de cet article
**Then** la fiche affiche le statut, le métal, la qualité, le poids et les prix, et le bloc déposant annonce « Informations déposant non disponibles. »

anchoring: [PER-002]
recette: [RS-030-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-030-01 | sur 12 bijoux dont 3 confiés, la page Bijoux en montre 9 et la page Confié d'achat en montre 3 avec déposant, dépôt et date de dépôt | manuel |
| RS-030-02 | ouvrir la fiche d'un article confié sans dépôt d'origine retrouvé affiche ses caractéristiques et le message d'informations déposant non disponibles | manuel |
