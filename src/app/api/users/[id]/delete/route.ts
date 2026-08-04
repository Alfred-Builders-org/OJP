import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sensitiveApiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { success } = await sensitiveApiLimiter.limit(getClientIp(request));
    if (!success) return rateLimitResponse();

    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.id === id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "proprietaire" && callerProfile?.role !== "super_admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data: targetProfile } = await getSupabaseAdmin()
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (targetProfile?.role === "super_admin") {
      return NextResponse.json(
        { error: "Impossible de supprimer un super admin" },
        { status: 400 }
      );
    }

    if (targetProfile?.role === "proprietaire" && callerProfile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Seul un super admin peut supprimer un propriétaire" },
        { status: 400 }
      );
    }

    // Suppression logique : le profil est conservé pour que l'historique
    // reste lisible (« créé par ... » sur les lots, dossiers et clients).
    const { error: profileError } = await getSupabaseAdmin()
      .from("profiles")
      .update({ status: "deleted" })
      .eq("id", id);

    if (profileError) {
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 400 });
    }

    // Bannir de Supabase Auth pour empêcher la connexion
    await getSupabaseAdmin().auth.admin.updateUserById(id, {
      ban_duration: "876000h",
    });

    // Neutraliser l'adresse e-mail, sans quoi elle resterait prise dans
    // auth.users et l'on ne pourrait plus recréer de compte avec elle.
    // Supabase la stocke à deux endroits (users et identities) : la fonction
    // dédiée traite les deux, ce que l'API admin ne garantit pas.
    const { error: emailError } = await getSupabaseAdmin().rpc("liberer_email_compte", {
      p_user_id: id,
    });

    if (emailError) {
      // Le compte est bien supprimé et banni : on le dit, tout en signalant
      // que l'adresse ne pourra pas resservir tout de suite.
      return NextResponse.json(
        {
          error:
            "Compte supprimé, mais son adresse e-mail n'a pas pu être libérée. Elle ne pourra pas être réutilisée pour un nouveau compte.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
