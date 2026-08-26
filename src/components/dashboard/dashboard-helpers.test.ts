import { describe, it, expect } from "vitest";
import {
  isOperationAboutie,
  FILTRE_OPERATION_ABOUTIE,
  OUTCOMES_SANS_SUITE,
} from "./dashboard-helpers";

/**
 * Règle métier issue de la recette du 13 août : un rachat rétracté et un devis
 * refusé produisent tous deux un lot `finalise`, exactement comme un rachat
 * mené à terme. Sans le filtre sur `outcome`, l'application réclame un
 * paiement pour une marchandise qui n'est jamais entrée en boutique.
 */
describe("isOperationAboutie", () => {
  it("retient une opération menée à son terme", () => {
    expect(isOperationAboutie("complete")).toBe(true);
  });

  it("écarte une rétractation", () => {
    expect(isOperationAboutie("retracte")).toBe(false);
  });

  it("écarte un devis refusé", () => {
    expect(isOperationAboutie("refuse")).toBe(false);
  });

  it("écarte une vente annulée", () => {
    expect(isOperationAboutie("annule")).toBe(false);
  });

  it("retient les lots antérieurs à la colonne outcome", () => {
    // NULL signifie « issue non renseignée », pas « sans suite » : ces lots
    // doivent continuer d'apparaître dans les paiements dus.
    expect(isOperationAboutie(null)).toBe(true);
    expect(isOperationAboutie(undefined)).toBe(true);
  });

  it("couvre toutes les issues déclarées sans suite", () => {
    for (const outcome of OUTCOMES_SANS_SUITE) {
      expect(isOperationAboutie(outcome)).toBe(false);
    }
  });
});

describe("FILTRE_OPERATION_ABOUTIE", () => {
  it("combine le cas NULL et une exclusion groupée", () => {
    // Un OU de `neq` successifs laisserait tout passer : « retracte » est
    // différent de « refuse ». Seul `not.in` exprime correctement la règle.
    expect(FILTRE_OPERATION_ABOUTIE).toBe(
      "outcome.is.null,outcome.not.in.(retracte,refuse,annule)",
    );
  });
});
