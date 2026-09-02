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


function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
    </svg>
  );
}


function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M14 21h-4" />
    </svg>
  );
}


function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 4h2l2.3 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H7M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM18 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  );
}


/** Menú lateral reutilizable para las vistas con sesión autenticada. */
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
          <NavigationItem href="#perfil" label="Perfil" onNavigate={closeMenu}>
            <UserIcon />
          </NavigationItem>
          <NavigationItem href="#notificaciones" label="Notificaciones" onNavigate={closeMenu}>
            <BellIcon />
          </NavigationItem>
          <NavigationItem href="#carrito" label="Carrito" onNavigate={closeMenu}>
            <CartIcon />
          </NavigationItem>
        </nav>

        <div className="sidebar__footer">
          {user && <p className="sidebar__user">{user.name}</p>}
          <button className="sidebar__logout" type="button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}


export default Navbar;