# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All scripts prepend `NODE_OPTIONS` via `node-compat.cjs` for Node.js compatibility.

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run Vitest test suite
npm run setup        # Install deps + prisma generate + db migrate
npm run db:reset     # Reset database (destructive)
```

Run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

## Architecture

**UIGen** is an AI-powered React component generator with live preview. Users describe UI in chat; the AI writes files into a virtual (in-memory) file system; the preview renders those files in the browser via ES module import maps.

### Data Flow

1. User types in `ChatInterface` → `ChatContext` calls `/api/chat` with the serialized virtual FS
2. API route (`src/app/api/chat/route.ts`) streams responses using Vercel AI SDK's `streamText` with two tools: `str_replace_editor` and `file_manager`
3. Tool calls stream back and are handled in `FileSystemContext.handleToolCall()`, which mutates the in-memory FS
4. `PreviewFrame` transforms JSX files via Babel standalone and generates an HTML page with an ES module import map (React from esm.sh, local files as blob URLs)

### Virtual File System

`src/lib/file-system.ts` is a pure in-memory tree — no disk I/O. Files are serialized to JSON and stored in the `Project.data` column (SQLite via Prisma). The AI operates on files exclusively through the two tool interfaces (`str_replace_editor`, `file_manager`).

Every generated project must have `/App.jsx` as its root entry point. Components use `@/` as an import alias (resolves to the FS root, not `src/`).

### AI Provider

`src/lib/provider.ts` exposes `getLanguageModel()`:
- Returns `claude-haiku-4-5` (Anthropic) if `ANTHROPIC_API_KEY` is set
- Falls back to a `MockLanguageModel` that simulates 4-step generation with placeholder components — useful for development without an API key

The system prompt (`src/lib/prompts/generation.tsx`) instructs the AI to use Tailwind for all styling and never produce raw HTML files.

### AI Tools

| Tool | File | Commands |
|------|------|----------|
| `str_replace_editor` | `src/lib/tools/str-replace.ts` | `view`, `create`, `str_replace`, `insert` |
| `file_manager` | `src/lib/tools/file-manager.ts` | `rename`, `delete` |

### Authentication

JWT cookies via `jose` library (`src/lib/auth.ts`). Sessions last 7 days. Server actions in `src/actions/` handle sign-up/in/out and project CRUD. `userId` is optional on `Project`, enabling anonymous projects.

Anonymous work is tracked in `sessionStorage` (`src/lib/anon-work-tracker.ts`) and can be claimed after sign-up.

### State Management

Two React contexts wrap the entire app:
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — owns the in-memory FS instance and processes tool call results
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK's `useChat`, serializes the FS into each request body

### Database

Prisma + SQLite (`prisma/schema.prisma`). Two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON strings. Prisma client output is at `src/generated/prisma`.

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | No | Uses mock provider |
| `JWT_SECRET` | No | `"development-secret-key"` |

## JSX Preview Pipeline

`src/lib/transform/jsx-transformer.ts`:
1. `transformJSX()` — Babel transforms JSX/TSX to plain JS, collects CSS imports
2. `createImportMap()` — Builds browser import map: React 19 from esm.sh, local files as blob URLs, unknown packages resolved via esm.sh
3. `createPreviewHTML()` — Wraps everything in an HTML page with Tailwind CDN, error boundary, and dynamic `import()` of App.jsx
