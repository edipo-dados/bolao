'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000); // Poll a cada 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCount = async () => {
    try {
      const c = await api.getNotificationCount();
      setCount(typeof c === 'number' ? c : 0);
    } catch {
      // Silenciar — backend pode estar dormindo
    }
  };

  const handleOpen = async () => {
    if (!open) {
      try {
        const data = await api.getUnreadNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      }
    }
    setOpen(!open);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setCount(0);
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch {}
  };

  const handleClickNotification = async (notif: any) => {
    if (!notif.read) {
      await api.markNotificationRead(notif.id);
      setCount(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.link) window.location.href = notif.link;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative text-fifa-text hover:text-fifa-white p-1.5 transition-colors" aria-label="Notificações">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-fifa-card rounded-lg border border-fifa-border shadow-card-hover z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-fifa-border">
            <span className="text-sm font-semibold text-fifa-white">Notificações</span>
            {count > 0 && (
              <button onClick={handleMarkAllRead} className="text-[10px] text-gold-400 hover:text-gold-300">
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-fifa-muted text-sm">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`w-full text-left px-4 py-3 border-b border-fifa-border hover:bg-fifa-dark transition-colors ${
                    !n.read ? 'bg-gold-400/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-2 h-2 bg-gold-400 rounded-full mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-fifa-white">{n.title}</div>
                      <div className="text-xs text-fifa-text mt-0.5 truncate">{n.message}</div>
                      <div className="text-[10px] text-fifa-muted mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
            {user && <NotificationBell />}

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
