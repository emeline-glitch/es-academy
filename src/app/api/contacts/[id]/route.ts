import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.tags) updateData.tags = body.tags;
  if (body.status) updateData.status = body.status;
  if (body.first_name !== undefined) updateData.first_name = body.first_name;
  if (body.last_name !== undefined) updateData.last_name = body.last_name;
  if (body.source) updateData.source = body.source;

  const { error } = await supabase
    .from("contacts")
    .update(updateData)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
