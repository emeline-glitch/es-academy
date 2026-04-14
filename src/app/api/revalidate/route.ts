import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json();
  const { secret, path } = body;

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const targetPath = path || "/";
  revalidatePath(targetPath);

  return NextResponse.json({ revalidated: true, path: targetPath });
}
