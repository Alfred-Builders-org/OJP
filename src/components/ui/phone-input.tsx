"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { CountryCode } from "libphonenumber-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PAYS_TELEPHONE,
  decomposer,
  filtrerPays,
  formaterSaisie,
  versInternational,
} from "@/lib/telephone";

interface PhoneInputProps {
  /** Numéro au format international, ex. « +33612345678 ». */
  value: string;
  /**
   * Reçoit le numéro au format international quand il est valide, la saisie
   * brute sinon — on ne veut pas perdre ce que l'utilisateur est en train
   * d'écrire sous prétexte qu'il n'a pas fini.
   */
  onValueChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
}

/**
 * Champ téléphone : indicatif à drapeau, masque de saisie du pays choisi,
 * recherche par nom de pays ou par indicatif.
 *
 * Le champ était un simple `type="tel"` sans indicatif ni format : rien ne
 * distinguait un numéro français d'un numéro marocain, et rien n'empêchait une
 * saisie inexploitable.
 */
export function PhoneInput({
  value,
  onValueChange,
  placeholder = "6 12 34 56 78",
  id,
  ...props
}: PhoneInputProps) {
  const initial = decomposer(value);
  const [iso, setIso] = useState<CountryCode>(initial?.iso ?? "FR");
  const [saisie, setSaisie] = useState(initial?.national ?? "");
  const [search, setSearch] = useState("");

  const paysCourant =
    PAYS_TELEPHONE.find((p) => p.iso === iso) ?? PAYS_TELEPHONE[0];
  const filtres = filtrerPays(PAYS_TELEPHONE, search);

  function majSaisie(brut: string, isoCible: CountryCode) {
    const formate = formaterSaisie(brut, isoCible);
    setSaisie(formate);
    onValueChange(versInternational(formate, isoCible) ?? formate);
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={iso}
        onValueChange={(v) => {
          if (!v) return;
          const cible = v as CountryCode;
          setIso(cible);
          // Le masque dépend du pays : on reformate ce qui est déjà saisi.
          majSaisie(saisie, cible);
        }}
      >
        <SelectTrigger className="w-28 shrink-0">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">{paysCourant.flag}</span>
            <span>+{paysCourant.dial}</span>
          </span>
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <div className="flex items-center gap-2 px-2 pb-2 sticky top-0 bg-popover z-10">
            <MagnifyingGlass size={14} className="shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Pays ou indicatif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          {filtres.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun pays trouvé.
            </p>
          ) : (
            filtres.map((p) => (
              <SelectItem key={p.iso} value={p.iso}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{p.flag}</span>
                  <span className="flex-1">{p.label}</span>
                  <span className="text-muted-foreground">+{p.dial}</span>
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={placeholder}
        value={saisie}
        onChange={(e) => majSaisie(e.target.value, iso)}
        {...props}
      />
    </div>
  );
}
