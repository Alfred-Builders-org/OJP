import { describe, it, expect } from "vitest";
import {
  construireRegistreMarge,
  periodeDe,
  type AchatSousMarge,
  type VenteSousMarge,
} from "./registre-marge";

function vente(
  date: string,
  prixVente: number,
  prixAchat: number,
  id = `v-${date}-${prixVente}`
): VenteSousMarge {
  return { id, date, reference: "FAC-0001", designation: "Bague", prixVente, prixAchat };
}

function achat(date: string, prixAchat: number, id = `a-${date}-${prixAchat}`): AchatSousMarge {
  return { id, date, designation: "Bague", prixAchat };
}

describe("periodeDe", () => {
  it("range une date dans son mois", () => {
    expect(periodeDe("2026-09-15", "mois")).toEqual({
      cle: "2026-09",
      libelle: "Septembre 2026",
    });
  });

  it("range une date dans son trimestre", () => {
    expect(periodeDe("2026-09-15", "trimestre")).toEqual({
      cle: "2026-T3",
      libelle: "3e trimestre 2026",
    });
    expect(periodeDe("2026-01-04", "trimestre")?.libelle).toBe("1er trimestre 2026");
  });

  it("rejette une date illisible", () => {
    expect(periodeDe("pas une date", "mois")).toBeNull();
  });
});

describe("construireRegistreMarge", () => {
  it("compte la marge bijou par bijou sans compenser les pertes", () => {
    const [p] = construireRegistreMarge({
      ventes: [
        vente("2026-09-05", 1000, 600), // marge 400 -> TVA 66,67
        vente("2026-09-12", 500, 800), // perte 300 -> pas de TVA
      ],
      achats: [],
      granularite: "mois",
    });

    expect(p.margeDetaillee).toBe(400);
    expect(p.tvaDetaillee).toBe(66.67);
    expect(p.nbVentesAPerte).toBe(1);
    expect(p.perteNonImputee).toBe(300);
  });

  it("globalise sur la période : ventes moins achats, pas article par article", () => {
    const [p] = construireRegistreMarge({
      ventes: [vente("2026-09-05", 1000, 600), vente("2026-09-12", 500, 800)],
      // Un achat de la periode qui n'est pas encore revendu compte quand meme.
      achats: [achat("2026-09-01", 600), achat("2026-09-03", 800), achat("2026-09-20", 400)],
      granularite: "mois",
    });

    expect(p.totalVentes).toBe(1500);
    expect(p.totalAchats).toBe(1800);
    expect(p.margeGlobaleBrute).toBe(-300);
    expect(p.margeGlobaleTaxable).toBe(0);
    expect(p.tvaGlobalisee).toBe(0);
    expect(p.reportSortant).toBe(-300);
  });

  it("reporte un mois négatif sur le suivant", () => {
    // Le registre sort du plus recent au plus ancien.
    const [octobre, septembre] = construireRegistreMarge({
      ventes: [vente("2026-09-05", 1000, 900), vente("2026-10-05", 2000, 1000)],
      achats: [achat("2026-09-01", 1500), achat("2026-10-02", 500)],
      granularite: "mois",
    });

    expect(septembre.libelle).toBe("Septembre 2026");
    expect(septembre.margeGlobaleBrute).toBe(-500);
    expect(septembre.reportSortant).toBe(-500);

    expect(octobre.libelle).toBe("Octobre 2026");
    expect(octobre.margeGlobaleBrute).toBe(1500);
    expect(octobre.reportEntrant).toBe(-500);
    expect(octobre.margeGlobaleTaxable).toBe(1000);
    expect(octobre.tvaGlobalisee).toBe(166.67);
    expect(octobre.reportSortant).toBe(0);
  });

  it("un report non épuisé traverse la période suivante", () => {
    const [nov, oct, sept] = construireRegistreMarge({
      ventes: [
        vente("2026-09-05", 100, 50),
        vente("2026-10-05", 200, 100),
        vente("2026-11-05", 3000, 1000),
      ],
      achats: [achat("2026-09-01", 1100), achat("2026-10-01", 400), achat("2026-11-01", 100)],
      granularite: "mois",
    });

    expect(sept.reportSortant).toBe(-1000); // 100 - 1100
    expect(oct.margeGlobaleBrute).toBe(-200); // 200 - 400
    expect(oct.margeGlobaleTaxable).toBe(0);
    expect(oct.reportSortant).toBe(-1200); // le report s'accumule
    expect(nov.margeGlobaleBrute).toBe(2900); // 3000 - 100
    expect(nov.margeGlobaleTaxable).toBe(1700); // 2900 - 1200
    expect(nov.reportSortant).toBe(0);
  });

  it("met les deux méthodes en regard sur une même période", () => {
    const [p] = construireRegistreMarge({
      ventes: [vente("2026-09-05", 1000, 600), vente("2026-09-12", 500, 800)],
      achats: [achat("2026-09-01", 600), achat("2026-09-03", 800)],
      granularite: "mois",
    });

    // Bijou par bijou, la perte de 300 est perdue : on taxe 400 de marge.
    expect(p.tvaDetaillee).toBe(66.67);
    // Globalisee, elle s'impute : 1500 - 1400 = 100 de marge seulement.
    expect(p.margeGlobaleTaxable).toBe(100);
    expect(p.tvaGlobalisee).toBe(16.67);
  });

  it("regroupe par trimestre quand on le demande", () => {
    const registre = construireRegistreMarge({
      ventes: [vente("2026-07-05", 1000, 600), vente("2026-09-12", 2000, 1000)],
      achats: [],
      granularite: "trimestre",
    });

    expect(registre).toHaveLength(1);
    expect(registre[0].libelle).toBe("3e trimestre 2026");
    expect(registre[0].nbVentes).toBe(2);
    expect(registre[0].totalVentes).toBe(3000);
  });

  it("ne crée aucune période sans mouvement", () => {
    const registre = construireRegistreMarge({ ventes: [], achats: [], granularite: "mois" });
    expect(registre).toEqual([]);
  });
});
