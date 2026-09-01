import { getParametres } from "@/lib/parametres";
import { getAllSettings } from "@/lib/settings";
import { PageWrapper } from "@/components/dashboard/page-wrapper";
import { ParametresForm } from "@/components/parametres/parametres-form";
import type { SettingsMap } from "@/types/settings";

export default async function ParametresPage() {
  const [parametres, settings] = await Promise.all([
    getParametres(),
    getAllSettings() as Promise<SettingsMap>,
  ]);

  return (
    <PageWrapper title="Paramètres" fullHeight noPadding>
      <ParametresForm parametres={parametres} settings={settings} />
    </PageWrapper>
  );
}
