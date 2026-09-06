import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import { useTheme } from "../../hooks/useTheme";
import { userManagementService, type ManagedUser } from "../../services/userManagementService";

import "./ConfigurationUsersPage.css";

function UserIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}

function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
}

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function WarningIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17h.01" /></svg>;
}

function CheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>;
}

function MoonIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 15.2A9 9 0 0 1 8.8 3 9 9 0 1 0 21 15.2Z" /></svg>;
}

function SunIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
}

const roleLabels = {
  MEDICO: "Médico General",
  ADMIN: "Administrador",
  RECEPCIONISTA: "Recepcionista",
};

function ConfigurationUsersPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState<ManagedUser[]>(() => userManagementService.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "MEDICO" as ManagedUser["role"] });

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  const handleAddUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newUser: ManagedUser = {
      id: `managed-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    };

    userManagementService.addUser(newUser);
    setUsers(userManagementService.getUsers());
    setForm({ name: "", email: "", role: "MEDICO" });
    setShowAddModal(false);
    setNotice("Usuario agregado al sistema.");
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    userManagementService.deleteUser(deleteTarget.id);
    setUsers(userManagementService.getUsers());
    setNotice("Usuario eliminado del sistema.");
    setDeleteTarget(null);
    window.setTimeout(() => setNotice(""), 3000);
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="configuration-page">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="configuration-page__content">
          <section className="configuration-empty">
            <h1>Acceso restringido</h1>
            <p>Solo un Administrador puede gestionar los usuarios del sistema.</p>
            <button type="button" onClick={() => navigate("/")}>Volver al inicio</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="configuration-page">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="configuration-page__content">
        <header className="configuration-header">
          <div>
            <h1>Configuración / Usuarios</h1>
            <p>Gestión de roles, accesos y apariencias.</p>
          </div>
          <button className="configuration-add-button" type="button" onClick={() => setShowAddModal(true)}>
            <UserIcon />
            Agregar usuario
          </button>
        </header>

        <div className="configuration-divider" aria-hidden="true" />

        <section className="users-panel">
          <div className="users-panel__heading">
            <div>
              <h2>Usuarios del sistema ({users.length})</h2>
              <p>Personas con acceso registrado a EcoMedic.</p>
            </div>
          </div>

          <div className="users-list">
            {users.map((managedUser) => (
              <article className="user-row" key={managedUser.id}>
                <div className="user-row__identity">
                  <span className="user-row__icon" aria-hidden="true"><UserIcon /></span>
                  <div>
                    <strong>{managedUser.name}</strong>
                    <small>{managedUser.email}</small>
                  </div>
                </div>

                <div className="user-row__actions">
                  <span className={`role-badge role-badge--${managedUser.role.toLowerCase()}`}>{roleLabels[managedUser.role]}</span>
                  <button className="delete-user-button" type="button" aria-label={`Eliminar a ${managedUser.name}`} onClick={() => setDeleteTarget(managedUser)}>
                    <TrashIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="appearance-panel">
          <div>
            <h2>Apariencia</h2>
            <p>El modo nocturno también puede activarse desde el ícono de sol/luna en la barra lateral.</p>
          </div>
          <button className="appearance-toggle" type="button" aria-pressed={theme === "dark"} onClick={toggleTheme}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            <span>{theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo nocturno"}</span>
          </button>
        </section>
      </main>

      {notice && (
        <div className="configuration-notice" role="status">
          <span><CheckIcon /></span>
          <strong>{notice}</strong>
        </div>
      )}

      {showAddModal && (
        <div className="configuration-modal-backdrop" role="presentation">
          <section className="configuration-modal" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
            <button className="modal-close" type="button" aria-label="Cerrar" onClick={() => setShowAddModal(false)}><CloseIcon /></button>
            <div className="modal-heading">
              <span className="modal-heading__icon"><UserIcon /></span>
              <div>
                <h2 id="add-user-title">Agregar Usuario del Sistema</h2>
                <p>Registra una nueva persona con acceso a EcoMedic.</p>
              </div>
            </div>

            <form className="user-form" onSubmit={handleAddUser}>
              <label>
                <strong>Nombre completo</strong>
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Dr. Marcos Pérez" />
              </label>
              <label>
                <strong>Correo electrónico</strong>
                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="usuario@ecomedic.com" />
              </label>
              <label>
                <strong>Rol del sistema</strong>
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as ManagedUser["role"] })}>
                  <option value="MEDICO">Médico General</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="RECEPCIONISTA">Recepcionista</option>
                </select>
              </label>

              <div className="modal-actions">
                <button className="modal-cancel" type="button" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button className="modal-submit" type="submit"><UserIcon /> Agregar Usuario</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="configuration-modal-backdrop" role="presentation">
          <section className="configuration-modal configuration-modal--delete" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
            <button className="modal-close" type="button" aria-label="Cerrar" onClick={() => setDeleteTarget(null)}><CloseIcon /></button>
            <div className="delete-heading">
              <span className="delete-warning"><WarningIcon /></span>
              <div>
                <h2 id="delete-user-title">Eliminar usuario</h2>
                <p>¿Eliminar a <strong>{deleteTarget.name}</strong> ({roleLabels[deleteTarget.role]}) del sistema?</p>
                <small>Esta acción no se puede deshacer.</small>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="modal-delete" type="button" onClick={handleDelete}><TrashIcon /> Eliminar</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ConfigurationUsersPage;
