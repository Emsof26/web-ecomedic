import { jsPDF } from "jspdf";
import type { ClinicalPatient, ClinicalReportData, Specialty, StudyStatus } from "./clinicalStorage";

interface PdfReportInput {
  patient: ClinicalPatient;
  specialty: Specialty;
  studyDate: string;
  doctor: string;
  status?: StudyStatus;
  data: ClinicalReportData;
}

const pageWidth = 210;
const margin = 16;
const contentWidth = pageWidth - margin * 2;
const navy = [19, 49, 92] as const;
const orange = [201, 75, 43] as const;
const text = [31, 41, 55] as const;
const secondary = [89, 116, 147] as const;
const border = [227, 231, 238] as const;
const muted = [248, 250, 252] as const;

function ensureSpace(doc: jsPDF, y: number, needed = 12) {
  if (y + needed > 276) {
    doc.addPage();
    return 20;
  }
  return y;
}

function addWrappedText(doc: jsPDF, value: string | undefined, x: number, y: number, width: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(value?.trim() || "—", width) as string[];
  let currentY = y;
  for (const line of lines) {
    currentY = ensureSpace(doc, currentY, lineHeight);
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function addSection(doc: jsPDF, title: string, y: number) {
  y = ensureSpace(doc, y, 22);
  doc.setFillColor(...navy);
  doc.roundedRect(margin, y - 5, contentWidth, 8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, margin + 4, y);
  doc.setTextColor(...text);
  return y + 10;
}

function addLabeledRow(doc: jsPDF, label: string, value: string, x: number, y: number, valueX: number) {
  doc.setFont("helvetica", "bold");
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.text(value || "—", valueX, y);
}

export function downloadUltrasoundReportPdf({ patient, specialty, studyDate, doctor, status, data }: PdfReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Cabecera a color para que el archivo descargado sea un informe PDF y no una impresión del navegador.
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 27, "F");
  doc.setFillColor(...orange);
  doc.rect(0, 27, pageWidth, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("EcoMedic", margin, 12);
  doc.setFontSize(10);
  doc.text("INFORME ECOGRÁFICO", margin, 21);

  let y = 40;
  doc.setFillColor(...muted);
  doc.setDrawColor(...border);
  doc.roundedRect(margin, y - 7, contentWidth, 38, 2, 2, "FD");
  doc.setTextColor(...text);
  doc.setFontSize(9.5);
  addLabeledRow(doc, "Paciente:", patient.name, margin + 5, y, 45);
  addLabeledRow(doc, "CI:", patient.carnet, 110, y, 125);
  y += 6;
  addLabeledRow(doc, "Sexo:", patient.sex, margin + 5, y, 45);
  addLabeledRow(doc, "Edad:", `${patient.age} años`, 110, y, 125);
  y += 6;
  addLabeledRow(doc, "Estudio:", specialty, margin + 5, y, 45);
  addLabeledRow(doc, "Fecha:", studyDate, 110, y, 125);
  y += 6;
  addLabeledRow(doc, "Profesional:", doctor, margin + 5, y, 45);
  if (status) addLabeledRow(doc, "Estado:", status, 110, y, 125);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  y = addSection(doc, "MOTIVO DE CONSULTA", y);
  y = addWrappedText(doc, data.clinicalReason, margin, y, contentWidth) + 6;

  y = addSection(doc, "HALLAZGOS ECOGRÁFICOS", y);
  y = addWrappedText(doc, data.findings, margin, y, contentWidth) + 6;

  if (data.measurements) {
    y = addSection(doc, "MEDICIONES RELEVANTES", y);
    y = addWrappedText(doc, data.measurements, margin, y, contentWidth) + 6;
  }

  if (data.parameters && Object.keys(data.parameters).length > 0) {
    y = addSection(doc, "PARÁMETROS DEL ESTUDIO", y);
    doc.setFontSize(9);
    for (const [label, value] of Object.entries(data.parameters)) {
      if (!value) continue;
      y = ensureSpace(doc, y, 8);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      const valueLines = doc.splitTextToSize(value, 130) as string[];
      doc.text(valueLines, margin + 45, y);
      y += Math.max(5, valueLines.length * 5);
    }
    y += 4;
  }

  y = addSection(doc, "OBSERVACIONES", y);
  y = addWrappedText(doc, data.observations, margin, y, contentWidth) + 6;

  y = addSection(doc, "CONCLUSIÓN DIAGNÓSTICA", y);
  y = addWrappedText(doc, data.conclusion, margin, y, contentWidth) + 6;

  y = addSection(doc, "SUGERENCIAS / RECOMENDACIONES", y);
  y = addWrappedText(doc, data.recommendations, margin, y, contentWidth) + 8;

  if (data.cancellationReason) {
    y = addSection(doc, "MOTIVO DE ANULACIÓN", y);
    y = addWrappedText(doc, data.cancellationReason, margin, y, contentWidth) + 6;
  }

  if (data.images?.length) {
    y = addSection(doc, "IMÁGENES ADJUNTAS DEL ESTUDIO", y);
    let imageY = y;
    for (const image of data.images) {
      if (imageY > 245) {
        doc.addPage();
        imageY = 20;
      }
      try {
        const format = image.type.includes("png") ? "PNG" : "JPEG";
        doc.addImage(image.dataUrl, format, margin, imageY, 78, 58, undefined, "FAST");
        doc.setFontSize(8);
        doc.setTextColor(...secondary);
        doc.text(image.name.slice(0, 50), margin, imageY + 63);
        imageY += 72;
      } catch {
        doc.setFontSize(8);
        doc.setTextColor(...secondary);
        doc.text(`Imagen no disponible: ${image.name}`, margin, imageY);
        imageY += 8;
      }
    }
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...border);
    doc.line(margin, 285, 194, 285);
    doc.setTextColor(...secondary);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("EcoMedic · Servicios de Ecografía", margin, 291);
    doc.text(`Página ${page} de ${pages}`, 166, 291);
  }

  const safeName = patient.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`EcoMedic-Informe-${safeName || "paciente"}-${studyDate}.pdf`);
}
