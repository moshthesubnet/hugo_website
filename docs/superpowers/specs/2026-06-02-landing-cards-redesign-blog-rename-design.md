# Landing-page card redesign + "Writing" → "Blog" rename

**Date:** 2026-06-02
**Project:** moshthesubnet.com (Hugo + Congo, Cloudflare Pages)
**Status:** Approved design — ready for implementation planning

## Overview

Redesign the Blog and Projects cards on the home landing page (and the matching
index pages) into a cleaner, text-forward style, and rename the "Writing"
section to "Blog" across the site — including the URL path, with redirects.

The current home cards lean entirely on a text-heavy Open Graph feature image:
the image bakes in the title, description, tags, and a "WRITING" label, while
the card body below shows only a numbered badge, a date, and tags (empty on most
posts). The lower half of each card looks bare, and the small in-card rendering
of a 1200×630 share image reads as a shrunken social card rather than a designed
thumbnail.

The new design (chosen interactively as "Direction C2") drops the baked-in image
from the card display, uses real HTML text, and replaces the thumbnail with a
quiet per-section line-icon panel.

## Goals

- Replace home-page Blog/Projects cards with text-forward "icon-row" cards.
- Apply the same card style to the `/blog` and `/projects` index pages.
- Rename "Writing" → "Blog" everywhere: nav tab, home section heading, page
  title, **and the URL path** (`/writing/<slug>/` → `/blog/<slug>/`), with 301
  redirects so existing links don't break.
- Regenerate the writing feature images so the baked-in corner label reads
  "BLOG" instead of "WRITING".

## Non-goals / Out of scope

- No change to the Projects feature images (they keep their "PROJECTS" label).
- No change to article (single-post) page layouts.
- No new per-post illustration/photography assets — thumbnails are
  CSS-generated icon panels, not bespoke images.
- No change to the site's color system, fonts, or overall information
  architecture beyond the section rename.

## Decisions made (with rationale)

1. **Card direction: C2 — text-forward icon rows.** Real HTML title +
   description gives crisp, selectable, accessible, indexable text and fixes the
   bare-card-body problem. Chosen over keeping the image-forward card (A) and the
   full-bleed overlay tile (B).
2. **Thumbnail treatment: section-icon panel.** A single quiet line-icon per
   section on a subtle gradient panel. Chosen over a numbered panel (C1) and no
   thumbnail (C3) because it stays uniform and on-brand ("content-first, no
   gimmicks") while still giving each row a visual anchor.
3. **Scope: apply sitewide.** The icon-row card is used on the landing page AND
   the `/blog` + `/projects` index pages, for a consistent look. Chosen over
   landing-page-only.
4. **Meta row: date + reading time.** Shows `Mon D, YYYY · N min read` using
   Hugo's `.ReadingTime`. Only affects these cards, not article pages (where
   `showReadingTime` stays `false`).
5. **Rename includes the URL path** (`/writing/` → `/blog/`) with 301 redirects.
   Chosen over a label-only change for full consistency; redirects prevent broken
   links.
6. **Regenerate OG images to "BLOG".** With C2 the `feature.png` is no longer
   displayed in cards — it now serves only as the social/OG share image — so the
   baked label should match the new section name.

## Design details

### Component: shared icon-row card

A single partial renders the card everywhere. Today the home page uses its own
inline `.home-card` markup while index pages use
`layouts/_partials/article-link.html`. Consolidate to one partial
(`article-link.html`) so the home page and both index pages draw from the same
component.

Card structure (the whole row is the link to the post):

- **Icon panel** — left, ~92px square, `border-radius` ~10px, subtle gradient
  background (`linear-gradient(135deg,#13201d,#0d0d0d)`) with a `#1c2421` border.
  Inline SVG icon chosen by section:
  - `blog` → document glyph
  - `projects` → code glyph (`</>`)
  - Stroke `#5eead4` at ~0.78 opacity.
- **Title** — Georgia serif, `~1.18rem`, color `#fafafa`, links to the post.
- **Description** — `.Description`, color `#8a8a8a`, clamped to ~2 lines.
- **Meta** — `Mon D, YYYY · N min read`, Fira Code mono, `#737373`, with the
  reading-time portion in teal (`#5eead4`). Reading time from `.ReadingTime`.
  This meta is **uniform across both sections**, matching the approved mockup.
  It replaces the partial's current per-section split (date for writing, the
  `stack` param for projects); `stack` still appears on the project's own page
  via `article-meta`, just not on the card.
- **Hover** — row background `#0f0f0f → #131313`, icon panel border →
  `rgba(94,234,212,.5)`, title → `#5eead4`. ~0.15s transition.

Section detection drives the icon choice (document vs code glyph). The partial
currently special-cases `Section == "writing"` for meta; that branch is replaced
by the uniform meta above, so the only remaining section-specific logic is the
icon.

### Layout

Single-column stacked rows separated by hairline top-rules (`1px #161616`),
first row borderless — matching the approved mockup.

- **Home (`layouts/index.html`):** Blog and Projects sections each render
  `first 3` posts via the partial, under the existing small uppercase section
  labels (now `BLOG` / `PROJECTS`). Replace the `.home-card-grid` 3-column grid
  with a stacked list container.
- **Index pages (`layouts/list.html`):** already iterates `.Data.Pages` through
  `article-link.html`; it inherits the new card automatically. Wrap entries in a
  `.card-list` container; the page `<h1>` ("Blog" / "Projects") stays.

### CSS (`assets/css/custom.css`)

- Add a clean `.entry-card` (or `.card-row`) rule set: row flex layout, icon
  panel, serif title, clamped description, mono meta, hover states, and a
  responsive rule (icon shrinks to ~64px on mobile; row stays horizontal).
- Remove now-dead rules: `.home-card*`, `.home-card-num`, `.home-card-thumb`
  (+ `::after` overlay), and `.list-entry*`.

### Rename: "Writing" → "Blog" (URL + redirects)

- `git mv content/writing content/blog` (preserves history; moves all bundles).
- Update `images:` front matter in each post bundle:
  `/writing/<slug>/feature.png` → `/blog/<slug>/feature.png` (8 posts).
- `config/_default/menus.en.toml`: `name "Writing" → "Blog"`,
  `pageRef "writing" → "blog"`.
- `config/_default/params.toml`: `mainSections = ["blog"]`.
- `content/blog/_index.md`: `title` → "Blog" (keep/adjust description).
- `layouts/index.html`: section label `WRITING → BLOG`; query
  `where … "Section" "writing"` → `"blog"`.
- `layouts/_partials/article-link.html`: section check `"writing"` → `"blog"`.
- **Redirects:** create `static/_redirects` (Hugo copies `static/*` to
  `public/`; Cloudflare Pages honors `_redirects`):
  ```
  /writing/        /blog/            301
  /writing/*       /blog/:splat      301
  ```
- Grep the repo for any remaining `/writing/` internal links (content, params,
  layouts) and update them.

### Regenerate OG feature images to "BLOG"

- Update `scripts/generate-og-images.py` (the serif-title generator that matches
  the current `feature.png` images):
  - Point `CONTENT_DIR` at `content/blog`.
  - Walk the page-bundle layout (`content/blog/*/index.md`) instead of flat
    `*.md`, and write `feature.png` into each post's bundle directory (the
    current images live in-bundle, not in `static/img/posts/`).
  - Change the baked label `"WRITING"` → `"BLOG"`.
  - During implementation, confirm `generate-og-images.py` (not
    `generate-og-cards.py`) produced the current images; reconcile or remove the
    redundant script if confirmed legacy.
- Rerun the generator; commit the 8 regenerated `feature.png` files.

## Files touched

- `layouts/index.html` — home Blog/Projects sections, rename, query.
- `layouts/list.html` — `.card-list` wrapper (minor).
- `layouts/_partials/article-link.html` — rewrite into the shared icon-row card.
- `assets/css/custom.css` — new `.entry-card` styles; remove dead
  `.home-card*` / `.list-entry*` rules.
- `config/_default/menus.en.toml`, `config/_default/params.toml`.
- `content/blog/` (renamed from `content/writing/`) — `_index.md` + 8 posts'
  `images:` paths.
- `static/_redirects` — new.
- `scripts/generate-og-images.py` — update + rerun; regenerated
  `content/blog/*/feature.png`.

## Verification

- `hugo --minify` builds clean (the `layouts/_partials/functions/warnings.html`
  override for the Congo/Hugo 0.157 incompatibility stays in place).
- On the running dev server (`make serve`, host IP): both home sections and both
  index pages render the icon-row cards; titles read "Blog"; date + reading time
  show; hover states behave.
- `/blog/<slug>/feature.png` resolves; regenerated images read "BLOG".
- `public/_redirects` exists after build with the two rules (note: redirects
  only resolve on Cloudflare, not local `hugo serve` — verify file contents
  locally and, if desired, on a Pages preview deploy).
- No remaining `/writing/` internal links.

## Risks / edge cases

- **`cross-vlan-network-monitor` exists in both sections** (blog + projects).
  After rename, `/blog/cross-vlan-network-monitor/` and
  `/projects/cross-vlan-network-monitor/` coexist; the wildcard redirect covers
  the old `/writing/...` path. No conflict.
- **OG generator drift** — scripts predate the page-bundle restructure (commit
  bcab3d0) and currently target flat files + `static/img/posts/`. They must be
  updated to the bundle layout before rerunning, or they will no-op.
- **Local redirect testing gap** — `_redirects` is a Cloudflare feature; can't be
  exercised by `hugo serve`. Verify by file inspection and/or a preview deploy.
