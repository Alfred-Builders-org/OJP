import { defineConfig, devices } from "@playwright/test";

// Les tests authentifies ne s'enregistrent que si le compte de recette est
// fourni par l'environnement. Sans lui, le projet `setup` produirait un
// `storageState` absent et chaque test dependant echouerait sur un defaut de
// configuration plutot que sur un defaut du produit.
const hasE2ECredentials = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    // Public tests (no auth needed). Accessibilite, theme sombre et responsive
    // ne visitent que /sign-in, /register et /forgot-password : ils tiennent
    // dans cette suite.
    {
      name: "public",
      testMatch:
        /auth\.spec\.ts|security\.spec\.ts|accessibility\.spec\.ts|dark-mode\.spec\.ts|responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Setup project — authenticates and saves state
    ...(hasE2ECredentials
      ? [
          {
            name: "setup",
            testMatch: /auth\.setup\.ts/,
          },
          // Authenticated tests
          {
            name: "authenticated",
            testMatch: /authenticated\.spec\.ts/,
            dependencies: ["setup"],
            use: {
              ...devices["Desktop Chrome"],
              storageState: "e2e/.auth/user.json",
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: "npm run dev -- -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },
});
