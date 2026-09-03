import { describe, it, expect } from "vitest";
import {
  colonnePourMouvement,
  ventiler,
  totaliser,
  totalEntrant,
  totalSortant,
  solde,
  bornesDuJour,
  type MouvementCaisse,
} from "./caisse";

function mouvement(partiel: Partial<MouvementCaisse>): MouvementCaisse {
  return {
    id: "m1",
    sens: "entrant",
    type: "vente",
    mode: "especes",
    montant: 100,
    date_reglement: "2026-09-03T10:00:00Z",
    libelle: "Client",
    reference: null,
    numero_registre: null,
    ...partiel,
  };
}

describe("colonnePourMouvement", () => {
  it("range un encaissement client selon son moyen de paiement", () => {
    expect(colonnePourMouvement({ sens: "entrant", type: "vente", mode: "carte" }))
      .toBe("entrant_carte");
    expect(colonnePourMouvement({ sens: "entrant", type: "vente", mode: "especes" }))
      .toBe("entrant_especes");
  });

  it("range un versement au client dans les colonnes sortantes", () => {
    expect(colonnePourMouvement({ sens: "sortant", type: "rachat", mode: "virement" }))
      .toBe("sortant_virement");
    expect(colonnePourMouvement({ sens: "sortant", type: "rachat", mode: "cheque" }))
      .toBe("sortant_cheque");
  });

  it("isole les réparations, quel que soit le moyen de paiement", () => {
    // Le classeur leur donne une colonne à part : c'est ce que l'atelier
    // rapporte, et on veut le lire d'un coup d'œil.
    expect(colonnePourMouvement({ sens: "entrant", type: "reparation", mode: "carte" }))
      .toBe("reparations");
    expect(colonnePourMouvement({ sens: "entrant", type: "reparation", mode: "especes" }))
      .toBe("reparations");
  });

  it("range un achat grossiste dans les décaissements", () => {
    expect(colonnePourMouvement({ sens: "sortant", type: "achat_grossiste", mode: "virement" }))
      .toBe("sortant_virement");
  });
});

describe("totaliser", () => {
  it("additionne chaque colonne séparément", () => {
    const lignes = ventiler([
      mouvement({ id: "1", sens: "entrant", mode: "especes", montant: 30 }),
      mouvement({ id: "2", sens: "entrant", mode: "especes", montant: 20 }),
      mouvement({ id: "3", sens: "entrant", mode: "carte", montant: 50 }),
      mouvement({ id: "4", sens: "sortant", type: "rachat", mode: "cheque", montant: 200 }),
      mouvement({ id: "5", type: "reparation", mode: "carte", montant: 40 }),
    ]);
    const totaux = totaliser(lignes);

    expect(totaux.entrant_especes).toBe(50);
    expect(totaux.entrant_carte).toBe(50);
    expect(totaux.sortant_cheque).toBe(200);
    expect(totaux.reparations).toBe(40);
    expect(totaux.sortant_especes).toBe(0);
  });

  it("soustrait un remboursement, enregistré en négatif", () => {
    // R-015 : un remboursement est un règlement négatif. Le classeur fait de
    // même — « rbt puzols dble virement −461 ».
    const lignes = ventiler([
      mouvement({ id: "1", sens: "entrant", mode: "virement", montant: 500 }),
      mouvement({ id: "2", sens: "entrant", mode: "virement", montant: -461 }),
    ]);
    expect(totaliser(lignes).entrant_virement).toBe(39);
  });

  it("rend des totaux nuls sur une journée sans mouvement", () => {
    const totaux = totaliser([]);
    expect(totalEntrant(totaux)).toBe(0);
    expect(totalSortant(totaux)).toBe(0);
    expect(solde(totaux)).toBe(0);
  });
});

describe("totaux de la journée", () => {
  it("compte les réparations avec ce qui entre", () => {
    const totaux = totaliser(
      ventiler([
        mouvement({ id: "1", type: "reparation", montant: 40 }),
        mouvement({ id: "2", sens: "entrant", mode: "carte", montant: 60 }),
      ])
    );
    expect(totalEntrant(totaux)).toBe(100);
    expect(totalSortant(totaux)).toBe(0);
  });

  it("donne le mouvement net du tiroir", () => {
    const totaux = totaliser(
      ventiler([
        mouvement({ id: "1", sens: "entrant", mode: "especes", montant: 250 }),
        mouvement({ id: "2", sens: "sortant", type: "rachat", mode: "cheque", montant: 1000 }),
      ])
    );
    expect(solde(totaux)).toBe(-750);
  });
});

describe("bornesDuJour", () => {
  it("couvre la journée entière, minuit à minuit", () => {
    const { debut, fin } = bornesDuJour("2026-09-03");
    // Une journée pleine, quel que soit le décalage horaire local.
    expect(new Date(fin).getTime() - new Date(debut).getTime()).toBe(24 * 3600 * 1000);
  });

  it("commence au premier instant du jour demandé", () => {
    const { debut } = bornesDuJour("2026-09-03");
    expect(new Date(debut).getDate()).toBe(3);
    expect(new Date(debut).getHours()).toBe(0);
  });
});
