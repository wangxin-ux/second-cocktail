# Production two-user smoke test

Run after HTTPS, migrations, both processes, and the reverse proxy are live. Use two distinct browsers or phones. Do not record cookies, tokens, passwords, or full private profiles.

- [ ] Homepage loads over HTTPS with no fatal console errors.
- [ ] Both users complete the 18+ gate, Profile, Spirit, Flavor, cocktail generation, and recipe view.
- [ ] Both enter Second Act, review consent, and create a Tonight Session.
- [ ] User A and User B each reach Waiting and receive a real candidate.
- [ ] Verify Pass, another candidate, Accept, mutual acceptance, and the same configured Meeting Area.
- [ ] Both click “我们找到了” / “We found each other” and see the five-minute Connection.
- [ ] Refresh recovery works; a brief disconnect/reconnect remains usable inside the presence grace period.
- [ ] Verify Time’s Up, Continue intent, and mutual rematch/continuation.
- [ ] Verify End Tonight clears browser state and the old server session is rejected.
- [ ] Submit a Report and verify a `recorded` report is persisted and operationally reviewable.
- [ ] Check mobile width, Chinese and English, Socket.IO reconnect, and no console fatal errors.
