import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Hr,
  Section,
  Row,
  Column,
  Img,
  Button,
  Link,
} from "@react-email/components";
import * as React from "react";

interface AuthEmailProps {
  titre: string;
  /** Une ligne par paragraphe. */
  lignes: string[];
  /** Le lien d'action, absent sur un courriel qui ne porte qu'un code. */
  lien?: string;
  libelleBouton?: string;
  /** Code a six chiffres, pour la reauthentification. */
  code?: string;
  /** Duree de validite annoncee, en clair. */
  validite?: string;
  /**
   * Logo, en absolu. Un courriel n'a pas de racine : l'adresse doit etre
   * complete, et suivre l'environnement qui l'envoie.
   */
  logoUrl: string;
}

/**
 * Courriel d'authentification.
 *
 * Distinct du gabarit des notifications metier : celui-la porte du texte
 * parametre par l'utilisateur, celui-ci porte une action unique, et une action
 * se clique. Un lien de reinitialisation noye dans un paragraphe, en petit et
 * en bleu, se rate — d'ou le bouton, et l'URL repetee en dessous pour les
 * clients de messagerie qui n'affichent pas les boutons.
 */
export function AuthEmail({
  titre,
  lignes,
  lien,
  libelleBouton = "Continuer",
  code,
  validite,
  logoUrl,
}: AuthEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Meme en-tete que les courriels metier : la marque en petit, a
              gauche. Le logo s'affichait auparavant en cent quatre-vingts
              pixels centres sur un bandeau noir, ce qui donnait au courriel
              l'allure d'une lettre d'information plutot que d'un message de
              la boutique. */}
          <Section style={headerStyle}>
            <Row>
              <Column style={{ width: "36px", verticalAlign: "middle" }}>
                <Img src={logoUrl} width="28" height="28" alt="" style={logoStyle} />
              </Column>
              <Column style={{ verticalAlign: "middle" }}>
                <Text style={enseigneStyle}>L&apos;Or au Juste Prix</Text>
              </Column>
            </Row>
          </Section>

          <Section style={contentStyle}>
            <Text style={titreStyle}>{titre}</Text>

            {lignes.map((ligne, i) => (
              <Text key={i} style={textStyle}>
                {ligne}
              </Text>
            ))}

            {code && (
              <Section style={codeBoxStyle}>
                <Text style={codeStyle}>{code}</Text>
              </Section>
            )}

            {lien && (
              <>
                <Section style={{ textAlign: "center", margin: "28px 0 20px" }}>
                  <Button href={lien} style={buttonStyle}>
                    {libelleBouton}
                  </Button>
                </Section>

                <Text style={petitStyle}>
                  Si le bouton ne fonctionne pas, copiez cette adresse dans votre
                  navigateur :
                </Text>
                <Link href={lien} style={lienStyle}>
                  {lien}
                </Link>
              </>
            )}

            {validite && <Text style={petitStyle}>{validite}</Text>}
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              L&apos;Or au Juste Prix — Achat, vente et dépôt-vente d&apos;or et bijoux
            </Text>
            <Text style={footerTextStyle}>
              Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez ce
              message : aucune action ne sera engagée.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "40px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  maxWidth: "580px",
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
  padding: "32px",
};

const titreStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "19px",
  fontWeight: 600,
  lineHeight: "1.4",
  margin: "0 0 16px 0",
};

const textStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 500,
  padding: "12px 28px",
  textDecoration: "none",
};

const codeBoxStyle: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  borderRadius: "6px",
  margin: "20px 0",
  padding: "16px",
  textAlign: "center" as const,
};

const codeStyle: React.CSSProperties = {
  color: "#18181b",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "28px",
  fontWeight: 600,
  letterSpacing: "6px",
  margin: 0,
};

const petitStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "16px 0 4px 0",
};

const lienStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  wordBreak: "break-all" as const,
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "0",
};

const footerStyle: React.CSSProperties = {
  padding: "20px 32px",
};

const footerTextStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
  textAlign: "center" as const,
};
