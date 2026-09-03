import { describe, it, expect } from "vitest";
import {
  buildLignesPayload,
  articleDepuisCatalogue,
  type ArticleAFondre,
} from "./create-bon-livraison";

const COURS = { Or: 122.665, Argent: 1.826, Platine: 30 };

function article(partiel: Partial<ArticleAFondre>): ArticleAFondre {
  return {
    id: "a1",
    source: "stock",
    designation: "Bague",
    metal: "Or",
    titrage: "750",
    poids: 10,
    quantite: 1,
    ...partiel,
  };
}

describe("buildLignesPayload", () => {
  it("valorise un bijou du stock au titre et au poids déclarés", () => {
    // 122,665 × 0,750 = 91,999… €/g ; × 10 g = 919,99 €
    const [ligne] = buildLignesPayload("bdl-1", [article({})], COURS);

    expect(ligne.bijoux_stock_id).toBe("a1");
    expect(ligne.or_investissement_id).toBeNull();
    expect(ligne.quantite).toBe(1);
    expect(ligne.cours_utilise).toBe(92);
    expect(ligne.valeur_estimee).toBeCloseTo(919.99, 1);
  });

  it("range un produit du catalogue dans l'autre colonne", () => {
    const [ligne] = buildLignesPayload(
      "bdl-1",
      [article({ source: "or_investissement", id: "oi-9", quantite: 3 })],
      COURS
    );

    expect(ligne.or_investissement_id).toBe("oi-9");
    expect(ligne.bijoux_stock_id).toBeNull();
    expect(ligne.quantite).toBe(3);
  });

  it("compte le poids du paquet, pas celui d'un exemplaire", () => {
    // Trois napoléons de 6,45 g pèsent 19,35 g — c'est ce que la fonderie
    // repèsera à la réception.
    const [ligne] = buildLignesPayload(
      "bdl-1",
      [
        articleDepuisCatalogue(
          { id: "oi-1", designation: "Napoléon 20 Frs", metal: "Or", titre: "900", poids: 6.45 },
          3
        ),
      ],
      COURS
    );

    expect(ligne.poids_declare).toBe(19.35);
    // 122,665 × 0,9 = 110,3985 €/g arrondi à 110,4 ; × 19,35 g
    expect(ligne.valeur_estimee).toBeCloseTo(2136.22, 0);
  });

  it("valorise au métal, sans la prime : la fonte l'efface", () => {
    // Un napoléon se négocie au-dessus de son or. Envoyé au fondeur, il ne vaut
    // plus que son métal — aucun coefficient ne doit s'appliquer ici.
    const [ligne] = buildLignesPayload(
      "bdl-1",
      [articleDepuisCatalogue(
        { id: "oi-1", designation: "Napoléon", metal: "Or", titre: "900", poids: 6.45 },
        1
      )],
      COURS
    );
    const valeurMetal = 122.665 * 0.9 * 6.45;
    expect(ligne.valeur_estimee).toBeCloseTo(valeurMetal, 0);
  });

  it("rend une valeur nulle sur un métal sans cours", () => {
    const [ligne] = buildLignesPayload(
      "bdl-1",
      [article({ metal: "Autre", titrage: "0" })],
      COURS
    );
    expect(ligne.valeur_estimee).toBe(0);
  });

  it("mélange les deux sources dans un même envoi", () => {
    const lignes = buildLignesPayload(
      "bdl-1",
      [
        article({ id: "s1" }),
        article({ id: "oi1", source: "or_investissement", quantite: 2 }),
      ],
      COURS
    );

    expect(lignes).toHaveLength(2);
    expect(lignes[0].bijoux_stock_id).toBe("s1");
    expect(lignes[1].or_investissement_id).toBe("oi1");
    // Chaque ligne porte une source et une seule : la contrainte de base
    // refuserait le contraire.
    for (const l of lignes) {
      const sources = [l.bijoux_stock_id, l.or_investissement_id].filter(Boolean);
      expect(sources).toHaveLength(1);
    }
  });
});
