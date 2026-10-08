import { authRepository } from "../repositories/authRepository";
import { storageService } from "./storageService";

export type PasswordRecoveryStatus = "pending" | "approved" | "blocked";

export interface PasswordRecoveryRequest {
  id: string;
  userId?: string;
  userName: string;
  email: string;
  carnet: string;
  createdAt: string;
  status: PasswordRecoveryStatus;
  temporaryPassword?: string;
  emailSubject?: string;
  emailMessage?: string;
}

const RECOVERY_REQUESTS_KEY = "ecomedic_password_recovery_requests";

function getRequests(): PasswordRecoveryRequest[] {
  const stored = storageService.get<PasswordRecoveryRequest[]>(RECOVERY_REQUESTS_KEY) ?? [];
  // Ignora solicitudes del formato antiguo basado en enlaces/token.
  return stored.filter((request) =>
    typeof request.id === "string" &&
    typeof request.createdAt === "string" &&
    ["pending", "approved", "blocked"].includes(request.status),
  );
}

function saveRequests(requests: PasswordRecoveryRequest[]): void {
  storageService.set(RECOVERY_REQUESTS_KEY, requests);
}

function generateTemporaryPassword(): string {
  return `Ecomedic#${Math.floor(1000 + Math.random() * 9000)}`;
}

function createEmailMessage(name: string, carnet: string, role: string, password: string): string {
  const roleLabel = {
    ADMIN: "Administrador",
    MEDICO: "Médico General",
    RECEPCIONISTA: "Recepcionista",
  }[role as "ADMIN" | "MEDICO" | "RECEPCIONISTA"] ?? role;

  return `Estimada/o ${name}:

Su solicitud de recuperación de contraseña fue aprobada.

Carnet: ${carnet}
Nueva contraseña temporal: ${password}
Rol: ${roleLabel}

Puede ingresar al sistema utilizando su carnet y esta contraseña.

Atentamente,
EcoMedic

Mensaje generado para demostración. No se ha enviado ningún correo real.`;
}

export const passwordRecoveryService = {
  createRequest(email: string): PasswordRecoveryRequest {
    const normalizedEmail = email.trim().toLowerCase();
    const user = authRepository.getUserByEmail(normalizedEmail);
    const request: PasswordRecoveryRequest = {
      id: `recovery-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user?.id,
      userName: user?.name ?? "Solicitud sin usuario asociado",
      email: normalizedEmail,
      carnet: user?.carnet ?? "—",
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    saveRequests([...getRequests(), request]);
    return request;
  },

  getRequests(): PasswordRecoveryRequest[] {
    return getRequests().sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    );
  },

  approveRequest(requestId: string): PasswordRecoveryRequest | null {
    const requests = getRequests();
    const request = requests.find((item) => item.id === requestId);
    if (!request || request.status !== "pending" || !request.userId) return null;

    const user = authRepository.getUsers().find((item) => item.id === request.userId);
    if (!user) return null;

    const temporaryPassword = generateTemporaryPassword();
    if (!authRepository.updatePassword(user.id, temporaryPassword)) return null;

    const approvedRequest: PasswordRecoveryRequest = {
      ...request,
      status: "approved",
      temporaryPassword,
      emailSubject: "Datos de acceso a EcoMedic",
      emailMessage: createEmailMessage(user.name, user.carnet, user.role, temporaryPassword),
    };

    saveRequests(requests.map((item) => item.id === requestId ? approvedRequest : item));
    return approvedRequest;
  },

  blockRequest(requestId: string): boolean {
    const requests = getRequests();
    const request = requests.find((item) => item.id === requestId);
    if (!request || request.status !== "pending") return false;

    if (request.userId) {
      const blocked = authRepository.setAccountStatus(request.userId, "blocked");
      if (!blocked) return false;
    }

    saveRequests(requests.map((item) =>
      item.id === requestId ? { ...item, status: "blocked" } : item,
    ));
    return true;
  },
};
