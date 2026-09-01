// ============================================================
// EcoMedic - Componente de inicio de sesión
// ============================================================

// Importa useState para controlar los valores de los campos
// del formulario dentro del componente.
import { useState } from "react";

// Tipo utilizado para manejar el evento de envío del formulario.
import type { FormEventHandler } from "react";

// Tipo que define la estructura de las credenciales de acceso.
import type { LoginCredentials } from "../../types/auth";

// Hoja de estilos exclusiva del componente LoginForm.
import "./LoginForm.css";

// ============================================================
// PROPIEDADES DEL COMPONENTE
// ============================================================

/**
 * Define las propiedades que recibe el formulario de inicio
 * de sesión desde el componente padre.
 */
interface LoginFormProps {
  /**
   * Mensaje de error que se muestra cuando el inicio de sesión
   * no puede realizarse correctamente.
   */
  error?: string;

  /**
   * Función que recibe las credenciales ingresadas por el usuario
   * y se encarga de procesar el inicio de sesión.
   */
  onSubmit: (credentials: LoginCredentials) => void;
}

// ============================================================
// COMPONENTE LOGIN FORM
// ============================================================

/**
 * Formulario de autenticación de usuarios de EcoMedic.
 *
 * Se encarga de:
 * - Capturar el carnet de identidad.
 * - Capturar la contraseña.
 * - Validar que ambos campos tengan información.
 * - Enviar las credenciales al componente encargado
 *   de realizar la autenticación.
 */
function LoginForm({ error, onSubmit }: LoginFormProps) {
  // ==========================================================
  // ESTADOS DEL FORMULARIO
  // ==========================================================

  // Almacena el carnet ingresado por el usuario.
  const [carnet, setCarnet] = useState("");

  // Almacena la contraseña ingresada por el usuario.
  const [password, setPassword] = useState("");

  // ==========================================================
  // ENVÍO DEL FORMULARIO
  // ==========================================================

  /**
   * Maneja el evento de envío del formulario.
   *
   * Evita que el navegador recargue la página y valida
   * los datos antes de enviarlos.
   */
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    // Evita el comportamiento predeterminado del formulario.
    event.preventDefault();

    // Elimina espacios innecesarios al inicio y al final
    // del carnet ingresado.
    const normalizedCarnet = carnet.trim();

    // Verifica que el carnet y la contraseña hayan sido ingresados.
    if (!normalizedCarnet || !password) {
      return;
    }

    // Envía las credenciales al componente padre.
    onSubmit({
      carnet: normalizedCarnet,
      password,
    });
  };

  // ==========================================================
  // INTERFAZ DEL FORMULARIO
  // ==========================================================

  return (
    <main className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        {/* ----------------------------------------------------
            ENCABEZADO DEL FORMULARIO
            ---------------------------------------------------- */}

        <div className="login-header">
          {/* Identidad visual de la aplicación */}
          <div className="login-logo">EcoMedic</div>

          {/* Título principal */}
          <h1>Iniciar sesión</h1>

          {/* Descripción del formulario */}
          <p>Ingresa a tu cuenta de EcoMedic</p>
        </div>

        {/* ----------------------------------------------------
            CAMPO: CARNET DE IDENTIDAD
            ---------------------------------------------------- */}

        <div className="form-group">
          <label htmlFor="carnet">
            Carnet de identidad
          </label>

          <input
            id="carnet"
            name="carnet"
            type="text"
            value={carnet}
            onChange={(event) => setCarnet(event.target.value)}
            placeholder="Ingrese su carnet"
            autoComplete="username"
            required
          />
        </div>

        {/* ----------------------------------------------------
            CAMPO: CONTRASEÑA
            ---------------------------------------------------- */}

        <div className="form-group">
          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ingrese su contraseña"
            autoComplete="current-password"
            required
          />
        </div>

        {/* ----------------------------------------------------
            MENSAJE DE ERROR
            ---------------------------------------------------- */}

        {/* Solo se muestra cuando existe un mensaje de error. */}
        {error && (
          <p
            className="login-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {/* ----------------------------------------------------
            BOTÓN DE INICIO DE SESIÓN
            ---------------------------------------------------- */}

        <button
          className="login-button"
          type="submit"
        >
          Ingresar
        </button>

        {/* ----------------------------------------------------
            PIE DEL FORMULARIO
            ---------------------------------------------------- */}

        <p className="login-footer">
          Sistema de gestión clínica
          <br />
          <strong>EcoMedic</strong>
        </p>
      </form>
    </main>
  );
}

// Exporta el componente para poder utilizarlo
// desde las páginas de autenticación.
export default LoginForm;