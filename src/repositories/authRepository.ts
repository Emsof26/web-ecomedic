import initialUsers from "../data/users.json";
import { storageService } from "../services/storageService";
import type {
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
    return users;
  }

  const updatedUsers = storedUsers.map((storedUser) => {
    const initialUser = users.find((user) => user.id === storedUser.id);

    if (storedUser.email || !initialUser) {
      return storedUser;
    }

    return {
      ...storedUser,
      email: initialUser.email,
    };
  });

  const needsMigration = updatedUsers.some(
    (user, index) => user.email !== storedUsers[index].email,
  );

  if (needsMigration) {
    saveUsers(updatedUsers);
  }

  return updatedUsers;
}


function saveUsers(updatedUsers: UserRecord[]): void {
  storageService.set(USERS_KEY, updatedUsers);
}


export const authRepository = {
  login(credentials: LoginCredentials): User | null {
    const foundUser = getUsers().find(
      (user) =>
        user.carnet === credentials.carnet &&
        user.password === credentials.password
    );


    if (!foundUser) {
      return null;
    }


    const sessionUser: User = {
      id: foundUser.id,
      name: foundUser.name,
      carnet: foundUser.carnet,
      role: foundUser.role,
    };


    storageService.set<User>(SESSION_KEY, sessionUser);


    return sessionUser;
  },


  getUserByEmail(email: string): UserRecord | null {
    const normalizedEmail = email.trim().toLowerCase();

    return (
      getUsers().find(
        (user) => user.email.trim().toLowerCase() === normalizedEmail
      ) ?? null
    );
  },


  updatePassword(userId: string, newPassword: string): boolean {
    const currentUsers = getUsers();
    const userExists = currentUsers.some((user) => user.id === userId);

    if (!userExists) {
      return false;
    }

    saveUsers(
      currentUsers.map((user) =>
        user.id === userId
          ? { ...user, password: newPassword }
          : user
      )
    );

    return true;
  },


  logout(): void {
    storageService.remove(SESSION_KEY);
  },


  getCurrentUser(): User | null {
    return storageService.get<User>(SESSION_KEY);
  },


  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
