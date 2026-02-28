# Pitfalls Research

**Domain:** Multi-tenant trainer/trainee workout tracking PWA with smartwatch integration
**Researched:** 2026-02-28
**Confidence:** MEDIUM-HIGH (iOS/PWA and RLS pitfalls verified against official sources; Garmin-specific details partially verified via developer docs; data model and offline queue pitfalls synthesized from community issues + official library docs)

---

## Critical Pitfalls

### Pitfall 1: HealthKit Has No Web API — Building PWA HealthKit Integration Directly

**What goes wrong:**
Developers assume they can access Apple Health / HealthKit from a PWA or web app via some kind of OAuth flow, REST endpoint, or Web Bluetooth. They discover this is impossible only after significant planning or code has been written.

**Why it happens:**
HealthKit's capability to read iPhone sensor data makes it feel like a cloud service. Other fitness APIs (Garmin, Fitbit, Strava) are cloud-accessible. Developers extrapolate the pattern incorrectly to Apple Health.

**How to avoid:**
Accept from day one that Apple Health data is stored locally on the iPhone and has no web API. The only viable approach is a companion native iOS app (React Native with Expo custom dev client + `react-native-health` or Swift) that reads HealthKit on-device and POSTs the data to your backend. This companion app must:
- Use `expo prebuild` (NOT Expo Go — HealthKit requires native entitlements unavailable in Expo Go)
- Add `NSHealthShareUsageDescription` to Info.plist
- Enable the HealthKit capability in the Xcode project (or via EAS Build config)
- Be submitted to the App Store (or TestFlight for v1)

**Warning signs:**
- Any plan that says "read Apple Watch data from the PWA" without mentioning a companion app
- Searching for "HealthKit web API" or "HealthKit REST endpoint"
- Confusion about why Apple Health OAuth doesn't appear in Apple Developer docs

**Phase to address:** Phase 6 (Smartwatch Integration). Must be established before any HealthKit work begins. Terra API is the only path to avoid building the companion app entirely.

---

### Pitfall 2: Garmin Developer Program Approval — Hard Dependency With Unknown Timeline

**What goes wrong:**
Development proceeds assuming Garmin API access will be available. The Garmin Connect Developer Program requires a formal business application, review by Garmin staff, and subsequent integration call. If this is not started 4-6 weeks before smartwatch integration work begins, v1 can be blocked entirely.

**Why it happens:**
Developers compare Garmin to Strava (permissive, self-service OAuth signup) and assume a similar process. Garmin is fundamentally a business-to-business program with manual review.

**How to avoid:**
Apply to the Garmin Connect Developer Program (https://developer.garmin.com/gc-developer-program/) on the first day of the project, not when smartwatch integration begins. The review takes ~2 business days for initial response, but a full integration typically takes 1-4 weeks after approval. While waiting for approval:
- Build the OAuth callback handler UI in the PWA
- Mock the webhook endpoint with test fixture data
- Store the token structure in the DB schema
- Swap in real credentials when approval arrives

If Garmin approval is at risk of blocking v1, use Terra API (https://tryterra.co) as a fallback — it provides a unified abstraction over Garmin, Apple Health, and 20+ other platforms without requiring individual vendor approval.

**Warning signs:**
- Garmin integration work starts without confirmed program access
- No Terra API fallback plan exists
- Smartwatch phase is scheduled without confirmed Garmin credentials

**Phase to address:** Before Phase 1 (Foundation). Apply on project kickoff. Garmin credential status should be a pre-condition for starting Phase 6, not discovered mid-phase.

---

### Pitfall 3: iOS PWA Push Notifications — Home Screen Install Is Required, Most Users Won't Do It

**What goes wrong:**
Web push notifications are planned as a key engagement feature (workout reminders), but on iOS they only work for PWAs installed to the home screen in standalone mode. Most iOS users never complete the multi-step "Add to Home Screen" flow. Reachable audience for iOS push is 10-15x smaller than native app push.

**Why it happens:**
Push notifications work on Android PWAs without installation. Developers test on Android and assume iOS behavior is equivalent. iOS support only arrived in iOS 16.4 and has strict constraints that differ from the web push spec elsewhere.

**How to avoid:**
- Require `display: "standalone"` in the PWA manifest (push does NOT work with `browser` mode on iOS)
- Build a prominent, contextual "Add to Home Screen" prompt with step-by-step instructions — iOS does not allow browser-initiated install prompts; you must guide users manually
- Never rely on push notifications as the only workout reminder mechanism; implement in-app reminder as fallback
- Test push specifically on iOS with an installed PWA before treating notifications as done
- On iOS 16.4+, push permission must be triggered inside a user gesture (tap), not at page load

**Warning signs:**
- Push notification testing done only on Android or desktop
- No "Add to Home Screen" education flow in the onboarding
- Notification feature listed as complete without iOS PWA install verification

**Phase to address:** Phase 4 (PWA + Offline). iOS push must be tested with a real installed PWA during this phase. Document the install funnel explicitly.

---

### Pitfall 4: iOS Safari Evicts PWA Storage After Inactivity

**What goes wrong:**
Trainees who do not open the app for 2-3 weeks return to find their cached workout plan, exercise library, and offline set logs gone. The app behaves like a first-time install. Set logs that were queued while offline and not yet synced are permanently lost.

**Why it happens:**
Safari uses a "least recently used" eviction policy and will delete an origin's storage under storage pressure or after extended inactivity. For PWAs NOT installed to home screen, the 7-day inactivity rule removes all script-writable storage. Even home-screen-installed PWAs are subject to eviction under storage pressure. The 50MB cache storage limit accelerates this.

**How to avoid:**
- Enforce "Add to Home Screen" install during onboarding — installed PWAs have their own "days of use" counter separate from Safari's 7-day rule
- Never cache large exercise demo videos in Cache Storage (50MB limit evaporates quickly with video)
- Implement an "offline queue health check" on app open: detect any pending IndexedDB mutations and sync them before the service worker cache is consulted
- Show the trainee when the last plan sync occurred and offer a manual refresh button
- For offline set logs not yet synced: write to IndexedDB immediately on mutation, do not rely solely on TanStack Query's paused mutation state (which is also evictable)

**Warning signs:**
- No "last synced" timestamp shown to the user
- Exercise demo videos being cached in Cache Storage
- Users reporting empty app state after holiday breaks

**Phase to address:** Phase 4 (PWA + Offline). Storage budget and eviction handling must be designed here, not retrofitted later.

---

### Pitfall 5: TanStack Query Offline Mutation Queue Silently Fails After Page Refresh

**What goes wrong:**
Trainees log several sets offline, close the app, reopen it later, and find the sets were never saved. No error is shown. The mutations were queued but never executed after the page reload.

**Why it happens:**
TanStack Query's `persistQueryClient` persists mutation state (parameters) to IndexedDB. However, `mutationFn` (a JavaScript function) cannot be serialized. After a page reload, hydrated mutations have state but no function to call — they silently fail with "No mutationFn found." This is a known TanStack Query issue (GitHub #3460, #5847) that requires explicit setup.

**How to avoid:**
At app startup, before rendering:
1. Call `queryClient.setMutationDefaults(['logSet'], { mutationFn: ... })` for every mutation used in offline contexts
2. Call `queryClient.resumePausedMutations()` after confirming the user session is valid
3. Register `online` event listener to trigger `resumePausedMutations()` on reconnect
4. Use idempotent mutations: generate a client-side UUID for each `set_log` before submitting; use `ON CONFLICT (id) DO NOTHING` in Postgres to prevent duplicates on retry

This setup is easy to forget when adding new offline-capable mutations. Document it prominently in the codebase and make it a code review checklist item.

**Warning signs:**
- Offline mutation queue not tested with a page reload between going offline and coming back online
- `setMutationDefaults` not called at app startup
- `resumePausedMutations` only called on the `online` event but not at app startup

**Phase to address:** Phase 4 (PWA + Offline). The mutation default setup is the foundational offline contract — treat it as a first-class feature, not an afterthought.

---

### Pitfall 6: Supabase RLS Not Enabled on Every Table That Exposes Data

**What goes wrong:**
A new table is added during development. The default Supabase state is RLS disabled. The developer writes the queries and tests them in the SQL Editor (which bypasses RLS). They ship. Any authenticated user can read every row in that table through the Supabase client SDK, leaking cross-trainer data.

**Why it happens:**
RLS defaults to OFF in Postgres. Supabase's SQL Editor and Supabase Studio run as postgres superuser, bypassing RLS entirely. Development feels correct, but the security model only applies in production client SDK calls.

**How to avoid:**
- Enable RLS on every table as part of the migration that creates it — never as a separate step
- Add a policy immediately when enabling RLS, or create a deny-all default: `CREATE POLICY "default_deny" ON table_name FOR ALL USING (false);`
- Test RLS using `set session role authenticated; set request.jwt.claims = '{"sub": "[user-id]"}';` in psql to simulate actual client behavior
- Never use the Supabase SQL Editor as the sole test of data visibility

**Warning signs:**
- Developers saying "I tested the query and it works" without specifying they tested via the client SDK
- New tables added in migrations without corresponding RLS enable + policy
- `set_logs` or `health_events` queryable without a trainee-specific where clause

**Phase to address:** Phase 1 (Foundation). Establish the RLS-first convention before any data tables are created. All future phases inherit this discipline.

---

### Pitfall 7: RLS Policy Subqueries Execute Per-Row, Destroying Query Performance

**What goes wrong:**
At small scale, trainer progress queries and trainee workout views feel fast. At 10-50 trainees per trainer with months of history, queries on `set_logs` become unacceptably slow (seconds instead of milliseconds). The culprit is RLS policies with subqueries that execute once per row.

**Why it happens:**
A policy like `USING (trainee_id IN (SELECT id FROM trainees WHERE trainer_id = auth.uid()))` runs that subquery against every row scanned in the `set_logs` table. With thousands of rows, this is thousands of subquery executions. Developers don't notice at dev time because they have 10 rows.

**How to avoid:**
- Wrap `auth.uid()` in a SELECT to allow the optimizer to cache it: `USING (trainee_id IN (SELECT id FROM trainees WHERE trainer_id = (SELECT auth.uid())))`
- Add indexes on every column referenced in RLS policies: `set_logs(trainee_id)`, `trainees(trainer_id)`, `trainees(auth_uid)`
- Index `set_logs(trainee_id, exercise_id, logged_at)` as a composite for progress chart queries — this is the hottest query in the trainer dashboard
- Use `EXPLAIN ANALYZE` with simulated RLS (via `set role authenticated`) to measure policy overhead before deploying
- Supplement RLS with explicit filter clauses in application queries (`.eq('trainee_id', traineeId)`) to give Postgres the column statistics it needs

**Warning signs:**
- Progress chart queries taking over 500ms
- No composite index on `set_logs`
- RLS policies written with bare `auth.uid()` (not wrapped in SELECT)
- Supabase Performance Advisor flagging "rls_initplan" lint warning

**Phase to address:** Phase 1 (Foundation) for index creation; Phase 5 (Trainer Dashboard) for query optimization under realistic data volumes.

---

### Pitfall 8: Role Stored in User-Editable Profile Field

**What goes wrong:**
A `role` column in a `profiles` table allows a malicious trainee to call `UPDATE profiles SET role = 'trainer'` via the Supabase client SDK, bypassing RLS and gaining access to all trainer functionality.

**Why it happens:**
It feels natural to store role alongside other profile data. Developers don't realize the Supabase client SDK allows self-update of any row the user owns (unless explicitly blocked by RLS), and profile rows are typically owned by the user themselves.

**How to avoid:**
Store role exclusively in `auth.users.raw_app_meta_data` — this field is server-side only and cannot be modified through the Supabase client SDK. Set it using the Supabase Admin API server-side at account creation (in a Server Action or Edge Function). Read it in Next.js middleware via the JWT claim `app_metadata.role`. No client-side code can alter it.

**Warning signs:**
- `role` column in any table accessible to the Supabase JS client
- Role determination logic in middleware that reads from a Supabase client call rather than the JWT token

**Phase to address:** Phase 1 (Foundation). Must be correct before any role-protected routes are built.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping RLS on internal-only tables (e.g., audit logs) | Faster development | Data leakage if a Route Handler is accidentally exposed; hard to retrofit later | Never — always enable RLS on Supabase tables |
| Storing Garmin/OAuth tokens unencrypted in Postgres | No encryption setup time | Token theft via SQL injection gives full Garmin account access | Never — use Supabase Vault or pgcrypto before tokens are stored |
| Using `next-pwa` (shadowwalker) instead of Serwist | Familiar package name | Unmaintained — breaks with Next.js 15 App Router and Turbopack. Silent failures in production builds | Never — it is unmaintained |
| Skipping `setMutationDefaults` for offline mutations | Less setup code | Queued mutations silently die on page refresh | Never — this is the foundational offline contract |
| Fetching last week's results per-exercise (N queries) | Simple implementation | 8-10 sequential API calls in gym with poor wifi → timeout cascade | Never in trainee logging view — batch fetch once per session |
| Global shared exercise library instead of per-trainer | Less storage, "cleaner" | Naming conflicts, moderation complexity, RLS policy explosion | Never for v1 — start with per-trainer libraries |
| Terra API instead of direct Garmin + HealthKit | Eliminates two complex integrations | Per-user cost ($0.01-$0.05/month), vendor dependency | Acceptable for v1 if timeline is tight — plan to migrate in v2 |
| Using Expo Go during HealthKit development | No custom build needed | HealthKit entitlements are unavailable in Expo Go — the bridge silently returns no data | Never — HealthKit development requires custom dev client from day one |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Garmin Connect API | Starting integration without confirmed API access | Apply to the Developer Program on project kickoff — 1-4 week lead time after approval |
| Garmin Connect API | Assuming access tokens last indefinitely | Tokens expire after 3 months — implement token refresh logic and store `expires_at` in `garmin_tokens`. Subtract 600 seconds before expiry to trigger proactive refresh |
| Garmin Connect API | Not validating webhook HMAC signature | Garmin signs webhook payloads — validate the signature on every request to prevent spoofed activity injections. Reject unsigned requests with 401 |
| Garmin Connect API | Treating OAuth user token as stable user identifier | After OAuth 2.0 migration, the user access token is no longer the user identifier in PING/PUSH notifications — use Garmin User ID for identification |
| Apple HealthKit (via Expo) | Using Expo Go for HealthKit development | HealthKit requires native entitlements unavailable in Expo Go — use `expo prebuild` and a custom dev client from the first day of HealthKit work |
| Apple HealthKit (via Expo) | Requesting HealthKit authorization without checking simulator | HealthKit does not work reliably in the iOS Simulator — test on a real device |
| Apple HealthKit (via Expo) | Requesting permission and fetching data in the same component render cycle | Crashes if the fetch hook fires before authorization completes — separate the auth request from the data fetch into distinct lifecycle stages |
| Apple HealthKit (via Expo) | Assuming you can re-prompt denied permissions | iOS users who deny HealthKit access cannot be re-prompted from within the app — you can only direct them to iOS Settings > Privacy > Health |
| Supabase Auth + Next.js | Using deprecated `@supabase/auth-helpers-nextjs` | Use `@supabase/ssr` — the auth-helpers package is deprecated and will not receive updates |
| Supabase Auth + Next.js | Reading session in middleware without refreshing cookies | The Supabase session middleware must write refreshed cookies back to the response — use `createServerClient` from `@supabase/ssr` which handles this automatically |
| Serwist + Next.js 15 | Running `next dev --turbopack` expecting service worker to work | Serwist requires webpack for the service worker compilation step. Use `--turbopack` for regular dev, `--webpack` only when explicitly testing offline PWA behavior locally |
| Serwist + Next.js 15 | Caching API routes that return user-specific data with CacheFirst | User A's cached response is served to User B on the same device. Use NetworkFirst or NetworkOnly for all authenticated API routes |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries for last-week inline results (one query per exercise) | Trainee workout view slow to load in gym; 8-10 sequential round trips under poor signal | Fetch all set_logs for previous session in a single query at page load; distribute to exercise cards from cache | Immediately — even at 1 user with 10 exercises, this is 10 requests |
| Missing composite index on `set_logs(trainee_id, exercise_id, logged_at)` | Trainer progress charts timeout as trainee history grows | Add this index in the initial migration — never add it later as a hotfix | At ~1,000 set_log rows per trainee — within 3 months of active use |
| RLS subqueries without `(SELECT auth.uid())` wrapping | Trainer dashboard loads take seconds; Supabase shows high Postgres CPU | Wrap all `auth.uid()` calls in a SELECT in policy definitions | At ~100 rows in the queried table |
| Caching exercise demo videos in Cache Storage | 50MB Safari storage limit exceeded; entire PWA cache evicted unexpectedly | Serve videos from Supabase Storage with proper cache headers; do NOT precache in service worker | At the first video added to the exercise library (if videos are multi-MB) |
| Supabase Realtime subscriptions open for inactive trainers | WebSocket connections accumulate; Supabase Realtime connection limits hit | Subscribe only when the trainer dashboard is actively visible; unsubscribe on tab hide or navigation away | At ~20-30 concurrent trainers using the dashboard |
| Offline mutation queue replaying out of order on reconnect | Set #3 appears before Set #1 in the trainer's view of a client's workout | Use sequential mutation queuing with ordered IDs; ensure `resumePausedMutations` replays in insertion order | Any time a user logs sets offline and reconnects |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Garmin and Apple OAuth tokens stored plaintext in Postgres | Token theft via SQL injection grants full wearable account access | Encrypt access_token and refresh_token using Supabase Vault (pgcrypto) before INSERT. Read-decrypt only when needed for API calls |
| Role stored in user-modifiable profile table | Trainee self-promotes to trainer, reads all trainer data | Role belongs in `auth.users.raw_app_meta_data` set server-side only via Supabase Admin API |
| Garmin webhook endpoint without HMAC signature validation | Spoofed workouts injected for any trainee; fabricated health data | Validate the Garmin-provided HMAC signature on every webhook request; reject unsigned calls with 401 |
| `/api/healthkit/sync` endpoint without authentication | Unauthenticated callers inject arbitrary health data for any trainee | Validate the Supabase JWT Authorization header on every request to the sync endpoint |
| RLS disabled on any Supabase table | Cross-trainer data leakage through Supabase client SDK | Enable RLS + deny-all default policy as the first step in every table migration |
| Trainee can write `workout_logs` for any `trainee_id` | One trainee poisons another's workout history | RLS INSERT policy: `WITH CHECK (trainee_id = (SELECT id FROM trainees WHERE auth_uid = auth.uid()))` |
| Next.js Route Handler for the Garmin webhook accessible without origin validation | SSRF or replay attacks | Garmin sends requests from specific IP ranges — consider IP allowlisting as defense-in-depth alongside HMAC |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No offline indicator | Trainee logs sets, sees no feedback, cannot tell if data is saved or lost | Show a persistent "Offline — saving locally" banner when `navigator.onLine === false`; show "Syncing..." when reconnected |
| Complex "Add to Home Screen" requirement buried in settings | Push notifications never work; iOS trainees can't get workout reminders; iOS storage eviction risk increases | Build a first-run onboarding screen with step-by-step Add to Home Screen instructions and screenshots (iOS does not allow automated install prompts) |
| No "last week's results" visible during logging | Trainee has to switch to history view mid-workout; major UX regression vs. the spreadsheet being replaced | The core value prop: show previous week's actual_reps and actual_weight inline on each exercise card during logging — this must work offline from cache |
| Plan week resolves to wrong session after trainer edits the plan mid-program | Trainee sees a completely different workout than expected; trainer changes break active programs | Lock active plan assignments to a snapshot of the plan at assignment time, OR require the trainer to explicitly create a "new version" when editing a plan that has active trainees |
| Logging form requires too many taps per set | Gym users give up after 2 exercises; adoption fails | Design the set-logging flow for one-handed gym use: large tap targets, number wheel inputs, "Same as last set" quick fill |
| No "sync now" button for smartwatch data | Trainee completes workout but health data doesn't appear until Garmin sync triggers | Provide a manual "Import from Garmin" button that calls the pull API immediately; don't rely solely on webhook delivery timing |

---

## "Looks Done But Isn't" Checklist

- [ ] **Offline workout logging:** Verify by turning off wifi + cellular, logging 3 sets, closing the app, restarting the phone, reopening the app, then reconnecting — confirm all sets appeared in Supabase after reconnect
- [ ] **iOS push notifications:** Verify by installing the PWA to home screen on a real iPhone (not simulator), granting push permission, and receiving a test notification. Desktop or Android success does not count
- [ ] **RLS data isolation:** Verify by creating two trainer accounts, having Trainer A create a plan and trainee, then attempting to read that data using Trainer B's JWT token — should return empty/error
- [ ] **Garmin webhook validation:** Verify by sending a request to `/api/garmin/webhook` with an invalid HMAC signature — should return 401, not 200
- [ ] **HealthKit sync on real device:** Verify the Expo companion app reads HealthKit data on a physical iPhone (not simulator), not just returns empty arrays
- [ ] **Offline mutation defaults registered:** Verify by going offline, logging a set, refreshing the page (F5 / cmd+R) while still offline, then reconnecting — the set must still sync
- [ ] **Plan week calculation with timezone edge cases:** Verify that the week calculation produces the correct week number for trainees in timezones east and west of UTC when `start_date` is set to a Monday
- [ ] **Garmin token refresh:** Verify that a trainee who authorized Garmin 3 months ago still receives health data (access token has been transparently refreshed)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS not enabled on a table (discovered post-launch) | HIGH | Enable RLS immediately; add restrictive policies; audit logs for cross-tenant reads that occurred; notify affected trainers per GDPR/privacy obligations |
| Role stored in user-editable field (discovered post-launch) | HIGH | Migrate all role data to `app_metadata` via Supabase Admin API; add RLS policy blocking profile role updates; audit for privilege escalation attempts |
| Garmin tokens stored plaintext (discovered post-launch) | HIGH | Encrypt tokens in place using Supabase Vault; rotate all existing tokens by triggering re-authorization for all users who connected Garmin |
| Offline mutations silently dying (discovered from user reports) | MEDIUM | Add `setMutationDefaults` + `resumePausedMutations` at startup; release hotfix; users who lost data cannot recover it — offer manual re-entry support |
| iOS storage eviction causing lost offline set logs | MEDIUM | Implement double-write: write set logs to both IndexedDB AND a sync-on-connect queue table in Supabase immediately on mutation (not just on network success) |
| Missing composite index on `set_logs` (perf degradation) | LOW | Add index in a migration — no downtime required on Supabase (CREATE INDEX CONCURRENTLY). Query performance improves immediately |
| Garmin approval delayed (blocking v1) | LOW-MEDIUM | Activate Terra API integration as fallback; swap credentials when Garmin approval arrives; Terra covers both Garmin and HealthKit |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| HealthKit has no web API — companion app required | Phase 0 (Project Setup) + Phase 6 | Companion app communicates with backend before smartwatch phase is declared "done" |
| Garmin Developer Program approval lead time | Phase 0 (Project Setup) — apply immediately | Confirmed API access credentials in hand before Phase 6 begins |
| iOS PWA push requires home screen install | Phase 4 (PWA + Offline) | Tested on real iPhone with installed PWA, not just Android |
| iOS Safari storage eviction after inactivity | Phase 4 (PWA + Offline) | Storage budget audit; eviction scenario manually tested |
| TanStack Query offline mutations die on page refresh | Phase 4 (PWA + Offline) | Offline-reload-reconnect test sequence passes with no lost mutations |
| RLS disabled on new tables | Phase 1 (Foundation) — establish convention | Every table migration includes RLS enable + policy as non-negotiable |
| RLS subquery performance destroying query speed | Phase 1 (Foundation) for indexing; Phase 5 for query optimization | Composite index on `set_logs`; `EXPLAIN ANALYZE` run against progress chart query under realistic row counts |
| Role in user-editable profile field | Phase 1 (Foundation) | Trainee JWT cannot read trainer routes; privilege escalation attempt returns 403 |
| Garmin OAuth tokens stored plaintext | Phase 6 (Smartwatch) | Garmin tokens column uses encryption at rest; SQL direct query returns cipher text |
| N+1 queries for inline last-week results | Phase 3 (Trainee Logging) | Single query for all previous set_logs per session; measured at network tab level |
| Plan week calculation timezone bug | Phase 3 (Trainee Logging) | Week number tested with start_date set to trainees in UTC+9 and UTC-8 |
| No offline indicator | Phase 4 (PWA + Offline) | Offline banner visible when network disabled; disappears on reconnect |
| HealthKit permission re-prompt impossible | Phase 6 (Smartwatch) | "Go to Settings" instructions shown when permission is denied; no infinite re-prompt loop |

---

## Sources

- **Apple Developer HealthKit Documentation** — https://developer.apple.com/documentation/healthkit — No web API exists; local device-only data store. Confidence: HIGH
- **react-native-health GitHub (agencyenterprise)** — https://github.com/agencyenterprise/react-native-health — Custom dev client requirement, entitlements, Expo setup. Confidence: HIGH
- **Expo iOS Capabilities Documentation** — https://docs.expo.dev/build-reference/ios-capabilities/ — EAS Build capability sync pitfalls, entitlement out-of-sync issue. Confidence: HIGH
- **Garmin Connect Developer Program FAQ** — https://developer.garmin.com/gc-developer-program/program-faq/ — OAuth 2.0 requirement, 1-4 week integration timeline, business-only access. Confidence: HIGH
- **MobiLoud: PWAs on iOS 2026** — https://www.mobiloud.com/blog/progressive-web-apps-ios — Push notification home screen requirement, 10-15x smaller reach than native, background sync unsupported. Confidence: MEDIUM (third-party but consistent with Apple docs)
- **Apple Developer: Sending Web Push Notifications** — https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers — iOS 16.4+ requirement, home screen install required, standalone display mode required. Confidence: HIGH
- **Supabase RLS Troubleshooting Docs** — https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv — `auth.uid()` per-row execution, `(SELECT auth.uid())` optimization, index requirements. Confidence: HIGH
- **Supabase RLS Official Docs** — https://supabase.com/docs/guides/database/postgres/row-level-security — Default RLS off, SQL Editor bypasses RLS, deny-all default pattern. Confidence: HIGH
- **TanStack Query GitHub Issue #3460** — https://github.com/TanStack/query/issues/3460 — Paused mutations not persisted across page refresh; mutationFn not serializable. Confidence: HIGH (official issue tracker)
- **TanStack Query GitHub Issue #5847** — https://github.com/TanStack/query/issues/5847 — resumePausedMutations not running after offline→online across versions 4.24.3-4.32.6. Confidence: HIGH
- **Apple Developer Forums: Safari iOS PWA Data Persistence Beyond 7 Days** — https://developer.apple.com/forums/thread/710157 — 7-day inactivity rule for Safari vs. installed PWA storage lifecycle. Confidence: HIGH (official Apple forums)
- **Apple Community: Workout App and Travel to Different Timezones** — https://discussions.apple.com/thread/7547006 — DST/timezone bugs in workout session tracking. Confidence: MEDIUM
- **Vercel Blog: Common Mistakes with Next.js App Router** — https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them — Route handler caching, revalidation after mutations, Suspense placement. Confidence: HIGH
- **WebSearch: "Supabase RLS multi-tenant mistakes 2025"** — Multiple sources (Supabase docs, community discussions) confirm RLS-disabled-by-default pitfall. Confidence: HIGH
- **Serwist Issue #54 (Turbopack support)** — https://github.com/serwist/serwist/issues/54 — Serwist 9 Turbopack support backported; use --webpack for production builds. Confidence: HIGH (official issue tracker)
- **MagicBell: PWA iOS Limitations Safari Support** — https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide — Push permission must be in user gesture, storage pressure eviction. Confidence: MEDIUM

---
*Pitfalls research for: Gym AI Assistant — multi-tenant trainer/trainee PWA with Apple Watch and Garmin smartwatch integration*
*Researched: 2026-02-28*
