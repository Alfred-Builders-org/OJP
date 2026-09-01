import { SignInForm } from "@/components/auth/sign-in-form";

/**
 * `error` arrive de `/auth/callback` quand la verification d'un lien echoue, ou
 * du filet de `RecuperationRedirect` quand Supabase a decrit l'echec dans le
 * fragment. Sans cette prop, l'ecran de connexion s'affichait comme si de rien
 * n'etait : la personne invitee voyait un formulaire dont elle n'a justement pas
 * encore le mot de passe.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <SignInForm lienInvalide={error === "auth" || error === "lien"} />;
}
