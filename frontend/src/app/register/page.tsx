'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('As senhas não coincidem'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/my-pools');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Criar conta</h1>
        <p className="text-fifa-text text-sm">Entre no jogo e comece a dar seus palpites</p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-accent-red/10 text-accent-red p-3 rounded-lg text-sm border border-accent-red/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Nome</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Seu nome" required minLength={2} />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Confirmar senha</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="Repita a senha" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <div className="divider" />

        <div className="text-center text-sm text-fifa-text">
          Já tem conta?{' '}
          <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
            Iniciar sessão
          </Link>
        </div>
      </div>
    </div>
  );
}
