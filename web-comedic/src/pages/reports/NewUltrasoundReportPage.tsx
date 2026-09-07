import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import {
  clinicalStorage,
  type ClinicalPatient,
  type ClinicalReportData,
  type Specialty,
  type StudyImage,
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

function formatStudyDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(".", "");
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
      resolve({
        name: file.name,
        type: "image/jpeg",
        dataUrl: canvas.toDataURL("image/jpeg", 0.78),
      });
    };
    image.onerror = () => resolve({ name: file.name, type: file.type, dataUrl });
    image.src = dataUrl;
  });
}

function NewUltrasoundReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = authRepository.getCurrentUser();
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
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleParameterChange = (key: string, value: string) => {
    setParameters((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (!patient) return "Selecciona un paciente.";
    if (!specialty) return "Selecciona el tipo de ecografía.";
    if (!studyDate) return "Selecciona la fecha del estudio.";
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
    parameters,
    images,
  });

  const saveStudy = (status: "Borrador" | "Firmado") => {
    const validation = validate();
    if (validation) {
      setErrorMessage(validation);
      setSavedMessage("");
      return false;
    }

    const id = studyId || crypto.randomUUID();
    const reportData = getReportData();
    clinicalStorage.upsertStudy({
      id,
      patientId: patient!.id,
      patientName: patient!.name,
      specialty: specialty!,
      doctor: user?.name ?? "Profesional de salud",
      date: formatStudyDate(studyDate),
      status,
      conclusion: conclusion.trim(),
      reportData,
    });
    setStudyId(id);
    setErrorMessage("");
    setSavedMessage(status === "Borrador" ? "Informe guardado como borrador correctamente." : "Informe finalizado y firmado correctamente.");
    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveStudy("Borrador");
  };

  const handleFinalize = () => {
    if (saveStudy("Firmado")) {
      window.setTimeout(() => navigate(patient ? `/pacientes/${patient.id}` : "/pacientes"), 700);
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    if (images.length + files.length > 5) {
      setErrorMessage("Puedes adjuntar como máximo 5 imágenes por informe.");
      event.target.value = "";
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    try {
      const prepared = await Promise.all(files.map(fileToImage));
      setImages((current) => [...current, ...prepared]);
    } catch {
      setErrorMessage("No se pudo cargar una de las imágenes seleccionadas.");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const removeImage = (name: string, index: number) => {
    setImages((current) => current.filter((image, imageIndex) => image.name !== name || imageIndex !== index));
  };

  const handleDownloadPdf = () => {
    const validation = validate();
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
    setErrorMessage("");
    setSavedMessage("PDF descargado correctamente en tu carpeta de descargas.");
  };

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  if (user?.role === "RECEPCIONISTA") return (
    <div className="report-page">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="report-page__content">
        <section className="report-empty-state">
          <span className="report-empty-state__icon">⌁</span>
          <h1>Acceso restringido</h1>
          <p>Tu perfil de Recepcionista tiene permisos de solo lectura y no puede crear informes ecográficos.</p>
          <button type="button" onClick={() => navigate("/pacientes")}>Volver a pacientes</button>
        </section>
      </main>
    </div>
  );

  return (
    <div className="report-page">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="report-page__content">
        <header className="report-page__header">
          <div>
            <h1>Nuevo Informe Ecográfico</h1>
            <p>Registra los datos del estudio, hallazgos y conclusión diagnóstica.</p>
          </div>
          <button className="report-page__back" type="button" onClick={() => navigate(patient ? `/pacientes/${patient.id}` : "/")}>← Volver</button>
        </header>

        <form className="report-form" onSubmit={handleSubmit}>
          <section className="report-card">
            <div className="report-card__heading">
              <div><span className="report-card__number">01</span><div><h2>Paciente y estudio</h2><p>Selecciona el paciente, tipo de ecografía y fecha.</p></div></div>
            </div>
            <div className="report-form__grid">
              <label className="report-field report-field--wide"><span>Paciente <b>*</b></span><select value={patientId} onChange={(event) => handlePatientChange(event.target.value)} required><option value="">Selecciona un paciente</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.name} · CI {item.carnet}</option>)}</select></label>
              <div className="patient-summary"><span className="patient-summary__avatar">{patient ? patient.name.split(" ").slice(0, 2).map((item) => item[0]).join("") : "—"}</span><div><strong>{patient?.name ?? "Paciente no seleccionado"}</strong><small>{patient ? `CI ${patient.carnet} · ${patient.sex} · ${patient.age} años` : "Selecciona un paciente para continuar"}</small></div></div>
              <label className="report-field"><span>Tipo de ecografía <b>*</b></span><select value={specialty} onChange={(event) => handleSpecialtyChange(event.target.value as Specialty | "")} disabled={!patient} required><option value="">Selecciona una especialidad</option>{availableSpecialties.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="report-field"><span>Fecha del estudio <b>*</b></span><input type="date" value={studyDate} onChange={(event) => setStudyDate(event.target.value)} required /></label>
              <label className="report-field report-field--wide"><span>Motivo de consulta</span><input value={clinicalReason} onChange={(event) => setClinicalReason(event.target.value)} placeholder="Ej. Dolor abdominal, control, seguimiento..." /></label>
            </div>
            {patient && <p className="report-note">Las especialidades se filtran automáticamente según el sexo y la edad del paciente.</p>}
          </section>

          {specialty && (
            <section className="report-card report-card--specialty">
              <div className="report-card__heading"><div><span className="report-card__number">02</span><div><h2>Formulario Biométrico — {specialty}</h2><p>Registra los parámetros específicos del estudio seleccionado.</p></div></div></div>
              <div className="report-form__grid">
                {parameterDefinitions[specialty].map((field) => (
                  <label className="report-field" key={field.key}>
                    <span>{field.label}{field.unit ? ` (${field.unit})` : ""}</span>
                    {field.type === "select" ? (
                      <select value={parameters[field.key] ?? ""} onChange={(event) => handleParameterChange(field.key, event.target.value)}>
                        <option value="">Seleccionar...</option>
                        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input type={field.type ?? "text"} step="0.1" value={parameters[field.key] ?? ""} onChange={(event) => handleParameterChange(field.key, event.target.value)} placeholder={field.type === "number" ? "0.0" : "Registrar resultado..."} />
                    )}
                  </label>
                ))}
                {specialty === "Obstétrica" && (
                  <label className="report-field report-field--full"><span>Hallazgos Atípicos / Observaciones Adicionales <small>— opcional, para variantes anatómicas o hallazgos inusuales</small></span><textarea value={parameters.atypicalFindings ?? ""} onChange={(event) => handleParameterChange("atypicalFindings", event.target.value)} placeholder="Ej. variante anatómica, hallazgo incidental, particularidad no contemplada arriba..." rows={3} /></label>
                )}
              </div>
            </section>
          )}

          <section className="report-card">
            <div className="report-card__heading"><div><span className="report-card__number">03</span><div><h2>Hallazgos ecográficos</h2><p>Describe de forma clara los resultados observados durante el estudio.</p></div></div></div>
            <label className="report-field report-field--full"><span>Descripción de hallazgos <b>*</b></span><textarea value={findings} onChange={(event) => setFindings(event.target.value)} placeholder="Escribe los hallazgos del estudio ecográfico..." rows={7} required /></label>
            <div className="report-form__grid report-form__grid--compact"><label className="report-field"><span>Mediciones relevantes</span><textarea value={measurements} onChange={(event) => setMeasurements(event.target.value)} placeholder="Órgano, medida, volumen, localización..." rows={4} /></label><label className="report-field"><span>Observaciones</span><textarea value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Información complementaria del estudio..." rows={4} /></label></div>
          </section>

          <section className="report-card">
            <div className="report-card__heading"><div><span className="report-card__number">04</span><div><h2>Conclusión Diagnóstica y Observaciones</h2><p>Resume los resultados y registra recomendaciones para el paciente.</p></div></div></div>
            <div className="report-form__grid report-form__grid--compact">
              <label className="report-field"><span>Conclusión / Diagnóstico ecográfico <b>*</b></span><textarea value={conclusion} onChange={(event) => setConclusion(event.target.value)} placeholder="Describe los hallazgos y la impresión diagnóstica..." rows={5} required /></label>
              <label className="report-field"><span>Sugerencias / Recomendaciones</span><textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder="Controles sugeridos, exámenes complementarios..." rows={5} /></label>
            </div>
          </section>

          <section className="report-card report-images">
            <div className="report-card__heading"><div><span className="report-card__number">05</span><div><h2>Imágenes Adjuntas del Estudio</h2><p>Agrega hasta 5 imágenes ecográficas para conservarlas junto al informe.</p></div></div></div>
            <label className="image-upload"><span>＋</span><strong>{isProcessing ? "Procesando imágenes..." : "Seleccionar imágenes"}</strong><small>PNG, JPG o JPEG · máximo 5 imágenes</small><input type="file" accept="image/png,image/jpeg,image/jpg" multiple onChange={handleImageChange} disabled={isProcessing || images.length >= 5} /></label>
            {images.length > 0 && <div className="image-preview-grid">{images.map((image, index) => <div className="image-preview" key={`${image.name}-${index}`}><img src={image.dataUrl} alt={image.name} /><button type="button" onClick={() => removeImage(image.name, index)} aria-label={`Eliminar ${image.name}`}>×</button><span>{image.name}</span></div>)}</div>}
          </section>

          <section className="report-card report-signature"><div><span className="report-signature__icon">✓</span><div><h2>Responsable del informe</h2><p>{user?.name ?? "Profesional de salud"} · {user?.role === "ADMIN" ? "Administrador" : "Médico General"}</p></div></div><span className="report-signature__status">Pendiente de firma</span></section>

          {errorMessage && <p className="report-alert" role="alert">⚠ {errorMessage}</p>}
          {savedMessage && <p className="report-success" role="status">✓ {savedMessage}</p>}

          <footer className="report-form__actions">
            <button className="report-button report-button--secondary" type="button" onClick={() => navigate(patient ? `/pacientes/${patient.id}` : "/")}>Cancelar</button>
            <button className="report-button report-button--draft" type="submit">▣ Guardar Borrador</button>
            <button className="report-button report-button--primary" type="button" onClick={handleFinalize}>✓ Finalizar y Firmar</button>
            <button className="report-button report-button--pdf" type="button" onClick={handleDownloadPdf}>↓ Exportar a PDF</button>
          </footer>
        </form>
      </main>
    </div>
  );
}

export default NewUltrasoundReportPage;
