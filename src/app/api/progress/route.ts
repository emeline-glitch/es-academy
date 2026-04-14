import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json();
  const { lesson_id, course_id } = body;

  if (!lesson_id || !course_id) {
    return NextResponse.json({ error: "lesson_id et course_id requis" }, { status: 400 });
  }

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      lesson_id,
      course_id,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json();
  const { lesson_id } = body;

  if (!lesson_id) {
    return NextResponse.json({ error: "lesson_id requis" }, { status: 400 });
  }

  const { error } = await supabase
    .from("progress")
    .delete()
    .eq("user_id", user.id)
    .eq("lesson_id", lesson_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
