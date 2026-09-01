import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PhotoDepot } from "@/components/photos/photo-depot";

export const dynamic = "force-dynamic";

/**
 * Page de prise de vue, ouverte sur le telephone par lecture d'un QR code.
 *
 * Elle vit hors du tableau de bord et hors de l'authentification : c'est la
 * seule maniere d'obtenir la photo en trois gestes — scanner, cadrer, valider.
 * Le jeton de l'URL porte l'autorisation, et il ne donne acces a rien d'autre
 * qu'au depot d'images sur la cible que le poste a designee.
 */
export default async function PhotoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = getSupabaseAdmin();
  const { data: session } = await admin
    .from("photo_sessions")
    .select("libelle, expire_at")
    .eq("token", token)
    .maybeSingle();

  const perimee = session ? new Date(session.expire_at) < new Date() : false;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      {!session ? (
        <Message
          titre="Lien inconnu"
          texte="Ce lien de prise de vue n'existe pas. Affichez-en un nouveau depuis la fiche du lot."
        />
      ) : perimee ? (
        <Message
          titre="Lien expiré"
          texte="Par sécurité, un lien de prise de vue ne vaut que trente minutes. Affichez-en un nouveau depuis la fiche du lot."
        />
      ) : (
        <PhotoDepot token={token} libelle={session.libelle} expireAt={session.expire_at} />
      )}
    </main>
  );
}

function Message({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="my-auto space-y-2 text-center">
      <h1 className="text-xl font-semibold">{titre}</h1>
      <p className="text-sm text-muted-foreground">{texte}</p>
    </div>
  );
}
