---
id: F-004
slug: documents-du-client
title: Retrouver au même endroit tous les documents émis pour un client
epic: E-001
surface: standard
domaine: [DOM-001, DOM-012]
dependencies: [F-001, F-035]
personas: [PER-002, PER-004]
---

# Objectif

Rassembler sur la fiche client les pièces produites au fil de ses opérations. Chacune se relit et se remet au client depuis cet endroit unique, sans jamais transiter par une adresse publique.

## Intention

Un client qui revient au comptoir demande souvent la même chose : un double de sa quittance, le devis qu'il a reçu la semaine passée, la facture qui accompagne son achat. Ces pièces ont été émises à des moments différents, dans des opérations différentes, et sans point de rassemblement il faut retrouver le bon dossier avant de retrouver le bon document, pendant que le client attend.

La fiche est l'endroit naturel de ce rassemblement, parce que c'est déjà là que le vendeur se rend quand il reconnaît quelqu'un. Il y voit d'un bloc ce qui a été remis, de quel type, à quelle date, et où en est chaque pièce : en attente de réponse, acceptée, signée, réglée, annulée. Cela répond aussi à une question du propriétaire, qui est de savoir ce que le comptoir a effectivement remis à une personne donnée.

Ces pièces portent des contrats, des montants et des identités. Elles ne peuvent donc pas dormir derrière une adresse devinable ou partageable : chaque lecture est délivrée à un utilisateur connecté, pour un temps court, et l'adresse ne survit pas à la consultation.

## Hors-scope

- l'émission des documents, qui a lieu au fil des opérations : la fiche ne fait que les retrouver
- l'envoi des pièces au client par courriel, qui appartient au parcours de l'opération concernée
- les pièces d'identité du client, tenues sur une carte distincte de la fiche et soumises à leurs propres règles

## Cas d'erreur

- la pièce ne peut pas être remise au moment du téléchargement : l'opération échoue, « Impossible de télécharger le document » s'affiche, et aucune adresse publique n'est proposée en remplacement

## Brief produit

### Purpose

Faire de la fiche client le point unique où l'on retrouve, relit et remet toute pièce déjà produite pour cette personne, sans jamais exposer ces pièces au public.

### User

Le vendeur au comptoir, qui doit produire un double en quelques secondes pendant que le client attend. Le client particulier, destinataire de ces pièces et qui ne connaît le comptoir qu'à travers elles.

### Content

Un bloc « Documents du client » sur la fiche, listant les pièces de la plus récente à la plus ancienne, avec quatre colonnes triables : numéro, type, statut, date. Les types couverts sont la quittance, le contrat, le devis, le contrat de dépôt-vente, le confié, la quittance de dépôt-vente, la facture, l'acompte, le solde, le bon de commande, le bon de livraison et le remboursement. Les statuts sont en attente, accepté, refusé, signé, réglé, émis, annulé.

Chaque ligne ouvre un menu d'actions : consulter la pièce dans une visionneuse, la télécharger, l'imprimer.

## Notes techniques

`src/app/(dashboard)/clients/[id]/page.tsx:36-40` charge tous les `documents` du client (`.eq("client_id", id)`, tri décroissant sur la date) et les passe à `ClientDetailPage`, qui les rend via `<DocumentsTable>` (`src/components/documents/documents-table.tsx`). Libellés issus de `TYPE_CONFIG` et `STATUS_CONFIG`. Le fichier vit dans le compartiment privé `documents` déclaré par `supabase/migrations/052_*.sql` : la lecture passe par une URL signée à durée limitée, jamais par un lien direct (R-025). Messages d'échec dans `documents-table.tsx:135` et `:402`.
