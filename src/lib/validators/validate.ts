import { NextResponse } from "next/server";
import type { ZodTypeAny, infer as ZodInfer } from "zod";

type ValidationOk<T> = { ok: true; data: T };
type ValidationKo = { ok: false; response: NextResponse };

export async function validateBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<ValidationOk<ZodInfer<S>> | ValidationKo> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "JSON invalide" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

export function validateQuery<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): ValidationOk<ZodInfer<S>> | ValidationKo {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Parametres invalides", details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
