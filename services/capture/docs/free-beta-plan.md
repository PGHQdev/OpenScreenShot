# Free beta implementation plan

Approved direction: free hosted URL → preview → download, desktop/mobile, anonymous limits and minimal disclosed measurement. No billing or required account. Architectural addition to the existing pilot. Keep changes within services/capture; no unrelated edits or extension privacy changes.

The existing hostname allowlist is retained for every browser request. Public arbitrary-host capture is NOT authorized by merely checking a hostname's DNS once; DNS rebinding and resource/redirect enforcement need an enforceable egress boundary. Ship a reviewable supported-site preview while that launch prerequisite remains unresolved. Do not claim general public URL support.

- [x] Add cookie-scoped anonymous capture endpoints and isolated job ownership; atomic per-network/per-browser admission caps alongside current global cap. Test cross-owner access, CSRF, quotas, idempotency and kill switch.
- [x] Add anonymous aggregate measurement: started, successful, failed and first download request per job; returning-browser activity via a 30-day pseudonymous cookie. No URL in metrics; operational job URL retains existing 24h expiration. Summarize through operator-only endpoint.
- [x] Add branded standalone page, responsive form, visible progress/error states, preview and download, honest hosted privacy disclosure, supported-domain notice. Adapt input-first hierarchy observed in Firecrawl via Mobbin: https://mobbin.com/sites/sections/7374e232-3232-4f76-bf3e-a95a4ee73b8a . No copied illustrations/layout decoration.
- [x] Verify critical tests, typecheck/build, mobile/desktop interaction, and browser accessibility. Deploy supported-site preview only after review. Document exact general-launch blocker.

Activation hypothesis: first successful download request; return usage tracked separately, not assumed equivalent to willingness to pay. Lenny's activation guidance informed milestone choice: https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate . No external analytics provider.

Constraints: 5 admissions/day/browser and per network address; existing global 20/day and active5 remain. Up to3attempts/job, bounded45sec response deadline; these cap admission/attempts, not exact dollar billing since provider cancellation isn't guaranteed. IP is daily HMACed and never stored raw. Signed session unnecessary: opaque random256bit cookie is a bearer capability; HMAC its storage representation. No cross-origin API, only JSON same-origin writes. CSRF origin validation on all mutations. Cookies Secure, HttpOnly, SameSite=Strict; 30d expiry. Quota identity fields expire with 24-hour jobs; aggregate daily counts 90d; browser pseudonym30d. No URLs/cookies/provider content in aggregate tables.
