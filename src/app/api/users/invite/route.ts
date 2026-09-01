import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sensitiveApiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site-url";
import { envoyerInvitation } from "@/lib/email/envoyer-invitation";

export async function POST(request: NextRequest) {
  // Rate limiting
  const { success } = await sensitiveApiLimiter.limit(getClientIp(request));
  if (!success) return rateLimitResponse();

  // Verify caller is proprietaire
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "proprietaire" && profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json();
  const { email, firstName, lastName, mode, password } = body as {
    email: string;
    firstName: string;
    lastName: string;
    mode: "invite" | "create";
    password?: string;
  };

  if (!email || !firstName || !lastName) {
    return NextResponse.json(
      { error: "Email, prénom et nom sont requis" },
      { status: 400 }
    );
  }

  try {
    if (mode === "invite") {
      const siteUrl = getSiteUrl(request);
      const metadonnees = {
        first_name: firstName,
        last_name: lastName,
        role: "vendeur",
        status: "pending",
      };

      const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({
        type: "invite",
        email,
        options: { data: metadonnees },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Le lien de Supabase passe par notre callback, qui verifie le jeton puis
      // depose sur l'ecran de choix du mot de passe.
      const actionLink = data.properties?.action_link ?? "";
      let inviteLink = actionLink;
      if (actionLink) {
        const parsed = new URL(actionLink);
        const token_hash = parsed.searchParams.get("token") ?? "";
        const type = parsed.searchParams.get("type") ?? "invite";
        inviteLink = `${siteUrl}/auth/callback?token_hash=${token_hash}&type=${type}&next=/reset-password`;
      }

      /**
       * Le courriel part d'ici. `generateLink` fabrique un lien et n'envoie
       * rien : l'ecran annonçait pourtant un message envoye, et le proprietaire
       * etait le seul a pouvoir transmettre le lien sans le savoir.
       *
       * L'envoi peut echouer — cle d'expedition absente, domaine non verifie.
       * Le lien reste alors affiche : une invitation a moitie faite serait pire
       * que pas d'invitation du tout.
       */
      const { envoye, motif } = await envoyerInvitation({
        destinataire: email,
        lien: inviteLink,
        origine: siteUrl,
      }).catch((erreurInattendue: Error) => ({
        envoye: false,
        motif: erreurInattendue.message,
      }));

      return NextResponse.json({
        user: data.user,
        inviteLink,
        envoye,
        motifNonEnvoi: motif,
      });
    } else {
      // Create user with password
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 6 caractères" },
          { status: 400 }
        );
      }

      const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: "vendeur",
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ user: data.user });
    }
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
