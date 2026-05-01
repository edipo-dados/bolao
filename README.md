# ⚽ Bolão Futebol

Plataforma completa para gerenciamento de bolões de futebol com regras configuráveis, rankings automáticos e integração com API de futebol.

## 🧱 Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** Next.js 15 + React 19 + Tailwind CSS
- **API de Futebol:** API-Football via RapidAPI
- **Deploy:** Vercel (frontend) + Supabase (banco de dados)

## 🚀 Setup Local

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou conta no Supabase)
- Conta no RapidAPI (opcional, para dados reais)

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd bolao-futebol

# Instalar dependências
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar banco de dados

```bash
cd backend
cp .env.example .env
# Edite o .env com sua DATABASE_URL
```

### 3. Rodar migrations e seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Iniciar servidores

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

### Credenciais de teste

- **Admin:** admin@bolao.com / admin123
- **Usuário:** user@bolao.com / user123

## 🌐 Deploy em Produção

### Supabase (Banco de Dados)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie a connection string do PostgreSQL
3. Configure no `.env` do backend

### Vercel (Frontend)

1. Conecte o repositório no [Vercel](https://vercel.com)
2. Configure o root directory como `frontend`
3. Adicione a variável `NEXT_PUBLIC_API_URL` apontando para o backend

### Backend (Railway/Render)

1. Deploy o backend em Railway, Render ou similar
2. Configure as variáveis de ambiente
3. Execute `npx prisma migrate deploy` no build

## 📐 Arquitetura

```
bolao-futebol/
├── backend/
│   ├── prisma/           # Schema e migrations
│   └── src/
│       ├── auth/         # Autenticação JWT
│       ├── users/        # Gerenciamento de usuários
│       ├── pools/        # Bolões (CRUD + participação)
│       ├── leagues/      # Campeonatos
│       ├── matches/      # Jogos
│       ├── predictions/  # Palpites
│       ├── ranking/      # Cálculo de ranking
│       ├── football/     # Integração API-Football
│       ├── admin/        # Painel administrativo
│       └── prisma/       # Módulo Prisma
├── frontend/
│   └── src/
│       ├── app/          # Páginas (App Router)
│       ├── components/   # Componentes reutilizáveis
│       ├── contexts/     # Context API (Auth)
│       └── lib/          # API client
└── README.md
```

## ⚙️ Funcionalidades

- ✅ Cadastro/Login com JWT
- ✅ Recuperação de senha
- ✅ Criar/editar/excluir bolões
- ✅ Bolões públicos e privados (com link de convite)
- ✅ Aprovação de participantes pelo admin
- ✅ Regras de pontuação configuráveis
- ✅ Critérios de desempate configuráveis
- ✅ Palpites com bloqueio após início do jogo
- ✅ Ranking automático por bolão
- ✅ Exploração de bolões públicos com filtros
- ✅ Integração com API-Football (RapidAPI)
- ✅ Sincronização automática via cron job
- ✅ Painel de administração (super admin)
- ✅ Logs de atividade
- ✅ API REST documentada com Swagger

## 📏 Regras Padrão

| Tipo | Pontos |
|------|--------|
| Placar exato | 5 |
| Acertar vencedor | 3 |
| Acertar empate | 3 |
| Errar tudo | 0 |

### Critérios de Desempate

1. Mais placares exatos
2. Mais acertos de vencedor
3. Ordem de inscrição

## 🔑 Variáveis de Ambiente

### Backend

| Variável | Descrição |
|----------|-----------|
| DATABASE_URL | Connection string PostgreSQL |
| JWT_SECRET | Chave secreta para JWT |
| JWT_EXPIRATION | Tempo de expiração do token |
| RAPIDAPI_KEY | Chave da RapidAPI |
| RAPIDAPI_HOST | Host da API-Football |
| FRONTEND_URL | URL do frontend (CORS) |
| PORT | Porta do servidor |

### Frontend

| Variável | Descrição |
|----------|-----------|
| NEXT_PUBLIC_API_URL | URL da API backend |
