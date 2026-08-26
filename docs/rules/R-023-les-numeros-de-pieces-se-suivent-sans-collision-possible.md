---
id: R-023
title: Les numéros de pièces se suivent sans collision possible
statement: Dossiers, lots et documents reçoivent un numéro séquentiel annuel par type, attribué sous verrou consultatif de transaction : deux saisies simultanées ne peuvent pas obtenir le même numéro.
enforcement: constraint
surface: documents
priority: 1
d025_class: invariant_etat
status: active
risk: standard
source_feature: F-006
---
