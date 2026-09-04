import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import PatientsHistoryPage from "../pages/patients/PatientsHistoryPage";
import NewUltrasoundReportPage from "../pages/reports/NewUltrasoundReportPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pacientes" element={<PatientsHistoryPage />} />
        <Route path="/nuevo-informe" element={<NewUltrasoundReportPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
