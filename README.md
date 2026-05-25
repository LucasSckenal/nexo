# Nexo

Plataforma de gestão e colaboração de equipes — workspace com Kanban, backlog, gestão de clientes e membros, análises e integração com IA.

Construído com **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4** e **Firebase**.

## Funcionalidades

- **Kanban** — quadro de tarefas com colunas customizáveis, busca e layout responsivo
- **Backlog** — gestão de itens pendentes e priorização
- **Clientes** — cadastro e acompanhamento de clientes
- **Membros / Convites** — gestão de equipe e onboarding por convite
- **Análises** — dashboards e métricas com Recharts
- **Perfil & Configurações** — preferências do usuário e do workspace
- **Notificações em tempo real** — painel com foto do remetente e suporte a imagens
- **Editor rico** — TipTap para descrições e comentários
- **IA integrada** — geração de tarefas e polimento de texto via Google Gemini
- **Tema claro/escuro** — alternância via `ThemeContext`
- **Integração com GitHub** — via `GitHubContext`

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Ícones | Phosphor Icons, Lucide React |
| Editor | TipTap 3 |
| Charts | Recharts |
| Backend | Firebase (Auth, Firestore, Storage) |
| IA | Google Generative AI (Gemini) |
| Datas | date-fns |
| Linguagem | TypeScript 5 |
| Package manager | pnpm |

## Estrutura

```
app/
├── (auth)/login/          # Tela de autenticação
├── (main)/                # Área autenticada
│   ├── analises/
│   ├── backlog/
│   ├── clientes/
│   ├── configuracoes/
│   ├── convite/
│   ├── kanban/
│   ├── members/
│   ├── membros/
│   └── perfil/
├── api/
│   ├── generate-task/     # Geração de tarefa via Gemini
│   ├── polish-text/       # Polimento de texto via Gemini
│   └── webhooks/
├── components/
│   ├── backlog/
│   ├── modals/
│   └── ui/
├── context/               # ThemeContext, GitHubContext, DataContext
├── hook/
├── lib/                   # firebase, notifications, taskScheduler
└── layout.tsx
```

## Como rodar

### Pré-requisitos

- Node.js 20+
- pnpm 10+
- Conta Firebase com Auth, Firestore e Storage habilitados
- Chave de API do Google Gemini

### Instalação

```bash
pnpm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..."

GEMINI_API_KEY="..."
```

### Desenvolvimento

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Build de produção

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

## Deploy

Recomendado: [Vercel](https://vercel.com). Configure as mesmas variáveis de ambiente no painel do projeto antes de fazer o deploy.

## Licença

Privado — todos os direitos reservados.
