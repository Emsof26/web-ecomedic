import { useNavigate } from "react-router-dom";

import Navbar from "../components/navigation/Navbar";
import { authRepository } from "../repositories/authRepository";

import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="home-page">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="home-page__content">
        <section id="inicio" className="home-page__hero">
          <div>
            <p className="home-page__eyebrow">SISTEMA CLÍNICO ECOGRÁFICO</p>
            <h1>Bienvenido a EcoMedic</h1>
            {user ? (
              <p className="home-page__welcome">
                Bienvenido, <strong>{user.name}</strong>. Gestiona la información clínica de manera organizada y segura.
              </p>
            ) : (
              <p className="home-page__welcome">Sistema de gestión para la atención y diagnóstico ecográfico.</p>
            )}
          </div>

          <div className="home-page__hero-accent" aria-hidden="true">
            <span>+</span>
          </div>
        </section>

        <section id="pacientes" className="home-page__card">
          <div className="home-page__card-icon home-page__card-icon--blue">01</div>
          <div>
            <h2>Pacientes e Historiales</h2>
            <p>Consulta pacientes, datos personales e historial clínico de forma rápida y organizada.</p>
          </div>
        </section>

        <section id="nuevo-informe" className="home-page__card">
          <div className="home-page__card-icon home-page__card-icon--orange">02</div>
          <div>
            <h2>Nuevo Informe Ecográfico</h2>
            <p>Registra y administra los informes correspondientes a los estudios ecográficos realizados.</p>
          </div>
        </section>

        <section id="imagenes" className="home-page__card">
          <div className="home-page__card-icon home-page__card-icon--blue">03</div>
          <div>
            <h2>Repositorio de Imágenes</h2>
            <p>Organiza y consulta las imágenes asociadas a los estudios ecográficos de los pacientes.</p>
          </div>
        </section>

        <section id="configuracion" className="home-page__card">
          <div className="home-page__card-icon home-page__card-icon--orange">04</div>
          <div>
            <h2>Configuración / Usuarios</h2>
            <p>Administra las opciones del sistema y los usuarios según los permisos asignados.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
