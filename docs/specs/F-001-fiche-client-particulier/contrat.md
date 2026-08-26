---
id: F-001
---

## Criteres d'acceptation

### AC-001 : Une fiche enregistrée se retrouve à la recherche sans ses accents

**Given** un client enregistré sous le nom « Dupré », domicilié 12 rue de Rivoli, 75001 Paris
**When** le vendeur cherche « dupre » sans accent depuis la liste des clients
**Then** la fiche de « Dupré » remonte dans les résultats

anchoring: [R-043, PER-002]
recette: [RS-001-01]

### AC-002 : La fiche porte le verdict de validité du client

**Given** un client Jean Dupont créé le 26 août 2026, dont la fiche ne porte encore aucune pièce d'identité
**When** le vendeur ouvre sa fiche, puis y enregistre une pièce expirant le 30 juin 2031
**Then** le badge collé au nom affiche « Non valide » avant l'enregistrement et « Valide » après, sans aucune saisie de ce badge

anchoring: [R-045, PER-002]
recette: [RS-001-02]

### AC-003 : Un email mal formé refuse l'enregistrement

**Given** un vendeur qui saisit la fiche de Marie Durand avec l'email « marie.durand » et tous les autres champs obligatoires remplis
**When** il valide la création du client
**Then** la fiche n'est pas créée et « Format email invalide » s'affiche sous le champ Email

anchoring: [PER-002]
recette: [RS-001-03]

### AC-004 : Un champ obligatoire vide refuse l'enregistrement

**Given** un vendeur qui saisit la fiche de Marie Durand, née le 4 mai 1978, sans renseigner le code postal ni la ville
**When** il valide la création du client
**Then** la fiche n'est pas créée et les motifs « Le code postal est requis » et « La ville est requise » s'affichent en rouge sous les champs concernés

anchoring: [PER-002]
recette: [RS-001-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-001-01 | créer un client « Dupré » domicilié 12 rue de Rivoli à Paris, puis le retrouver en cherchant « dupre » sans accent | manuel |
| RS-001-02 | ouvrir la fiche d'un client sans pièce d'identité et constater « Non valide », puis « Valide » après ajout d'une pièce expirant le 30 juin 2031 | manuel |
| RS-001-03 | créer un client avec l'email « marie.durand » est refusé avec « Format email invalide » | manuel |
| RS-001-04 | créer un client sans code postal ni ville est refusé avec « Le code postal est requis » et « La ville est requise » | manuel |
