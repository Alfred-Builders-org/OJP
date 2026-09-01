"use client";

import { Receipt, Scales } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlTab } from "@/hooks/use-url-tab";
import { ImpotsTable } from "@/components/impots/impots-table";
import { RegistreMargeTable } from "@/components/impots/registre-marge-table";
import type {
  AchatSousMarge,
  VenteSousMarge,
} from "@/lib/calculations/registre-marge";
import type { TaxeRow } from "@/types/impots";

interface ImpotsPageClientProps {
  taxes: TaxeRow[];
  ventes: VenteSousMarge[];
  achats: AchatSousMarge[];
}

/**
 * Deux lectures de la meme fiscalite : le registre des taxes ligne a ligne, et
 * l'etat periodique des ventes sous le regime de la marge.
 */
export function ImpotsPageClient({ taxes, ventes, achats }: ImpotsPageClientProps) {
  const [activeTab, setActiveTab] = useUrlTab<"taxes" | "marge">(
    "onglet",
    "taxes",
    ["taxes", "marge"]
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col flex-1 min-h-0 min-w-0"
    >
      <TabsList>
        <TabsTrigger value="taxes" className="gap-1.5">
          <Receipt size={14} weight="duotone" />
          Registre des taxes
        </TabsTrigger>
        <TabsTrigger value="marge" className="gap-1.5">
          <Scales size={14} weight="duotone" />
          TVA sur marge
        </TabsTrigger>
      </TabsList>

      <TabsContent value="taxes" className="flex flex-col flex-1 min-h-0 mt-4">
        <ImpotsTable data={taxes} />
      </TabsContent>

      <TabsContent value="marge" className="flex flex-col flex-1 min-h-0 mt-4 overflow-y-auto">
        <RegistreMargeTable ventes={ventes} achats={achats} />
      </TabsContent>
    </Tabs>
  );
}
