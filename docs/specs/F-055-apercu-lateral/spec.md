---
id: F-055
slug: apercu-lateral
title: Consulter une fiche sans quitter la liste où on l'a trouvée
epic: E-018
surface: standard
domaine: [DOM-001, DOM-003, DOM-004, DOM-005]
dependencies: [F-001, F-005]
personas: [PER-002]
---

# Objectif

Ouvrir un aperçu latéral d'un client, d'un dossier, d'un lot ou d'une référence depuis n'importe quelle liste, et le refermer sans avoir perdu sa place ni ses filtres. L'aperçu se termine par un passage vers la page complète quand la consultation ne suffit plus.

## Intention

Vérifier une information demande souvent d'ouvrir une fiche, de la lire trois secondes et de revenir. Sans aperçu, ce détour coûte le rechargement de la liste, la perte de la page où l'on était, et la ressaisie des filtres qu'on avait posés. Sur une recherche menée pendant qu'un client attend, le détour se paie en minutes.

L'aperçu répond au cas majoritaire, la consultation, et laisse la page complète au cas minoritaire, l'action. La liste reste montée derrière, intacte, ce qui rend le geste réversible : on ouvre, on lit, on referme, on continue.

Il respecte aussi les habitudes de navigation : celui qui veut vraiment un second onglet l'obtient par le clic assorti de la touche de commande, comme partout ailleurs.

## Hors-scope

- la modification depuis l'aperçu : il est en lecture seule et renvoie vers la page complète pour agir
- l'aperçu d'une vente, d'une fonderie ou d'un article de stock, qui n'annonce à ce jour qu'une disponibilité à venir
- l'ouverture de plusieurs aperçus côte à côte ou leur empilement

## Cas d'erreur

- l'aperçu demandé porte sur une vente, une fonderie ou un article de stock : le tiroir s'ouvre sur un texte annonçant que l'aperçu sera bientôt disponible, et rien d'autre ne s'affiche
- le contenu de l'aperçu tarde à arriver : le tiroir montre une silhouette d'attente et ne reste jamais vide

## Brief produit

### Purpose

Rendre la consultation gratuite : lire une fiche ne doit coûter ni sa place dans la liste, ni ses filtres, ni un aller-retour.

### User

Le vendeur au comptoir, qui vérifie une information en présence du client et doit reprendre exactement là où il en était.

### Content

Un tiroir qui s'ouvre sur le bord droit de l'écran, sur une largeur limitée, avec son propre défilement. Son titre nomme l'entité consultée : Client, Dossier, Lot, Vente, Référence, Fonderie, Stock.

Il se termine par un bouton pleine largeur « Ouvrir la page complète », qui referme le tiroir et emmène sur la fiche.

Il s'ouvre au clic simple depuis la fiche client et depuis les tableaux de dossiers et de lots. Le clic assorti de la touche de commande ou de contrôle ouvre au contraire un véritable nouvel onglet. Derrière le tiroir, la liste, sa pagination et ses filtres restent en place.

## Notes techniques

`PreviewDrawerProvider` (`src/providers/preview-drawer-provider.tsx`) est monté dans le layout du dashboard et expose `openPreview(type, id)` / `closePreview()` via `src/hooks/use-preview-drawer.ts`.

Le tiroir est un `Sheet` en `side="right"`, `sm:max-w-lg`, à défilement interne. Les contenus sont chargés en `lazy` derrière un `PreviewSkeleton`.

`preview-router.tsx:56-70` n'implémente que quatre types : `client`, `dossier`, `lot`, `reference`. Les trois autres rendent un texte d'attente, `vente`, `fonderie` et `stock`.

`PreviewLink` laisse passer `metaKey` / `ctrlKey` vers la navigation native et intercepte le clic simple ; les tableaux appellent `openPreview` directement sur la ligne. Rien n'est démonté dans la page sous-jacente.
