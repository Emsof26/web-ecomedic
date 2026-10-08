import { useState } from "react";
import type { FormEventHandler } from "react";
import { useNavigate } from "react-router-dom";

import { passwordRecoveryService } from "../../services/passwordRecoveryService";

import "./ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Ingresa tu correo electrónico.");
      setSubmitted(false);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError("Ingresa un correo electrónico válido.");
      setSubmitted(false);
      return;
    }

    passwordRecoveryService.createRequest(normalizedEmail);
    setError("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="forgot-password-page">
        <section className="forgot-password-card forgot-password-card--confirmation">
          <div className="forgot-password-header">
            <img
              className="forgot-password-logo"
              src="/logo/logo-eco.png"
              alt="Logo de EcoMedic"
            />

            <div
              className="forgot-password-confirmation-icon"
              aria-hidden="true"
            >
              ✓
            </div>

            <h1>Solicitud enviada</h1>
            <p>
              Si el correo está registrado, recibirás instrucciones para
              recuperar tu contraseña.
            </p>
          </div>

          <button
            className="forgot-password-back forgot-password-back--confirmation"
            type="button"
            onClick={() => navigate("/login")}
          >
            Volver al inicio de sesión
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="forgot-password-page">
      <section className="forgot-password-card">
        <div className="forgot-password-header">
          <img
            className="forgot-password-logo"
            src="/logo/logo-eco.png"
            alt="Logo de EcoMedic"
          />

          <h1>Recuperar contraseña</h1>
          <p>
            Ingresa tu correo electrónico para iniciar el proceso de
            recuperación de tu contraseña.
          </p>
        </div>

        <form
          className="forgot-password-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="forgot-password-field">
            <label htmlFor="recovery-email">
              Correo electrónico
            </label>

            <input
              id="recovery-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "recovery-email-error" : undefined}
              required
            />
          </div>

          {error && (
            <p
              id="recovery-email-error"
              className="forgot-password-message forgot-password-message--error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}

          <button className="forgot-password-button" type="submit">
            Enviar instrucciones
          </button>

          <button
            className="forgot-password-back"
            type="button"
            onClick={() => navigate("/login")}
          >
            Volver al inicio de sesión
          </button>
        </form>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
