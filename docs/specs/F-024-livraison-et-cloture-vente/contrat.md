---
id: F-024
---

## Criteres d'acceptation

### AC-001 : Les articles prêts sont signalés à livrer tant qu'ils ne sont pas remis

**Given** une vente portant 2 produits d'or d'investissement servis du disponible et non encore remis au client
**When** le vendeur consulte ses actions du jour
**Then** la vente y figure avec la mention « 2 articles à livrer au client », et l'écran de livraison propose exactement ces 2 articles

anchoring: [R-011, PER-002]
recette: [RS-024-01]

### AC-002 : Tout remis et tout payé, la vente se termine et le dit

**Given** une vente de 2 400,00 € entièrement réglée dont il reste un seul article à remettre au client
**When** le vendeur constate la remise de ce dernier article
**Then** la vente passe au statut « Finalisé », le message « Vente finalisée automatiquement » s'affiche, et elle disparaît des actions du jour

anchoring: [R-011, PER-004]
recette: [RS-024-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-024-01 | une vente dont 2 articles sont servis du disponible sans être remis figure dans les actions du jour avec 2 articles à livrer | manuel |
| RS-024-02 | constater la remise du dernier article d'une vente de 2 400,00 € entièrement réglée la fait passer au statut Finalisé | manuel |
