---
id: F-008
slug: verrouillage-lot-hors-brouillon
title: Verrouiller un lot dès qu'il quitte le brouillon
epic: E-002
domaine: [DOM-004, DOM-005]
surface: standard
dependencies: [F-007]
personas: [PER-002]
---

# Objectif

Un lot dont le devis est parti ne change plus de contenu. Dès qu'il quitte le brouillon, ses références sont figées et son état avance sans jamais revenir en arrière.

## Intention

Le brouillon est le moment où l'on discute : on pose les objets, on pèse, on retire une bague que le client préfère garder, on en ajoute une autre trouvée au fond du sac. Tant que rien n'est sorti du comptoir, ce va-et-vient est sain.

Le devis change la nature de la chose. Le montant qu'il porte a été calculé à partir des lignes présentes au moment de son émission, et le client repart avec ce document en main. Ajouter une ligne après coup produirait un total qui ne correspond plus au papier remis, et retirer une ligne ferait pire : le comptoir annoncerait un prix qu'il ne peut plus justifier. Le vendeur perdrait alors le seul argument qui tient au retour du client, celui de montrer d'où vient chaque euro.

Corriger un lot sorti du brouillon suppose donc de repartir d'un lot neuf, ce qui laisse une trace, plutôt que de retoucher discrètement l'ancien. De la même manière, un lot ne recule pas : un lot finalisé a produit des pièces et souvent des mouvements d'argent, et le remettre en cours rendrait ces pièces fausses sans que rien ne le signale.

## Hors-scope

- le chiffrage lui-même, qui se fait librement tant que le lot est en brouillon
- le parcours qui fait sortir le lot du brouillon (émission du devis, réponse du client, délai légal), tenu par les périmètres voisins
- la correction d'un lot déjà sorti du brouillon, qui passe par l'ouverture d'un nouveau lot et non par une reprise de l'ancien

## Cas d'erreur

- une remise en arrière est tentée sur un lot déjà finalisé : elle est rejetée et le motif donné est « Transition de statut invalide: finalise → en_cours »

## Brief produit

### Purpose

Rendre le contenu d'un lot opposable dès qu'il a servi à produire un document : ce que le client tient en main correspond exactement à ce que le lot contient, hier comme dans six mois.

### User

Le vendeur au comptoir, qui doit pouvoir défendre le montant annoncé référence par référence. Le propriétaire, qui répond d'un devis émis en cas de contestation ou de contrôle.

### Content

L'état du lot commande ce que l'écran propose : en brouillon, le vendeur ajoute, modifie et retire des références ; hors brouillon, ces gestes ne lui sont plus offerts et la fiche du lot devient une pièce à lire. Le chemin d'états est unique et sans retour, et la façon dont le lot s'est terminé se lit à part.

## Notes techniques

Garde d'interface dans `src/components/lots/lot-detail-page.tsx` : le formulaire d'ajout ou d'édition de référence et le bouton de suppression ne sont rendus que si `lot.status === "brouillon"`. Côté dossier, `src/components/dossiers/dossier-detail-page.tsx:197` refuse l'ajout d'un lot hors brouillon. Le trigger `validate_lot_status_transition` (`supabase/migrations/081_simplify_lot_statuses.sql`) n'autorise que `brouillon -> en_cours | finalise` et `en_cours -> finalise`, et lève `Transition de statut invalide: % → %` sinon ; la même migration a ramené `lots_status_check` à trois valeurs et ajouté la colonne `outcome` (`complete | refuse | retracte | annule`).

Limite connue, à traiter au dev : R-013 est tenue par l'écran et par rien d'autre. Aucune contrainte ni trigger n'empêche un `INSERT`, `UPDATE` ou `DELETE` sur `lot_references` pour un lot déjà `en_cours`, et les policies RLS de `lot_references` ouvrent l'écriture à tout utilisateur actif. ADR-003 veut la règle en base, ce qui appelle un trigger `BEFORE INSERT OR UPDATE OR DELETE ON lot_references` qui relise `lots.status`.
