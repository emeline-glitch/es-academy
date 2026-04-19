import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  // Fetch campaign
  const { data: campaign, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  // Fetch sends with contact info
  const { data: sends } = await supabase
    .from("email_sends")
    .select("*, contact:contacts(email, first_name, last_name)")
    .eq("campaign_id", id)
    .order("sent_at", { ascending: false });

  // Build link stats from sends
  const linkMap = new Map<string, { clicks: number; clickers: { email: string; name: string; clicked_at: string }[] }>();

  for (const send of sends || []) {
    if (send.clicked_links && Array.isArray(send.clicked_links)) {
      for (const link of send.clicked_links) {
        if (!linkMap.has(link)) {
          linkMap.set(link, { clicks: 0, clickers: [] });
        }
        const stat = linkMap.get(link)!;
        stat.clicks++;
        if (send.contact) {
          stat.clickers.push({
            email: send.contact.email,
            name: `${send.contact.first_name} ${send.contact.last_name}`.trim(),
            clicked_at: send.clicked_at || send.sent_at,
          });
        }
      }
    }
  }

  const linkStats = Array.from(linkMap.entries())
    .map(([url, data]) => ({ url, ...data }))
    .sort((a, b) => b.clicks - a.clicks);

  return NextResponse.json({
    campaign,
    sends: sends || [],
    link_stats: linkStats,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.subject !== undefined) updateData.subject = body.subject;
  if (body.html_content !== undefined) updateData.html_content = body.html_content;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.target_tag !== undefined) updateData.target_tag = body.target_tag;
  if (body.target_tags !== undefined) updateData.target_tags = body.target_tags;
  if (body.preview_text !== undefined) updateData.preview_text = body.preview_text;
  if (body.from_name !== undefined) updateData.from_name = body.from_name;
  if (body.from_email !== undefined) updateData.from_email = body.from_email;
  if (body.reply_to !== undefined) updateData.reply_to = body.reply_to;
  if (body.scheduled_at !== undefined) updateData.scheduled_at = body.scheduled_at;

  const { data, error } = await supabase
    .from("email_campaigns")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
