---
id: F-045
---

## Criteres d'acceptation

### AC-001 : Le menu d'un vendeur ne montre pas les groupes réservés

**Given** un vendeur connecté au comptoir avec le rôle vendeur
**When** il parcourt le menu latéral de l'application
**Then** les groupes « Comptabilité », « Fonderie » et « Administration » n'y figurent pas, et taper l'adresse de la gestion des utilisateurs le ramène au tableau de bord

anchoring: [R-028, PER-002]
recette: [RS-045-01]

### AC-002 : La donnée réservée refuse de sortir, quel que soit le chemin

**Given** un vendeur actif dont le rôle n'ouvre ni les fonderies ni les bons de commande
**When** ces données sont demandées depuis son compte, y compris en contournant le menu et la page
**Then** aucune fonderie ni aucun bon de commande ne lui est rendu, et l'écriture des modèles de courriel et des paramètres lui reste fermée

anchoring: [R-029, PER-002]
recette: [RS-045-02]

### AC-003 : Un vendeur lit les cours mais ne les actualise pas

**Given** un vendeur actif qui ouvre un lot au cours du jour
**When** il consulte les cours et les seuils, puis demande l'actualisation des cours
**Then** les valeurs s'affichent et le prix de rachat se calcule normalement, mais l'actualisation est refusée avec « Seul un propriétaire peut actualiser les cours. »

anchoring: [R-020, PER-002]
recette: [RS-045-03]

### AC-004 : Un vendeur ne se donne pas le rôle de propriétaire

**Given** un vendeur dont le profil porte le rôle vendeur et l'état actif
**When** une modification de son propre rôle vers propriétaire est tentée depuis son compte
**Then** le rôle et l'état actif reprennent leur valeur antérieure, et son périmètre reste celui d'un vendeur

anchoring: [R-041, PER-002]
recette: [RS-045-04]

### AC-005 : Sans session, une page réservée renvoie à la connexion

**Given** un navigateur sans session ouverte sur le comptoir
**When** l'une des douze pages protégées, dont les fonderies, les commandes, les paramètres et la gestion des utilisateurs, est ouverte directement
**Then** la personne est renvoyée sur la page de connexion, et les trois routes de service correspondantes refusent la demande au lieu de rendre une page

anchoring: [R-028, PER-001]
recette: [RS-045-05, RS-045-06]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-045-01 | un vendeur connecté ne voit ni Comptabilité, ni Fonderie, ni Administration, et l'adresse des utilisateurs le renvoie au tableau de bord | manuel |
| RS-045-02 | depuis un compte vendeur, aucune fonderie ni bon de commande n'est rendu et l'écriture des paramètres est refusée | manuel |
| RS-045-03 | un vendeur voit les cours et obtient un prix de rachat non nul, mais l'actualisation lui est refusée | manuel |
| RS-045-04 | une tentative de passer son propre compte vendeur au rôle propriétaire laisse le rôle inchangé | manuel |
| RS-045-05 | les douze pages protégées ouvertes sans session renvoient vers la page de connexion | test:e2e/security.spec.ts::protected routes redirect to sign-in |
| RS-045-06 | les trois routes de service appelées sans session refusent la demande | test:e2e/security.spec.ts::API routes return 401 for unauthenticated requests |
