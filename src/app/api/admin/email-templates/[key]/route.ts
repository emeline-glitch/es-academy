import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin-auth";
import { writeAuditLog, extractRequestContext } from "@/lib/utils/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { key } = await params;
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
  return NextResponse.json({ template: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { key } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (body.subject !== undefined) update.subject = String(body.subject).trim();
  if (body.html_content !== undefined) update.html_content = body.html_content;
  if (body.from_name !== undefined) update.from_name = body.from_name;
  if (body.from_email !== undefined) update.from_email = body.from_email;
  if (body.reply_to !== undefined) update.reply_to = body.reply_to || null;
  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: before } = await supabase
    .from("email_templates")
    .select("id, subject, from_email, from_name, name")
    .eq("key", key)
    .maybeSingle();

  const { data, error } = await supabase
    .from("email_templates")
    .update(update)
    .eq("key", key)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Template introuvable" }, { status: 404 });

  await writeAuditLog(supabase, {
    actor_id: auth.userId,
    actor_email: auth.user.email || null,
    action: "template.update",
    entity_type: "email_template",
    entity_id: data.id,
    before: before || null,
    after: {
      key,
      subject: data.subject,
      from_email: data.from_email,
      from_name: data.from_name,
      fields_changed: Object.keys(update),
      html_content_changed: body.html_content !== undefined,
      request_context: extractRequestContext(request),
    },
  });

  revalidatePath("/admin/emails/templates");
  return NextResponse.json({ template: data });
}
