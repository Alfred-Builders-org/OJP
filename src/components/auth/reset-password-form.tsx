"use client";

import { FieldError } from "@/components/ui/field";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Ou en est la verification du lien recu par courriel. */
type EtatLien = "verification" | "pret" | "invalide";

/**
 * Choix d'un nouveau mot de passe.
 *
 * Le formulaire n'ouvrait pas la session avant d'appeler `updateUser` : il
 * creait le client Supabase au moment du clic, si bien que rien n'avait jamais
 * consomme le jeton du lien recu par courriel. L'appel partait donc sans
 * session et Supabase repondait « Auth session missing » — message que personne
 * ne peut interpreter depuis un ecran de mot de passe oublie.
 *
 * Le jeton arrive sous deux formes selon la maniere dont la demande a ete
 * faite : un `code` en parametre d'URL, ou un couple de jetons dans le fragment.
 * On traite les deux au montage, puis on verifie qu'une session existe vraiment
 * avant d'afficher les champs. Un lien perime ou deja utilise le dit maintenant,
 * au lieu de laisser saisir un mot de passe pour rien.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [etat, setEtat] = useState<EtatLien>("verification");

  useEffect(() => {
    let annule = false;

    async function ouvrirSession() {
      const supabase = createClient();

      // Le fragment n'est jamais transmis au serveur : c'est ici, et seulement
      // ici, qu'on peut le lire.
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const code = new URLSearchParams(window.location.search).get("code");

      // Un jeton present dans l'URL fait foi a lui seul. On ferme donc d'abord
      // toute session deja ouverte dans ce navigateur : sinon, un lien perime
      // laisserait changer le mot de passe du compte connecte — sur le poste
      // partage de la boutique, celui du vendeur, parce qu'une cliente a clique
      // sur un vieux courriel.
      if (accessToken || code) {
        await supabase.auth.signOut({ scope: "local" });
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // `getUser` et non `getSession` : le second se contente de relire ce que
      // le navigateur a stocke, et `setSession` accepte sans broncher un jeton
      // illisible. Seul `getUser` interroge le serveur d'authentification, donc
      // seul lui distingue un lien valable d'un lien perime.
      //
      // Sans jeton dans l'URL, il reconnait la session de qui change son mot de
      // passe depuis son profil.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (annule) return;

      if (user) {
        setEtat("pret");
        // Un jeton d'acces n'a rien a faire dans la barre d'adresse une fois
        // consomme : il partirait dans l'historique et dans le presse-papier
        // de qui copie l'URL.
        if (window.location.hash || code) {
          window.history.replaceState({}, "", window.location.pathname);
        }
      } else {
        setEtat("invalide");
      }
    }

    // Differe d'un tour : la mise a jour d'etat est synchrone dans le cas ou le
    // client repond immediatement, et la declencher pendant l'effet relancerait
    // un rendu en cascade. Le `catch` evite que l'ecran reste fige sur
    // « Verification » si un jeton illisible fait lever la bibliotheque.
    const t = setTimeout(() => {
      ouvrirSession().catch(() => {
        if (!annule) setEtat("invalide");
      });
    }, 0);
    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(
        error.message === "Auth session missing!"
          ? "Votre lien n'est plus valable. Demandez-en un nouveau depuis « Mot de passe oublié »."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (etat === "verification") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <CircleNotch size={18} className="animate-spin" />
          Vérification du lien...
        </CardContent>
      </Card>
    );
  }

  if (etat === "invalide") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lien expiré</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation n&apos;est plus valable. Il ne peut servir
            qu&apos;une fois, et reste actif une heure.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full" onClick={() => router.push("/forgot-password")}>
            Demander un nouveau lien
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/sign-in")}
          >
            Retour à la connexion
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour votre compte.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <FieldError>{error}</FieldError>}
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <PasswordInput
              id="password"
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
