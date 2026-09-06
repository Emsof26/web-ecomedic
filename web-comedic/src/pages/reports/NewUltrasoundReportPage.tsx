import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import { clinicalStorage, type ClinicalPatient, type Specialty } from "../../services/clinicalStorage";

import "./NewUltrasoundReportPage.css";

function NewUltrasoundReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = authRepository.getCurrentUser();

  // El formulario utiliza los pacientes compartidos de Pacientes e Historiales.
  const [patients] = useState<ClinicalPatient[]>(() => clinicalStorage.getPatients());
  const [patientId, setPatientId] = useState(() => searchParams.get("patientId") ?? "");
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const [clinicalReason, setClinicalReason] = useState("");
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [observations, setObservations] = useState("");
  const [studyDate, setStudyDate] = useState(new Date().toISOString().slice(0, 10));
  const [savedMessage, setSavedMessage] = useState("");

  const patient = patients.find((item) => item.id === patientId);

  // Si la página recibe ?patientId=..., el paciente llega seleccionado automáticamente.
  useEffect(() => {
    const requestedPatient = searchParams.get("patientId");
    if (requestedPatient && patients.some((item) => item.id === requestedPatient)) setPatientId(requestedPatient);
  }, [patients, searchParams]);

  // Las especialidades disponibles se filtran por sexo y edad del paciente.
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
    setSavedMessage("");
  };

  // Guarda el informe y conserva la conclusión para mostrarla en la línea de tiempo del paciente.
  const saveStudy = (status: "Borrador" | "Finalizado") => {
    if (!patient || !specialty || !conclusion.trim()) return;

    const formattedDate = new Date(`${studyDate}T12:00:00`).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
    clinicalStorage.addStudy({
      id: crypto.randomUUID(),
      patientId: patient.id,
      patientName: patient.name,
      specialty,
      doctor: user?.name ?? "Profesional de salud",
      date: formattedDate,
      status,
      conclusion: conclusion.trim(),
    });

    setSavedMessage(status === "Borrador" ? "Informe guardado como borrador correctamente." : "El informe fue enviado a revisión.");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveStudy("Borrador");
  };

  const handleReview = () => saveStudy("Finalizado");

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  if (user?.role === "RECEPCIONISTA") return <div className="report-page"><Navbar user={user} onLogout={handleLogout} /><main className="report-page__content"><section className="report-empty-state"><span className="report-empty-state__icon">⌁</span><h1>Acceso restringido</h1><p>Tu perfil de Recepcionista tiene permisos de solo lectura y no puede crear informes ecográficos.</p><button type="button" onClick={() => navigate("/pacientes")}>Volver a pacientes</button></section></main></div>;

  return <div className="report-page">
    <Navbar user={user} onLogout={handleLogout} />
    <main className="report-page__content">
      <header className="report-page__header"><div><p className="report-page__eyebrow">GESTIÓN CLÍNICA</p><h1>Nuevo Informe Ecográfico</h1><p>Registra los datos del estudio, hallazgos y conclusión diagnóstica.</p></div><button className="report-page__back" type="button" onClick={() => navigate(patient ? `/pacientes/${patient.id}` : "/")}>← Volver</button></header>
      <div className="report-page__steps" aria-label="Progreso del informe"><div className="report-step report-step--active"><span>1</span><strong>Datos del estudio</strong></div><div className="report-step__line" /><div className="report-step"><span>2</span><strong>Hallazgos</strong></div><div className="report-step__line" /><div className="report-step"><span>3</span><strong>Conclusión</strong></div></div>
      <form className="report-form" onSubmit={handleSubmit}>
        <section className="report-card"><div className="report-card__heading"><div><span className="report-card__number">01</span><div><h2>Paciente y estudio</h2><p>Selecciona al paciente y el tipo de ecografía.</p></div></div></div>
          <div className="report-form__grid">
            <label className="report-field report-field--wide"><span>Paciente <b>*</b></span><select value={patientId} onChange={(event) => handlePatientChange(event.target.value)} required><option value="">Selecciona un paciente</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.name} · CI {item.carnet}</option>)}</select></label>
            <div className="patient-summary"><span className="patient-summary__avatar">{patient ? patient.name.split(" ").slice(0, 2).map((item) => item[0]).join("") : "—"}</span><div><strong>{patient?.name ?? "Paciente no seleccionado"}</strong><small>{patient ? `CI ${patient.carnet} · ${patient.sex} · ${patient.age} años` : "Selecciona un paciente para continuar"}</small></div></div>
            <label className="report-field"><span>Tipo de ecografía <b>*</b></span><select value={specialty} onChange={(event) => setSpecialty(event.target.value as Specialty)} disabled={!patient} required><option value="">Selecciona una especialidad</option>{availableSpecialties.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="report-field"><span>Fecha del estudio <b>*</b></span><input type="date" value={studyDate} onChange={(event) => setStudyDate(event.target.value)} required /></label>
            <label className="report-field report-field--wide"><span>Motivo de consulta</span><input value={clinicalReason} onChange={(event) => setClinicalReason(event.target.value)} placeholder="Ej. Dolor abdominal, control, seguimiento..." /></label>
          </div>
          {patient && <p className="report-note">Las especialidades se filtran automáticamente según el sexo y la edad del paciente.</p>}
        </section>
        <section className="report-card"><div className="report-card__heading"><div><span className="report-card__number">02</span><div><h2>Hallazgos ecográficos</h2><p>Describe de forma clara los resultados observados durante el estudio.</p></div></div></div>
          <label className="report-field report-field--full"><span>Descripción de hallazgos <b>*</b></span><textarea value={findings} onChange={(event) => setFindings(event.target.value)} placeholder="Escribe los hallazgos del estudio ecográfico..." rows={8} required /></label>
          <div className="report-form__grid"><label className="report-field"><span>Mediciones relevantes</span><textarea placeholder="Órgano, medida, volumen, localización..." rows={4} /></label><label className="report-field"><span>Observaciones</span><textarea value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Información complementaria del estudio..." rows={4} /></label></div>
        </section>
        <section className="report-card"><div className="report-card__heading"><div><span className="report-card__number">03</span><div><h2>Conclusión diagnóstica</h2><p>Resume los resultados y la impresión diagnóstica.</p></div></div></div><label className="report-field report-field--full"><span>Conclusión <b>*</b></span><textarea value={conclusion} onChange={(event) => setConclusion(event.target.value)} placeholder="Redacta la conclusión del informe..." rows={5} required /></label></section>
        <section className="report-card report-signature"><div><span className="report-signature__icon">✓</span><div><h2>Responsable del informe</h2><p>{user?.name ?? "Profesional de salud"} · {user?.role === "ADMIN" ? "Administrador" : "Médico General"}</p></div></div><span className="report-signature__status">Pendiente de firma</span></section>
        {savedMessage && <p className="report-success" role="status">✓ {savedMessage}</p>}
        <footer className="report-form__actions"><button className="report-button report-button--secondary" type="button" onClick={() => navigate(patient ? `/pacientes/${patient.id}` : "/")}>Cancelar</button><button className="report-button report-button--draft" type="submit">Guardar borrador</button><button className="report-button report-button--primary" type="button" onClick={handleReview}>Revisar informe →</button></footer>
      </form>
    </main>
  </div>;
}

export default NewUltrasoundReportPage;
