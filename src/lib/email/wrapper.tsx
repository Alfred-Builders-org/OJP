import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Row,
  Column,
  Img,
  Hr,
} from "@react-email/components";
import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { mentionPieces, type Bloc } from "./gabarits";

/**
 * La mise en forme des courriels de la boutique.
 *
 * Le gabarit fournit des blocs, jamais du HTML : ici on decide a quoi
 * ressemble un article, un sous-total, une echeance. La premiere version
 * recevait une chaine de caracteres et empilait des lignes de texte — elle ne
 * pouvait ni aligner une colonne de prix, ni distinguer un article de la
 * synthese de son lot.
 *
 * Tout est en style en ligne et en tableaux : c'est ce que les messageries
 * savent afficher. Une feuille de style externe ou une grille moderne serait
 * ignoree par la moitie d'entre elles.
 */

interface EmailWrapperProps {
  blocs: Bloc[];
  /**
   * Logo, en absolu. Un courriel n'a pas de racine : l'adresse doit etre
   * complete, et suivre l'environnement qui l'envoie. Absente, l'enseigne
   * s'ecrit en toutes lettres.
   */
  logoUrl?: string;
}

const ENSEIGNE = "L'Or au Juste Prix";

export function EmailWrapper({ blocs, logoUrl }: EmailWrapperProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* En-tete : la marque en petit, a gauche, comme un en-tete de lettre. */}
          <Section style={headerStyle}>
            <Row>
              {logoUrl && (
                <Column style={{ width: "36px", verticalAlign: "middle" }}>
                  <Img src={logoUrl} width="28" height="28" alt="" style={logoStyle} />
                </Column>
              )}
              <Column style={{ verticalAlign: "middle" }}>
                <Text style={enseigneStyle}>{ENSEIGNE}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={contentStyle}>
            {blocs.map((bloc, i) => (
              <BlocRendu key={i} bloc={bloc} />
            ))}
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              {ENSEIGNE} — Achat, vente et dépôt-vente d&apos;or et bijoux
            </Text>
            <Text style={footerTextStyle}>
              Message automatique — merci de ne pas y répondre.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function BlocRendu({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case "paragraphe":
      return <Text style={textStyle}>{bloc.texte}</Text>;

    case "note":
      return <Text style={noteStyle}>{bloc.texte}</Text>;

    /**
     * Un lot : ses articles, puis sa propre ligne en dessous.
     *
     * L'ordre n'est pas indifferent. Le detail se lit d'abord, la synthese le
     * referme — comme un ticket de caisse. L'inverse obligeait a redescendre
     * pour savoir a quoi se rapportait le total.
     */
    case "lot":
      return (
        <Section style={lotStyle}>
          {bloc.articles.map((article, i) => (
            <Row key={i} style={{ marginBottom: "6px" }}>
              <Column>
                <Text style={articleStyle}>{article.designation}</Text>
                {article.sort && <Text style={sortStyle}>{article.sort}</Text>}
              </Column>
              <Column style={{ width: "40px", textAlign: "right" as const }}>
                <Text style={quantiteStyle}>×{article.quantite}</Text>
              </Column>
              <Column style={{ width: "90px", textAlign: "right" as const }}>
                <Text style={montantArticleStyle}>{formatCurrency(article.montant)}</Text>
              </Column>
            </Row>
          ))}

          <Hr style={separateurLotStyle} />

          <Row>
            <Column>
              <Text style={lotNumeroStyle}>{bloc.numero}</Text>
              <Text style={lotNatureStyle}>
                {bloc.nature} · {bloc.nbArticles} article{bloc.nbArticles > 1 ? "s" : ""}
                {bloc.issue ? ` · ${bloc.issue}` : ""}
              </Text>
            </Column>
            <Column style={{ width: "110px", textAlign: "right" as const }}>
              <Text style={lotMontantStyle}>{formatCurrency(bloc.montant)}</Text>
            </Column>
          </Row>
        </Section>
      );

    case "total":
      return (
        <Row style={totalStyle}>
          <Column>
            <Text style={totalLibelleStyle}>Total du dossier</Text>
          </Column>
          <Column style={{ width: "120px", textAlign: "right" as const }}>
            <Text style={totalMontantStyle}>{formatCurrency(bloc.montant)}</Text>
          </Column>
        </Row>
      );

    case "liste":
      return (
        <Section style={listeStyle}>
          {bloc.items.map((item, i) => (
            <Text key={i} style={listeItemStyle}>
              {item}
            </Text>
          ))}
        </Section>
      );

    /** Ce que le client doit retenir : un montant, une date. */
    case "encadre":
      return (
        <Section style={encadreStyle}>
          {bloc.lignes.map((ligne, i) => (
            <Row key={i}>
              <Column>
                <Text style={encadreLibelleStyle}>{ligne.libelle}</Text>
              </Column>
              <Column style={{ textAlign: "right" as const }}>
                <Text style={ligne.fort ? encadreValeurForteStyle : encadreValeurStyle}>
                  {ligne.valeur}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>
      );

    /**
     * Les pieces jointes ne sont pas redessinees ici.
     *
     * Le corps les listait dans des cadres gris portant nom et extension. Ces
     * cadres avaient l'apparence de boutons de telechargement et n'en etaient
     * pas : le client voyait deux fois ses documents, une fois en trompe-l'oeil
     * dans le message, une fois pour de bon dans la barre de sa messagerie.
     */
    case "pieces":
      return <Text style={noteStyle}>{mentionPieces(bloc.noms.length)}</Text>;

    case "signature":
      return (
        <Section style={{ marginTop: "28px" }}>
          <Text style={textStyle}>Cordialement,</Text>
          <Text style={signatureStyle}>{ENSEIGNE}</Text>
        </Section>
      );
  }
}

/* ──────────────────────── STYLES ──────────────────────── */

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 12px",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  border: "1px solid #e4e4e7",
  maxWidth: "600px",
  margin: "0 auto",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  padding: "20px 32px",
  borderBottom: "1px solid #f4f4f5",
};

const logoStyle: React.CSSProperties = {
  borderRadius: "7px",
  display: "block",
};

const enseigneStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "-0.2px",
  margin: 0,
  paddingLeft: "10px",
};

const contentStyle: React.CSSProperties = {
  padding: "28px 32px 8px",
};

const textStyle: React.CSSProperties = {
  color: "#27272a",
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "0 0 14px 0",
};

const noteStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 14px 0",
};

const lotStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "10px",
  padding: "16px 18px 12px",
  margin: "0 0 14px 0",
};

const articleStyle: React.CSSProperties = {
  color: "#27272a",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: 0,
};

// Le sort d'un article — refuse, retracte — se lit sous sa designation, en
// petites capitales : c'est une exception, elle doit se remarquer sans crier.
const sortStyle: React.CSSProperties = {
  color: "#a16207",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase" as const,
  margin: "2px 0 0 0",
};

const quantiteStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  margin: 0,
};

const montantArticleStyle: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  margin: 0,
  whiteSpace: "nowrap" as const,
};

const separateurLotStyle: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "12px 0",
};

const lotNumeroStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: 600,
  margin: 0,
};

const lotNatureStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  margin: "2px 0 0 0",
};

const lotMontantStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: 600,
  margin: 0,
  whiteSpace: "nowrap" as const,
};

const totalStyle: React.CSSProperties = {
  padding: "4px 18px 16px",
};

const totalLibelleStyle: React.CSSProperties = {
  color: "#52525b",
  fontSize: "14px",
  margin: 0,
};

const totalMontantStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
  whiteSpace: "nowrap" as const,
};

const listeStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "10px",
  padding: "14px 18px",
  margin: "0 0 16px 0",
};

const listeItemStyle: React.CSSProperties = {
  color: "#27272a",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
};

const encadreStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderLeft: "3px solid #18181b",
  borderRadius: "0 8px 8px 0",
  padding: "14px 18px",
  margin: "0 0 16px 0",
};

const encadreLibelleStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  margin: "0 0 2px 0",
};

const encadreValeurStyle: React.CSSProperties = {
  color: "#27272a",
  fontSize: "14px",
  fontWeight: 500,
  margin: "0 0 2px 0",
  whiteSpace: "nowrap" as const,
};

const encadreValeurForteStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "18px",
  fontWeight: 700,
  margin: "0 0 2px 0",
  whiteSpace: "nowrap" as const,
};




const signatureStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "15px",
  fontWeight: 600,
  margin: 0,
};

const hrStyle: React.CSSProperties = {
  borderColor: "#f4f4f5",
  margin: "20px 0 0 0",
};

const footerStyle: React.CSSProperties = {
  padding: "16px 32px 22px",
};

const footerTextStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 3px 0",
  textAlign: "center" as const,
};
