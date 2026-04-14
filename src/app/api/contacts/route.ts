import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, first_name, last_name, source, tags } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase.from("contacts").upsert(
      {
        email: email.toLowerCase().trim(),
        first_name: first_name || "",
        last_name: last_name || "",
        source: source || "website",
        tags: tags || ["newsletter"],
        status: "active",
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Contact insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = await createServiceClient();

  // Check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .order("subscribed_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    contacts: data,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
