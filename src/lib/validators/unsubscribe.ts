import { z } from "zod";
import { EmailSchema } from "./common";

// Deux paths legitimes :
// Path 1 : token HMAC (lien 1-click depuis email)
// Path 2 : source = "manual" (formulaire web sans preuve)
// Tout autre payload est rejete avec 400.
export const UnsubscribeRequestSchema = z
  .object({
    email: EmailSchema,
    token: z.string().min(1).max(500).optional(),
    source: z.literal("manual").optional(),
  })
  .strict()
  .refine((d) => Boolean(d.token) || d.source === "manual", {
    message: "Token requis ou source 'manual' pour formulaire de desabonnement",
    path: ["token"],
  });
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
