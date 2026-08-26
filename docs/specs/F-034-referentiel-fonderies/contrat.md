---
id: F-034
---

## Criteres d'acceptation

### AC-001 : Le nom est la seule condition pour qu'un partenaire existe au référentiel

**Given** un référentiel qui porte les 3 partenaires présents dès l'ouverture, CPoR Devises, Comptoir National de l'Or et Gold by Gold
**When** le propriétaire enregistre une nouvelle fiche en laissant le nom vide, téléphone et ville renseignés
**Then** la fiche n'est pas créée, le message « Le nom est obligatoire » est affiché, et le référentiel compte toujours 3 partenaires

anchoring: [PER-001, PER-005]
recette: [RS-034-01, RS-034-02]

### AC-002 : Le référentiel des partenaires est fermé au vendeur

**Given** un vendeur au comptoir, à qui le menu ne propose aucune entrée vers les fonderies
**When** il demande directement la page qui liste les fonderies
**Then** la page ne s'ouvre pas et les 3 fiches partenaires lui restent invisibles

anchoring: [R-028, PER-001]
recette: [RS-034-03, RS-034-04]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-034-01 | enregistrer une fiche fonderie sans nom et vérifier le refus avec « Le nom est obligatoire » | manuel |
| RS-034-02 | enregistrer la fonderie Métaux Précieux du Sud à Marseille et vérifier qu'elle rejoint le référentiel et devient un destinataire proposable | manuel |
| RS-034-03 | ouvrir la liste des fonderies avec un compte vendeur et vérifier que la page ne s'affiche pas | manuel |
| RS-034-04 | demander la page des fonderies sans session ouverte et vérifier le renvoi vers l'écran de connexion | test:e2e/security.spec.ts::protected routes redirect to sign-in |
