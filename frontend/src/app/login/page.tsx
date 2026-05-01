'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/my-pools');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Iniciar sessão</h1>
        <p className="text-fifa-text text-sm">Acesse sua conta para gerenciar seus palpites</p>
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
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/forgot-password" className="text-fifa-text hover:text-gold-400 transition-colors">
            Esqueceu a senha?
          </Link>
        </div>

        <div className="divider" />

        <div className="text-center text-sm text-fifa-text">
          Não tem conta?{' '}
          <Link href="/register" className="text-gold-400 hover:text-gold-300 font-medium">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
