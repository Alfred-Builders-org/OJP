# Courriels d'authentification

Les messages de connexion — mot de passe oublié, invitation d'un utilisateur,
confirmation d'adresse — partaient jusqu'ici par le SMTP de Supabase, avec ses
gabarits d'origine : en anglais, sans logo, signés « Supabase Auth ». Un
commerçant qui demandait un nouveau mot de passe pour son ERP recevait un
message ne ressemblant à rien de la boutique.

Ils passent désormais par **Resend**, avec la mise en forme maison.

## Comment ça marche

Supabase Auth n'envoie plus rien lui-même : il appelle une route de
l'application, le *Send Email Hook*, qui compose le message et le confie à
Resend.

```
Supabase Auth  ──POST signé──▶  /api/auth/email  ──▶  Resend  ──▶  destinataire
```

| Fichier | Rôle |
|---|---|
| `src/app/api/auth/email/route.ts` | Vérifie la signature, compose, envoie, journalise |
| `src/lib/email/auth-templates.ts` | Sujet, texte et destination de chaque action |
| `src/lib/email/auth-email.tsx` | Le gabarit : logo, titre, bouton, mentions |

La route n'est pas authentifiée au sens de l'application — l'appelant est
Supabase, pas un utilisateur. C'est la signature du webhook qui fait foi
(HMAC-SHA256 au format *standard-webhooks*, horodatage toléré à cinq minutes).
Sans secret configuré, la route refuse tout.

Le lien du courriel passe par `/auth/callback`, qui vérifie le jeton puis
redirige selon l'action : `/reset-password` pour une réinitialisation ou une
invitation, `/dashboard` pour une confirmation d'inscription, `/profile` pour un
changement d'adresse.

Chaque envoi est inscrit dans `email_logs`, sous le type `auth_<action>` — c'est
là qu'on regarde quand quelqu'un dit n'avoir rien reçu.

## Ce qu'il reste à configurer

Trois variables, sur **chaque** environnement Railway (`staging` et
`production`) :

| Variable | Valeur |
|---|---|
| `RESEND_API_KEY` | La clé du compte Resend |
| `SEND_EMAIL_HOOK_SECRET` | Le secret généré par Supabase, forme `v1,whsec_…` |
| `NEXT_PUBLIC_APP_URL` | `https://staging.oraujusteprix.fr` / l'adresse de production |

Puis, dans le tableau de bord Supabase de **chaque** projet
(`ojp-test` et `ojp-prod`) :

1. **Authentication → Hooks → Send Email Hook**
2. Type : *HTTPS*
3. URL : `https://<adresse-de-l-environnement>/api/auth/email`
4. Copier le secret généré dans `SEND_EMAIL_HOOK_SECRET`
5. Activer

Tant que le hook n'est pas activé, Supabase continue d'envoyer ses propres
gabarits : rien ne casse, mais rien ne change non plus.

L'adresse d'expédition vient des paramètres de la société
(*Paramètres → Société → e-mail expéditeur*), avec `RESEND_FROM_EMAIL` en repli.
Le domaine doit être vérifié chez Resend, sans quoi les messages seront refusés.

## Vérifier

Une fois configuré, demander une réinitialisation depuis l'écran de connexion.
Le message doit arriver en français, au nom de la boutique, avec le bouton
« Choisir un nouveau mot de passe ». En cas d'absence, regarder `email_logs`
puis le journal de l'environnement Railway : la route trace ce qu'elle refuse.
