'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatePoolPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [leagueId, setLeagueId] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixName, setPixName] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    api.getLeagues().then(setLeagues).catch(console.error);
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const pool = await api.createPool({
        name, description, type, leagueId,
        pixKey: pixKey || undefined,
        pixName: pixName || undefined,
        entryFee: entryFee || undefined,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
      });
      router.push(`/pools/${pool.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-white mb-6">Criar Bolão</h1>

      <div className="space-y-6">
        {error && (
          <div className="bg-accent-red/10 text-accent-red p-3 rounded-lg text-sm border border-accent-red/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info básica */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-widest">Informações</h2>

            <div>
              <label htmlFor="name" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Nome do Bolão</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required minLength={3} placeholder="Ex: Bolão do Brasileirão 2026" />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Descrição (opcional)</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} placeholder="Descreva seu bolão..." />
            </div>

            <div>
              <label htmlFor="league" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Campeonato</label>
              <select id="league" value={leagueId} onChange={(e) => setLeagueId(e.target.value)} className="input-field" required>
                <option value="">Selecione um campeonato</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} {league.country ? `(${league.country})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-fifa-text mb-2 uppercase tracking-wide">Tipo</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="type" value="PUBLIC" checked={type === 'PUBLIC'} onChange={() => setType('PUBLIC')} className="accent-gold-400" />
                  <span className="text-fifa-light">🌐 Público</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="type" value="PRIVATE" checked={type === 'PRIVATE'} onChange={() => setType('PRIVATE')} className="accent-gold-400" />
                  <span className="text-fifa-light">🔒 Privado</span>
                </label>
              </div>
              <p className="text-xs text-fifa-muted mt-1">
                {type === 'PUBLIC' ? 'Qualquer pessoa pode encontrar e solicitar entrada' : 'Apenas quem tiver o link de convite pode solicitar entrada'}
              </p>
            </div>
          </div>

          {/* Pagamento PIX */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-widest">Pagamento (opcional)</h2>
            <p className="text-xs text-fifa-muted">Configure o PIX para receber pagamentos dos participantes.</p>

            <div>
              <label htmlFor="entryFee" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Valor da entrada</label>
              <input id="entryFee" type="text" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="input-field" placeholder="Ex: R$ 20,00" />
            </div>

            <div>
              <label htmlFor="pixKey" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Chave PIX</label>
              <input id="pixKey" type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="input-field" placeholder="CPF, email, telefone ou chave aleatória" />
            </div>

            <div>
              <label htmlFor="pixName" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Nome do titular</label>
              <input id="pixName" type="text" value={pixName} onChange={(e) => setPixName(e.target.value)} className="input-field" placeholder="Nome que aparece no PIX" />
            </div>
          </div>

          {/* Contato */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-widest">Contato do organizador</h2>
            <p className="text-xs text-fifa-muted">Informe pelo menos um contato para os participantes.</p>

            <div>
              <label htmlFor="contactPhone" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">WhatsApp / Telefone</label>
              <input id="contactPhone" type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input-field" placeholder="(11) 99999-9999" />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-xs font-medium text-fifa-text mb-1.5 uppercase tracking-wide">Email de contato</label>
              <input id="contactEmail" type="text" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input-field" placeholder="contato@email.com" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Criando...' : 'Criar Bolão'}
          </button>
        </form>
      </div>
    </div>
  );
}
