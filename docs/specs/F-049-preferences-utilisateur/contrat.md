---
id: F-049
---

## Criteres d'acceptation

### AC-001 : Le thème choisi s'applique partout et reste attaché à la personne

**Given** un vendeur connecté dont le thème vaut « Système », les trois choix « Clair », « Sombre » et « Système » étant proposés dans la section Apparence de son profil
**When** il choisit « Sombre », parcourt le tableau de bord, un dossier et une liste de lots, puis se déconnecte et revient
**Then** toutes les pages visitées s'affichent en sombre et restent lisibles, le choix « Sombre » est toujours mis en évidence à son retour, et le thème d'un autre utilisateur reste inchangé

anchoring: [R-036, PER-002]
recette: [RS-049-01]

### AC-002 : La barre latérale et la densité des listes sont enregistrées mais sans effet

**Given** un propriétaire dont la barre latérale est repliée par défaut et dont les listes affichent 20 lignes par page
**When** il active « Sidebar ouverte par défaut », choisit 50 dans « Éléments par page », enregistre, puis rouvre le tableau de bord et une liste de dossiers
**Then** l'écran confirme par « Preferences d'affichage sauvegardees » et les deux choix sont bien réaffichés dans son profil, mais la barre latérale s'ouvre repliée et la liste affiche 20 lignes

anchoring: [PER-001, PER-002]
recette: [RS-049-02]

## Scenarios de recette

| Id | Scenario | Nature |
|---|---|---|
| RS-049-01 | choisir le thème Sombre, parcourir tableau de bord, dossier et liste de lots, se reconnecter et retrouver le choix | manuel |
| RS-049-02 | activer la sidebar ouverte par défaut et 50 éléments par page, puis constater que la sidebar reste repliée et la liste à 20 lignes | manuel |
