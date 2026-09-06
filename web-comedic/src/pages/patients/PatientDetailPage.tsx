import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import { clinicalStorage, type Specialty } from "../../services/clinicalStorage";

import "./PatientDetailPage.css";

// Filtro utilizado en la línea de tiempo para consultar los estudios por especialidad.
const specialties: Array<Specialty | "Todas las especialidades"> = [
  "Todas las especialidades",
  "Obstétrica",
  "Abdominal",
  "Renal",
  "Mamaria",
  "Partes blandas",
];

function PatientDetailPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const user = authRepository.getCurrentUser();
  const patients = clinicalStorage.getPatients();
  const studies = clinicalStorage.getStudies();
  const patient = patients.find((item) => item.id === patientId);
  const [specialty, setSpecialty] = useState<(typeof specialties)[number]>("Todas las especialidades");
  const [printStudyId, setPrintStudyId] = useState<string | null>(null);

  // La línea de tiempo muestra únicamente los estudios del paciente seleccionado.
  const patientStudies = useMemo(() => {
    return studies.filter((study) => {
      const belongsToPatient = study.patientId === patientId;
      const belongsToSpecialty = specialty === "Todas las especialidades" || study.specialty === specialty;
      return belongsToPatient && belongsToSpecialty;
    });
  }, [patientId, specialty, studies]);

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  const handleNewReport = () => {
    // Se envía el paciente seleccionado a Nuevo Informe para evitar volver a elegirlo.
    navigate(`/nuevo-informe?patientId=${encodeURIComponent(patientId ?? "")}`);
  };

  const handlePrintReport = (studyId: string) => {
    // Se selecciona un solo estudio y se abre la impresión para guardarlo como PDF.
    setPrintStudyId(studyId);
    setTimeout(() => window.print(), 80);
  };

  if (!patient) {
    return (
      <div className="patient-detail-page">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="patient-detail-page__content">
          <section className="patient-detail-empty">
            <h1>Paciente no encontrado</h1>
            <button type="button" onClick={() => navigate("/pacientes")}>← Volver a pacientes</button>
          </section>
        </main>
      </div>
    );
  }

  const initials = patient.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("");
  const ageLabel = patient.age < 12 ? "Niño/a" : patient.age < 18 ? "Adolescente" : "Adulto";
  const selectedStudy = studies.find((study) => study.id === printStudyId);

  return (
    <>
      <div className="patient-detail-page">
        <Navbar user={user} onLogout={handleLogout} />

        <main className="patient-detail-page__content">
          <button className="patient-detail__back" type="button" onClick={() => navigate("/pacientes")}>← Volver a pacientes</button>

          <section className="patient-profile-card">
            <div className="patient-profile-card__identity">
              <span className="patient-profile-card__avatar">{initials}</span>
              <div>
                <h1>{patient.name}</h1>
                <p>CI {patient.carnet} · {patient.sex} · {patient.age} años ({ageLabel}) · Tel. {patient.phone ?? "No registrado"}</p>
              </div>
            </div>

            {user?.role !== "RECEPCIONISTA" && <button className="patient-detail__new-report" type="button" onClick={handleNewReport}>＋ Nuevo Informe</button>}
          </section>

          <section className="patient-timeline">
            <div className="patient-timeline__header">
              <div>
                <h2>Línea de tiempo de estudios</h2>
                <p>Consulta los informes y resultados registrados para este paciente.</p>
              </div>
              <select value={specialty} onChange={(event) => setSpecialty(event.target.value as (typeof specialties)[number])} aria-label="Filtrar estudios por especialidad">
                {specialties.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="patient-studies">
              {patientStudies.map((study) => (
                <article className="patient-study-card" key={study.id}>
                  <div className="patient-study-card__main">
                    <div className="patient-study-card__title-row">
                      <span className={`patient-study-card__specialty patient-study-card__specialty--${study.specialty.toLowerCase().replaceAll(" ", "-")}`}>{study.specialty}</span>
                      <span className={`patient-study-card__status patient-study-card__status--${study.status.toLowerCase()}`}><span />{study.status}</span>
                    </div>
                    <p className="patient-study-card__conclusion">{study.conclusion ?? "Resultado del estudio registrado en EcoMedic."}</p>
                    <div className="patient-study-card__metadata"><span>▣ {study.date}</span><span>♧ {study.doctor}</span></div>
                  </div>
                  <button className="patient-study-card__download" type="button" onClick={() => handlePrintReport(study.id)}>⇩ Ver / Descargar</button>
                </article>
              ))}
              {!patientStudies.length && <p className="patient-timeline__empty">No hay estudios registrados para este filtro.</p>}
            </div>
          </section>
        </main>
      </div>

      {selectedStudy && (
        <section className="patient-print-report" aria-hidden="true">
          <header className="patient-print-report__brand">
            <div><strong>ECOMEDIC</strong><span>Servicios de Ecografía · Informe Clínico Ecográfico Multiespecialidad</span></div>
            <img src="/logo/logo-eco.png" alt="EcoMedic" />
          </header>
          <div className="patient-print-report__section"><h2>Datos del Paciente</h2><p><b>Nombre:</b> {patient.name}</p><p><b>CI:</b> {patient.carnet} · <b>Sexo:</b> {patient.sex} · <b>Edad:</b> {patient.age} años ({ageLabel})</p><p><b>Teléfono:</b> {patient.phone ?? "No registrado"}</p></div>
          <div className="patient-print-report__section"><h2>Datos del Estudio</h2><p><b>Fecha del estudio:</b> {selectedStudy.date} · <b>Especialidad:</b> {selectedStudy.specialty}</p><p><b>Médico tratante:</b> {selectedStudy.doctor} · <b>Sede:</b> Ecomedic</p></div>
          <div className="patient-print-report__conclusion"><h2>Conclusión Diagnóstica</h2><p>{selectedStudy.conclusion ?? "Resultado del estudio registrado en EcoMedic."}</p></div>
          <div className="patient-print-report__status"><strong>{selectedStudy.specialty}</strong><strong>Estado del informe: {selectedStudy.status}</strong><p>Firmado digitalmente por {selectedStudy.doctor} · {selectedStudy.date}</p></div>
          <footer>ECOMEDIC · Servicios de Ecografía</footer>
        </section>
      )}
    </>
  );
}

export default PatientDetailPage;
