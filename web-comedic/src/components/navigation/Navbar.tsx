import { useEffect, useState } from "react";
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
    <a className="navbar__link" href={href} onClick={onNavigate}>
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
      <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}


function ReportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 13h8M8 17h6" />
    </svg>
  );
}


function ImageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 16-5-5L5 20" />
    </svg>
  );
}


function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.4 2.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3.4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.4-2.4.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4.2v-3.4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L8 5.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h3.4V4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.4 2.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V14H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}


function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M21 15.2A9 9 0 0 1 8.8 3 9 9 0 1 0 21 15.2Z" />
    </svg>
  );
}


/** Menú lateral reutilizable para las vistas con sesión autenticada. */
function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const closeMenu = () => setIsOpen(false);
  const isReceptionist = user?.role === "RECEPCIONISTA";
  const roleLabel = {
    ADMIN: "Administrador",
    MEDICO: "Médico General",
    RECEPCIONISTA: "Recepcionista",
  }[user?.role ?? "ADMIN"];

  useEffect(() => {
    document.body.classList.toggle("navbar-dark-mode", isDarkMode);

    return () => document.body.classList.remove("navbar-dark-mode");
  }, [isDarkMode]);

  return (
    <>
      <button
        className="navbar-toggle"
        type="button"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-controls="main-sidebar"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <MenuIcon />
      </button>

      <button
        className={`navbar__overlay${isOpen ? " navbar__overlay--visible" : ""}`}
        type="button"
        aria-label="Cerrar menú"
        tabIndex={isOpen ? 0 : -1}
        onClick={closeMenu}
      />

      <aside id="main-sidebar" className={`navbar${isOpen ? " navbar--open" : ""}`}>
        <div className="navbar__header">
          <a className="navbar__brand" href="#inicio" onClick={closeMenu}>
            <span className="navbar__brand-mark" aria-hidden="true">↯</span>
            <span><strong>EcoMedic</strong><small>Gestión Ecográfica</small></span>
          </a>
          <button className="navbar__close" type="button" aria-label="Cerrar menú" onClick={closeMenu}>
            <CloseIcon />
          </button>
        </div>

        <div className="navbar__user-panel">
          <div className="navbar__account">
            <span className="navbar__avatar" aria-hidden="true">↯</span>
            <span><strong>{user?.name ?? "Usuario"}</strong><small>{roleLabel}</small></span>
          </div>
        </div>

        {isReceptionist && <p className="navbar__read-only">⌁ Acceso de solo lectura</p>}

        <nav className="navbar__navigation" aria-label="Navegación principal">
          <NavigationItem href="#inicio" label="Inicio" onNavigate={closeMenu}>
            <HomeIcon />
          </NavigationItem>
          <NavigationItem href="/pacientes" label="Pacientes e Historiales" onNavigate={closeMenu}>
            <PatientsIcon />
          </NavigationItem>
          {!isReceptionist && (
            <NavigationItem href="#nuevo-informe" label="Nuevo Informe Ecográfico" onNavigate={closeMenu}>
              <ReportIcon />
            </NavigationItem>
          )}
          <NavigationItem href="#repositorio" label="Repositorio de Imágenes" onNavigate={closeMenu}>
            <ImageIcon />
          </NavigationItem>
          <NavigationItem href="#configuracion" label="Configuración / Usuarios" onNavigate={closeMenu}>
            <SettingsIcon />
          </NavigationItem>
        </nav>

        <div className="navbar__footer">
          <button
            className="navbar__theme"
            type="button"
            aria-pressed={isDarkMode}
            onClick={() => setIsDarkMode((currentValue) => !currentValue)}
          >
            <MoonIcon />{isDarkMode ? "Modo claro" : "Modo nocturno"}
          </button>
          <button className="navbar__logout" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
          <p className="navbar__copyright">EcoMedic · Servicios de Ecografía</p>
        </div>
      </aside>
    </>
  );
}


export default Navbar;