import { authRepository } from "../repositories/authRepository";
import type { AccountStatus, UserRecord, UserRole } from "../types/auth";

export type ManagedUser = UserRecord;

function generateTemporaryPassword(): string {
  const existingPasswords = new Set(authRepository.getUsers().map((user) => user.password));
  let candidate = "";
  do {
    candidate = `Ecomedic#${Math.floor(1000 + Math.random() * 9000)}`;
  } while (existingPasswords.has(candidate));
  return candidate;
}

export const userManagementService = {
  getUsers(): ManagedUser[] {
    return authRepository.getUsers();
  },

  addUser(data: { name: string; email: string; carnet: string; role: UserRole }): { user: ManagedUser; temporaryPassword: string } {
    const temporaryPassword = generateTemporaryPassword();
    const user: ManagedUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      carnet: data.carnet.trim(),
      password: temporaryPassword,
      role: data.role,
      accountStatus: "active",
    };
    authRepository.addUser(user);
    return { user, temporaryPassword };
  },

  deleteUser(userId: string): boolean {
    return authRepository.deleteUser(userId);
  },

  updateUser(
    userId: string,
    data: { name: string; email: string; carnet: string; role: UserRole },
  ): boolean {
    return authRepository.updateUser(userId, data);
  },

  setAccountStatus(userId: string, status: AccountStatus): boolean {
    return authRepository.setAccountStatus(userId, status);
  },
};
