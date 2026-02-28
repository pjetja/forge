# Phase 1: Foundation - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Secure authentication with role enforcement, multi-tenant data isolation, and trainer-trainee connection management. This phase delivers: users can register, log in (email/password or Google), land on their role-appropriate home screen, and trainers can invite trainees to connect. No workout plans, no logging, no progress — just identity and connections.

</domain>

<decisions>
## Implementation Decisions

### Sign-up flow
- Separate sign-up pages per role: `/signup/trainer` and `/signup/trainee`
- Each page has both email/password fields AND a "Sign up with Google" button
- Role is determined by which page the user came from (not a picker after the fact)
- Email verification is required before accessing the app — verified email gates the entire app
- Password reset is deferred (admin resets manually for early users)

### Post-registration landing
- Trainer lands on the plan builder (Phase 3 will build this — Phase 1 should show an empty state with "Create your first plan" CTA)
- Trainee lands on their current plan screen (Phase 3/4 will build this — Phase 1 shows "Waiting for your trainer to assign a plan")

### Home screens
- Trainer home screen = roster of trainees (the roster IS the home, not a section of a dashboard)
- Trainee home screen = their currently assigned plan (empty state: "Waiting for your trainer")

### Google login
- Supabase Google OAuth on both `/signup/trainer` and `/signup/trainee`
- Role is assigned at the OAuth signup moment based on which page button was clicked
- Returning Google users go directly to their role-appropriate home (no role re-selection)

### Invite & connection flow
- Trainer generates a shareable link (e.g. `app.com/join/[token]`) — no code, just link
- Links do not expire and stay valid until the trainer revokes them
- When a trainee clicks the invite link:
  - If already logged in → auto-connect to the trainer immediately
  - If not logged in → redirect to `/signup/trainee` with trainer context preserved; after signup, auto-connect
- One trainer per trainee — a trainee cannot be connected to multiple trainers simultaneously
- If a trainee is already connected and clicks a different trainer's invite, they must disconnect first

### Connection management
- Trainer can remove a trainee from their roster (trainee loses plan access)
- Trainee can also disconnect from their side
- Both actions end the connection symmetrically

### Roster UI (trainer home screen)
- Each trainee card shows: profile photo/avatar, name, assigned plan name, last activity date, connection status (active / no plan assigned)
- Trainer can generate invite link from the roster screen (e.g. "+ Invite trainee" button)

### Session behavior
- Sessions last 30 days, refreshed on activity
- Silent token refresh in background — user never sees a re-login prompt mid-workout
- Multiple devices simultaneously allowed (phone + laptop for trainers)

### Claude's Discretion
- Exact avatar/placeholder design when no profile photo is set
- Empty roster state illustration and copy
- Exact invite link revocation UX (button placement on roster)
- Loading states and error handling for OAuth callback

</decisions>

<specifics>
## Specific Ideas

- The trainee's home screen centers on their plan — "what am I doing today?" is the first question they have when opening the app
- Trainer home = "who are my clients and are they training?" — the roster serves this at a glance

</specifics>

<deferred>
## Deferred Ideas

- Password reset flow — deferred (admin handles manually for early users)
- Profile editing (name, photo upload) — not in Phase 1 scope; Phase 1 uses whatever Google/signup provides
- Trainee connecting to multiple trainers — explicitly one trainer per trainee for v1

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-01*
