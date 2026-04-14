import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 1x1 transparent GIF pixel
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sendId = searchParams.get("sid");

  if (sendId) {
    try {
      // Service role client without cookies (this is a public tracking endpoint)
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );

      // Update open timestamp (only first open)
      await supabase
        .from("email_sends")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", sendId)
        .is("opened_at", null);

      // Increment campaign open count
      const { data: send } = await supabase
        .from("email_sends")
        .select("campaign_id")
        .eq("id", sendId)
        .single();

      if (send) {
        const { data: campaign } = await supabase
          .from("email_campaigns")
          .select("open_count")
          .eq("id", send.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from("email_campaigns")
            .update({ open_count: (campaign.open_count || 0) + 1 })
            .eq("id", send.campaign_id);
        }
      }
    } catch (e) {
      console.error("[Track Open] Error:", e);
    }
  }

  // Always return the pixel (even on error — don't break the email display)
  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
