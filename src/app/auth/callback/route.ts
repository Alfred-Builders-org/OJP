import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/dashboard";

  // Prevent open redirect — only allow relative paths starting with /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  /**
   * Derriere le proxy de Railway, `request.url` porte l'adresse interne du
   * conteneur : rediriger dessus renvoyait l'invite sur `localhost:3000`, une
   * page qui n'existe que sur le poste du developpeur. L'hote public se lit
   * dans les en-tetes de transfert, ce que `getSiteUrl` sait deja faire pour
   * les liens de courriel.
   */
  const siteUrl = getSiteUrl(request);

  const supabase = await createClient();

  // Handle code-based auth (OAuth, magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // Handle token_hash-based auth (invite, recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/sign-in?error=auth`);
}
