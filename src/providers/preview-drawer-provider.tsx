"use client";

import { createContext, useState, useCallback, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";
import { PreviewRouter, type EntityType, entityLabels, entityRoutes } from "@/components/preview/preview-router";

export interface PreviewDrawerContextValue {
  openPreview: (type: EntityType, id: string) => void;
  closePreview: () => void;
  isOpen: boolean;
}

export const PreviewDrawerContext =
  createContext<PreviewDrawerContextValue | null>(null);

export function PreviewDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<{
    type: EntityType;
    id: string;
  } | null>(null);

  const openPreview = useCallback((type: EntityType, id: string) => {
    setCurrentEntity({ type, id });
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
  }, []);

  const href = currentEntity
    ? `/${entityRoutes[currentEntity.type]}/${currentEntity.id}`
    : "#";

  return (
    <PreviewDrawerContext.Provider value={{ openPreview, closePreview, isOpen }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-lg w-full overflow-y-auto"
        >
          {/* « Ouvrir en pleine page » en haut à gauche, la croix de fermeture
              restant en haut à droite : les deux sorties du tiroir sont ainsi
              visibles d'emblée. Le bouton était auparavant en pied de panneau,
              qu'il fallait atteindre en faisant défiler tout le contenu.
              La marge droite laisse la place à la croix, positionnée en absolu. */}
          <SheetHeader className="flex-row items-center gap-2 pr-10">
            <Link href={href} onClick={() => setIsOpen(false)}>
              <Button variant="outline" size="sm">
                <ArrowSquareOut size={14} weight="duotone" />
                Pleine page
              </Button>
            </Link>
            <SheetTitle className="truncate">
              {currentEntity ? entityLabels[currentEntity.type] : "Aperçu"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 px-4">
            {currentEntity && (
              <PreviewRouter
                type={currentEntity.type}
                id={currentEntity.id}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </PreviewDrawerContext.Provider>
  );
}
