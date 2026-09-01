"use client";

import { FieldError } from "@/components/ui/field";

import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  FloppyDisk,
  X,
  Diamond,
  Lightning,
  FileText,
  Info,
  CurrencyEur,
  Receipt,
  Wallet,
} from "@phosphor-icons/react";
import { parse } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  selectItems,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { METAL_OPTIONS, METAL_GROUPES, estMetalPrixFixe } from "@/lib/validations/lot";
import { TitrageInput } from "@/components/ui/titrage-input";
import {
  calculerPrixBijou,
  getCoursMetalFromSnapshot,
  TARIFS_FIXES_DEFAUT,
  type TarifsFixes,
} from "@/lib/calculations/prix-rachat";
import { calculerTFOP } from "@/lib/calculations/taxes";
import { formatCurrency, formatDateISO } from "@/lib/format";
import { PhotosUpload } from "@/components/photos/photos-upload";
import type { LotReference } from "@/types/lot";

interface ReferenceFormBijouxProps {
  lotId: string;
  coursOrSnapshot: number;
  coursArgentSnapshot: number;
  coursPlatineSnapshot: number;
  coefficientSnapshot: number;
  coefficientVenteSnapshot: number;
  onClose: () => void;
  editData?: LotReference;
  lotType?: "rachat" | "depot_vente";
  commissionDvPct?: number;
  /** Tarifs au gramme des matieres sans cours, tels que parametres. */
  tarifs?: TarifsFixes;
}

export function ReferenceFormBijoux({
  lotId,
  coursOrSnapshot,
  coursArgentSnapshot,
  coursPlatineSnapshot,
  coefficientSnapshot,
  coefficientVenteSnapshot,
  onClose,
  editData,
  lotType = "rachat",
  commissionDvPct = 40,
  tarifs = TARIFS_FIXES_DEFAUT,
}: ReferenceFormBijouxProps) {
  const isDepotVente = lotType === "depot_vente";
  const isEdit = !!editData;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [typeRachat, setTypeRachat] = useState<"direct" | "devis">(editData?.type_rachat ?? "direct");
  const [designation, setDesignation] = useState(editData?.designation ?? "");
  const [metal, setMetal] = useState<string>(editData?.metal ?? "");
  const [qualite, setQualite] = useState(editData?.qualite ?? "");
  const [poidsBrut, setPoidsBrut] = useState(editData?.poids_brut?.toString() ?? editData?.poids?.toString() ?? "");
  const [poidsNet, setPoidsNet] = useState(editData?.poids_net?.toString() ?? editData?.poids?.toString() ?? "");
  const [poidsNetTouched, setPoidsNetTouched] = useState(false);
  const [quantite, setQuantite] = useState(editData?.quantite?.toString() ?? "1");
  const [prixAchatManuel, setPrixAchatManuel] = useState(editData?.prix_achat?.toString() ?? "");
  const [prixReventeManuel, setPrixReventeManuel] = useState(editData?.prix_revente_estime?.toString() ?? "");
  const [commissionLocal, setCommissionLocal] = useState(commissionDvPct.toString());

  // Photos de l'article, facultatives. En creation la reference n'a pas encore
  // d'identifiant : les cliches attendent ici et sont rattaches a
  // l'enregistrement. Fermer sans enregistrer les efface du bucket.
  const [photos, setPhotos] = useState<string[]>([]);
  const enregistreRef = useRef(false);
  // Ce qui etait deja en base au chargement : la difference avec `photos` dit
  // ce qu'il faut inscrire et ce qu'il faut retirer a l'enregistrement.
  const photosInitialesRef = useRef<string[]>([]);

  // Une matiere a tarif fixe n'a ni cours ni titrage : son prix ne depend que du
  // poids et du tarif decide par la boutique.
  const prixFixe = estMetalPrixFixe(metal);

  const prixCalcule = useMemo(() => {
    if (!metal || !poidsNet) return null;
    if (!prixFixe && !qualite) return null;
    return calculerPrixBijou({
      metal,
      coursMetalGramme: getCoursMetalFromSnapshot(
        metal,
        coursOrSnapshot,
        coursArgentSnapshot,
        coursPlatineSnapshot
      ),
      qualite: parseInt(qualite) || 0,
      poids: parseFloat(poidsNet),
      coefficient: coefficientSnapshot,
      tarifs,
    });
  }, [metal, prixFixe, qualite, poidsNet, coursOrSnapshot, coursArgentSnapshot, coursPlatineSnapshot, coefficientSnapshot, tarifs]);

  const commissionPct = parseFloat(commissionLocal) || commissionDvPct;

  const prixVenteCalcule = useMemo(() => {
    if (isDepotVente) {
      const basePrix = prixAchatManuel ? parseFloat(prixAchatManuel) : prixCalcule;
      if (basePrix === null || isNaN(basePrix)) return null;
      const markup = 1 + commissionPct / 100;
      return Math.round(basePrix * markup * 100) / 100;
    }
    if (!metal || !poidsNet) return null;
    if (!prixFixe && !qualite) return null;
    return calculerPrixBijou({
      metal,
      coursMetalGramme: getCoursMetalFromSnapshot(
        metal,
        coursOrSnapshot,
        coursArgentSnapshot,
        coursPlatineSnapshot
      ),
      qualite: parseInt(qualite) || 0,
      poids: parseFloat(poidsNet),
      coefficient: coefficientVenteSnapshot,
      tarifs,
    });
  }, [metal, prixFixe, qualite, poidsNet, coursOrSnapshot, coursArgentSnapshot, coursPlatineSnapshot, coefficientVenteSnapshot, isDepotVente, prixAchatManuel, prixCalcule, commissionPct, tarifs]);

  // --- Calculs fiscaux (rachat uniquement) ---
  const qty = parseInt(quantite) || 1;
  const prixAchatTotal = (() => {
    const unitaire = prixAchatManuel ? parseFloat(prixAchatManuel) : prixCalcule;
    if (unitaire === null || isNaN(unitaire)) return null;
    return Math.round(unitaire * qty * 100) / 100;
  })();

  // Taxe forfaitaire sur les objets precieux : 6 % + 0,5 % de CRDS au-dela de
  // 5 000 EUR.
  //
  // L'assiette est la REFERENCE entiere — prix unitaire multiplie par la
  // quantite — et non l'unite prise a part. Trois chevalieres a 2 000 EUR
  // saisies sur une meme ligne forment donc une assiette de 6 000 EUR, taxee.
  // C'est la meme regle que sur une quittance de rachat classique : une
  // reference est une cession.
  const tfopMontant = !isDepotVente && prixAchatTotal !== null ? calculerTFOP(prixAchatTotal) : null;

  useEffect(() => {
    if (!editData) return;
    let annule = false;
    const supabase = createClient();
    supabase
      .from("lot_photos")
      .select("chemin")
      .eq("reference_id", editData.id)
      .order("created_at")
      .order("rang")
      .then(({ data }) => {
        if (annule) return;
        const chemins = (data ?? []).map((p) => p.chemin as string);
        photosInitialesRef.current = chemins;
        setPhotos(chemins);
      });
    return () => {
      annule = true;
    };
  }, [editData]);

  /**
   * Rattache la galerie a la reference une fois son identifiant connu.
   *
   * `ignoreDuplicates` : en edition, le telephone a pu inscrire la meme photo
   * lui-meme quelques secondes plus tot.
   */
  async function rattacherPhotos(referenceId: string, dejaEnBase: string[]) {
    const supabase = createClient();
    const ajouts = photos.filter((c) => !dejaEnBase.includes(c));
    const retraits = dejaEnBase.filter((c) => !photos.includes(c));

    if (ajouts.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("lot_photos").upsert(
        ajouts.map((chemin, i) => ({
          lot_id: lotId,
          reference_id: referenceId,
          chemin,
          rang: i,
          created_by: user?.id ?? null,
        })),
        { onConflict: "chemin", ignoreDuplicates: true }
      );
    }
    if (retraits.length > 0) {
      await supabase.from("lot_photos").delete().in("chemin", retraits);
    }
  }

  /** Un formulaire abandonne ne laisse pas ses cliches dans le bucket. */
  function fermer() {
    if (!enregistreRef.current && !isEdit && photos.length > 0) {
      createClient().storage.from("lot-photos").remove(photos);
    }
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!designation || !metal || !poidsBrut || !poidsNet || !quantite) {
      setError("Désignation, métal, poids brut, poids net et quantité sont requis.");
      return;
    }
    if (!prixFixe && !qualite) {
      setError("Le titrage est requis pour cette matière.");
      return;
    }

    const finalPrixAchat = prixAchatManuel ? parseFloat(prixAchatManuel) : prixCalcule;
    const finalPrixRevente = isDepotVente
      ? (finalPrixAchat !== null && !isNaN(finalPrixAchat) ? Math.round(finalPrixAchat * (1 + commissionPct / 100) * 100) / 100 : null)
      : (prixReventeManuel ? parseFloat(prixReventeManuel) : prixVenteCalcule);

    if (finalPrixAchat === null || isNaN(finalPrixAchat)) {
      setError("Le prix de rachat est requis.");
      return;
    }

    if (!isDepotVente && (finalPrixRevente === null || isNaN(finalPrixRevente))) {
      setError("Le prix de revente est requis.");
      return;
    }

    setSaving(true);
    const coursMetalGramme = getCoursMetalFromSnapshot(
      metal,
      coursOrSnapshot,
      coursArgentSnapshot,
      coursPlatineSnapshot
    );

    const supabase = createClient();
    const payload = {
      designation,
      metal,
      // Le titrage reste vide sur une matiere qui n'en a pas.
      qualite: prixFixe ? null : qualite,
      poids: parseFloat(poidsNet),
      poids_brut: parseFloat(poidsBrut),
      poids_net: parseFloat(poidsNet),
      quantite: parseInt(quantite) || 1,
      cours_metal_utilise: coursMetalGramme,
      coefficient_utilise: coefficientSnapshot,
      prix_achat: finalPrixAchat,
      prix_revente_estime: finalPrixRevente,
      type_rachat: typeRachat,
      // Fiscalité : un bijou relève de la seule taxe forfaitaire sur les objets
      // précieux. Les colonnes du régime des plus-values restent nulles — elles
      // servent encore à l'or d'investissement, qui a bien le choix du régime.
      has_facture: false,
      is_scelle: false,
      date_acquisition: null,
      prix_acquisition: null,
      tpv_eligible: false,
      tpv_montant: null,
      tmp_montant: null,
      regime_fiscal: isDepotVente ? null : "TFOP",
      montant_taxe: isDepotVente ? 0 : ((tfopMontant ?? 0) / qty),
    };

    const { data: enregistree, error: dbError } = isEdit
      ? await supabase
          .from("lot_references")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editData.id)
          .select("id")
          .single()
      : await supabase
          .from("lot_references")
          .insert({ ...payload, lot_id: lotId, categorie: "bijoux", status: "en_expertise" })
          .select("id")
          .single();

    if (dbError || !enregistree) {
      toast.error("Erreur lors de l'enregistrement de la référence");
      setError(dbError?.message ?? "La référence n'a pas pu être enregistrée.");
      setSaving(false);
      return;
    }

    enregistreRef.current = true;
    await rattacherPhotos(enregistree.id, photosInitialesRef.current);

    toast.success(isEdit ? "Référence modifiée" : "Référence ajoutée");
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Card className="border-border bg-white dark:bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Diamond size={16} weight="duotone" />
          {isEdit ? `Modifier — ${editData.designation}` : "Ajouter un bijoux"}
        </CardTitle>
        <Button variant="ghost" size="icon-xs" onClick={fermer} aria-label="Fermer">
          <X size={14} weight="regular" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FieldError>{error}</FieldError>}

          {!isDepotVente && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTypeRachat("direct")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeRachat === "direct"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lightning size={14} weight="duotone" />
                Rachat direct
              </button>
              <button
                type="button"
                onClick={() => setTypeRachat("devis")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeRachat === "devis"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText size={14} weight="duotone" />
                Devis
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="designation" required>Désignation</Label>
              <Input
                id="designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Ex: Bracelet or 18k"
                required
              />
            </div>
            <div className="space-y-2">
              <Label required>Métal</Label>
              <Select value={metal} onValueChange={(v) => { if (v) setMetal(v as "Or" | "Argent" | "Platine"); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" items={selectItems(METAL_OPTIONS)} />
                </SelectTrigger>
                <SelectContent>
                  {/* Trois familles separees : metaux au cours, plaques, non
                      precieux. Elles ne se valorisent pas de la meme facon. */}
                  {METAL_GROUPES.map((groupe, i) => (
                    <Fragment key={i}>
                      {i > 0 && <SelectSeparator />}
                      {groupe.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titrage" required={!prixFixe}>Titrage (millièmes)</Label>
              <TitrageInput
                id="titrage"
                value={qualite}
                onValueChange={setQualite}
                disabled={prixFixe}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="poids_brut" required>Poids brut (g)</Label>
              <Input
                id="poids_brut"
                type="number"
                step="0.01"
                min="0.01"
                value={poidsBrut}
                onChange={(e) => {
                  setPoidsBrut(e.target.value);
                  if (!poidsNetTouched) setPoidsNet(e.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poids_net" required>Poids net (g)</Label>
              <Input
                id="poids_net"
                type="number"
                step="0.01"
                min="0.01"
                max={poidsBrut || undefined}
                value={poidsNet}
                onChange={(e) => {
                  setPoidsNet(e.target.value);
                  setPoidsNetTouched(true);
                }}
                required
              />
              <p className="text-xs text-muted-foreground">Poids du métal seul</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantite" required>Quantité</Label>
              <Input
                id="quantite"
                type="number"
                step="1"
                min="1"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prix_achat" required>Prix de rachat</Label>
              <Input
                id="prix_achat"
                type="number"
                step="0.01"
                min="0"
                value={prixAchatManuel}
                onChange={(e) => setPrixAchatManuel(e.target.value)}
                placeholder={prixCalcule !== null ? formatCurrency(prixCalcule) : "—"}
              />
              {prixCalcule !== null && !isNaN(prixCalcule) && (
                <p className="text-xs text-muted-foreground">
                  Au cours : {formatCurrency(prixCalcule)}
                </p>
              )}
            </div>
            {isDepotVente ? (
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={commissionLocal}
                  onChange={(e) => setCommissionLocal(e.target.value)}
                />
                {prixVenteCalcule !== null && !isNaN(prixVenteCalcule) && (
                  <p className="text-xs text-muted-foreground">
                    Prix de revente : {formatCurrency(prixVenteCalcule)} (commission : {formatCurrency(prixVenteCalcule - (prixAchatManuel ? parseFloat(prixAchatManuel) : (prixCalcule ?? 0)))})
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="prix_revente" required>Prix de revente</Label>
                <Input
                  id="prix_revente"
                  type="number"
                  step="0.01"
                  min="0"
                  value={prixReventeManuel}
                  onChange={(e) => setPrixReventeManuel(e.target.value)}
                  placeholder={prixVenteCalcule !== null ? formatCurrency(prixVenteCalcule) : "—"}
                />
                {prixVenteCalcule !== null && !isNaN(prixVenteCalcule) && (
                  <p className="text-xs text-muted-foreground">
                    Au cours : {formatCurrency(prixVenteCalcule)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* La fiscalité des bijoux n'appelle aucune saisie.
              Un bijou ne relève que de la taxe forfaitaire sur les objets
              précieux : 6 % du prix, plus 0,5 % de CRDS, au-delà de 5 000 € par
              objet. Le formulaire réclamait auparavant facture, justificatif,
              date et prix d'acquisition pour un régime de plus-values qui ne
              s'applique pas à cette catégorie. */}

          {/* Résultats fiscaux */}
          {!isDepotVente && prixAchatTotal !== null && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CurrencyEur size={12} weight="duotone" />
                  Prix de rachat total
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(prixAchatTotal)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Receipt size={12} weight="duotone" />
                  Taxe forfaitaire
                </p>
                <p className="text-sm font-medium">
                  {tfopMontant === null
                    ? "—"
                    : tfopMontant === 0
                      ? "Exonéré (≤ 5 000 €)"
                      : formatCurrency(tfopMontant)}
                </p>
                <p className="text-xs text-muted-foreground">
                  6 % + 0,5 % CRDS, au-delà de 5 000 € par objet
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wallet size={12} weight="duotone" />
                  Montant net
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(prixAchatTotal - (tfopMontant ?? 0))}
                </p>
              </div>
            </div>
          )}

          {/* Photos de l'article. Facultatives, contrairement a celles du lot :
              utiles sur une piece de valeur ou un defaut a documenter,
              superflues sur un lot de chutes. */}
          <div className="space-y-2">
            <Label>
              Photos de l&apos;article
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (facultatif)
              </span>
            </Label>
            <PhotosUpload
              chemins={photos}
              onChange={setPhotos}
              prefixe={lotId}
              /* En creation la reference n'a pas d'identifiant : le telephone
                 depose dans la session seule, et l'enregistrement rattache. */
              lotId={isEdit ? lotId : null}
              referenceId={editData?.id ?? null}
              libelle={designation || "Nouvel article"}
              max={8}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={fermer}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              <FloppyDisk size={16} weight="duotone" />
              {saving ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
