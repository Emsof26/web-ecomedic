import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import {
  clinicalStorage,
  type ClinicalPatient,
  type ClinicalReportData,
  type Specialty,
  type StudyImage,
  type StudyStatus,
} from "../../services/clinicalStorage";
import { downloadUltrasoundReportPdf } from "../../services/pdfService";

import "./NewUltrasoundReportPage.css";

type ParameterDefinition = {
  key: string;
  label: string;
  unit?: string;
  type?: "text" | "number" | "select";
  options?: string[];
};

const parameterDefinitions: Record<Specialty, ParameterDefinition[]> = {
  "Obstétrica": [
    { key: "dbp", label: "Diámetro Biparietal (DBP)", unit: "mm", type: "number" },
    { key: "lf", label: "Longitud de Fémur (LF)", unit: "mm", type: "number" },
    { key: "fcf", label: "Frecuencia Cardíaca Fetal (FCF)", unit: "lpm", type: "number" },
    { key: "gestationalWeeks", label: "Edad Gestacional", unit: "sem", type: "number" },
    { key: "gestationalDays", label: "Edad Gestacional", unit: "días", type: "number" },
    { key: "amnioticFluid", label: "Líquido Amniótico", type: "select", options: ["Normal", "Disminuido", "Aumentado"] },
    { key: "placenta", label: "Placenta", type: "select", options: ["Anterior", "Posterior", "Fúndica", "Lateral", "Previa"] },
    { key: "fetalPresentation", label: "Presentación fetal", type: "select", options: ["Cefálica", "Podálica", "Transversa", "No definida"] },
  ],
  Abdominal: [
    { key: "liver", label: "Hígado", type: "text" },
    { key: "gallbladder", label: "Vesícula biliar", type: "text" },
    { key: "pancreas", label: "Páncreas", type: "text" },
    { key: "spleen", label: "Bazo", type: "text" },
    { key: "rightKidney", label: "Riñón derecho", unit: "mm", type: "text" },
    { key: "leftKidney", label: "Riñón izquierdo", unit: "mm", type: "text" },
  ],
  Renal: [
    { key: "rightKidneyLength", label: "Riñón derecho — longitud", unit: "mm", type: "number" },
    { key: "leftKidneyLength", label: "Riñón izquierdo — longitud", unit: "mm", type: "number" },
    { key: "rightCortex", label: "Cortical derecho", unit: "mm", type: "number" },
    { key: "leftCortex", label: "Cortical izquierdo", unit: "mm", type: "number" },
    { key: "renalPelvis", label: "Pelvis renal", type: "text" },
    { key: "bladder", label: "Vejiga", type: "text" },
  ],
  Mamaria: [
    { key: "laterality", label: "Lateralidad", type: "select", options: ["Derecha", "Izquierda", "Bilateral"] },
    { key: "parenchyma", label: "Parénquima mamario", type: "text" },
    { key: "lesion", label: "Lesión / nódulo", type: "text" },
    { key: "lesionSize", label: "Dimensiones de lesión", unit: "mm", type: "text" },
    { key: "axillaryNodes", label: "Ganglios axilares", type: "text" },
    { key: "birads", label: "BI-RADS", type: "select", options: ["0", "1", "2", "3", "4", "5", "6"] },
  ],
  "Partes blandas": [
    { key: "region", label: "Región estudiada", type: "text" },
    { key: "lesionType", label: "Tipo de lesión", type: "text" },
    { key: "dimensions", label: "Dimensiones", unit: "mm", type: "text" },
    { key: "echogenicity", label: "Ecogenicidad", type: "text" },
    { key: "vascularity", label: "Vascularización", type: "text" },
    { key: "relation", label: "Relación con estructuras vecinas", type: "text" },
  ],
};

const statusDefinitions: Array<{ value: StudyStatus; label: string; description: string; icon: "draft" | "finished" | "signed" | "cancelled" }> = [
  { value: "Borrador", label: "Borrador", description: "En edición", icon: "draft" },
  { value: "Finalizado", label: "Finalizado", description: "Estudio terminado", icon: "finished" },
  { value: "Firmado", label: "Firmado", description: "Informe validado", icon: "signed" },
  { value: "Anulado", label: "Anulado", description: "Informe cancelado", icon: "cancelled" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "upload") return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></svg>;
  if (name === "trash") return <svg {...common}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="m9 7 1-3h4l1 3" /><path d="M6 7l1 13h10l1-13" /></svg>;
  if (name === "pencil") return <svg {...common}><path d="m4 20 4.2-1 10.1-10.1a2.2 2.2 0 0 0-3.1-3.1L5.1 15.9 4 20Z" /><path d="m13.8 7.2 3 3" /></svg>;
  if (name === "document-plus") return <svg {...common}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M12 12v6M9 15h6" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 19 6v5c0 4.5-2.7 8-7 10-4.3-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "ban") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m6 6 12 12" /></svg>;
  if (name === "save") return <svg {...common}><path d="M5 4h12l2 2v14H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></svg>;
  if (name === "file-pdf") return <svg {...common}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M8 15h2a1.5 1.5 0 0 0 0-3H8v5M12 17v-5h2a2.5 2.5 0 0 1 0 5h-2M17 12h-3v5" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === "arrow-left") return <svg {...common}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
}

function formatStudyDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

async function fileToImage(file: File): Promise<StudyImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 1400;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve({ name: file.name, type: "image/jpeg", dataUrl: canvas.toDataURL("image/jpeg", 0.78) });
    };
    image.onerror = () => resolve({ name: file.name, type: file.type, dataUrl });
    image.src = dataUrl;
  });
}

function NewUltrasoundReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = authRepository.getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patients] = useState<ClinicalPatient[]>(() => clinicalStorage.getPatients());
  const [patientId, setPatientId] = useState(() => searchParams.get("patientId") ?? "");
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const [clinicalReason, setClinicalReason] = useState("");
  const [findings, setFindings] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [observations, setObservations] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [studyDate, setStudyDate] = useState(new Date().toISOString().slice(0, 10));
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [images, setImages] = useState<StudyImage[]>([]);
  const [studyId, setStudyId] = useState("");
  const [status, setStatus] = useState<StudyStatus>("Borrador");
  const [cancellationReason, setCancellationReason] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const patient = patients.find((item) => item.id === patientId);

  useEffect(() => {
    const requestedPatient = searchParams.get("patientId");
    if (requestedPatient && patients.some((item) => item.id === requestedPatient)) setPatientId(requestedPatient);
  }, [patients, searchParams]);

  const availableSpecialties = useMemo(() => {
    if (!patient) return [];
    const specialties: Specialty[] = ["Obstétrica", "Abdominal", "Renal", "Mamaria", "Partes blandas"];
    return specialties.filter((item) => {
      if (item === "Obstétrica") return patient.sex === "Femenino" && patient.age >= 10;
      if (item === "Mamaria") return patient.sex === "Femenino" && patient.age >= 8;
      return true;
    });
  }, [patient]);

  const handlePatientChange = (value: string) => {
    setPatientId(value);
    setSpecialty("");
    setParameters({});
    setSavedMessage("");
    setErrorMessage("");
  };

  const handleSpecialtyChange = (value: Specialty | "") => {
    setSpecialty(value);
    setParameters({});
    setSavedMessage("");
    setErrorMessage("");
  };

  const validateBase = () => {
    if (!patient) return "Selecciona un paciente.";
    if (!specialty) return "Selecciona el tipo de ecografía.";
    if (!studyDate) return "Selecciona la fecha del estudio.";
    return "";
  };

  const validateComplete = () => {
    const base = validateBase();
    if (base) return base;
    if (!findings.trim()) return "Completa la descripción de hallazgos.";
    if (!conclusion.trim()) return "Completa la conclusión diagnóstica.";
    return "";
  };

  const getReportData = (): ClinicalReportData => ({
    clinicalReason: clinicalReason.trim(),
    findings: findings.trim(),
    measurements: measurements.trim(),
    observations: observations.trim(),
    conclusion: conclusion.trim(),
    recommendations: recommendations.trim(),
    cancellationReason: cancellationReason.trim(),
    parameters,
    images,
  });

  const persistStudy = (nextStatus: StudyStatus, requireComplete = true) => {
    const validation = requireComplete ? validateComplete() : validateBase();
    if (validation) {
      setErrorMessage(validation);
      setSavedMessage("");
      return false;
    }
    if (nextStatus === "Anulado" && !cancellationReason.trim()) {
      setErrorMessage("La justificación de anulación es obligatoria.");
      setSavedMessage("");
      return false;
    }

    const id = studyId || crypto.randomUUID();
    clinicalStorage.upsertStudy({
      id,
      patientId: patient!.id,
      patientName: patient!.name,
      specialty: specialty!,
      doctor: user?.name ?? "Profesional de salud",
      date: formatStudyDate(studyDate),
      status: nextStatus,
      conclusion: conclusion.trim(),
      reportData: getReportData(),
    });
    setStudyId(id);
    setStatus(nextStatus);
    setErrorMessage("");
    setSavedMessage(nextStatus === "Borrador" ? "Informe guardado como borrador correctamente." : nextStatus === "Firmado" ? "Informe firmado correctamente." : nextStatus === "Finalizado" ? "Informe marcado como finalizado." : "Informe anulado correctamente.");
    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    persistStudy("Borrador", false);
  };

  const handleFinalizeAndSign = () => {
    if (persistStudy("Firmado", true)) {
      window.setTimeout(() => navigate(patient ? `/pacientes/${patient.id}` : "/pacientes"), 700);
    }
  };

  const handleStatusSelect = (nextStatus: StudyStatus) => {
    if (nextStatus === "Borrador") persistStudy("Borrador", false);
    else if (nextStatus === "Anulado") {
      setStatus(nextStatus);
      setSavedMessage("");
      setErrorMessage(cancellationReason.trim() ? "" : "Completa la justificación para poder anular el informe.");
    } else persistStudy(nextStatus, true);
  };

  const processImages = async (files: File[]) => {
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!validFiles.length) {
      setErrorMessage("Selecciona archivos de imagen válidos.");
      return;
    }
    if (images.length + validFiles.length > 5) {
      setErrorMessage("Puedes adjuntar como máximo 5 imágenes por informe.");
      return;
    }
    setIsProcessing(true);
    setErrorMessage("");
    try {
      const prepared = await Promise.all(validFiles.map(fileToImage));
      setImages((current) => [...current, ...prepared]);
    } catch {
      setErrorMessage("No se pudo cargar una de las imágenes seleccionadas.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await processImages(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await processImages(Array.from(event.dataTransfer.files));
  };

  const removeImage = (index: number) => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index));

  const handleDownloadPdf = () => {
    const validation = validateComplete();
    if (validation) {
      setErrorMessage(`${validation} Puedes descargar el PDF después de completar los campos obligatorios.`);
      return;
    }
    downloadUltrasoundReportPdf({
      patient: patient!,
      specialty: specialty!,
      studyDate: formatStudyDate(studyDate),
      doctor: user?.name ?? "Profesional de salud",
      data: getReportData(),
    });
    setSavedMessage("PDF descargado correctamente en tu carpeta de descargas.");
    setErrorMessage("");
  };

  const handleCancel = () => navigate(patient ? `/pacientes/${patient.id}` : "/");
  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  if (user?.role === "RECEPCIONISTA") return <div className="report-page"><Navbar user={user} onLogout={handleLogout} /><main className="report-page__content"><section className="report-empty-state"><span className="report-empty-state__icon"><Icon name="ban" /></span><h1>Acceso restringido</h1><p>Tu perfil de Recepcionista tiene permisos de solo lectura y no puede crear informes ecográficos.</p><button type="button" onClick={() => navigate("/pacientes")}>Volver a pacientes</button></section></main></div>;

  return <div className="report-page">
    <Navbar user={user} onLogout={handleLogout} />
    <main className="report-page__content">
      <header className="report-page__header">
        <div><h1>Nuevo Informe Ecográfico</h1><p>Registra los datos del estudio, hallazgos y conclusión diagnóstica.</p></div>
        <button className="report-page__back" type="button" onClick={handleCancel}><Icon name="arrow-left" size={16} /> Volver</button>
      </header>

      <form className="report-form" onSubmit={handleSubmit}>
        <section className="report-card">
          <div className="report-card__heading"><div><span className="report-card__number">01</span><div><h2>Paciente y estudio</h2><p>Selecciona el paciente y el tipo de ecografía.</p></div></div></div>
          <div className="report-form__grid">
            <label className="report-field report-field--wide"><span>Paciente <b>*</b></span><select value={patientId} onChange={(event) => handlePatientChange(event.target.value)} required><option value="">Selecciona un paciente</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.name} · CI {item.carnet}</option>)}</select></label>
            <div className="patient-summary"><span className="patient-summary__avatar">{patient ? patient.name.split(" ").slice(0, 2).map((item) => item[0]).join("") : "—"}</span><div><strong>{patient?.name ?? "Paciente no seleccionado"}</strong><small>{patient ? `CI ${patient.carnet} · ${patient.sex} · ${patient.age} años` : "Selecciona un paciente para continuar"}</small></div></div>
            <label className="report-field"><span>Tipo de ecografía <b>*</b></span><select value={specialty} onChange={(event) => handleSpecialtyChange(event.target.value as Specialty)} disabled={!patient} required><option value="">Selecciona una especialidad</option>{availableSpecialties.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="report-field"><span>Fecha del estudio <b>*</b></span><input type="date" value={studyDate} onChange={(event) => setStudyDate(event.target.value)} required /></label>
            <label className="report-field report-field--wide"><span>Motivo de consulta</span><input value={clinicalReason} onChange={(event) => setClinicalReason(event.target.value)} placeholder="Ej. Dolor abdominal, control, seguimiento..." /></label>
          </div>
          {patient && <p className="report-note">Las especialidades se filtran automáticamente según el sexo y la edad del paciente.</p>}
        </section>

        <section className="report-card">
          <div className="report-card__heading"><div><span className="report-card__number">02</span><div><h2>Hallazgos ecográficos</h2><p>Describe de forma clara los resultados observados durante el estudio.</p></div></div></div>
          <label className="report-field report-field--full"><span>Descripción de hallazgos <b>*</b></span><textarea value={findings} onChange={(event) => setFindings(event.target.value)} placeholder="Escribe los hallazgos del estudio ecográfico..." rows={7} required /></label>
          <div className="report-form__grid report-form__grid--compact"><label className="report-field"><span>Mediciones relevantes</span><textarea value={measurements} onChange={(event) => setMeasurements(event.target.value)} placeholder="Órgano, medida, volumen, localización..." rows={4} /></label><label className="report-field"><span>Observaciones</span><textarea value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Información complementaria del estudio..." rows={4} /></label></div>
          {specialty && <div className="specialty-parameters"><div className="specialty-parameters__title"><strong>Parámetros de {specialty}</strong><span>Completa los datos disponibles del estudio.</span></div><div className="report-form__grid">{parameterDefinitions[specialty].map((parameter) => <label className="report-field" key={parameter.key}><span>{parameter.label}{parameter.unit ? ` (${parameter.unit})` : ""}</span>{parameter.type === "select" ? <select value={parameters[parameter.key] ?? ""} onChange={(event) => setParameters((current) => ({ ...current, [parameter.key]: event.target.value }))}><option value="">Seleccionar...</option>{parameter.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input type={parameter.type === "number" ? "number" : "text"} step={parameter.type === "number" ? "0.1" : undefined} value={parameters[parameter.key] ?? ""} onChange={(event) => setParameters((current) => ({ ...current, [parameter.key]: event.target.value }))} placeholder={parameter.unit ? `0.0 ${parameter.unit}` : "Escribir..."} />}</label>)}</div></div>}
        </section>

        <section className="report-card">
          <div className="report-card__heading"><div><span className="report-card__number">03</span><div><h2>Conclusión diagnóstica y observaciones</h2><p>Resume los resultados y registra las recomendaciones para el paciente.</p></div></div></div>
          <div className="report-form__grid"><label className="report-field"><span>Conclusión / Diagnóstico ecográfico <b>*</b></span><textarea value={conclusion} onChange={(event) => setConclusion(event.target.value)} placeholder="Describe los hallazgos y la impresión diagnóstica..." rows={5} required /></label><label className="report-field"><span>Sugerencias / Recomendaciones</span><textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder="Controles sugeridos, exámenes complementarios..." rows={5} /></label></div>
        </section>

        <section className="report-card report-images">
          <div className="report-card__heading"><div><span className="report-card__number">04</span><div><h2>Imágenes Adjuntas del Estudio</h2><p>Agrega las imágenes obtenidas directamente del ecógrafo.</p></div></div></div>
          <div className={`image-upload${isDragging ? " image-upload--dragging" : ""}`}>
            <div className="image-upload__dropzone" onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
              <span className="image-upload__icon"><Icon name="upload" size={22} /></span>
              <strong>Arrastra imágenes del ecógrafo aquí</strong>
              <small>PNG, JPG, JPEG o WEBP · máximo 5 imágenes</small>
            </div>
            <input ref={fileInputRef} id="report-image-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={handleImageChange} />
            <button type="button" className="image-upload__button" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}><Icon name="upload" size={15} /> {isProcessing ? "Procesando..." : "Subir archivo"}</button>
          </div>
          {images.length > 0 && <div className="image-preview-grid">{images.map((image, index) => <article className="image-preview" key={`${image.name}-${index}`}><img src={image.dataUrl} alt={`Imagen adjunta ${index + 1}`} /><button type="button" aria-label={`Eliminar ${image.name}`} onClick={() => removeImage(index)}><Icon name="trash" size={15} /></button><span title={image.name}>{image.name}</span></article>)}</div>}
        </section>

        <section className="report-card report-status-card">
          <div className="report-card__heading"><div><span className="report-card__number">05</span><div><h2>Estado del informe</h2><p>Selecciona el estado correspondiente al avance del informe.</p></div></div></div>
          <div className="status-options">{statusDefinitions.map((item) => <button key={item.value} type="button" className={`status-option status-option--${item.value.toLowerCase()}${status === item.value ? " status-option--selected" : ""}`} onClick={() => handleStatusSelect(item.value)}><span className="status-option__icon"><Icon name={item.icon === "draft" ? "pencil" : item.icon === "finished" ? "document-plus" : item.icon === "signed" ? "shield" : "ban"} size={19} /></span><span><strong>{item.label}</strong><small>{item.description}</small></span></button>)}</div>
          <div className="cancellation-area"><label className="report-field"><span>Justificación de anulación <small>(obligatoria para anular)</small></span><textarea value={cancellationReason} onChange={(event) => { setCancellationReason(event.target.value); if (event.target.value.trim()) setErrorMessage(""); }} placeholder="Motivo de anulación..." rows={3} /></label><button type="button" className="cancel-report-button" onClick={() => persistStudy("Anulado", false)}><Icon name="ban" size={17} /> Anular informe</button></div>
        </section>

        {errorMessage && <p className="report-alert" role="alert">{errorMessage}</p>}
        {savedMessage && <p className="report-success" role="status"><Icon name="check" size={15} /> {savedMessage}</p>}

        <footer className="report-form__actions">
          <button className="report-button report-button--secondary" type="button" onClick={handleCancel}>Cancelar</button>
          <button className="report-button report-button--draft" type="submit"><Icon name="save" size={16} /> Guardar borrador</button>
          <button className="report-button report-button--primary" type="button" onClick={handleFinalizeAndSign}><Icon name="shield" size={16} /> Finalizar y firmar</button>
          <button className="report-button report-button--pdf" type="button" onClick={handleDownloadPdf}><Icon name="file-pdf" size={16} /> Exportar a PDF</button>
        </footer>
      </form>
    </main>
  </div>;
}

export default NewUltrasoundReportPage;
