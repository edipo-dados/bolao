'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-fifa-black border-b border-fifa-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="text-gold-400 text-lg font-black tracking-widest">BOLÃO</span>
              <span className="text-[10px] font-bold text-fifa-text tracking-wider border border-fifa-border rounded px-1.5 py-0.5">
                FUTEBOL
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/explore"
                className="text-fifa-text hover:text-fifa-white px-3 py-1.5 rounded text-xs font-medium tracking-wide uppercase transition-colors"
              >
                Explorar
              </Link>
              {user && (
                <Link
                  href="/my-pools"
                  className="text-fifa-text hover:text-fifa-white px-3 py-1.5 rounded text-xs font-medium tracking-wide uppercase transition-colors"
                >
                  Meus Bolões
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-gold-400 hover:text-gold-300 px-3 py-1.5 rounded text-xs font-medium tracking-wide uppercase transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-fifa-text hover:text-fifa-white hover:bg-fifa-dark text-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      Perfil
                    </Link>
                    <Link
                      href="/my-pools"
                      className="block px-4 py-2 text-fifa-text hover:text-fifa-white hover:bg-fifa-dark text-sm md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      Meus Bolões
                    </Link>
                    <div className="divider my-1" />
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-accent-red hover:bg-accent-red/5 text-sm"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-fifa-text hover:text-fifa-white text-xs font-medium tracking-wide uppercase transition-colors px-3 py-1.5">
                  Entrar
                </Link>
                <Link href="/register" className="btn-primary text-xs py-2 px-4">
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
