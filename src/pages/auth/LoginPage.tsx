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
      <style>{`
        .login-content {
          min-height: 100vh;
          opacity: 0;
          animation: login-fade-in 0.6s ease-out 0.75s forwards;
        }

        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 1000;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #f5f6f9;

          animation: splash-fade-out 1.25s ease-in-out 0.25s forwards;
          pointer-events: none;
        }

        .splash-logo {
          margin: 0;
          animation: splash-logo-in 0.65s ease-out forwards;
        }

        @keyframes splash-logo-in {
          from {
            opacity: 0;
            transform: scale(0.98);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes splash-fade-out {
          from {
            opacity: 1;
          }

          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes login-fade-in {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .splash-logo {
            width: 145px;
            height: 48px;
            font-size: 19px;
          }
        }

        @media (max-width: 480px) {
          .splash-logo {
            width: 135px;
            height: 46px;
            font-size: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-screen {
            animation: none;
            opacity: 0;
            visibility: hidden;
          }

          .splash-logo,
          .login-content {
            animation: none;
          }

          .login-content {
            opacity: 1;
          }
        }
      `}</style>

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
