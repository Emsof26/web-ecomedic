import { useNavigate } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import { authRepository } from "../repositories/authRepository";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const isReceptionist = user?.role === "RECEPCIONISTA";
  const isAdmin = user?.role === "ADMIN";
  const handleLogout = () => { authRepository.logout(); navigate("/login", { replace: true }); };
  return <div className="home-page">
    <Navbar user={user} onLogout={handleLogout} />
    <main className="home-page__content">
      <section id="inicio" className="dashboard-header"><div><h1>Buenos días, {user?.name ?? "Usuario"}</h1><p>Panel de gestión clínica de EcoMedic</p></div>{!isReceptionist && <button className="new-report-button" type="button" onClick={() => navigate("/nuevo-informe")}>＋ Nuevo Informe</button>}</section>
      {isReceptionist && <p className="read-only-message" role="status">Sesión de Recepcionista: puedes consultar pacientes, historiales e imágenes, pero no editar datos clínicos ni crear informes.</p>}
      <section className="summary-cards" aria-label="Resumen de informes"><article className="summary-card"><span className="summary-card__icon">◷</span><strong>2</strong><p>Informes en borrador</p></article><article className="summary-card"><span className="summary-card__icon summary-card__icon--green">♢</span><strong>4</strong><p>Informes firmados</p></article></section>
      <section id="pacientes" className="dashboard-panel"><h2>Actividad reciente</h2><p>Consulta pacientes e historiales ecográficos.</p></section>
      {!isReceptionist && <section id="nuevo-informe" className="dashboard-panel"><h2>Nuevo Informe Ecográfico</h2><p>Registra un nuevo informe para tus pacientes.</p></section>}
      <section id="repositorio" className="dashboard-panel"><h2>Repositorio de Imágenes</h2><p>Organiza y consulta los estudios almacenados.</p></section>
      {isAdmin && <section id="configuracion" className="dashboard-panel"><h2>Configuración / Usuarios</h2><p>Administra preferencias y usuarios del sistema.</p></section>}
    </main>
  </div>;
}
export default HomePage;
