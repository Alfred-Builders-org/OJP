import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            // Le widget de support Alfrhelp est servi par api-ui.up.railway.app :
            // il lui faut le script, ses appels (dont le temps reel), et de quoi
            // monter son panneau — sans quoi le script se charge et rien ne
            // s'affiche, seul symptome d'un CSP trop ferme.
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api-ui.up.railway.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://api-ui.up.railway.app; font-src 'self' https://api-ui.up.railway.app; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api-ui.up.railway.app wss://api-ui.up.railway.app; frame-src blob: https://api-ui.up.railway.app; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
