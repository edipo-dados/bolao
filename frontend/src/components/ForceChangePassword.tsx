'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function ForceChangePassword() {
  const { user, clearMustChange } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user?.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (password !== confirm) { setError('As senhas não coincidem'); return; }

    setLoading(true);
    try {
      await api.changePassword(password);
      clearMustChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-fifa-card border border-fifa-border rounded-xl p-6 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔐</div>
          <h2 className="text-xl font-black text-white">Troque sua senha</h2>
          <p className="text-fifa-text text-sm mt-1">
            Sua senha foi redefinida pelo administrador. Crie uma nova senha para continuar.
          </p>
        </div>

        {error && (
          <div className="bg-accent-red/10 text-accent-red p-3 rounded-lg text-sm border border-accent-red/20 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field"
              placeholder="Repita a senha"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
