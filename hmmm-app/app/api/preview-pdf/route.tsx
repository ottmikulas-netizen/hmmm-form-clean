import { NextRequest, NextResponse } from "next/server";
import { renderPdfBuffer, SubmissionData } from "@/lib/pdf";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// Sample data for preview
const sampleData: SubmissionData = {
  jmeno: "Mikuláš Ott",
  telefon: "+420 777 123 456",
  email: "miki@test.cz",
  mesto: "Praha 7 — Bubeneč",
  prostor: "byt",
  hostu: 6,
  datum: "2026-06-15",
  prijezd: "15:00",
  start: "18:00",
  prvnichod: "19:00",
  tempo: "dlouhý večer, nikam nespěcháme",
  vibe: "fine",
  stravaMain: ["maso", "ryby & seafood"],
  meatTypes: ["kachní", "hovězí"],
  fishTypes: ["mořské", "syrové (sashimi/tatarák)"],
  chute: ["umami", "kyselé", "spicy", "fermentované"],
  kuchyne: ["Itálie", "Francie", "Japonsko"],
  alergie: "ořechy, lepek",
  nechci: "koriandr, vnitřnosti",
  dieta: "—",
  pairingMain: ["víno"],
  shots: ["aperitiv (Aperol, Lillet…)", "bylinkové"],
  napojePref: "naturální vína, Champagne",
  atmosfera: ["romantika"],
  rolepetra: "adapt",
  rozpocet: "80",
  rozpocetText: "okolo 2 000 Kč/os",
  occasion: ["narozeniny"],
  extra:
    "Překvapení pro Mikuláše — dezert s prskavkou. Je to jeho narozeninová večeře a chtěl bych aby byl Petr aktivní u stolu.",
  submittedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const logoPath = path.join(process.cwd(), "public", "hmmm_logo.png");
    const logoBase64 = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
      : "";
    const pdfBuffer = await renderPdfBuffer(sampleData, logoBase64);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="preview.pdf"',
      },
    });
  } catch (err: any) {
    console.error("[preview-pdf] FULL ERROR:", err);
    return NextResponse.json({ error: err.message, stack: err.stack?.slice(0, 1000) }, { status: 500 });
  }
}
