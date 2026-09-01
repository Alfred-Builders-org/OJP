"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, Diamond, UsersThree, FolderOpen, ClipboardText, Factory, UserGear, Receipt, Fire, Buildings, BookOpen } from "@phosphor-icons/react";
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
];

const fonderieItems = [
  { title: "Fonderies", href: "/fonderies", icon: Factory, disabled: false },
  { title: "Routage", href: "/fonderie/routage", icon: ClipboardText, disabled: false },
  { title: "Suivi", href: "/fonderie/suivi", icon: Fire, disabled: false },
];

const comptabiliteItems = [
  { title: "Impôts", href: "/impots", icon: Receipt, disabled: false },
  // Le registre des objets mobiliers repond a une obligation penale, pas
  // fiscale — mais c'est aupres de la comptabilite qu'on va le chercher.
  { title: "Registre", href: "/registre", icon: BookOpen, disabled: false },
];

// Rachats, ventes et depots-vente se consultent depuis leur dossier : ils n'ont
// de sens qu'au regard du client et de l'affaire qui les porte.
const crmItems = [
  { title: "Clients", href: "/clients", icon: UsersThree, disabled: false },
  { title: "Dossiers", href: "/dossiers", icon: FolderOpen, disabled: false },
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
