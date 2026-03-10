# Figma Workflow — Forge UI Library

## Figma File

```
Link: https://www.figma.com/design/hTbhUu5ow4BhAatBTLjxNe/Forge-UI-Library?node-id=3-2&t=m1S8VDseuw5X2qek-1
```

---

## Purpose

A single Figma file that serves as the component library and design canvas for all future phases. The workflow is: **design in Figma first, then code**. This prevents mid-implementation design decisions and gives each phase a clear visual spec to build against.

- Free tier (3 draft limit) — all content lives in a single file
- Component library only — no full-page screen compositions in Phase 01.3
- Future UI sub-phases (02.1, 03.1, 04.1, 05.1) each add a new Figma page for their phase-specific screen compositions

---

## Library Structure (5 pages)

### Page 1: Tokens

Color swatches (left) and typography scale (right), side by side.

| Section | Contents |
|---------|----------|
| Colors | 8 color swatches for the full design token palette (see docs/design-tokens.md) |
| Typography | Lato Regular + Bold at each Tailwind scale step (text-xs → text-2xl) |

### Page 2: Atoms

Single-purpose elements with variant sets.

| Component | Variants |
|-----------|---------|
| `Buttons/Primary` | State=Default, State=Hover, State=Disabled, State=Loading |
| `Buttons/Secondary` | State=Default, State=Hover, State=Disabled |
| `Buttons/Ghost` | State=Default, State=Hover |
| `Inputs/Text` | State=Default, State=Focus, State=Error, State=Disabled |
| `Inputs/Textarea` | State=Default, State=Focus, State=Error, State=Disabled |
| `Badges/Tag` | Type=Accent, Type=Muted |
| `Logo/Horizontal` | Single component (icon + wordmark) |
| `Logo/Icon` | Single component (icon only) |

### Page 3: Molecules

Composite elements (atoms combined into functional units).

| Component | Description |
|-----------|-------------|
| `Forms/InputGroup` | Label + Input stacked with vertical auto-layout |
| `Forms/ErrorMessage` | Inline error text below an input |
| `Cards/Shell` | Generic content card with surface fill + border + radius |
| `Dialogs/ModalShell` | Modal backdrop + container shell |
| `Search/SearchBar` | Search input + icon combination |

### Page 4: Organisms

Full-section and full-page layout patterns.

| Component | Description |
|-----------|-------------|
| `Navigation/TrainerNav` | Top nav bar for trainer views (1200px width representation) |
| `Navigation/TraineeNav` | Top nav bar for trainee views |
| `DataDisplay/Table` | Table with header row and scrollable body |
| `DataDisplay/EmptyState` | Zero-state placeholder with icon + copy slot |

### Page 5: Phase 2: Exercise Library

Phase 2 patterns designed ahead of implementation.

| Component | Description |
|-----------|-------------|
| `Exercise/Card` | Exercise name, muscle group tag, description preview |
| `Exercise/SearchBar` | Search input + muscle group filter chips (exercise-specific) |
| `Exercise/CreateForm` | Multi-field creation form (name, muscle group, description) |
| `Exercise/DetailView` | Full exercise display with all fields |

---

## How to Use for a New Phase

For each UI sub-phase (02.1, 03.1, 04.1, 05.1):

1. Open the Figma file (link above)
2. Create a new page named `Phase X.Y: [Feature Name]` — this page holds screen compositions for that phase
3. Place instances of library components onto the new page (drag from library pages — never modify main components)
4. Design all screens for the phase, showing every state: empty state, loading, populated data, error
5. Get human approval via `/gsd:discuss-phase` before writing any code
6. During coding, keep the Figma screen open as the design spec — pixel-match where practical

---

## Component Naming Convention

- **Slash grouping:** `Category/ComponentName` (e.g. `Buttons/Primary`, `Inputs/Text`, `Navigation/TrainerNav`)
- **Variant property format:** `Property=Value` (e.g. `State=Default`, `State=Disabled`, `Type=Accent`)
- **Phase 2 feature group:** `Exercise/Card`, `Exercise/SearchBar` — no phase number prefix in the component name
- **Semantic variants:** use intent names not Tailwind class names (`Accent` not `bg-accent`, `Muted` not `text-slate-400`)

---

## When to Update Tokens

Update `docs/design-tokens.md` AND the Figma Tokens page swatches whenever `src/app/globals.css` `@theme inline` changes. There is no automated token bridge — this is a manual sync.

Steps:
1. Update `src/app/globals.css`
2. Update `docs/design-tokens.md` (matching row in the Colors table)
3. In Figma, open the Tokens page and update the affected swatch fill

---

## Bootstrap Script

The file `docs/figma-bootstrap.js` creates the base page structure programmatically via the Figma Plugin API.

**To run:**
1. Open the Figma file (create it first as an empty file)
2. Go to Plugins → Development → Open Console
3. Paste the full contents of `docs/figma-bootstrap.js` into the console
4. Press Enter — the script will create all 5 pages and component scaffolding
5. After the script completes, review each page and refine components as needed

The script creates placeholder shapes that establish the correct structure — the user then replaces placeholder rectangles with real icon/SVG assets (especially for Logo components).

---

## MCP Setup (for future phases)

**Outcome of Task 1 (Phase 01.3-01):** The official Figma MCP (`mcp.figma.com`) is **read-only** for component authoring use cases.

Available write tools (`generate_figma_design`, `generate_diagram`, `send_code_connect_mappings`, `create_design_system_rules`) cannot create arbitrary component nodes or build a component library from scratch.

**Implications:**
- Use `docs/figma-bootstrap.js` (Plugin API script) as the primary path for programmatic library creation
- `generate_figma_design` may be useful in future sub-phases for importing live app screens as design references, but is NOT suitable for building the component library
- Manual Figma work is required after running the bootstrap script to refine components

For future phases, if Figma MCP gains component-creation capabilities, the bootstrap script approach can be replaced or supplemented with MCP calls.
