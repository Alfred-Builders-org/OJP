---
id: F-046
---

## Criteres d'acceptation

### AC-001 : Un compte fermé garde son nom sur ce qu'il a produit et rend son adresse

**Given** un vendeur nommé Camille Roux, joignable à camille.roux@exemple.com, qui a créé 3 lots et 2 dossiers encore consultables
**When** le propriétaire supprime son compte depuis la gestion des utilisateurs
**Then** Camille n'entre plus, son compte disparaît de la liste, la mention « créé par Camille Roux » reste lisible sur ses 3 lots et 2 dossiers, et l'adresse camille.roux@exemple.com redevient utilisable pour un nouveau compte

anchoring: [R-027, PER-001]
recette: [RS-046-01]

### AC-002 : Les suppressions interdites sont refusées avec leur motif

**Given** le propriétaire Marc, connecté, devant une liste qui contient son propre compte, celui d'un second propriétaire et celui d'un administrateur de la solution
**When** il demande successivement la suppression de son propre compte, puis celle du second propriétaire, puis celle de l'administrateur de la solution
**Then** les trois sont refusées avec « Vous ne pouvez pas supprimer votre propre compte », « Seul un super admin peut supprimer un propriétaire » et « Impossible de supprimer un super admin »

anchoring: [PER-001]
recette: [RS-046-02]

### AC-003 : Une adresse non libérée est signalée au demandeur

**Given** un compte fermé dont l'adresse camille.roux@exemple.com n'a pas pu être neutralisée au terme de l'opération
**When** le propriétaire regarde le résultat de sa demande de suppression
**Then** il lit « Compte supprimé, mais son adresse e-mail n'a pas pu être libérée. Elle ne pourra pas être réutilisée pour un nouveau compte. », et sait donc que le compte est bien fermé

anchoring: [R-027, PER-003]
recette: [RS-046-03]

### AC-004 : Un accès se suspend et se rouvre, mais personne ne touche à son propre rôle

**Given** le propriétaire Marc et le compte actif du vendeur Camille Roux dans la gestion des utilisateurs
**When** Marc désactive le compte de Camille, le réactive, puis tente de passer son propre compte au rôle vendeur
**Then** les messages « Utilisateur désactivé » puis « Utilisateur activé » s'affichent, Camille retrouve son accès, et le rôle de Marc reste propriétaire avec le refus « Vous ne pouvez pas modifier votre propre rôle »

anchoring: [R-041, PER-001]
recette: [RS-046-04, RS-046-05]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-046-01 | supprimer le compte de Camille Roux laisse « créé par Camille Roux » sur ses 3 lots et 2 dossiers et libère son adresse | manuel |
| RS-046-02 | supprimer son propre compte, un autre propriétaire ou un super admin est refusé avec les trois motifs attendus | manuel |
| RS-046-03 | une suppression dont la libération d'adresse échoue avertit le propriétaire que l'adresse restera indisponible | manuel |
| RS-046-04 | désactiver puis réactiver le compte de Camille Roux affiche les deux messages et lui rend son accès | manuel |
| RS-046-05 | changer son propre rôle est refusé avec « Vous ne pouvez pas modifier votre propre rôle » et le rôle reste inchangé | manuel |
