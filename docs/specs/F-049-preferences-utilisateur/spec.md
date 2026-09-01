---
id: F-049
slug: preferences-utilisateur
title: Laisser chaque utilisateur choisir son thème et la densité des listes
epic: E-017
surface: standard
dependencies: [F-043]
personas: [PER-002, PER-001]
---

# Objectif

Chaque utilisateur choisit depuis son profil le thème de l'application, l'état de la barre latérale et le nombre de lignes affichées par page. Ces choix lui appartiennent : ils ne valent que pour lui et sont retenus d'une session à l'autre.

## Intention

L'outil reste ouvert huit heures par jour, sur des postes et des yeux qui ne se ressemblent pas. Le comptoir travaille sous une vitrine en plein soleil, l'arrière-boutique sous néon : le thème sombre n'est pas un ornement, c'est ce qui rend l'écran tenable pour celui qui le fixe toute la journée. Le laisser au choix de chacun, plutôt qu'imposé par la maison, évite la négociation permanente entre deux personnes qui partagent un métier mais pas une fatigue.

La densité des listes relève du même principe : le propriétaire qui balaie une journée entière veut cinquante lignes d'un coup, le vendeur qui cherche un dossier précis en veut dix. Il n'y a pas de bon réglage commun, seulement un réglage personnel, et le seul endroit légitime pour le poser est le profil de la personne.

## Hors-scope

- les réglages du métier, délais, parts et frais, qui valent pour toute la maison et vivent dans les paramètres
- l'apparence des documents produits, qui suit la charte de la société et non le thème de qui les édite
- le choix des notifications reçues, qui se règle à part

## Cas d'erreur

- l'état par défaut de la barre latérale et le nombre d'éléments par page sont enregistrés et confirmés à l'écran, mais ne sont relus nulle part : la barre latérale s'ouvre toujours repliée et les listes affichent toujours 20 lignes

## Brief produit

### Purpose

Donner à chacun la main sur son confort de lecture, et faire que ce choix le suive sans qu'il ait à le reposer chaque matin.

### User

Le vendeur au comptoir, qui passe sa journée dans les listes de dossiers et de lots. Le propriétaire, qui balaie des volumes plus larges et lit davantage sur un même écran.

### Content

La section « Apparence » du profil propose trois choix de thème présentés côte à côte, « Clair », « Sombre » et « Système », le choix courant étant mis en évidence. Le thème système suit le réglage de la machine et vaut par défaut. En dessous, un interrupteur « Sidebar ouverte par défaut » et un sélecteur « Éléments par page » offrant 10, 20 ou 50, réglé sur 20 au départ. Le thème s'applique dès le clic ; les deux autres choix s'enregistrent par un bouton et sont confirmés par « Preferences d'affichage sauvegardees ».

La barre latérale, elle, s'ouvre au survol de la souris et se referme quand la souris la quitte si elle était repliée.

## Notes techniques

`user_preferences` (migration `041_create_user_preferences.sql`) porte une ligne par utilisateur, protégée par une politique « chacun ne voit que la sienne » : `theme` (`light | dark | system`, défaut `system`), `sidebar_default_open` (défaut `false`), `items_per_page` (contrainte CHECK sur 10, 20 ou 50, défaut 20), `notif_in_app`, `notif_email_digest`.

`src/components/profile/profile-appearance-section.tsx:85` appelle `setTheme(value)` de `next-themes` puis persiste la valeur ; le provider est monté dans `src/app/layout.tsx` avec `attribute="class"`, `defaultTheme="system"` et `enableSystem`, sur des variables CSS en espace OKLCH (R-036). Les deux autres préférences ne sont relues par personne : `(dashboard)/layout.tsx` force `<SidebarProvider defaultOpen={false}>`, et toutes les listes lisent `searchParams.size` avec le défaut `"20"` codé en dur. `HoverSidebar` gère l'ouverture au survol.
