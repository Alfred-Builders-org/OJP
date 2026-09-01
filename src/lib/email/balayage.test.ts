import { describe, it, expect } from "vitest";
import {
  devisQuiExpirent,
  commandesPretes,
  soldesARappeler,
  type RefDevis,
  type LigneCommande,
  type SoldeEnAttente,
} from "./balayage";

const MAINTENANT = new Date("2026-09-01T12:00:00Z");

function dansHeures(h: number): string {
  return new Date(MAINTENANT.getTime() + h * 3600_000).toISOString();
}

function refDevis(patch: Partial<RefDevis> = {}): RefDevis {
  return {
    lot_id: "lot-1",
    status: "devis_envoye",
    date_fin_delai: dansHeures(12),
    prix_achat: 100,
    montant_taxe: 11,
    quantite: 1,
    ...patch,
  };
}

function ligne(patch: Partial<LigneCommande> = {}): LigneCommande {
  return {
    lot_id: "lot-1",
    designation: "Alliance or 18 carats",
    fulfillment: "recu",
    is_livre: false,
    ...patch,
  };
}

function solde(patch: Partial<SoldeEnAttente> = {}): SoldeEnAttente {
  return {
    lot_id: "lot-1",
    date_limite_solde: dansHeures(12),
    factureNumero: "FSO-2026-0001",
    montantAttendu: 1000,
    montantPaye: 0,
    ...patch,
  };
}

describe("devisQuiExpirent", () => {
  it("retient un devis dont l'échéance tombe dans les 24 heures", () => {
    const envois = devisQuiExpirent([refDevis()], MAINTENANT);

    expect(envois).toHaveLength(1);
    expect(envois[0].lotId).toBe("lot-1");
    expect(envois[0].nbArticles).toBe(1);
  });

  it("ignore un devis qui expire dans plus de 24 heures", () => {
    expect(devisQuiExpirent([refDevis({ date_fin_delai: dansHeures(25) })], MAINTENANT)).toEqual([]);
  });

  it("ignore un devis déjà expiré : le prix n'est plus tenu", () => {
    expect(devisQuiExpirent([refDevis({ date_fin_delai: dansHeures(-1) })], MAINTENANT)).toEqual([]);
  });

  it("ignore une référence qui n'attend pas de réponse", () => {
    expect(devisQuiExpirent([refDevis({ status: "devis_accepte" })], MAINTENANT)).toEqual([]);
  });

  it("annonce le net proposé, taxe déduite, quantités comprises", () => {
    const envois = devisQuiExpirent(
      [refDevis({ prix_achat: 100, montant_taxe: 11, quantite: 3 })],
      MAINTENANT
    );

    // (100 - 11) x 3
    expect(envois[0].montant).toBe(267);
    expect(envois[0].nbArticles).toBe(3);
  });

  it("groupe les références d'un même lot en un seul courriel, sur l'échéance la plus proche", () => {
    const envois = devisQuiExpirent(
      [
        refDevis({ date_fin_delai: dansHeures(20) }),
        refDevis({ date_fin_delai: dansHeures(6) }),
      ],
      MAINTENANT
    );

    expect(envois).toHaveLength(1);
    expect(envois[0].nbArticles).toBe(2);
    expect(envois[0].dateFin).toBe(dansHeures(6));
  });

  it("sépare deux lots distincts", () => {
    const envois = devisQuiExpirent(
      [refDevis(), refDevis({ lot_id: "lot-2" })],
      MAINTENANT
    );

    expect(envois.map((e) => e.lotId).sort()).toEqual(["lot-1", "lot-2"]);
  });

  it("n'écrit pas deux fois au même lot", () => {
    expect(devisQuiExpirent([refDevis()], MAINTENANT, new Set(["lot-1"]))).toEqual([]);
  });
});

describe("commandesPretes", () => {
  it("prévient quand le dernier article est arrivé", () => {
    const envois = commandesPretes([
      ligne({ designation: "Alliance" }),
      ligne({ designation: "Chevalière" }),
    ]);

    expect(envois).toHaveLength(1);
    expect(envois[0].articles).toEqual(["Alliance", "Chevalière"]);
  });

  it("attend : un article encore en commande retient tout le lot", () => {
    expect(
      commandesPretes([ligne(), ligne({ fulfillment: "commande" })])
    ).toEqual([]);
  });

  it("attend aussi un article qui n'est même pas commandé", () => {
    expect(
      commandesPretes([ligne(), ligne({ fulfillment: "a_commander" })])
    ).toEqual([]);
  });

  it("accepte un panier mixte : servi du stock et reçu de commande", () => {
    const envois = commandesPretes([
      ligne({ fulfillment: "servi_stock", designation: "Bague vitrine" }),
      ligne({ fulfillment: "recu", designation: "Alliance commandée" }),
    ]);

    expect(envois).toHaveLength(1);
    expect(envois[0].articles).toHaveLength(2);
  });

  it("ne dit pas « votre commande est arrivée » pour un panier entièrement servi en vitrine", () => {
    expect(
      commandesPretes([ligne({ fulfillment: "servi_stock" }), ligne({ fulfillment: "servi_stock" })])
    ).toEqual([]);
  });

  it("se tait quand tout a déjà été remis au client", () => {
    expect(commandesPretes([ligne({ is_livre: true })])).toEqual([]);
  });

  it("ne liste que ce qui reste à retirer", () => {
    const envois = commandesPretes([
      ligne({ designation: "Déjà repartie", is_livre: true }),
      ligne({ designation: "À retirer", is_livre: false }),
    ]);

    expect(envois[0].articles).toEqual(["À retirer"]);
  });

  it("n'écrit pas deux fois au même lot", () => {
    expect(commandesPretes([ligne()], new Set(["lot-1"]))).toEqual([]);
  });
});

describe("soldesARappeler", () => {
  it("rappelle à la moitié du délai : 24 h avant, sur un délai de 48 h", () => {
    const envois = soldesARappeler([solde({ date_limite_solde: dansHeures(24) })], 48, MAINTENANT);

    expect(envois).toHaveLength(1);
    expect(envois[0].montantRestant).toBe(1000);
  });

  it("se tait avant la moitié du délai", () => {
    expect(
      soldesARappeler([solde({ date_limite_solde: dansHeures(25) })], 48, MAINTENANT)
    ).toEqual([]);
  });

  it("suit le réglage : un délai de 10 jours rappelle à 5 jours", () => {
    const cinqJours = 5 * 24;
    expect(
      soldesARappeler([solde({ date_limite_solde: dansHeures(cinqJours + 1) })], 240, MAINTENANT)
    ).toEqual([]);
    expect(
      soldesARappeler([solde({ date_limite_solde: dansHeures(cinqJours - 1) })], 240, MAINTENANT)
    ).toHaveLength(1);
  });

  it("ne relance plus une échéance dépassée", () => {
    expect(
      soldesARappeler([solde({ date_limite_solde: dansHeures(-1) })], 48, MAINTENANT)
    ).toEqual([]);
  });

  it("ne réclame rien sur un solde déjà réglé", () => {
    expect(
      soldesARappeler([solde({ montantPaye: 1000 })], 48, MAINTENANT)
    ).toEqual([]);
  });

  it("ignore un reliquat d'arrondi inférieur au centime", () => {
    expect(
      soldesARappeler([solde({ montantAttendu: 1000, montantPaye: 999.999 })], 48, MAINTENANT)
    ).toEqual([]);
  });

  it("réclame ce qui reste après un versement partiel", () => {
    const envois = soldesARappeler([solde({ montantPaye: 400 })], 48, MAINTENANT);

    expect(envois[0].montantRestant).toBe(600);
  });

  it("s'abstient quand le délai réglé est absent ou nul", () => {
    expect(soldesARappeler([solde()], 0, MAINTENANT)).toEqual([]);
    expect(soldesARappeler([solde()], Number.NaN, MAINTENANT)).toEqual([]);
  });

  it("n'écrit pas deux fois au même lot", () => {
    expect(soldesARappeler([solde()], 48, MAINTENANT, new Set(["lot-1"]))).toEqual([]);
  });
});
