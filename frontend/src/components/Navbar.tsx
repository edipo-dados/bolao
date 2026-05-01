'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-fifa-black border-b border-fifa-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <span className="text-gold-400 text-base sm:text-lg font-black tracking-widest">BOLÃO</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-fifa-text tracking-wider border border-fifa-border rounded px-1 py-0.5">
                FUTEBOL
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/explore" className="text-fifa-text hover:text-fifa-white px-3 py-1.5 rounded text-xs font-medium tracking-wide uppercase transition-colors">
                Explorar
              </Link>
              {user && (
                <Link href="/my-pools" className="text-fifa-text hover:text-fifa-white px-3 py-1.5 rounded text-xs font-medium tracking-wide uppercase transition-colors">
                  Meus Bolões
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className="text-gold-400 hover:text-gold-300 px-3 py-1.5 rounded text-xs font-medium tracking-wide uppercase transition-colors">
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-fifa-text hover:text-fifa-white transition-colors"
                >
                  <span className="w-7 h-7 bg-gold-400 text-fifa-black rounded-full flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-xs font-medium">{user.name}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-fifa-card rounded-lg border border-fifa-border shadow-card-hover py-1 z-50">
                    <Link href="/profile" className="block px-4 py-2.5 text-fifa-text hover:text-fifa-white hover:bg-fifa-dark text-sm" onClick={() => setMenuOpen(false)}>
                      Perfil
                    </Link>
                    <Link href="/my-pools" className="block px-4 py-2.5 text-fifa-text hover:text-fifa-white hover:bg-fifa-dark text-sm md:hidden" onClick={() => setMenuOpen(false)}>
                      Meus Bolões
                    </Link>
                    <div className="divider my-1" />
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-accent-red hover:bg-accent-red/5 text-sm">
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="text-fifa-text hover:text-fifa-white text-xs font-medium tracking-wide uppercase transition-colors px-3 py-1.5">
                  Entrar
                </Link>
                <Link href="/register" className="btn-primary text-xs py-2 px-4">
                  Cadastrar
                </Link>
              </div>
            )}

            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-fifa-text hover:text-fifa-white p-1.5"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-fifa-border bg-fifa-dark">
          <div className="px-3 py-3 space-y-1">
            <Link href="/explore" className="block text-fifa-text hover:text-fifa-white px-3 py-2.5 rounded text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Explorar Bolões
            </Link>
            {user && (
              <Link href="/my-pools" className="block text-fifa-text hover:text-fifa-white px-3 py-2.5 rounded text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Meus Bolões
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="block text-gold-400 hover:text-gold-300 px-3 py-2.5 rounded text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Admin
              </Link>
            )}
            {!user && (
              <>
                <div className="divider my-2" />
                <Link href="/login" className="block text-fifa-text hover:text-fifa-white px-3 py-2.5 rounded text-sm font-medium" onClick={() => setMobileOpen(false)}>
                  Entrar
                </Link>
                <Link href="/register" className="block text-center btn-primary text-sm py-2.5 mx-3" onClick={() => setMobileOpen(false)}>
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
