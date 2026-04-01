# Plan 12-04 Summary: FAQ usage flows + guide page

## What was done

### Task 1 — i18n keys (EN + PL)

**`messages/en/common.json`** + **`messages/pl/common.json`**

- Added `guide.*` section (trainers: 4 numbered steps; trainees: 3 numbered steps) to both locales
- Added `help.trainees.q3` / `help.trainees.a3` — body weight tracking FAQ
- Added `help.guideLink` — callout label linking to the guide page

### Task 2 — `/guide` page

**`src/app/guide/page.tsx`** (new file)

- Public page (no auth guard), matches `/help` page shell (`bg-bg-page`, `max-w-3xl mx-auto`, `px-4 py-12`)
- Trainer section: 4 numbered steps (create exercises → build plan → assign → monitor)
- Trainee section: 3 numbered steps (join trainer → log workout → view progress)
- Uses `getTranslations('common')` to render all `guide.*` keys

### Task 3 — Body weight FAQ in `/help`

**`src/app/help/page.tsx`**

- Added `q3`/`a3` block ("How do I track my body weight?") to the For Trainees section
- Added `<hr>` separator between `q2` and `q3` for visual consistency

### Task 4 — Guide link in `/help`

**`src/app/help/page.tsx`**

- Added `<Link href="/guide">` callout paragraph below the back-to-home link, before the first FAQ section

## Acceptance criteria

- [x] `guide` section present in `messages/en/common.json` and `messages/pl/common.json`
- [x] `q3` (body weight FAQ) present in `messages/en/common.json`
- [x] `guideLink` present in both EN and PL common.json
- [x] `src/app/guide/page.tsx` created with `getTranslations`
- [x] `help.trainees.q3` / `help.trainees.a3` rendered in help page
- [x] `/guide` link present in help page
- [x] TypeScript: no errors
