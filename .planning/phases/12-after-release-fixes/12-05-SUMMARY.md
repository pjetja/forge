# Plan 12-05 Summary: Loading states + Gravatar docs

## What was done

### Task 1 — Loading skeleton files (3 new files)

**`src/app/(trainee)/trainee/loading.tsx`** (new)

- Skeleton for the 4-tab trainee home: session banner placeholder, tab switcher with 4 tabs, 3 plan card rows

**`src/app/(trainer)/trainer/loading.tsx`** (new)

- Skeleton for trainer home (trainee roster): heading + invite button row, 4 trainee cards with avatar circle, name lines, plan badge

**`src/app/(trainer)/trainer/trainees/[traineeId]/loading.tsx`** (new)

- Skeleton for trainee detail: avatar + name header, 5-tab tab switcher, 3 content card rows
- All skeletons use `bg-border rounded animate-pulse` placeholder blocks (no spinners)

### Task 2 — Gravatar documentation

**`messages/en/trainer.json`** + **`messages/pl/trainer.json`**

- Added `profile.gravatarNote`: EN: "Profile photo from" / PL: "Zdjęcie profilowe z"

**`messages/en/trainee.json`** + **`messages/pl/trainee.json`**

- Added `profile.gravatarNote`: EN: "Profile photo from" / PL: "Zdjęcie profilowe z"

**`src/app/(trainer)/trainer/profile/page.tsx`**

- Replaced `setAvatarHint` paragraph with a Gravatar attribution link: "Profile photo from [Gravatar](https://gravatar.com)" (opens in new tab, rel="noopener noreferrer")

**`src/app/(trainee)/trainee/profile/page.tsx`**

- Added Gravatar attribution link in the avatar identity section (same pattern as trainer)

## Acceptance criteria

- [x] `loading.tsx` created for trainee home, trainer home, trainee detail
- [x] `animate-pulse` used in skeleton files
- [x] `gravatar.com` link present in trainer profile page
- [x] `gravatar.com` link present in trainee profile page
- [x] `gravatarNote` key added to EN trainer.json
- [x] TypeScript: no errors in modified files
