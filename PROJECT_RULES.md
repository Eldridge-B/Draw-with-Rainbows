# Draw With Rainbows — Project Rules & Architecture Guidelines

> **This file is the single source of truth for all development decisions.**
> Every AI agent, human developer, and code review must conform to these rules.
> If a rule needs to change, change it here first — never in the code.
>
> **Companion document:** `DESIGN_PRINCIPLES.md` — the universal design
> philosophy these rules implement. Read both. The principles are the "why;"
> these rules are the "how."

---

## 1. Project Identity

- **Name:** Draw With Rainbows
- **Purpose:** A single-page drawing app for fun. Kids draw, show a friend, move on. No teacher workflow, no portfolio, no take-home requirement.
- **Primary Language:** Vanilla JavaScript (ES2020+), HTML5, CSS3
- **Target Users:** 2nd and 3rd graders (ages 7–9) on school Chromebooks and iPads
- **Hosting:** Static files — no server, no build step. Open `index.html` and go.

---

## 2. Hard Rules — Zero Exceptions

These rules are non-negotiable. Any change violating them is rejected automatically.

### 2.1 File Size Limit

- **Hard cap: 200 lines per file. No exceptions, no oversize comments.**
- The entire app is three files. Every line must earn its place.
- Line count includes imports, comments, blank lines, and closing braces.
- If a file approaches 180 lines, cut before you add.

### 2.2 Three-File Architecture (Locked)

| File | Responsibility | Target Lines |
|------|---------------|-------------|
| `index.html` | Structure only. Canvas, toolbar container, buttons. No inline styles, no inline scripts. | ~80 |
| `style.css` | All styling. Touch-first. CSS custom properties for the color theme. | ~180 |
| `app.js` | All behavior. Drawing engine, UI wiring, state management. | ~200 |

No additional files. No build tools, no bundlers, no transpilers, no package managers, no node_modules. If it can't ship as three static files, it doesn't ship.

### 2.3 Technology Constraints

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 |
| Styling | Plain CSS3 with custom properties |
| Behavior | Vanilla JavaScript (no libraries, no frameworks) |
| Canvas | HTML5 Canvas 2D API |
| Input | PointerEvents API |
| Persistence | localStorage (silent auto-resume only) |

**No-go list:**
- No JavaScript frameworks or libraries (no React, no jQuery, nothing)
- No CSS preprocessors (no Sass, no Less)
- No build steps (no Webpack, no Vite, no npm)
- No TypeScript
- No external fonts or CDN dependencies
- No browser dialogs (`alert`, `confirm`, `prompt`) — all UI is in-canvas

### 2.4 Feature Set (Locked — 13 Features, Period)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Canvas + brush drawing | Core loop |
| 2 | Color swatches (12–16) | Big touch targets, 2 rows |
| 3 | Rainbow brush | The signature feature |
| 4 | Eraser | |
| 5 | Undo | Big button, bottom toolbar |
| 6 | Brush sizes (3) | Visual dot previews, not text |
| 7 | Fun brush shapes (star, heart, flower) | 3 shapes max |
| 8 | Fill bucket | |
| 9 | Rainbow fill | Free with fill bucket implementation |
| 10 | Clear canvas | In-canvas "are you sure?" — not a browser dialog |
| 11 | Single responsive canvas | Maximize drawing space |
| 12 | Bottom toolbar | Touch-first, single fixed row |
| 13 | Auto-resume (silent) | localStorage restore on reload, no UI |

**Cut list — do not add these under any circumstances:**
download/save, gallery, text tool, keyboard shortcuts, color eyedropper, shake-to-undo, battery/perf monitoring, device motion, hover effects, menus, drawers, dialogs, text input, any browser dialog.

If a feature isn't in the table above, it doesn't exist.

---

## 3. Architecture Pattern

### 3.1 Screen Layout

Three visual layers, top to bottom:
1. **Rainbow gradient header strip** — decorative only, thin
2. **Full-bleed white canvas** — takes all remaining vertical space
3. **Fixed bottom toolbar** — single row, never scrolls, never overlaps canvas

No sidebars, no floating panels, no modals, no drawers.

### 3.2 Toolbar Behavior

The toolbar is one fixed row containing:
- **Tool icons:** brush, eraser, fill, undo, clear (5 buttons)
- **Color strip:** 12 bright swatches + rainbow toggle
- **Size dots:** 3 sizes, shown as actual-size circles
- **Brush shapes:** star, heart, flower (3 buttons)

Interaction pattern: tapping a tool selects it. Tapping the *active* tool reveals its options inline in the bar. No secondary panels, no popups.

### 3.3 State Model

All app state lives in plain JavaScript variables at the top of `app.js`. No state management library, no event bus, no pub/sub. The state is:
- Current tool (brush / eraser / fill)
- Current color (hex string or "rainbow")
- Current brush size (small / medium / large)
- Current brush shape (round / star / heart / flower)
- Undo stack (array of ImageData snapshots)
- Canvas context reference

### 3.4 Line Budget for `app.js`

| Section | Approximate Lines |
|---------|----------------:|
| State variables and canvas setup | ~15 |
| PointerEvent handlers and coordinate math | ~25 |
| Drawing engine (normal brush, round, star, heart, flower) | ~60 |
| Fill bucket (flood fill + rainbow fill) | ~50 |
| Undo system (ImageData-based) | ~15 |
| UI wiring (tool switching, color picking, size, clear with confirmation) | ~30 |
| Auto-resume (localStorage save/restore) | ~10 |
| **Total** | **~205** |

This is tight. Every function must be compact. The star/heart/flower path geometry is the densest part (10–15 lines each). If the budget overflows, simplify shape math first.

---

## 4. HTML Structure Rules

### 4.1 Semantic Elements

| Element | Use |
|---------|-----|
| `<header>` | Rainbow gradient strip |
| `<main>` | Canvas container |
| `<canvas>` | Drawing surface |
| `<footer>` or `<nav>` | Bottom toolbar |
| `<button>` | Every interactive toolbar element |

No `<div>` soup. Use semantic elements where structure has meaning.

### 4.2 Accessibility

- Every icon button has an `aria-label` (screen readers can't see icons)
- The active tool has `aria-pressed="true"`
- The selected color has `aria-selected="true"`
- Canvas has `role="img"` and a descriptive `aria-label`
- Tab order follows visual order: tools → colors → sizes → shapes

### 4.3 No Inline Anything

- No `<style>` blocks in `index.html` — all CSS in `style.css`
- No `<script>` blocks in `index.html` — all JS in `app.js`
- No `onclick`, `ontouch`, or any inline event handlers
- No inline `style` attributes

---

## 5. CSS Rules

### 5.1 Custom Properties for Theme

Define all colors, sizes, and gradients as CSS custom properties on `:root`. Never repeat a gradient declaration or hardcode a color value in a rule.

### 5.2 Touch-First

- `touch-action: none` on the canvas to prevent scroll/zoom interference
- All interactive elements minimum 44×44px tap area
- No hover-dependent styles — hover doesn't exist on iPad
- Active/pressed states use scale (97–98%) or background color change, triggered within one frame
- Respect `env(safe-area-inset-*)` on the fixed toolbar for notched devices

### 5.3 Responsive Canvas

- Canvas fills all available space between header and toolbar
- No fixed pixel dimensions — calculate size from viewport
- No media query hacks — the layout works at any width from 320px Chromebook to full iPad

### 5.4 No Bloat

- No `!important` overrides
- No repeated gradient declarations (use custom properties)
- No vendor prefixes for features with full baseline support
- No animation purely for decoration — animation serves comprehension

### 5.5 Motion

Respect `prefers-reduced-motion`. Wrap all transitions in `@media (prefers-reduced-motion: no-preference)`. Transitions are fast: 100ms for press states, 200ms for reveals.

---

## 6. JavaScript Rules

### 6.1 Event Handling

- Use PointerEvents exclusively (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`)
- No mouse events, no touch events — PointerEvents cover both
- Attach handlers in `app.js` on `DOMContentLoaded`, never inline

### 6.2 Canvas Coordinates

- Always convert pointer coordinates from page space to canvas space accounting for CSS scaling
- Use `canvas.getBoundingClientRect()` for offset calculation
- Recalculate on resize

### 6.3 Undo System

- Push an ImageData snapshot onto the undo stack before each stroke begins (on `pointerdown`)
- Cap the stack at a reasonable depth (10–20 entries) to limit memory
- Undo pops the last snapshot and puts it back on the canvas
- No redo — cut for simplicity

### 6.4 Auto-Resume

- On every stroke completion (`pointerup`), silently save `canvas.toDataURL()` to localStorage
- On page load, check localStorage for saved data and restore it to the canvas
- No UI for this — it just works. The kid refreshes, their drawing is still there.
- Wrap in try/catch — if localStorage is full or blocked, fail silently

### 6.5 Clear Canvas Confirmation

- Tapping "clear" shows an in-canvas confirmation (colored overlay with "Are you sure?" and yes/no buttons drawn on the canvas or as DOM elements over the canvas)
- Never use `window.confirm()` or any browser dialog
- If confirmed, clear canvas and clear localStorage

### 6.6 No-Go Patterns

- No `eval`, no `Function()` constructor
- No global namespace pollution — use an IIFE or module pattern if needed
- No `setTimeout` for UI state (use requestAnimationFrame where frame timing matters)
- No console.log left in production code

---

## 7. Design System

### 7.1 Color Palette

The app palette is bright and clean. Swatch colors should be bold, saturated, and easily distinguishable for young eyes:
- Red, orange, yellow, green, blue, purple, pink, brown, black, white, light blue, lime (12 minimum)
- Rainbow mode cycles through hues based on stroke distance or time

### 7.2 Visual Style

- **Header:** Thin rainbow gradient strip (red → orange → yellow → green → blue → indigo → violet)
- **Canvas:** Pure white background, maximized
- **Toolbar:** Clean, minimal, single row along the bottom edge
- **Icons:** Simple, recognizable at 44px. No text labels — shape alone must communicate the tool
- **Active states:** Selected tool/color/size has a visible ring, border, or scale change

### 7.3 Typography

Minimal — the app has almost no text. Use the system font stack for any text that does appear (button tooltips in accessibility, the clear confirmation):
```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```
Large, bold text for the clear confirmation (24px+). Kids need to read it instantly.

---

## 8. Design Principles Applied

> References: `DESIGN_PRINCIPLES.md`

| Principle | Application in Draw With Rainbows |
|-----------|----------------------------------|
| **1. Sensory Feedback** | Every button press responds within one frame (scale or color). Drawing appears under the finger instantly with no perceptible lag. Flood fill shows its result immediately. |
| **2. Progressive Revelation** | The toolbar shows all tools at once — this app is simple enough that nothing needs to be hidden. Tapping the active tool reveals its options inline, which is the one layer of progressive disclosure. |
| **3. Return Triggers** | Auto-resume is the return trigger. A kid opens the tab and their drawing is still there. That's the invitation to keep going. |
| **4. Contribution Identity** | Not applicable — single-user, no collaboration, no attribution needed. |
| **5. Trust Architecture** | State silently persists (no data loss on refresh). Clear requires confirmation. No surprising behavior. The same action always does the same thing. |
| **6. Rhythm & Cadence** | Not applicable — no notifications, no digests, no time-based content. The app is a single-session tool. |
| **7. Depth Paths** | Not applicable — there's one screen. The "depth" is the creative exploration of colors, shapes, and tools. |
| **8. Microcopy & Voice** | The app has almost no text. The clear confirmation should be warm and simple: "Erase everything?" with "Yes" / "No" — not "Are you sure you want to clear the canvas?" The voice is playful and direct. |
| **9. Psychological Intent** | One screen, one activity, zero decisions required to start drawing. A 7-year-old should touch the screen and see color appear within 2 seconds of opening the app. Distraction-proof: no popups, no modals, no interruptions. If the kid is interrupted, their work survives (auto-resume). |

---

## 9. Performance & Constraints

### 9.1 Target Devices

- **Primary:** School-issued Chromebooks (low-end ARM processors, 4GB RAM, Chrome browser)
- **Secondary:** iPads (any generation in current school circulation, Safari)

### 9.2 Performance Requirements

- App loads and is drawable in under 2 seconds on a Chromebook
- No perceptible lag between pointer movement and paint appearing
- Flood fill completes in under 500ms on a full-screen canvas
- Undo restores in under 100ms

### 9.3 Memory

- Undo stack capped at 10–20 ImageData snapshots. On a 1920×1080 canvas, each snapshot is ~8MB uncompressed. 10 snapshots = ~80MB. Monitor this on low-RAM Chromebooks.
- localStorage has a ~5MB limit per origin. `toDataURL()` produces a base64 PNG that may exceed this for large canvases. If save fails, fail silently.

### 9.4 No Network

The app makes zero network requests. No analytics, no telemetry, no CDN fonts, no external resources. Everything is in the three files.

---

## 10. AI Agent Development Rules

When an AI agent generates code for this project, it must comply with all rules above plus the following:

### 10.1 Implementation Proposal

Before writing more than 50 lines of new code or modifying more than one file, the agent must summarize:
1. What it's changing and why
2. Which files it will touch and estimated line counts after the change
3. What could go wrong (touch conflicts, canvas coordinate bugs, memory issues, exceeding 200 lines)

### 10.2 Pre-Commit Checklist

- [ ] **200-line cap:** No file exceeds 200 lines.
- [ ] **Three files only:** No new files created.
- [ ] **No inline code:** No styles in HTML, no scripts in HTML, no inline event handlers.
- [ ] **Touch-first:** Tested with PointerEvents. No mouse-only or hover-only interactions.
- [ ] **Touch targets:** All interactive elements ≥ 44×44px.
- [ ] **No browser dialogs:** No `alert()`, `confirm()`, `prompt()`.
- [ ] **No external dependencies:** No CDN links, no npm packages, no build tools.
- [ ] **Canvas coordinates:** Pointer-to-canvas coordinate conversion accounts for CSS scaling and offset.
- [ ] **Auto-resume works:** Drawing survives a page refresh.
- [ ] **Undo works:** At least the last stroke can be undone.
- [ ] **Accessibility:** Icon buttons have `aria-label`. Active states are marked with `aria-pressed` or `aria-selected`.
- [ ] **Feature scope:** No features added that aren't in the locked feature table (§2.4).

### 10.3 Vibe Check

The intended emotion for every interaction: **effortless creative joy.** A 7-year-old touches the screen and magic happens. There are no wrong moves, no error states a kid can trigger, no confusion. The cognitive load is near zero — pick a color, draw. That's it.

If a proposed change adds cognitive load, decision points, or text a 2nd grader needs to read, it's wrong. Cut it.

---

## Appendix: Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-11 | Hard cap 200 lines per file, 3 files total | Forces ruthless simplicity. The old draft was 1,158 lines of CSS and ~2,140 lines of JS — unmaintainable bloat. |
| 2026-03-11 | Cut save/download feature | App is purely for fun. Kids don't need file management. |
| 2026-03-11 | Cut keyboard shortcuts | Target devices are touch-first (Chromebooks in tablet mode, iPads). |
| 2026-03-11 | Cut hover effects | No hover on iPad. Touch-only interaction model. |
| 2026-03-11 | 3 brush shapes max (star, heart, flower) | Line budget constraint — each shape is 10–15 lines of path geometry. Four shapes would blow the JS budget. |
| 2026-03-11 | In-canvas clear confirmation instead of browser dialog | Browser dialogs are ugly, inconsistent across devices, and jarring for kids. |
| 2026-03-11 | Silent auto-resume via localStorage | Kids accidentally close tabs. Their drawing should survive. No UI needed — it just works. |
| 2026-03-11 | PointerEvents only, no mouse/touch events | PointerEvents unify mouse, touch, and pen input. One handler set covers Chromebook trackpads, touchscreens, and iPad fingers. |
| 2026-03-11 | No external dependencies whatsoever | School network filtering can block CDNs. Zero dependencies = zero failure modes from the network. |

---

*This document was generated from `PROJECT_RULES_TEMPLATE.md`. For the
universal design philosophy behind these rules, see `DESIGN_PRINCIPLES.md`.*
