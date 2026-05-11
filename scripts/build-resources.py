#!/usr/bin/env python3
"""
Copie les ressources Drive d'Emeline (dezippe en local) vers
/public/ressources-formation/ avec noms slug propres + genere un manifest TS.

Source: /Users/emeline/Downloads/Outils de la formation /
Destination: /Users/emeline/es-academy/public/ressources-formation/[module-slug]/[sm]/[slug.ext]
Manifest: src/lib/ressources-manifest.ts

Filtre : ignore les anciens PPT vieille charte Evermind (M{N}-{L}.pdf et NF M{N}-V{V}.pdf)
"""
import re, shutil, unicodedata, json
from pathlib import Path

SRC = Path("/Users/emeline/Downloads/Outils de la formation ")
DEST = Path("/Users/emeline/es-academy/public/ressources-formation")
MANIFEST = Path("/Users/emeline/es-academy/src/lib/ressources-manifest.ts")

# Sommaire officiel : { sous_module: [item_names...] }
SOMMAIRE = {
    "1.A": [("Liste de livres a lire", "PDF"), ("Liste de podcasts a ecouter", "PDF")],
    "1.B": [("Fichier de gestion financiere et de patrimoine vierge", "Excel"),
            ("Fichier de gestion financiere et de patrimoine exemple", "Excel")],
    "2.D": [("Prix d'achat des parkings en Ile-de-France", "PDF"),
            ("Prix de location des parkings en Ile-de-France", "PDF")],
    "2.E": [("Check-list de la division en copropriete", "Checklist"),
            ("Check-list de la division en dehors d'une copropriete", "Checklist")],
    "3.D": [("Exemple etude de marche de Beziers", "PDF"),
            ("Exemple etude de marche de Villejuif", "PDF")],
    "4.A": [("Tableau sur la rentabilite des 100 plus grandes villes de France", "Excel")],
    "4.B": [("Fichier business plan", "Excel")],
    "5.A": [("Check-list de visite", "Checklist")],
    "5.C": [("Obligations relatives aux diagnostics", "PDF"),
            ("Guide des diagnostics", "PDF"),
            ("Les 10 points du nouveau DPE", "PDF"),
            ("Comprendre le DPE", "PDF"),
            ("Exemple de DPE existant appartement et maison", "PDF")],
    "5.D": [("Guide de la negociation", "PDF"),
            ("Offre d'achat", "Template")],
    "5.E": [("Lettre de retractation", "Template")],
    "6.A": [("Decision du HCSF", "PDF")],
    "6.C": [("Analyse de solvabilite (word et excel)", "Template"),
            ("Estimatif du projet", "Excel"),
            ("Presentation du dossier", "Template"),
            ("Documents a fournir pour une demande de financement", "Checklist")],
    "7.B": [("Devis quantitatif estimatif", "Excel"),
            ("Tableur estimation travaux", "Excel"),
            ("Estimer les aides a la renovation", "PDF")],
    "7.C": [("Le guide des fenetres", "PDF"),
            ("Le guide de la norme NFC15100", "PDF")],
    "7.E": [("Liste de meubles a acheter", "Checklist")],
    "8.A": [("Exemple d'annonce longue et courte duree", "Template")],
    "8.B": [("Attestation d'hebergement", "Template"),
            ("Honoraires d'agence", "PDF"),
            ("Liste des pieces justificatives etudiant", "Checklist"),
            ("Liste des pieces justificatives candidat", "Checklist"),
            ("Liste des pieces justificatives garants", "Checklist"),
            ("Reglement de vie du locataire", "Template")],
    "8.C": [("Bail de location vide", "Template"),
            ("Bail de location meublee", "Template"),
            ("Bail mobilite", "Template"),
            ("Bail saisonnier", "Template"),
            ("Charte des colocataires", "Template"),
            ("Charges recuperables", "PDF"),
            ("Entretien du logement", "PDF"),
            ("Etat des lieux meuble", "Template"),
            ("Etat des lieux non meuble", "Template"),
            ("Liste des meubles obligatoires", "Checklist"),
            ("Livret d'accueil location longue duree", "Template"),
            ("Livret d'accueil location courte duree", "Template"),
            ("Notice d'informations de location", "Template"),
            ("Quittance loyer", "Template"),
            ("Reglement interieur d'un studio", "Template"),
            ("Regles de survie en colocation", "PDF"),
            ("Tableau etat locatif", "Excel")],
    "8.D": [("Lettre loyers impayes caution simple", "Template"),
            ("Lettre loyers impayes caution solidaire", "Template"),
            ("Lettre de relance", "Template"),
            ("Fiche visale", "PDF"),
            ("Le manuel anti-squat", "PDF")],
    "8.E": [("Assurance loyers impayes", "PDF"),
            ("Assurance protection juridique", "PDF")],
    "8.F": [("Exemples de PV d'AG", "Template")],
    "9.B": [("Tableau recapitulatif imposition", "PDF"),
            ("Guide des revenus fonciers", "PDF"),
            ("Guide LMNP", "PDF")],
    "9.C": [("Gerer ses biens immobiliers", "PDF"),
            ("Guide de la CFE", "PDF")],
    "9.D": [("Notice IFI 2024", "PDF")],
    "10.A": [("Attestation droit de jouissance", "Template"),
             ("Cession de parts sociales", "Template"),
             ("Convention de tresorerie", "Template"),
             ("Pacte d'actionnaires", "Template"),
             ("Procedure creation SCI", "PDF"),
             ("PVAG extraordinaire", "Template"),
             ("Statuts types SCI", "Template"),
             ("Tableau comparatif des societes", "PDF")],
    "10.B": [("Les etapes de la creation d'entreprise", "PDF")],
    "11.C": [("Les donations", "PDF"),
             ("Les successions", "PDF")],
    "11.D": [("Les regimes matrimoniaux", "PDF")],
}

MODULE_LABELS = {
    "1": "Mindset", "2": "Types de location", "3": "Recherches",
    "4": "Criteres financiers", "5": "Analyse technique", "6": "Financement",
    "7": "Travaux", "8": "Gestion locative", "9": "Imposition",
    "10": "Societe", "11": "Montage avance",
}

IGNORE = [
    re.compile(r"^M\d+-[A-Z]\.pdf$", re.I),
    re.compile(r"^NF M\d+-V\d+\s*\.pdf$", re.I),
    re.compile(r"^NF M\d+\.pdf$", re.I),
    re.compile(r"^\.DS_Store$"),
]

STOPWORDS = {"de","du","des","la","le","les","l","d","un","une","et","en","a","au","aux",
             "pour","sur","ou","par","fichier","exemple","liste","guide","tableau"}

def slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return re.sub(r"-+", "-", s)

def normalize(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def tokens(s: str) -> set[str]:
    return {t for t in normalize(s).split() if t not in STOPWORDS and len(t) > 1}

def similarity(a: str, b: str) -> float:
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb: return 0.0
    return len(ta & tb) / max(len(ta), len(tb))

def parse_path(rel: Path):
    parts = rel.parts
    if len(parts) < 3: return None, None, None
    m = re.match(r"^(\d+)\s*_", parts[0])
    return (m.group(1) if m else None), parts[1], rel

# Scanner les fichiers
all_files: dict[str, list[Path]] = {}  # sm -> [Path relative to SRC]
for f in SRC.rglob("*"):
    if not f.is_file(): continue
    if any(p.match(f.name) for p in IGNORE): continue
    if f.suffix.lower() not in {".pdf",".xlsx",".docx",".doc",".xls",".pptx",".ppt",".jpg",".jpeg",".png"}:
        continue
    rel = f.relative_to(SRC)
    mn, sl, _ = parse_path(rel)
    if not mn or not sl: continue
    all_files.setdefault(f"{mn}.{sl}", []).append(rel)

# Match + copy + manifest
manifest_entries = []
not_found = []
DEST.mkdir(parents=True, exist_ok=True)

for sm, items in SOMMAIRE.items():
    files_in_sm = all_files.get(sm, [])
    used = set()
    module_num = sm.split(".")[0]
    module_letter = sm.split(".")[1]
    module_slug = f"{int(module_num):02d}-{slug(MODULE_LABELS[module_num])}"
    module_label = MODULE_LABELS[module_num]
    out_dir = DEST / module_slug / module_letter
    out_dir.mkdir(parents=True, exist_ok=True)

    for item_name, item_type in items:
        # Find best match (similarity >= 0.30) among unused files
        candidates = []
        for rel in files_in_sm:
            if str(rel) in used: continue
            sim = similarity(item_name, rel.stem)
            candidates.append((sim, rel))
        candidates.sort(key=lambda x: -x[0])
        if candidates and candidates[0][0] >= 0.30:
            sim, rel = candidates[0]
            used.add(str(rel))
            ext = rel.suffix.lower()
            new_name = slug(item_name) + ext
            dst = out_dir / new_name
            shutil.copy2(SRC / rel, dst)
            manifest_entries.append({
                "sm": sm,
                "module_num": int(module_num),
                "module_letter": module_letter,
                "module_label": module_label,
                "name": item_name,
                "type": item_type,
                "path": f"/ressources-formation/{module_slug}/{module_letter}/{new_name}",
                "format": ext[1:],
            })
        else:
            not_found.append({"sm": sm, "name": item_name, "type": item_type})

# Ecrire le manifest TS
ts = ["// Auto-genere par scripts/build-resources.py — ne pas editer a la main",
      "// Source : /Users/emeline/Downloads/Outils de la formation/",
      "",
      "export interface ResourceEntry {",
      "  sm: string;",
      "  moduleNum: number;",
      "  moduleLetter: string;",
      "  moduleLabel: string;",
      "  name: string;",
      "  type: 'PDF' | 'Excel' | 'Template' | 'Checklist' | 'Video' | 'Autre';",
      "  path: string;",
      "  format: string;",
      "  available: boolean;",
      "}",
      "",
      "export const RESOURCES: ResourceEntry[] = ["]
for e in manifest_entries:
    ts.append(f'  {{ sm: "{e["sm"]}", moduleNum: {e["module_num"]}, moduleLetter: "{e["module_letter"]}", moduleLabel: {json.dumps(e["module_label"])}, name: {json.dumps(e["name"])}, type: "{e["type"]}", path: "{e["path"]}", format: "{e["format"]}", available: true }},')
for nf in not_found:
    module_num = int(nf["sm"].split(".")[0])
    ts.append(f'  {{ sm: "{nf["sm"]}", moduleNum: {module_num}, moduleLetter: "{nf["sm"].split(".")[1]}", moduleLabel: {json.dumps(MODULE_LABELS[str(module_num)])}, name: {json.dumps(nf["name"])}, type: "{nf["type"]}", path: "", format: "", available: false }},')
ts.append("];")
ts.append("")
MANIFEST.write_text("\n".join(ts))

print(f"Copies : {len(manifest_entries)}")
print(f"Pas trouves : {len(not_found)}")
for nf in not_found:
    print(f"  ✗ {nf['sm']} - {nf['name']}")
print(f"Manifest ecrit : {MANIFEST}")
