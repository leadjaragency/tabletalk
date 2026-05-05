export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sendPasswordChangedEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = schema.parse(body);

    // Get the user from the session cookie set by the callback route
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json({ error: "Session expired. Please request a new reset link." }, { status: 401 });
    }

    // Use Admin API — bypasses session scope issues, always works
    const { error: updateError } = await getSupabaseAdmin().auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 });
    }

    // Sign out the recovery session so they must log in fresh with new password
    await supabase.auth.signOut();

    // Send confirmation email (non-critical)
    try {
      const dbUser = await prisma.user.findFirst({
        where: { email: user.email },
        select: { name: true },
      });
      await sendPasswordChangedEmail({
        to: user.email!,
        name: dbUser?.name ?? "there",
      });
    } catch {
      // Don't fail the reset if email fails
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
