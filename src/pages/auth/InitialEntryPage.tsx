import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import HomePage from "../HomePage";
import LoginPage from "./LoginPage";
import { authRepository } from "../../repositories/authRepository";

interface EntryLocationState {
  fromLogin?: boolean;
}

function InitialEntryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as EntryLocationState | null;
  const skipSplash = Boolean(locationState?.fromLogin);
  const [showSplash, setShowSplash] = useState(!skipSplash);
  const isAuthenticated = authRepository.isAuthenticated();

  useEffect(() => {
    if (skipSplash) {
      setShowSplash(false);
      navigate("/", { replace: true, state: null });
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [navigate, skipSplash]);

  return (
    <>
      <div className="entry-content">
        {isAuthenticated ? <HomePage /> : <LoginPage skipSplash />}
      </div>

      {showSplash && (
        <section className="splash-screen" aria-label="EcoMedic">
          <div className="login-logo splash-logo">EcoMedic</div>
        </section>
      )}
    </>
  );
}

export default InitialEntryPage;
