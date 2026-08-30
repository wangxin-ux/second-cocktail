# Second deployment runbook

This runbook does not select a VPS provider, process manager, DNS provider, or certificate authority.

1. **Clone.** Clone the approved GitHub repository to the Linux server.
2. **Node.** Install Node.js 22 LTS and verify it satisfies `>=22 <23`.
3. **PostgreSQL.** Create a dedicated database and least-privilege application account. Do not reuse a development dump.
4. **Environment.** Copy `.env.example` to `.env.production`, restrict permissions, and set real `DATABASE_URL`, `APP_ORIGIN`, `VENUE_ROOT_DOMAIN`, `VENUE_MEETING_AREAS`, and `NEXT_PUBLIC_MATCH_MODE=realtime`. Each bar uses one direct subdomain of `VENUE_ROOT_DOMAIN`; matching is isolated by that subdomain.
5. **Install.** Run `npm ci`.
6. **Migration.** Run `npm run db:migrate`; retain its output in the deployment log.
7. **Build.** Run `npm run build` after setting production public environment values.
8. **Start Next.** Start `npm run start` under a process manager behind the proxy on port 3000.
9. **Start realtime.** Start `npm run start:realtime`; it listens on loopback port 3002 unless overridden.
10. **Reverse proxy.** Follow `deploy/nginx/second.example.conf`: `/socket.io/` to realtime and `/` to Next, preserving WebSocket Upgrade headers.
11. **HTTPS.** Configure the root domain and every active bar subdomain in DNS, Nginx, and the certificate. `APP_ORIGIN` is the root HTTPS origin and `VENUE_ROOT_DOMAIN` is its hostname.
12. **Health check.** Check public `/api/health` and local `http://127.0.0.1:3002/health`.
13. **Two-phone smoke test.** Complete [docs/PRODUCTION_SMOKE_TEST.md](docs/PRODUCTION_SMOKE_TEST.md) before venue launch.

Keep the Next and realtime processes supervised with rotated logs. Keep secrets outside Git, restrict database access, and assign report-review and on-site safety escalation ownership before opening to guests.
