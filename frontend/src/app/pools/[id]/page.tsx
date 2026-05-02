'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

type Tab = 'matches' | 'ranking' | 'predictions' | 'settings' | 'participants';

function PixInfoCard({ pool, showJoinWarning }: { pool: any; showJoinWarning: boolean }) {
  const pixPayload = generatePixPayload(pool.pixKey, pool.pixName, pool.entryFee);
  const [copied, setCopied] = useState(false);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card mb-6">
      <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-widest mb-3">Pagamento via PIX</h3>

      {showJoinWarning && (
        <div className="bg-gold-400/10 border border-gold-400/20 rounded-lg p-3 mb-4">
          <p className="text-gold-400 text-xs font-semibold mb-1">⚠️ Atenção</p>
          <p className="text-fifa-light text-xs leading-relaxed">
            Certifique-se de entrar em contato com o organizador do bolão <strong>antes</strong> de realizar o pagamento.
            Confirme sua participação e só então efetue o PIX.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* QR Code */}
        <div className="bg-white p-3 rounded-xl shrink-0 mx-auto sm:mx-0">
          <QRCodeSVG
            value={pixPayload}
            size={180}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          {pool.entryFee && (
            <div>
              <div className="text-xs text-fifa-muted uppercase tracking-wide">Valor</div>
              <div className="text-xl font-black text-gold-400">{pool.entryFee}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-fifa-muted uppercase tracking-wide">Chave PIX</div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-fifa-light bg-fifa-dark px-2 py-1 rounded border border-fifa-border break-all">
                {pool.pixKey}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(pool.pixKey); alert('Chave copiada!'); }}
                className="text-xs text-gold-400 hover:text-gold-300 shrink-0"
              >
                📋 Copiar
              </button>
            </div>
          </div>
          {pool.pixName && (
            <div>
              <div className="text-xs text-fifa-muted uppercase tracking-wide">Titular</div>
              <div className="text-sm text-fifa-light">{pool.pixName}</div>
            </div>
          )}

          {/* Copia e Cola */}
          <div>
            <button
              onClick={handleCopyPayload}
              className="btn-gold text-xs w-full sm:w-auto"
            >
              {copied ? '✅ Copiado!' : '📋 Copiar PIX Copia e Cola'}
            </button>
          </div>

          <p className="text-[10px] text-fifa-muted">
            Escaneie o QR Code ou use o PIX Copia e Cola no app do seu banco.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Gera payload PIX no padrão EMV/BRCode do Banco Central.
 * Referência: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 */
function generatePixPayload(pixKey: string, name?: string, value?: string): string {
  if (!pixKey) return '';

  const merchantName = (name || 'BOLAO FUTEBOL').substring(0, 25).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const merchantCity = 'SAO PAULO';

  // Detectar tipo de chave
  let keyType: string;
  const cleanKey = pixKey.replace(/\D/g, '');
  if (pixKey.includes('@')) {
    keyType = 'EMAIL';
  } else if (cleanKey.length === 11 && !pixKey.includes('+')) {
    keyType = 'CPF';
  } else if (cleanKey.length === 14) {
    keyType = 'CNPJ';
  } else if (pixKey.startsWith('+') || (cleanKey.length >= 10 && cleanKey.length <= 13)) {
    keyType = 'PHONE';
  } else {
    keyType = 'EVP'; // Chave aleatória
  }

  // Formatar chave para o payload
  let formattedKey = pixKey;
  if (keyType === 'PHONE' && !pixKey.startsWith('+')) {
    formattedKey = '+55' + cleanKey;
  }

  // Parsear valor
  let amount = '';
  if (value) {
    const numericValue = value.replace(/[^\d,\.]/g, '').replace(',', '.');
    const parsed = parseFloat(numericValue);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed.toFixed(2);
    }
  }

  // Montar TLVs (Tag-Length-Value)
  function tlv(tag: string, val: string): string {
    const len = val.length.toString().padStart(2, '0');
    return `${tag}${len}${val}`;
  }

  // Merchant Account Information (tag 26)
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', formattedKey);
  const mai = tlv('26', gui + key);

  // Montar payload
  let payload = '';
  payload += tlv('00', '01');                    // Payload Format Indicator
  payload += mai;                                 // Merchant Account Info
  payload += tlv('52', '0000');                  // Merchant Category Code
  payload += tlv('53', '986');                   // Transaction Currency (BRL)
  if (amount) {
    payload += tlv('54', amount);                // Transaction Amount
  }
  payload += tlv('58', 'BR');                    // Country Code
  payload += tlv('59', merchantName);            // Merchant Name
  payload += tlv('60', merchantCity);            // Merchant City
  payload += tlv('62', tlv('05', '***'));        // Additional Data (txid)

  // CRC16 (tag 63, 04 bytes)
  payload += '6304';
  const crc = crc16(payload);
  payload += crc;

  return payload;
}

/** CRC16-CCITT-FALSE para payload PIX */
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export default function PoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [pool, setPool] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('matches');
  const [ranking, setRanking] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    loadPool();
  }, [id]);

  useEffect(() => {
    if (pool) loadTabData();
  }, [tab, pool, isAdmin]);

  const loadPool = async () => {
    try {
      const data = await api.getPool(id);
      setPool(data);

      if (user) {
        const participant = data.participants?.find((p: any) => p.user?.id === user.id);
        const isPoolAdmin = participant?.role === 'ADMIN' && participant?.status === 'APPROVED';
        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        setIsAdmin(isPoolAdmin || isSuperAdmin);
        setIsMember(participant?.status === 'APPROVED' || isSuperAdmin);

        // Carregar pendentes imediatamente se for admin
        if (isPoolAdmin || isSuperAdmin) {
          try {
            const pend = await api.getPendingParticipants(data.id);
            setPending(pend);
          } catch {
            setPending([]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!pool) return;
    try {
      switch (tab) {
        case 'matches':
          break;
        case 'ranking':
          const r = await api.getRanking(pool.id);
          setRanking(r);
          break;
        case 'predictions':
          if (user) {
            const p = await api.getMyPredictions(pool.id);
            setPredictions(p);
          }
          break;
        case 'participants':
          // Sempre tenta carregar pendentes se for admin
          try {
            const pend = await api.getPendingParticipants(pool.id);
            setPending(pend);
          } catch {
            setPending([]);
          }
          break;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async () => {
    try {
      await api.joinPool(id);
      alert('Solicitação enviada! Aguarde aprovação.');
      loadPool();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Tem certeza que deseja sair do bolão?')) return;
    try {
      await api.leavePool(id);
      router.push('/my-pools');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (participantId: string) => {
    try {
      await api.approveParticipant(id, participantId);
      loadPool();
      loadTabData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (participantId: string) => {
    try {
      await api.rejectParticipant(id, participantId);
      loadTabData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  if (!pool) {
    return <div className="text-center py-12 text-gray-500">Bolão não encontrado</div>;
  }

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'matches', label: '⚽ Jogos', show: true },
    { key: 'ranking', label: '🏆 Ranking', show: true },
    { key: 'predictions', label: '🎯 Meus Palpites', show: isMember },
    { key: 'participants', label: '👥 Participantes', show: true },
    { key: 'settings', label: '⚙️ Configurações', show: isAdmin },
  ];

  return (
    <div>
      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">{pool.name}</h1>
            {pool.description && (
              <p className="text-fifa-text mt-1 text-sm">{pool.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-fifa-muted flex-wrap">
              <span>📋 {pool.league?.name}</span>
              <span>👥 {pool._count?.participants || 0} participantes</span>
              <span>{pool.type === 'PUBLIC' ? '🌐 Público' : '🔒 Privado'}</span>
              {pool.entryFee && <span className="badge-gold">💰 {pool.entryFee}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {user && !isMember && (
              <button onClick={handleJoin} className="btn-primary">
                Solicitar Entrada
              </button>
            )}
            {isMember && !isAdmin && (
              <button onClick={handleLeave} className="btn-danger text-sm">
                Sair
              </button>
            )}
            {pool.type === 'PRIVATE' && isAdmin && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/invite/${pool.inviteCode}`,
                  );
                  alert('Link copiado!');
                }}
                className="btn-secondary text-sm"
              >
                📋 Copiar Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PIX e Contato — visível para não-membros ou todos */}
      {pool.pixKey && (
        <PixInfoCard pool={pool} showJoinWarning={!isMember} />
      )}

      {/* Contato do organizador */}
      {(pool.contactPhone || pool.contactEmail || pool.creator) && (
        <div className="card mb-6">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-widest mb-3">Contato do organizador</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-fifa-light">
              <span>👤</span>
              <span>{pool.creator?.name}</span>
            </div>
            {pool.contactPhone && (
              <div className="flex items-center gap-2">
                <span>📱</span>
                <a href={`https://wa.me/${pool.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-accent-green hover:underline">
                  {pool.contactPhone}
                </a>
              </div>
            )}
            {pool.contactEmail && (
              <div className="flex items-center gap-2">
                <span>📧</span>
                <a href={`mailto:${pool.contactEmail}`} className="text-accent-blue hover:underline">
                  {pool.contactEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
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

      {/* Tab Content */}
      {tab === 'matches' && (
        <MatchesTab leagueId={pool.leagueId} poolId={pool.id} isMember={isMember} />
      )}
      {tab === 'ranking' && <RankingTab ranking={ranking} poolId={pool.id} />}
      {tab === 'predictions' && <PredictionsTab predictions={predictions} />}
      {tab === 'participants' && (
        <ParticipantsTab
          participants={pool.participants}
          pending={pending}
          isAdmin={isAdmin}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab pool={pool} onUpdate={loadPool} />
      )}
    </div>
  );
}

function MatchesTab({ leagueId, poolId, isMember }: { leagueId: string; poolId: string; isMember: boolean }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [myPredictions, setMyPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Carregar jogos
  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await api.getFilteredMatches(leagueId, {
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setMatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [leagueId, statusFilter, dateFrom, dateTo]);

  // Carregar palpites existentes
  useEffect(() => {
    if (isMember && poolId) {
      api.getMyPredictions(poolId).then((preds) => {
        const map: Record<string, { homeScore: number; awayScore: number }> = {};
        for (const p of preds) {
          map[p.matchId] = { homeScore: p.homeScore, awayScore: p.awayScore };
        }
        setMyPredictions(map);
      }).catch(console.error);
    }
  }, [isMember, poolId]);

  const handlePredict = async (matchId: string) => {
    setSaving(true);
    try {
      await api.createPrediction({ matchId, poolId, homeScore, awayScore });
      setMyPredictions({ ...myPredictions, [matchId]: { homeScore, awayScore } });
      setPredicting(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const canPredict = (match: any) => {
    return match.status === 'SCHEDULED' && new Date(match.matchDate) > new Date();
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = statusFilter !== 'ALL' || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-dark-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field py-2"
              aria-label="Filtrar por status"
            >
              <option value="ALL">Todos</option>
              <option value="SCHEDULED">Agendados</option>
              <option value="FINISHED">Finalizados</option>
              <option value="LIVE">Ao Vivo</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-dark-500 mb-1">Data início</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-dark-500 mb-1">Data fim</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field py-2"
            />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary py-2 text-xs whitespace-nowrap">
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* Contagem */}
      <div className="text-sm text-dark-500">
        {loading ? 'Carregando...' : `${matches.length} jogo${matches.length !== 1 ? 's' : ''} encontrado${matches.length !== 1 ? 's' : ''}`}
      </div>

      {/* Lista de jogos */}
      {!loading && matches.length === 0 ? (
        <div className="text-center py-8 text-dark-400">
          Nenhum jogo encontrado com esses filtros
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const existing = myPredictions[match.id];
            const editable = canPredict(match);
            const isEditing = predicting === match.id;

            return (
              <div key={match.id} className="card py-4">
                {/* Linha do jogo */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-right w-28 sm:w-36 truncate text-sm">
                        {match.homeTeam}
                      </span>
                      {match.status === 'FINISHED' ? (
                        <span className="font-extrabold text-lg text-primary-700 shrink-0">
                          {match.homeScore} x {match.awayScore}
                        </span>
                      ) : match.status === 'LIVE' ? (
                        <span className="badge-red animate-pulse shrink-0">AO VIVO</span>
                      ) : (
                        <span className="text-dark-300 text-sm shrink-0">vs</span>
                      )}
                      <span className="font-semibold w-28 sm:w-36 truncate text-sm">
                        {match.awayTeam}
                      </span>
                    </div>
                    <div className="text-xs text-dark-400 mt-1 flex items-center gap-2 flex-wrap">
                      {match.round && <span>{match.round}</span>}
                      <span>{new Date(match.matchDate).toLocaleString('pt-BR')}</span>
                      {match.status === 'FINISHED' && <span className="badge-green">Finalizado</span>}
                      {match.status === 'SCHEDULED' && !editable && (
                        <span className="badge-red">🔒 Fechado</span>
                      )}
                      {editable && <span className="badge-blue">Aberto</span>}
                    </div>
                  </div>

                  {/* Palpite existente ou botão */}
                  {isMember && !isEditing && (
                    <div className="text-right shrink-0 ml-3">
                      {existing ? (
                        <div>
                          <div className="text-xs text-dark-400">Seu palpite</div>
                          <div className="font-bold text-base">
                            {existing.homeScore} x {existing.awayScore}
                          </div>
                          {editable && (
                            <button
                              onClick={() => {
                                setPredicting(match.id);
                                setHomeScore(existing.homeScore);
                                setAwayScore(existing.awayScore);
                              }}
                              className="text-primary-600 hover:underline text-xs mt-0.5"
                            >
                              ✏️ Editar
                            </button>
                          )}
                        </div>
                      ) : editable ? (
                        <button
                          onClick={() => {
                            setPredicting(match.id);
                            setHomeScore(0);
                            setAwayScore(0);
                          }}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          🎯 Palpitar
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Painel de palpite expandido */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-dark-100">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <div className="text-xs text-dark-500 mb-1 font-semibold">{match.homeTeam}</div>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={homeScore}
                          onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                          className="w-16 h-14 text-center text-2xl font-bold border-2 border-dark-200 rounded-lg
                                     focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                          aria-label={`Gols ${match.homeTeam}`}
                          autoFocus
                        />
                      </div>
                      <span className="text-2xl font-bold text-dark-200 mt-5">×</span>
                      <div className="text-center">
                        <div className="text-xs text-dark-500 mb-1 font-semibold">{match.awayTeam}</div>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={awayScore}
                          onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                          className="w-16 h-14 text-center text-2xl font-bold border-2 border-dark-200 rounded-lg
                                     focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                          aria-label={`Gols ${match.awayTeam}`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-center gap-3 mt-4">
                      <button
                        onClick={() => handlePredict(match.id)}
                        disabled={saving}
                        className="btn-primary px-6 py-2"
                      >
                        {saving ? 'Salvando...' : existing ? '✓ Atualizar Palpite' : '✓ Confirmar Palpite'}
                      </button>
                      <button
                        onClick={() => setPredicting(null)}
                        className="btn-secondary px-4 py-2"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RankingTab({ ranking, poolId }: { ranking: any[]; poolId: string }) {
  const [matchPredictions, setMatchPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loadingPreds, setLoadingPreds] = useState(false);

  const loadPredictions = async () => {
    if (matchPredictions.length > 0) {
      setShowPredictions(!showPredictions);
      return;
    }
    setLoadingPreds(true);
    try {
      const data = await api.getRankingPredictions(poolId);
      setMatchPredictions(data);
      setShowPredictions(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPreds(false);
    }
  };

  if (ranking.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Ranking ainda não disponível
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabela de ranking */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">Participante</th>
              <th className="pb-3 pr-4 text-center">Pontos</th>
              <th className="pb-3 pr-4 text-center">Exatos</th>
              <th className="pb-3 pr-4 text-center">Acertos</th>
              <th className="pb-3 text-center">Palpites</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((entry, index) => (
              <tr key={entry.userId} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <span className={`font-bold ${index < 3 ? 'text-lg' : ''}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                </td>
                <td className="py-3 pr-4 font-medium">{entry.userName}</td>
                <td className="py-3 pr-4 text-center font-bold text-primary-600">
                  {entry.totalPoints}
                </td>
                <td className="py-3 pr-4 text-center">{entry.exactScores}</td>
                <td className="py-3 pr-4 text-center">{entry.correctWinners}</td>
                <td className="py-3 text-center">{entry.totalPredictions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botão para ver palpites */}
      <div className="text-center">
        <button
          onClick={loadPredictions}
          disabled={loadingPreds}
          className="btn-secondary"
        >
          {loadingPreds ? 'Carregando...' : showPredictions ? '🔼 Ocultar Palpites' : '🔽 Ver Palpites de Todos'}
        </button>
      </div>

      {/* Palpites por jogo */}
      {showPredictions && (
        <div className="space-y-4">
          {matchPredictions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum palpite fechado ainda
            </div>
          ) : (
            matchPredictions.map((item) => (
              <div key={item.match.id} className="card">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="font-semibold">
                      {item.match.homeTeam} vs {item.match.awayTeam}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.match.round && `${item.match.round} • `}
                      {new Date(item.match.matchDate).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  {item.match.status === 'FINISHED' && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Resultado</div>
                      <div className="font-bold text-lg text-primary-700">
                        {item.match.homeScore} x {item.match.awayScore}
                      </div>
                    </div>
                  )}
                  {item.match.status === 'LIVE' && (
                    <span className="text-sm font-bold text-red-600 animate-pulse">AO VIVO</span>
                  )}
                </div>
                <div className="space-y-1">
                  {item.predictions.map((pred: any) => (
                    <div
                      key={pred.userId}
                      className={`flex items-center justify-between py-1.5 px-3 rounded ${
                        pred.points >= 5
                          ? 'bg-green-50'
                          : pred.points >= 3
                          ? 'bg-yellow-50'
                          : ''
                      }`}
                    >
                      <span className="text-sm">{pred.userName}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold">
                          {pred.homeScore} x {pred.awayScore}
                        </span>
                        {item.match.status === 'FINISHED' && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              pred.points >= 5
                                ? 'bg-green-100 text-green-700'
                                : pred.points >= 3
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {pred.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PredictionsTab({ predictions }: { predictions: any[] }) {
  if (predictions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Você ainda não fez nenhum palpite neste bolão
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {predictions.map((pred) => (
        <div key={pred.id} className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {pred.match.homeTeam} vs {pred.match.awayTeam}
              </div>
              <div className="text-xs text-gray-500">
                {pred.match.round} • {new Date(pred.match.matchDate).toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">
                Palpite: {pred.homeScore} x {pred.awayScore}
              </div>
              {pred.calculated && (
                <div className="text-sm">
                  {pred.match.status === 'FINISHED' && (
                    <span className="text-gray-500">
                      Real: {pred.match.homeScore} x {pred.match.awayScore} •{' '}
                    </span>
                  )}
                  <span className={pred.points > 0 ? 'text-green-600 font-bold' : 'text-red-500'}>
                    {pred.points} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ParticipantsTab({
  participants,
  pending,
  isAdmin,
  onApprove,
  onReject,
}: {
  participants: any[];
  pending: any[];
  isAdmin: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const approved = participants?.filter((p: any) => p.status === 'APPROVED') || [];
  // Pendentes: usar do endpoint OU filtrar dos participantes do pool
  const pendingList = pending.length > 0
    ? pending
    : participants?.filter((p: any) => p.status === 'PENDING') || [];

  return (
    <div className="space-y-6">
      {isAdmin && pendingList.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-gold-400">
            ⏳ Aguardando aprovação ({pendingList.length})
          </h3>
          <div className="space-y-2">
            {pendingList.map((p: any) => (
              <div key={p.id} className="card flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-fifa-white">{p.user?.name || p.user}</span>
                  <span className="text-sm text-fifa-muted ml-2">{p.user?.email || ''}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(p.id)}
                    className="btn-success text-xs py-1 px-3"
                  >
                    ✅ Aprovar
                  </button>
                  <button
                    onClick={() => onReject(p.id)}
                    className="btn-danger text-xs py-1 px-3"
                  >
                    ❌ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && pendingList.length === 0 && (
        <div className="card py-4 text-center text-fifa-muted text-sm">
          Nenhuma solicitação pendente
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3 text-fifa-white">👥 Participantes ({approved.length})</h3>
        <div className="space-y-2">
          {approved.map((p: any) => (
            <div key={p.id} className="card flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-gold-400 text-fifa-black rounded-full flex items-center justify-center font-bold text-sm">
                  {(p.user?.name || '?').charAt(0).toUpperCase()}
                </span>
                <span className="font-medium text-fifa-white">{p.user?.name || 'Usuário'}</span>
              </div>
              {p.role === 'ADMIN' && (
                <span className="badge-gold text-[10px]">Admin</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ pool, onUpdate }: { pool: any; onUpdate: () => void }) {
  const [rules, setRules] = useState(pool.rules || []);
  const [saving, setSaving] = useState(false);

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      await api.updatePoolRules(
        pool.id,
        rules.map((r: any) => ({
          name: r.name,
          description: r.description,
          points: r.points,
        })),
      );
      alert('Regras atualizadas!');
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePool = async () => {
    if (!confirm('Tem certeza que deseja excluir este bolão? Esta ação não pode ser desfeita.')) return;
    try {
      await api.deletePool(pool.id);
      window.location.href = '/my-pools';
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Regras */}
      <div className="card">
        <h3 className="font-semibold mb-4">📏 Regras de Pontuação</h3>
        <div className="space-y-3">
          {rules.map((rule: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                value={rule.name}
                onChange={(e) => {
                  const updated = [...rules];
                  updated[index] = { ...updated[index], name: e.target.value };
                  setRules(updated);
                }}
                className="input-field flex-1"
                placeholder="Nome da regra"
              />
              <input
                type="text"
                value={rule.description || ''}
                onChange={(e) => {
                  const updated = [...rules];
                  updated[index] = { ...updated[index], description: e.target.value };
                  setRules(updated);
                }}
                className="input-field flex-1"
                placeholder="Descrição"
              />
              <input
                type="number"
                value={rule.points}
                onChange={(e) => {
                  const updated = [...rules];
                  updated[index] = { ...updated[index], points: parseInt(e.target.value) || 0 };
                  setRules(updated);
                }}
                className="input-field w-20 text-center"
                aria-label="Pontos"
              />
              <button
                onClick={() => setRules(rules.filter((_: any, i: number) => i !== index))}
                className="text-red-500 hover:text-red-700"
                aria-label="Remover regra"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() =>
              setRules([...rules, { name: '', description: '', points: 0 }])
            }
            className="btn-secondary text-sm"
          >
            + Adicionar Regra
          </button>
          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="btn-primary text-sm"
          >
            {saving ? 'Salvando...' : 'Salvar Regras'}
          </button>
        </div>
      </div>

      {/* Link de convite */}
      <div className="card">
        <h3 className="font-semibold mb-2">🔗 Link de Convite</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${pool.inviteCode}`}
            className="input-field flex-1 bg-gray-50"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/invite/${pool.inviteCode}`,
              );
              alert('Link copiado!');
            }}
            className="btn-secondary"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* Zona de perigo */}
      <div className="card border-red-200">
        <h3 className="font-semibold text-red-600 mb-2">⚠️ Zona de Perigo</h3>
        <p className="text-sm text-gray-600 mb-3">
          Excluir o bolão é uma ação irreversível. Todos os dados serão perdidos.
        </p>
        <button onClick={handleDeletePool} className="btn-danger text-sm">
          Excluir Bolão
        </button>
      </div>
    </div>
  );
}
