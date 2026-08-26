---
id: F-047
---

## Criteres d'acceptation

### AC-001 : Un seuil changé dans les paramètres est retenu et s'applique aux opérations suivantes

**Given** l'écran des règles métier où la part d'acompte vaut 10 % et la part de solde affiche 90 % en lecture seule
**When** le propriétaire porte la part d'acompte à 30 % et enregistre
**Then** l'écran confirme par « Règles métier sauvegardées », la part de solde affiche 70 %, et une vente composée ensuite réclame 30 % du total à la commande

anchoring: [R-024, PER-001]
recette: [RS-047-01]

### AC-002 : Le délai de rétractation réglé n'est pas suivi par la finalisation groupée

**Given** une durée de rétractation portée de 48 h à 72 h dans les règles métier
**When** le vendeur valide un rachat depuis la fiche du lot, puis passe un second lot par la finalisation groupée de la journée
**Then** le premier lot porte une échéance de rétractation à 72 h et le second une échéance à 48 h

anchoring: [R-024, PER-001]
recette: [RS-047-02]

### AC-003 : Neuf des treize réglages sont enregistrés sans être relus par aucun calcul

**Given** une validité de devis portée de 48 h à 72 h et un forfait de nettoyage porté de 20 € à 35 €
**When** le propriétaire enregistre, puis émet un devis de rachat et clôture un contrat de dépôt-vente
**Then** les deux valeurs sont bien réaffichées dans l'écran des règles métier, mais le devis garde une échéance à 48 h et le décompte du dépositaire retient 20 € de nettoyage

anchoring: [R-024, PER-001]
recette: [RS-047-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-047-01 | porter la part d'acompte de 10 % à 30 % et vérifier que la part de solde affiche 70 % puis qu'une vente réclame 30 % à la commande | manuel |
| RS-047-02 | régler la rétractation à 72 h, comparer l'échéance posée par une validation depuis le lot et celle posée par la finalisation groupée | manuel |
| RS-047-03 | porter la validité du devis à 72 h et le forfait de nettoyage à 35 EUR, puis constater qu'aucun devis ni décompte déposant n'en tient compte | manuel |
