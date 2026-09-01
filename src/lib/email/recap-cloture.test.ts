import { describe, it, expect } from "vitest";
import { composerRecap, nommerPiece, type LotClos, type DocumentClos } from "./recap-cloture";
import { gabaritDossierCloture, texteDe } from "./gabarits";

const CLIENT = { civilite: "M", prenom: "Camille", nom: "Perret" };

function lot(patch: Partial<LotClos> = {}): LotClos {
  return {
    id: "lot-1",
    numero: "RAC-2026-0033",
    type: "rachat",
    outcome: "complete",
    montant: 1250,
    nbArticles: 3,
    articles: [
      { designation: "Bague or 18 carats", quantite: 1, montant: 620, sort: null },
      { designation: "Chaîne maille forçat", quantite: 2, montant: 630, sort: null },
    ],
    ...patch,
  };
}

function doc(patch: Partial<DocumentClos> = {}): DocumentClos {
  return {
    type: "contrat_rachat",
    numero: "CRA-2026-0007",
    storage_path: "dossiers/dos-1/contrat.pdf",
    ...patch,
  };
}

describe("nommerPiece", () => {
  it("nomme la pièce comme le client la lira", () => {
    expect(nommerPiece(doc())).toBe("Contrat de rachat CRA-2026-0007.pdf");
  });

  it("écarte les pièces échangées avec la fonderie", () => {
    expect(nommerPiece(doc({ type: "bon_commande" }))).toBeNull();
    expect(nommerPiece(doc({ type: "bon_livraison" }))).toBeNull();
  });

  it("se passe du numéro quand il manque", () => {
    expect(nommerPiece(doc({ numero: null }))).toBe("Contrat de rachat.pdf");
  });
});

describe("composerRecap", () => {
  it("porte une ligne par lot, avec sa nature en clair", () => {
    const { recap } = composerRecap(
      CLIENT,
      "DOS-2026-0012",
      [lot(), lot({ id: "lot-2", numero: "DV-2026-0004", type: "depot_vente" })],
      []
    );

    expect(recap.lots).toHaveLength(2);
    expect(recap.lots[0].nature).toBe("rachat");
    expect(recap.lots[1].nature).toBe("dépôt-vente");
  });

  it("ne mentionne aucune issue sur un lot mené à terme", () => {
    const { recap } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], []);
    expect(recap.lots[0].issue).toBeNull();
  });

  it("dit ce qui est arrivé à un lot sans suite", () => {
    const { recap } = composerRecap(
      CLIENT,
      "DOS-2026-0012",
      [lot({ outcome: "retracte" }), lot({ id: "l2", outcome: "refuse" })],
      []
    );

    expect(recap.lots[0].issue).toBe("rétracté");
    expect(recap.lots[1].issue).toBe("devis refusé");
  });

  it("ne joint que les pièces destinées au client", () => {
    const { recap, pieces } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], [
      doc(),
      doc({ type: "bon_commande", numero: "BDC-2026-0002" }),
      doc({ type: "facture_vente", numero: "FAC-2026-0009" }),
    ]);

    expect(pieces).toHaveLength(2);
    expect(recap.documents).toEqual([
      "Contrat de rachat CRA-2026-0007.pdf",
      "Facture FAC-2026-0009.pdf",
    ]);
  });

  it("écarte un document dont le fichier manque", () => {
    const { pieces } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], [
      doc({ storage_path: "" }),
    ]);

    expect(pieces).toEqual([]);
  });
});

describe("gabaritDossierCloture", () => {
  it("nomme le dossier dans le sujet", () => {
    const { recap } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], []);
    expect(gabaritDossierCloture(recap).sujet).toContain("DOS-2026-0012");
  });

  it("ne totalise pas un dossier à lot unique", () => {
    const { recap } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], []);
    const corps = texteDe(gabaritDossierCloture(recap));

    expect(corps).not.toContain("Total");
  });

  it("totalise dès qu'il y a plusieurs lots", () => {
    const { recap } = composerRecap(
      CLIENT,
      "DOS-2026-0012",
      [lot({ montant: 1250 }), lot({ id: "l2", montant: 750 })],
      []
    );
    // Intl sépare les milliers par une espace insécable étroite : on compare
    // sur un texte normalisé plutôt que sur l'apparence du caractère.
    const corps = texteDe(gabaritDossierCloture(recap)).replace(/\s/g, " ");

    expect(corps).toContain("Total");
    expect(corps).toContain("2 000,00 €");
  });

  // Le corps annonce les pièces, il ne les redessine pas : les nommer une
  // seconde fois dans le message doublait ce que la messagerie affiche déjà.
  it("annonce les pièces sans recopier leurs noms", () => {
    const { recap } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], [
      doc(),
      doc({ type: "facture_vente", numero: "FAC-2026-0009" }),
    ]);
    const corps = texteDe(gabaritDossierCloture(recap));

    expect(corps).toContain("Les 2 documents de votre dossier sont joints");
    expect(corps).not.toContain("CRA-2026-0007.pdf");
  });

  it("accorde la mention au singulier sur une pièce unique", () => {
    const { recap } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], [doc()]);

    expect(texteDe(gabaritDossierCloture(recap))).toContain(
      "Le document de votre dossier est joint"
    );
  });

  it("ne parle pas de pièce jointe quand il n'y en a aucune", () => {
    const { recap } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], []);
    const corps = texteDe(gabaritDossierCloture(recap));

    expect(corps).not.toContain("joint");
  });

  it("détaille les articles, puis referme sur la ligne du lot", () => {
    const { recap } = composerRecap(CLIENT, "DOS-2026-0012", [lot()], []);
    const corps = texteDe(gabaritDossierCloture(recap));

    const positionArticle = corps.indexOf("Bague or 18 carats");
    const positionLot = corps.indexOf("RAC-2026-0033 — rachat");

    expect(positionArticle).toBeGreaterThan(-1);
    expect(positionLot).toBeGreaterThan(positionArticle);
  });

  it("nomme le sort d'un article qui n'a pas suivi le cours normal", () => {
    const { recap } = composerRecap(
      CLIENT,
      "DOS-2026-0012",
      [
        lot({
          articles: [
            { designation: "Bracelet jonc", quantite: 1, montant: 940, sort: null },
            { designation: "Montre plaquée", quantite: 1, montant: 0, sort: "devis refusé" },
          ],
        }),
      ],
      []
    );
    const corps = texteDe(gabaritDossierCloture(recap));

    expect(corps).toContain("Montre plaquée");
    expect(corps).toContain("devis refusé");
  });

  it("accorde le singulier et le pluriel des articles", () => {
    const un = composerRecap(CLIENT, "DOS-1", [lot({ nbArticles: 1 })], []).recap;
    const trois = composerRecap(CLIENT, "DOS-1", [lot({ nbArticles: 3 })], []).recap;

    expect(texteDe(gabaritDossierCloture(un))).toContain("1 article —");
    expect(texteDe(gabaritDossierCloture(trois))).toContain("3 articles —");
  });
});
