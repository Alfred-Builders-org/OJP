"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Buildings,
  FloppyDisk,
  MapPin,
  NotePencil,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";

export function NewGrossisteClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [nom, setNom] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [siret, setSiret] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  async function handleCreate() {
    if (!nom.trim()) {
      setError("Le nom est obligatoire");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("grossistes")
      .insert({
        nom: nom.trim(),
        raison_sociale: raisonSociale || null,
        siret: siret || null,
        adresse: adresse || null,
        code_postal: codePostal || null,
        ville: ville || null,
        telephone: telephone || null,
        email: email || null,
        notes: notes || null,
      })
      .select("id")
      .single();

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    router.push(`/grossistes/${data.id}`);
  }

  return (
    <>
      <Header
        title="Nouveau grossiste"
        backAction={
          <Button variant="ghost" size="icon-sm" aria-label="Retour" onClick={() => router.back()}>
            <ArrowLeft size={16} weight="regular" />
          </Button>
        }
      >
        <Button size="sm" disabled={saving} onClick={handleCreate}>
          <FloppyDisk size={16} weight="duotone" />
          {saving ? "Création..." : "Créer"}
        </Button>
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {error && <FieldError>{error}</FieldError>}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Buildings size={20} weight="duotone" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label required>Nom</Label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Orus Bijoux" />
              </div>
              <div className="space-y-1.5">
                <Label>Raison sociale</Label>
                <Input value={raisonSociale} onChange={(e) => setRaisonSociale(e.target.value)} placeholder="SASU ORUS BIJOUX" />
              </div>
              <div className="space-y-1.5">
                <Label>SIRET</Label>
                <Input value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="478 244 585 00038" />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="09 75 23 60 62" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@grossiste.fr" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} weight="duotone" />
                Adresse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="219 avenue du Serpolet" />
              </div>
              <div className="space-y-1.5">
                <Label>Code postal</Label>
                <Input value={codePostal} onChange={(e) => setCodePostal(e.target.value)} placeholder="13600" />
              </div>
              <div className="space-y-1.5">
                <Label>Ville</Label>
                <Input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="La Ciotat" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotePencil size={20} weight="duotone" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions, contact commercial, délais de livraison..."
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
