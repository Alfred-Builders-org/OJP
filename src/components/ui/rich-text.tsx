"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

import { cn } from "@/lib/utils";

/**
 * Rendu en lecture d'un contenu produit par l'éditeur riche.
 *
 * Le contenu est du HTML : il passe par DOMPurify avant d'être injecté. Les
 * notes sont saisies par l'équipe, mais elles transitent par la base et rien ne
 * garantit qu'un import ou une reprise de données n'y glissera pas autre chose.
 *
 * Les anciennes notes sont du texte brut : sans balise, elles s'affichent telles
 * quelles, le `whitespace-pre-wrap` préservant leurs retours à la ligne.
 */
export function RichText({
  html,
  className,
  fallback = "—",
}: {
  html: string | null | undefined;
  className?: string;
  fallback?: string;
}) {
  const propre = useMemo(
    () => (html ? DOMPurify.sanitize(html) : ""),
    [html]
  );

  if (!propre.trim()) {
    return <p className="text-sm text-muted-foreground">{fallback}</p>;
  }

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-sm whitespace-pre-wrap dark:prose-invert",
        className
      )}
      dangerouslySetInnerHTML={{ __html: propre }}
    />
  );
}
