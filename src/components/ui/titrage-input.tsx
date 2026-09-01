"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TITRAGES_COURANTS,
  TITRAGE_MIN,
  TITRAGE_MAX,
} from "@/lib/validations/lot";

interface TitrageInputProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Désactivé pour les matières dont le titrage n'a pas de sens. */
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
}

/**
 * Saisie du titrage, en millièmes.
 *
 * C'était un menu à cinq entrées (333, 375, 585, 750, 999), qui laissait de côté
 * des titrages courants : 800 et 925 pour l'argent, 950 pour le platine. On
 * saisit désormais la valeur, entre 0 et 1000, et les titrages habituels restent
 * proposés en raccourci sous le champ.
 *
 * Désactivé, il indique pourquoi : sur du plaqué ou une matière non précieuse,
 * le titrage n'a pas de sens et le prix n'en dépend pas.
 */
export function TitrageInput({
  value,
  onValueChange,
  disabled,
  id,
  ...props
}: TitrageInputProps) {
  return (
    <div className="space-y-1.5">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={TITRAGE_MIN}
        max={TITRAGE_MAX}
        step="1"
        placeholder="750"
        value={disabled ? "" : value}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
      {disabled ? (
        <p className="text-xs text-muted-foreground">
          Sans objet sur cette matière : le prix ne dépend que du poids.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {TITRAGES_COURANTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onValueChange(String(t))}
              aria-label={`Titrage ${t} millièmes`}
            >
              <Badge
                variant={value === String(t) ? "secondary" : "outline"}
                className="cursor-pointer font-normal tabular-nums hover:bg-muted"
              >
                {t}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
