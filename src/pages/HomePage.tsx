import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/navigation/Navbar";
import { PencilIcon, FileTextIcon, UserIcon, CheckIcon } from "../components/ui/Icons";
import { authRepository } from "../repositories/authRepository";
import { clinicalStorage, type ClinicalPatient, type ClinicalStudy } from "../services/clinicalStorage";

import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const isReceptionist = user?.role === "RECEPCIONISTA";
  const isAdmin = user?.role === "ADMIN";

  const [patients, setPatients] = useState<ClinicalPatient[]>(() => clinicalStorage.getPatients());
  const [studies, setStudies] = useState<ClinicalStudy[]>(() => clinicalStorage.getStudies());

  useEffect(() => {
    const refreshDashboard = () => {
      setPatients(clinicalStorage.getPatients());
      setStudies(clinicalStorage.getStudies());
    };

    window.addEventListener("storage", refreshDashboard);
    window.addEventListener("focus", refreshDashboard);

    return () => {
      window.removeEventListener("storage", refreshDashboard);
      window.removeEventListener("focus", refreshDashboard);
    };
  }, []);

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  const today = new Date();
  const todayLabel = today
    .toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
  const studiesToday = studies.filter((study) => study.date === todayLabel).length;
  const specialtyCount = new Set(studies.map((study) => study.specialty)).size;
  const recentStudies = studies.slice(0, 8);

  return (
    <div className="home-page">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="home-page__content">
        <section id="inicio" className="dashboard-header">
          <div>
            <h1>Buenos días, {user?.name ?? "Usuario"}</h1>
            <p>Panel de gestión clínica de EcoMedic</p>
          </div>
        </section>

        {isReceptionist && (
          <p className="read-only-message" role="status">
            Sesión de Recepcionista: puedes consultar pacientes, historiales e imágenes, pero no editar datos clínicos ni registrar estudios.
          </p>
        )}

        <section className="summary-cards" aria-label="Resumen clínico">
          <article className="summary-card">
            <span className="summary-card__icon" aria-hidden="true"><UserIcon /></span>
            <strong>{patients.length}</strong>
            <p>Pacientes registrados</p>
          </article>

          <article className="summary-card">
            <span className="summary-card__icon"><PencilIcon /></span>
            <strong>{studiesToday}</strong>
            <p>Ecografías realizadas hoy</p>
          </article>

          <article className="summary-card">
            <span className="summary-card__icon summary-card__icon--green"><CheckIcon /></span>
            <strong>{specialtyCount}</strong>
            <p>Especialidades registradas</p>
          </article>

          <article className="summary-card">
            <span className="summary-card__icon summary-card__icon--blue"><FileTextIcon /></span>
            <strong>{studies.length}</strong>
            <p>Estudios registrados</p>
          </article>
        </section>

        <section id="actividad" className="activity-panel">
          <div className="activity-panel__heading">
            <div>
              <h2>Estudios recientes</h2>
              <p>Últimos estudios registrados en EcoMedic.</p>
            </div>
            <button type="button" onClick={() => navigate("/pacientes")}>Ver pacientes →</button>
          </div>

          <div className="activity-list">
            {recentStudies.map((study) => (
              <button
                className="activity-item"
                type="button"
                key={study.id}
                onClick={() => navigate(`/pacientes/${study.patientId}`)}
              >
                <span className="activity-item__dot" aria-hidden="true" />

                <span className="activity-item__main">
                  <strong>{study.patientName} <em>—</em> <span>{study.specialty}</span></strong>
                  <small>{study.doctor} <b>·</b> {study.date}</small>
                </span>

                <span className="activity-item__status">
                  Estudio ecográfico
                </span>
              </button>
            ))}

            {!recentStudies.length && (
              <p className="activity-empty">Todavía no hay estudios registrados.</p>
            )}
          </div>
        </section>

        {!isReceptionist && (
          <section id="nuevo-informe" className="dashboard-panel">
            <h2>Registrar estudio ecográfico</h2>
            <p>Registra un nuevo estudio para tus pacientes.</p>
            <button type="button" onClick={() => navigate("/nuevo-informe")}>Registrar estudio →</button>
          </section>
        )}

        <section id="repositorio" className="dashboard-panel">
          <h2>Repositorio de Estudios</h2>
          <p>Organiza y consulta los estudios y sus imágenes.</p>
          <button type="button" onClick={() => navigate("/repositorio")}>Abrir repositorio →</button>
        </section>

        {isAdmin && (
          <section id="configuracion" className="dashboard-panel">
            <h2>Configuración / Usuarios</h2>
            <p>Administra preferencias y usuarios del sistema.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default HomePage;
