import { authRepository } from "../repositories/authRepository";
import { storageService } from "./storageService";

export type PasswordRecoveryStatus =
  | "pending"
  | "expired"
  | "used"
  | "invalidated";

export interface PasswordRecoveryRequest {
  id: string;
  email: string;
  userId?: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  status: PasswordRecoveryStatus;
}

const RECOVERY_REQUESTS_KEY = "ecomedic_password_recovery_requests";
const TOKEN_DURATION_MS = 15 * 60 * 1000;

function generateToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `recovery-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getRequests(): PasswordRecoveryRequest[] {
  return (
    storageService.get<PasswordRecoveryRequest[]>(RECOVERY_REQUESTS_KEY) ?? []
  );
}

function saveRequests(requests: PasswordRecoveryRequest[]): void {
  storageService.set(RECOVERY_REQUESTS_KEY, requests);
}

function markExpiredRequests(
  requests: PasswordRecoveryRequest[],
): PasswordRecoveryRequest[] {
  const now = Date.now();
  let changed = false;

  const updatedRequests = requests.map((request) => {
    if (
      request.status === "pending" &&
      new Date(request.expiresAt).getTime() <= now
    ) {
      changed = true;
      return { ...request, status: "expired" as const };
    }

    return request;
  });

  if (changed) {
    saveRequests(updatedRequests);
  }

  return updatedRequests;
}

export const passwordRecoveryService = {
  createRequest(email: string): PasswordRecoveryRequest {
    const now = new Date();
    const requests = markExpiredRequests(getRequests());
    const normalizedEmail = normalizeEmail(email);
    const user = authRepository.getUserByEmail(normalizedEmail);

    const request: PasswordRecoveryRequest = {
      id: generateToken(),
      email: normalizedEmail,
      userId: user?.id,
      token: generateToken(),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TOKEN_DURATION_MS).toISOString(),
      status: "pending",
    };

    const updatedRequests = [
      ...requests.filter(
        (item) =>
          !(
            item.email === normalizedEmail &&
            item.status === "pending"
          ),
      ),
      request,
    ];

    saveRequests(updatedRequests);
    return request;
  },

  getRequestByToken(token: string): PasswordRecoveryRequest | null {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      return null;
    }

    const requests = markExpiredRequests(getRequests());
    const request = requests.find((item) => item.token === normalizedToken);

    if (!request || request.status !== "pending") {
      return null;
    }

    return request;
  },

  consumeToken(token: string): void {
    const normalizedToken = token.trim();
    const requests = getRequests();

    const updatedRequests = requests.map((request) =>
      request.token === normalizedToken
        ? { ...request, status: "used" as const }
        : request,
    );

    saveRequests(updatedRequests);
  },

  invalidateToken(token: string): void {
    const normalizedToken = token.trim();
    const requests = getRequests();

    const updatedRequests = requests.map((request) =>
      request.token === normalizedToken
        ? { ...request, status: "invalidated" as const }
        : request,
    );

    saveRequests(updatedRequests);
  },
};
