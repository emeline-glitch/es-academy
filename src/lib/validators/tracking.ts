import { z } from "zod";

// Tracking endpoints sont publics, payloads heterogenes. Limites laxistes
// volontaires (le tracking ne doit jamais bloquer la page).

export const TrackPageViewSchema = z
  .object({
    path: z.string().min(1).max(500),
    referrer: z.string().max(500).optional().nullable(),
    session_id: z.string().max(100).optional().nullable(),
    utm_source: z.string().max(200).optional().nullable(),
    utm_medium: z.string().max(200).optional().nullable(),
    utm_campaign: z.string().max(200).optional().nullable(),
    utm_term: z.string().max(200).optional().nullable(),
    utm_content: z.string().max(200).optional().nullable(),
    gclid: z.string().max(200).optional().nullable(),
    fbclid: z.string().max(200).optional().nullable(),
    landing_path: z.string().max(500).optional().nullable(),
  })
  .strict();
export type TrackPageViewPayload = z.infer<typeof TrackPageViewSchema>;

export const TrackClickQuerySchema = z.object({
  sid: z.string().uuid().optional(),
  url: z.string().max(2048).optional(),
});
export type TrackClickQuery = z.infer<typeof TrackClickQuerySchema>;

export const TrackOpenQuerySchema = z.object({
  sid: z.string().uuid().optional(),
});
export type TrackOpenQuery = z.infer<typeof TrackOpenQuerySchema>;
