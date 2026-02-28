import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const members = await prisma.user.findMany({
      where:   { restaurantId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json({
      members:     JSON.parse(JSON.stringify(members)),
      currentRole: session.user.role,
    });
  } catch (err) {
    console.error("[GET /api/restaurant/team]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const InviteSchema = z.object({
  name:     z.string().min(1).max(80),
  email:    z.string().email(),
  role:     z.enum(["restaurant_manager"]),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "restaurant_owner") {
      return NextResponse.json({ error: "Only restaurant owners can invite team members" }, { status: 403 });
    }
    const restaurantId = getRestaurantIdFromSession(session);

    const body   = await req.json().catch(() => ({}));
    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name:         parsed.data.name,
        email:        parsed.data.email.toLowerCase(),
        passwordHash,
        role:         parsed.data.role,
        restaurantId,
        isActive:     true,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json({ member: JSON.parse(JSON.stringify(user)) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/restaurant/team]", err);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}
