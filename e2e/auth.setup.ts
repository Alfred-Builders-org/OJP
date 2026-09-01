import { test as setup, expect } from "@playwright/test";

// Les identifiants du compte de recette viennent de l'environnement, jamais du
// depot : celui-ci est public, et le compte doit etre proprietaire pour que les
// pages Parametres et Utilisateurs se chargent. Un mot de passe ecrit ici
// ouvrirait un acces d'administration a quiconque lit le depot.
//
// Sans ces deux variables, `playwright.config.ts` n'enregistre ni ce projet ni
// les tests authentifies : la suite publique tourne seule.
const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

setup("authenticate", async ({ page }) => {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error(
      "E2E_EMAIL et E2E_PASSWORD sont requis pour authentifier la suite de recette."
    );
  }

  await page.goto("/sign-in");

  await page.fill("input[type='email']", E2E_EMAIL);
  await page.fill("input[type='password']", E2E_PASSWORD);
  await page.getByRole("button", { name: /se connecter/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

  // Save signed-in state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
