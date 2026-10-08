import { useEffect, useState } from "react";
import type { FormEventHandler } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authRepository } from "../../repositories/authRepository";
import { passwordRecoveryService } from "../../services/passwordRecoveryService";

import "./ResetPasswordPage.css";

const MIN_PASSWORD_LENGTH = 6;

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const recoveryToken = searchParams.get("token")?.trim() ?? "";

    setToken(recoveryToken);
    setIsTokenValid(Boolean(passwordRecoveryService.getRequestByToken(recoveryToken)));
    setIsCheckingToken(false);
  }, [location.search]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    if (!token || !isTokenValid) {
      return;
    }

    if (!password) {
      setError("Ingresa una nueva contraseña.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      return;
    }

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const request = passwordRecoveryService.getRequestByToken(token);

    if (!request || !request.userId) {
      setIsTokenValid(false);
      setError("");
      return;
    }

    const passwordUpdated = authRepository.updatePassword(
      request.userId,
      password,
    );

    if (!passwordUpdated) {
      setIsTokenValid(false);
      setError("");
      return;
    }

    passwordRecoveryService.consumeToken(token);
    setError("");
    setUpdated(true);
  };

  if (isCheckingToken) {
    return (
      <main className="reset-password-page">
        <section className="reset-password-card reset-password-card--loading">
          <img
            className="reset-password-logo"
            src="/logo/logo-eco.png"
            alt="Logo de EcoMedic"
          />
          <p>Validando solicitud de recuperación...</p>
        </section>
      </main>
    );
  }

  if (updated) {
    return (
      <main className="reset-password-page">
        <section className="reset-password-card reset-password-card--success">
          <div className="reset-password-header">
            <img
              className="reset-password-logo"
              src="/logo/logo-eco.png"
              alt="Logo de EcoMedic"
            />

            <div
              className="reset-password-success-icon"
              aria-hidden="true"
            >
              ✓
            </div>

            <h1>Contraseña actualizada correctamente</h1>
            <p>
              Tu contraseña fue actualizada. Ahora puedes iniciar sesión con
              tu nueva contraseña.
            </p>
          </div>

          <button
            className="reset-password-button"
            type="button"
            onClick={() => navigate("/login")}
          >
            Volver al inicio de sesión
          </button>
        </section>
      </main>
    );
  }

  if (!isTokenValid) {
    return (
      <main className="reset-password-page">
        <section className="reset-password-card reset-password-card--invalid">
          <div className="reset-password-header">
            <img
              className="reset-password-logo"
              src="/logo/logo-eco.png"
              alt="Logo de EcoMedic"
            />

            <div
              className="reset-password-invalid-icon"
              aria-hidden="true"
            >
              !
            </div>

            <h1>Enlace no válido</h1>
            <p>El enlace de recuperación no es válido o ha expirado.</p>
          </div>

          <button
            className="reset-password-button"
            type="button"
            onClick={() => navigate("/recuperar-contrasena")}
          >
            Volver a recuperar contraseña
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="reset-password-page">
      <section className="reset-password-card">
        <div className="reset-password-header">
          <img
            className="reset-password-logo"
            src="/logo/logo-eco.png"
            alt="Logo de EcoMedic"
          />

          <h1>Restablecer contraseña</h1>
          <p>
            Establece una nueva contraseña para volver a acceder a tu cuenta
            de EcoMedic.
          </p>
        </div>

        <form
          className="reset-password-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="reset-password-field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              name="new-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="reset-password-field">
            <label htmlFor="confirm-password">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError("");
              }}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p
              className="reset-password-message"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}

          <button className="reset-password-button" type="submit">
            Cambiar contraseña
          </button>

          <button
            className="reset-password-back"
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

export default ResetPasswordPage;
