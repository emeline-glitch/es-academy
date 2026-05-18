import { z } from "zod";
import { EmailSchema } from "./common";

export const AcademyCheckoutSchema = z
  .object({
    plan: z.enum(["1x", "3x", "4x"], {
      message: "Plan invalide (attendu : 1x, 3x ou 4x)",
    }),
    // Email optionnel : si le visiteur a deja opt-in (cookie es-lead-email),
    // le frontend l'envoie pour pre-remplir Stripe + tracker l'abandon.
    email: EmailSchema.optional(),
  })
  .strict();
export type AcademyCheckoutRequest = z.infer<typeof AcademyCheckoutSchema>;

export const FamilyCheckoutSchema = z
  .object({
    plan: z.enum(["fondateur", "standard"], {
      message: "Plan invalide (attendu : fondateur ou standard)",
    }).default("fondateur"),
    email: EmailSchema.optional(),
  })
  .strict();
export type FamilyCheckoutRequest = z.infer<typeof FamilyCheckoutSchema>;

export const FamilyCheckoutQuerySchema = z
  .object({
    plan: z.enum(["fondateur", "standard"]).default("fondateur"),
  })
  .strict();
export type FamilyCheckoutQuery = z.infer<typeof FamilyCheckoutQuerySchema>;
