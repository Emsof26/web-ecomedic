import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import { useTheme } from "../../hooks/useTheme";
import { userManagementService, type ManagedUser } from "../../services/userManagementService";
import { passwordRecoveryService, type PasswordRecoveryRequest } from "../../services/passwordRecoveryService";
import type { UserRole } from "../../types/auth";

import "./ConfigurationUsersPage.css";

const roleLabels: Record<UserRole, string> = {
  MEDICO: "Médico General",
  ADMIN: "Administrador",
  RECEPCIONISTA: "Recepcionista",
};

type UserFormData = { name: string; email: string; carnet: string; role: UserRole };

function buildWelcomeEmail(user: ManagedUser, password: string): string {
  return `Estimada/o ${user.name}:

Su usuario ha sido registrado en el sistema EcoMedic.

Carnet: ${user.carnet}
Contraseña temporal: ${password}
Rol: ${roleLabels[user.role]}

Puede utilizar estos datos para iniciar sesión en el sistema.

Atentamente,
EcoMedic

Mensaje generado para demostración. No se ha enviado ningún correo real.`;
}

function ConfigurationUsersPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState<ManagedUser[]>(() => userManagementService.getUsers());
  const [requests, setRequests] = useState<PasswordRecoveryRequest[]>(() => passwordRecoveryService.getRequests());
  const [form, setForm] = useState<UserFormData>({ name: "", email: "", carnet: "", role: "MEDICO" });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserFormData>({ name: "", email: "", carnet: "", role: "MEDICO" });
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [createdEmail, setCreatedEmail] = useState<{ subject: string; message: string } | null>(null);
  const [approvedEmail, setApprovedEmail] = useState<{ subject: string; message: string; password: string } | null>(null);

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  const refreshUsers = () => setUsers(userManagementService.getUsers());
  const refreshRequests = () => setRequests(passwordRecoveryService.getRequests());

  const handleAddUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const carnet = form.carnet.trim();

    if (!name || !email || !carnet) {
      setFormError("Completa nombre, correo electrónico y carnet.");
      return;
    }
    if (users.some((item) => item.carnet === carnet)) {
      setFormError("Ya existe un usuario con ese carnet.");
      return;
    }
    if (users.some((item) => item.email.toLowerCase() === email)) {
      setFormError("Ya existe un usuario con ese correo electrónico.");
      return;
    }

    const { user: createdUser, temporaryPassword } = userManagementService.addUser({
      name, email, carnet, role: form.role,
    });
    setCreatedEmail({
      subject: "Datos de acceso a EcoMedic",
      message: buildWelcomeEmail(createdUser, temporaryPassword),
    });
    refreshUsers();
    setForm({ name: "", email: "", carnet: "", role: "MEDICO" });
    setNotice("Usuario creado. Por ahora el mensaje se muestra en pantalla; el envío real de correos aún requiere configuración.");
  };

  const startEditing = (target: ManagedUser) => {
    setEditingUserId(target.id);
    setEditForm({
      name: target.name,
      email: target.email,
      carnet: target.carnet,
      role: target.role,
    });
    setEditError("");
    setNotice("");
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditError("");
  };

  const handleSaveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUserId) return;
    setEditError("");

    const name = editForm.name.trim();
    const email = editForm.email.trim().toLowerCase();
    const carnet = editForm.carnet.trim();

    if (!name || !email || !carnet) {
      setEditError("Completa nombre, correo electrónico y carnet.");
      return;
    }
    if (users.some((item) => item.id !== editingUserId && item.carnet === carnet)) {
      setEditError("Otro usuario ya tiene ese carnet.");
      return;
    }
    if (users.some((item) => item.id !== editingUserId && item.email.trim().toLowerCase() === email)) {
      setEditError("Otro usuario ya tiene ese correo electrónico.");
      return;
    }

    const target = users.find((item) => item.id === editingUserId);
    const role = target?.id === user?.id ? "ADMIN" : editForm.role;
    const updated = userManagementService.updateUser(editingUserId, { name, email, carnet, role });
    if (!updated) {
      setEditError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
      return;
    }

    refreshUsers();
    setEditingUserId(null);
    setNotice("Los datos del usuario se actualizaron correctamente. Su contraseña y estado de cuenta se conservaron.");
  };

  const handleApprove = (request: PasswordRecoveryRequest) => {
    if (!window.confirm(`¿Confirmas que verificaste la identidad de ${request.userName} y deseas otorgar una nueva contraseña temporal?`)) return;
    const approved = passwordRecoveryService.approveRequest(request.id);
    if (!approved?.temporaryPassword || !approved.emailMessage) {
      setNotice("No se pudo aprobar la solicitud. Verifica que corresponda a un usuario existente y activo.");
      return;
    }
    setApprovedEmail({
      subject: approved.emailSubject ?? "Datos de acceso a EcoMedic",
      message: approved.emailMessage,
      password: approved.temporaryPassword,
    });
    refreshUsers();
    refreshRequests();
    setNotice("Solicitud aprobada. Se generó una nueva contraseña temporal; el correo todavía no se envía automáticamente.");
  };

  const handleBlockRequest = (request: PasswordRecoveryRequest) => {
    if (!window.confirm(`¿Confirmas el bloqueo de la cuenta asociada a la solicitud de ${request.userName}? El usuario no podrá iniciar sesión.`)) return;
    if (!passwordRecoveryService.blockRequest(request.id)) {
      setNotice("No se pudo bloquear la solicitud.");
      return;
    }
    refreshUsers();
    refreshRequests();
    setNotice("Solicitud marcada como bloqueada.");
  };

  const handleDeleteUser = (target: ManagedUser) => {
    if (target.id === user?.id) {
      setNotice("No puedes eliminar tu propia cuenta mientras estás administrándola.");
      return;
    }
    if (target.role === "ADMIN" && users.filter((item) => item.role === "ADMIN").length <= 1) {
      setNotice("No puedes eliminar al único administrador del sistema.");
      return;
    }
    if (!window.confirm(`¿Eliminar definitivamente la cuenta de ${target.name}? Esta acción no se puede deshacer.`)) return;

    if (!userManagementService.deleteUser(target.id)) {
      setNotice("No se pudo eliminar el usuario. Verifica que no sea tu cuenta ni el último administrador.");
      return;
    }
    passwordRecoveryService.removeRequestsForUser(target.id);
    if (editingUserId === target.id) setEditingUserId(null);
    refreshUsers();
    refreshRequests();
    setNotice(`El usuario ${target.name} fue eliminado.`);
  };

  const handleToggleUser = (target: ManagedUser) => {
    const nextStatus = target.accountStatus === "blocked" ? "active" : "blocked";
    if (nextStatus === "blocked" && target.id === user?.id) {
      setNotice("No puedes bloquear tu propia cuenta mientras estás administrándola.");
      return;
    }
    if (nextStatus === "blocked" && !window.confirm(`¿Bloquear la cuenta de ${target.name}?`)) return;
    userManagementService.setAccountStatus(target.id, nextStatus);
    refreshUsers();
    setNotice(nextStatus === "blocked" ? "Cuenta bloqueada." : "Cuenta activada.");
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="configuration-page">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="configuration-page__content">
          <section className="configuration-empty">
            <h1>Acceso restringido</h1>
            <p>Solo un Administrador puede gestionar los usuarios y las solicitudes de recuperación.</p>
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
            <p>Administra cuentas, accesos y solicitudes de recuperación.</p>
          </div>
        </header>

        {notice && <p className="configuration-notice" role="status">{notice}</p>}

        <section className="users-panel">
          <div className="users-panel__heading">
            <div>
              <h2>Crear usuario</h2>
              <p>La contraseña temporal se genera automáticamente al guardar.</p>
            </div>
          </div>
          <form className="user-form configuration-create-form" onSubmit={handleAddUser}>
            <h3>Datos personales</h3>
            <label><strong>Nombre del usuario</strong><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Valentina Olivares" /></label>
            <label><strong>Correo electrónico</strong><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="usuario@ejemplo.com" /></label>
            <h3>Datos de acceso</h3>
            <label><strong>Carnet del usuario</strong><input required value={form.carnet} onChange={(event) => setForm({ ...form, carnet: event.target.value })} placeholder="Ej. 123456" /></label>
            <label><strong>Rol</strong><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}><option value="MEDICO">Médico General</option><option value="ADMIN">Administrador</option><option value="RECEPCIONISTA">Recepcionista</option></select></label>
            {formError && <p className="reset-password-message" role="alert">{formError}</p>}
            <div className="modal-actions"><button className="modal-submit" type="submit">Crear usuario y generar contraseña</button></div>
          </form>
        </section>

        {createdEmail && (
          <section className="appearance-panel configuration-email-preview">
            <div>
              <h2>Usuario creado correctamente</h2>
              <p><strong>Vista previa del mensaje</strong> · No se ha enviado ningún correo real.</p>
              <pre>{`Asunto: ${createdEmail.subject}\n\n${createdEmail.message}`}</pre>
            </div>
            <button className="modal-cancel" type="button" onClick={() => setCreatedEmail(null)}>Cerrar mensaje</button>
          </section>
        )}

        {approvedEmail && (
          <section className="appearance-panel configuration-email-preview">
            <div>
              <h2>Solicitud aprobada</h2>
              <p><strong>Nueva contraseña temporal:</strong> <code>{approvedEmail.password}</code></p>
              <p><strong>Vista previa del mensaje</strong> · No se ha enviado ningún correo real.</p>
              <pre>{`Asunto: ${approvedEmail.subject}\n\n${approvedEmail.message}`}</pre>
            </div>
            <button className="modal-cancel" type="button" onClick={() => setApprovedEmail(null)}>Cerrar mensaje</button>
          </section>
        )}

        {editingUserId && (
          <section className="users-panel configuration-edit-panel">
            <div className="users-panel__heading">
              <div>
                <h2>Editar usuario</h2>
                <p>Corrige los datos sin borrar la cuenta ni cambiar su contraseña.</p>
              </div>
            </div>
            <form className="user-form configuration-create-form" onSubmit={handleSaveEdit}>
              <h3>Datos personales y de acceso</h3>
              <label><strong>Nombre completo</strong><input required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label>
              <label><strong>Correo electrónico</strong><input required type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} /></label>
              <label><strong>Carnet</strong><input required value={editForm.carnet} onChange={(event) => setEditForm({ ...editForm, carnet: event.target.value })} /></label>
              <label><strong>Rol</strong><select disabled={editingUserId === user.id} value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value as UserRole })}><option value="MEDICO">Médico General</option><option value="ADMIN">Administrador</option><option value="RECEPCIONISTA">Recepcionista</option></select></label>
              {editingUserId === user.id && <p className="configuration-edit-hint">Tu cuenta debe conservar el rol Administrador.</p>}
              {editError && <p className="reset-password-message" role="alert">{editError}</p>}
              <div className="modal-actions">
                <button className="modal-cancel" type="button" onClick={cancelEditing}>Cancelar</button>
                <button className="modal-submit" type="submit">Guardar cambios</button>
              </div>
            </form>
          </section>
        )}

        <section className="users-panel">
          <div className="users-panel__heading">
            <div><h2>Usuarios del sistema ({users.length})</h2><p>Selecciona «Editar» para corregir los datos de una cuenta.</p></div>
          </div>
          <div className="users-list">
            {users.map((item) => (
              <article className="user-row" key={item.id}>
                <div className="user-row__identity">
                  <span className="user-row__icon" aria-hidden="true">●</span>
                  <div><strong>{item.name}</strong><small>{item.email} · Carnet: {item.carnet}</small></div>
                </div>
                <div className="user-row__actions">
                  <span className={`role-badge role-badge--${item.role.toLowerCase()}`}>{roleLabels[item.role]}</span>
                  <span className={`account-status account-status--${item.accountStatus}`}>{item.accountStatus === "active" ? "Activo" : "Bloqueado"}</span>
                  <button className="modal-cancel" type="button" onClick={() => startEditing(item)}>{editingUserId === item.id ? "Editando…" : "Editar"}</button>
                  {item.id !== user.id && <><button className={item.accountStatus === "blocked" ? "modal-submit" : "modal-cancel"} type="button" onClick={() => handleToggleUser(item)}>{item.accountStatus === "blocked" ? "Activar" : "Bloquear"}</button><button className="modal-delete" type="button" onClick={() => handleDeleteUser(item)}>Eliminar</button></>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="users-panel">
          <div className="users-panel__heading"><div><h2>Solicitudes de recuperación ({requests.filter((item) => item.status === "pending").length} pendientes)</h2><p>Verifica la identidad del usuario antes de aprobar o bloquear.</p></div></div>
          {requests.length === 0 ? <p className="recovery-empty">No hay solicitudes de recuperación.</p> : (
            <div className="users-list">
              {requests.map((request) => (
                <article className="user-row recovery-request-row" key={request.id}>
                  <div className="user-row__identity"><span className="user-row__icon" aria-hidden="true">↻</span><div><strong>{request.userName}</strong><small>Carnet: {request.carnet} · {request.email}</small><small>Fecha: {new Date(request.createdAt).toLocaleString("es-BO")}</small><small>Mensaje: {request.userName} ha solicitado recuperar su contraseña.</small></div></div>
                  <div className="user-row__actions"><span className={`account-status account-status--${request.status}`}>{request.status === "pending" ? "Pendiente" : request.status === "approved" ? "Aprobada" : "Bloqueada"}</span>{request.status === "pending" && <><button className="modal-submit" type="button" onClick={() => handleApprove(request)} disabled={!request.userId || users.some((item) => item.id === request.userId && item.accountStatus === "blocked")}>Otorgar nueva contraseña</button><button className="modal-cancel" type="button" onClick={() => handleBlockRequest(request)}>Bloquear usuario</button></>}</div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="appearance-panel">
          <div><h2>Apariencia</h2><p>El modo nocturno también puede activarse desde el menú lateral.</p></div>
          <button className="appearance-toggle" type="button" aria-pressed={theme === "dark"} onClick={toggleTheme}>{theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo nocturno"}</button>
        </section>
      </main>
    </div>
  );
}

export default ConfigurationUsersPage;
