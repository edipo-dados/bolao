'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result: any = await api.forgotPassword(email);
      setSent(true);
      // Em dev, o backend retorna o token — montar o link
      if (result.resetToken) {
        setResetLink(`${window.location.origin}/reset-password?token=${result.resetToken}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-2xl font-black text-white mb-2">Verifique seu email</h1>
        <p className="text-fifa-text text-sm mb-6">
          Se o email existir em nossa base, você receberá um link para redefinir sua senha.
        </p>

        {resetLink && (
          <div className="card text-left mb-6">
            <p className="text-xs text-gold-400 font-semibold mb-2">🔧 Modo desenvolvimento</p>
            <p className="text-xs text-fifa-muted mb-2">Em produção, este link seria enviado por email:</p>
            <a href={resetLink} className="text-xs text-accent-blue hover:underline break-all">
              {resetLink}
            </a>
          </div>
        )}

        <Link href="/login" className="text-fifa-text hover:text-gold-400 text-sm transition-colors">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Recuperar senha</h1>
        <p className="text-fifa-text text-sm">Informe seu email para receber o link de recuperação</p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-accent-red/10 text-accent-red p-3 rounded-lg text-sm border border-accent-red/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-fifa-text hover:text-gold-400 text-sm transition-colors">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
