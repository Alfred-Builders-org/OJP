import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
        <Script
          src="https://alfrhelp-web-staging.up.railway.app/widget.js"
          data-site-id="6270b1bc-b08d-4c63-aabc-e02d97f0c252"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
