import { createClient } from "@/lib/supabase/server";
import { DossierCreatePage } from "@/components/dossiers/dossier-create-page";
import type { Client } from "@/types/client";
import type { Grossiste } from "@/types/grossiste";
import type { Fonderie } from "@/types/fonderie";

export default async function NewDossierPage() {
  const supabase = await createClient();

  // Trois familles de tiers, chargées en parallèle. Un dossier peut s'ouvrir
  // sur chacune ; le formulaire fait choisir le type d'abord, le tiers ensuite.
  const [{ data: clientsRaw }, { data: grossistesRaw }, { data: fonderiesRaw }] = await Promise.all([
    supabase.from("clients").select("*").eq("is_valid", true).order("last_name", { ascending: true }),
    supabase.from("grossistes").select("*").order("nom", { ascending: true }),
    supabase.from("fonderies").select("*").order("nom", { ascending: true }),
  ]);

  return (
    <DossierCreatePage
      validClients={(clientsRaw ?? []) as Client[]}
      grossistes={(grossistesRaw ?? []) as Grossiste[]}
      fonderies={(fonderiesRaw ?? []) as Fonderie[]}
    />
  );
}
