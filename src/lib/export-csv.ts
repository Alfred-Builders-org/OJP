/**
 * Export tableur.
 *
 * Point-virgule comme séparateur et BOM en tête : c'est ce qu'attend Excel en
 * configuration française. Avec une virgule, il empile tout dans la première
 * colonne ; sans BOM, il massacre les accents.
 */

/** Échappe une valeur pour le format CSV. */
function champ(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "";
  const texte = String(valeur);
  return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

export interface ColonneExport<T> {
  entete: string;
  valeur: (ligne: T) => unknown;
}

/** Construit le contenu CSV d'un jeu de lignes. */
export function construireCsv<T>(
  lignes: readonly T[],
  colonnes: readonly ColonneExport<T>[]
): string {
  const entetes = colonnes.map((c) => champ(c.entete)).join(";");
  const corps = lignes.map((l) =>
    colonnes.map((c) => champ(c.valeur(l))).join(";")
  );
  return "﻿" + [entetes, ...corps].join("\r\n");
}

/** Déclenche le téléchargement d'un CSV depuis le navigateur. */
export function telechargerCsv(contenu: string, nomFichier: string): void {
  const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  // Révoquer trop tôt interrompt le téléchargement sur certains navigateurs.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Nom de fichier horodaté, pour ne pas écraser un export précédent. */
export function nomFichierDate(prefixe: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefixe}-${date}.csv`;
}

/** Nombre au format français, pour qu'Excel le lise comme un nombre. */
export function nombreFr(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) return "";
  return String(valeur).replace(".", ",");
}
