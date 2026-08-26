---
id: F-009
---

## Criteres d'acceptation

### AC-001 : Un objet marqué « Devis » part en devis à la finalisation du dossier

**Given** un dossier dont le lot de rachat porte une bague de 8,40 g marquée « Devis »
**When** le vendeur finalise le dossier
**Then** la bague passe en attente de réponse, l'opération est marquée en cours, un devis numéroté est émis et part au client par courriel avec l'objet « Votre devis DEV-2026-0007 - Or au Juste Prix »

anchoring: [R-010, PER-002]
recette: [RS-009-01]

### AC-002 : Le devis remis au client annonce quarante-huit heures de validité

**Given** un devis émis le 3 mars 2026 à 10h00 pour un montant de 412,00 EUR
**When** le client ouvre le courriel et la pièce jointe qu'il a reçus
**Then** le message annonce « Ce devis est valable 48 heures. » et l'échéance suivie au comptoir est le 5 mars 2026 à 10h00

anchoring: [R-024, PER-004]
recette: [RS-009-02]

### AC-003 : Le réglage de validité du devis reste sans effet sur la durée réelle

**Given** le réglage « Validité d'un devis » porté à 72 heures dans les paramètres, un devis étant émis le 3 mars 2026 à 10h00
**When** le vendeur compare l'échéance suivie au comptoir et le message reçu par le client
**Then** l'échéance reste au 5 mars 2026 à 10h00 et le message annonce toujours « Ce devis est valable 48 heures. »

anchoring: [R-024, PER-002]
recette: [RS-009-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-009-01 | finaliser un dossier portant une bague de 8,40 g marquée « Devis » émet le devis et l'envoie au client | manuel |
| RS-009-02 | le devis émis le 3 mars 2026 à 10h00 annonce « Ce devis est valable 48 heures. » et échoit le 5 mars 2026 à 10h00 | manuel |
| RS-009-03 | porter « Validité d'un devis » à 72 heures ne déplace ni l'échéance ni le message envoyé au client | manuel |
