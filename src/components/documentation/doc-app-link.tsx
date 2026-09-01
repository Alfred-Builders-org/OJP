import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";

/**
 * Lien interne vers une page de l'app, ouvert dans un nouvel onglet.
 *
 * Le lien est en noir, comme demandé en recette : la couleur d'accent ne
 * ressortait pas assez sur le fond de l'aide.
 *
 * Le soulignement permanent, lui, est conservé — et c'est important. Il avait
 * été introduit après une recette précédente : en `text-foreground` sans
 * soulignement, le lien était indiscernable du texte courant, et les seuls
 * éléments colorés de l'aide étaient les badges de statut, qui ne sont pas
 * cliquables. On cliquait donc dessus sans jamais trouver les vrais liens.
 * Retirer la couleur et le soulignement d'un même geste recréerait ce défaut :
 * c'est le soulignement qui porte désormais seul l'affordance.
 */
export function AppLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="group/link inline-flex items-center gap-0 rounded-md px-1.5 py-0.5 -mx-1 -my-0.5 font-medium text-foreground underline decoration-foreground/50 underline-offset-2 transition-colors cursor-pointer hover:bg-muted hover:decoration-foreground"
    >
      {children}
      <span className="inline-flex items-center overflow-hidden transition-all duration-200 w-0 opacity-0 group-hover/link:w-4 group-hover/link:opacity-60">
        <CaretRight weight="bold" className="ml-1 size-3 shrink-0 text-foreground" />
      </span>
    </Link>
  );
}
