'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('As senhas não coincidem'); return; }
    setLoading(true);
    try {
      await api.register({ name, email, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.resendVerification(email);
      alert('Email reenviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (success) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-2xl font-black text-white mb-2">Verifique seu email</h1>
        <p className="text-fifa-text text-sm mb-2">
          Enviamos um link de confirmação para:
        </p>
        <p className="text-gold-400 font-semibold mb-6">{email}</p>
        <p className="text-fifa-muted text-xs mb-6">
          Clique no link do email para ativar sua conta. Verifique também a pasta de spam.
        </p>
        <button onClick={handleResend} className="btn-secondary text-sm mb-4">
          Reenviar email
        </button>
        <div className="divider my-4" />
        <Link href="/login" className="text-fifa-text hover:text-gold-400 text-sm">
          Voltar ao login
        </Link>
      </div>
    );
  }

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
