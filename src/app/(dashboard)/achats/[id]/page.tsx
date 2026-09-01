import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AchatDetailPage } from "@/components/grossistes/achat-detail-page";
import type { AchatGrossiste, Grossiste } from "@/types/grossiste";
import type { BijouxStock } from "@/types/bijoux";

export default async function AchatDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: achat } = await supabase
    .from("achats_grossiste")
    .select("*, grossiste:grossistes(*)")
    .eq("id", id)
    .single();

  if (!achat) return notFound();

  const { data: articles } = await supabase
    .from("bijoux_stock")
    .select("*")
    .eq("achat_grossiste_id", id)
    .order("nom", { ascending: true });

  const { grossiste, ...reste } = achat;

  return (
    <AchatDetailPage
      achat={reste as AchatGrossiste}
      grossiste={grossiste as Grossiste}
      articles={(articles ?? []) as BijouxStock[]}
    />
  );
}
