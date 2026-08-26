---
id: F-037
---

## Impact regles

### MODIFIED R-023

statement: Dossiers, lots et documents reçoivent un numéro séquentiel annuel par type. 11 des 12 types de pièces l'obtiennent sous verrou consultatif de transaction, de sorte que 2 saisies simultanées ne peuvent pas obtenir le même numéro ; le 12e, le bon de livraison, compose le sien côté application à partir du dernier numéro lu, sur le préfixe réglé en paramètres.
raison: La règle affirme aujourd'hui que le préfixe de chaque type est réglable en paramètres et que tout numéro de pièce est attribué sous verrou. Le comportement constaté est plus étroit sur les deux points : seul le bon de livraison relit le préfixe réglé, les onze autres types tenant leur préfixe d'une table fixe ; et ce même bon de livraison est le seul à composer son numéro hors verrou, ce qui laisse une fenêtre de collision là où la règle promet qu'il n'y en a aucune. Redire la règle telle qu'elle est réellement tenue évite qu'une recette conclue à tort qu'un préfixe modifié se répercute sur les douze types.
