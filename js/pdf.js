/**
 * Client-side branded PDF report (jsPDF).
 * Financial-statement layout — line items, ruled sections, bold bottom line.
 * Loads jsPDF from CDN on first use (no build step).
 */

import { formatMoney } from './calculations.js';

const JSPDF_CDN = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';

const CAL_URL = 'https://cal.com/dexevel/15min';

let jsPdfLoader = null;

function loadJsPdf() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('jsPDF requires a browser'));
  }
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPdfLoader) return jsPdfLoader;

  jsPdfLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ilm-jspdf]');
    if (existing && window.jspdf?.jsPDF) {
      resolve(window.jspdf.jsPDF);
      return;
    }
    const script = document.createElement('script');
    script.src = JSPDF_CDN;
    script.async = true;
    script.dataset.ilmJspdf = '1';
    script.onload = () => {
      if (window.jspdf?.jsPDF) resolve(window.jspdf.jsPDF);
      else reject(new Error('jsPDF loaded but jsPDF export missing'));
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
    document.head.appendChild(script);
  });

  return jsPdfLoader;
}

/**
 * Build and download the branded PDF.
 * @param {object} report
 * @param {{ companyName?: string, contactName?: string, email?: string }} meta
 * @returns {Promise<{ filename: string }>}
 */
export async function downloadReportPdf(report, meta = {}) {
  const JsPDF = await loadJsPdf();
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const money = (n) => formatMoney(n, report.currency, report.locale);
  const company = (meta.companyName || '').trim() || 'Your business';
  const contact = (meta.contactName || '').trim();
  const industryLabel = report.industry?.name || report.industry?.shortName || 'Service business';
  const dateStr = new Date(report.generatedAt || Date.now()).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ensureSpace = (need = 40) => {
    if (y + need > pageH - 72) {
      doc.addPage();
      y = margin;
      drawFooter(doc, pageW, pageH, margin);
    }
  };

  // Header band
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageW, 72, 'F');
  doc.setTextColor(0, 202, 177);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('deXevel', margin, 32);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('Automation Opportunity Report', margin, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 190, 188);
  doc.text(`${industryLabel}  ·  ${dateStr}`, pageW - margin, 50, { align: 'right' });
  y = 96;

  // Company block
  doc.setTextColor(20, 24, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(company, margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 100, 98);
  const sub = [contact, meta.email].filter(Boolean).join('  ·  ');
  if (sub) {
    doc.text(sub, margin, y);
    y += 14;
  }
  y += 8;

  // Summary P&L strip
  ensureSpace(100);
  drawSectionRule(doc, margin, y, contentW, 'SUMMARY');
  y += 22;

  const s = report.summary || {};
  const leak = report.leak || {};
  const summaryRows = [
    ['Automation maturity', `${s.maturityScore ?? report.scoring?.maturityScore ?? '—'}/100 (${s.maturityBand || report.scoring?.bandLabel || ''})`],
    ['Estimated annual leakage', money(leak.totalAnnualLeak || 0)],
    ['Weekly bleed', money(leak.totalWeeklyLeak || Math.round((leak.totalAnnualLeak || 0) / 52))],
    ['Recoverable (90-day focus)', money(leak.recoverableAnnual || 0)],
    ['Hours / week potential', `${s.hoursSavedPotential ?? leak.hoursSavedPotential ?? '—'}h`],
  ];

  doc.setFontSize(10);
  for (const [label, value] of summaryRows) {
    ensureSpace(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 80, 78);
    doc.text(label, margin, y, { maxWidth: contentW * 0.5 });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 20, 18);
    doc.text(String(value), pageW - margin, y, { align: 'right', maxWidth: contentW * 0.46 });
    y += 16;
  }
  y += 10;

  // Anchors
  const anchors = report.narratives?.anchors || leak.anchors || [];
  if (anchors.length) {
    ensureSpace(48);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(40, 90, 80);
    for (const a of anchors.slice(0, 3)) {
      const line = typeof a.copy === 'function' ? a.copy(money) : a.copy || a.label;
      const lines = doc.splitTextToSize(`• ${line}`, contentW);
      ensureSpace(lines.length * 12 + 4);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 2;
    }
    y += 8;
  }

  // Leak line items
  ensureSpace(40);
  drawSectionRule(doc, margin, y, contentW, 'LEAKAGE STATEMENT');
  y += 20;

  const cats = leak.categories || [];
  const statX = margin + contentW * 0.5;
  const statW = contentW * 0.5 - 8;
  for (const cat of cats) {
    // Pre-measure the optional stat line so ensureSpace covers the whole row.
    const stat = cat.insights && cat.insights[0]?.stat;
    const statLines = stat ? doc.splitTextToSize(stat, statW) : [];
    const rowH = 22 + Math.max(12, statLines.length * 10 + 4);
    ensureSpace(rowH);
    doc.setDrawColor(220, 228, 224);
    doc.setLineWidth(0.4);
    doc.line(margin, y - 10, pageW - margin, y - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 36, 34);
    doc.text(cat.label || cat.id, margin, y, { maxWidth: contentW * 0.62 });
    doc.setFont('helvetica', 'bold');
    doc.text(money(cat.annual || 0), pageW - margin, y, { align: 'right' });
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 120, 118);
    doc.text(
      `${money(cat.weekly || Math.round((cat.annual || 0) / 52))}/week`,
      margin,
      y
    );
    if (statLines.length) {
      doc.setTextColor(70, 100, 92);
      doc.text(statLines, statX, y);
      y += statLines.length * 10 + 4;
    } else {
      y += 12;
    }
    y += 6;
  }

  // Bottom line
  ensureSpace(36);
  doc.setFillColor(245, 250, 248);
  doc.rect(margin, y - 4, contentW, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 14, 12);
  doc.text('RECOVERABLE (bottom line)', margin + 8, y + 14);
  doc.setTextColor(0, 140, 120);
  doc.text(money(leak.recoverableAnnual || 0), pageW - margin - 8, y + 14, { align: 'right' });
  y += 40;

  // Opportunities
  ensureSpace(40);
  drawSectionRule(doc, margin, y, contentW, 'TOP AUTOMATION OPPORTUNITIES');
  y += 20;
  const recs = (report.recommendations || []).slice(0, 7);
  const prioX = margin + contentW * 0.68;
  const valX = pageW - margin;
  for (const rec of recs) {
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 20, 18);
    const left = `#${rec.rank}  ${rec.name}`;
    doc.text(left, margin, y, { maxWidth: contentW * 0.56 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 90, 88);
    doc.text(String(rec.priority || '').replace('—', '-'), prioX, y, {
      maxWidth: contentW * 0.16,
    });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 120, 100);
    doc.text(money(rec.estimatedAnnualValue || 0), valX, y, { align: 'right' });
    y += 16;
  }
  y += 10;

  // Free fix (short)
  if (report.freeFix) {
    ensureSpace(60);
    drawSectionRule(doc, margin, y, contentW, 'YOUR FIRST FIX (FREE)');
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 20, 18);
    doc.text(report.freeFix.title, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 70, 68);
    const intro = doc.splitTextToSize(report.freeFix.intro || '', contentW);
    doc.text(intro, margin, y);
    y += intro.length * 11 + 6;
    for (const msg of (report.freeFix.messages || []).slice(0, 3)) {
      ensureSpace(36);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 120, 100);
      doc.text(`${msg.label} · ${msg.channel}`, margin, y);
      y += 11;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 48, 46);
      const body = doc.splitTextToSize(msg.body || '', contentW);
      doc.text(body, margin, y);
      y += body.length * 10 + 8;
    }
  }

  // Roadmap
  ensureSpace(40);
  drawSectionRule(doc, margin, y, contentW, '90-DAY ROADMAP');
  y += 18;
  const road = report.roadmap || {};
  const phases = [
    ['Days 0–30', road.days0to30],
    ['Days 31–60', road.days31to60],
    ['Days 61–90', road.days61to90],
  ];
  for (const [title, items] of phases) {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 140, 120);
    doc.text(title, margin, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 48, 46);
    if (!items || items.length === 0) {
      doc.text('— Measure & prepare', margin + 8, y);
      y += 12;
    } else {
      for (const item of items) {
        ensureSpace(14);
        doc.text(`• ${item.name}`, margin + 8, y);
        y += 12;
      }
    }
    y += 6;
  }

  // Closing CTA line
  ensureSpace(48);
  y += 8;
  doc.setDrawColor(0, 202, 177);
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 20, 18);
  doc.text('Pressure-test these numbers on a 20-minute call', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 120, 100);
  doc.text(CAL_URL, margin, y);

  drawFooter(doc, pageW, pageH, margin);

  const safeCompany = company.replace(/[^\w\-]+/g, '_').slice(0, 40);
  const filename = `deXevel_Automation_Report_${safeCompany}.pdf`;
  doc.save(filename);
  return { filename };
}

function drawSectionRule(doc, x, y, w, title) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 160, 140);
  doc.text(title, x, y);
  doc.setDrawColor(0, 202, 177);
  doc.setLineWidth(0.8);
  doc.line(x, y + 4, x + w, y + 4);
}

function drawFooter(doc, pageW, pageH, margin) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 138);
    doc.setFont('helvetica', 'normal');
    // Reserve the right ~90pt for the page number so the two never overlap.
    doc.text(
      'Generated free at dexevel.co — book a 20-minute call to pressure-test these numbers · cal.com/dexevel/15min',
      margin,
      pageH - 28,
      { maxWidth: pageW - margin * 2 - 90 }
    );
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 28, { align: 'right' });
  }
}

export { loadJsPdf, CAL_URL };
