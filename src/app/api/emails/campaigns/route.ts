import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
  return NextResponse.json(data);
}
