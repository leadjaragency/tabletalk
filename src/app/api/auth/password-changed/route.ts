import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendPasswordChangedEmail } from "@/lib/email";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Look up name from our DB
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      select: { name: true },
    });

    await sendPasswordChangedEmail({
      to: user.email,
      name: dbUser?.name ?? "there",
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Non-critical — don't fail the reset flow if email fails
    return NextResponse.json({ ok: true });
  }
}
