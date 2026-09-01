"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass, CircleNotch, MapPin } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { CountrySelect } from "@/components/ui/country-select";

export interface AdresseDetaillee {
  address: string;
  postal_code: string;
  city: string;
  country: string;
  street_number?: string | null;
  route?: string | null;
  formatted_address?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Suggestion {
  place_id: string;
  description: string;
}

interface AddressAutocompleteProps {
  value: AdresseDetaillee;
  onChange: (adresse: AdresseDetaillee) => void;
  errors?: Partial<Record<"address" | "postal_code" | "city" | "country", string>>;
  /** Ouvre d'emblée la saisie détaillée (fiche client en modification). */
  defaultManuel?: boolean;
}

/**
 * Champ adresse avec autocomplétion.
 *
 * On cherche, on clique sur une proposition, les champs détaillés se
 * remplissent. Le lien sous le champ ouvre la saisie manuelle — indispensable
 * pour les adresses que le service ne connaît pas, et seul mode disponible tant
 * que la clé d'API n'est pas configurée. L'écran reste donc utilisable en
 * toutes circonstances.
 */
export function AddressAutocomplete({
  value,
  onChange,
  errors = {},
  defaultManuel = false,
}: AddressAutocompleteProps) {
  const [requete, setRequete] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [chargement, setChargement] = useState(false);
  const [manuel, setManuel] = useState(defaultManuel);
  const [indisponible, setIndisponible] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (manuel || requete.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const minuteur = setTimeout(async () => {
      abort.current?.abort();
      const controleur = new AbortController();
      abort.current = controleur;
      setChargement(true);
      try {
        const res = await fetch(
          `/api/adresse?q=${encodeURIComponent(requete)}`,
          { signal: controleur.signal }
        );
        if (res.status === 503) {
          // Pas de clé configurée : on bascule en saisie manuelle sans bruit.
          setIndisponible(true);
          setManuel(true);
          return;
        }
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        // Une recherche interrompue ou en échec ne doit rien casser : le lien
        // de saisie manuelle reste disponible juste en dessous.
      } finally {
        setChargement(false);
      }
    }, 300);

    return () => clearTimeout(minuteur);
  }, [requete, manuel]);

  async function choisir(suggestion: Suggestion) {
    setSuggestions([]);
    setRequete(suggestion.description);
    try {
      const res = await fetch(`/api/adresse/${suggestion.place_id}`);
      if (!res.ok) return;
      const detail: AdresseDetaillee = await res.json();
      onChange({ ...value, ...detail });
      setManuel(true);
    } catch {
      setManuel(true);
    }
  }

  return (
    <div className="space-y-3">
      {!manuel && (
        <div className="space-y-1.5">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-8"
              placeholder="Rechercher une adresse..."
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              autoComplete="off"
            />
            {chargement && (
              <CircleNotch
                size={16}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 animate-spin text-muted-foreground"
              />
            )}
          </div>

          {suggestions.length > 0 && (
            <ul className="rounded-lg border bg-popover shadow-md ring-1 ring-foreground/10">
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => choisir(s)}
                  >
                    <MapPin size={14} weight="duotone" className="shrink-0 text-muted-foreground" />
                    {s.description}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => setManuel(true)}
          >
            Ou insérer l&apos;adresse manuellement
          </button>
        </div>
      )}

      {manuel && (
        <>
          {indisponible && (
            <p className="text-sm text-muted-foreground">
              La recherche d&apos;adresse n&apos;est pas encore configurée. Saisissez
              l&apos;adresse ci-dessous.
            </p>
          )}
          <Field label="Adresse" required error={errors.address}>
            <Input
              value={value.address}
              onChange={(e) => onChange({ ...value, address: e.target.value })}
              placeholder="12 rue de la Paix"
            />
          </Field>
          <Field label="Code postal" required error={errors.postal_code}>
            <Input
              value={value.postal_code}
              onChange={(e) => onChange({ ...value, postal_code: e.target.value })}
              placeholder="75001"
            />
          </Field>
          <Field label="Ville" required error={errors.city}>
            <Input
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="Paris"
            />
          </Field>
          <Field label="Pays" required error={errors.country}>
            <CountrySelect
              value={value.country}
              onValueChange={(v) => onChange({ ...value, country: v })}
            />
          </Field>
          {!indisponible && (
            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={() => setManuel(false)}
            >
              Revenir à la recherche d&apos;adresse
            </button>
          )}
        </>
      )}
    </div>
  );
}
