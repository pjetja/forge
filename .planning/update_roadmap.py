import re

with open('.planning/ROADMAP.md', 'r') as f:
    content = f.read()

new_section = """### Phase 11: Deploy — connect code to GitHub, deploy app for public beta testing and feedback gathering

**Goal:** Push code to GitHub, deploy to Vercel, configure Supabase for production, add PWA manifest, run demo seed, and verify the live URL works end-to-end for public beta testing.
**Requirements**: DEPLOY-ENV, DEPLOY-PWA, DEPLOY-GIT, DEPLOY-CI, DEPLOY-VERCEL, DEPLOY-SUPABASE, DEPLOY-SEED, DEPLOY-E2E
**Depends on:** Phase 10
**Plans:** 4 plans

Plans:

- [ ] 11-01-PLAN.md — Git cleanup, PWA manifest + icons, production env var docs, pnpm build verification
- [ ] 11-02-PLAN.md — GitHub repo creation, push, and CI workflow
- [ ] 11-03-PLAN.md — Vercel import, env var configuration, first deploy
- [ ] 11-04-PLAN.md — Supabase production Auth config, demo seed, end-to-end verification"""

# Replace from Phase 11 header to end of its Plans section
pattern = r'### Phase 11: Deploy.*?- \[ \] TBD \(run /gsd:plan-phase 11 to break down\)'
result = re.sub(pattern, new_section, content, flags=re.DOTALL)

if result != content:
    with open('.planning/ROADMAP.md', 'w') as f:
        f.write(result)
    print('ROADMAP.md updated successfully')
else:
    print('Pattern not found — no changes made')
