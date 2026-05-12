import { z } from "zod";

// /api/og : query params publics pour generer une image OG.
// Tres permissif (texte affiche dans une image, on tronque cote route).
export const OgQuerySchema = z.object({
  title: z.string().max(300).optional(),
  subtitle: z.string().max(300).optional(),
  category: z.string().max(120).optional(),
  author: z.string().max(120).optional(),
  variant: z.string().max(40).optional(),
});
export type OgQuery = z.infer<typeof OgQuerySchema>;
