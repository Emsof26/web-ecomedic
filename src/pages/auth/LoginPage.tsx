import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import { authRepository } from "../../repositories/authRepository";
import type { LoginCredentials } from "../../types/auth";

interface LoginPageProps {
  skipSplash?: boolean;
}

function LoginPage({ skipSplash = false }: LoginPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(!skipSplash);

  useEffect(() => {
    if (skipSplash) {
      setShowSplash(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [skipSplash]);

  if (authRepository.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (credentials: LoginCredentials) => {
    setError("");

    const accountStatus = authRepository.getAccountStatusByCarnet(credentials.carnet);

    if (accountStatus === "blocked") {
      setError("Esta cuenta se encuentra bloqueada. Comuníquese con el administrador.");
      return;
    }

    const user = authRepository.login(credentials);

    if (!user) {
      setError("El carnet o la contraseña son incorrectos.");
      return;
    }

    navigate("/", { replace: true, state: { fromLogin: true } });
  };

  return (
    <>
      {showSplash && (
        <section className="splash-screen" aria-label="EcoMedic">
          <img
            className="login-logo splash-logo"
            src="/logo/logo-eco.png"
            alt="Logo de EcoMedic"
          />
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
