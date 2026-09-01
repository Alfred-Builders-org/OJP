"use client";

import { useState, useEffect } from "react";
import { Timer } from "@phosphor-icons/react";
import { formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RetractationTimerProps {
  startDate: string | null;
  endDate: string | null;
  /** Compact inline display (no card wrapper) */
  compact?: boolean;
}

/**
 * Met en forme le temps restant.
 *
 * Sous l'heure, on descend a la minute ; sous la minute, aux secondes. Le
 * compte a rebours affichait « 0h 0m » pendant toute la derniere minute, ce qui
 * se lit comme un compteur en panne au moment precis ou il compte le plus.
 */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

/**
 * Cadence de rafraichissement : inutile de battre la seconde pendant 48 heures,
 * indispensable dans la derniere minute.
 */
function tickInterval(remainingMs: number): number {
  return remainingMs <= 60_000 ? 1_000 : 30_000;
}

export function RetractationTimer({ startDate, endDate, compact }: RetractationTimerProps) {
  const [now, setNow] = useState<Date | null>(null);

  const remainingForTick = endDate && now ? new Date(endDate).getTime() - now.getTime() : 0;

  // Le premier rendu est aligne sur le serveur (pas d'horloge), puis le
  // composant prend la main cote client : sans cela, l'hydratation diverge.
  // La premiere lecture passe par un timeout plutot qu'un appel synchrone, qui
  // declencherait une cascade de rendus.
  useEffect(() => {
    if (!endDate) return;
    const premier = setTimeout(() => setNow(new Date()), 0);
    const interval = setInterval(
      () => setNow(new Date()),
      tickInterval(remainingForTick)
    );
    return () => {
      clearTimeout(premier);
      clearInterval(interval);
    };
  }, [endDate, remainingForTick]);

  if (!endDate) return null;

  const reference = now ?? new Date(0);
  const end = new Date(endDate);
  const start = startDate ? new Date(startDate) : null;
  const canFinalize = now !== null && now >= end;

  // Progress calculation
  const totalDuration = start ? end.getTime() - start.getTime() : 48 * 3600_000;
  const elapsed = start && now ? now.getTime() - start.getTime() : 0;
  const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

  const diff = end.getTime() - reference.getTime();
  const remaining = now === null ? "—" : formatRemaining(diff);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Timer size={14} weight="duotone" className={canFinalize ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
        {canFinalize ? (
          <span className="text-emerald-600 dark:text-emerald-400">Délai expiré</span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">{remaining}</span>
        )}
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Timer size={20} weight="duotone" />
          Délai de rétractation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-amber-200 dark:bg-amber-900/40">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500 dark:bg-amber-400"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {start && <span>Début : {formatDateTime(start.toISOString())}</span>}
            <span>Fin : {formatDateTime(end.toISOString())}</span>
          </div>
        </div>

        {/* Countdown or expired */}
        <div className="text-sm font-medium">
          {canFinalize ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Délai expiré — le lot peut être finalisé
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400">
              {remaining} restantes
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
