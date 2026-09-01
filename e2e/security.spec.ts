import { test, expect } from "@playwright/test";

test.describe("Security", () => {
  test("protected routes redirect to sign-in", async ({ page }) => {
    const protectedRoutes = [
      "/dashboard",
      "/clients",
      "/dossiers",
      "/lots",
      "/ventes",
      "/stock",
      "/or-investissement",
      "/parametres",
      "/utilisateurs",
      "/fonderies",
      "/commandes",
      "/profile",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/sign-in/, {
        timeout: 5000,
      });
    }
  });

  test("auth callback rejects open redirect", async ({ page }) => {
    const response = await page.goto("/auth/callback?code=invalid&next=//evil.com");
    const url = page.url();
    expect(url).not.toContain("evil.com");
    expect(url).toContain("sign-in");
  });

  test("API routes return 401 for unauthenticated requests", async ({ request }) => {
    const routes = [
      { url: "/api/search?q=test", method: "GET" as const },
      { url: "/api/users/invite", method: "POST" as const },
    ];

    for (const route of routes) {
      const response = route.method === "GET"
        ? await request.get(route.url)
        : await request.post(route.url, { data: {} });
      expect(response.status()).toBe(401);
    }
  });

  /**
   * Le balayage des courriels n'est appele par aucun utilisateur : c'est
   * `pg_cron` qui frappe, avec un secret partage. La route doit donc refuser
   * un appel nu — 401 quand le secret est configure et ne correspond pas, 503
   * quand il ne l'est pas du tout, comme sur cet environnement de recette.
   * Ce qui compte ici est qu'aucun courriel ne parte sur une simple requete.
   */
  test("le balayage des courriels refuse un appel sans secret", async ({ request }) => {
    const response = await request.post("/api/cron/emails", { data: {} });
    expect([401, 503]).toContain(response.status());
  });

  test("security headers are present", async ({ page }) => {
    const response = await page.goto("/sign-in");
    const headers = response?.headers() ?? {};
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });
});
