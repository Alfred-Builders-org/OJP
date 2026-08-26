---
id: F-035
slug: generation-pdf-contractuels
title: Générer les pièces contractuelles en PDF à l'identité de la société
epic: E-013
surface: risquee
domaine: [DOM-012]
dependencies: [F-006]
personas: [PER-002, PER-004]
---

# Objectif

Produire les douze pièces écrites du métier, numérotées avant d'être mises en forme et portant l'identité de la société réglée en Paramètres. Chaque pièce est déposée dans un espace fermé, d'où elle ne sort que pour un utilisateur connecté.

## Intention

Le client particulier ne se connecte jamais à l'application : tout ce qu'il connaît du comptoir tient dans le papier qu'on lui remet. Une quittance, un contrat, un devis, une facture sont donc le produit de son point de vue, et leur allure engage la maison autant que leur contenu.

Ces pièces doivent aussi tenir des années. Un numéro qui se répète parce que deux vendeurs ont émis au même instant n'est pas un désagrément d'affichage, c'est un problème comptable qui ressort au premier contrôle. Le numéro est donc réservé avant même que la pièce ne soit dessinée : on ne met en forme que ce qui porte déjà son identifiant définitif.

Enfin, ces pièces portent des noms, des adresses, des montants et parfois des numéros de pièce d'identité. Elles ne dorment donc pas derrière une adresse devinable : elles sont rangées dans un espace fermé, et chaque lecture est délivrée à quelqu'un qui a le droit de la demander.

## Hors-scope

- le contenu métier inscrit sur la pièce, poids, titres, prix et délais, décidé par l'opération qui la déclenche
- la vie de la pièce après son émission, acceptation, signature, règlement ou annulation
- le réglage des textes contractuels, des préfixes et de l'apparence, tenu en Paramètres
- l'envoi de la pièce au client par courriel

## Cas d'erreur

- le dépôt de la pièce dans l'espace fermé échoue : la ligne réservée est effacée, la pièce n'apparaît nulle part et aucune trace incomplète ne subsiste
- l'identité de la société n'est pas renseignée en Paramètres : la pièce est tout de même produite, et les champs manquants reprennent l'identité par défaut du comptoir

## Brief produit

### Purpose

Fabriquer des pièces opposables : numérotées sans collision possible, à l'identité exacte de la société, et conservées hors de toute adresse publique.

### User

Le vendeur au comptoir, qui déclenche l'émission au fil de l'opération et remet la pièce au client. Le client particulier, qui ne voit du comptoir que ces documents et les signe.

### Content

Douze types de pièces : quittance de rachat, contrat de rachat, devis de rachat, contrat de dépôt-vente, confié achat, quittance de dépôt-vente, facture de vente, facture d'acompte, facture de solde, bon de commande, bon de livraison, reçu de remboursement après rétractation.

Chaque pièce porte un entête et un pied de page à l'identité de la société : nom, adresse complète, téléphone, forme juridique, SIRET et RCS, plus le logo du comptoir. Elle porte son numéro, attribué avant sa mise en forme.

À l'émission, la quittance de dépôt-vente et le bon de commande naissent au statut « Émis ». Les dix autres types naissent au statut « En attente ».

## Notes techniques

`src/lib/pdf/generate-and-store.ts` enchaîne `refreshSociete()`, l'insertion d'une ligne `documents` avec `numero: ""` (le trigger `generate_document_numero` attribue le numéro sous `pg_advisory_xact_lock`, R-023), le rendu `@react-pdf/renderer`, l'upload dans le bucket privé `documents` sous `{dossierId}/{lotId}/{numero}.pdf`, puis la mise à jour de `storage_path` et l'insertion des liens `document_references`. Un échec d'upload supprime la ligne `documents` réservée. `refreshSociete()` (`src/lib/pdf/blocks.ts:28-36`) recopie `settings.company` dans l'objet mutable `SOCIETE` champ par champ avec repli sur les constantes, tous les gabarits pointant ce même objet. Le logo est un data-URI base64 figé (`src/lib/pdf/logo.ts`). Le bucket est déclaré privé par `supabase/migrations/052_security_hardening.sql` (R-025). Le type `remboursement_retractation` est ajouté par `supabase/migrations/133_document_remboursement_retractation.sql`.
