"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DotsThree, Eye, User, Trash, EnvelopeSimple, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";
import { LEAD_SOURCE_OPTIONS } from "@/lib/validations/client";
import { formatDate } from "@/lib/format";

interface ClientTableProps {
  data: Client[];
  totalItems: number;
}

export function ClientTable({ data, totalItems }: ClientTableProps) {
  const router = useRouter();
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  async function handleDeleteClient() {
    if (!deletingClientId) return;
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", deletingClientId);
    setDeletingClientId(null);
    if (error) {
      if (error.message.includes("violates foreign key")) {
        toast.error("Impossible de supprimer ce client : il a des dossiers associés");
      } else {
        toast.error("Erreur lors de la suppression du client");
      }
      return;
    }
    toast.success("Client supprimé");
    router.refresh();
  }

  function handleSendEmail(client: Client) {
    if (!client.email) {
      toast.error("Ce client n'a pas d'adresse email");
      return;
    }
    window.open(`mailto:${client.email}`, "_blank");
  }

  const colonnes: ColonneGrid<Client>[] = [
    {
      cle: "nom",
      titre: "Client",
      triable: true,
      cellule: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User size={16} weight="duotone" className="text-muted-foreground" />
          </div>
          <span className="font-medium">
            {c.civility === "M" ? "M." : "Mme"} {c.first_name} {c.last_name}
          </span>
        </div>
      ),
    },
    { cle: "telephone", titre: "Téléphone", cellule: (c) => c.phone ?? "—" },
    { cle: "email", titre: "Email", cellule: (c) => c.email ?? "—" },
    {
      cle: "ville",
      titre: "Ville",
      triable: true,
      cellule: (c) => c.city ?? "—",
      groupe: (c) => c.city ?? "Sans ville",
    },
    {
      cle: "source",
      titre: "Source",
      cellule: (c) =>
        c.lead_source ? (
          <Badge variant="outline" className="bg-muted/50">
            {c.lead_source}
          </Badge>
        ) : (
          "—"
        ),
      groupe: (c) => c.lead_source ?? "Sans source",
    },
    {
      cle: "date",
      titre: "Date",
      triable: true,
      cellule: (c) => formatDate(c.created_at),
    },
  ];

  return (
    <>
      <DataGrid
        colonnes={colonnes}
        donnees={data}
        totalItems={totalItems}
        cleLigne={(c) => c.id}
        onRowClick={(c) => router.push(`/clients/${c.id}`)}
        placeholderRecherche="Rechercher un client..."
        messageVide="Aucun client trouvé."
        filtres={[
          {
            cle: "source",
            label: "Source",
            options: LEAD_SOURCE_OPTIONS.map((s) => ({ value: s, label: s })),
          },
        ]}
        groupements={[
          { cle: "ville", label: "Ville" },
          { cle: "source", label: "Source" },
        ]}
        actions={(item) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
            >
              <DotsThree size={16} weight="regular" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/clients/${item.id}`)}>
                <Eye size={16} weight="duotone" />
                Voir détail
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSendEmail(item)}
                disabled={!item.email}
              >
                <EnvelopeSimple size={16} weight="duotone" />
                Envoyer un email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeletingClientId(item.id)}
              >
                <Trash size={16} weight="duotone" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Dialog
        open={deletingClientId !== null}
        onOpenChange={(v) => !v && setDeletingClientId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WarningCircle size={20} weight="duotone" className="text-destructive" />
              Supprimer ce client ?
            </DialogTitle>
            <DialogDescription>
              Cette action est définitive. Un client rattaché à un dossier ne peut
              pas être supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingClientId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              <Trash size={16} weight="duotone" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
