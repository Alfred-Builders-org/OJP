import {
  getCountries,
  getCountryCallingCode,
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export interface PaysTelephone {
  /** Code ISO 3166-1 alpha-2, ex. « FR ». */
  iso: CountryCode;
  /** Nom du pays en francais, ex. « France ». */
  label: string;
  /** Indicatif sans le plus, ex. « 33 ». */
  dial: string;
  /** Drapeau emoji, derive du code ISO. */
  flag: string;
}

/**
 * Pays les plus frequents en boutique, dans l'ordre ou ils doivent apparaitre :
 * la France d'abord, puis la francophonie, puis les Etats-Unis. Le reste suit
 * par ordre alphabetique.
 */
const PRIORITAIRES: CountryCode[] = [
  "FR", "BE", "CH", "LU", "MC", "CA",
  "MA", "TN", "DZ", "SN", "CI", "CM", "CD", "MG",
  "US",
];

/**
 * Le drapeau emoji d'un pays est son code ISO transpose dans les Regional
 * Indicator Symbols. Aucune image a embarquer, aucune police a charger.
 */
function drapeau(iso: string): string {
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

/**
 * Liste des pays avec indicatif, construite a partir de libphonenumber et des
 * noms de region du navigateur. Ecrire et maintenir une table de 245 entrees a
 * la main n'aurait servi qu'a la voir vieillir.
 */
export const PAYS_TELEPHONE: PaysTelephone[] = (() => {
  const noms = new Intl.DisplayNames(["fr"], { type: "region" });
  const tous = getCountries().map((iso) => ({
    iso,
    label: noms.of(iso) ?? iso,
    dial: getCountryCallingCode(iso),
    flag: drapeau(iso),
  }));

  const rang = new Map(PRIORITAIRES.map((iso, i) => [iso, i]));
  const prioritaires = tous
    .filter((p) => rang.has(p.iso))
    .sort((a, b) => rang.get(a.iso)! - rang.get(b.iso)!);
  const autres = tous
    .filter((p) => !rang.has(p.iso))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return [...prioritaires, ...autres];
})();

/** Recherche par nom de pays ou par indicatif, avec ou sans le plus. */
export function filtrerPays(pays: PaysTelephone[], requete: string): PaysTelephone[] {
  const q = requete.trim().toLowerCase();
  if (!q) return pays;
  const chiffres = q.replace(/^\+/, "");
  return pays.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.dial.startsWith(chiffres) ||
      p.iso.toLowerCase() === q
  );
}

/** Applique le masque de saisie du pays au fil de la frappe. */
export function formaterSaisie(valeur: string, iso: CountryCode): string {
  return new AsYouType(iso).input(valeur);
}

/**
 * Numero au format international, seule forme stockee : un numero saisi en
 * France et un autre au Maroc doivent pouvoir se relire sans connaitre le
 * contexte de saisie.
 */
export function versInternational(valeur: string, iso: CountryCode): string | null {
  const numero = parsePhoneNumberFromString(valeur, iso);
  return numero?.isValid() ? numero.number : null;
}

/** Sépare un numéro stocké en indicatif + reste, pour réafficher le bon pays. */
export function decomposer(
  valeur: string | null | undefined
): { iso: CountryCode; national: string } | null {
  if (!valeur) return null;
  const numero = parsePhoneNumberFromString(valeur);
  if (!numero?.country) return null;
  return { iso: numero.country, national: numero.formatNational() };
}
