export type UserRole = "ADMIN" | "MEDICO" | "RECEPCIONISTA";

export type AccountStatus = "active" | "blocked";

export interface User {
  id: string;
  name: string;
  carnet: string;
  role: UserRole;
}

export interface UserRecord extends User {
  email: string;
  password: string;
  accountStatus: AccountStatus;
}

export interface LoginCredentials {
  carnet: string;
  password: string;
}
