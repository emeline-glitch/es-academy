import { NextResponse } from "next/server";

// TEMPORAIRE - validation que Sentry capture les erreurs en prod.
// A SUPPRIMER apres test (commit dedie).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug");
  if (debug !== "es-academy-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Throw volontairement avec un message reconnaissable
  throw new Error(
    "[SENTRY_TEST] Cette erreur est volontaire pour valider Sentry au " +
    new Date().toISOString()
  );
}
