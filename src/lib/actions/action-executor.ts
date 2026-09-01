import type { ActionId, ActionResult, ActionContext, SupabaseClient } from "./action-types";
import type { LotReference } from "@/types/lot";
import {
  executeAccepterDevisLot,
  executeRefuserDevisLot,
  executeFinaliserRachat,
  executeRetracterLot,
} from "./lot-actions";
import {
  executeValiderRachat,
  executeRetracterRef,
  executeAccepterDevisRef,
  executeRefuserDevisRef,
  executeRestituerRef,
} from "./reference-actions";

/**
 * Single entry point for executing any action.
 */
export async function executeAction(params: {
  actionId: ActionId;
  supabase: SupabaseClient;
  ctx: ActionContext;
  referenceId?: string;
}): Promise<ActionResult> {
  const { actionId, supabase, ctx, referenceId } = params;

  switch (actionId) {
    // Lot-level actions
    case "lot.accepter_devis":
      return executeAccepterDevisLot(supabase, ctx);
    case "lot.refuser_devis":
      return executeRefuserDevisLot(supabase, ctx);
    case "lot.finaliser_rachat":
      return executeFinaliserRachat(supabase, ctx);
    case "lot.retracter":
      return executeRetracterLot(supabase, ctx);

    // Document actions
    case "doc.signer_contrat_dpv": {
      /**
       * Signature du contrat de depot-vente.
       *
       * L'ordre compte. On faisait l'inverse — signer d'abord, entrer la
       * marchandise en stock ensuite — et le moindre refus sur le stock laissait
       * un etat impossible a reparer depuis l'ecran : le contrat marque signe
       * faisait disparaitre l'action, donc plus aucun moyen de reessayer, et les
       * bijoux restaient en expertise sans que rien ne le signale. C'est
       * exactement ce qui s'est produit quand un vendeur, qui n'a pas le droit
       * d'ecrire dans le stock, a valide un contrat : quatre refus silencieux.
       *
       * Le stock passe donc en premier. Le contrat n'est signe que si toute la
       * marchandise est entree, et le moindre echec laisse l'action disponible.
       */
      const clientId = ctx.dossier.client.id;
      const aEntrer = ctx.lot.references.filter(
        (r) => r.categorie === "bijoux" && r.status === "en_expertise"
      );

      for (const ref of aEntrer) {
        const { data: stockEntry, error: stockErr } = await supabase
          .from("bijoux_stock")
          .insert({
            nom: ref.designation,
            metaux: ref.metal,
            qualite: ref.qualite,
            poids: ref.poids_net ?? ref.poids,
            poids_brut: ref.poids_brut,
            poids_net: ref.poids_net,
            prix_achat: ref.prix_achat,
            prix_revente: ref.prix_revente_estime,
            quantite: ref.quantite,
            statut: "en_depot_vente",
            reference: ref.numero ?? null,
            depot_vente_lot_id: ctx.lot.id,
            deposant_client_id: clientId,
          })
          .select("id")
          .single();

        if (stockErr || !stockEntry) {
          // Le message brut de PostgreSQL ne dit rien a un vendeur : un refus
          // d'ecriture se traduit en clair, avec la conduite a tenir.
          const refus =
            stockErr?.code === "42501" ||
            (stockErr?.message ?? "").toLowerCase().includes("row-level security");
          return {
            success: false,
            error: refus
              ? "Votre compte n'a pas le droit de faire entrer de la marchandise en stock. Demandez au propriétaire de valider ce contrat."
              : `La mise en stock de « ${ref.designation} » a échoué : ${stockErr?.message ?? "raison inconnue"}`,
          };
        }

        const { error: refErr } = await supabase
          .from("lot_references")
          .update({ status: "en_depot_vente", destination_stock_id: stockEntry.id })
          .eq("id", ref.id);

        if (refErr) {
          return {
            success: false,
            error: `« ${ref.designation} » est en stock mais son statut n'a pas suivi : ${refErr.message}`,
          };
        }
      }

      // La marchandise est entree : le contrat peut etre marque signe.
      const { error } = await supabase
        .from("documents")
        .update({ status: "signe" })
        .eq("lot_id", ctx.lot.id)
        .eq("type", "contrat_depot_vente");
      if (error) return { success: false, error: error.message };

      // Les confies d'achat accompagnent le contrat.
      await supabase
        .from("documents")
        .update({ status: "signe" })
        .eq("lot_id", ctx.lot.id)
        .eq("type", "confie_achat")
        .in("status", ["en_attente"]);

      return { success: true };
    }

    // Reference-level actions
    case "ref.valider_rachat":
      if (!referenceId) return { success: false, error: "referenceId requis" };
      return executeValiderRachat(supabase, ctx, referenceId);
    case "ref.retracter":
      if (!referenceId) return { success: false, error: "referenceId requis" };
      return executeRetracterRef(supabase, ctx, referenceId);
    case "ref.accepter_devis":
      if (!referenceId) return { success: false, error: "referenceId requis" };
      return executeAccepterDevisRef(supabase, ctx, referenceId);
    case "ref.refuser_devis":
      if (!referenceId) return { success: false, error: "referenceId requis" };
      return executeRefuserDevisRef(supabase, ctx, referenceId);
    case "ref.restituer": {
      if (!referenceId) return { success: false, error: "referenceId requis" };
      const ref = ctx.lot.references.find((r) => r.id === referenceId);
      if (!ref) return { success: false, error: "Référence non trouvée" };
      return executeRestituerRef(supabase, ctx, referenceId, ref);
    }

    default:
      return { success: false, error: `Action inconnue: ${actionId}` };
  }
}
