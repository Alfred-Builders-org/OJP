---
id: F-001
slug: fiche-client-particulier
title: Créer et tenir à jour la fiche d'un client particulier
epic: E-001
surface: risquee
domaine: [DOM-001]
dependencies: none
personas: [PER-002]
---

# Objectif

Enregistrer l'identité, les coordonnées et l'historique d'un client, seul point d'entrée de toute opération. La fiche porte aussi le verdict qui compte au comptoir : valide, ou pas.

## Intention

Au comptoir, le client est en face du vendeur et l'opération doit démarrer tout de suite. Sans fiche, chaque opération repartirait d'une saisie neuve : le même client existerait en trois exemplaires, ses coordonnées différeraient d'un document à l'autre, et personne ne saurait ce qu'il a déjà vendu ou acheté.

La fiche règle trois choses d'un coup. Elle donne au vendeur un client retrouvable en quelques lettres, même mal orthographiées, parce qu'il tape vite et de mémoire pendant que le client parle. Elle donne au propriétaire un historique consolidé, dossier par dossier, document par document. Et elle affiche sans détour si ce client peut ouvrir une opération aujourd'hui, plutôt que de laisser le vendeur le découvrir après avoir pesé et chiffré.

Le champ obligatoire n'est pas une formalité administrative : une adresse manquante rend un contrat inutilisable, un email manquant empêche d'envoyer le devis. Le refus tombe donc à la saisie, pas au moment d'émettre la pièce.

## Hors-scope

- la pièce d'identité elle-même, sa saisie et son effet bloquant sur les opérations : elle vit sur la fiche mais relève d'une capacité distincte
- le client professionnel : cette fiche ne connaît qu'une personne physique, avec civilité, prénom et nom
- la fusion de deux fiches créées en double pour la même personne

## Cas d'erreur

- l'email saisi n'a pas un format d'adresse : la fiche n'est pas créée et « Format email invalide » s'affiche sous le champ Email
- un champ obligatoire est laissé vide (civilité, prénom, nom, email, adresse, code postal, ville, pays) : la fiche n'est pas créée et le motif s'affiche en rouge sous chaque champ concerné

## Brief produit

### Purpose

Donner au comptoir une identité de client unique, retrouvable et complète, à laquelle toutes les opérations et toutes les pièces se rattachent.

### User

Le vendeur au comptoir, qui crée la fiche pendant que le client est devant lui et qui la retrouve à chaque visite suivante. Le propriétaire, qui y lit l'historique d'une relation.

### Content

Trois blocs à la création. Informations personnelles : civilité, prénom, nom, nom de jeune fille, email, téléphone. Adresse : voie, code postal, ville, pays, la France par défaut. Informations complémentaires : source de l'apport (bouche à oreille, Google, réseaux sociaux, passage en boutique, recommandation, publicité, autre) et notes libres.

Sur la fiche ouverte : le badge de validité collé au nom, l'édition en place de tous les champs, un bloc de notes qui s'enregistre à part, la liste des dossiers du client et l'accès à la création d'un nouveau dossier.

## Notes techniques

Table `clients` créée par `supabase/migrations/004_create_clients.sql`, sans clé étrangère sortante. La recherche s'appuie sur la colonne `search_vector`, reconstruite à chaque écriture par le déclencheur `clients_search_vector_update` avec le dictionnaire `french` et servie par un index GIN (R-043). Le drapeau `is_valid` n'est jamais écrit par l'application : il est recalculé par la base au fil des pièces d'identité (R-045). Validation de formulaire dans `src/lib/validations/client.ts` (`clientSchema`), écrans dans `src/components/clients/`, redirection vers `/clients/{id}` après création.
