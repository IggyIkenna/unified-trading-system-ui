import type { DeclarationField } from "./signup-data";

export function generateDeclarationHtml(
  title: string,
  applicantName: string,
  company: string,
  fields: DeclarationField[],
  answers: Record<string, string>,
  signature: string,
) {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#111;line-height:1.6}
.logo-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #ddd}
.logo-header img{height:48px;width:auto}
.logo-header .company-name{font-size:14px;color:#555;font-weight:600;letter-spacing:1px}
h1{font-size:18px;text-transform:uppercase;border-bottom:2px solid #111;padding-bottom:8px}
.field{margin:16px 0}.field-label{font-weight:bold;font-size:13px;color:#555;margin-bottom:2px}
.field-value{font-size:15px;padding:4px 0;border-bottom:1px solid #ddd}
.confirmation{margin-top:32px;padding:16px;background:#f9f9f9;border:1px solid #ddd;font-size:14px}
.sig-block{margin-top:40px;display:flex;gap:40px}.sig-col{flex:1}
.sig-line{border-bottom:1px solid #111;min-height:40px;display:flex;align-items:flex-end;padding-bottom:4px;font-style:italic;font-size:18px}
.sig-label{font-size:11px;color:#555;margin-top:4px}
@media print{body{margin:0;padding:20px}}</style></head><body>
<div class="logo-header"><img src="${typeof window !== "undefined" ? window.location.origin : ""}/images/odum-logo.png" alt="Odum Research" crossorigin="anonymous" /><div class="company-name">Odum Research Ltd</div></div>
<h1>${title}</h1><p style="color:#555;font-size:13px">Date: ${date}</p>
<p>I, <strong>${applicantName}</strong>, of <strong>${company}</strong>, hereby declare the following:</p>
${fields.map((f) => `<div class="field"><div class="field-label">${f.label}</div><div class="field-value">${answers[f.id] || "<em>Not provided</em>"}</div></div>`).join("")}
<div class="confirmation">I confirm that the information provided above is true and accurate to the best of my knowledge and belief.</div>
<div class="sig-block"><div class="sig-col"><div class="sig-line">${signature}</div><div class="sig-label">Signature</div></div>
<div class="sig-col"><div class="sig-line">${applicantName}</div><div class="sig-label">Print Name</div></div>
<div class="sig-col"><div class="sig-line">${date}</div><div class="sig-label">Date</div></div></div>
<p style="margin-top:40px;font-size:11px;color:#888">Document generated electronically via Odum Research Ltd onboarding portal. Electronic signature accepted.</p>
</body></html>`;
}

// Cache logo base64 so we only fetch once
let _logoBase64: string | null = null;
export async function getLogoBase64(): Promise<string | null> {
  if (_logoBase64) return _logoBase64;
  try {
    const res = await fetch("/images/odum-logo.png");
    const blob = await res.blob();
    // Resize to small canvas to keep PDF small
    const img = new Image();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 80 * (img.height / img.width);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    _logoBase64 = canvas.toDataURL("image/png", 0.8);
    return _logoBase64;
  } catch {
    return null;
  }
}

export async function generateDeclarationPdfBlob(
  title: string,
  applicantName: string,
  company: string,
  fields: DeclarationField[],
  answers: Record<string, string>,
  signature: string,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 20;

  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Letterhead — logo + company details
  const logo = await getLogoBase64();
  if (logo) {
    pdf.addImage(logo, "PNG", margin, y - 5, 12, 12);
  }
  pdf.setFontSize(14);
  pdf.setTextColor(30);
  pdf.text("Odum Research Ltd", margin + (logo ? 15 : 0), y + 2);
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text("FCA Authorised · Ref 975797", margin + (logo ? 15 : 0), y + 7);
  pdf.text("9 Appold Street, London EC2A 2AP", margin + (logo ? 15 : 0), y + 11);

  // Right-aligned date
  pdf.setFontSize(9);
  pdf.text(date, pageW - margin, y + 2, { align: "right" });

  y += 18;

  // Divider line
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  // Title
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text(title.toUpperCase(), margin, y);
  y += 2;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Date: ${date}`, margin, y);
  y += 8;

  // Declarant
  pdf.setFontSize(11);
  pdf.setTextColor(0);
  pdf.text(`I, ${applicantName}, of ${company}, hereby declare the following:`, margin, y, { maxWidth: contentW });
  y += 12;

  // Fields
  for (const field of fields) {
    if (y > 260) {
      pdf.addPage();
      y = 25;
    }
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text(field.label, margin, y);
    y += 5;
    pdf.setFontSize(11);
    pdf.setTextColor(0);
    const answer = answers[field.id] || "Not provided";
    const lines = pdf.splitTextToSize(answer, contentW);
    pdf.text(lines, margin, y);
    y += lines.length * 5 + 4;
    pdf.setDrawColor(200);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
  }

  // Confirmation
  if (y > 240) {
    pdf.addPage();
    y = 25;
  }
  y += 4;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, y - 4, contentW, 14, "F");
  pdf.setFontSize(10);
  pdf.setTextColor(0);
  pdf.text(
    "I confirm that the information provided above is true and accurate to the best of my knowledge and belief.",
    margin + 4,
    y + 4,
    { maxWidth: contentW - 8 },
  );
  y += 20;

  // Signature block — three columns: Signature, Print Name, Date
  const colW = contentW / 3 - 4;
  const col1 = margin;
  const col2 = margin + colW + 6;
  const col3 = margin + (colW + 6) * 2;

  // Signature in italic, larger — looks like an actual signature
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text(signature, col1, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(applicantName, col2, y);
  pdf.text(date, col3, y);
  y += 4;

  // Lines under each
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.line(col1, y, col1 + colW, y);
  pdf.line(col2, y, col2 + colW, y);
  pdf.line(col3, y, col3 + colW, y);
  y += 5;

  // Labels below lines
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text("Signature", col1, y);
  pdf.text("Print Name", col2, y);
  pdf.text("Date", col3, y);

  y += 12;
  pdf.setFontSize(7);
  pdf.setTextColor(150);
  pdf.text(
    "Document generated electronically via Odum Research Ltd onboarding portal. Electronic signature accepted.",
    margin,
    y,
  );

  // Footer on all pages
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.setDrawColor(200);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageH - 15, pageW - margin, pageH - 15);
    pdf.setFontSize(7);
    pdf.setTextColor(150);
    pdf.text("Odum Research Ltd · FCA 975797 · www.odum-research.com", margin, pageH - 11);
    pdf.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 11, { align: "right" });
    pdf.text("Confidential", pageW / 2, pageH - 11, { align: "center" });
  }

  return pdf.output("blob");
}

export async function downloadDeclaration(
  title: string,
  applicantName: string,
  company: string,
  fields: DeclarationField[],
  answers: Record<string, string>,
  signature: string,
) {
  const blob = await generateDeclarationPdfBlob(title, applicantName, company, fields, answers, signature);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${company.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
