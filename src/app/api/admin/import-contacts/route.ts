import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { autoEnrollByTags } from "@/lib/sequences/auto-enroll";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CONSENT_TYPES = ["explicit", "legitimate_interest", "re_consent"] as const;

interface CsvRow {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  [key: string]: string | undefined;
}

/**
 * Parse un CSV simple (délimiteur virgule ou point-virgule) en gardant la 1re ligne comme header.
 * Gestion basique des champs quotés "…" avec virgule dedans.
 */
function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const detectDelimiter = (line: string) => {
    const c = (line.match(/,/g) || []).length;
    const s = (line.match(/;/g) || []).length;
    return s > c ? ";" : ",";
  };

  const delim = detectDelimiter(lines[0]);

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delim && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map((s) => s.trim());
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/^[\ufeff]/, ""));

  const normalize: Record<string, string> = {
    email: "email",
    "e-mail": "email",
    mail: "email",
    prenom: "first_name",
    prénom: "first_name",
    first_name: "first_name",
    firstname: "first_name",
    nom: "last_name",
    last_name: "last_name",
    lastname: "last_name",
    telephone: "phone",
    téléphone: "phone",
    phone: "phone",
    portable: "phone",
    mobile: "phone",
  };

  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: CsvRow = { email: "" };
    headers.forEach((h, i) => {
      const key = normalize[h] || h;
      row[key] = values[i] || "";
    });
    return row;
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const {
    csv,
    tags_to_apply,
    consent_type,
    consent_basis,
    set_alumni_evermind,
    rgpd_cohort,
    list_id,
    source,
    source_detail,
    dry_run,
  } = body as {
    csv?: string;
    tags_to_apply?: string[];
    consent_type?: string;
    consent_basis?: string;
    set_alumni_evermind?: boolean;
    rgpd_cohort?: number;
    list_id?: string;
    source?: string;
    source_detail?: string;
    dry_run?: boolean;
  };

  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "Champ 'csv' requis (contenu texte)" }, { status: 400 });
  }
  if (!consent_type || !VALID_CONSENT_TYPES.includes(consent_type as typeof VALID_CONSENT_TYPES[number])) {
    return NextResponse.json(
      { error: `consent_type requis (${VALID_CONSENT_TYPES.join(", ")})` },
      { status: 400 }
    );
  }

  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV vide ou invalide" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Si list_id fourni, récupérer son tag_key pour l'ajouter aux tags
  let listTagKey: string | null = null;
  if (list_id) {
    const { data: list } = await supabase
      .from("contact_lists")
      .select("tag_key")
      .eq("id", list_id)
      .maybeSingle();
    listTagKey = list?.tag_key || null;
  }

  const extraTags = Array.from(
    new Set([
      ...(Array.isArray(tags_to_apply) ? tags_to_apply : []),
      ...(listTagKey ? [listTagKey] : []),
    ])
  );

  const invalid: Array<{ row: number; email: string; reason: string }> = [];
  const validated: Array<{ email: string; first_name: string; last_name: string; phone: string | null }> = [];
  rows.forEach((r, i) => {
    const email = (r.email || "").toLowerCase().trim();
    if (!email) {
      invalid.push({ row: i + 2, email: "", reason: "email manquant" });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      invalid.push({ row: i + 2, email, reason: "email invalide" });
      return;
    }
    validated.push({
      email,
      first_name: (r.first_name || "").trim(),
      last_name: (r.last_name || "").trim(),
      phone: r.phone ? r.phone.trim() : null,
    });
  });

  // Dedup dans le CSV lui-même (si même email plusieurs fois, on garde le premier)
  const seen = new Set<string>();
  const unique = validated.filter((v) => {
    if (seen.has(v.email)) return false;
    seen.add(v.email);
    return true;
  });

  if (dry_run) {
    return NextResponse.json({
      dry_run: true,
      total_rows: rows.length,
      valid: unique.length,
      duplicates_in_csv: validated.length - unique.length,
      invalid: invalid.length,
      invalid_samples: invalid.slice(0, 10),
      tags_to_apply: extraTags,
      sample_contacts: unique.slice(0, 5),
    });
  }

  // Boucle d'import via RPC atomique import_contact_with_consent (migration 034).
  // 1 round-trip par contact, mais merge tags + préservation primary_source +
  // log consent_log dans la même transaction. Pour 1900 alumni : ~20s, OK pour
  // un import admin one-shot. Si volume plus large à l'avenir, batch via UNNEST.
  const now = new Date().toISOString();
  const consentProof = {
    import_source: source || "csv",
    import_source_detail: source_detail || null,
    imported_by: auth.userId,
    imported_at: now,
  };

  let upserted = 0;
  let errors = 0;
  const upsertedIds: string[] = [];
  for (const v of unique) {
    const { data: contactId, error: rpcErr } = await supabase.rpc(
      "import_contact_with_consent",
      {
        p_email: v.email,
        p_first_name: v.first_name,
        p_last_name: v.last_name,
        p_phone: v.phone || "",
        p_add_tags: extraTags,
        p_source: source || "import",
        p_primary_source: source || "import",
        p_primary_source_detail: source_detail || "",
        p_is_alumni: !!set_alumni_evermind,
        p_rgpd_cohort: typeof rgpd_cohort === "number" ? rgpd_cohort : null,
        p_consent_type: consent_type,
        p_consent_basis: consent_basis || "",
        p_consent_proof: consentProof,
      }
    );
    if (rpcErr || !contactId) {
      errors++;
      console.error("[import-contacts] rpc error for", v.email, ":", rpcErr?.message);
    } else {
      upserted++;
      upsertedIds.push(contactId as string);
    }
  }

  // Auto-enrollment : pour chaque contact importé, enroll dans les séquences
  // actives dont le trigger_value matche un des tags appliqués
  let totalEnrolled = 0;
  if (extraTags.length > 0 && upsertedIds.length > 0) {
    for (const contactId of upsertedIds) {
      const { enrolled } = await autoEnrollByTags(supabase, contactId, extraTags);
      totalEnrolled += enrolled;
    }
  }

  // Audit log
  await supabase.from("audit_log").insert({
    actor_id: auth.userId,
    action: "contacts_imported",
    entity_type: "contacts",
    entity_id: null,
    after: {
      count: upserted,
      tags_applied: extraTags,
      consent_type,
      rgpd_cohort: rgpd_cohort || null,
      alumni: !!set_alumni_evermind,
      source_detail: source_detail || null,
      auto_enrolled: totalEnrolled,
    },
  });

  revalidatePath("/admin/contacts");
  revalidatePath("/admin/dashboard");

  return NextResponse.json({
    success: true,
    total_rows: rows.length,
    imported: upserted,
    errors,
    invalid: invalid.length,
    invalid_samples: invalid.slice(0, 10),
    duplicates_in_csv: validated.length - unique.length,
    tags_applied: extraTags,
    consent_logs_created: upserted,
    auto_enrolled: totalEnrolled,
  });
}
