import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { writeAuditLog, extractRequestContext } from "@/lib/utils/audit";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = auth.supabase;

  const body = await request.json();

  const insertData: Record<string, unknown> = {
    subject: body.subject || "",
    html_content: body.html_content || "",
    status: body.status || "draft",
  };
  if (body.preview_text !== undefined) insertData.preview_text = body.preview_text;
  if (body.from_name !== undefined) insertData.from_name = body.from_name;
  if (body.from_email !== undefined) insertData.from_email = body.from_email;
  if (body.reply_to !== undefined) insertData.reply_to = body.reply_to;
  if (body.target_tags !== undefined) insertData.target_tags = body.target_tags;
  if (body.scheduled_at !== undefined) insertData.scheduled_at = body.scheduled_at;

  const { data, error } = await supabase
    .from("email_campaigns")
    .insert(insertData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "campaign.create",
    entity_type: "email_campaign",
    entity_id: data.id,
    after: {
      subject: data.subject,
      status: data.status,
      from_email: data.from_email,
      target_tags: data.target_tags,
      scheduled_at: data.scheduled_at,
      request_context: extractRequestContext(request),
    },
  });

  return NextResponse.json(data);
}
