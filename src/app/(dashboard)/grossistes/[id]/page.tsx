import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GrossisteDetailPage } from "@/components/grossistes/grossiste-detail-page";
import type { Grossiste, AchatGrossisteAvecArticles } from "@/types/grossiste";
import type { BijouxStock } from "@/types/bijoux";

export default async function GrossisteDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [grossisteRes, achatsRes, articlesRes] = await Promise.all([
    supabase.from("grossistes").select("*").eq("id", id).single(),
    supabase
      .from("achats_grossiste")
      .select("*")
      .eq("grossiste_id", id)
      .order("date_achat", { ascending: false }),
    supabase
      .from("bijoux_stock")
      .select("*")
      .eq("grossiste_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!grossisteRes.data) return notFound();

  const articles = (articlesRes.data ?? []) as (BijouxStock & {
    achat_grossiste_id: string | null;
  })[];

  // Le compte d'articles par achat se deduit du stock : un article supprime ne
  // doit pas continuer d'etre compte dans son achat d'origine.
  const parAchat = new Map<string, number>();
  for (const article of articles) {
    if (!article.achat_grossiste_id) continue;
    parAchat.set(
      article.achat_grossiste_id,
      (parAchat.get(article.achat_grossiste_id) ?? 0) + 1
    );
  }

  const achats: AchatGrossisteAvecArticles[] = (achatsRes.data ?? []).map((achat) => ({
    ...achat,
    nb_articles: parAchat.get(achat.id) ?? 0,
  }));

  return (
    <GrossisteDetailPage
      grossiste={grossisteRes.data as Grossiste}
      achats={achats}
      nbArticles={articles.length}
    />
  );
}
