---
id: F-056
---

## Criteres d'acceptation

### AC-001 : La porte ouverte au service d'assistance est la seule, et le reste demeure fermé

**Given** la page de connexion servie par l'application, avec sa politique de sécurité du contenu et ses 5 en-têtes de sécurité
**When** le widget d'assistance et un script hébergé sur un domaine tiers non déclaré tentent tous deux de se charger
**Then** seul le widget d'assistance se charge, le script du domaine non déclaré est bloqué, et les en-têtes de sécurité restent posés sur la réponse

anchoring: [R-026, PER-003]
recette: [RS-056-01, RS-056-02]

### AC-002 : L'aide est joignable avant même d'être connecté, sans retarder l'affichage

**Given** un vendeur qui n'arrive pas à se connecter et reste sur l'écran de connexion
**When** la page finit de s'afficher
**Then** le point d'entrée d'assistance est disponible sur cet écran comme sur les 2 autres pages d'authentification, et son chargement n'a retardé aucun élément de la page

anchoring: [PER-002, PER-003]
recette: [RS-056-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-056-01 | la page de connexion porte ses en-têtes de sécurité et sa politique de contenu | test:e2e/security.spec.ts::security headers are present |
| RS-056-02 | un script servi par un domaine non déclaré dans la politique de contenu est bloqué, le widget d'assistance non | manuel |
| RS-056-03 | le point d'entrée d'assistance est présent sur l'écran de connexion et apparaît après l'affichage de la page | manuel |
