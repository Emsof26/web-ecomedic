import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { User } from "../../types/auth";
import { useTheme } from "../../hooks/useTheme";
import "./Navbar.css";

interface NavbarProps { user: User | null; onLogout: () => void; }
interface NavigationItemProps { href: string; label: string; active: boolean; onNavigate: () => void; children: ReactNode; }

function NavigationItem({ href, label, active, onNavigate, children }: NavigationItemProps) {
  return <a className={`navbar__link${active ? " navbar__link--active" : ""}`} href={href} aria-current={active ? "page" : undefined} onClick={onNavigate}>{children}<span>{label}</span></a>;
}
function MenuIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>; }
function CloseIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>; }
function HomeIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9ZM9 21v-6h6v6" /></svg>; }
function PatientsIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>; }
function ReportIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 13h8M8 17h6" /></svg>; }
function ImageIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 16-5-5L5 20" /></svg>; }
function SettingsIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.4 2.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3.4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.4-2.4.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4.2v-3.4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L8 5.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h3.4V4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.4 2.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V14H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>; }
function MoonIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 15.2A9 9 0 0 1 8.8 3 9 9 0 1 0 21 15.2Z" /></svg>; }
function SunIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>; }

function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { const updateHash = () => setCurrentHash(window.location.hash); window.addEventListener("hashchange", updateHash); return () => window.removeEventListener("hashchange", updateHash); }, []);
  const closeMenu = () => setIsOpen(false);
  const isReceptionist = user?.role === "RECEPCIONISTA";
  const isAdmin = user?.role === "ADMIN";
  const roleLabel = { ADMIN: "Administrador", MEDICO: "Médico General", RECEPCIONISTA: "Recepcionista" }[user?.role ?? "ADMIN"];
  const isActive = (target: string) => {
    if (target === "/") return location.pathname === "/" && currentHash !== "#nuevo-informe" && currentHash !== "#repositorio" && currentHash !== "#configuracion";
    if (target === "/pacientes") return location.pathname === "/pacientes";
    return location.pathname === target;
  };
  const goToSection = (href: string) => { closeMenu(); if (href.startsWith("#") && location.pathname !== "/") navigate(`/${href}`); };
  return <>
    <button className="navbar-toggle" type="button" aria-label={isOpen ? "Cerrar menú" : "Abrir menú"} aria-controls="main-sidebar" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}><MenuIcon /></button>
    <button className={`navbar__overlay${isOpen ? " navbar__overlay--visible" : ""}`} type="button" aria-label="Cerrar menú" tabIndex={isOpen ? 0 : -1} onClick={closeMenu} />
    <aside id="main-sidebar" className={`navbar${isOpen ? " navbar--open" : ""}`}>
      <div className="navbar__header"><a className="navbar__brand" href="/" onClick={closeMenu}><span className="navbar__brand-mark"><img src="/logo/logo-eco.png" alt="Logo EcoMedic" /></span><span><strong>EcoMedic</strong><small>Gestión Ecográfica</small></span></a><button className="navbar__close" type="button" aria-label="Cerrar menú" onClick={closeMenu}><CloseIcon /></button></div>
      <div className="navbar__user-panel"><div className="navbar__account"><span className="navbar__avatar" aria-hidden="true">↯</span><span><strong>{user?.name ?? "Usuario"}</strong><small>{roleLabel}</small></span></div></div>
      {isReceptionist && <p className="navbar__read-only">⌁ Acceso de solo lectura</p>}
      <nav className="navbar__navigation" aria-label="Navegación principal">
        <NavigationItem href="/" label="Inicio" active={isActive("/")} onNavigate={closeMenu}><HomeIcon /></NavigationItem>
        <NavigationItem href="/pacientes" label="Pacientes e Historiales" active={isActive("/pacientes")} onNavigate={closeMenu}><PatientsIcon /></NavigationItem>
        {!isReceptionist && <NavigationItem href="/nuevo-informe" label="Nuevo Informe Ecográfico" active={isActive("/nuevo-informe")} onNavigate={closeMenu}><ReportIcon /></NavigationItem>}
        <NavigationItem href="#repositorio" label="Repositorio de Imágenes" active={location.pathname === "/" && currentHash === "#repositorio"} onNavigate={() => goToSection("#repositorio")}><ImageIcon /></NavigationItem>
        {isAdmin && <NavigationItem href="#configuracion" label="Configuración / Usuarios" active={location.pathname === "/" && currentHash === "#configuracion"} onNavigate={() => goToSection("#configuracion")}><SettingsIcon /></NavigationItem>}
      </nav>
      <div className="navbar__footer"><button className="navbar__theme" type="button" aria-pressed={theme === "dark"} onClick={toggleTheme}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}{theme === "dark" ? "Modo claro" : "Modo nocturno"}</button><button className="navbar__logout" type="button" onClick={onLogout}>Cerrar sesión</button><p className="navbar__copyright">EcoMedic · Servicios de Ecografía</p></div>
    </aside>
  </>;
}
export default Navbar;
