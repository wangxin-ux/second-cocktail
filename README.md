# second

A mobile-first cocktail experience: share a few profile signals, receive a signature drink, and join a live five-minute one-to-one social match.

## Live site

https://xinxinyuntu.top/

## Live matching

- A temporary first-party cookie keeps one device's profile for 30 minutes.
- Visitors who enter Social Talk are paired primarily with other active matchers.
- After 90 seconds, an active matcher can approach an available visitor on the cocktail result page.
- The approached visitor accepts or declines; acceptance starts a shared server-timed five-minute countdown and reveals the meeting location.
- Reloading or briefly leaving the page restores the same match and countdown during the reconnect grace period.
- After the talk, both visitors complete an impression survey and exchange a generated cocktail recommendation.

## Local development

```bash
npm ci
npm run dev
```

Open http://localhost:3000/.

The production server uses `server.mjs` to serve the exported Next.js site and the `/ws` real-time matching endpoint.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

Optional isolated WebSocket checks are available in `scripts/load-match-test.mjs` and `scripts/security-smoke-test.mjs`.
