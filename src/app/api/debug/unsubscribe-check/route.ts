import { NextResponse } from "next/server";
import crypto from "node:crypto";

// TEMPORAIRE - debug UNSUBSCRIBE_SECRET. A SUPPRIMER apres test.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug");
  if (debug !== "es-academy-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.UNSUBSCRIBE_SECRET || "";
  const email = "test-unsubscribe@invalid-emeline.fr";
  const normalized = email.trim().toLowerCase();

  const token = secret
    ? crypto.createHmac("sha256", secret).update(normalized).digest("hex")
    : null;

  return NextResponse.json({
    secret_present: Boolean(secret),
    secret_length: secret.length,
    secret_first_5: secret.substring(0, 5),
    secret_last_5: secret.substring(secret.length - 5),
    test_email: email,
    expected_token: token,
  });
}
