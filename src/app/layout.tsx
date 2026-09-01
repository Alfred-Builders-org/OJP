import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentationProvider } from "@/components/agentation-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Or au Juste Prix",
  description: "Or au Juste Prix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Support Alfrhelp. La bulle flottante est masquee a dessein : le
          support s'ouvre depuis le menu utilisateur, sous « Documentation »,
          la ou l'on cherche deja son profil et l'aide. Le script est pose ici
          pour toutes les pages ; un `defer` qui echoue ne casse rien et ne
          montre rien.
        */}
        <script
          src="https://api-ui.up.railway.app/alfrhelp/alfrhelp.js"
          data-key="pk_77193f4854b8de3359ea6ec2ec87c1d9"
          data-alfrhelp-hide-launcher=""
          defer
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/*
          Le clair est le theme de la boutique : on y compare des metaux et des
          pierres a l'oeil, sous la lumiere du comptoir. Suivre l'OS faisait
          basculer l'application en sombre chez qui l'a regle ainsi, sans qu'il
          l'ait demande pour ce poste-la. « Systeme » reste offert dans le
          profil, pour qui le veut.
        */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <AgentationProvider />
      </body>
    </html>
  );
}
