'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token não encontrado');
      return;
    }

    api.verifyEmail(token)
      .then((result) => {
        setStatus('success');
        setMessage(result.message);
        if (result.accessToken) {
          localStorage.setItem('token', result.accessToken);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Erro ao verificar email');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <div className="text-4xl mb-4 animate-pulse">⏳</div>
        <h1 className="text-xl font-black text-white">Verificando email...</h1>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-black text-white mb-2">Email confirmado!</h1>
        <p className="text-fifa-text text-sm mb-6">{message}</p>
        <Link href="/my-pools" className="btn-primary px-8 py-3">
          Entrar no sistema
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-20 text-center">
      <div className="text-4xl mb-4">❌</div>
      <h1 className="text-2xl font-black text-white mb-2">Erro na verificação</h1>
      <p className="text-fifa-text text-sm mb-6">{message}</p>
      <Link href="/register" className="btn-secondary px-8 py-3">
        Tentar novamente
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-fifa-text">Carregando...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
