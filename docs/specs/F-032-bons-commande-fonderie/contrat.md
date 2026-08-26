---
id: F-032
---

## Criteres d'acceptation

### AC-001 : Un bon de commande par fonderie, dont le montant est toujours celui de ses lignes

**Given** deux références routées vers la fonderie CPoR Devises, 3 pièces à 2 400 euros et 1 pièce à 800 euros
**When** le propriétaire valide le dispatch de ces 2 références
**Then** un bon de commande numéroté BDC-2026-0001 adressé à CPoR Devises porte les deux lignes et affiche un montant total de 8 000 euros, qu'aucune saisie ne fixe

anchoring: [R-028, R-044, PER-005]
recette: [RS-032-01]

### AC-002 : La dernière ligne reçue fait basculer le bon, et le règlement le solde

**Given** un bon de commande BDC-2026-0001 de 8 000 euros au statut « Envoyé », dont 2 de ses 3 lignes sont déjà reçues
**When** le propriétaire marque la troisième ligne comme reçue, puis enregistre un règlement fonderie de 8 000 euros
**Then** le bon passe au statut « Reçu » puis au statut « Payé », et l'action « Paiement fonderie à effectuer » quitte le tableau de bord du jour

anchoring: [PER-001, PER-005]
recette: [RS-032-02, RS-032-03]

### AC-003 : Annuler un bon de commande rend ses lignes au dispatch

**Given** un bon de commande BDC-2026-0002 au statut « Envoyé » portant 4 lignes
**When** le propriétaire annule ce bon de commande
**Then** le bon passe au statut « Annulé », ses 4 lignes redeviennent à dispatcher et aucune ne reste rattachée à la fonderie

anchoring: [PER-001]
recette: [RS-032-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-032-01 | dispatcher 3 pièces à 2 400 euros et 1 pièce à 800 euros vers CPoR Devises et vérifier le bon BDC-2026-0001 à 8 000 euros | manuel |
| RS-032-02 | recevoir la troisième et dernière ligne d'un bon envoyé et vérifier son passage au statut Reçu | manuel |
| RS-032-03 | enregistrer un règlement fonderie de 8 000 euros sur un bon reçu et vérifier son passage au statut Payé | manuel |
| RS-032-04 | annuler un bon de commande de 4 lignes et vérifier que les 4 lignes reviennent à dispatcher | manuel |
