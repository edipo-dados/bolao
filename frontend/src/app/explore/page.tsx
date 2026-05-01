'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ExplorePage() {
  const { user } = useAuth();
  const [pools, setPools] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [search, leagueFilter]);

  const loadData = async () => {
    try {
      const [poolsData, leaguesData] = await Promise.all([
        api.getPublicPools({ search: search || undefined, leagueId: leagueFilter || undefined }),
        api.getLeagues(),
      ]);
      setPools(poolsData);
      setLeagues(leaguesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (poolId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setJoining(poolId);
    try {
      await api.joinPool(poolId);
      alert('Solicitação enviada! Aguarde aprovação do admin.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoining(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Explorar Bolões</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar bolão..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={leagueFilter}
          onChange={(e) => setLeagueFilter(e.target.value)}
          className="input-field sm:w-64"
          aria-label="Filtrar por campeonato"
        >
          <option value="">Todos os campeonatos</option>
          {leagues.map((league) => (
            <option key={league.id} value={league.id}>
              {league.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : pools.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500">Nenhum bolão encontrado</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((pool) => (
            <div key={pool.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{pool.name}</h3>
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  {pool.league?.name}
                </span>
              </div>
              {pool.description && (
                <p className="text-gray-600 text-sm mb-3">{pool.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {pool._count?.participants || 0} participantes
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/pools/${pool.id}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Ver detalhes
                  </Link>
                  <button
                    onClick={() => handleJoin(pool.id)}
                    disabled={joining === pool.id}
                    className="btn-primary text-sm py-1 px-3"
                  >
                    {joining === pool.id ? '...' : 'Participar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
