import initialUsers from "../data/users.json";
import { storageService } from "../services/storageService";
import type {
  AccountStatus,
  LoginCredentials,
  User,
  UserRecord,
} from "../types/auth";

const SESSION_KEY = "app_session";
const USERS_KEY = "ecomedic_auth_users";
const users = initialUsers as UserRecord[];

function getUsers(): UserRecord[] {
  const storedUsers = storageService.get<UserRecord[]>(USERS_KEY);

  if (!storedUsers) {
    return users.map((user) => ({ ...user, accountStatus: user.accountStatus ?? "active" }));
  }

  const updatedUsers = storedUsers.map((storedUser) => {
    const initialUser = users.find((user) => user.id === storedUser.id);
    return {
      ...storedUser,
      email: storedUser.email || initialUser?.email || "",
      accountStatus: storedUser.accountStatus ?? "active",
    };
  });

  const needsMigration = updatedUsers.some((user, index) =>
    user.email !== storedUsers[index].email ||
    user.accountStatus !== storedUsers[index].accountStatus,
  );

  if (needsMigration) saveUsers(updatedUsers);
  return updatedUsers;
}

function saveUsers(updatedUsers: UserRecord[]): void {
  storageService.set(USERS_KEY, updatedUsers);
}

function toSessionUser(user: UserRecord): User {
  return { id: user.id, name: user.name, carnet: user.carnet, role: user.role };
}

export const authRepository = {
  getUsers(): UserRecord[] {
    return getUsers();
  },

  login(credentials: LoginCredentials): User | null {
    const foundUser = getUsers().find(
      (user) => user.carnet === credentials.carnet &&
        user.password === credentials.password &&
        user.accountStatus !== "blocked",
    );
    if (!foundUser) return null;

    const sessionUser = toSessionUser(foundUser);
    storageService.set<User>(SESSION_KEY, sessionUser);
    return sessionUser;
  },

  getAccountStatusByCarnet(carnet: string): AccountStatus | "missing" {
    const user = getUsers().find((item) => item.carnet === carnet.trim());
    return user?.accountStatus ?? "missing";
  },

  getUserByEmail(email: string): UserRecord | null {
    const normalizedEmail = email.trim().toLowerCase();
    return getUsers().find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail,
    ) ?? null;
  },

  addUser(user: UserRecord): void {
    saveUsers([...getUsers(), user]);
  },

  updatePassword(userId: string, newPassword: string): boolean {
    const currentUsers = getUsers();
    if (!currentUsers.some((user) => user.id === userId)) return false;
    saveUsers(currentUsers.map((user) =>
      user.id === userId ? { ...user, password: newPassword } : user,
    ));
    return true;
  },

  setAccountStatus(userId: string, accountStatus: AccountStatus): boolean {
    const currentUsers = getUsers();
    if (!currentUsers.some((user) => user.id === userId)) return false;
    saveUsers(currentUsers.map((user) =>
      user.id === userId ? { ...user, accountStatus } : user,
    ));
    if (accountStatus === "blocked" && this.getCurrentUser()?.id === userId) {
      this.logout();
    }
    return true;
  },

  getCurrentUser(): User | null {
    const session = storageService.get<User>(SESSION_KEY);
    if (!session) return null;
    const currentUser = getUsers().find((user) => user.id === session.id);
    if (!currentUser || currentUser.accountStatus === "blocked") {
      storageService.remove(SESSION_KEY);
      return null;
    }
    const refreshedSession = toSessionUser(currentUser);
    storageService.set<User>(SESSION_KEY, refreshedSession);
    return refreshedSession;
  },

  logout(): void {
    storageService.remove(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
