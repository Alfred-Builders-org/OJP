import { describe, it, expect } from "vitest";
import { destinationDuFragment } from "./recuperation-redirect";

const JETON = "access_token=abc&refresh_token=def";

describe("destinationDuFragment", () => {
  it("renvoie une invitation vers le choix du mot de passe", () => {
    // Le cas qui manquait : la personne invitee atterrissait sur l'ecran de
    // connexion, dont elle n'a justement pas encore le mot de passe.
    expect(destinationDuFragment(`#${JETON}&type=invite`)).toBe("/reset-password");
  });

  it("renvoie une reinitialisation vers le choix du mot de passe", () => {
    expect(destinationDuFragment(`#${JETON}&type=recovery`)).toBe("/reset-password");
  });

  it("accepte un fragment sans diese", () => {
    expect(destinationDuFragment(`${JETON}&type=invite`)).toBe("/reset-password");
  });

  it("signale un lien perime plutot que de laisser un ecran muet", () => {
    const fragment =
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
    expect(destinationDuFragment(fragment)).toBe("/sign-in?error=lien");
  });

  it("ne touche pas a une confirmation d'inscription", () => {
    // Elle n'a rien a faire sur l'ecran de mot de passe : son atterrissage
    // normal est le tableau de bord.
    expect(destinationDuFragment(`#${JETON}&type=signup`)).toBeNull();
  });

  it("ne fait rien sans jeton", () => {
    expect(destinationDuFragment("#type=invite")).toBeNull();
  });

  it("ne fait rien sur une URL sans fragment", () => {
    expect(destinationDuFragment("")).toBeNull();
  });
});
