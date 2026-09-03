"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, Diamond, UsersThree, FolderOpen, ClipboardText, Factory, UserGear, Receipt, Buildings, BookOpen, Money, Wrench } from "@phosphor-icons/react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/types/auth";

// Un seul inventaire : rachats, depots-vente et achats grossistes vivent dans
// le meme stock, avec l'origine en colonne. Trois listes separees obligeaient a
// savoir d'ou venait un article avant de pouvoir le chercher.
// Le catalogue Or investissement a rejoint les parametres : c'est un
// referentiel qu'on regle, pas un inventaire qu'on consulte au comptoir.
const stockItems = [
  { title: "Stock", href: "/stock", icon: Diamond, disabled: false },
  { title: "Grossistes", href: "/grossistes", icon: Buildings, disabled: false },
  // L'atelier tient ses propres lignes : un bijou apporte par un client n'entre
  // pas en stock, il n'apparaitrait nulle part ailleurs.
  { title: "Réparations", href: "/reparations", icon: Wrench, disabled: false },
];

// Le « Suivi » a disparu du menu : la fonte se lit desormais dans les operations
// (chaque envoi est un lot de fonte), et le detail d'un bon de livraison s'ouvre
// depuis la. Le routage reste — c'est la qu'on compose les envois.
const fonderieItems = [
  { title: "Fonderies", href: "/fonderies", icon: Factory, disabled: false },
  { title: "Routage", href: "/fonderie/routage", icon: ClipboardText, disabled: false },
];

const comptabiliteItems = [
  // La feuille du jour se consulte le matin et se solde le soir : elle vient
  // avant les impots, qu'on ne regarde qu'au trimestre.
  { title: "Caisse", href: "/caisse", icon: Money, disabled: false },
  { title: "Impôts", href: "/impots", icon: Receipt, disabled: false },
  // Le registre des objets mobiliers repond a une obligation penale, pas
  // fiscale — mais c'est aupres de la comptabilite qu'on va le chercher.
  { title: "Registre", href: "/registre", icon: BookOpen, disabled: false },
];

// Rachats, ventes et depots-vente se consultent depuis leur dossier — c'est la
// qu'ils prennent leur sens, au regard du client et de l'affaire qui les porte.
// « Operations » ouvre la meme matiere par l'autre bout : par l'affaire quand on
// ne sait plus de quel client elle relevait, ou pour balayer un trimestre.
const crmItems = [
  { title: "Clients", href: "/clients", icon: UsersThree, disabled: false },
  { title: "Dossiers", href: "/dossiers", icon: FolderOpen, disabled: false },
  { title: "Opérations", href: "/operations", icon: ClipboardText, disabled: false },
];

interface SidebarNavProps {
  role: UserRole;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const isOwner = role === "proprietaire" || role === "super_admin";

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                render={<Link href="/dashboard" />}
              >
                <SquaresFour size={18} weight="duotone" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>CRM</SidebarGroupLabel>
        <SidebarSeparator className="mb-2" />
        <SidebarGroupContent>
          <SidebarMenu className="gap-2">
            {crmItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  disabled={item.disabled}
                  render={item.disabled ? undefined : <Link href={item.href} />}
                >
                  <item.icon size={18} weight="duotone" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isOwner && (
        <SidebarGroup>
          <SidebarGroupLabel>Comptabilité</SidebarGroupLabel>
          <SidebarSeparator className="mb-2" />
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {comptabiliteItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    disabled={item.disabled}
                    render={item.disabled ? undefined : <Link href={item.href} />}
                  >
                    <item.icon size={18} weight="duotone" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {isOwner && (
        <SidebarGroup>
          <SidebarGroupLabel>Fonderie</SidebarGroupLabel>
          <SidebarSeparator className="mb-2" />
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {fonderieItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    disabled={item.disabled}
                    render={item.disabled ? undefined : <Link href={item.href} />}
                  >
                    <item.icon size={18} weight="duotone" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <SidebarGroup>
        <SidebarGroupLabel>Stock</SidebarGroupLabel>
        <SidebarSeparator className="mb-2" />
        <SidebarGroupContent>
          <SidebarMenu className="gap-2">
            {stockItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  disabled={item.disabled}
                  render={item.disabled ? undefined : <Link href={item.href} />}
                >
                  <item.icon size={18} weight="duotone" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isOwner && (
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarSeparator className="mb-2" />
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/utilisateurs" || pathname.startsWith("/utilisateurs/")}
                  render={<Link href="/utilisateurs" />}
                >
                  <UserGear size={18} weight="duotone" />
                  <span>Utilisateurs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
