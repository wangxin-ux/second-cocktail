# SECOND

Production deployment guide for the Second realtime matching app.

## Architecture

`Browser → HTTPS reverse proxy → Next.js (127.0.0.1:3000) + Socket.IO realtime service (127.0.0.1:3002) → PostgreSQL`

The browser uses the same public origin for pages, APIs, and `/socket.io/`. The realtime build is selected with `NEXT_PUBLIC_MATCH_MODE=realtime`; it does not fall back to demo matching if PostgreSQL or Socket.IO is unavailable.

## Requirements

- Node.js 22 LTS (this repository requires `>=22 <23`; see `.nvmrc`)
- npm, PostgreSQL, a reverse proxy with WebSocket support, a domain, and HTTPS

## Environment variables

Copy `.env.example` to `.env.production` on the server and replace every placeholder. Do not commit it.

| Variable | Required | Example | Exposure / purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://USER:PASSWORD@127.0.0.1:5432/second` | Server-only PostgreSQL connection |
| `APP_ORIGIN` | Yes | `https://YOUR_DOMAIN` | Server-only exact allowed Socket.IO origin |
| `VENUE_MEETING_AREAS` | Yes | JSON array of configured public areas | Server-only production venue configuration |
| `NEXT_PUBLIC_MATCH_MODE` | Yes | `realtime` | Public build setting; selects real matching |
| `REALTIME_PORT` | No | `3002` | Server-only realtime listener (defaults to 3002) |
| `REALTIME_HOST` | No | `127.0.0.1` | Server-only listener host (defaults to loopback) |
| `DATABASE_SSL` | No | `true` | Server-only: enables database TLS |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | No | `false` only when provider requires it | Server-only TLS exception; default verification is on |
| `COCKTAIL_GENERATION_MODE` | No | `local` | Server-only; defaults to local generation |
| `OPENAI_API_KEY` | Only with OpenAI generation | set in server environment | Server-only secret; never use `NEXT_PUBLIC_` |

Only `NEXT_PUBLIC_` variables are bundled to the browser. Do not expose credentials, provider keys, or venue operations settings this way.

## Install, migrate, build, start

```bash
git clone <YOUR_GITHUB_REPOSITORY>
cd second-cocktail
npm ci
cp .env.example .env.production
# edit .env.production with real production values
npm run db:migrate
npm run build
```

Run these two processes under a service manager:

```bash
npm run start
npm run start:realtime
```

Development commands are separate:

```bash
npm run dev
npm run dev:realtime
npm run db:migrate:dev
```

## Database migrations

`npm run db:migrate` creates schema objects from an empty PostgreSQL database and records applied SQL in `schema_migrations`. It is safe to run again: recorded files are skipped. Run it as a deployment step, not automatically at web-server startup.

## Reverse proxy

Use [deploy/nginx/second.example.conf](deploy/nginx/second.example.conf) as a routing reference only. It proxies `/socket.io/` to realtime and all other paths to Next.js. The proxy must forward `Upgrade` and `Connection: upgrade` for WebSockets. Configure HTTPS and the real domain in deployment, not in the example file.

## Venue configuration

`VENUE_MEETING_AREAS` is a JSON array of safe, public, easy-to-find areas with `id`, `label`, and `labelZh`. Production refuses to start realtime without it. Development may use visibly marked `DEV —` placeholders.

Do not configure toilets, parking areas, isolated exits, private rooms, or other unsafe/private locations. Venue operations must provide final labels before launch.

## Health checks

- `GET /api/health` returns `{ status: "ok", service: "next" }` only when Next.js can reach PostgreSQL; otherwise HTTP 503 with a non-sensitive degraded response.
- `GET http://127.0.0.1:3002/health` returns `{ status: "ok", service: "realtime" }` for process/port monitoring.

## Data and operational boundaries

- Tonight Session TTL: 12 hours; its cookie has the same max age. End Tonight invalidates the server session and clears the cookie.
- Queue TTL: 12 hours; presence grace: 60 seconds; candidate TTL: 90 seconds; connection duration: 5 minutes; exclusions: 12 hours.
- Reports are persisted in PostgreSQL as `recorded`. This does not mean venue staff were alerted or a moderation team exists.
- No scheduled deletion/retention job is included. The operator must define report retention, access, review ownership, and safety escalation before public launch.

Logs are limited to operational transitions and non-sensitive errors. They must not contain raw cookies, session tokens/hashes, database URLs, passwords, or full profile payloads.

## GitHub Pages demo

The GitHub Pages workflow is intentionally isolated as a legacy demo. It builds with `NEXT_PUBLIC_MATCH_MODE=demo`, statically exports `out/`, and cannot use production PostgreSQL or Socket.IO. GitHub Pages is not the production realtime deployment target.

## Validation

```bash
npm run lint
npm run typecheck
npm run test:realtime
npm run build
```

For the ordered handoff, see [DEPLOYMENT.md](DEPLOYMENT.md). After deployment, follow [docs/PRODUCTION_SMOKE_TEST.md](docs/PRODUCTION_SMOKE_TEST.md).
