import { jsPDF } from "jspdf";
import type { ClinicalPatient, ClinicalReportData, Specialty } from "./clinicalStorage";

interface PdfReportInput {
  patient: ClinicalPatient;
  specialty: Specialty;
  studyDate: string;
  doctor: string;
  data: ClinicalReportData;
}

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN = 15;
const NAVY = [19, 49, 92] as const;
const BLUE = [39, 129, 167] as const;
const ORANGE = [232, 126, 57] as const;
const TEXT = [36, 48, 63] as const;
const MUTED = [100, 116, 139] as const;
const PALE = [242, 247, 250] as const;
const BORDER = [218, 228, 235] as const;

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "/logo/logo-eco.png";
  });
}

function addLogo(doc: jsPDF, logo: HTMLImageElement | null, x: number, y: number, maxW: number, maxH: number) {
  if (!logo) return;
  const ratio = Math.min(maxW / logo.naturalWidth, maxH / logo.naturalHeight);
  const width = logo.naturalWidth * ratio;
  const height = logo.naturalHeight * ratio;
  doc.addImage(logo, "PNG", x + (maxW - width) / 2, y + (maxH - height) / 2, width, height, undefined, "FAST");
}

function addSection(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...PALE);
  doc.roundedRect(MARGIN, y, A4_WIDTH - MARGIN * 2, 8, 1.5, 1.5, "F");
  doc.setFillColor(...BLUE);
  doc.roundedRect(MARGIN, y, 2, 8, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(title.toLocaleUpperCase("es"), MARGIN + 5, y + 5.3);
  return y + 13;
}

function addField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  const lines = doc.splitTextToSize(value?.trim() || "No especificado", width) as string[];
  doc.text(lines.slice(0, 2), x, y + 5);
}

function addParagraph(doc: jsPDF, value: string | undefined, y: number): number {
  const contentWidth = A4_WIDTH - MARGIN * 2 - 4;
  const lines = doc.splitTextToSize(value?.trim() || "Sin información registrada.", contentWidth) as string[];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  const safeLines = lines.slice(0, Math.max(1, Math.floor((A4_HEIGHT - 48 - y) / 4.6)));
  doc.text(safeLines, MARGIN + 2, y);
  return y + safeLines.length * 4.6 + 4;
}

function addFooter(doc: jsPDF, page: number, width: number, height: number) {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, height - 10, width - MARGIN, height - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("EcoMedic · Informe ecográfico", MARGIN, height - 5);
  doc.text(`Página ${page} de 2`, width - MARGIN, height - 5, { align: "right" });
}

export async function downloadUltrasoundReportPdf({ patient, specialty, studyDate, doctor, data }: PdfReportInput): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const logo = await loadLogo();

  // Página 1: informe clínico
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, A4_WIDTH, 5, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 5, A4_WIDTH * 0.72, 1.5, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(A4_WIDTH * 0.72, 5, A4_WIDTH * 0.28, 1.5, "F");

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("INFORME ECOGRÁFICO", MARGIN, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BLUE);
  doc.text(specialty, MARGIN, 27);
  addLogo(doc, logo, 145, 10, 50, 22);

  let y = 39;
  y = addSection(doc, "Datos del paciente", y);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(MARGIN, y - 4, A4_WIDTH - MARGIN * 2, 29, 2, 2, "S");
  addField(doc, "Nombre completo", patient.name, MARGIN + 4, y + 2, 76);
  addField(doc, "Carnet de identidad", patient.carnet, 111, y + 2, 65);
  addField(doc, "Sexo", patient.sex, MARGIN + 4, y + 14, 76);
  addField(doc, "Edad", `${patient.age} años`, 111, y + 14, 65);
  y += 32;

  y = addSection(doc, "Datos del estudio", y);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(MARGIN, y - 4, A4_WIDTH - MARGIN * 2, 23, 2, 2, "S");
  addField(doc, "Especialidad", specialty, MARGIN + 4, y + 2, 76);
  addField(doc, "Fecha del estudio", studyDate, 111, y + 2, 65);
  addField(doc, "Médico responsable", doctor || "No especificado", MARGIN + 4, y + 14, 155);
  y += 27;

  y = addSection(doc, "Motivo clínico", y);
  y = addParagraph(doc, data.clinicalReason, y);

  y = addSection(doc, "Hallazgos ecográficos", y);
  y = addParagraph(doc, data.findings, y);

  if (data.measurements?.trim()) {
    y = addSection(doc, "Mediciones", y);
    y = addParagraph(doc, data.measurements, y);
  }

  if (data.parameters && Object.values(data.parameters).some((value) => value?.trim())) {
    y = addSection(doc, "Parámetros", y);
    const parameters = Object.entries(data.parameters).filter(([, value]) => value?.trim());
    for (const [label, value] of parameters) {
      if (y > 244) break;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...NAVY);
      doc.text(`${label}:`, MARGIN + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT);
      const lines = doc.splitTextToSize(value, A4_WIDTH - MARGIN * 2 - 53) as string[];
      doc.text(lines.slice(0, 2), MARGIN + 42, y);
      y += Math.max(5, Math.min(lines.length, 2) * 4.2);
    }
    y += 2;
  }

  if (y < 258) {
    y = addSection(doc, "Conclusión", y);
    y = addParagraph(doc, data.conclusion, y);
  }

  if (y < 268) {
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, 271, 85, 271);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Médico responsable", MARGIN, 276);
    doc.text("Documento generado por el prototipo EcoMedic", A4_WIDTH - MARGIN, 276, { align: "right" });
  }

  addFooter(doc, 1, A4_WIDTH, A4_HEIGHT);

  // Página 2: imagen en orientación horizontal para aprovechar mejor el espacio.
  doc.addPage("a4", "landscape");
  const pageWidth = 297;
  const pageHeight = 210;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 5, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 5, pageWidth * 0.72, 1.5, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(pageWidth * 0.72, 5, pageWidth * 0.28, 1.5, "F");
  addLogo(doc, logo, pageWidth - MARGIN - 43, 9, 43, 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(`IMAGEN ECOGRÁFICA · ${specialty.toLocaleUpperCase("es")}`, MARGIN, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${patient.name}  |  CI: ${patient.carnet}  |  Fecha: ${studyDate}`, MARGIN, 23);

  const imageX = MARGIN;
  const imageY = 29;
  const imageW = pageWidth - MARGIN * 2;
  const imageH = pageHeight - imageY - 15;
  const image = data.images?.[0];

  if (image?.dataUrl) {
    try {
      const format = image.type.toLowerCase().includes("png") ? "PNG" : "JPEG";
      const props = doc.getImageProperties(image.dataUrl);
      const scale = Math.min(imageW / props.width, imageH / props.height);
      const drawW = props.width * scale;
      const drawH = props.height * scale;
      doc.setFillColor(8, 12, 18);
      doc.rect(imageX, imageY, imageW, imageH, "F");
      doc.addImage(image.dataUrl, format, imageX + (imageW - drawW) / 2, imageY + (imageH - drawH) / 2, drawW, drawH, undefined, "FAST");
    } catch {
      doc.setDrawColor(...BORDER);
      doc.roundedRect(imageX, imageY, imageW, imageH, 2, 2, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...MUTED);
      doc.text("La imagen ecográfica no está disponible en este prototipo.", pageWidth / 2, imageY + imageH / 2, { align: "center" });
    }
  } else {
    doc.setDrawColor(...BORDER);
    doc.setFillColor(...PALE);
    doc.roundedRect(imageX, imageY, imageW, imageH, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text("IMAGEN ECOGRÁFICA", pageWidth / 2, imageY + imageH / 2 - 4, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("Imagen no disponible en este prototipo", pageWidth / 2, imageY + imageH / 2 + 4, { align: "center" });
  }

  addFooter(doc, 2, pageWidth, pageHeight);

  const safeName = patient.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").trim().replace(/\s+/g, "-");
  const safeDate = studyDate.replace(/[^a-zA-Z0-9-]/g, "-");
  doc.save(`EcoMedic-Ecografia-${safeName || "paciente"}-${safeDate}.pdf`);
}
