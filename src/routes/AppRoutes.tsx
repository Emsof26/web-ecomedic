import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import InitialEntryPage from "../pages/auth/InitialEntryPage";
import PatientsHistoryPage from "../pages/patients/PatientsHistoryPage";
import PatientDetailPage from "../pages/patients/PatientDetailPage";
import NewUltrasoundReportPage from "../pages/reports/NewUltrasoundReportPage";
import ImageRepositoryPage from "../pages/repository/ImageRepositoryPage";
import ConfigurationUsersPage from "../pages/configuration/ConfigurationUsersPage";
import { authRepository } from "../repositories/authRepository";
import type { UserRole } from "../types/auth";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) {
  const user = authRepository.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InitialEntryPage />} />
        <Route path="/login" element={<InitialEntryPage />} />

        <Route
          path="/pacientes"
          element={
            <ProtectedRoute>
              <PatientsHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pacientes/:patientId"
          element={
            <ProtectedRoute>
              <PatientDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nuevo-informe"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MEDICO"]}>
              <NewUltrasoundReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/repositorio"
          element={
            <ProtectedRoute>
              <ImageRepositoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ConfigurationUsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
