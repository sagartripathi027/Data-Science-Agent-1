# Workspace

## Overview

pnpm workspace monorepo using TypeScript. AI Data Science Agent web application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)
- **Frontend**: React + Vite, Tailwind CSS, Recharts, Framer Motion

## Application

An Autonomous AI Data Science Agent that allows users to:
1. Upload CSV/JSON datasets
2. Create named analysis sessions
3. Chat with an AI that performs full data science workflows
4. See structured responses with sections and inline charts

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── ds-agent/           # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/ # OpenAI client + utilities
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `datasets` — uploaded dataset metadata + raw data
- `sessions` — analysis sessions linking users to datasets
- `messages` — chat history (user + assistant messages with sections and charts)

## API Routes

All routes under `/api`:

- `POST /api/analysis/upload` — upload CSV/JSON dataset (multipart)
- `POST /api/analysis/sessions` — create analysis session
- `GET /api/analysis/sessions` — list all sessions
- `GET /api/analysis/sessions/:id` — get session
- `DELETE /api/analysis/sessions/:id` — delete session
- `POST /api/analysis/sessions/:id/query` — AI agent query
- `GET /api/analysis/sessions/:id/messages` — message history

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
