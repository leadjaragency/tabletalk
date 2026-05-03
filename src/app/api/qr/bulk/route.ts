import { NextResponse } from "next/server";

import { getRequiredSession, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTableQR } from "@/lib/qr-generator";
import { jsPDF } from "jspdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── A4 grid layout constants (all in mm) ─────────────────────────────────────
const PAGE_W  = 210;
const PAGE_H  = 297;
const COLS    = 3;
const ROWS    = 4;
const MARGIN  = 8;
const CELL_W  = (PAGE_W - MARGIN * 2) / COLS;   // ≈ 64.7 mm
const CELL_H  = (PAGE_H - MARGIN * 2) / ROWS;   // ≈ 70.3 mm
const QR_SIZE = 44;   // mm — QR image square
const PAD     = 4;    // mm — inner padding

export async function POST(req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const [restaurant, tables] = await Promise.all([
      prisma.restaurant.findUnique({
        where:  { id: restaurantId },
        select: { name: true, slug: true },
      }),
      prisma.table.findMany({
        where:   { restaurantId },
        orderBy: { number: "asc" },
        select:  { id: true, number: true },
      }),
    ]);

    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    if (tables.length === 0) return NextResponse.json({ error: "No tables found" }, { status: 404 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Generate all QRs in parallel
    const qrCodes = await Promise.all(
      tables.map((t) => generateTableQR(baseUrl, t.number, restaurant.slug))
    );

    // ── Build PDF ─────────────────────────────────────────────────────────────
    const doc     = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const perPage = COLS * ROWS;

    tables.forEach((table, idx) => {
      const cellIdx = idx % perPage;
      const col     = cellIdx % COLS;
      const row     = Math.floor(cellIdx / COLS);

      if (idx > 0 && cellIdx === 0) doc.addPage();

      const x = MARGIN + col * CELL_W;
      const y = MARGIN + row * CELL_H;

      // Cell border
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.rect(x, y, CELL_W, CELL_H);

      // Restaurant name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      doc.text(restaurant.name, x + CELL_W / 2, y + PAD + 3, { align: "center" });

      // QR code
      const qrX = x + (CELL_W - QR_SIZE) / 2;
      const qrY = y + PAD + 7;
      doc.addImage(qrCodes[idx], "PNG", qrX, qrY, QR_SIZE, QR_SIZE);

      // Table number
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`Table ${table.number}`, x + CELL_W / 2, qrY + QR_SIZE + 5.5, { align: "center" });

      // Instruction
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(120, 120, 120);
      doc.text("Scan to meet your AI waiter!", x + CELL_W / 2, qrY + QR_SIZE + 10, { align: "center" });
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="qr-codes-${restaurant.slug}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[POST /api/qr/bulk]", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
