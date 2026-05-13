export type CalendlyOwner = "antony" | "emeline";

export interface CalendlyLink {
  source: string;
  url: string;
  description?: string;
}

export const CALENDLY_LINKS: Record<CalendlyOwner, { profile: string; events: CalendlyLink[] }> = {
  antony: {
    profile: "https://calendly.com/antony-emeline-siron",
    events: [
      {
        source: "Site internet",
        url: "https://calendly.com/antony-emeline-siron/on-parle-de-ton-projet-immo-site-internet",
        description: "Visiteurs du site emeline-siron.fr",
      },
      {
        source: "Instagram",
        url: "https://calendly.com/antony-emeline-siron/on-parle-de-ton-projet-immo-instagram",
        description: "Lien en bio + DM Instagram",
      },
      {
        source: "LinkedIn",
        url: "https://calendly.com/antony-emeline-siron/on-parle-de-ton-projet-immo-linkedin",
        description: "Posts et messages LinkedIn",
      },
      {
        source: "Cahier de vacances",
        url: "https://calendly.com/antony-emeline-siron/on-parle-de-ton-projet-immo-cahier-de-vacances",
        description: "Lead magnet Cahier de vacances",
      },
      {
        source: "Podcast",
        url: "https://calendly.com/antony-emeline-siron/on-parle-de-ton-projet-immo-podcast",
        description: "Mentions dans OTB Podcast",
      },
      {
        source: "Newsletter",
        url: "https://calendly.com/antony-emeline-siron/on-parle-de-ton-projet-immo-newsletter",
        description: "CTAs dans la newsletter",
      },
      {
        source: "Academy",
        url: "https://calendly.com/antony-emeline-siron/appel-decouverte-es-academy",
        description: "Appel decouverte Academy (sequences PA)",
      },
    ],
  },
  emeline: {
    profile: "https://calendly.com/emeline-siron",
    events: [],
  },
};
