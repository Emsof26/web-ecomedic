import { useState } from "react";
import type { ReactNode } from "react";

import type { User } from "../../types/auth";

import "./Navbar.css";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

interface NavigationItemProps {
  href: string;
  label: string;
  onNavigate: () => void;
  children: ReactNode;
}

function NavigationItem({ href, label, onNavigate, children }: NavigationItemProps) {
  return (
    <a className="sidebar__link" href={href} onClick={onNavigate}>
      {children}
      <span>{label}</span>
    </a>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9ZM9 21v-6h6v6" />
    </svg>
  );
}

function PatientsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h6" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4V19a2 2 0 0 1-4 0v-.1a2 2 0 0 0-3.4-1.4l-.1.1A2 2 0 0 1 3 14.8l.1-.1a2 2 0 0 0-1.4-3.4H1.5a2 2 0 0 1 0-4h.1A2 2 0 0 0 3 3.9l-.1-.1A2 2 0 0 1 5.7 1l.1.1a2 2 0 0 0 3.4-1.4V-.5a2 2 0 0 1 4 0v.1a2 2 0 0 0 3.4 1.4l.1-.1A2 2 0 0 1 19.5 3l-.1.1a2 2 0 0 0 1.4 3.4h.1a2 2 0 0 1 0 4h-.1a2 2 0 0 0-1.4 3.4Z" transform="translate(1 3)" />
    </svg>
  );
}

/**
 * Menú lateral principal de EcoMedic.
 * Su identidad visual sigue el prototipo: azul marino,
 * blanco y naranja como color de acento.
 */
function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        className="sidebar-toggle"
        type="button"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-controls="main-sidebar"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <MenuIcon />
      </button>

      <button
        className={`sidebar__overlay${isOpen ? " sidebar__overlay--visible" : ""}`}
        type="button"
        aria-label="Cerrar menú"
        tabIndex={isOpen ? 0 : -1}
        onClick={closeMenu}
      />

      <aside id="main-sidebar" className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar__header">
          <a className="sidebar__brand" href="#inicio" onClick={closeMenu}>
            <span className="sidebar__brand-mark" aria-hidden="true">+</span>
            <span>EcoMedic</span>
          </a>

          <button className="sidebar__close" type="button" aria-label="Cerrar menú" onClick={closeMenu}>
            <CloseIcon />
          </button>
        </div>

        <nav className="sidebar__navigation" aria-label="Navegación principal">
          <NavigationItem href="#inicio" label="Inicio" onNavigate={closeMenu}>
            <HomeIcon />
          </NavigationItem>

          <NavigationItem href="#pacientes" label="Pacientes e Historiales" onNavigate={closeMenu}>
            <PatientsIcon />
          </NavigationItem>

          <NavigationItem href="#nuevo-informe" label="Nuevo Informe Ecográfico" onNavigate={closeMenu}>
            <ReportIcon />
          </NavigationItem>

          <NavigationItem href="#imagenes" label="Repositorio de Imágenes" onNavigate={closeMenu}>
            <ImageIcon />
          </NavigationItem>

          <NavigationItem href="#configuracion" label="Configuración / Usuarios" onNavigate={closeMenu}>
            <SettingsIcon />
          </NavigationItem>
        </nav>

        <div className="sidebar__footer">
          {user && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.name}</span>
              <span className="sidebar__user-role">{user.role}</span>
            </div>
          )}

          <button className="sidebar__logout" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
