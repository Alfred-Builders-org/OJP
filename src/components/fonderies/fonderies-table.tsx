"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DotsThree, Eye, Trash, Plus } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import type { Fonderie } from "@/types/fonderie";
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
import Link from "next/link";

interface FonderiesTableProps {
  fonderies: Fonderie[];
  totalItems: number;
}

export function FonderiesTable({ fonderies, totalItems }: FonderiesTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("fonderies").delete().eq("id", id),
      "Erreur lors de la suppression de la fonderie",
      "Fonderie supprimée"
    );
    if (error) return;
    router.refresh();
  }

  const colonnes: ColonneGrid<Fonderie>[] = [
    { cle: "nom", titre: "Nom", triable: true, className: "font-medium", cellule: (f) => f.nom },
    {
      cle: "ville",
      titre: "Ville",
      triable: true,
      className: "text-muted-foreground",
      cellule: (f) => f.ville ?? "—",
      groupe: (f) => f.ville ?? "Sans ville",
    },
    {
      cle: "telephone",
      titre: "Téléphone",
      triable: true,
      className: "text-muted-foreground",
      cellule: (f) => f.telephone ?? "—",
    },
    {
      cle: "email",
      titre: "Email",
      className: "text-muted-foreground",
      cellule: (f) => f.email ?? "—",
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Link href="/fonderies/new">
          <Button size="sm">
            <Plus size={16} weight="bold" />
            Nouvelle fonderie
          </Button>
        </Link>
      </div>

      <DataGrid
        colonnes={colonnes}
        donnees={fonderies}
        totalItems={totalItems}
        cleLigne={(f) => f.id}
        onRowClick={(f) => router.push(`/fonderies/${f.id}`)}
        placeholderRecherche="Rechercher une fonderie..."
        messageVide="Aucune fonderie trouvée."
        groupements={[{ cle: "ville", label: "Ville" }]}
        actions={(f) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" aria-label="Actions" />}
            >
              <DotsThree size={16} weight="regular" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/fonderies/${f.id}`)}>
                <Eye size={14} weight="duotone" />
                Voir détail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeletingId(f.id)}>
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
            <AlertDialogTitle>Supprimer cette fonderie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La fonderie sera définitivement supprimée.
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
