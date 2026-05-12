import { z } from "zod";
import { EmailSchema } from "./common";

export const MagicLinkRequestSchema = z
  .object({
    email: EmailSchema,
  })
  .strict();
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;

export const SiteAuthSchema = z
  .object({
    password: z.string().min(1).max(200),
  })
  .strict();
export type SiteAuthRequest = z.infer<typeof SiteAuthSchema>;
