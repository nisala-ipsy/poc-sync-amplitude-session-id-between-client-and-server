# Amplitude server–client session sync

Prototype for **Approach A**: the server owns the Amplitude session id. Both the browser SDK and the Node SDK read the same `amp_ident` cookie, so server- and client-side events share one session.

## How it works

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │  request (may carry amp_ident cookie)
       ▼
┌──────────────────────────────────────────────────────────────┐
│  proxy.ts  (runs before every page / API request)            │
│                                                              │
│  decode cookie → touch(lastActivity) or createIdentity()     │
│  rewrite cookie on request headers + Set-Cookie on response  │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│  SSR (page.tsx)     │              │  API (/api/event)   │
│  serverIdentity()   │              │  trackServer()      │
│  reads amp_ident    │              │  reads amp_ident    │
└──────────┬──────────┘              └──────────┬──────────┘
           │                                    │
           │         amp_ident cookie           │
           │    deviceId ~ sessionId ~ lastActivity
           │                                    │
           ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│  @amplitude/        │              │  @amplitude/        │
│  analytics-node     │              │  analytics-browser  │
│  session_id from    │              │  init(sessionId     │
│  cookie stamp       │              │  from cookie)       │
└──────────┬──────────┘              └──────────┬──────────┘
           │                                    │
           └──────────────┬─────────────────────┘
                          ▼
                   ┌─────────────┐
                   │  Amplitude  │
                   │  (same      │
                   │  session_id)│
                   └─────────────┘

Client-only path (after hydration):

  initAmplitude()
       │
       ├─ read amp_ident → init browser SDK with sessionId + deviceId
       │
       └─ before plugin: onSessionIdChanged → write amp_ident back
          (keeps cookie in sync when the SDK rotates its session)
```

### Session expiry

Expiry is **not** delegated to either SDK alone. Shared logic in `lib/amplitude/identity.ts` uses a sliding window: a session expires only when **neither** the server nor the client has been active within `SESSION_TIMEOUT_MS` (30 min).

| Actor | What updates `lastActivity` |
|-------|----------------------------|
| Proxy | Every incoming request (`touch`) |
| Browser SDK | `onSessionIdChanged` hook writes cookie |

The proxy mints the cookie on first visit, so even the initial SSR pass already has a valid session id — no client round-trip required.

### Cookie

| Field | Purpose |
|-------|---------|
| `deviceId` | Stable device identifier (UUID) |
| `sessionId` | Amplitude convention: epoch-ms when the session started |
| `lastActivity` | Drives the sliding expiry window |

Cookie name: `amp_ident`. Not `httpOnly` — the browser SDK must read the same values the server uses.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The page shows the current identity from SSR; use the buttons to fire client or server events.

Set `NEXT_PUBLIC_AMPLITUDE_API_KEY` (and optionally `AMPLITUDE_API_KEY` for server-only) in `.env.local`.

## Key files

| File | Role |
|------|------|
| `proxy.ts` | Mint / slide identity cookie on every request |
| `lib/amplitude/identity.ts` | Shared types, encode/decode, expiry logic |
| `lib/amplitude/server.ts` | Node SDK — stamps `session_id` from cookie |
| `lib/amplitude/client.ts` | Browser SDK — init from cookie, sync changes back |
| `app/api/event/route.ts` | Example server-side track call |
