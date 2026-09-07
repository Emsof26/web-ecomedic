import { jsPDF } from "jspdf";
import type { ClinicalPatient, ClinicalReportData, Specialty } from "./clinicalStorage";

interface PdfReportInput {
  patient: ClinicalPatient;
  specialty: Specialty;
  studyDate: string;
  doctor: string;
  data: ClinicalReportData;
}

const margin = 16;

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(text || "—", width) as string[];
  let currentY = y;
  for (const line of lines) {
    if (currentY > 276) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function addSection(doc: jsPDF, title: string, y: number) {
  if (y > 265) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(19, 49, 92);
  doc.roundedRect(margin, y - 5, 178, 8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, margin + 4, y);
  doc.setTextColor(31, 41, 55);
  return y + 10;
}

export function downloadUltrasoundReportPdf({ patient, specialty, studyDate, doctor, data }: PdfReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFillColor(19, 49, 92);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("EcoMedic", margin, 13);
  doc.setFontSize(11);
  doc.text("INFORME ECOGRÁFICO", margin, 22);

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 42;
  doc.text(`Paciente: ${patient.name}`, margin, y);
  doc.text(`CI: ${patient.carnet}`, 110, y);
  y += 6;
  doc.text(`Sexo: ${patient.sex}`, margin, y);
  doc.text(`Edad: ${patient.age} años`, 110, y);
  y += 6;
  doc.text(`Estudio: ${specialty}`, margin, y);
  doc.text(`Fecha: ${studyDate}`, 110, y);
  y += 6;
  doc.text(`Profesional: ${doctor}`, margin, y);

  y += 12;
  y = addSection(doc, "MOTIVO DE CONSULTA", y);
  y = addWrappedText(doc, data.clinicalReason || "No registrado", margin, y, 178) + 6;

  y = addSection(doc, "HALLAZGOS ECOGRÁFICOS", y);
  y = addWrappedText(doc, data.findings || "No registrado", margin, y, 178) + 6;

  if (data.measurements) {
    y = addSection(doc, "MEDICIONES RELEVANTES", y);
    y = addWrappedText(doc, data.measurements, margin, y, 178) + 6;
  }

  if (data.parameters && Object.keys(data.parameters).length > 0) {
    y = addSection(doc, "PARÁMETROS DEL ESTUDIO", y);
    doc.setFontSize(9);
    for (const [label, value] of Object.entries(data.parameters)) {
      if (!value) continue;
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
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
  y = addWrappedText(doc, data.observations || "No registrado", margin, y, 178) + 6;

  y = addSection(doc, "CONCLUSIÓN DIAGNÓSTICA", y);
  y = addWrappedText(doc, data.conclusion || "No registrada", margin, y, 178) + 6;

  y = addSection(doc, "SUGERENCIAS / RECOMENDACIONES", y);
  y = addWrappedText(doc, data.recommendations || "No registradas", margin, y, 178) + 8;

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
        doc.text(image.name.slice(0, 50), margin, imageY + 63);
        imageY += 72;
      } catch {
        doc.setFontSize(8);
        doc.text(`Imagen no disponible: ${image.name}`, margin, imageY);
        imageY += 8;
      }
    }
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(216, 225, 235);
    doc.line(margin, 285, 194, 285);
    doc.setTextColor(89, 116, 147);
    doc.setFontSize(8);
    doc.text("EcoMedic · Informe ecográfico", margin, 291);
    doc.text(`Página ${page} de ${pages}`, 166, 291);
  }

  const safeName = patient.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`EcoMedic-Informe-${safeName || "paciente"}-${studyDate}.pdf`);
}
