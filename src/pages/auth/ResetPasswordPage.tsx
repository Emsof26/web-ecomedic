import { useNavigate } from "react-router-dom";
import "./ResetPasswordPage.css";

function ResetPasswordPage() {
  const navigate = useNavigate();

  return (
    <main className="reset-password-page">
      <section className="reset-password-card reset-password-card--invalid">
        <div className="reset-password-header">
          <img className="reset-password-logo" src="/logo/logo-eco.png" alt="Logo de EcoMedic" />
          <h1>Recuperación pendiente de revisión</h1>
          <p>
            Por seguridad, el cambio de contraseña debe ser revisado por el
            administrador de EcoMedic. Registra una solicitud y espera su
            confirmación. Los enlaces directos antiguos ya no permiten cambiar
            contraseñas.
          </p>
        </div>
        <button className="reset-password-button" type="button" onClick={() => navigate("/recuperar-contrasena")}>
          Solicitar recuperación
        </button>
        <button className="reset-password-back" type="button" onClick={() => navigate("/login")}>
          Volver al inicio de sesión
        </button>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
