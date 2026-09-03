"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CaretUpDown, MagnifyingGlass, WarningCircle, Wrench } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { mutate } from "@/lib/supabase/mutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface ClientLeger {
  id: string;
  first_name: string;
  last_name: string;
}

interface ReparationCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Prendre en reparation un bijou qui n'est pas a nous.
 *
 * Le client pose sa chaine sur le comptoir : elle n'entre pas en stock, elle
 * n'est pas rachetee, elle repart reparee et facturee. C'est le cas le plus
 * courant de l'atelier, et celui que l'application ne savait pas enregistrer.
 *
 * Le proprietaire est obligatoire : un objet confie sans nom est un objet qu'on
 * ne sait plus a qui rendre.
 */
export function ReparationCreateDialog({
  open,
  onOpenChange,
}: ReparationCreateDialogProps) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientLeger[]>([]);
  const [clientOuvert, setClientOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [clientId, setClientId] = useState("");
  const [designation, setDesignation] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [coutEstime, setCoutEstime] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!open) return;
    let annule = false;
    const supabase = createClient();
    supabase
      .from("clients")
      .select("id, first_name, last_name")
      .order("last_name")
      .then(({ data }) => {
        if (!annule) setClients((data ?? []) as ClientLeger[]);
      });
    return () => {
      annule = true;
    };
  }, [open]);

  /**
   * Fermer vide le formulaire.
   *
   * Le nettoyage repond a un geste — on ferme — plutot qu'a un changement
   * d'etat, et n'a donc pas sa place dans un effet.
   */
  function changerOuverture(ouvert: boolean) {
    if (!ouvert) {
      setClientId("");
      setDesignation("");
      setDescription("");
      setPrix("");
      setCoutEstime("");
      setErreur("");
      setRecherche("");
    }
    onOpenChange(ouvert);
  }

  const filtres = useMemo(() => {
    if (!recherche) return clients.slice(0, 50);
    const q = recherche.toLowerCase();
    return clients
      .filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q))
      .slice(0, 50);
  }, [clients, recherche]);

  const clientChoisi = clients.find((c) => c.id === clientId);

  async function enregistrer() {
    setErreur("");
    if (!clientId) {
      setErreur("Indiquez à qui appartient l'objet.");
      return;
    }
    if (!designation.trim()) {
      setErreur("Décrivez ce qui est réparé.");
      return;
    }

    setEnregistrement(true);
    const supabase = createClient();
    const { error } = await mutate(
      supabase.from("reparations").insert({
        bijou_id: null,
        client_id: clientId,
        designation: designation.trim(),
        description: description.trim() || null,
        prix_facture: prix ? parseFloat(prix.replace(",", ".")) : null,
        cout_estime: coutEstime ? parseFloat(coutEstime.replace(",", ".")) : null,
        statut: "en_cours",
      }),
      "La réparation n'a pas pu être enregistrée",
      "Réparation enregistrée"
    );

    setEnregistrement(false);
    if (error) {
      setErreur(error);
      return;
    }
    changerOuverture(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={changerOuverture}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench size={20} weight="duotone" />
            Réparation d&apos;un bijou apporté
          </DialogTitle>
          <DialogDescription>
            L&apos;objet reste au client : il n&apos;entre pas en stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Propriétaire</Label>
            <Popover open={clientOuvert} onOpenChange={setClientOuvert}>
              <PopoverTrigger
                render={
                  <Button variant="outline" className="w-full justify-between font-normal" type="button" />
                }
              >
                <span className={clientChoisi ? "text-foreground" : "text-muted-foreground"}>
                  {clientChoisi
                    ? `${clientChoisi.first_name} ${clientChoisi.last_name}`
                    : "Rechercher un client..."}
                </span>
                <CaretUpDown size={14} weight="regular" className="shrink-0 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
                <div className="border-b p-2">
                  <div className="relative">
                    <MagnifyingGlass
                      size={14}
                      weight="regular"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Rechercher..."
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filtres.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Aucun client trouvé.
                    </p>
                  ) : (
                    filtres.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setClientId(c.id);
                          setClientOuvert(false);
                          setRecherche("");
                        }}
                      >
                        <Check
                          size={14}
                          weight="bold"
                          className={clientId === c.id ? "text-primary" : "opacity-0"}
                        />
                        {c.first_name} {c.last_name}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation_rep">Objet</Label>
            <Input
              id="designation_rep"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Chaîne en or, fermoir cassé"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_rep">Travail à faire</Label>
            <Textarea
              id="description_rep"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Ressouder le fermoir, polir"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prix_rep">Prix client</Label>
              <Input
                id="prix_rep"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cout_rep">Coût atelier</Label>
              <Input
                id="cout_rep"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={coutEstime}
                onChange={(e) => setCoutEstime(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          {erreur && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <WarningCircle size={14} weight="duotone" />
              {erreur}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => changerOuverture(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={enregistrer} disabled={enregistrement}>
            {enregistrement ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
