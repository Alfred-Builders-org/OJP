---
id: F-055
---

## Criteres d'acceptation

### AC-001 : Consulter un dossier en aperçu laisse la liste exactement où elle était

**Given** la liste des dossiers ouverte à la page 3, filtrée sur les dossiers en cours
**When** le vendeur clique la ligne du dossier DOS-2026-0042, lit l'aperçu latéral puis le referme
**Then** la liste est toujours à la page 3 avec le même filtre, sans rechargement ni retour au début

anchoring: [PER-002]
recette: [RS-055-01, RS-055-02]

### AC-002 : Un type d'aperçu non couvert annonce sa disponibilité à venir

**Given** la liste des ventes, où l'aperçu est demandé sur la vente VEN-2026-0007
**When** le vendeur ouvre l'aperçu de cette vente
**Then** le tiroir s'ouvre sur un texte annonçant que l'aperçu de la vente sera bientôt disponible, sans afficher aucune donnée de la vente

anchoring: [PER-002]
recette: [RS-055-03]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-055-01 | ouvrir l'aperçu du dossier DOS-2026-0042 depuis la page 3 de la liste filtrée, puis le refermer, laisse la page 3 et son filtre intacts | manuel |
| RS-055-02 | le clic assorti de la touche de commande sur la ligne du dossier DOS-2026-0042 ouvre un vrai nouvel onglet au lieu du tiroir | manuel |
| RS-055-03 | demander l'aperçu de la vente VEN-2026-0007 ouvre un tiroir annonçant une disponibilité à venir | manuel |
