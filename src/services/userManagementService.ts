import { authRepository } from "../repositories/authRepository";
import type { AccountStatus, UserRecord, UserRole } from "../types/auth";

export type ManagedUser = UserRecord;

export const userManagementService = {
  getUsers(): ManagedUser[] {
    return authRepository.getUsers();
  },

  addUser(data: { name: string; email: string; carnet: string; role: UserRole }): { user: ManagedUser; temporaryPassword: string } {
    const temporaryPassword = `Ecomedic#${Math.floor(1000 + Math.random() * 9000)}`;
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

  setAccountStatus(userId: string, status: AccountStatus): boolean {
    return authRepository.setAccountStatus(userId, status);
  },
};
