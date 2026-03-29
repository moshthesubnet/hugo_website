# Logo Design Spec: Switch Stack

**Date:** 2026-03-29
**Project:** moshthesubnet.com
**Status:** Approved

## Concept

"Switch Stack" — four horizontal bars styled as network switch front panels, stacked vertically with a subtle leftward cascade and increasing opacity from top to bottom. Each bar has four port cutouts and a warm white status LED. Evokes racked networking hardware in a stylized, minimal way that fits the site's design language.

## The Mark

### Shape
- Four horizontal rectangles (switch bars), stacked vertically with even spacing
- Each bar has four small square port cutouts evenly spaced across its face
- Each bar has a small circular LED indicator on its left edge
- Bars cascade subtly to the left from top to bottom (1px offset per bar)
- Total mark is roughly square in proportion — compact enough to sit beside header text

### Proportions
- Each bar: 18 units wide, 3.5 units tall
- Port cutouts: 1.5 x 1.5 units, evenly spaced starting after the LED
- LED: 0.7 unit radius circle, positioned on the left edge of each bar
- Bar spacing: ~1.5 units between bars
- Cascade offset: ~1px per bar leftward (subtle, not dramatic)

## Color Treatment

### Primary (header icon, dark background)
- Switch bars: teal (#5eead4) with increasing opacity top to bottom
  - Bar 1 (top): 0.3 opacity
  - Bar 2: 0.5 opacity
  - Bar 3: 0.75 opacity
  - Bar 4 (bottom): 1.0 opacity
- Port cutouts: background color (#111111), matching bar opacity
- LED dots: warm white (#fafafa), matching bar opacity
- The opacity fade creates a "signal strengthening" or "stack powering up" effect

### Favicon (simplified)
- Four cascading bars in teal (#5eead4) with same opacity fade
- Port cutouts and LEDs omitted at favicon scale (too small to render)
- Background: transparent

### Hover State (header)
- On hover, all four bars transition to full opacity (1.0)
- All LEDs and ports become fully visible — like the whole stack "coming online"
- Subtle CSS transition on opacity

## Placement & Sizing

### Header
- Mark sits to the left of "Skyler King" with ~8px gap
- Vertically centered with the text
- Mark height matches cap-height of header text (~14-17px)
- The whole unit (icon + text) remains left-aligned in the nav

### Mobile
- Same layout, same proportions — no changes needed

### Favicon
- Simplified version (bars only, no ports/LEDs) at 16x16 and 32x32
- Replaces current favicon.png and favicon-32.png

## File Format

- **Header logo:** Inline SVG — scalable, CSS-stylable for hover transition
- **Favicon:** PNG exported from SVG source at 16x16 and 32x32
- **Source SVG:** Stored at `assets/img/logo.svg`

## Files Affected

- `assets/img/logo.svg` — new SVG source file
- `static/assets/favicon.png` — replaced with new favicon
- `static/assets/favicon-32.png` — replaced with new favicon
- `layouts/_partials/logo.html` — override Congo's theme partial to add inline SVG before site title
- `assets/css/custom.css` — add hover transition for logo mark

## Design Constraints

- Must be legible at 16x16 (favicon) — ports/LEDs drop out, bars remain
- No rounded corners on bars — matches site's angular aesthetic
- No gradients, shadows, or glow effects — matches minimal theme
- Works on dark background only (no light mode variant needed)
- LED circles are the only curved element — acceptable as a hardware-authentic detail
