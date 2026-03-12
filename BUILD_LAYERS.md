# Draw With Rainbows — Build Layers

> **For AI agents:** Execute these layers in order. Complete and manually test
> each layer before starting the next. Every layer produces a working app —
> just with fewer features than the final version.
>
> **Rule:** At the end of every layer, all three files must be under 200 lines.
> If you're over budget, cut before you continue. Do not defer cleanup to a
> later layer.

---

## Layer 0: Skeleton

**Goal:** A visible, correctly-laid-out page with no interactivity.

**Build:**
- `index.html` — Full semantic structure: `<header>` (rainbow strip),
  `<main>` with `<canvas>`, `<footer>` / `<nav>` toolbar with placeholder
  buttons for all 5 tools, empty color strip container, size dot container,
  shape button container. Link `style.css` and `app.js`.
- `style.css` — CSS custom properties on `:root` for the full color theme
  and rainbow gradient. Layout: header strip, canvas filling remaining
  viewport height, toolbar fixed to bottom. `touch-action: none` on
  canvas. All toolbar items at 44×44px minimum. `env(safe-area-inset-*)`
  on toolbar. `prefers-reduced-motion` wrapper ready.
- `app.js` — `DOMContentLoaded` listener. Canvas element reference.
  Resize canvas to fill its container (account for device pixel ratio).
  Resize handler on window. Nothing else.

**Test:** Open `index.html` in a browser. You see a rainbow strip at the
top, a white canvas filling the middle, and a toolbar row at the bottom
with correctly-sized placeholder buttons. Resize the window — the canvas
adapts. No console errors.

**Estimated lines:** HTML ~60, CSS ~80, JS ~15

---

## Layer 1: Draw a Line

**Goal:** Touch the canvas and see color appear.

**Build:**
- `app.js` — State variables: `isDrawing`, `currentColor` (hardcode black),
  `currentSize` (hardcode medium). PointerEvent handlers: `pointerdown`
  starts a path, `pointermove` draws line segments, `pointerup` /
  `pointercancel` ends the stroke. Coordinate conversion from page space
  to canvas space using `getBoundingClientRect()`. Set `lineCap: 'round'`,
  `lineJoin: 'round'`.

**Test:** Touch or click-drag on the canvas. A smooth black line follows
your finger/cursor. Lift and touch again — a new, separate stroke begins.
No drawing occurs outside the canvas. No scroll or zoom on touch.

**Estimated lines:** HTML ~60, CSS ~80, JS ~40

---

## Layer 2: Colors

**Goal:** Pick a color from the toolbar and draw in that color.

**Build:**
- `index.html` — Populate the color strip container with 12 swatch
  buttons. Each has a `data-color` attribute and an `aria-label`.
- `style.css` — Swatch styling: circles or rounded squares, 2-row layout
  in the toolbar, selected state (ring or scale).
- `app.js` — Color array constant. Click handler on swatch container
  (event delegation). Update `currentColor`. Apply `aria-selected` to
  active swatch. Use `currentColor` in stroke rendering.

**Test:** Tap swatches. The selected one gets a visual indicator. Draw —
the line appears in the selected color. Switch colors mid-session — new
strokes use the new color, old strokes are unaffected.

**Estimated lines:** HTML ~70, CSS ~110, JS ~55

---

## Layer 3: Sizes

**Goal:** Pick a brush size and see the difference on canvas.

**Build:**
- `index.html` — Three size dot buttons in the toolbar, each with
  `data-size` attribute and `aria-label`.
- `style.css` — Size dots styled as actual-size circles (small, medium,
  large). Selected state indicator.
- `app.js` — Size constant (e.g., 4, 12, 28). Click handler on size
  container. Update `currentSize`. Apply `aria-selected`. Feed size into
  `lineWidth` during drawing.

**Test:** Tap each size dot. The selected one highlights. Draw — line
thickness matches the dot you picked. Switching sizes mid-session works.

**Estimated lines:** HTML ~75, CSS ~120, JS ~65

---

## Layer 4: Tool Switching (Brush + Eraser)

**Goal:** Toggle between brush and eraser. Eraser works.

**Build:**
- `style.css` — Active tool indicator (background highlight, ring, or
  scale on the selected tool icon).
- `app.js` — `currentTool` state variable. Click handler on tool buttons.
  When eraser is active, set `globalCompositeOperation` to
  `'destination-out'` during strokes; reset to `'source-over'` for brush.
  Apply `aria-pressed="true"` to active tool.

**Test:** Tap brush — it highlights. Draw in color. Tap eraser — it
highlights, brush de-highlights. Draw — it erases to white. Switch back
to brush — drawing works normally again.

**Estimated lines:** HTML ~75, CSS ~130, JS ~80

---

## Layer 5: Undo + Clear

**Goal:** Undo the last stroke. Clear the canvas with confirmation.

**Build:**
- `app.js` — Undo stack: array of `ImageData` snapshots. On
  `pointerdown`, push current canvas state onto the stack (cap at ~15
  entries, shift oldest). Undo button pops the stack and restores. Clear
  button triggers an in-canvas confirmation overlay (draw a semi-transparent
  rect + "Erase everything?" text + Yes/No hit regions, or toggle a pair
  of hidden DOM confirmation buttons). On confirm: clear canvas, clear undo
  stack. On cancel: dismiss overlay.

**Design decision — clear confirmation UI:** Two approaches are viable.
(a) Draw the confirmation directly on the canvas using `fillRect` and
`fillText`, detect taps by coordinate. Keeps DOM minimal but mixes UI
into the drawing surface. (b) Use two hidden HTML buttons that become
visible on clear-tap, positioned over the canvas via CSS. Cleaner
separation. **Recommend (b)** — it avoids polluting the canvas ImageData
and is easier to style for kids.

**Test:** Draw several strokes. Tap undo — the last stroke disappears.
Tap undo again — the one before that disappears. Tap undo with nothing
to undo — nothing happens, no error. Tap clear — confirmation appears.
Tap "No" — confirmation disappears, drawing intact. Tap clear then "Yes"
— canvas is blank.

**Estimated lines:** HTML ~80, CSS ~145, JS ~115

---

## Layer 6: Brush Shapes (Star, Heart, Flower)

**Goal:** Draw with stamp-based shapes instead of round strokes.

**Build:**
- `index.html` — Three shape buttons in toolbar with `data-shape` and
  `aria-label`.
- `style.css` — Shape button styling and selected state.
- `app.js` — `currentShape` state variable (round / star / heart /
  flower). Three shape-drawing functions that take (ctx, x, y, size) and
  draw the shape using `beginPath` + line/curve math. Modify the
  `pointermove` handler: if shape is round, use normal `lineTo`; if shape
  is star/heart/flower, stamp the shape at the pointer position at
  intervals (throttle stamps to avoid overlap blobs). Round is the default.

**Density note:** Each shape function is 10–15 lines of trig / Bezier
math. This is the most line-expensive feature. Keep the math tight —
precompute angles for star points, use symmetry for heart.

**Test:** Select star shape. Draw — stars appear along the stroke path.
Select heart — hearts appear. Select flower — flowers appear. Select
round (default) — normal smooth line. Shapes respect current color and
size. Shapes work with eraser (destination-out compositing erases in the
shape's footprint).

**Estimated lines:** HTML ~80, CSS ~155, JS ~170

---

## Layer 7: Fill Bucket + Rainbow

**Goal:** Flood fill areas. Rainbow brush and rainbow fill.

**Build:**
- `app.js` — Flood fill function: get `ImageData`, scanline or queue-based
  fill algorithm, tolerance for anti-aliased edges. Wire to fill tool
  button — on `pointerdown` (not move), fill at the tap coordinate with
  `currentColor`. Rainbow brush: when rainbow mode is active, cycle hue on
  each `pointermove` event (increment by stroke distance or fixed step,
  convert HSL → hex or use `ctx.strokeStyle = hsl(...)`). Rainbow fill:
  when fill tool is active and rainbow mode is on, fill with a gradient
  or hue-shifted pattern instead of a solid color.
- `index.html` — Rainbow toggle button in the color strip area.
- `style.css` — Rainbow toggle styling (rainbow gradient background on
  the button itself, active state).

**Line budget warning:** This is the final feature layer. After this,
`app.js` should be at or near 200 lines. The flood fill algorithm is the
most code-dense piece (~30–40 lines for a compact scanline fill). If
over budget, simplify rainbow fill (e.g., solid hue-shifted color rather
than gradient pattern).

**Test:** Select fill tool. Tap inside a closed drawn region — it fills
with the current color. Tap outside — the background fills. Toggle
rainbow mode. Draw with brush — the stroke cycles through hues. Select
fill + rainbow — fill produces a rainbow-tinted result. Turn rainbow off
— back to solid colors.

**Estimated lines:** HTML ~80, CSS ~165, JS ~200

---

## Layer 8: Auto-Resume + Polish

**Goal:** Drawing survives a page refresh. Accessibility and edge cases
are solid.

**Build:**
- `app.js` — On `pointerup` (stroke end) and on clear-confirmed, save
  `canvas.toDataURL()` to localStorage. On `DOMContentLoaded`, check for
  saved data, create an `Image`, draw it onto the canvas. Wrap all
  localStorage calls in try/catch (quota exceeded or blocked = silent
  failure).
- Audit all `aria-label` values. Audit `aria-pressed` / `aria-selected`
  toggling. Verify tab order.
- `style.css` — Final polish pass: verify 44px tap targets on all
  interactive elements, check safe-area insets, confirm
  `prefers-reduced-motion` wrapping on all transitions.

**Test:** Draw something. Refresh the page — drawing is still there.
Draw more on top of the restored drawing. Clear and confirm — refresh
shows a blank canvas (localStorage was cleared). Open in a private
window with localStorage blocked — app works normally, just no resume.
Screen reader audit: every button is announced correctly.

**Final line counts must be:** HTML ≤ 80, CSS ≤ 180, JS ≤ 200.

**Estimated lines:** HTML ~80, CSS ~175, JS ~200

---

## Layer Dependency Graph

```
L0: Skeleton
 └─ L1: Draw a Line
     └─ L2: Colors
         └─ L3: Sizes
             └─ L4: Tool Switching (Brush + Eraser)
                 └─ L5: Undo + Clear
                     └─ L6: Brush Shapes
                         └─ L7: Fill Bucket + Rainbow
                             └─ L8: Auto-Resume + Polish
```

Each layer depends on the one above it. No layer can be skipped. Each
layer produces a working, testable app.

---

## Line Budget Tracker

Use this table to track actual line counts after each layer. If any file
exceeds its cap, stop and fix before continuing.

| Layer | HTML | CSS | JS | Status |
|-------|------|-----|----|--------|
| L0 | /80 | /180 | /200 | |
| L1 | /80 | /180 | /200 | |
| L2 | /80 | /180 | /200 | |
| L3 | /80 | /180 | /200 | |
| L4 | /80 | /180 | /200 | |
| L5 | /80 | /180 | /200 | |
| L6 | /80 | /180 | /200 | |
| L7 | /80 | /180 | /200 | |
| L8 | /80 | /180 | /200 | |

---

## Critical Risk: The JS Line Budget

`app.js` at 200 lines is the binding constraint. Here's where the pressure
peaks:

- **Layer 6** adds ~55 lines of shape geometry. If the prior layers are
  loose, this is where you hit the wall.
- **Layer 7** adds ~30–40 lines of flood fill. This is the last major
  feature addition.
- **Layer 8** adds ~10 lines of localStorage. If you're at 195 after L7,
  you have room. If you're at 205, you need to compress something in L6
  or L7 before continuing.

**Escape valves if over budget:**
1. Simplify shape math (fewer points on star, simpler heart curve)
2. Reduce flood fill tolerance handling (skip anti-alias edge smoothing)
3. Inline the rainbow hue cycle instead of a separate function
4. Reduce undo stack cap (fewer snapshots = simpler bounds checking)

Do **not** create a fourth file. The three-file constraint is non-negotiable.

---

*Companion documents: `PROJECT_RULES.md` (the rules), `DESIGN_PRINCIPLES.md`
(the philosophy).*
