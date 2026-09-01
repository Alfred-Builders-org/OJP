"use client";

import { useUrlTab } from "@/hooks/use-url-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardText, WarningCircle } from "@phosphor-icons/react";
import { SuiviTable } from "./suivi-table";
import { EcartsTable } from "./ecarts-table";
import type { FonderieLotRow, EcartRow } from "@/types/fonderie-lot";

interface SuiviPageClientProps {
  rows: FonderieLotRow[];
  fonderies: string[];
  ecarts: EcartRow[];
}

export function SuiviPageClient({ rows, fonderies, ecarts }: SuiviPageClientProps) {
  const [activeTab, setActiveTab] = useUrlTab<"envois" | "ecarts">(
    "onglet",
    "envois",
    ["envois", "ecarts"]
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col flex-1 min-h-0 min-w-0"
    >
      <TabsList>
        <TabsTrigger value="envois" className="gap-1.5">
          <ClipboardText size={14} weight="duotone" />
          Envois et commandes
        </TabsTrigger>
        <TabsTrigger value="ecarts" className="gap-1.5">
          <WarningCircle size={14} weight="duotone" />
          Écarts
          {ecarts.length > 0 && (
            <span className="ml-1 text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full px-1.5 py-0.5">
              {ecarts.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="envois" className="flex flex-col flex-1 min-h-0 mt-4">
        <SuiviTable data={rows} fonderies={fonderies} />
      </TabsContent>

      <TabsContent value="ecarts" className="flex flex-col flex-1 min-h-0 mt-4">
        <EcartsTable data={ecarts} totalItems={ecarts.length} />
      </TabsContent>
    </Tabs>
  );
}
