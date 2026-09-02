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
        <section id="inicio">
          <h1>Página principal</h1>

          {user ? (
            <>
              <p>Bienvenido, {user.name}</p>
              <p>Carnet: {user.carnet}</p>
              <p>Rol: {user.role}</p>
            </>
          ) : (
            <p>No existe una sesión activa.</p>
          )}
        </section>

        <section id="perfil">
          <h2>Perfil</h2>
          <p>Consulta la información de tu cuenta.</p>
        </section>
        <section id="notificaciones">
          <h2>Notificaciones</h2>
          <p>Revisa las novedades de EcoMedic.</p>
        </section>
        <section id="carrito">
          <h2>Carrito</h2>
          <p>Gestiona los productos seleccionados.</p>
        </section>
      </main>
    </div>
  );
}


export default HomePage;