import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PHOTOS_MAX_PAR_SESSION, PHOTO_TAILLE_MAX } from "@/types/photo";

/**
 * Depot des photos prises au telephone.
 *
 * Cette route est la seule de l'application a ne pas exiger de session : le
 * telephone qui scanne le QR code n'est pas connecte a l'ERP, et c'est
 * volontaire — personne ne saisit un mot de passe pour prendre une photo au
 * comptoir. Le jeton tient donc lieu d'autorisation, et il est etroit : il ne
 * permet que d'ajouter une image a une cible fixee a l'avance par un
 * utilisateur connecte, pendant trente minutes.
 *
 * Trois verrous compensent l'absence d'authentification : le jeton est tire au
 * hasard sur 256 bits, il perime, et le nombre comme le poids des depots sont
 * plafonnes.
 */

async function lireSession(token: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("photo_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!data) return { erreur: "Ce lien n'existe pas.", statut: 404 as const };
  if (new Date(data.expire_at) < new Date()) {
    return { erreur: "Ce lien a expiré. Affichez-en un nouveau depuis l'ERP.", statut: 410 as const };
  }
  return { session: data };
}

/** Etat de la session : ce que la page du telephone affiche a l'ouverture. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const resultat = await lireSession(token);
  if (!resultat.session) {
    return NextResponse.json({ error: resultat.erreur }, { status: resultat.statut });
  }

  const admin = getSupabaseAdmin();
  const { count } = await admin
    .from("photo_session_fichiers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", resultat.session.id);

  return NextResponse.json({
    libelle: resultat.session.libelle,
    expire_at: resultat.session.expire_at,
    deposees: count ?? 0,
    max: PHOTOS_MAX_PAR_SESSION,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const resultat = await lireSession(token);
  if (!resultat.session) {
    return NextResponse.json({ error: resultat.erreur }, { status: resultat.statut });
  }
  const session = resultat.session;
  const admin = getSupabaseAdmin();

  const formData = await request.formData();
  const fichiers = formData.getAll("fichiers").filter((f): f is File => f instanceof File);

  if (fichiers.length === 0) {
    return NextResponse.json({ error: "Aucune photo reçue." }, { status: 400 });
  }

  const { count: dejaDeposees } = await admin
    .from("photo_session_fichiers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id);

  if ((dejaDeposees ?? 0) + fichiers.length > PHOTOS_MAX_PAR_SESSION) {
    return NextResponse.json(
      { error: `Ce lien accepte ${PHOTOS_MAX_PAR_SESSION} photos au maximum.` },
      { status: 400 }
    );
  }

  const chemins: string[] = [];

  for (const fichier of fichiers) {
    if (!fichier.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Seules des images sont acceptées." },
        { status: 400 }
      );
    }
    if (fichier.size > PHOTO_TAILLE_MAX) {
      return NextResponse.json(
        { error: "Photo trop lourde. Réduisez la qualité et réessayez." },
        { status: 413 }
      );
    }

    const extension = (fichier.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const chemin = `${session.prefixe}/${crypto.randomUUID()}.${extension}`;

    const { error } = await admin.storage
      .from(session.bucket)
      .upload(chemin, fichier, { contentType: fichier.type });

    if (error) {
      return NextResponse.json(
        { error: "L'enregistrement de la photo a échoué." },
        { status: 500 }
      );
    }
    chemins.push(chemin);
  }

  await admin
    .from("photo_session_fichiers")
    .insert(chemins.map((chemin) => ({ session_id: session.id, chemin })));

  // Cible connue : la photo entre a la galerie sans attendre que le poste la
  // recupere. L'onglet de l'ERP peut avoir ete ferme entre-temps.
  if (session.client_identity_document_id) {
    await admin.from("identity_document_photos").upsert(
      chemins.map((chemin, i) => ({
        document_id: session.client_identity_document_id,
        chemin,
        bucket: session.bucket,
        rang: i,
        created_by: session.created_by,
      })),
      { onConflict: "chemin", ignoreDuplicates: true }
    );
  } else if (session.lot_id) {
    // La galerie s'ordonne par `created_at, rang` : l'heure de depot separe les
    // envois, le rang departage les cliches d'un meme envoi — ils partagent
    // sinon le meme horodatage a la microseconde.
    await admin.from("lot_photos").upsert(
      chemins.map((chemin, i) => ({
        lot_id: session.lot_id,
        reference_id: session.reference_id,
        chemin,
        bucket: session.bucket,
        rang: i,
        created_by: session.created_by,
      })),
      { onConflict: "chemin", ignoreDuplicates: true }
    );
  }

  return NextResponse.json({ chemins });
}
