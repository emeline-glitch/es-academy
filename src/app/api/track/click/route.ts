import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sendId = searchParams.get("sid");
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (sendId) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );

      // Get current send record
      const { data: send } = await supabase
        .from("email_sends")
        .select("campaign_id, clicked_at, clicked_links")
        .eq("id", sendId)
        .single();

      if (send) {
        const existingLinks: string[] = send.clicked_links || [];
        const isFirstClick = !send.clicked_at;

        // Add this URL to clicked_links if not already there
        const updatedLinks = existingLinks.includes(url)
          ? existingLinks
          : [...existingLinks, url];

        await supabase
          .from("email_sends")
          .update({
            clicked_at: send.clicked_at || new Date().toISOString(),
            clicked_links: updatedLinks,
          })
          .eq("id", sendId);

        // Also mark as opened if not yet
        await supabase
          .from("email_sends")
          .update({ opened_at: new Date().toISOString() })
          .eq("id", sendId)
          .is("opened_at", null);

        // Increment campaign click count (only on first click per send)
        if (isFirstClick) {
          const { data: campaign } = await supabase
            .from("email_campaigns")
            .select("click_count, open_count")
            .eq("id", send.campaign_id)
            .single();

          if (campaign) {
            const updates: Record<string, number> = {
              click_count: (campaign.click_count || 0) + 1,
            };
            // Also increment open if first interaction
            if (!send.clicked_at) {
              updates.open_count = (campaign.open_count || 0) + 1;
            }
            await supabase
              .from("email_campaigns")
              .update(updates)
              .eq("id", send.campaign_id);
          }
        }
      }
    } catch (e) {
      console.error("[Track Click] Error:", e);
    }
  }

  // Always redirect to the destination URL
  return NextResponse.redirect(url);
}
