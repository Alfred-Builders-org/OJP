import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";

/**
 * Lien interne vers une page de l'app, ouvert dans un nouvel onglet.
 *
 * Le lien porte sa couleur et son soulignement en permanence : en `text-foreground`
 * il était indiscernable du texte courant, et ne se révélait qu'au survol.
 * Pendant la recette, les seuls éléments colorés de l'aide étaient les badges de
 * statut — qui ne sont pas cliquables — si bien qu'on cliquait dessus sans
 * jamais trouver les vrais liens.
 */
export function AppLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="group/link inline-flex items-center gap-0 rounded-md px-1.5 py-0.5 -mx-1 -my-0.5 font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors cursor-pointer hover:bg-muted hover:decoration-primary"
    >
      {children}
      <span className="inline-flex items-center overflow-hidden transition-all duration-200 w-0 opacity-0 group-hover/link:w-4 group-hover/link:opacity-60">
        <CaretRight weight="bold" className="ml-1 size-3 shrink-0 text-primary" />
      </span>
    </Link>
  );
}
