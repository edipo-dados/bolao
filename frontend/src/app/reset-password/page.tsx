'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (!token) {
      setError('Token inválido. Use o link enviado por email.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-black text-white mb-2">Senha alterada</h1>
        <p className="text-fifa-text text-sm mb-6">Sua senha foi redefinida com sucesso.</p>
        <Link href="/login" className="btn-primary px-8 py-3">
          Entrar
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-white mb-2">Link inválido</h1>
        <p className="text-fifa-text text-sm mb-6">
          Este link de recuperação é inválido ou expirou. Solicite um novo.
        </p>
        <Link href="/forgot-password" className="btn-primary px-8 py-3">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Nova senha</h1>
        <p className="text-fifa-text text-sm">Digite sua nova senha</p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-accent-red/10 text-accent-red p-3 rounded-lg text-sm border border-accent-red/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Nova senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Confirmar senha</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="Repita a senha" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-fifa-text">Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
