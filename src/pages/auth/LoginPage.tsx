import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import { authRepository } from "../../repositories/authRepository";
import type { LoginCredentials } from "../../types/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  if (authRepository.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (credentials: LoginCredentials) => {
    setError("");

    const user = authRepository.login(credentials);

    if (!user) {
      setError("El carnet o la contraseña son incorrectos.");
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <>
      {showSplash && (
        <section className="splash-screen" aria-label="EcoMedic">
          <div className="login-logo splash-logo">EcoMedic</div>
        </section>
      )}

      <div className="login-content">
        <LoginForm
          error={error}
          onSubmit={handleLogin}
        />
      </div>
    </>
  );
}

export default LoginPage;
