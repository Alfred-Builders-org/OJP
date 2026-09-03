import { describe, it, expect } from "vitest";
import {
  calculerPrixRachatBijoux,
  calculerPrixRachatOrInvest,
  getCoursMetalFromSnapshot,
} from "./prix-rachat";

// ============================================================
// calculerPrixRachatBijoux
// ============================================================
describe("calculerPrixRachatBijoux", () => {
  it("calcule correctement pour de l'or 18k", () => {
    // cours=65, qualite=750, poids=10g, coeff=0.85
    // 65 * (750/1000) * 10 * 0.85 = 65 * 0.75 * 10 * 0.85 = 414.375
    expect(calculerPrixRachatBijoux(65, 750, 10, 0.85)).toBe(414.38);
  });

  it("calcule correctement pour de l'or 24k", () => {
    // cours=65, qualite=999, poids=5g, coeff=0.90
    // 65 * (999/1000) * 5 * 0.90 = 65 * 0.999 * 5 * 0.90 = 292.2075
    expect(calculerPrixRachatBijoux(65, 999, 5, 0.9)).toBe(292.21);
  });

  it("retourne 0 si le poids est 0", () => {
    expect(calculerPrixRachatBijoux(65, 750, 0, 0.85)).toBe(0);
  });

  it("retourne 0 pour NaN dans n'importe quel paramètre", () => {
    expect(calculerPrixRachatBijoux(NaN, 750, 10, 0.85)).toBe(0);
    expect(calculerPrixRachatBijoux(65, NaN, 10, 0.85)).toBe(0);
    expect(calculerPrixRachatBijoux(65, 750, NaN, 0.85)).toBe(0);
    expect(calculerPrixRachatBijoux(65, 750, 10, NaN)).toBe(0);
  });

  it("retourne 0 pour Infinity", () => {
    expect(calculerPrixRachatBijoux(Infinity, 750, 10, 0.85)).toBe(0);
  });

  it("retourne 0 pour des valeurs négatives", () => {
    expect(calculerPrixRachatBijoux(-65, 750, 10, 0.85)).toBe(0);
    expect(calculerPrixRachatBijoux(65, -750, 10, 0.85)).toBe(0);
    expect(calculerPrixRachatBijoux(65, 750, -10, 0.85)).toBe(0);
    expect(calculerPrixRachatBijoux(65, 750, 10, -0.85)).toBe(0);
  });
});

// ============================================================
// calculerPrixRachatOrInvest
// ============================================================
describe("calculerPrixRachatOrInvest", () => {
  it("calcule correctement pour un lingot", () => {
    // cours=65, titre=999, poids=100g, coeff=0.95
    // 65 * 0.999 * 100 * 0.95 = 6168.825 → 6168.83
    expect(calculerPrixRachatOrInvest(65, 999, 100, 0.95)).toBe(6168.83);
  });

  it("applique le titre : le poids du catalogue est un poids brut", () => {
    // Un Napoléon pèse 6,45 g brut au titre 900, soit 5,81 g d'or fin. Le
    // catalogue porte le poids brut — c'est celui des cotations du marché —
    // donc le titre doit être appliqué pour redescendre à l'or fin.
    // 65 * 0.9 * 6.45 * 0.92 = 347.139 → 347.14
    expect(calculerPrixRachatOrInvest(65, 900, 6.45, 0.92)).toBe(347.14);
  });

  it("reproduit le prix pratiqué sur VEN-2026-0022 (demi-souverain)", () => {
    // Ancrage sur une vente réelle : cours de l'or 121,146 €/g, demi-souverain
    // de 3,99 g brut au titre 916, coefficient de vente 1,05.
    // 121.146 * 0.916 * 3.99 * 1.05 = 464.9077… → 464.91
    expect(calculerPrixRachatOrInvest(121.146, 916, 3.99, 1.05)).toBe(464.91);
  });

  it("arrondit à 2 décimales", () => {
    // 65 * 1 * 3.11 * 0.88 = 177.8872 → 177.89
    expect(calculerPrixRachatOrInvest(65, 1000, 3.11, 0.88)).toBe(177.89);
  });

  it("retourne 0 pour NaN", () => {
    expect(calculerPrixRachatOrInvest(NaN, 999, 100, 0.95)).toBe(0);
    expect(calculerPrixRachatOrInvest(65, NaN, 100, 0.95)).toBe(0);
    expect(calculerPrixRachatOrInvest(65, 999, NaN, 0.95)).toBe(0);
    expect(calculerPrixRachatOrInvest(65, 999, 100, NaN)).toBe(0);
  });

  it("retourne 0 pour Infinity", () => {
    expect(calculerPrixRachatOrInvest(Infinity, 999, 100, 0.95)).toBe(0);
  });

  it("retourne 0 pour des valeurs négatives", () => {
    expect(calculerPrixRachatOrInvest(-65, 999, 100, 0.95)).toBe(0);
    expect(calculerPrixRachatOrInvest(65, -999, 100, 0.95)).toBe(0);
    expect(calculerPrixRachatOrInvest(65, 999, -100, 0.95)).toBe(0);
    expect(calculerPrixRachatOrInvest(65, 999, 100, -0.95)).toBe(0);
  });

  it("retourne 0 si cours est 0", () => {
    expect(calculerPrixRachatOrInvest(0, 999, 100, 0.95)).toBe(0);
  });

  it("retourne 0 si le titre est absent", () => {
    // Un titre manquant vaut zéro plutôt qu'or fin : un prix nul se voit à
    // l'écran, une surévaluation silencieuse de 10 % ne se voit pas.
    expect(calculerPrixRachatOrInvest(65, 0, 100, 0.95)).toBe(0);
  });
});

// ============================================================
// getCoursMetalFromSnapshot
// ============================================================
describe("getCoursMetalFromSnapshot", () => {
  it("retourne le cours de l'or", () => {
    expect(getCoursMetalFromSnapshot("Or", 65, 0.8, 30)).toBe(65);
  });

  it("retourne le cours de l'argent", () => {
    expect(getCoursMetalFromSnapshot("Argent", 65, 0.8, 30)).toBe(0.8);
  });

  it("retourne le cours du platine", () => {
    expect(getCoursMetalFromSnapshot("Platine", 65, 0.8, 30)).toBe(30);
  });
});
