---
id: F-052
---

## Criteres d'acceptation

### AC-001 : L'ouverture d'un dossier dépose une notification chez chaque utilisateur actif

**Given** 3 utilisateurs actifs, dont le vendeur qui va ouvrir le dossier, et le type « Dossier créé » laissé activé
**When** le vendeur ouvre le dossier numéro DOS-2026-0042 sur la fiche d'un client
**Then** chacun des 3 voit son compteur de non-lues augmenter de un et trouve dans son panneau « Nouveau dossier » avec le message « Le dossier DOS-2026-0042 a été créé. »

anchoring: [PER-002, PER-001]
recette: [RS-052-01]

### AC-002 : Un type désactivé dans les paramètres ne dépose plus rien

**Given** le type « Lot rétracté » basculé sur inactif dans l'onglet Notifications des paramètres
**When** un client se rétracte et le lot RAC-2026-0010 prend l'issue « rétracté »
**Then** aucune notification « Lot rétracté » n'apparaît, le compteur de non-lues reste inchangé, et les autres types continuent d'arriver

anchoring: [PER-001, PER-002]
recette: [RS-052-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-052-01 | ouvrir le dossier DOS-2026-0042 dépose « Nouveau dossier » chez les 3 utilisateurs actifs et incrémente leur compteur | manuel |
| RS-052-02 | désactiver « Lot rétracté » dans les paramètres puis rétracter le lot RAC-2026-0010 ne dépose aucune notification | manuel |
