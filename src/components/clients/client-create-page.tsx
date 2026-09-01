"use client";

import { Field, FieldError } from "@/components/ui/field";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as PhUser,
  MapPin as PhMapPin,
  Info as PhInfo,
  FloppyDisk,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectItems,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/dashboard/header";
import { clientSchema, LEAD_SOURCE_OPTIONS, CIVILITY_OPTIONS } from "@/lib/validations/client";
import { CountrySelect } from "@/components/ui/country-select";

export function ClientCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [civility, setCivility] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [maidenName, setMaidenName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("France");
  const [leadSource, setLeadSource] = useState("");
  const [notes, setNotes] = useState("");

  async function handleCreate() {
    const formData = {
      civility,
      first_name: firstName,
      last_name: lastName,
      maiden_name: maidenName,
      email,
      phone,
      address,
      city,
      postal_code: postalCode,
      country,
      lead_source: leadSource,
      notes,
    };

    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        civility,
        first_name: firstName,
        last_name: lastName,
        maiden_name: maidenName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
        country: country || null,
        lead_source: leadSource || null,
        notes: notes || null,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setErrors({ _form: "Erreur lors de la création du client." });
      return;
    }

    toast.success("Client créé");
    router.replace(`/clients/${data.id}`);
  }

  return (
    <>
      <Header
        title="Nouveau client"
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
      <div className="flex-1 p-6">
        {errors._form && (
          <FieldError className="mb-4 ">{errors._form}</FieldError>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhUser size={20} weight="duotone" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Civilité" required error={errors.civility}>
                <Select value={civility} onValueChange={(val) => setCivility(val ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" items={selectItems(CIVILITY_OPTIONS)} />
                  </SelectTrigger>
                  <SelectContent>
                    {CIVILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prénom" required error={errors.first_name}>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" />
              </Field>
              <Field label="Nom" required error={errors.last_name}>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" />
              </Field>
              <Field label="Nom de jeune fille" error={errors.maiden_name}>
                <Input value={maidenName} onChange={(e) => setMaidenName(e.target.value)} />
              </Field>
              <Field label="Email" required error={errors.email}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@exemple.fr" />
              </Field>
              <Field label="Téléphone" error={errors.phone}>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" />
              </Field>
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhMapPin size={20} weight="duotone" />
                Adresse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Adresse" required error={errors.address}>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 rue de la Paix" />
              </Field>
              <Field label="Code postal" required error={errors.postal_code}>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="75001" />
              </Field>
              <Field label="Ville" required error={errors.city}>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" />
              </Field>
              <Field label="Pays" required error={errors.country}>
                <CountrySelect value={country} onValueChange={(v) => setCountry(v)} />
              </Field>
            </CardContent>
          </Card>

          {/* Informations complémentaires */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhInfo size={20} weight="duotone" />
                Informations complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Source" error={errors.lead_source}>
                <Select value={leadSource} onValueChange={(val) => setLeadSource(val ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCE_OPTIONS.map((src) => (
                      <SelectItem key={src} value={src}>
                        {src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Notes" error={errors.notes}>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes additionnelles..."
                  className="min-h-[100px] resize-none"
                />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
