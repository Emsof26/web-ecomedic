import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/navigation/Navbar";
import { authRepository } from "../repositories/authRepository";
import { clinicalStorage, type ClinicalPatient, type ClinicalStudy } from "../services/clinicalStorage";

import "./HomePage.css";

// Página principal: concentra un resumen de pacientes, estudios y actividad reciente.
function HomePage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const isReceptionist = user?.role === "RECEPCIONISTA";
  const isAdmin = user?.role === "ADMIN";

  // Los datos se leen del almacenamiento compartido para que el panel se actualice
  // cuando se registran pacientes o informes desde las demás páginas.
  const [patients, setPatients] = useState<ClinicalPatient[]>(() => clinicalStorage.getPatients());
  const [studies, setStudies] = useState<ClinicalStudy[]>(() => clinicalStorage.getStudies());

  useEffect(() => {
    // Al volver a la página o cambiar datos en otra pestaña, se vuelve a consultar el almacenamiento.
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

  // Cada informe guardado conserva su estado y permite alimentar las tarjetas y la actividad.
  const draftCount = studies.filter((study) => study.status === "Borrador").length;
  const signedCount = studies.filter((study) => study.status === "Firmado").length;
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
            Sesión de Recepcionista: puedes consultar pacientes, historiales e imágenes, pero no editar datos clínicos ni crear informes.
          </p>
        )}

        {/* Cuatro tarjetas de resumen: pacientes, borradores, firmados y estudios totales. */}
        <section className="summary-cards" aria-label="Resumen clínico">
          <article className="summary-card">
            <span className="summary-card__icon" aria-hidden="true">♟</span>
            <strong>{patients.length}</strong>
            <p>Pacientes registrados</p>
          </article>

          <article className="summary-card">
            <span className="summary-card__icon" aria-hidden="true">✎</span>
            <strong>{draftCount}</strong>
            <p>Informes en borrador</p>
          </article>

          <article className="summary-card">
            <span className="summary-card__icon summary-card__icon--green" aria-hidden="true">♢</span>
            <strong>{signedCount}</strong>
            <p>Informes firmados</p>
          </article>

          <article className="summary-card">
            <span className="summary-card__icon summary-card__icon--blue" aria-hidden="true">⌁</span>
            <strong>{studies.length}</strong>
            <p>Estudios totales</p>
          </article>
        </section>

        {/* Actividad reciente: muestra los últimos estudios registrados en formato vertical. */}
        <section id="actividad" className="activity-panel">
          <div className="activity-panel__heading">
            <div>
              <h2>Actividad reciente</h2>
              <p>Últimos estudios e informes registrados en EcoMedic.</p>
            </div>
            <button type="button" onClick={() => navigate("/pacientes")}>Ver pacientes →</button>
          </div>

          <div className="activity-list">
            {recentStudies.map((study) => (
              <button
                className="activity-item"
                type="button"
                key={study.id}
                onClick={() => navigate("/pacientes")}
              >
                <span className={`activity-item__dot activity-item__dot--${study.status.toLowerCase()}`} aria-hidden="true" />

                <span className="activity-item__main">
                  <strong>{study.patientName} <em>—</em> <span>{study.specialty}</span></strong>
                  <small>{study.doctor} <b>·</b> {study.date}</small>
                </span>

                <span className={`activity-item__status activity-item__status--${study.status.toLowerCase()}`}>
                  {study.status}
                </span>
              </button>
            ))}

            {!recentStudies.length && (
              <p className="activity-empty">Todavía no hay estudios registrados.</p>
            )}
          </div>
        </section>

        {/* Estos accesos inferiores conservan la navegación del panel sin duplicar botones de creación. */}
        {!isReceptionist && (
          <section id="nuevo-informe" className="dashboard-panel">
            <h2>Nuevo Informe Ecográfico</h2>
            <p>Registra un nuevo informe para tus pacientes.</p>
            <button type="button" onClick={() => navigate("/nuevo-informe")}>Crear informe →</button>
          </section>
        )}

        <section id="repositorio" className="dashboard-panel">
          <h2>Repositorio de Imágenes</h2>
          <p>Organiza y consulta los estudios almacenados.</p>
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
