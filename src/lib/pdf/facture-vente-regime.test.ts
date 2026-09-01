import { describe, it, expect } from "vitest";
import {
  ligneSousMarge,
  totauxFactureVente,
  type LigneVenteTaxee,
} from "./facture-vente-regime";

const marge = (prix: number, tva: number): LigneVenteTaxee => ({
  prix_total: prix,
  montant_taxe: tva,
  type_taxe: tva > 0 ? "tva_marge" : null,
});

const normale = (prix: number, tva: number): LigneVenteTaxee => ({
  prix_total: prix,
  montant_taxe: tva,
  type_taxe: "tva_normale",
});

const orInvest = (prix: number): LigneVenteTaxee => ({
  prix_total: prix,
  montant_taxe: 0,
  type_taxe: null,
  or_investissement_id: "or-1",
});

describe("ligneSousMarge", () => {
  it("range sous la marge tout ce qui n'est pas taxé sur le prix entier", () => {
    expect(ligneSousMarge({ type_taxe: "tva_marge" })).toBe(true);
    // Un bijou revendu a perte : pas de TVA, mais la mention lui reste due.
    expect(ligneSousMarge({ type_taxe: null })).toBe(true);
    expect(ligneSousMarge({ type_taxe: "tva_normale" })).toBe(false);
  });

  it("laisse l'or d'investissement dehors : il est exonéré, pas taxé sur une marge", () => {
    expect(ligneSousMarge({ type_taxe: null, or_investissement_id: "or-1" })).toBe(false);
  });
});

describe("totauxFactureVente", () => {
  it("facture entièrement sous marge : rien ne se ventile", () => {
    const t = totauxFactureVente([marge(1000, 66.67), marge(500, 16.67)]);
    expect(t.totalTTC).toBe(1500);
    expect(t.tva).toBe(0);
    expect(t.regimeMarge).toBe(true);
    expect(t.mentionMarge).toBe(true);
  });

  it("la TVA sur marge reste due, même invisible sur la facture", () => {
    const t = totauxFactureVente([marge(1000, 66.67), normale(1200, 200)]);
    // Ce que le client voit ventile : la seule TVA du bien neuf.
    expect(t.tva).toBe(200);
    // Ce que la boutique reverse : les deux.
    expect(t.tvaDue).toBe(266.67);
  });

  it("la TVA sur marge n'est jamais ajoutée au prix affiché", () => {
    // Bijou en vitrine a 1 000 EUR : le client paie 1 000, pas 1 050.
    expect(totauxFactureVente([marge(1000, 66.67)]).totalTTC).toBe(1000);
  });

  it("facture entièrement en régime normal : HT, TVA et TTC", () => {
    const t = totauxFactureVente([normale(1200, 200)]);
    expect(t.totalTTC).toBe(1200);
    expect(t.tva).toBe(200);
    expect(t.totalHT).toBe(1000);
    expect(t.regimeMarge).toBe(false);
    expect(t.mentionMarge).toBe(false);
  });

  it("facture mixte : seule la TVA du bien neuf se mentionne", () => {
    const t = totauxFactureVente([marge(1000, 66.67), normale(1200, 200)]);
    expect(t.totalTTC).toBe(2200);
    // Les 66,67 du bien d'occasion n'apparaissent pas : ils ne sont pas
    // recuperables, et les afficher reviendrait a donner son prix d'achat.
    expect(t.tva).toBe(200);
    expect(t.regimeMarge).toBe(false);
    expect(t.mentionMarge).toBe(true);
  });

  it("une TFOP ancienne s'ajoutait au prix, elle : on la conserve au total", () => {
    const t = totauxFactureVente([
      { prix_total: 1000, montant_taxe: 65, type_taxe: "tfop" },
    ]);
    expect(t.totalTTC).toBe(1065);
    expect(t.tva).toBe(0);
    expect(t.mentionMarge).toBe(true);
  });

  it("or d'investissement seul : rien à ventiler, et aucune mention du 297 A", () => {
    // Vente reglee en une fois : le lingot part sur une facture de vente, sans
    // acompte ni solde. Il est exonere, pas taxe sur la marge.
    const t = totauxFactureVente([orInvest(8000)]);
    expect(t.totalTTC).toBe(8000);
    expect(t.totalHT).toBe(8000);
    expect(t.tva).toBe(0);
    expect(t.tvaDue).toBe(0);
    expect(t.regimeMarge).toBe(false);
    expect(t.mentionMarge).toBe(false);
  });

  it("bijou d'occasion et lingot sur la même facture : la mention ne vise que le bijou", () => {
    const t = totauxFactureVente([marge(1000, 66.67), orInvest(8000)]);
    expect(t.totalTTC).toBe(9000);
    expect(t.tva).toBe(0);
    expect(t.tvaDue).toBe(66.67);
    // Une seule des deux lignes en releve : la facture ne bascule pas
    // entierement sous le regime, mais la mention reste due pour le bijou.
    expect(t.regimeMarge).toBe(false);
    expect(t.mentionMarge).toBe(true);
  });

  it("aucune ligne : ni régime de marge ni mention", () => {
    const t = totauxFactureVente([]);
    expect(t.totalTTC).toBe(0);
    expect(t.regimeMarge).toBe(false);
    expect(t.mentionMarge).toBe(false);
  });
});
