import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { renderPdfBuffer, SubmissionData } from "@/lib/pdf";
import fs from "fs";
import path from "path";

// Force Node.js runtime so @react-pdf/renderer works (it needs Node APIs)
export const runtime = "nodejs";

function loadLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "hmmm_logo.png");
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Server není nakonfigurovaný — chybí RESEND_API_KEY env proměnná." },
        { status: 500 }
      );
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const data: SubmissionData = await req.json();
    data.submittedAt = new Date().toISOString();

    // Basic validation
    if (!data.jmeno || !data.email) {
      return NextResponse.json(
        { error: "Chybí jméno nebo e-mail" },
        { status: 400 }
      );
    }

    // Generate PDF
    const logoBase64 = loadLogoBase64();
    console.log("[submit] logo loaded, length:", logoBase64?.length, "type:", typeof logoBase64);
    const pdfBuffer = await renderPdfBuffer(data, logoBase64);
    const fileName = `hmmm-${data.jmeno
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.pdf`;

    const fromAddress =
      process.env.MAIL_FROM || "Hmmm by PB <onboarding@resend.dev>";
    const petrAddress = process.env.PETR_EMAIL || "petr@pb-dining.com";

    // Email to Petr (with full PDF attached)
    const petrMail = await resend.emails.send({
      from: fromAddress,
      to: petrAddress,
      replyTo: data.email,
      subject: `Nový brief: ${data.jmeno} · ${data.hostu || "?"} hostů · ${data.datum || "datum?"}`,
      html: petrEmailHtml(data),
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    // Email to client (confirmation, no PDF — they just submitted it)
    const clientMail = await resend.emails.send({
      from: fromAddress,
      to: data.email,
      replyTo: petrAddress,
      subject: "hmmm. by PB — máme tvůj brief",
      html: clientEmailHtml(data),
      attachments: [
        {
          filename: "tvuj-vecer-shrnuti.pdf",
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      petrMailId: petrMail.data?.id,
      clientMailId: clientMail.data?.id,
    });
  } catch (err: any) {
    console.error("submit error:", err);
    return NextResponse.json(
      { error: err.message || "Něco se rozbilo" },
      { status: 500 }
    );
  }
}

function escape(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function petrEmailHtml(d: SubmissionData): string {
  const join = (a: any) => (Array.isArray(a) ? a.join(", ") : a || "—");
  return `
    <div style="font-family: Georgia, serif; background: #EDE7D9; padding: 32px; color: #1A1A1A;">
      <div style="max-width: 540px; margin: 0 auto;">
        <p style="font-size: 11px; letter-spacing: 2px; color: #968E7E; text-transform: uppercase;">nový brief</p>
        <h1 style="font-size: 28px; margin: 8px 0 20px; font-weight: normal;">
          ${escape(d.jmeno)} · <em style="color: #B6553A;">${escape(d.hostu || "?")} hostů</em>
        </h1>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #968E7E; width: 140px;">datum</td><td>${escape(d.datum)}</td></tr>
          <tr><td style="padding: 6px 0; color: #968E7E;">místo</td><td>${escape(d.mesto)}</td></tr>
          <tr><td style="padding: 6px 0; color: #968E7E;">typ prostoru</td><td>${escape(d.prostor)}</td></tr>
          <tr><td style="padding: 6px 0; color: #968E7E;">vibe</td><td>${escape(d.vibe)}</td></tr>
          <tr><td style="padding: 6px 0; color: #968E7E;">rozpočet</td><td>${escape(d.rozpocet)} € / os ${d.rozpocetText ? `· ${escape(d.rozpocetText)}` : ""}</td></tr>
        </table>

        <p style="margin-top: 24px; padding: 16px; background: #fff; border-radius: 8px; border-left: 3px solid #B6553A;">
          <strong style="color: #B6553A;">⚠ Alergie a omezení:</strong><br/>
          ${escape(d.alergie) || "—"}<br/>
          <em style="color: #968E7E;">nechce: ${escape(d.nechci) || "—"}</em>
        </p>

        ${d.extra ? `<p style="margin-top: 20px;"><strong>Speciální přání:</strong><br/>${escape(d.extra)}</p>` : ""}

        <p style="margin-top: 24px; color: #968E7E; font-size: 13px;">
          Plný brief je v PDF v příloze. Klient: <a href="mailto:${escape(d.email)}" style="color: #B6553A;">${escape(d.email)}</a> · ${escape(d.telefon)}
        </p>

        <hr style="border: 0; border-top: 1px solid #C8BFA9; margin: 32px 0;"/>
        <p style="font-size: 11px; color: #968E7E; letter-spacing: 1.5px;">hmmm. by PB</p>
      </div>
    </div>
  `;
}

function clientEmailHtml(d: SubmissionData): string {
  return `
    <div style="font-family: Georgia, serif; background: #EDE7D9; padding: 32px; color: #1A1A1A;">
      <div style="max-width: 540px; margin: 0 auto;">
        <p style="font-size: 11px; letter-spacing: 2px; color: #968E7E; text-transform: uppercase;">private dining</p>
        <h1 style="font-size: 28px; margin: 8px 0 16px; font-weight: normal;">
          Díky, <em style="color: #B6553A;">${escape(d.jmeno)}.</em>
        </h1>
        <p style="font-size: 16px; line-height: 1.6;">
          Tvůj brief je u Petra. <em>Do 24 hodin</em> ti zavolá a doladíte detaily.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-top: 16px;">
          V příloze najdeš shrnutí toho, co jsi vyplnil. Pokud bys něco chtěl změnit, prostě odpověz na tenhle e-mail.
        </p>
        <hr style="border: 0; border-top: 1px solid #C8BFA9; margin: 32px 0;"/>
        <p style="font-size: 11px; color: #968E7E; letter-spacing: 1.5px;">hmmm. by PB · pb-dining.com</p>
      </div>
    </div>
  `;
}
