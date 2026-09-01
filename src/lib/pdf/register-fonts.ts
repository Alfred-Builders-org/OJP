import path from "path";
import { Font } from "@react-pdf/renderer";

/**
 * Enregistre Geist comme police des documents.
 *
 * Les gabarits tournaient sur Courier, une machine a ecrire monospace : large,
 * peu de caracteres par ligne, et un rendu de contrat qui date. Geist est une
 * sans serif, plus etroite a taille egale — c'est elle qui rend possible
 * d'agrandir les clauses et les mentions legales sans faire deborder les pages.
 *
 * Les fichiers vivent dans `public/fonts/` et non dans `node_modules` : c'est le
 * seul dossier d'assets que le build de production emporte a coup sur.
 */
const FONT_DIR = path.join(process.cwd(), "public", "fonts");

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Geist",
    fonts: [
      { src: path.join(FONT_DIR, "Geist-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Geist-Bold.ttf"), fontWeight: 700 },
      { src: path.join(FONT_DIR, "Geist-Italic.ttf"), fontStyle: "italic" },
    ],
  });
}

registerPdfFonts();
