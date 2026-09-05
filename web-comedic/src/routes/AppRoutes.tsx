import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import PatientsHistoryPage from "../pages/patients/PatientsHistoryPage";
import NewUltrasoundReportPage from "../pages/reports/NewUltrasoundReportPage";
import ImageRepositoryPage from "../pages/repository/ImageRepositoryPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pacientes" element={<PatientsHistoryPage />} />
        <Route path="/nuevo-informe" element={<NewUltrasoundReportPage />} />
        <Route path="/repositorio" element={<ImageRepositoryPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
