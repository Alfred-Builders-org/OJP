#!/usr/bin/env python3
"""
Générateur des classeurs de reprise de stock — Or au Juste Prix.

Périmètre arrêté avec le builder : on reprend le STOCK ACTUEL, pas l'historique
commercial. Aucune vente passée n'est migrée. En revanche, chaque article en
stock doit entrer par un lot, comme dans l'application : le client déclare donc
ses lots d'entrée, puis les articles qui les composent.

Chaîne de reprise :

    1-clients.xlsx      clients.*, client_identity_documents.*
    2-lots.xlsx         lots.* (+ un dossier créé par lot à l'import)
    3-references.xlsx   lot_references.* (+ bijoux_stock.* pour ce qui reste
                        en boutique ou en dépôt-vente)

Usage : python3 migration-stock/build_template.py
"""

import re
from pathlib import Path

from migration_xlsx import (  # copié à côté de ce fichier
    COMMON_RULES,
    DATE_FMT,
    DATE_HELP,
    add_lists_sheet,
    build_readme,
    build_sheet,
    field,
    new_workbook,
)

OUT_DIR = Path(__file__).parent
REPO = OUT_DIR.parent

# ---------------------------------------------------------------------------
# Référentiels
#
# Source : base Supabase `wprsfakodbuvszporcoe`, contraintes CHECK relevées le
# 2026-08-28, et libellés humains repris de l'interface (src/lib/validations/,
# src/components/). Rien n'est inventé ici : chaque valeur existe en base.
# Le mapping libellé -> valeur technique se fera à l'import, guidé par la
# colonne `db` de chaque `field()`.
# ---------------------------------------------------------------------------

# clients.civility — CHECK (M | Mme), libellés du select de création client
CIVILITES = ["Monsieur", "Madame"]

# clients.lead_source — LEAD_SOURCE_OPTIONS (src/lib/validations/client.ts)
SOURCES = [
    "Bouche à oreille",
    "Google",
    "Réseaux sociaux",
    "Passage en boutique",
    "Recommandation",
    "Publicité",
    "Autre",
]

# client_identity_documents.document_type — DOCUMENT_TYPE_OPTIONS
TYPES_PIECE = [
    "Carte nationale d'identité",
    "Passeport",
    "Titre de séjour",
    "Permis de conduire",
]

# lots.type — CHECK (rachat | vente | depot_vente). « vente » est exclu : on ne
# reprend pas les ventes passées.
TYPES_ENTREE = ["Rachat", "Dépôt-vente"]

# lots.status — CHECK (brouillon | en_cours | finalise)
STATUTS_LOT = ["Brouillon", "En cours", "Finalisé"]

# lots.mode_reglement — MODE_REGLEMENT_OPTIONS (src/lib/validations/vente.ts)
MODES_REGLEMENT = ["Espèces", "Carte bancaire", "Virement", "Chèque"]

# lot_references.categorie — CHECK (bijoux | or_investissement)
CATEGORIES = ["Bijoux", "Or d'investissement"]

# lot_references.metal — CHECK (Or | Argent | Platine)
METAUX = ["Or", "Argent", "Platine"]

# lot_references.qualite — CHECK (333 | 375 | 585 | 750 | 999)
QUALITES = [
    "333 (8 carats)",
    "375 (9 carats)",
    "585 (14 carats)",
    "750 (18 carats)",
    "999 (24 carats)",
]

# lot_references.regime_fiscal — CHECK (TPV | TMP | TFOP), libellés de
# src/components/impots/impots-toolbar.tsx
REGIMES_FISCAUX = [
    "TMP (Métaux Précieux)",
    "TPV (Plus-Value)",
    "TFOP (Objets Précieux)",
]

# lot_references.destination — CHECK (stock_boutique | fonderie | depot_vente)
DESTINATIONS = ["Stock boutique", "Dépôt-vente", "Fonderie"]


def _lire_liste_ts(nom):
    """Extrait un tableau de chaînes de src/lib/validations/client.ts.

    Les listes pays et nationalités font près de 200 entrées chacune : on les
    lit à la source plutôt que de les recopier, pour que le classeur ne périme
    pas quand l'application en ajoute une.
    """
    src = (REPO / "src/lib/validations/client.ts").read_text(encoding="utf-8")
    corps = re.search(
        r"export const " + nom + r" = \[(.*?)\] as const;", src, re.S
    ).group(1)
    return re.findall(r'"([^"]+)"', re.sub(r"//[^\n]*", "", corps))


# clients.country
PAYS = _lire_liste_ts("COUNTRY_OPTIONS")


# client_identity_documents.nationality — NATIONALITY_OPTIONS est dérivé en
# TypeScript de COUNTRY_OPTIONS via COUNTRY_TO_NATIONALITY ; on refait le même
# calcul ici, sur le même fichier.
def _lire_nationalites():
    src = (REPO / "src/lib/validations/client.ts").read_text(encoding="utf-8")
    corps = re.search(
        r"export const COUNTRY_TO_NATIONALITY[^{]*\{(.*?)\n\};", src, re.S
    ).group(1)
    paires = dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', corps))
    vues, sortie = set(), []
    for pays in PAYS:
        nat = paires.get(pays, pays)
        if nat not in vues:
            vues.add(nat)
            sortie.append(nat)
    return sortie


NATIONALITES = _lire_nationalites()


LISTES = {
    "civilites": CIVILITES,
    "sources": SOURCES,
    "types_piece": TYPES_PIECE,
    "pays": PAYS,
    "nationalites": NATIONALITES,
    "types_entree": TYPES_ENTREE,
    "statuts_lot": STATUTS_LOT,
    "modes_reglement": MODES_REGLEMENT,
    "categories": CATEGORIES,
    "metaux": METAUX,
    "qualites": QUALITES,
    "regimes_fiscaux": REGIMES_FISCAUX,
    "destinations": DESTINATIONS,
}


# ---------------------------------------------------------------------------
# Règles communes
#
# On remplace la dernière règle générique (« montants en nombres entiers ») :
# ici les poids se saisissent au dixième de gramme et les prix aux centimes.
# ---------------------------------------------------------------------------

REGLES = COMMON_RULES[:4] + [
    "Dates au format AAAA-MM-JJ (ex. 2026-03-14).",
    "Montants en euros, sans le symbole € ni espace. Les centimes avec une "
    "virgule (ex. 1250,50).",
    "Poids en grammes, décimales avec une virgule (ex. 16,7). Ne pas écrire "
    "l'unité dans la cellule.",
]


# ---------------------------------------------------------------------------
# 1 — Clients
# ---------------------------------------------------------------------------

CLIENTS = [
    ("Identité", [
        field("Clé client", "—",
              "Identifiant que vous choisissez, repris dans le fichier 2. "
              "ex. dupont-marie", 22, required=True),
        field("Civilité", "clients.civility", "Liste", 14, dv="civilites",
              required=True),
        field("Prénom", "clients.first_name", "ex. Marie", 18, required=True),
        field("Nom", "clients.last_name", "ex. Dupont", 18, required=True),
        field("Nom de jeune fille", "clients.maiden_name",
              "Uniquement s'il diffère du nom. ex. Martin", 20),
    ]),
    ("Contact principal", [
        field("Email", "clients.email", "ex. marie.dupont@email.fr", 30),
        field("Téléphone", "clients.phone",
              "20 caractères max. ex. 06 12 34 56 78", 20),
    ]),
    ("Adresse", [
        field("Adresse", "clients.address",
              "Numéro et rue. ex. 12 rue des Lilas", 32),
        field("Code postal", "clients.postal_code", "ex. 75011", 14),
        field("Ville", "clients.city", "ex. Paris", 20),
        field("Pays", "clients.country", "Liste. France par défaut", 22,
              dv="pays"),
    ]),
    ("Pièce d'identité", [
        field("Type de pièce", "client_identity_documents.document_type",
              "Liste. Sans pièce, le client reste « à compléter » dans l'outil",
              26, dv="types_piece"),
        field("Numéro de la pièce", "client_identity_documents.document_number",
              "50 caractères max. ex. 12AB34567", 22),
        field("Date de délivrance", "client_identity_documents.issue_date",
              DATE_HELP, 18, fmt=DATE_FMT),
        field("Date d'expiration", "client_identity_documents.expiry_date",
              DATE_HELP, 18, fmt=DATE_FMT),
        field("Nationalité", "client_identity_documents.nationality",
              "Liste. Française par défaut", 22, dv="nationalites"),
    ]),
    ("Suivi", [
        field("Source", "clients.lead_source",
              "Comment le client est arrivé. Liste", 22, dv="sources"),
        field("Notes", "clients.notes",
              "Texte libre. ex. Cliente fidèle, passe tous les 6 mois", 40),
    ]),
]


# ---------------------------------------------------------------------------
# 2 — Lots d'entrée
# ---------------------------------------------------------------------------

LOTS = [
    ("Identité", [
        field("Clé lot", "—",
              "Identifiant que vous choisissez, repris dans le fichier 3. "
              "ex. lot-001", 18, required=True),
        field("Client", "dossiers.client_id",
              "Reprendre la clé exacte du fichier 1. ex. dupont-marie", 22,
              required=True),
        field("Type d'entrée", "lots.type",
              "Rachat = vous avez acheté. Dépôt-vente = le client reste "
              "propriétaire. Liste", 18, dv="types_entree", required=True),
        field("Statut", "lots.status",
              "Finalisé si l'opération est close. En cours pour un "
              "dépôt-vente encore actif. Liste", 16, dv="statuts_lot",
              required=True),
    ]),
    ("Opération", [
        field("Date de l'opération", "lots.date_finalisation",
              DATE_HELP + " — le jour où les articles sont entrés", 20,
              fmt=DATE_FMT),
        field("Mode de règlement", "lots.mode_reglement",
              "Comment le client a été payé. Liste", 20, dv="modes_reglement"),
        field("N° de facture", "lots.numero_facture",
              "Votre référence d'origine, si vous en avez une. ex. F-2024-118",
              20),
    ]),
    ("Suivi", [
        field("Notes", "lots.notes",
              "Texte libre. ex. Succession, 3 bagues et une chaîne", 40),
    ]),
]


# ---------------------------------------------------------------------------
# 3 — Références (les articles)
# ---------------------------------------------------------------------------

REFERENCES = [
    ("Rattachement", [
        field("Clé lot", "lot_references.lot_id",
              "Reprendre la clé exacte du fichier 2. ex. lot-001", 18,
              required=True),
    ]),
    ("Identité", [
        field("Catégorie", "lot_references.categorie",
              "Bijoux, ou pièce / lingot d'investissement. Liste", 20,
              dv="categories", required=True),
        field("Désignation", "lot_references.designation",
              "Ce que c'est, en clair. ex. Bague solitaire or jaune", 34,
              required=True),
    ]),
    ("Caractéristiques", [
        field("Métal", "lot_references.metal", "Liste", 14, dv="metaux"),
        field("Qualité", "lot_references.qualite",
              "Titre du métal. Liste", 18, dv="qualites"),
        field("Poids brut (g)", "lot_references.poids_brut",
              "Article complet, pierres comprises. ex. 8,4", 16),
        field("Poids net (g)", "lot_references.poids_net",
              "Métal seul, hors pierres. ex. 7,1", 16),
        field("Quantité", "lot_references.quantite",
              "Nombre d'articles identiques. 1 par défaut", 12),
    ]),
    ("Valorisation", [
        field("Prix d'achat (€)", "lot_references.prix_achat",
              "Ce que vous avez payé au client. ex. 320", 18, required=True),
        field("Prix de revente (€)", "lot_references.prix_revente_estime",
              "Prix de vente affiché ou visé. ex. 590", 18),
        field("Régime fiscal", "lot_references.regime_fiscal",
              "Taxe appliquée à la revente. Liste", 24, dv="regimes_fiscaux"),
    ]),
    ("Destination", [
        field("Où est l'article", "lot_references.destination",
              "Sa situation aujourd'hui. Liste", 20, dv="destinations",
              required=True),
    ]),
]


# ---------------------------------------------------------------------------
# Construction
# ---------------------------------------------------------------------------

INTRO_COMMUNE = (
    "Ces trois fichiers servent à reprendre votre stock actuel dans "
    "l'application. On ne reprend pas les ventes passées : seulement ce que "
    "vous avez encore, et par quelle opération c'est entré."
)


def build_clients():
    wb = new_workbook()
    ranges = add_lists_sheet(
        wb,
        {k: LISTES[k] for k in
         ("civilites", "sources", "types_piece", "pays", "nationalites")},
    )
    build_readme(
        wb,
        "1 — Clients",
        [
            INTRO_COMMUNE,
            "Ce fichier-ci recense les personnes auprès de qui vous avez acheté "
            "ou qui vous ont confié des articles. C'est le premier à remplir : "
            "les deux autres y font référence.",
        ],
        [
            "Une ligne par personne, dans la feuille « Clients ».",
            "Commencer par la « Clé client » : un identifiant court que vous "
            "choisissez (ex. dupont-marie). Il ne sert qu'à faire le lien avec "
            "le fichier 2 et n'apparaîtra pas dans l'application.",
            "Le bloc « Pièce d'identité » est facultatif, mais un client sans "
            "pièce arrive dans l'outil au statut « à compléter » : il faudra la "
            "saisir avant de finaliser une opération avec lui.",
        ],
        REGLES + [
            "Deux clients ne peuvent pas avoir la même clé client. En cas "
            "d'homonymie, ajouter un suffixe (dupont-marie-2).",
        ],
    )
    build_sheet(wb, "Clients", CLIENTS, ranges)
    path = OUT_DIR / "1-clients.xlsx"
    wb.save(path)
    return path


def build_lots():
    wb = new_workbook()
    ranges = add_lists_sheet(
        wb,
        {k: LISTES[k] for k in
         ("types_entree", "statuts_lot", "modes_reglement")},
    )
    build_readme(
        wb,
        "2 — Lots d'entrée",
        [
            INTRO_COMMUNE,
            "Ce fichier-ci recense les opérations par lesquelles vos articles "
            "sont entrés en stock : un rachat auprès d'un client, ou un dépôt "
            "confié par un client. Chaque article du fichier 3 doit se "
            "rattacher à l'un de ces lots.",
            "À remplir après le fichier « 1 — Clients ».",
        ],
        [
            "Une ligne par opération d'entrée, dans la feuille « Lots d'entrée ».",
            "Un lot peut contenir plusieurs articles : si un client vous a "
            "vendu quatre bijoux le même jour, c'est un seul lot, et quatre "
            "lignes dans le fichier 3.",
            "Si vous ne savez plus par quelle opération un article est entré, "
            "créer un lot « de reprise » par client (ex. lot-reprise-dupont) et "
            "y rattacher ses articles.",
        ],
        REGLES + [
            "La colonne « Client » doit reprendre au caractère près une clé du "
            "fichier « 1 — Clients ». Une clé inconnue fait rejeter la ligne.",
            "Deux lots ne peuvent pas avoir la même clé lot.",
        ],
    )
    build_sheet(wb, "Lots d'entrée", LOTS, ranges)
    path = OUT_DIR / "2-lots.xlsx"
    wb.save(path)
    return path


def build_references():
    wb = new_workbook()
    ranges = add_lists_sheet(
        wb,
        {k: LISTES[k] for k in
         ("categories", "metaux", "qualites", "regimes_fiscaux",
          "destinations")},
    )
    build_readme(
        wb,
        "3 — Références",
        [
            INTRO_COMMUNE,
            "Ce fichier-ci est le cœur de la reprise : une ligne par article "
            "que vous avez encore. Bijoux en vitrine, pièces d'or, articles "
            "confiés en dépôt-vente, lots en attente de fonte.",
            "À remplir après le fichier « 2 — Lots d'entrée ».",
        ],
        [
            "Une ligne par article, dans la feuille « Références ».",
            "Commencer par la « Clé lot » : celle du fichier 2 qui dit par "
            "quelle opération l'article est entré.",
            "« Où est l'article » décrit sa situation aujourd'hui, pas son "
            "avenir : Stock boutique s'il est en vitrine ou en réserve, "
            "Dépôt-vente s'il appartient encore au client, Fonderie s'il part "
            "à la fonte.",
            "Si plusieurs articles sont strictement identiques (même métal, "
            "même poids, même prix), une seule ligne suffit avec la quantité.",
        ],
        REGLES + [
            "La colonne « Clé lot » doit reprendre au caractère près une clé du "
            "fichier « 2 — Lots d'entrée ». Une clé inconnue fait rejeter la "
            "ligne.",
            "Le poids net ne peut pas dépasser le poids brut. Si l'article n'a "
            "pas de pierres, mettre la même valeur dans les deux colonnes.",
            "Ne rien saisir ici pour les articles déjà vendus : ce fichier ne "
            "reprend que le stock présent.",
        ],
    )
    build_sheet(wb, "Références", REFERENCES, ranges)
    path = OUT_DIR / "3-references.xlsx"
    wb.save(path)
    return path


if __name__ == "__main__":
    for build in (build_clients, build_lots, build_references):
        print("✓", build())
