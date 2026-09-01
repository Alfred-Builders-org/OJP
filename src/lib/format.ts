/**
 * Shared formatting utilities for dates and currency.
 */

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function formatTime(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatDateISO(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function formatCurrency(amount: number | null): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount ?? 0);
}

/**
 * Libellé imprimable d'un mode de règlement.
 *
 * Les factures affichaient un tiret en dur : la ligne « Règlement » d'une
 * facture de solde ne disait jamais comment le client avait payé, alors que
 * `lots.mode_reglement` le sait.
 */
export function libelleModeReglement(mode: string | null | undefined): string {
  const libelles: Record<string, string> = {
    especes: "Espèces",
    carte: "Carte bancaire",
    virement: "Virement",
    cheque: "Chèque",
  };
  return mode ? libelles[mode] ?? mode : "—";
}
