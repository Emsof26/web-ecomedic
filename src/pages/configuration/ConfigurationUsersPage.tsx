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
  const [form, setForm] = useState({ name: "", email: "", carnet: "", role: "MEDICO" as UserRole });
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
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
      name,
      email,
      carnet,
      role: form.role,
    });

    setCreatedEmail({
      subject: "Datos de acceso a EcoMedic",
      message: buildWelcomeEmail(createdUser, temporaryPassword),
    });
    refreshUsers();
    setForm({ name: "", email: "", carnet: "", role: "MEDICO" });
    setNotice("Usuario creado correctamente. El mensaje de correo fue generado para demostración.");
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
    setNotice("Solicitud aprobada. Se generó una nueva contraseña temporal.");
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
              <p><strong>Mensaje de correo generado</strong> · No se ha enviado ningún correo real.</p>
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
              <p><strong>Mensaje de correo generado</strong> · No se ha enviado ningún correo real.</p>
              <pre>{`Asunto: ${approvedEmail.subject}\n\n${approvedEmail.message}`}</pre>
            </div>
            <button className="modal-cancel" type="button" onClick={() => setApprovedEmail(null)}>Cerrar mensaje</button>
          </section>
        )}

        <section className="users-panel">
          <div className="users-panel__heading"><div><h2>Usuarios del sistema ({users.length})</h2><p>Los usuarios base se conservan. Las cuentas bloqueadas permanecen registradas.</p></div></div>
          <div className="users-list">
            {users.map((item) => (
              <article className="user-row" key={item.id}>
                <div className="user-row__identity"><span className="user-row__icon" aria-hidden="true">●</span><div><strong>{item.name}</strong><small>{item.email} · Carnet: {item.carnet}</small></div></div>
                <div className="user-row__actions"><span className={`role-badge role-badge--${item.role.toLowerCase()}`}>{roleLabels[item.role]}</span><span className={`account-status account-status--${item.accountStatus}`}>{item.accountStatus === "active" ? "Activo" : "Bloqueado"}</span>{item.id !== user.id && <button className={item.accountStatus === "blocked" ? "modal-submit" : "modal-cancel"} type="button" onClick={() => handleToggleUser(item)}>{item.accountStatus === "blocked" ? "Activar" : "Bloquear"}</button>}</div>
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
                  <div className="user-row__actions"><span className={`account-status account-status--${request.status}`}>{request.status === "pending" ? "Pendiente" : request.status === "approved" ? "Aprobada" : "Bloqueada"}</span>{request.status === "pending" && <><button className="modal-submit" type="button" onClick={() => handleApprove(request)} disabled={!request.userId}>Otorgar nueva contraseña</button><button className="modal-cancel" type="button" onClick={() => handleBlockRequest(request)}>Bloquear usuario</button></>}</div>
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
