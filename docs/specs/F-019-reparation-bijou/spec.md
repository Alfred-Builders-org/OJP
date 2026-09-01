---
id: F-019
slug: reparation-bijou
title: Envoyer un bijou en réparation et reporter le coût sur son prix de vente
epic: E-006
domaine: [DOM-006, DOM-008]
surface: standard
dependencies: [F-018]
personas: [PER-002]
---

# Objectif

Un bijou remis en état coûte, et ce coût doit se retrouver dans le prix demandé. L'aller-retour chez le réparateur se note sur la fiche de l'article, et ce qu'il a coûté suit l'article jusqu'à la vente.

## Intention

Un fermoir cassé, une pierre à resserrer, un polissage : beaucoup de pièces reprises au comptoir ne sont vendables qu'après un passage à l'atelier. Ce passage coûte quelques dizaines d'euros, et ces euros sont aujourd'hui perdus de vue. Le prix affiché en vitrine est celui qu'on avait estimé au rachat, avant la réparation ; la marge s'en va sans que personne ne le voie, réparation après réparation.

En notant l'envoi et le retour sur la fiche de l'article, deux choses deviennent vraies en même temps. La pièce est visiblement indisponible pendant qu'elle est chez le réparateur, ce qui évite de la promettre à un client. Et quand elle revient, ce qu'on a réellement payé s'ajoute de lui-même au prix demandé, sans que le vendeur ait à s'en souvenir ni à refaire le calcul devant le client.

Le montant réel prime sur le devis : on estime au départ pour décider si la remise en état vaut le coup, on enregistre au retour ce qui a été facturé, et c'est ce dernier chiffre qui compte.

## Hors-scope

- le référentiel des réparateurs et le suivi de leurs délais : la réparation se note sur le bijou, elle ne crée pas de partenaire
- les réparations vendues à un client sur son propre bijou : ce périmètre ne couvre que les pièces du stock de la maison
- la vente elle-même, qui reprend le prix ainsi majoré mais se conclut dans son propre périmètre

## Cas d'erreur

- un bijou déjà parti chez le réparateur ne peut pas repartir une seconde fois : un seul aller-retour en cours est admis par pièce, et l'envoi n'est plus proposé tant que le retour n'a pas été enregistré

## Brief produit

### Purpose

Rendre visible qu'une pièce est à l'atelier, et faire en sorte que ce qu'elle a coûté à remettre en état se retrouve dans son prix sans effort de mémoire.

### User

Le vendeur au comptoir, qui confie la pièce au réparateur, la récupère et la propose ensuite à la vente.

### Content

À l'envoi : une description de la réparation (par exemple « Remplacement du fermoir, polissage... ») et un coût estimé en euros. Au retour : le coût réel en euros, proposé d'emblée au montant estimé, et des observations libres. La fiche garde l'historique des réparations de la pièce, chacune marquée « En cours » ou « Terminée ». Quand la pièce est ajoutée à une vente, le prix proposé est son prix de revente augmenté de la somme des coûts réels de ses réparations, et ce supplément reste identifié sur la ligne de vente.

## Notes techniques

Table `reparations` (migration `047_create_reparations.sql`) : `bijou_id` vers `bijoux_stock`, `description`, `cout_estime`, `cout_reel`, `notes`, `date_envoi` (defaut `now()`), `date_retour`, `statut` contraint a `en_cours` / `terminee`. L'unicite d'une reparation active tient a l'index unique partiel `one_active_repair_per_bijou ON reparations(bijou_id) WHERE statut = 'en_cours'` ; cote interface, le bouton d'envoi n'est rendu que si `bijou.statut === "en_stock"` (`stock-detail-page.tsx:211`).

`envoi-reparation-dialog.tsx` insere la ligne puis passe `bijoux_stock.statut` a `en_reparation`. `retour-reparation-dialog.tsx` pre-remplit `coutReel` avec `coutEstime`, ecrit `cout_reel`, `notes`, `date_retour`, `statut = 'terminee'`, puis repasse le bijou en `en_stock`.

Le report du cout est calcule dans `src/components/ventes/stock-picker-dialog.tsx:126-130` (`reparationsMap` reduit sur `cout_reel`) et applique en `:168` : `prixVente = Math.round((prix_revente + coutReparation) * 100) / 100`, avec `cout_reparation` persiste sur `vente_lignes` (migration `048_vente_ligne_cout_reparation.sql`). Ce meme `prixVente` sert d'assiette au calcul de TVA sur marge ou de TFOP selon l'origine de l'article.
