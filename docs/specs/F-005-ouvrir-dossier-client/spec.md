---
id: F-005
slug: ouvrir-dossier-client
title: Ouvrir un dossier client et y regrouper plusieurs opérations
epic: E-002
domaine: [DOM-001, DOM-003]
surface: standard
dependencies: [F-002]
personas: [PER-002]
---

# Objectif

Un client qui vient avec plusieurs opérations le même jour n'a qu'un dossier. Ce dossier ne s'ouvre que sur un client dont la pièce d'identité est en règle, et il avance de l'ouverture à la finalisation sans jamais revenir en arrière.

## Intention

Un client se présente au comptoir avec trois bagues, un lingot et une pièce à revendre. Sans dossier, chacune de ces opérations vit sa vie : trois numéros sans lien, trois documents remis séparément, et personne ne sait, deux mois plus tard, que tout cela s'est passé le même après-midi avec la même personne.

Le dossier est le contenant de ce passage. Il porte le client une fois pour toutes, regroupe les lots ouverts pendant la visite, et affiche au vendeur ce qui reste à faire dessus : un devis parti sans réponse, un délai de rétractation en cours, un document en attente, un paiement qui n'est pas encore arrivé. Le propriétaire retrouve ainsi un passage entier en un écran, au lieu de recoller des lignes entre elles.

Il porte aussi la conformité du comptoir. C'est à l'ouverture du dossier, avant tout chiffrage, que la validité de la pièce d'identité est exigée : le vendeur ne doit pas annoncer un prix qu'il devra retirer parce que la carte du client était périmée. Et une fois le dossier finalisé, il ne se rouvre pas : les documents remis au client et les mouvements d'argent enregistrés resteraient sinon en désaccord avec son contenu.

## Hors-scope

- le chiffrage des objets apportés, qui se fait référence par référence à l'intérieur d'un lot
- la saisie de la fiche du client et de sa pièce d'identité, faite en amont sur la fiche elle-même
- l'envoi du devis, la réponse du client et le décompte du délai légal, qui appartiennent aux périmètres voisins

## Cas d'erreur

- le client rattaché au dossier n'est plus valide au moment de finaliser : la finalisation est refusée et le vendeur lit « Le client n'est plus valide. Veuillez vérifier sa pièce d'identité avant de valider le dossier. »
- un lot est ajouté à un dossier qui a quitté le brouillon : l'ajout est refusé avec « Impossible d'ajouter un lot à un dossier validé. Veuillez créer un nouveau dossier. »

## Brief produit

### Purpose

Donner à un passage de client un contenant unique : un dossier numéroté, rattaché à une personne identifiée, qui regroupe toutes les opérations de la visite et dit à tout moment ce qui reste en attente dessus.

### User

Le vendeur au comptoir, qui ouvre le dossier devant le client, y accroche les lots de la visite et le finalise. Le propriétaire, qui balaie la liste des dossiers et repère ceux qui appellent une action.

### Content

Le dossier porte un numéro attribué à sa création, le client choisi parmi ceux dont la pièce d'identité est en règle, un état d'avancement, des notes libres, et la liste des lots ouverts dessus (rachat, vente, dépôt-vente). L'écran de création rappelle le téléphone, l'adresse électronique et la ville du client choisi, pour que le vendeur vérifie de visu qu'il s'agit bien de la personne en face de lui. La liste des dossiers affiche pour chacun le nombre d'actions en attente.

## Notes techniques

Table `dossiers` (`supabase/migrations/007_create_dossiers.sql`), colonne `client_id` en clé étrangère `ON DELETE RESTRICT`, statut `brouillon | en_cours | finalise`. Le sélecteur de client de `src/app/(dashboard)/dossiers/page.tsx` filtre sur `is_valid = true` ; `finaliserDossierAction` (`src/lib/actions/finalize-actions.ts`) relit `dossier.client.is_valid` avant de traiter les lots, et repositionne le dossier sur `finalise` si tous ses lots le sont, sur `en_cours` sinon. Le trigger `validate_dossier_status_transition` (`056_validate_status_transitions.sql`) tient R-012 en base. Le compteur d'actions en attente est calculé côté serveur dans `dossiers/page.tsx:38-91` à partir des références en `en_retractation`, `devis_envoye`, `en_attente_paiement`, des documents `en_attente` et des lignes de vente `pending` ou `a_commander`.
