/**
 * GA4 Measurement Protocol API : envoi server-side d'events.
 *
 * Pourquoi server-side ?
 *  - Adblockers bloquent le pixel client (~30% des visiteurs)
 *  - Stripe webhook donne la conversion confirmee (paiement vraiment passe)
 *  - Permet d'envoyer les events apres redirection Stripe (ou' le client
 *    ne re-charge pas forcement notre /merci si user-agent fait du caching)
 *
 * Doc : https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

interface MpEventParams {
  [key: string]: string | number | boolean | undefined | unknown[];
}

interface MpEvent {
  name: string;
  params: MpEventParams;
}

interface SendOptions {
  /** Identifiant unique du client (UUID, ideal : recuperer depuis cookie _ga si dispo) */
  clientId: string;
  /** Identifiant user authentifie (Supabase user.id) si dispo */
  userId?: string;
  events: MpEvent[];
  /** Si true, envoie en mode debug (events vont dans GA4 DebugView, pas en prod) */
  debug?: boolean;
}

/**
 * Envoie des events vers GA4 via Measurement Protocol.
 * Silencieux en cas d'erreur (ne doit JAMAIS bloquer le webhook Stripe).
 */
export async function sendGa4Event({ clientId, userId, events, debug = false }: SendOptions): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ga4-server] NEXT_PUBLIC_GA_MEASUREMENT_ID ou GA4_API_SECRET manquant, skip");
    }
    return;
  }

  const url = `${debug ? "https://www.google-analytics.com/debug/mp/collect" : GA4_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  const body: Record<string, unknown> = {
    client_id: clientId,
    events: events.map((e) => ({ name: e.name, params: e.params })),
    non_personalized_ads: false,
  };
  if (userId) body.user_id = userId;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (debug) {
      const responseBody = await res.json();
      console.log("[ga4-server][debug]", JSON.stringify(responseBody, null, 2));
      return;
    }
    // En prod GA4 retourne 204 No Content, pas de parsing
    if (!res.ok) {
      console.warn("[ga4-server] HTTP", res.status, "envoi event GA4 echoue");
    }
  } catch (e) {
    console.warn("[ga4-server] fetch error:", e instanceof Error ? e.message : String(e));
  }
}

/**
 * Helper specifique pour les conversions purchase server-side.
 * A appeler depuis le webhook Stripe checkout.session.completed.
 */
export async function trackServerPurchase(args: {
  clientId: string;
  userId?: string;
  transactionId: string;
  value: number;
  currency?: string;
  product: "academy" | "family" | "coaching";
  plan?: string;
  email?: string;
}): Promise<void> {
  const { clientId, userId, transactionId, value, currency = "EUR", product, plan, email } = args;
  await sendGa4Event({
    clientId,
    userId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: transactionId,
          value,
          currency,
          ...(plan ? { plan } : {}),
          ...(email ? { email } : {}),
          items: [
            {
              item_id: product,
              item_name: product,
              item_category: product,
              ...(plan ? { item_variant: plan } : {}),
              price: value,
              quantity: 1,
            },
          ],
        },
      },
    ],
  });
}
