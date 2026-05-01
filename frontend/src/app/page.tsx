'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

function MatchCard({ match }: { match: any }) {
  const isLive = match.status === 'LIVE';
  const isFinished = match.status === 'FINISHED';

  return (
    <div className="bg-fifa-dark border border-fifa-border rounded-lg p-3 hover:border-fifa-muted transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-fifa-muted font-medium tracking-wide uppercase truncate">
          {match.league?.name || match.round || ''}
        </span>
        {isLive && <span className="badge-red text-[10px] animate-pulse">AO VIVO</span>}
        {isFinished && <span className="badge-green text-[10px]">FIM</span>}
        {!isLive && !isFinished && (
          <span className="text-[10px] text-fifa-muted">
            {new Date(match.matchDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-fifa-white truncate pr-2">{match.homeTeam}</span>
            <span className={`text-sm font-bold ${isFinished || isLive ? 'text-white' : 'text-fifa-muted'}`}>
              {isFinished || isLive ? match.homeScore : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fifa-white truncate pr-2">{match.awayTeam}</span>
            <span className={`text-sm font-bold ${isFinished || isLive ? 'text-white' : 'text-fifa-muted'}`}>
              {isFinished || isLive ? match.awayScore : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchesSection({ title, matches, icon }: { title: string; matches: any[]; icon: string }) {
  if (matches.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <h3 className="text-xs font-semibold text-fifa-text uppercase tracking-widest">{title}</h3>
        <span className="text-[10px] text-fifa-muted bg-fifa-card border border-fifa-border rounded-full px-2 py-0.5">
          {matches.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<{ live: any[]; today: any[]; upcoming: any[]; recent: any[] } | null>(null);

  useEffect(() => {
    api.getHighlights().then(setHighlights).catch(console.error);
  }, []);

  const hasMatches = highlights && (
    highlights.live.length > 0 ||
    highlights.today.length > 0 ||
    highlights.upcoming.length > 0 ||
    highlights.recent.length > 0
  );

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden py-12 sm:py-20 md:py-28 text-center">
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gold-400/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-gold-400/5 rounded-full" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gold-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-gold-400/3 rounded-full blur-3xl" />
        </div>

        <div className="relative px-2">
          <p className="text-gold-400 text-xs sm:text-sm font-medium tracking-widest uppercase mb-2 sm:mb-3">
            Ame o futebol. Ganhe pontos.
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-3 sm:mb-4 tracking-tight">
            Bem-vindos
          </h1>
          <p className="text-fifa-text text-sm sm:text-base max-w-xl mx-auto mb-6 sm:mb-10 leading-relaxed">
            Compita em bolões, dê seus palpites e acompanhe o ranking em tempo real.
            Tudo sobre futebol em uma única experiência.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 px-4 sm:px-0">
            {user ? (
              <>
                <Link href="/my-pools" className="btn-primary px-8 py-3 text-sm">
                  Meus Bolões
                </Link>
                <Link href="/explore" className="btn-secondary px-8 py-3 text-sm">
                  Explorar Bolões
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="btn-primary px-8 py-3 text-sm">
                  Começar
                </Link>
                <Link href="/login" className="btn-secondary px-8 py-3 text-sm">
                  Já tem uma conta? Iniciar sessão
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Jogos em destaque */}
      {hasMatches && (
        <>
          <div className="divider max-w-5xl mx-auto" />
          <div className="py-10 max-w-5xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-1">Jogos</h2>
              <p className="text-fifa-text text-xs">Acompanhe os resultados em tempo real</p>
            </div>

            <MatchesSection icon="🔴" title="Ao vivo" matches={highlights!.live} />
            <MatchesSection icon="📅" title="Hoje" matches={highlights!.today} />
            <MatchesSection icon="⏳" title="Próximos jogos" matches={highlights!.upcoming} />
            <MatchesSection icon="✅" title="Resultados recentes" matches={highlights!.recent} />
          </div>
        </>
      )}

      {/* Divider */}
      <div className="divider max-w-4xl mx-auto" />

      {/* Description */}
      <div className="py-16 text-center max-w-2xl mx-auto">
        <p className="text-fifa-light text-base leading-relaxed">
          Independentemente de como você acompanha futebol, é aqui que o seu amor pelo esporte
          é celebrado. De palpites nos dias de jogo a rankings entre amigos, o Bolão Futebol
          reúne tudo o que você ama sobre futebol em uma única experiência feita para os torcedores.
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto pb-16">
        <div className="text-center group">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-fifa-card border border-fifa-border flex items-center justify-center text-3xl group-hover:border-gold-400/30 group-hover:shadow-glow-gold transition-all duration-300">
            🏆
          </div>
          <h3 className="text-gold-400 text-sm font-semibold tracking-wide mb-2">Crie bolões</h3>
          <p className="text-fifa-text text-xs leading-relaxed">
            Configure regras, pontuações e critérios de desempate personalizados.
          </p>
        </div>
        <div className="text-center group">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-fifa-card border border-fifa-border flex items-center justify-center text-3xl group-hover:border-gold-400/30 group-hover:shadow-glow-gold transition-all duration-300">
            🎯
          </div>
          <h3 className="text-gold-400 text-sm font-semibold tracking-wide mb-2">Dê palpites</h3>
          <p className="text-fifa-text text-xs leading-relaxed">
            Faça seus palpites antes dos jogos e acompanhe seus acertos.
          </p>
        </div>
        <div className="text-center group">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-fifa-card border border-fifa-border flex items-center justify-center text-3xl group-hover:border-gold-400/30 group-hover:shadow-glow-gold transition-all duration-300">
            📊
          </div>
          <h3 className="text-gold-400 text-sm font-semibold tracking-wide mb-2">Ganhe pontos</h3>
          <p className="text-fifa-text text-xs leading-relaxed">
            Ranking automático com resultados em tempo real via ESPN.
          </p>
        </div>
      </div>
    </div>
  );
}
