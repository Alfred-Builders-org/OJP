import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewAchatClient } from "./new-achat-client";
import type { Grossiste } from "@/types/grossiste";

export const dynamic = "force-dynamic";

export default async function NewAchatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("grossistes")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return notFound();

  return <NewAchatClient grossiste={data as Grossiste} />;
}
