"use client"

import * as React from "react"
import { Eye, EyeSlash } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * Champ mot de passe avec bascule d'affichage.
 *
 * Le geste existait deja sur l'ecran de securite du profil, nulle part ailleurs :
 * on saisissait a l'aveugle pour se connecter, s'inscrire ou definir un nouveau
 * mot de passe, sans moyen de verifier ce qu'on venait de taper.
 */
function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
      >
        {visible ? (
          <EyeSlash size={16} weight="duotone" />
        ) : (
          <Eye size={16} weight="duotone" />
        )}
      </Button>
    </div>
  )
}

export { PasswordInput }
