'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api
      .getPoolByInvite(code)
      .then(setPool)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setJoining(true);
    try {
      await api.joinPool(pool.id);
      alert('Solicitação enviada! Aguarde aprovação do admin.');
      router.push(`/pools/${pool.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  if (!pool) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-gray-500">Convite inválido ou bolão não encontrado</p>
        <Link href="/" className="text-primary-600 hover:underline mt-4 inline-block">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">Convite para Bolão</h1>
        <h2 className="text-xl text-primary-600 mb-2">{pool.name}</h2>
        {pool.description && (
          <p className="text-gray-600 mb-2">{pool.description}</p>
        )}
        <p className="text-sm text-gray-500 mb-4">
          {pool.league?.name} • {pool._count?.participants || 0} participantes
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Criado por {pool.creator?.name}
        </p>

        <button
          onClick={handleJoin}
          disabled={joining}
          className="btn-primary w-full text-lg py-3"
        >
          {joining ? 'Solicitando...' : 'Solicitar Entrada'}
        </button>

        {!user && (
          <p className="text-sm text-gray-500 mt-3">
            Você precisa estar logado para participar.{' '}
            <Link href="/login" className="text-primary-600 hover:underline">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
