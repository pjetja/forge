// Forge UI Library — Figma Plugin API Bootstrap Script
// Run in: Plugins → Development → Open Console (paste full contents, press Enter)
//
// API references:
// https://developers.figma.com/docs/plugins/api/properties/figma-createpage/
// https://developers.figma.com/docs/plugins/api/properties/figma-createcomponent/
// https://developers.figma.com/docs/plugins/api/properties/figma-combineasvariants/
// https://developers.figma.com/docs/plugins/async-tasks/

(async () => {
  // ---------------------------------------------------------------------------
  // Load fonts before any text operations
  // ---------------------------------------------------------------------------
  await figma.loadFontAsync({ family: 'Lato', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Lato', style: 'Bold' });

  // ---------------------------------------------------------------------------
  // Helper: hex string -> RGBA paint (no alpha arg = 1)
  // ---------------------------------------------------------------------------
  function hexToRGB(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
    };
  }

  function solidFill(hex, opacity) {
    const { r, g, b } = hexToRGB(hex);
    const paint = { type: 'SOLID', color: { r, g, b } };
    if (opacity !== undefined) paint.opacity = opacity;
    return paint;
  }

  function solidStroke(hex, weight) {
    return { paint: solidFill(hex), weight: weight || 1 };
  }

  function addLabel(parent, text, x, y, size, bold) {
    const node = figma.createText();
    node.fontName = { family: 'Lato', style: bold ? 'Bold' : 'Regular' };
    node.characters = text;
    node.fontSize = size || 14;
    node.fills = [solidFill('#e2e8f0')];
    node.x = x;
    node.y = y;
    parent.appendChild(node);
    return node;
  }

  // ---------------------------------------------------------------------------
  // Design tokens
  // ---------------------------------------------------------------------------
  const tokens = [
    { name: 'bg-page',       hex: '#0f172a' },
    { name: 'bg-surface',    hex: '#1e293b' },
    { name: 'border',        hex: '#334155' },
    { name: 'accent',        hex: '#10b981' },
    { name: 'accent-hover',  hex: '#34d399' },
    { name: 'text-primary',  hex: '#e2e8f0' },
    { name: 'error',         hex: '#ef4444' },
    { name: 'error-light',   hex: '#f87171' },
  ];

  const typoSteps = [
    { class: 'text-xs',   px: 12 },
    { class: 'text-sm',   px: 14 },
    { class: 'text-base', px: 16 },
    { class: 'text-lg',   px: 18 },
    { class: 'text-xl',   px: 20 },
    { class: 'text-2xl',  px: 24 },
  ];

  let componentCount = 0;

  // ---------------------------------------------------------------------------
  // Page setup — rename Page 1 to "Tokens", create the other 4 pages
  // ---------------------------------------------------------------------------
  const existingPages = figma.root.children;
  const tokensPage = existingPages[0];
  tokensPage.name = 'Tokens';

  const atomsPage      = figma.createPage(); atomsPage.name      = 'Atoms';
  const moleculesPage  = figma.createPage(); moleculesPage.name  = 'Molecules';
  const organismsPage  = figma.createPage(); organismsPage.name  = 'Organisms';
  const phase2Page     = figma.createPage(); phase2Page.name     = 'Phase 2: Exercise Library';

  // ---------------------------------------------------------------------------
  // TOKENS PAGE
  // ---------------------------------------------------------------------------
  await figma.setCurrentPageAsync(tokensPage);

  // Section header
  addLabel(tokensPage, 'Colors', 40, 40, 20, true);

  // Color swatches — 2 rows of 4, 120px spacing
  tokens.forEach((token, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = 40 + col * 120;
    const y = 80 + row * 120;

    // Swatch rectangle
    const rect = figma.createRectangle();
    rect.resize(80, 80);
    rect.x = x;
    rect.y = y;
    rect.fills = [solidFill(token.hex)];
    rect.strokes = [solidFill('#334155')];
    rect.strokeWeight = 1;
    tokensPage.appendChild(rect);

    // Token name label
    addLabel(tokensPage, token.name, x, y + 86, 11, false);
    // Hex value label
    addLabel(tokensPage, token.hex, x, y + 100, 10, false);
  });

  // Typography section — to the right at x=600
  addLabel(tokensPage, 'Typography', 600, 40, 20, true);
  addLabel(tokensPage, 'Font: Lato · Weights: 400 Regular, 700 Bold', 600, 70, 12, false);

  let typoY = 100;
  typoSteps.forEach((step) => {
    // Regular
    const regNode = figma.createText();
    regNode.fontName = { family: 'Lato', style: 'Regular' };
    regNode.characters = `${step.class} · ${step.px}px · Regular — The quick brown fox`;
    regNode.fontSize = step.px;
    regNode.fills = [solidFill('#e2e8f0')];
    regNode.x = 600;
    regNode.y = typoY;
    tokensPage.appendChild(regNode);
    typoY += step.px + 16;

    // Bold
    const boldNode = figma.createText();
    boldNode.fontName = { family: 'Lato', style: 'Bold' };
    boldNode.characters = `${step.class} · ${step.px}px · Bold — The quick brown fox`;
    boldNode.fontSize = step.px;
    boldNode.fills = [solidFill('#e2e8f0')];
    boldNode.x = 600;
    boldNode.y = typoY;
    tokensPage.appendChild(boldNode);
    typoY += step.px + 24;
  });

  // ---------------------------------------------------------------------------
  // ATOMS PAGE
  // ---------------------------------------------------------------------------
  await figma.setCurrentPageAsync(atomsPage);

  let atomY = 80;
  const atomX = 40;

  // Helper: create a component with a colored rectangle fill and optional stroke
  function makeVariantRect(w, h, fillHex, fillOpacity, strokeHex, cornerRadius) {
    const c = figma.createComponent();
    c.resize(w, h);
    c.fills = fillHex ? [solidFill(fillHex, fillOpacity)] : [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }];
    if (strokeHex) {
      c.strokes = [solidFill(strokeHex)];
      c.strokeWeight = 1;
    }
    if (cornerRadius) c.cornerRadius = cornerRadius;
    return c;
  }

  // Buttons/Primary
  {
    addLabel(atomsPage, 'Buttons/Primary', atomX, atomY - 24, 16, true);
    const d  = makeVariantRect(120, 40, '#10b981', 1,    null,     6); d.name  = 'State=Default';
    const hv = makeVariantRect(120, 40, '#34d399', 1,    null,     6); hv.name = 'State=Hover';
    const di = makeVariantRect(120, 40, '#10b981', 0.4,  null,     6); di.name = 'State=Disabled';
    const lo = makeVariantRect(120, 40, '#10b981', 0.7,  null,     6); lo.name = 'State=Loading';
    [d, hv, di, lo].forEach((c, i) => { c.x = atomX + i * 140; c.y = atomY; atomsPage.appendChild(c); });
    const set = figma.combineAsVariants([d, hv, di, lo], atomsPage);
    set.name = 'Buttons/Primary';
    set.x = atomX; set.y = atomY;
    componentCount++;
    atomY += 100;
  }

  // Buttons/Secondary
  {
    addLabel(atomsPage, 'Buttons/Secondary', atomX, atomY - 24, 16, true);
    const d  = makeVariantRect(120, 40, null,      1,    '#334155', 6); d.name  = 'State=Default';
    const hv = makeVariantRect(120, 40, '#1e293b', 1,    '#10b981', 6); hv.name = 'State=Hover';
    const di = makeVariantRect(120, 40, null,      0.4,  '#334155', 6); di.name = 'State=Disabled';
    [d, hv, di].forEach((c, i) => { c.x = atomX + i * 140; c.y = atomY; atomsPage.appendChild(c); });
    const set = figma.combineAsVariants([d, hv, di], atomsPage);
    set.name = 'Buttons/Secondary';
    set.x = atomX; set.y = atomY;
    componentCount++;
    atomY += 100;
  }

  // Buttons/Ghost
  {
    addLabel(atomsPage, 'Buttons/Ghost', atomX, atomY - 24, 16, true);
    const d  = makeVariantRect(120, 40, null,      1, null,     6); d.name  = 'State=Default';
    const hv = makeVariantRect(120, 40, '#1e293b', 1, null,     6); hv.name = 'State=Hover';
    [d, hv].forEach((c, i) => { c.x = atomX + i * 140; c.y = atomY; atomsPage.appendChild(c); });
    const set = figma.combineAsVariants([d, hv], atomsPage);
    set.name = 'Buttons/Ghost';
    set.x = atomX; set.y = atomY;
    componentCount++;
    atomY += 100;
  }

  // Inputs/Text
  {
    addLabel(atomsPage, 'Inputs/Text', atomX, atomY - 24, 16, true);
    const d  = makeVariantRect(280, 44, '#1e293b', 1,   '#334155', 6); d.name  = 'State=Default';
    const fc = makeVariantRect(280, 44, '#1e293b', 1,   '#10b981', 6); fc.name = 'State=Focus';
    const er = makeVariantRect(280, 44, '#1e293b', 1,   '#ef4444', 6); er.name = 'State=Error';
    const di = makeVariantRect(280, 44, '#1e293b', 0.5, '#334155', 6); di.name = 'State=Disabled';
    [d, fc, er, di].forEach((c, i) => { c.x = atomX + i * 300; c.y = atomY; atomsPage.appendChild(c); });
    const set = figma.combineAsVariants([d, fc, er, di], atomsPage);
    set.name = 'Inputs/Text';
    set.x = atomX; set.y = atomY;
    componentCount++;
    atomY += 120;
  }

  // Inputs/Textarea
  {
    addLabel(atomsPage, 'Inputs/Textarea', atomX, atomY - 24, 16, true);
    const d  = makeVariantRect(280, 100, '#1e293b', 1,   '#334155', 6); d.name  = 'State=Default';
    const fc = makeVariantRect(280, 100, '#1e293b', 1,   '#10b981', 6); fc.name = 'State=Focus';
    const er = makeVariantRect(280, 100, '#1e293b', 1,   '#ef4444', 6); er.name = 'State=Error';
    const di = makeVariantRect(280, 100, '#1e293b', 0.5, '#334155', 6); di.name = 'State=Disabled';
    [d, fc, er, di].forEach((c, i) => { c.x = atomX + i * 300; c.y = atomY; atomsPage.appendChild(c); });
    const set = figma.combineAsVariants([d, fc, er, di], atomsPage);
    set.name = 'Inputs/Textarea';
    set.x = atomX; set.y = atomY;
    componentCount++;
    atomY += 180;
  }

  // Badges/Tag
  {
    addLabel(atomsPage, 'Badges/Tag', atomX, atomY - 24, 16, true);
    const ac = makeVariantRect(80, 24, '#10b981', 1, null, 8); ac.name = 'Type=Accent';
    const mu = makeVariantRect(80, 24, '#334155', 1, null, 8); mu.name = 'Type=Muted';
    [ac, mu].forEach((c, i) => { c.x = atomX + i * 100; c.y = atomY; atomsPage.appendChild(c); });
    const set = figma.combineAsVariants([ac, mu], atomsPage);
    set.name = 'Badges/Tag';
    set.x = atomX; set.y = atomY;
    componentCount++;
    atomY += 80;
  }

  // Logo/Horizontal — single component (no variants)
  {
    addLabel(atomsPage, 'Logo/Horizontal', atomX, atomY - 24, 16, true);
    const logo = figma.createComponent();
    logo.resize(120, 28);
    logo.fills = [solidFill('#10b981', 0.15)];
    logo.name = 'Logo/Horizontal';
    logo.x = atomX; logo.y = atomY;
    atomsPage.appendChild(logo);
    addLabel(atomsPage, 'Replace with actual SVG logo asset', atomX + 130, atomY + 8, 11, false);
    componentCount++;
    atomY += 80;
  }

  // Logo/Icon — single component
  {
    addLabel(atomsPage, 'Logo/Icon', atomX, atomY - 24, 16, true);
    const icon = figma.createComponent();
    icon.resize(28, 28);
    icon.fills = [solidFill('#10b981')];
    icon.cornerRadius = 4;
    icon.name = 'Logo/Icon';
    icon.x = atomX; icon.y = atomY;
    atomsPage.appendChild(icon);
    addLabel(atomsPage, 'Replace with actual SVG icon asset', atomX + 48, atomY + 8, 11, false);
    componentCount++;
    atomY += 80;
  }

  // ---------------------------------------------------------------------------
  // MOLECULES PAGE
  // ---------------------------------------------------------------------------
  await figma.setCurrentPageAsync(moleculesPage);

  let molY = 80;
  const molX = 40;

  // Forms/InputGroup
  {
    addLabel(moleculesPage, 'Forms/InputGroup', molX, molY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(280, 72);
    c.name = 'Forms/InputGroup';
    c.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }];
    c.layoutMode = 'VERTICAL';
    c.primaryAxisSizingMode = 'FIXED';
    c.counterAxisSizingMode = 'FIXED';
    c.itemSpacing = 8;
    c.paddingTop = 0; c.paddingBottom = 0; c.paddingLeft = 0; c.paddingRight = 0;

    // Label placeholder
    const labelRect = figma.createRectangle();
    labelRect.resize(120, 16); labelRect.fills = [solidFill('#e2e8f0', 0.4)];
    c.appendChild(labelRect);

    // Input placeholder
    const inputRect = figma.createRectangle();
    inputRect.resize(280, 44); inputRect.fills = [solidFill('#1e293b')];
    inputRect.strokes = [solidFill('#334155')]; inputRect.strokeWeight = 1;
    inputRect.cornerRadius = 6;
    c.appendChild(inputRect);

    c.x = molX; c.y = molY;
    moleculesPage.appendChild(c);
    componentCount++;
    molY += 120;
  }

  // Forms/ErrorMessage
  {
    addLabel(moleculesPage, 'Forms/ErrorMessage', molX, molY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(280, 20);
    c.name = 'Forms/ErrorMessage';
    c.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }];

    const errRect = figma.createRectangle();
    errRect.resize(200, 14); errRect.fills = [solidFill('#f87171', 0.6)];
    errRect.y = 3;
    c.appendChild(errRect);

    c.x = molX; c.y = molY;
    moleculesPage.appendChild(c);
    componentCount++;
    molY += 80;
  }

  // Cards/Shell
  {
    addLabel(moleculesPage, 'Cards/Shell', molX, molY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(320, 160);
    c.name = 'Cards/Shell';
    c.fills = [solidFill('#1e293b')];
    c.strokes = [solidFill('#334155')]; c.strokeWeight = 1;
    c.cornerRadius = 8;
    c.x = molX; c.y = molY;
    moleculesPage.appendChild(c);
    componentCount++;
    molY += 220;
  }

  // Dialogs/ModalShell
  {
    addLabel(moleculesPage, 'Dialogs/ModalShell', molX, molY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(480, 320);
    c.name = 'Dialogs/ModalShell';
    c.fills = [solidFill('#1e293b')];
    c.cornerRadius = 8;
    c.x = molX; c.y = molY;
    moleculesPage.appendChild(c);
    componentCount++;
    molY += 380;
  }

  // Search/SearchBar
  {
    addLabel(moleculesPage, 'Search/SearchBar', molX, molY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(320, 44);
    c.name = 'Search/SearchBar';
    c.fills = [solidFill('#1e293b')];
    c.strokes = [solidFill('#334155')]; c.strokeWeight = 1;
    c.cornerRadius = 8;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'FIXED';
    c.counterAxisSizingMode = 'FIXED';
    c.itemSpacing = 8;
    c.paddingLeft = 12; c.paddingRight = 12; c.paddingTop = 10; c.paddingBottom = 10;

    const searchPlaceholder = figma.createRectangle();
    searchPlaceholder.resize(200, 20); searchPlaceholder.fills = [solidFill('#e2e8f0', 0.3)];
    c.appendChild(searchPlaceholder);

    c.x = molX; c.y = molY;
    moleculesPage.appendChild(c);
    componentCount++;
    molY += 100;
  }

  // ---------------------------------------------------------------------------
  // ORGANISMS PAGE
  // ---------------------------------------------------------------------------
  await figma.setCurrentPageAsync(organismsPage);

  let orgY = 80;
  const orgX = 40;

  // Navigation/TrainerNav
  {
    addLabel(organismsPage, 'Navigation/TrainerNav', orgX, orgY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(1200, 64);
    c.name = 'Navigation/TrainerNav';
    c.fills = [solidFill('#1e293b')];
    c.strokes = [solidFill('#334155')]; c.strokeWeight = 1;
    c.x = orgX; c.y = orgY;
    organismsPage.appendChild(c);
    componentCount++;
    orgY += 140;
  }

  // Navigation/TraineeNav
  {
    addLabel(organismsPage, 'Navigation/TraineeNav', orgX, orgY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(1200, 64);
    c.name = 'Navigation/TraineeNav';
    c.fills = [solidFill('#1e293b')];
    c.strokes = [solidFill('#334155')]; c.strokeWeight = 1;
    c.x = orgX; c.y = orgY;
    organismsPage.appendChild(c);
    componentCount++;
    orgY += 140;
  }

  // DataDisplay/Table
  {
    addLabel(organismsPage, 'DataDisplay/Table', orgX, orgY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(800, 240);
    c.name = 'DataDisplay/Table';
    c.fills = [solidFill('#1e293b')];

    // Header row
    const headerRow = figma.createFrame();
    headerRow.resize(800, 40);
    headerRow.fills = [solidFill('#0f172a')];
    headerRow.layoutMode = 'HORIZONTAL';
    headerRow.primaryAxisSizingMode = 'FIXED';
    headerRow.counterAxisSizingMode = 'FIXED';
    headerRow.x = 0; headerRow.y = 0;
    c.appendChild(headerRow);

    c.x = orgX; c.y = orgY;
    organismsPage.appendChild(c);
    componentCount++;
    orgY += 300;
  }

  // DataDisplay/EmptyState
  {
    addLabel(organismsPage, 'DataDisplay/EmptyState', orgX, orgY - 24, 16, true);
    const c = figma.createComponent();
    c.resize(320, 240);
    c.name = 'DataDisplay/EmptyState';
    c.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }];

    // Illustration placeholder circle
    const circle = figma.createEllipse();
    circle.resize(64, 64); circle.fills = [solidFill('#334155', 0.5)];
    circle.x = 128; circle.y = 60;
    c.appendChild(circle);

    // Copy placeholder
    const textPlaceholder = figma.createRectangle();
    textPlaceholder.resize(160, 16); textPlaceholder.fills = [solidFill('#e2e8f0', 0.4)];
    textPlaceholder.x = 80; textPlaceholder.y = 148;
    c.appendChild(textPlaceholder);

    c.x = orgX; c.y = orgY;
    organismsPage.appendChild(c);
    componentCount++;
    orgY += 300;
  }

  // ---------------------------------------------------------------------------
  // PHASE 2: EXERCISE LIBRARY PAGE
  // ---------------------------------------------------------------------------
  await figma.setCurrentPageAsync(phase2Page);

  let p2Y = 80;
  const p2X = 40;

  // Exercise/Card
  {
    addLabel(phase2Page, 'Exercise/Card', p2X, p2Y - 24, 16, true);
    const c = figma.createComponent();
    c.resize(320, 120);
    c.name = 'Exercise/Card';
    c.fills = [solidFill('#1e293b')];
    c.strokes = [solidFill('#334155')]; c.strokeWeight = 1;
    c.cornerRadius = 8;
    c.x = p2X; c.y = p2Y;
    phase2Page.appendChild(c);
    componentCount++;
    p2Y += 180;
  }

  // Exercise/SearchBar (exercise-specific — different from Search/SearchBar)
  {
    addLabel(phase2Page, 'Exercise/SearchBar', p2X, p2Y - 24, 16, true);
    const c = figma.createComponent();
    c.resize(480, 52);
    c.name = 'Exercise/SearchBar';
    c.fills = [solidFill('#1e293b')];
    c.strokes = [solidFill('#334155')]; c.strokeWeight = 1;
    c.cornerRadius = 8;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'FIXED';
    c.counterAxisSizingMode = 'FIXED';
    c.itemSpacing = 8;
    c.paddingLeft = 12; c.paddingRight = 12; c.paddingTop = 10; c.paddingBottom = 10;

    // Search input placeholder
    const searchInput = figma.createRectangle();
    searchInput.resize(220, 28); searchInput.fills = [solidFill('#e2e8f0', 0.2)];
    searchInput.cornerRadius = 4;
    c.appendChild(searchInput);

    // Filter chip placeholder
    const filterChip1 = figma.createRectangle();
    filterChip1.resize(80, 28); filterChip1.fills = [solidFill('#10b981', 0.3)];
    filterChip1.cornerRadius = 14;
    c.appendChild(filterChip1);

    const filterChip2 = figma.createRectangle();
    filterChip2.resize(80, 28); filterChip2.fills = [solidFill('#334155')];
    filterChip2.cornerRadius = 14;
    c.appendChild(filterChip2);

    c.x = p2X; c.y = p2Y;
    phase2Page.appendChild(c);
    componentCount++;
    p2Y += 120;
  }

  // Exercise/CreateForm
  {
    addLabel(phase2Page, 'Exercise/CreateForm', p2X, p2Y - 24, 16, true);
    const c = figma.createComponent();
    c.resize(480, 320);
    c.name = 'Exercise/CreateForm';
    c.fills = [solidFill('#1e293b')];
    c.cornerRadius = 8;
    c.x = p2X; c.y = p2Y;
    phase2Page.appendChild(c);
    componentCount++;
    p2Y += 380;
  }

  // Exercise/DetailView
  {
    addLabel(phase2Page, 'Exercise/DetailView', p2X, p2Y - 24, 16, true);
    const c = figma.createComponent();
    c.resize(480, 400);
    c.name = 'Exercise/DetailView';
    c.fills = [solidFill('#1e293b')];
    c.cornerRadius = 8;
    c.x = p2X; c.y = p2Y;
    phase2Page.appendChild(c);
    componentCount++;
    p2Y += 460;
  }

  // ---------------------------------------------------------------------------
  // Switch back to Tokens page as the default landing page
  // ---------------------------------------------------------------------------
  await figma.setCurrentPageAsync(tokensPage);

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  figma.closePlugin('Forge UI Library structure created. ' + componentCount + ' components scaffolded.');
})();
