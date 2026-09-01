---
id: F-051
slug: recherche-globale
title: Retrouver n'importe quel client, dossier ou lot depuis une palette de recherche
epic: E-018
surface: standard
domaine: [DOM-001, DOM-003, DOM-004]
dependencies: [F-001, F-005]
personas: [PER-002, PER-001]
---

# Objectif

Un raccourci clavier, une frappe, le bon écran : une palette disponible partout retrouve un client, un dossier, un lot de rachat, une vente, un bijou en stock ou un produit d'investissement. Elle sert aussi de raccourci vers les créations courantes et les grandes sections de l'application.

## Intention

Le vendeur a le client devant lui et tape son nom vite, souvent sans accent et parfois mal orthographié. S'il ne le retrouve pas, il en crée un second, et le fichier client se dédouble sans que personne ne s'en aperçoive avant l'inventaire.

La recherche est donc conçue pour pardonner : le nom se retrouve avec ou sans accent, sous sa forme fléchie, et le numéro de téléphone ou l'adresse électronique servent de repli. Elle est aussi conçue pour ne pas faire attendre : elle se déclenche à la frappe, dès deux caractères, et rend au plus cinq propositions par famille pour rester lisible.

Enfin, elle vaut comme raccourci de navigation : ouvrir un nouveau client ou aller aux lots sans chercher l'entrée dans le menu fait gagner à chaque opération quelques secondes qui, sur une journée de comptoir, comptent.

## Hors-scope

- la recherche dans les documents joints et le contenu des pièces contractuelles : seuls les objets du métier sont indexés
- les filtres avancés et les tris, qui restent l'affaire des écrans de liste
- la mémorisation des recherches passées ou des objets récemment consultés

## Cas d'erreur

- la session a expiré pendant la frappe : la recherche ne rend aucune donnée, plutôt que de renvoyer une page de connexion déguisée en résultat
- aucun objet ne correspond à la frappe : la palette affiche « Aucun résultat pour « Dupont » » au lieu d'une liste vide sans explication
- un même poste enchaîne les recherches au-delà du seuil de la minute : les recherches suivantes ne rendent rien jusqu'à la minute suivante

## Brief produit

### Purpose

Retrouver en quelques frappes n'importe quel objet du métier, depuis n'importe quel écran, et y aller directement.

### User

Le vendeur au comptoir, qui cherche un client pendant que celui-ci attend. Le propriétaire, qui retrouve un lot ou une vente sans passer par les listes.

### Content

Un champ « Rechercher ou taper une commande... » ouvert par un raccourci clavier, parcouru aux flèches et validé par Entrée.

Hors frappe, la palette propose les créations courantes et les grandes sections : nouveau client, nouveau dossier, tableau de bord, lots, stock, confié d'achat, ventes, clients, dossiers, chacun avec son raccourci.

Dès deux caractères, elle rend six familles de résultats limitées à cinq propositions chacune : clients, dossiers, lots de rachat, ventes, bijoux en stock, or d'investissement. Chaque proposition porte un titre, un sous-titre et mène directement à la fiche.

## Notes techniques

La palette est montée globalement dans `src/app/(dashboard)/layout.tsx` et s'ouvre par ⌘K / Ctrl+K (`src/components/dashboard/command-palette.tsx:81`).

Le champ interroge `GET /api/search?q=` : moins de deux caractères rend un tableau vide sans toucher la base, `apiLimiter` (20 requêtes par minute et par adresse) s'applique avant le contrôle de session, et l'absence de session rend 401. La route appelle la RPC `search_global(query, user_role)` (migrations `042` et `092`), qui rend `entity_type, id, title, subtitle, url` en six blocs `LIMIT 5`.

Le bloc clients combine `search_vector @@ plainto_tsquery('french', …)` et un repli `ILIKE` sur `first_name`, `last_name`, `email`, `phone`, les correspondances plein texte étant classées en premier. Le vecteur est reconstruit par le déclencheur `clients_search_vector` (migration `004`).
