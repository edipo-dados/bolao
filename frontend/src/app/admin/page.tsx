'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'dashboard' | 'matches' | 'users' | 'pools' | 'logs';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, authLoading, isAdmin]);

  if (authLoading || !isAdmin) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'matches', label: '⚽ Jogos & Resultados' },
    { key: 'users', label: '👥 Usuários' },
    { key: 'pools', label: '🏆 Bolões' },
    { key: 'logs', label: '📋 Logs' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Administração</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'matches' && <MatchesTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'pools' && <PoolsTab />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
}

// ==================== DASHBOARD ====================
function DashboardTab() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getAdminDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="text-center py-8 text-gray-500">Carregando...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card text-center">
        <div className="text-3xl font-bold text-primary-600">{data.users}</div>
        <div className="text-sm text-gray-600">Usuários</div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-green-600">{data.pools}</div>
        <div className="text-sm text-gray-600">Bolões</div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-orange-600">{data.predictions}</div>
        <div className="text-sm text-gray-600">Palpites</div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-purple-600">{data.matches}</div>
        <div className="text-sm text-gray-600">Jogos</div>
      </div>
    </div>
  );
}

// ==================== JOGOS & RESULTADOS ====================
function MatchesTab() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importingLeagues, setImportingLeagues] = useState(false);

  // Form novo jogo
  const [showNewMatch, setShowNewMatch] = useState(false);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [round, setRound] = useState('');
  const [matchDate, setMatchDate] = useState('');

  // Form nova liga
  const [showNewLeague, setShowNewLeague] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [leagueCountry, setLeagueCountry] = useState('');

  // Form resultado
  const [editingResult, setEditingResult] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  useEffect(() => {
    api.getLeagues().then((data) => {
      setLeagues(data);
      if (data.length > 0) setSelectedLeague(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedLeague) loadMatches();
  }, [selectedLeague]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMatches(selectedLeague);
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportEspnLeagues = async () => {
    setImportingLeagues(true);
    try {
      const result = await api.importEspnLeagues();
      alert(`${result.imported} campeonatos importados do ESPN!`);
      const data = await api.getLeagues();
      setLeagues(data);
      if (data.length > 0 && !selectedLeague) setSelectedLeague(data[0].id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImportingLeagues(false);
    }
  };

  const handleSyncEspnFixtures = async () => {
    if (!selectedLeague) return;
    setSyncing(true);
    try {
      const result = await api.syncEspnFixtures(selectedLeague);
      if (result.error) {
        alert(result.error);
      } else {
        alert(`${result.synced} jogos sincronizados para ${result.league}!`);
        loadMatches();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const league = await api.createLeague({
        name: leagueName,
        country: leagueCountry || undefined,
        season: new Date().getFullYear(),
      });
      setLeagues([...leagues, league]);
      setSelectedLeague(league.id);
      setShowNewLeague(false);
      setLeagueName('');
      setLeagueCountry('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMatch({
        leagueId: selectedLeague,
        homeTeam,
        awayTeam,
        round: round || undefined,
        matchDate: new Date(matchDate).toISOString(),
      });
      setShowNewMatch(false);
      setHomeTeam('');
      setAwayTeam('');
      setRound('');
      setMatchDate('');
      loadMatches();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetResult = async (matchId: string) => {
    try {
      await api.setMatchResult(matchId, homeScore, awayScore);
      setEditingResult(null);
      loadMatches();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Remover este jogo e todos os palpites associados?')) return;
    try {
      await api.deleteMatch(matchId);
      loadMatches();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seletor de campeonato */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <label className="font-medium text-sm whitespace-nowrap">Campeonato:</label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="input-field"
              aria-label="Selecionar campeonato"
            >
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.country ? `(${l.country})` : ''} - {l.season}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleImportEspnLeagues}
              disabled={importingLeagues}
              className="btn-success text-sm"
              title="Importar campeonatos do ESPN (grátis)"
            >
              {importingLeagues ? '⏳...' : '🌐 Importar Ligas ESPN'}
            </button>
            <button
              onClick={handleSyncEspnFixtures}
              disabled={syncing || !selectedLeague}
              className="btn-success text-sm"
              title="Buscar jogos e resultados do ESPN"
            >
              {syncing ? '⏳ Sincronizando...' : '🔄 Sync Jogos ESPN'}
            </button>
            <button
              onClick={() => setShowNewLeague(!showNewLeague)}
              className="btn-secondary text-sm"
            >
              + Campeonato
            </button>
            <button
              onClick={() => setShowNewMatch(!showNewMatch)}
              className="btn-primary text-sm"
              disabled={!selectedLeague}
            >
              + Novo Jogo
            </button>
          </div>
        </div>

        {/* Form nova liga */}
        {showNewLeague && (
          <form onSubmit={handleCreateLeague} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-medium">Novo Campeonato</h4>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Nome (ex: Brasileirão Série A)"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="input-field flex-1"
                required
              />
              <input
                type="text"
                placeholder="País (opcional)"
                value={leagueCountry}
                onChange={(e) => setLeagueCountry(e.target.value)}
                className="input-field w-40"
              />
              <button type="submit" className="btn-primary text-sm">
                Criar
              </button>
            </div>
          </form>
        )}

        {/* Form novo jogo */}
        {showNewMatch && (
          <form onSubmit={handleCreateMatch} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-medium">Novo Jogo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Time da casa"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Time visitante"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Rodada (ex: Rodada 1)"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="input-field"
              />
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn-primary text-sm">
              Criar Jogo
            </button>
          </form>
        )}
      </div>

      {/* Lista de jogos */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum jogo cadastrado neste campeonato
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <div key={match.id} className="card py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{match.homeTeam}</span>
                    {match.status === 'FINISHED' ? (
                      <span className="font-bold text-lg text-primary-600">
                        {match.homeScore} x {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">vs</span>
                    )}
                    <span className="font-medium truncate">{match.awayTeam}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {match.round && `${match.round} • `}
                    {new Date(match.matchDate).toLocaleString('pt-BR')}
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                        match.status === 'FINISHED'
                          ? 'bg-green-100 text-green-700'
                          : match.status === 'LIVE'
                          ? 'bg-red-100 text-red-700'
                          : match.status === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingResult === match.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                        className="w-12 text-center input-field py-1 text-sm"
                        aria-label="Gols casa"
                      />
                      <span className="text-gray-400">x</span>
                      <input
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                        className="w-12 text-center input-field py-1 text-sm"
                        aria-label="Gols visitante"
                      />
                      <button
                        onClick={() => handleSetResult(match.id)}
                        className="btn-success text-xs py-1 px-2"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingResult(null)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingResult(match.id);
                          setHomeScore(match.homeScore ?? 0);
                          setAwayScore(match.awayScore ?? 0);
                        }}
                        className="btn-primary text-xs py-1 px-2"
                        title="Inserir/editar resultado"
                      >
                        {match.status === 'FINISHED' ? '✏️ Editar' : '📝 Resultado'}
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="text-red-500 hover:text-red-700 text-xs py-1 px-2"
                        title="Remover jogo"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== USUÁRIOS ====================
function UsersTab() {
  const [data, setData] = useState<any>({ users: [], total: 0 });

  useEffect(() => {
    api.getAdminUsers().then(setData).catch(console.error);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este usuário?')) return;
    try {
      await api.deleteUser(id);
      setData({
        ...data,
        users: data.users.filter((u: any) => u.id !== id),
        total: data.total - 1,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="pb-3">Nome</th>
            <th className="pb-3">Email</th>
            <th className="pb-3">Role</th>
            <th className="pb-3">Cadastro</th>
            <th className="pb-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((u: any) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="py-3">{u.name}</td>
              <td className="py-3 text-sm text-gray-500">{u.email}</td>
              <td className="py-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    u.role === 'SUPER_ADMIN'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="py-3 text-sm text-gray-500">
                {new Date(u.createdAt).toLocaleDateString('pt-BR')}
              </td>
              <td className="py-3">
                {u.role !== 'SUPER_ADMIN' && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remover
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-sm text-gray-500 mt-4">Total: {data.total} usuários</div>
    </div>
  );
}

// ==================== BOLÕES ====================
function PoolsTab() {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPools = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPools();
      setPools(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover o bolão "${name}"? Esta ação é irreversível.`)) return;
    try {
      await api.deleteAdminPool(id);
      setPools(pools.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = search
    ? pools.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pools;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar bolão..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <span className="text-xs text-fifa-muted">{filtered.length} bolão(ões)</span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-fifa-muted">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-fifa-muted">Nenhum bolão encontrado</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <div key={p.id} className="card py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-fifa-white">{p.name}</span>
                    <span className={`badge text-[10px] ${p.type === 'PUBLIC' ? 'badge-green' : 'badge-red'}`}>
                      {p.type === 'PUBLIC' ? '🌐 Público' : '🔒 Privado'}
                    </span>
                    {p.entryFee && <span className="badge-gold text-[10px]">💰 {p.entryFee}</span>}
                  </div>
                  <div className="text-xs text-fifa-muted mt-1">
                    {p.league?.name} • Criado por {p.creator?.name} • {p._count?.participants || 0} participantes
                  </div>
                  {p.pixKey && (
                    <div className="text-xs text-fifa-muted mt-0.5">
                      PIX: {p.pixKey}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/pools/${p.id}`}
                    target="_blank"
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    👁 Ver
                  </a>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="btn-danger text-xs py-1 px-3"
                  >
                    🗑 Excluir
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

// ==================== LOGS ====================
function LogsTab() {
  const [data, setData] = useState<any>({ logs: [], total: 0 });

  useEffect(() => {
    api.getAdminLogs().then(setData).catch(console.error);
  }, []);

  return (
    <div className="card">
      {data.logs.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Nenhum log registrado</p>
      ) : (
        <div className="space-y-2">
          {data.logs.map((log: any) => (
            <div key={log.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <span className="text-xs text-gray-400 w-36 shrink-0">
                {new Date(log.createdAt).toLocaleString('pt-BR')}
              </span>
              <span className="text-sm font-medium">{log.action}</span>
              {log.details && <span className="text-sm text-gray-500">{log.details}</span>}
              {log.user && <span className="text-xs text-gray-400">por {log.user.name}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="text-sm text-gray-500 mt-4">Total: {data.total} logs</div>
    </div>
  );
}
