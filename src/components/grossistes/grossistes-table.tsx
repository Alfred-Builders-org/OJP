"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DotsThree, Eye, Trash, Plus } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import type { Grossiste } from "@/types/grossiste";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataGrid, type ColonneGrid } from "@/components/ui/data-grid";

interface GrossistesTableProps {
  grossistes: Grossiste[];
  totalItems: number;
}

export function GrossistesTable({ grossistes, totalItems }: GrossistesTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("grossistes").delete().eq("id", id),
      "Erreur lors de la suppression du grossiste",
      "Grossiste supprimé"
    );
    if (error) return;
    router.refresh();
  }

  const colonnes: ColonneGrid<Grossiste>[] = [
    { cle: "nom", titre: "Nom", triable: true, className: "font-medium", cellule: (g) => g.nom },
    {
      cle: "ville",
      titre: "Ville",
      triable: true,
      className: "text-muted-foreground",
      cellule: (g) => g.ville ?? "—",
      groupe: (g) => g.ville ?? "Sans ville",
    },
    {
      cle: "telephone",
      titre: "Téléphone",
      triable: true,
      className: "text-muted-foreground",
      cellule: (g) => g.telephone ?? "—",
    },
    {
      cle: "email",
      titre: "Email",
      className: "text-muted-foreground",
      cellule: (g) => g.email ?? "—",
    },
    {
      cle: "siret",
      titre: "SIRET",
      className: "text-muted-foreground tabular-nums",
      cellule: (g) => g.siret ?? "—",
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Link href="/grossistes/new">
          <Button size="sm">
            <Plus size={16} weight="bold" />
            Nouveau grossiste
          </Button>
        </Link>
      </div>

      <DataGrid
        colonnes={colonnes}
        donnees={grossistes}
        totalItems={totalItems}
        cleLigne={(g) => g.id}
        onRowClick={(g) => router.push(`/grossistes/${g.id}`)}
        placeholderRecherche="Rechercher un grossiste..."
        messageVide="Aucun grossiste trouvé."
        groupements={[{ cle: "ville", label: "Ville" }]}
        actions={(g) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
            >
              <DotsThree size={16} weight="regular" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/grossistes/${g.id}`)}>
                <Eye size={14} weight="duotone" />
                Voir détail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(g.id)}>
                <Trash size={14} weight="duotone" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce grossiste ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les achats déjà enregistrés empêcheront
              la suppression : les articles resteraient sans provenance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingId) handleDelete(deletingId);
                setDeletingId(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
