---
id: F-002
slug: piece-identite-bloquante
title: Enregistrer la pièce d'identité d'un client et la rendre bloquante
epic: E-001
surface: risquee
domaine: [DOM-001, DOM-002]
dependencies: [F-001]
personas: [PER-002, PER-004]
---

# Objectif

Aucune opération ne s'ouvre sans une pièce d'identité enregistrée et non expirée : obligation réglementaire du rachat de métaux précieux. Le verdict se calcule tout seul à partir des pièces, et il n'est jamais saisi à la main.

## Intention

Aujourd'hui le vendeur regarde la pièce, la rend au client et ouvre le dossier : rien ne garde trace de ce qu'il a vu, et rien ne l'arrête si la pièce est périmée. En cas de contrôle, le comptoir n'a aucune preuve à produire.

La pièce devient donc une condition d'ouverture, tenue par l'application et non par la mémoire du vendeur. Le refus tombe au plus tôt, avant que l'or ne soit pesé et chiffré, pour que le vendeur ne s'engage pas sur un prix qu'il devra retirer devant le client.

Le caractère valide d'un client est une date de péremption, pas une décision. Une case cochée à la main serait juste le jour où on la coche et fausse le lendemain. Le recalcul à chaque ajout, modification ou suppression de pièce est le seul moyen pour que le verdict soit exact au moment précis où on le lit, sans que personne n'ait à repasser derrière.

## Hors-scope

- la lecture automatique de la pièce : le vendeur saisit le type, le numéro, les dates et la nationalité à la main
- la vérification de l'authenticité de la pièce auprès d'un service officiel : l'application enregistre ce que le vendeur a vu, elle ne l'authentifie pas
- le rappel émis avant que l'échéance ne tombe, qui relève d'une capacité distincte
- le client professionnel, dont l'identification passerait par la raison sociale

## Cas d'erreur

- la seule pièce enregistrée porte une date d'expiration déjà passée : le client bascule sur « Non valide », l'ouverture d'un dossier est refusée avec le motif « La pièce d'identité du client est expirée », et le client disparaît du sélecteur de client de la page Dossiers
- la pièce expire alors qu'un dossier est déjà ouvert : la validation du dossier est refusée avec « Le client n'est plus valide. Veuillez vérifier sa pièce d'identité avant de valider le dossier. »

## Brief produit

### Purpose

Rendre la pièce d'identité opposable : elle conditionne l'ouverture d'un dossier, sa trace survit au départ du client, et sa péremption se constate sans intervention.

### User

Le vendeur au comptoir, qui reçoit le client et chiffre son or, et qui doit savoir avant de peser s'il peut ouvrir. Le client particulier, qui présente la pièce et dont l'identité doit être établie pour que l'opération soit régulière.

### Content

Type de pièce (carte nationale d'identité, passeport, titre de séjour, permis de conduire), numéro, dates de délivrance et d'expiration, nationalité (Française par défaut) et la photo de la pièce. La date d'expiration est le seul champ qui bloque. La première pièce enregistrée devient la pièce principale du client, et un client ne peut en avoir qu'une.

Le blocage se dit à trois endroits : le bouton de création de dossier sur la fiche, qui devient inactif et affiche son motif ; le sélecteur de client de la page Dossiers, qui ne propose que des clients valides ; la validation d'un dossier, qui refuse si la pièce a expiré entre-temps.

## Notes techniques

Table `client_identity_documents`, rattachée par `client_id` (`supabase/migrations/004_create_clients.sql:75`), index unique partiel `unique_primary_doc_per_client`. Le déclencheur `update_client_validity_on_doc_change` recalcule `clients.is_valid` en cherchant une pièce dont `expiry_date >= CURRENT_DATE` : la migration `078` a élargi ce test à n'importe quelle pièce, plus seulement la principale (R-045). La photo est déposée dans le compartiment privé `identity-documents` et relue par URL signée de 300 secondes (R-025). Gardes d'interface dans `src/components/clients/client-detail-page.tsx:114-117,353-374` et `src/app/(dashboard)/dossiers/page.tsx:29-32` ; garde serveur dans `finaliserDossierAction` (`src/lib/actions/finalize-actions.ts:232-234`), conformément à R-029 qui veut l'autorisation tenue au plus près de la donnée.
