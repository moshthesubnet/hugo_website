# Design Spec: Animated Homepage Redesign

**Date:** 2026-04-22
**Status:** Approved
**Reference:** [devikakg.netlify.app](https://devikakg.netlify.app/)

## Overview

Shift moshthesubnet.com's homepage from a minimal, static aesthetic toward a more animated, visually expressive feel — incorporating six design elements observed on the reference site (detailed as seven implementation units below, since the glowing ring and floating chips are two separate CSS components of one visual feature). The existing color palette (near-black `#111111`, muted teal `#5eead4`) is preserved throughout.

## Implementation Approach

**Option C — Local JS bundle + CSS keyframes.** No external CDN libraries. One self-contained JS file (~3–4KB) added to `static/js/hero-animations.js` and loaded via `layouts/_partials/extend-head.html`. CSS keyframes handle the glow ring and floating chips. HTML changes are scoped to `layouts/index.html`. All six elements decomposed below.

---

## Element 1: Glowing Animated Photo Ring

**Location:** `.home-hero-photo` wrapper in `layouts/index.html`

**Design:**

- A new wrapper `<div class="home-hero-photo-wrap">` wraps the existing `<img>` tag.
- The wrapper gets a slow pulsing `box-shadow` in `#5eead4` at low opacity (~20%) that breathes using a `@keyframes glow-pulse` animation (ease-in-out, ~3s, infinite).
- A rotating arc is produced via a `conic-gradient` border on a `::before` pseudo-element that spins continuously with `@keyframes ring-spin` (linear, ~6s, infinite).
- The photo itself stays 240×240px circular. The wrapper expands by ~32px on all sides to give floating chips clearance from the adjacent text column.

**CSS additions to `assets/css/custom.css`:**

- `.home-hero-photo-wrap` — `position: relative; width: 304px; height: 304px; flex-shrink: 0;`
- `.home-hero-photo-wrap::before` — rotating conic-gradient arc pseudo-element
- `@keyframes glow-pulse`, `@keyframes ring-spin`
- `.home-hero-photo` — updated sizing to fill wrapper, remove old `border`

---

## Element 2: Floating Skill Chip Badges

**Location:** Inside `.home-hero-photo-wrap` in `layouts/index.html`

**Design:**

Four chips positioned absolutely around the photo ring:

- **Networking** — top-left
- **Linux** — bottom-left
- **Cloud** — top-right
- **Automation** — bottom-right

Each chip floats with a gentle vertical oscillation via `@keyframes chip-float` (ease-in-out, ~3s, infinite) with staggered `animation-delay` values (0s, 0.75s, 1.5s, 2.25s) so they move independently.

**Chip styling:** Similar to existing `.home-card-tag` — `background: #1a1a1a; border: 1px solid #5eead4; border-radius: 3px; color: #5eead4; font-size: 0.75rem; padding: 0.25rem 0.625rem; white-space: nowrap;`

**CSS additions:** `.home-hero-chip`, `@keyframes chip-float`

---

## Element 3: Typewriter Animation

**Location:** `.home-hero-tagline` in `layouts/index.html`

**Design:**

The static tagline is replaced with a cycling `<span id="hero-typewriter">` that the JS bundle cycles through three phrases:

1. `Network Enthusiast.`
2. `Homelab Wrecker.`
3. `Tech Content Wannabe.`

The JS types each phrase character by character (~80ms/char), holds for ~2s, deletes character by character (~40ms/char), then moves to the next phrase. A blinking cursor `|` is appended via a CSS `::after` pseudo-element on `#hero-typewriter`.

**JS:** Implemented in `static/js/hero-animations.js` — ~40 lines, no library.

**CSS:** `#hero-typewriter::after` blinking cursor animation.

---

## Element 4: Particle / Star Field Background

**Location:** Hero section only (`<section class="home-hero">`)

**Design:**

The JS bundle injects a `<canvas id="hero-particles">` as the first child of `.home-hero`. The canvas is positioned `absolute`, `z-index: 0`, covering the full hero section. All hero content stays at `z-index: 1` (relative positioning).

The canvas draws ~60 small dots:

- Color: white at ~15% opacity
- Size: 1–2px radius, randomly distributed
- Behavior: each dot drifts slowly in a random direction, wrapping at edges
- Animation: `requestAnimationFrame` loop — lightweight, pauses when tab is not visible via `document.addEventListener('visibilitychange')`

**CSS additions:**

- `.home-hero` — `position: relative; overflow: hidden;`
- `#hero-particles` — `position: absolute; inset: 0; z-index: 0; pointer-events: none;`
- `.home-hero > *:not(canvas)` — `position: relative; z-index: 1;`

**JS:** Implemented in `static/js/hero-animations.js` — ~60 lines.

---

## Element 5: Numbered Project Cards

**Location:** `.home-card-grid` in `layouts/index.html` (both Writing and Projects sections)

**Design:**

Each card in the grid gets a zero-padded sequential number badge (`01`, `02`, `03`) in the top-right corner:

- Positioned `absolute; top: 0.75rem; right: 0.875rem`
- Font: `'Fira Code', monospace; font-size: 0.75rem`
- Color: `#5eead4` at 30% opacity (`color: rgba(94, 234, 212, 0.3)`)
- The numbering is done via Hugo template using `{{ printf "%02d" (add $i 1) }}` inside the `range` loop

**Image overlay on hover:**
`.home-card-thumb::after` pseudo-element fades in on `.home-card:hover` — `background: rgba(94, 234, 212, 0.08)` — subtle teal wash, `transition: opacity 0.2s`.

**CSS additions:** `.home-card-num`, `.home-card-thumb::after` + transition rules.

**Hugo template change:** `layouts/index.html` — both `range` loops updated to use `range $i, $post := $posts` and `range $i, $project := $projects`.

---

## Element 6: Section Labels (Eyebrow Text)

**Location:** `layouts/index.html` — three homepage sections

**Design:**

Small uppercase label added above each section heading using the existing `.home-section-label` CSS class (already defined: `color: #737373; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase`):

- Recent Writing section → `WRITING`
- Featured Projects section → `PROJECTS`
- Contact section → `GET IN TOUCH`

Three `<div class="home-section-label">` additions to `layouts/index.html`. No new CSS required.

---

## Element 7: Social Links — Icon + Label

**Location:** `.home-social-icons` in `layouts/index.html`

**Design:**

Current bare SVG icons get a `<span>` text label added alongside each icon:

- GitHub → `<span>GitHub</span>`
- LinkedIn → `<span>LinkedIn</span>`
- Instagram → `<span>Instagram</span>`

Each `.home-social-link` anchor becomes a flex row: `display: flex; align-items: center; gap: 0.4rem;`

Label text: `font-size: 0.8125rem; color: #5eead4;`

**CSS changes:** `.home-social-link` — add `gap: 0.4rem;`, `.home-social-label` — text styling.

---

## Files Changed

- `assets/css/custom.css` — additions only: glow ring, chips, typewriter cursor, particles, card num, social label
- `layouts/index.html` — HTML restructure: photo wrapper, chips, typewriter span, canvas, card numbering, section labels, social labels
- `static/js/hero-animations.js` — new file: typewriter + particles (~100 lines vanilla JS)
- `layouts/_partials/extend-head.html` — add `<script src="/js/hero-animations.js" defer></script>`

## Responsive Behavior

- Floating chips hidden on mobile (`max-width: 640px`) — too cramped in stacked layout
- Particles canvas disabled on mobile via JS (`window.innerWidth < 641`) — performance consideration
- Numbered badges remain on all screen sizes
- Social icon+label — labels hidden on mobile, icons only (matching current behavior)

## Out of Scope

- No changes to writing/project content pages
- No changes to the nav, footer, or about/writing/projects list pages
- No palette changes — `#111111` background, `#5eead4` accent throughout
- No new npm dependencies or build tooling
