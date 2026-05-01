'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function MyPoolsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) loadPools();
  }, [user, authLoading]);

  const loadPools = async () => {
    try {
      const data = await api.getMyPools();
      setPools(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Meus Bolões</h1>
        <Link href="/pools/create" className="btn-primary">
          + Criar Bolão
        </Link>
      </div>

      {pools.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-500 mb-4">Você ainda não participa de nenhum bolão</p>
          <div className="flex justify-center gap-4">
            <Link href="/pools/create" className="btn-primary">
              Criar Bolão
            </Link>
            <Link href="/explore" className="btn-secondary">
              Explorar Bolões
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((pool) => (
            <Link
              key={pool.id}
              href={`/pools/${pool.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{pool.name}</h3>
                {pool.participants?.[0]?.role === 'ADMIN' && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-2">{pool.league?.name}</p>
              {pool.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {pool.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{pool._count?.participants || 0} participantes</span>
                <span className={pool.type === 'PUBLIC' ? 'text-green-600' : 'text-orange-600'}>
                  {pool.type === 'PUBLIC' ? '🌐 Público' : '🔒 Privado'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
