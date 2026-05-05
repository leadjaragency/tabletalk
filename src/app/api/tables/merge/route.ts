import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredSession } from "@/lib/auth";
import { z } from "zod";

const MergeSchema = z.object({
  primaryTableId:    z.string().min(1),
  secondaryTableIds: z.array(z.string().min(1)).min(1),
});

const UnmergeSchema = z.object({
  primaryTableId: z.string().min(1),
  force:          z.boolean().optional().default(false),
});

/**
 * POST /api/tables/merge
 * Merges one or more secondary tables into a primary table.
 * All secondary tables must be empty and not already merged.
 * The primary table must not itself be merged into another.
 */
export async function POST(req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant." }, { status: 403 });

    const body  = await req.json();
    const parsed = MergeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { primaryTableId, secondaryTableIds } = parsed.data;

    if (secondaryTableIds.includes(primaryTableId)) {
      return NextResponse.json(
        { error: "Primary table cannot be in the secondary list." },
        { status: 400 }
      );
    }

    const allIds = [primaryTableId, ...secondaryTableIds];

    // Fetch all tables in one query
    const tables = await prisma.table.findMany({
      where: { id: { in: allIds }, restaurantId },
      select: {
        id:           true,
        number:       true,
        status:       true,
        mergedIntoId: true,
        _count:       { select: { mergedTables: true } },
      },
    });

    if (tables.length !== allIds.length) {
      return NextResponse.json(
        { error: "One or more tables not found or don't belong to your restaurant." },
        { status: 404 }
      );
    }

    const primary = tables.find((t) => t.id === primaryTableId)!;

    // Primary must not already be merged into another table
    if (primary.mergedIntoId) {
      return NextResponse.json(
        { error: `Table ${primary.number} is already merged into another table. Unmerge it first.` },
        { status: 409 }
      );
    }

    // Validate secondary tables
    for (const t of tables.filter((t) => t.id !== primaryTableId)) {
      if (t.mergedIntoId) {
        return NextResponse.json(
          { error: `Table ${t.number} is already merged into another group. Unmerge it first.` },
          { status: 409 }
        );
      }
      if (t._count.mergedTables > 0) {
        return NextResponse.json(
          { error: `Table ${t.number} is already a primary table for other merged tables. Unmerge its group first.` },
          { status: 409 }
        );
      }
      if (t.status !== "empty") {
        return NextResponse.json(
          { error: `Table ${t.number} is currently ${t.status}. Only empty tables can be merged.` },
          { status: 409 }
        );
      }
    }

    // Set mergedIntoId on all secondary tables
    await prisma.table.updateMany({
      where: { id: { in: secondaryTableIds }, restaurantId },
      data:  { mergedIntoId: primaryTableId },
    });

    const updated = await prisma.table.findMany({
      where:   { id: { in: allIds } },
      select:  { id: true, number: true, status: true, mergedIntoId: true },
      orderBy: { number: "asc" },
    });

    return NextResponse.json({ tables: updated });
  } catch (error) {
    console.error("[POST /api/tables/merge]", error);
    return NextResponse.json({ error: "Failed to merge tables." }, { status: 500 });
  }
}

/**
 * DELETE /api/tables/merge
 * Unmerges all tables in a group (identified by the primary table).
 * Requires all tables in the group to be empty unless force=true.
 */
export async function DELETE(req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant." }, { status: 403 });

    const body   = await req.json();
    const parsed = UnmergeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { primaryTableId, force } = parsed.data;

    // Fetch primary + all its merged children
    const primary = await prisma.table.findUnique({
      where:  { id: primaryTableId, restaurantId },
      select: {
        id:          true,
        number:      true,
        status:      true,
        mergedTables: {
          select: { id: true, number: true, status: true },
        },
      },
    });

    if (!primary) {
      return NextResponse.json({ error: "Table not found." }, { status: 404 });
    }

    if (primary.mergedTables.length === 0) {
      return NextResponse.json({ error: "This table has no merged tables." }, { status: 400 });
    }

    if (!force) {
      const nonEmpty = [primary, ...primary.mergedTables].filter((t) => t.status !== "empty");
      if (nonEmpty.length > 0) {
        const nums = nonEmpty.map((t) => `T${t.number}`).join(", ");
        return NextResponse.json(
          { error: `Tables ${nums} are still active. Reset them first, or use force unmerge.` },
          { status: 409 }
        );
      }
    }

    const secondaryIds = primary.mergedTables.map((t) => t.id);

    await prisma.table.updateMany({
      where: { id: { in: secondaryIds }, restaurantId },
      data:  { mergedIntoId: null },
    });

    return NextResponse.json({ success: true, unmergedCount: secondaryIds.length });
  } catch (error) {
    console.error("[DELETE /api/tables/merge]", error);
    return NextResponse.json({ error: "Failed to unmerge tables." }, { status: 500 });
  }
}
