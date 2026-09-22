import { storageService } from "./storageService";
import type { UserRole } from "../types/auth";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const USERS_KEY = "ecomedic_managed_users";

const initialUsers: ManagedUser[] = [
  { id: "managed-1", name: "Dr. Marcos Pérez", email: "marcos.perez@ecomedic.com", role: "MEDICO" },
  { id: "managed-2", name: "Dra. Fabiola Rojas", email: "fabiola.rojas@ecomedic.com", role: "MEDICO" },
  { id: "managed-3", name: "Administrador", email: "administrador@ecomedic.com", role: "ADMIN" },
  { id: "managed-4", name: "Laura Mendoza", email: "laura.mendoza@ecomedic.com", role: "RECEPCIONISTA" },
  { id: "managed-5", name: "Dr. Carlos Vargas", email: "carlos.vargas@ecomedic.com", role: "MEDICO" },
  { id: "managed-6", name: "Sofía Quispe", email: "sofia.quispe@ecomedic.com", role: "RECEPCIONISTA" },
];

export const userManagementService = {
  getUsers(): ManagedUser[] {
    return storageService.get<ManagedUser[]>(USERS_KEY) ?? initialUsers;
  },

  saveUsers(users: ManagedUser[]): void {
    storageService.set(USERS_KEY, users);
  },

  addUser(user: ManagedUser): void {
    this.saveUsers([...this.getUsers(), user]);
  },

  deleteUser(id: string): void {
    this.saveUsers(this.getUsers().filter((user) => user.id !== id));
  },
};
