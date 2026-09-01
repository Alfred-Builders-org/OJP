"use client";

import { Field, FieldError } from "@/components/ui/field";

import { useState } from "react";
import {
  User as PhUser,
  MapPin as PhMapPin,
  Info as PhInfo,
  IdentificationCard as PhIdCard,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientSchema, LEAD_SOURCE_OPTIONS, DOCUMENT_TYPE_OPTIONS, CIVILITY_OPTIONS } from "@/lib/validations/client";
import { CountrySelect } from "@/components/ui/country-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { NationalitySelect } from "@/components/ui/nationality-select";
import { DatePicker } from "@/components/ui/date-picker";
import { getNationalityForCountry } from "@/lib/validations/client";
import type { Client } from "@/types/client";

interface ClientCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: Client) => void;
}

export function ClientCreateDialog({ open, onOpenChange, onClientCreated }: ClientCreateDialogProps) {
  const [saving, setSaving] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Client form state
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

  // Identity document state
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docNationality, setDocNationality] = useState("Française");
  const [docIssueDate, setDocIssueDate] = useState("");
  const [docExpiryDate, setDocExpiryDate] = useState("");

  function resetForm() {
    setClientErrors({});
    setCivility("");
    setFirstName("");
    setLastName("");
    setMaidenName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setCountry("France");
    setLeadSource("");
    setNotes("");
    setDocType("");
    setDocNumber("");
    setDocNationality("Française");
    setDocIssueDate("");
    setDocExpiryDate("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

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
    const fieldErrors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
    }

    // Validate identity document
    if (!docType) fieldErrors.doc_type = "Le type de document est requis";
    if (!docNumber) fieldErrors.doc_number = "Le numéro de document est requis";

    if (Object.keys(fieldErrors).length > 0) {
      setClientErrors(fieldErrors);
      return;
    }

    setClientErrors({});
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error: insertError } = await supabase
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

    if (insertError) {
      setSaving(false);
      toast.error("Erreur lors de la création du client");
      return;
    }

    // Insert identity document
    const { error: docError } = await supabase
      .from("client_identity_documents")
      .insert({
        client_id: data.id,
        document_type: docType,
        document_number: docNumber,
        nationality: docNationality || null,
        issue_date: docIssueDate || null,
        expiry_date: docExpiryDate || null,
        is_primary: true,
      });

    setSaving(false);

    if (docError) {
      toast.error("Client créé mais erreur lors de l'ajout de la pièce d'identité");
      return;
    }

    toast.success("Client créé");
    onClientCreated({ ...data, is_valid: true } as Client);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[calc(100vw-4rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhUser size={20} weight="duotone" />
            Nouveau client
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau client qui sera automatiquement sélectionné pour le dossier.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2 py-2">
          {clientErrors._form && (
            <FieldError className="md:col-span-2 ">{clientErrors._form}</FieldError>
          )}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PhUser size={18} weight="duotone" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Civilité" required error={clientErrors.civility}>
                <Select value={civility} onValueChange={(v) => setCivility(v ?? "")}>
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
              <Field label="Prénom" required error={clientErrors.first_name}>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" />
              </Field>
              <Field label="Nom" required error={clientErrors.last_name}>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" />
              </Field>
              <Field label="Nom de jeune fille" error={clientErrors.maiden_name}>
                <Input value={maidenName} onChange={(e) => setMaidenName(e.target.value)} />
              </Field>
              <Field label="Email" required error={clientErrors.email}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@exemple.fr" required />
              </Field>
              <Field label="Téléphone" error={clientErrors.phone}>
                <PhoneInput value={phone} onValueChange={setPhone} />
              </Field>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhIdCard size={18} weight="duotone" />
                  Pièce d&apos;identité *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Type de document" required error={clientErrors.doc_type}>
                  <Select value={docType} onValueChange={(v) => setDocType(v ?? "")}>
                    <SelectTrigger>
                      {docType
                        ? DOCUMENT_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType
                        : <SelectValue placeholder="Sélectionner" />}
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Numéro" required error={clientErrors.doc_number}>
                  <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="N° du document" />
                </Field>
                <Field label="Nationalité" error={clientErrors.doc_nationality}>
                  <NationalitySelect value={docNationality} onValueChange={setDocNationality} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date d'émission" error={clientErrors.doc_issue_date}>
                    <DatePicker
                      value={docIssueDate ? new Date(docIssueDate) : undefined}
                      onChange={(d) => setDocIssueDate(d ? d.toISOString().split("T")[0] : "")}
                      placeholder="Sélectionner"
                    />
                  </Field>
                  <Field label="Date d'expiration" error={clientErrors.doc_expiry_date}>
                    <DatePicker
                      value={docExpiryDate ? new Date(docExpiryDate) : undefined}
                      onChange={(d) => setDocExpiryDate(d ? d.toISOString().split("T")[0] : "")}
                      placeholder="Sélectionner"
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhMapPin size={18} weight="duotone" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Adresse" required error={clientErrors.address}>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 rue de la Paix" required />
                </Field>
                <Field label="Code postal" required error={clientErrors.postal_code}>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="75001" required />
                </Field>
                <Field label="Ville" required error={clientErrors.city}>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" required />
                </Field>
                <Field label="Pays" required error={clientErrors.country}>
                  <CountrySelect value={country} onValueChange={(v) => { setCountry(v); setDocNationality(getNationalityForCountry(v)); }} />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhInfo size={18} weight="duotone" />
                  Complémentaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Source" error={clientErrors.lead_source}>
                  <Select value={leadSource} onValueChange={(v) => setLeadSource(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCE_OPTIONS.map((src) => (
                        <SelectItem key={src} value={src}>{src}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Notes" error={clientErrors.notes}>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes additionnelles..."
                    className="min-h-[80px] resize-none"
                  />
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Annuler
          </Button>
          <Button size="sm" disabled={saving} onClick={handleCreate}>
            <FloppyDisk size={14} weight="duotone" />
            {saving ? "Création..." : "Ajouter le client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
