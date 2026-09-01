---
id: F-008
---

## Impact regles

### MODIFIED R-010
statement: Un lot de rachat ou de depot-vente ne connait que 3 etats, brouillon, en cours et finalise, et la base n'accepte que les transitions brouillon vers en cours, brouillon vers finalise et en cours vers finalise, la maniere dont le lot s'est termine (complete, refuse, retracte, annule) etant portee a part de son etat.
raison: La regle decrit le chemin detaille brouillon, devis envoye, accepte, en retractation, finalise ou retracte, tenu par la migration 056. La migration 081 a remplace ce chemin : `lots_status_check` ne connait plus que `brouillon | en_cours | finalise`, `validate_lot_status_transition` a ete reecrite en consequence, et une colonne `outcome` porte desormais la fin de vie du lot. Le chemin detaille subsiste, mais sur `lot_references`, pas sur le lot. La regle telle qu'ecrite decrit donc un comportement que le code n'a plus, et la recette de F-008 la rejouerait a faux.
