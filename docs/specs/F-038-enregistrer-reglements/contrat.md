---
id: F-038
---

## Criteres d'acceptation

### AC-001 : Un acompte encaissé se reporte tout seul sur l'opération

**Given** un lot de vente d'or d'investissement dont l'acompte attendu est de 1 200,00 € et sur lequel aucun règlement n'a encore été saisi
**When** le vendeur enregistre un acompte de 1 200,00 € en carte bancaire, à la date du jour
**Then** le message « Règlement enregistré » s'affiche, le lot porte son acompte comme réglé avec sa date et son mode sans autre saisie, et le grand livre du dossier compte 1 200,00 € en entrées

anchoring: [R-044, PER-002, PER-001]
recette: [RS-038-01]

### AC-002 : Verser au client sur une opération rétractée est refusé

**Given** le lot de rachat RAC-2026-0010, dont l'issue est « rétracté »
**When** le vendeur tente d'enregistrer un versement de 1 240,00 € au client sur ce lot
**Then** rien n'est enregistré et le vendeur lit « Aucun paiement n'est du sur le lot RAC-2026-0010 : l'operation est close (retracte). »

anchoring: [R-014, PER-002]
recette: [RS-038-02]

### AC-003 : Le remboursement d'une rétractation ramène le lot à zéro

**Given** un lot de rachat sur lequel 1 240,00 € ont été versés au client, qui s'est ensuite rétracté et a rendu la somme
**When** le remboursement est enregistré sur le reçu de remboursement, comme règlement de rachat sortant de moins 1 240,00 €
**Then** le lot totalise 0,00 € de règlements de rachat, et les deux mouvements restent lisibles ligne à ligne au grand livre du dossier

anchoring: [R-015, PER-002]
recette: [RS-038-03]

### AC-004 : Un règlement sans moyen de paiement est refusé

**Given** une saisie de règlement ouverte sur un reste à régler de 1 350,00 €, le champ « Mode de règlement » resté sur « Choisir un mode »
**When** le vendeur valide l'enregistrement
**Then** rien n'est enregistré et le vendeur lit « Le mode de règlement est requis. »

anchoring: [PER-002]
recette: [RS-038-04]

### AC-005 : Un montant nul ou négatif est refusé à la saisie

**Given** une saisie de règlement ouverte sur un reste à régler de 1 350,00 €, avec le mode « Espèces » choisi et le montant ramené à 0
**When** le vendeur valide l'enregistrement
**Then** rien n'est enregistré et le vendeur lit « Le montant doit être positif. »

anchoring: [PER-002]
recette: [RS-038-05]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-038-01 | enregistrer un acompte de 1 200,00 € en carte bancaire reporte l'acompte sur le lot et 1 200,00 € en entrées au grand livre | manuel |
| RS-038-02 | verser 1 240,00 € au client sur le lot rétracté RAC-2026-0010 est refusé avec le motif affiché | manuel |
| RS-038-03 | enregistrer le remboursement de moins 1 240,00 € après rétractation ramène le total des règlements de rachat du lot à 0,00 € | manuel |
| RS-038-04 | valider un règlement de 1 350,00 € sans choisir de mode affiche « Le mode de règlement est requis. » et n'enregistre rien | manuel |
| RS-038-05 | valider un règlement de 0 en espèces affiche « Le montant doit être positif. » et n'enregistre rien | manuel |
