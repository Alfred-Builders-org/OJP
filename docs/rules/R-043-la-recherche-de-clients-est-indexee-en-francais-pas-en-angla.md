---
id: R-043
title: La recherche de clients est indexée en français, pas en anglais
statement: Le vecteur de recherche d'un client est reconstruit à chaque écriture avec la configuration linguistique française, de sorte que les accents et les formes fléchies des noms et des adresses se retrouvent quelle que soit la façon dont l'utilisateur les saisit.
enforcement: constraint
surface: recherche
priority: 2
d025_class: coherence_cross_entite
status: active
risk: standard
source_feature: F-051
---

## Où elle est tenue

`supabase/migrations/004_create_clients.sql` : la colonne `search_vector`, la fonction `clients_search_vector_update`, et le déclencheur `clients_search_vector` qui la reconstruit à chaque écriture.

## Pourquoi

La configuration par défaut de PostgreSQL est l'anglais. Sur un fichier client français, elle ne sait pas que « Dupré » et « Dupre » désignent la même personne, ni traiter les mots vides de la langue.

Un vendeur cherche un client devant lui, souvent en tapant vite et sans accent. Une recherche qui ne rend rien sur « Dupre » lui fait croire que le client n'existe pas, et il en crée un second.

Le vecteur est reconstruit par déclencheur plutôt que calculé à la lecture : la recherche doit rester rapide sur la frappe, pas seulement correcte.
