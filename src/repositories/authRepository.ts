import initialUsers from "../data/users.json";
import { storageService } from "../services/storageService";
import type {
  AccountStatus,
  LoginCredentials,
  User,
  UserRecord,
  UserRole,
} from "../types/auth";

const SESSION_KEY = "app_session";
const USERS_KEY = "ecomedic_auth_users";
const SCHEMA_VERSION_KEY = "ecomedic_users_schema_version";
const DELETED_USERS_KEY = "ecomedic_deleted_user_ids";
const SCHEMA_VERSION = 3;
const users = initialUsers as UserRecord[];

function getUsers(): UserRecord[] {
  const storedUsers = storageService.get<UserRecord[]>(USERS_KEY);
  const schemaVersion = storageService.get<number>(SCHEMA_VERSION_KEY);
  const deletedUserIds = new Set(storageService.get<string[]>(DELETED_USERS_KEY) ?? []);
  storageService.remove("ecomedic_managed_users");

  if (schemaVersion !== SCHEMA_VERSION) {
    const storedById = new Map((storedUsers ?? []).map((user) => [user.id, user]));
    const baseUsers = users.filter((initialUser) => !deletedUserIds.has(initialUser.id)).map((initialUser) => ({
      ...initialUser,
      accountStatus: storedById.get(initialUser.id)?.accountStatus ?? "active",
    }));
    const baseIds = new Set(users.map((user) => user.id));
    const additionalUsers = (storedUsers ?? [])
      .filter((storedUser) => !baseIds.has(storedUser.id))
      .map((storedUser) => ({
        ...storedUser,
        accountStatus: storedUser.accountStatus ?? "active",
      }));
    const migratedUsers = [...baseUsers, ...additionalUsers];
    saveUsers(migratedUsers);
    storageService.set(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
    return migratedUsers;
  }

  const currentUsers = storedUsers ?? users;
  const knownIds = new Set(currentUsers.map((user) => user.id));
  const normalizedUsers = [
    ...currentUsers.map((storedUser) => ({
      ...storedUser,
      email: storedUser.email ?? users.find((baseUser) => baseUser.id === storedUser.id)?.email ?? "",
      accountStatus: storedUser.accountStatus ?? "active",
    })),
    ...users
      .filter((initialUser) => !knownIds.has(initialUser.id) && !deletedUserIds.has(initialUser.id))
      .map((initialUser) => ({ ...initialUser, accountStatus: "active" as const })),
  ];

  if (JSON.stringify(normalizedUsers) !== JSON.stringify(currentUsers)) {
    saveUsers(normalizedUsers);
  }

  return normalizedUsers;
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
    const deletedIds = storageService.get<string[]>(DELETED_USERS_KEY) ?? [];
    storageService.set(DELETED_USERS_KEY, deletedIds.filter((id) => id !== user.id));
    saveUsers([...getUsers(), user]);
  },

  deleteUser(userId: string): boolean {
    const currentUsers = getUsers();
    if (!currentUsers.some((user) => user.id === userId)) return false;

    const session = storageService.get<User>(SESSION_KEY);
    if (session?.id === userId) return false;

    const target = currentUsers.find((user) => user.id === userId);
    if (target?.role === "ADMIN" && currentUsers.filter((user) => user.role === "ADMIN").length <= 1) {
      return false;
    }

    saveUsers(currentUsers.filter((user) => user.id !== userId));
    if (users.some((user) => user.id === userId)) {
      const deletedIds = storageService.get<string[]>(DELETED_USERS_KEY) ?? [];
      if (!deletedIds.includes(userId)) storageService.set(DELETED_USERS_KEY, [...deletedIds, userId]);
    }
    return true;
  },

  updateUser(
    userId: string,
    changes: { name: string; email: string; carnet: string; role: UserRole },
  ): boolean {
    const currentUsers = getUsers();
    if (!currentUsers.some((user) => user.id === userId)) return false;

    const updatedUsers = currentUsers.map((user) =>
      user.id === userId
        ? {
            ...user,
            name: changes.name.trim(),
            email: changes.email.trim().toLowerCase(),
            carnet: changes.carnet.trim(),
            role: changes.role,
          }
        : user,
    );
    saveUsers(updatedUsers);

    const session = storageService.get<User>(SESSION_KEY);
    if (session?.id === userId) {
      const updatedUser = updatedUsers.find((user) => user.id === userId);
      if (updatedUser) storageService.set<User>(SESSION_KEY, toSessionUser(updatedUser));
    }

    return true;
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
