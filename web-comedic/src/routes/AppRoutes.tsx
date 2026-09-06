import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import PatientsHistoryPage from "../pages/patients/PatientsHistoryPage";
import PatientDetailPage from "../pages/patients/PatientDetailPage";
import NewUltrasoundReportPage from "../pages/reports/NewUltrasoundReportPage";
import ImageRepositoryPage from "../pages/repository/ImageRepositoryPage";
import ConfigurationUsersPage from "../pages/configuration/ConfigurationUsersPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pacientes" element={<PatientsHistoryPage />} />
        {/* La ficha individual permite consultar estudios, crear informes y generar su PDF. */}
        <Route path="/pacientes/:patientId" element={<PatientDetailPage />} />
        <Route path="/nuevo-informe" element={<NewUltrasoundReportPage />} />
        <Route path="/repositorio" element={<ImageRepositoryPage />} />
        <Route path="/configuracion" element={<ConfigurationUsersPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
