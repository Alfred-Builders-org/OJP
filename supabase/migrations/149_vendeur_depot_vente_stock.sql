-- ============================================================
-- Migration 149 : un vendeur peut faire entrer un depot-vente en stock
--
-- L'ecriture sur `bijoux_stock` etait reservee au proprietaire. Or c'est le
-- vendeur qui recoit le client au comptoir, prend le depot et fait signer le
-- contrat — et la signature cree les lignes de stock correspondantes. Chaque
-- tentative repartait donc en 403, silencieusement : le contrat passait
-- « signe » sans qu'aucun bijou n'entre en stock, et l'action disparaissait de
-- l'ecran, rendant la reparation impossible.
--
-- On ouvre donc l'ecriture aux vendeurs, mais **pour le seul depot-vente** : la
-- ligne doit porter le statut `en_depot_vente` et se rattacher a un lot. Le
-- reste du stock — achats grossistes, entrees de rachat, prix de revente —
-- demeure la main du proprietaire.
-- ============================================================

DROP POLICY IF EXISTS "bijoux_stock_insert" ON public.bijoux_stock;
CREATE POLICY "bijoux_stock_insert" ON public.bijoux_stock
  FOR INSERT
  WITH CHECK (
    user_is_active()
    AND (
      user_role() = ANY (ARRAY['proprietaire', 'super_admin'])
      OR (
        user_role() = 'vendeur'
        AND statut = 'en_depot_vente'
        AND depot_vente_lot_id IS NOT NULL
      )
    )
  );

-- La mise a jour suit la meme logique : le vendeur n'agit que sur une ligne de
-- depot-vente, et ne peut pas la faire sortir de ce cadre.
DROP POLICY IF EXISTS "bijoux_stock_update" ON public.bijoux_stock;
CREATE POLICY "bijoux_stock_update" ON public.bijoux_stock
  FOR UPDATE
  USING (
    user_is_active()
    AND (
      user_role() = ANY (ARRAY['proprietaire', 'super_admin'])
      OR (user_role() = 'vendeur' AND depot_vente_lot_id IS NOT NULL)
    )
  )
  WITH CHECK (
    user_is_active()
    AND (
      user_role() = ANY (ARRAY['proprietaire', 'super_admin'])
      OR (
        user_role() = 'vendeur'
        AND depot_vente_lot_id IS NOT NULL
        AND statut = ANY (ARRAY['en_depot_vente', 'vendu', 'rendu_client'])
      )
    )
  );

-- La suppression reste au proprietaire : une ligne de stock ne s'efface pas au
-- comptoir.
