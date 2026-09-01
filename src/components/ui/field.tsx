"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Message d'erreur de formulaire.
 *
 * Fond pastel, contour d'un demi-ton plus foncé, texte de la couleur du contour :
 * la couleur seule ne portait pas l'erreur assez loin sur un formulaire dense,
 * le bloc coloré la rend visible sans avoir a la chercher.
 */
function FieldError({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  if (!children) return null

  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn(
        "rounded-md border border-red-500 bg-red-50 px-2 py-1 text-sm text-red-500",
        "dark:border-red-400/60 dark:bg-red-950/30 dark:text-red-400",
        "animate-in fade-in-0 slide-in-from-top-1 duration-150",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

interface FieldProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Libelle affiche au-dessus du controle. Omis, aucun label n'est rendu. */
  label?: React.ReactNode
  /** Ajoute l'asterisque rouge et marque le controle comme requis. */
  required?: boolean
  /** Message d'erreur. Sa presence marque aussi le controle en `aria-invalid`. */
  error?: string
  /** Texte d'aide, masque des qu'une erreur est presente. */
  hint?: React.ReactNode
  children: React.ReactNode
}

/**
 * Groupe label + controle + erreur.
 *
 * Le controle recoit `aria-invalid` automatiquement quand une erreur est
 * presente : les primitives (`input`, `textarea`, `select`) portent deja les
 * styles `aria-invalid:*`, il suffisait de leur passer l'attribut.
 */
function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
  ...props
}: FieldProps) {
  const child = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{ "aria-invalid"?: boolean }>,
        { "aria-invalid": error ? true : undefined }
      )
    : children

  return (
    <div data-slot="field" className={cn("space-y-1.5", className)} {...props}>
      {label && <Label required={required}>{label}</Label>}
      {child}
      {!error && hint && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
      <FieldError>{error}</FieldError>
    </div>
  )
}

export { Field, FieldError }
