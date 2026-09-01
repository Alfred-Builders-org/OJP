"use client";

import { Keyboard } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Cette liste ne contient que des raccourcis reellement actifs. Elle annoncait
// auparavant Ctrl+N, « / », les fleches de pagination et Entree, qui n'ont
// jamais ete implementes : un raccourci affiche et inerte se lit comme une panne.
const SHORTCUTS = [
  {
    category: "Navigation",
    items: [
      { keys: ["Alt", "D"], description: "Aller au tableau de bord" },
      { keys: ["Alt", "L"], description: "Aller aux lots" },
      { keys: ["Alt", "S"], description: "Aller au stock" },
      { keys: ["Alt", "V"], description: "Aller aux ventes" },
      { keys: ["Alt", "C"], description: "Aller aux clients" },
    ],
  },
  {
    category: "Actions rapides",
    items: [
      { keys: ["Ctrl", "K"], description: "Recherche globale" },
      { keys: ["Alt", "N"], description: "Nouveau dossier" },
      { keys: ["Ctrl", "B"], description: "Replier la barre laterale" },
      { keys: ["Escape"], description: "Fermer le dialog / popover" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function ProfileShortcutsSection() {
  return (
    <div className="space-y-6">
      {SHORTCUTS.map((group) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard size={20} weight="duotone" />
              {group.category}
            </CardTitle>
            <CardDescription>
              Raccourcis clavier pour {group.category.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.items.map((shortcut) => (
                <div
                  key={shortcut.description}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">+</span>
                        )}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
