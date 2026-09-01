import { describe, it, expect } from "vitest";
import { detectPaymentsDue } from "./detect-payments-due";
import type { Lot } from "@/types/lot";
import type { Reglement } from "@/types/reglement";
import type { DocumentRecord } from "@/types/document";
import type { BonCommande } from "@/types/bon-commande";
import type { VenteLigne } from "@/types/vente";

function lot(patch: Partial<Lot>): Lot {
  return {
    id: "lot-1",
    numero: "RAC-2026-0033",
    dossier_id: "dos-1",
    type: "rachat",
    status: "finalise",
    outcome: null,
    montant_net: 0,
    ...patch,
  } as Lot;
}

function document(patch: Partial<DocumentRecord>): DocumentRecord {
  return {
    id: "doc-1",
    type: "quittance_rachat",
    numero: "QRA-2026-0001",
    lot_id: "lot-1",
    dossier_id: "dos-1",
    client_id: "cli-1",
    storage_path: "",
    status: "en_attente",
    reference_numero: null,
    created_at: "2026-09-01T00:00:00Z",
    ...patch,
  };
}

function reglement(patch: Partial<Reglement>): Reglement {
  return {
    id: "reg-1",
    lot_id: "lot-1",
    type: "rachat",
    sens: "sortant",
    montant: 0,
    mode: "virement",
    date_reglement: "2026-09-01T00:00:00Z",
    ...patch,
  } as Reglement;
}

function bonCommande(patch: Partial<BonCommande>): BonCommande {
  return {
    id: "bdc-1",
    numero: "BDC-2026-0008",
    fonderie_id: "fon-1",
    statut: "envoye",
    montant_total: 8100,
    montant_fonderie: 0,
    frais_annexes: 0,
    frais_annexes_libelle: null,
    date_envoi: "2026-09-01T00:00:00Z",
    date_reception: null,
    notes: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...patch,
  };
}

describe("remboursement apres retractation", () => {
  const lotRetracte = lot({ outcome: "retracte" });
  const verse = reglement({ sens: "sortant", montant: 2316.92 });

  it("vise le recu de retractation, et non la quittance de rachat", () => {
    const quittance = document({ id: "doc-quittance", type: "quittance_rachat" });
    const recu = document({
      id: "doc-recu",
      type: "remboursement_retractation",
      numero: "RBT-2026-0003",
    });

    const [paiement] = detectPaymentsDue({
      lot: lotRetracte,
      reglements: [verse],
      documents: [quittance, recu],
    });

    expect(paiement.sens).toBe("entrant");
    expect(paiement.pre_fill.document_id).toBe("doc-recu");
    expect(paiement.label).toContain("RBT-2026-0003");
  });

  it("ne rattache rien quand aucun recu n'a ete emis", () => {
    const [paiement] = detectPaymentsDue({
      lot: lotRetracte,
      reglements: [verse],
      documents: [document({ id: "doc-quittance" })],
    });

    expect(paiement.pre_fill.document_id).toBeUndefined();
  });

  it("ne reclame plus rien une fois la somme rentree", () => {
    const paiements = detectPaymentsDue({
      lot: lotRetracte,
      reglements: [verse, reglement({ id: "reg-2", sens: "entrant", montant: 2316.92 })],
      documents: [],
    });

    expect(paiements[0].is_fully_paid).toBe(true);
    expect(paiements[0].montant_restant).toBe(0);
  });
});

function ligneOrInvest(patch: Partial<VenteLigne> = {}): VenteLigne {
  return {
    id: "vl-or",
    lot_id: "lot-1",
    bijoux_stock_id: null,
    or_investissement_id: "or-1",
    designation: "Lingot 100 g",
    prix_total: 8000,
    montant_taxe: 0,
    type_taxe: null,
    quantite: 1,
    ...patch,
  } as VenteLigne;
}

function ligneBijou(patch: Partial<VenteLigne> = {}): VenteLigne {
  return {
    id: "vl-bijou",
    lot_id: "lot-1",
    bijoux_stock_id: "stk-1",
    or_investissement_id: null,
    designation: "Bague or 18 carats",
    prix_total: 1000,
    montant_taxe: 66.67,
    type_taxe: "tva_marge",
    quantite: 1,
    ...patch,
  } as VenteLigne;
}

describe("vente d'or d'investissement : acompte ou paiement en une fois", () => {
  const lotAvecAcompte = lot({ type: "vente", status: "en_cours", avec_acompte: true });
  const lotSansAcompte = lot({ type: "vente", status: "en_cours", avec_acompte: false });

  it("reclame l'acompte, puis le solde, quand la vente en demande un", () => {
    const paiements = detectPaymentsDue({
      lot: lotAvecAcompte,
      lignes: [ligneOrInvest()],
      reglements: [],
      acompte_pct: 10,
    });

    const acompte = paiements.find((p) => p.type === "acompte");
    expect(acompte?.montant_attendu).toBe(800);
    // Le solde n'apparait qu'une fois l'acompte encaisse.
    expect(paiements.find((p) => p.type === "solde")).toBeUndefined();
    expect(paiements.find((p) => p.type === "vente")).toBeUndefined();
  });

  it("ne reclame qu'un encaissement, pour le total, quand la vente s'en passe", () => {
    const paiements = detectPaymentsDue({
      lot: lotSansAcompte,
      lignes: [ligneOrInvest()],
      reglements: [],
      acompte_pct: 10,
    });

    expect(paiements.filter((p) => p.type === "acompte")).toHaveLength(0);
    expect(paiements.filter((p) => p.type === "solde")).toHaveLength(0);

    const vente = paiements.find((p) => p.type === "vente");
    expect(vente?.montant_attendu).toBe(8000);
    expect(vente?.montant_restant).toBe(8000);
  });

  it("additionne bijoux et or d'investissement sur un seul encaissement", () => {
    const paiements = detectPaymentsDue({
      lot: lotSansAcompte,
      lignes: [ligneBijou(), ligneOrInvest()],
      reglements: [],
    });

    const ventes = paiements.filter((p) => p.type === "vente");
    expect(ventes).toHaveLength(1);
    // Le prix du bijou est celui de l'etiquette, TVA sur marge comprise.
    expect(ventes[0].montant_attendu).toBe(9000);
  });

  it("laisse les bijoux a part quand l'or d'investissement attend un acompte", () => {
    const paiements = detectPaymentsDue({
      lot: lotAvecAcompte,
      lignes: [ligneBijou(), ligneOrInvest()],
      reglements: [],
      acompte_pct: 10,
    });

    expect(paiements.find((p) => p.type === "vente")?.montant_attendu).toBe(1000);
    expect(paiements.find((p) => p.type === "acompte")?.montant_attendu).toBe(800);
  });

  it("deduit ce que le client a deja verse sur l'encaissement unique", () => {
    const paiements = detectPaymentsDue({
      lot: lotSansAcompte,
      lignes: [ligneOrInvest()],
      reglements: [reglement({ type: "vente", sens: "entrant", montant: 3000 })],
    });

    const vente = paiements.find((p) => p.type === "vente");
    expect(vente?.montant_restant).toBe(5000);
    expect(vente?.is_fully_paid).toBe(false);
  });
});

describe("paiement fonderie", () => {
  const lotVente = lot({ type: "vente", status: "en_cours" });

  it("ne reclame rien tant que le devis de la fonderie n'est pas saisi", () => {
    const paiements = detectPaymentsDue({
      lot: lotVente,
      reglements: [],
      bonsCommande: [bonCommande({ montant_fonderie: 0 })],
    });

    expect(paiements.filter((p) => p.type === "fonderie")).toHaveLength(0);
  });

  it("reclame le devis et ses frais annexes, jamais le prix de vente", () => {
    const paiements = detectPaymentsDue({
      lot: lotVente,
      reglements: [],
      bonsCommande: [
        bonCommande({ montant_total: 8100, montant_fonderie: 7200, frais_annexes: 45 }),
      ],
    });

    const fonderie = paiements.find((p) => p.type === "fonderie");
    expect(fonderie?.montant_attendu).toBe(7200);
    expect(fonderie?.montant_restant).toBe(7200);
    expect(fonderie?.pre_fill.montant).toBe(7200);
  });

  it("deduit ce qui a deja ete regle a la fonderie", () => {
    const paiements = detectPaymentsDue({
      lot: lotVente,
      reglements: [
        reglement({ type: "fonderie", sens: "sortant", montant: 5000, bon_commande_id: "bdc-1" }),
      ],
      bonsCommande: [bonCommande({ montant_fonderie: 7200 })],
    });

    const fonderie = paiements.find((p) => p.type === "fonderie");
    expect(fonderie?.montant_restant).toBe(2200);
  });
});
