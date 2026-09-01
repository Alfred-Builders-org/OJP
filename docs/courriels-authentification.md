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

**L'invitation, elle, ne passe pas par là.** Elle est déclenchée depuis l'écran
des utilisateurs : c'est l'application qui sait qu'elle doit écrire, et rien
n'oblige à faire un détour par Supabase. Elle fabrique le lien, envoie le
message elle-même, et n'a donc besoin ni du hook ni de son secret.

```
/api/users/invite  ──▶  lien Supabase  ──▶  Resend  ──▶  destinataire
```

| Fichier | Rôle |
|---|---|
| `src/app/api/auth/email/route.ts` | Vérifie la signature, compose, envoie, journalise |
| `src/lib/email/envoyer-invitation.ts` | L'invitation, envoyée par l'application |
| `src/lib/email/auth-templates.ts` | Sujet, texte et destination de chaque action |
| `src/lib/email/auth-email.tsx` | Le gabarit : logo, titre, bouton, mentions |

Le service d'envoi intégré de Supabase n'écrit qu'aux membres de l'organisation
du projet. Une invitation ou une réinitialisation adressée à une cliente n'en
serait jamais partie — sans que rien ne le signale. D'où Resend des deux côtés.

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

## Configuration

Les variables sont posées sur **chaque** environnement Railway (`staging` et
`production`) :

| Variable | Valeur |
|---|---|
| `RESEND_API_KEY` | La clé du compte Resend. `RESEND_KEY` est lue en repli |
| `NEXT_PUBLIC_APP_URL` | `https://staging.oraujusteprix.fr` / `https://app.oraujusteprix.fr` |
| `RESEND_FROM_EMAIL` | `contact@notif.oraujusteprix.fr` |
| `SEND_EMAIL_HOOK_SECRET` | Le secret du hook, forme `v1,whsec_…`. Invitation exclue |

L'adresse d'expédition vient des paramètres de la société
(*Paramètres → Société → e-mail expéditeur*), avec `RESEND_FROM_EMAIL` en repli.
Le domaine doit être vérifié chez Resend, sans quoi les messages sont refusés :
c'est `notif.oraujusteprix.fr`. Une adresse Gmail ne peut pas servir
d'expéditeur — elle n'est pas vérifiable.

### Le hook, pour ce que Supabase déclenche seul

Le mot de passe oublié part de l'écran de connexion : c'est Supabase qui écrit,
pas l'application. Il faut donc le hook. Dans le tableau de bord de **chaque**
projet (branche `staging` et `ojp-prod`) :

1. **Authentication → Hooks → Send Email Hook**
2. Type : *HTTPS*
3. URL : `https://<adresse-de-l-environnement>/api/auth/email`
4. Le même secret que `SEND_EMAIL_HOOK_SECRET`
5. Activer

Ou, depuis le dépôt, `[auth.hook.send_email]` de `supabase/config.toml` :

```
SUPABASE_AUTH_SITE_URL=https://app.oraujusteprix.fr \
SUPABASE_AUTH_HOOK_SEND_EMAIL_URI=https://app.oraujusteprix.fr/api/auth/email \
SEND_EMAIL_HOOK_SECRET='v1,whsec_…' \
  npx supabase config push --project-ref ycpjvznykyukffqlnqzo
```

**Poser le secret sur Railway avant d'activer le hook.** Dans l'autre ordre, la
route répond 500 faute de secret, Supabase considère l'envoi en échec, et le
mot de passe oublié cesse de fonctionner le temps du décalage.

`config push` remplace **toute** la section `[auth]` : lire le diff qu'il
affiche avant de confirmer.

## Vérifier

Une fois configuré, demander une réinitialisation depuis l'écran de connexion.
Le message doit arriver en français, au nom de la boutique, avec le bouton
« Choisir un nouveau mot de passe ». En cas d'absence, regarder `email_logs`
puis le journal de l'environnement Railway : la route trace ce qu'elle refuse.
