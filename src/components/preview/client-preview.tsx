"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PreviewSkeleton } from "@/components/preview/preview-skeleton";
import { formatDate } from "@/lib/format";
import type { Client } from "@/types/client";

export default function ClientPreview({ id }: { id: string }) {
  // L'état porte l'id qu'il décrit : le chargement se dérive de la comparaison
  // avec l'id demandé, plutôt que d'un setState synchrone en tête d'effet.
  const [result, setResult] = useState<{ id: string; data: Client | null; error: string | null } | null>(null);

  useEffect(() => {
    let aborted = false;

    const supabase = createClient();
    supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error: err }) => {
        if (aborted) return;
        setResult(
          err
            ? { id, data: null, error: "Impossible de charger le client." }
            : { id, data, error: null }
        );
      });

    return () => {
      aborted = true;
    };
  }, [id]);

  const settled = result?.id === id ? result : null;
  const loading = settled === null;
  const error = settled?.error ?? null;
  const client = settled?.data ?? null;

  if (loading) return <PreviewSkeleton />;
  if (error || !client) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        {error ?? "Client introuvable."}
      </p>
    );
  }

  const fullName = `${client.civility === "M" ? "M." : "Mme"} ${client.first_name} ${client.last_name}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium text-base">{fullName}</span>
        <Badge
          variant={client.is_valid ? "default" : "destructive"}
          className={
            client.is_valid
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
              : ""
          }
        >
          {client.is_valid ? "Valide" : "Non valide"}
        </Badge>
      </div>

      <div className="divide-y">
        <PreviewRow label="Téléphone" value={client.phone ?? "—"} />
        <PreviewRow label="Email" value={client.email ?? "—"} />
        <PreviewRow label="Adresse" value={client.address ?? "—"} />
        <PreviewRow label="Ville" value={client.city ?? "—"} />
        <PreviewRow label="Code postal" value={client.postal_code ?? "—"} />
        <PreviewRow label="Source" value={client.lead_source ?? "—"} />
        <PreviewRow label="Créé le" value={formatDate(client.created_at)} />
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
