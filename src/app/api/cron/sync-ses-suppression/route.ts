import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  SESv2Client,
  ListSuppressedDestinationsCommand,
} from "@aws-sdk/client-sesv2";

/**
 * Cron /api/cron/sync-ses-suppression :
 *
 * AWS SES maintient une "Account-level suppression list" qui collecte
 * automatiquement les emails ayant hard-bounce ou complaint. Quand SES
 * envoie a une adresse de cette liste, il DROP silencieusement le mail
 * (retourne un MessageId mais ne delivre pas). Aucune exception cote SDK.
 *
 * Donc on ne peut PAS detecter une suppression au moment du send. La seule
 * facon fiable de tenir notre DB a jour est de sync periodiquement la
 * suppression list AWS vers contacts.status = 'bounced'.
 *
 * Le RPC get_pending_sequence_sends filtre deja sur c.status = 'active',
 * donc une fois marque 'bounced', le contact est exclu des sequences.
 *
 * Securite : header Authorization: Bearer <CRON_SECRET>.
 * A scheduler via pg_cron toutes les 30 min (ou Vercel Cron).
 *
 * Idempotent : passer N fois ne cree pas de doublon de audit_log car on ne
 * marque que les contacts qui sont active/archived (pas deja bounced).
 */

interface SuppressedDestination {
  EmailAddress?: string;
  Reason?: string;
  LastUpdateTime?: Date;
}

async function fetchAllSuppressedFromAws(
  client: SESv2Client
): Promise<SuppressedDestination[]> {
  const all: SuppressedDestination[] = [];
  let nextToken: string | undefined;
  const PAGE_SIZE = 100;
  // Garde-fou : 10 pages max = 1000 emails par run. Au-dela on coupe et on
  // continue au prochain run pour ne pas timeout sur Vercel (10s par defaut).
  const MAX_PAGES = 10;
  let pagesFetched = 0;

  do {
    const res = await client.send(
      new ListSuppressedDestinationsCommand({
        PageSize: PAGE_SIZE,
        NextToken: nextToken,
      })
    );
    if (res.SuppressedDestinationSummaries) {
      all.push(...res.SuppressedDestinationSummaries);
    }
    nextToken = res.NextToken;
    pagesFetched++;
    if (pagesFetched >= MAX_PAGES) break;
  } while (nextToken);

  return all;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configure cote serveur" },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get("authorization") || "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";
  if (provided !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const region = process.env.AWS_SES_REGION || "eu-west-3";
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: "AWS SES credentials manquantes" },
      { status: 500 }
    );
  }
  const sesClient = new SESv2Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  let suppressed: SuppressedDestination[];
  try {
    suppressed = await fetchAllSuppressedFromAws(sesClient);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cron/sync-ses-suppression] AWS list failed:", msg);
    return NextResponse.json(
      { error: `AWS ListSuppressedDestinations failed: ${msg}` },
      { status: 500 }
    );
  }

  if (suppressed.length === 0) {
    return NextResponse.json({ total_aws: 0, marked: 0, emails_marked: [] });
  }

  const supabase = await createServiceClient();
  const awsEmails = suppressed
    .map((s) => s.EmailAddress?.toLowerCase())
    .filter((e): e is string => Boolean(e));

  // On ne re-marque pas les unsubscribed (RGPD opt-out explicite a preserver)
  // ni les deja-bounced (idempotence). Match sur 'active' ou 'archived'.
  const { data: toMark, error: selectErr } = await supabase
    .from("contacts")
    .select("id, email, status")
    .in("email", awsEmails)
    .in("status", ["active", "archived"]);

  if (selectErr) {
    console.error(
      "[cron/sync-ses-suppression] select contacts failed:",
      selectErr.message
    );
    return NextResponse.json({ error: selectErr.message }, { status: 500 });
  }

  const marked = toMark || [];

  if (marked.length > 0) {
    const ids = marked.map((c) => c.id);
    const { error: updateErr } = await supabase
      .from("contacts")
      .update({ status: "bounced" })
      .in("id", ids);

    if (updateErr) {
      console.error(
        "[cron/sync-ses-suppression] update failed:",
        updateErr.message
      );
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const auditRows = marked.map((c) => {
      const aws = suppressed.find(
        (s) => s.EmailAddress?.toLowerCase() === c.email
      );
      return {
        action: "ses_suppression_sync",
        entity_type: "contact" as const,
        entity_id: c.id as string,
        after: {
          email: c.email,
          previous_status: c.status,
          aws_reason: aws?.Reason || "UNKNOWN",
          aws_last_update: aws?.LastUpdateTime
            ? new Date(aws.LastUpdateTime).toISOString()
            : null,
        },
      };
    });
    const { error: auditErr } = await supabase
      .from("audit_log")
      .insert(auditRows);
    if (auditErr) {
      // Pas bloquant : update DB deja fait, audit log best-effort.
      console.error(
        "[cron/sync-ses-suppression] audit log insert failed:",
        auditErr.message
      );
    }
  }

  return NextResponse.json({
    total_aws: suppressed.length,
    marked: marked.length,
    emails_marked: marked.map((c) => c.email),
  });
}

// GET healthcheck pour valider config + auth sans rien modifier
export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") || "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";
  if (expectedSecret && provided !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ status: "ready" });
}
