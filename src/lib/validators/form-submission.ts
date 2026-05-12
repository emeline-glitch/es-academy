import { z } from "zod";
import { EmailSchema, OptionalNameSchema, FrenchPhoneSchema } from "./common";

export const FormSubmissionSchema = z
  .object({
    email: EmailSchema,
    first_name: OptionalNameSchema,
    last_name: OptionalNameSchema,
    phone: FrenchPhoneSchema.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
    consent: z.literal(true, { message: "Le consentement RGPD est requis" }),
  })
  .strict();
export type FormSubmission = z.infer<typeof FormSubmissionSchema>;
