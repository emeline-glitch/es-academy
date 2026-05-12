import { z } from "zod";

// Defense en profondeur : on s assure que l event parse a au moins id + type
// + data.object. La verification de signature Stripe reste la garde principale.
// Ne PAS appliquer .strict() : les events Stripe contiennent enormement
// de champs facultatifs selon le type.
export const StripeWebhookEventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(200),
  data: z.object({
    object: z.unknown(),
  }),
  created: z.number().int().optional(),
  livemode: z.boolean().optional(),
});
export type StripeWebhookEvent = z.infer<typeof StripeWebhookEventSchema>;
