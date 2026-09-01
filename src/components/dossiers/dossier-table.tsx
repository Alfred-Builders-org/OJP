"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DotsThree, Eye, FolderOpen, Trash, WarningCircle, Lightning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { DossierWithClient } from "@/types/dossier";
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
import { DOSSIER_STATUS_OPTIONS } from "@/lib/validations/dossier";
import { formatDate } from "@/lib/format";

function clientDisplayName(client: DossierWithClient["client"]) {
  return `${client.civility === "M" ? "M." : "Mme"} ${client.first_name} ${client.last_name}`;
}

const STATUT_CLASSES: Record<string, string> = {
  finalise:
    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30",
  en_cours:
    "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30",
  brouillon:
    "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800",
};

const STATUT_LABELS: Record<string, string> = {
  finalise: "Finalisé",
  en_cours: "En cours",
  brouillon: "Brouillon",
};

interface DossierTableProps {
  data: DossierWithClient[];
  totalItems: number;
  actionCounts?: Record<string, number>;
}

export function DossierTable({ data, totalItems, actionCounts = {} }: DossierTableProps) {
  const router = useRouter();
  const [deletingDossierId, setDeletingDossierId] = useState<string | null>(null);

  async function handleDeleteDossier() {
    if (!deletingDossierId) return;
    const supabase = createClient();
    // Clean up email_logs (no CASCADE)
    await supabase.from("email_logs").delete().eq("dossier_id", deletingDossierId);
    // Delete lots first (lots has ON DELETE RESTRICT, lot_references/reglements/vente_lignes CASCADE from lots)
    const { error: lotsError } = await supabase.from("lots").delete().eq("dossier_id", deletingDossierId);
    if (lotsError) { toast.error("Erreur lors de la suppression des lots du dossier"); setDeletingDossierId(null); return; }
    // Documents CASCADE from dossier, but delete explicitly to be safe
    await supabase.from("documents").delete().eq("dossier_id", deletingDossierId);
    const { error } = await supabase.from("dossiers").delete().eq("id", deletingDossierId);
    setDeletingDossierId(null);
    if (error) { toast.error("Erreur lors de la suppression du dossier"); return; }
    toast.success("Dossier supprimé");
    router.refresh();
  }

  const colonnes: ColonneGrid<DossierWithClient>[] = [
    {
      cle: "numero",
      titre: "Numéro",
      triable: true,
      cellule: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <FolderOpen size={16} weight="duotone" className="text-muted-foreground" />
          </div>
          <span className="font-medium">{d.numero}</span>
        </div>
      ),
    },
    {
      cle: "client",
      titre: "Client",
      cellule: (d) => clientDisplayName(d.client),
    },
    {
      cle: "statut",
      titre: "Statut",
      triable: true,
      cellule: (d) => (
        <Badge variant="secondary" className={STATUT_CLASSES[d.status]}>
          {STATUT_LABELS[d.status] ?? d.status}
        </Badge>
      ),
      groupe: (d) => STATUT_LABELS[d.status] ?? d.status,
    },
    {
      cle: "date",
      titre: "Date",
      triable: true,
      cellule: (d) => formatDate(d.created_at),
    },
    {
      cle: "actions_en_attente",
      titre: "Actions",
      headClassName: "text-center",
      className: "text-center",
      cellule: (d) =>
        (actionCounts[d.id] ?? 0) > 0 ? (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Lightning size={10} weight="duotone" className="mr-0.5" />
            {actionCounts[d.id]}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <>
      <DataGrid
        colonnes={colonnes}
        donnees={data}
        totalItems={totalItems}
        cleLigne={(d) => d.id}
        onRowClick={(d) => router.push(`/dossiers/${d.id}`)}
        placeholderRecherche="Rechercher un dossier..."
        messageVide="Aucun dossier trouvé."
        filtres={[
          {
            cle: "statut",
            label: "Statut",
            options: DOSSIER_STATUS_OPTIONS,
          },
        ]}
        groupements={[{ cle: "statut", label: "Statut" }]}
        actions={(item) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
            >
              <DotsThree size={16} weight="regular" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dossiers/${item.id}`)}>
                <Eye size={16} weight="duotone" />
                Voir détail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeletingDossierId(item.id)}
              >
                <Trash size={16} weight="duotone" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Dialog open={!!deletingDossierId} onOpenChange={(open) => { if (!open) setDeletingDossierId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WarningCircle size={20} weight="duotone" className="text-destructive" />
              Supprimer le dossier
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce dossier et tous ses lots associés ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingDossierId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteDossier}>
              <Trash size={14} weight="duotone" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
