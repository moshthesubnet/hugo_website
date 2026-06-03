# Hugo 0.157.0 → 0.162.1 + Congo v2.13.0 → v2.14.0 version bump

**Date:** 2026-06-03
**Project:** moshthesubnet.com (Hugo + Congo, Cloudflare Pages)
**Status:** Approved design — ready for implementation planning

## Overview

The site's build is pinned to Hugo **0.157.0** while local dev has drifted to
0.162.0 (auto-updating snap). On Hugo ≥0.158 the build emits four deprecation
warnings; three originate inside the pinned Congo **v2.13.0** theme, one in site
config. This task moves the pinned build forward to a current, supported
Hugo+Congo combination and clears all deprecation warnings.

The two upgrades are coupled: **Congo v2.14.0 requires Hugo ≥0.158.0** and is the
release that fixes the deprecated `Language` parameters. So Hugo and Congo move
together.

## Goals

- Bump the pinned Hugo version to **0.162.1** everywhere it is declared.
- Upgrade the Congo theme submodule **v2.13.0 → v2.14.0**.
- Achieve a clean `hugo --minify` build with **zero deprecation warnings** and no
  errors on the target versions.
- Reconcile the site's overridden theme templates with v2.14.0.
- Keep local Hugo from silently drifting ahead of the pin again.
- Update project docs to match.

## Non-goals / Out of scope

- No redesign, no content changes, no new features.
- No theme customization beyond what the upgrade forces.
- No Tailwind/CSS rework — `assets/css/custom.css` is unaffected (theme CSS
  changed only trivially between v2.13.0 and v2.14.0).
- No change to deploy architecture (still GitHub Actions → Cloudflare Pages).

## Background / findings

Clean build on Hugo 0.162.0 emits exactly four deprecation warnings:

| Warning | Origin | Fixed by |
|---|---|---|
| `languages.en.languageName` deprecated → use `label` | **site** `config/_default/languages.en.toml` | config edit |
| `.Language.LanguageDirection` → `.Direction` | site override `layouts/_partials/head.html` **and** theme `baseof.html`/`head.html` | override edit + Congo upgrade |
| `.Language.LanguageCode` → `.Locale` | theme `baseof.html` | Congo upgrade |
| `.Site.LanguageCode` → `.Site.Language.Locale` | theme `schema.html` | Congo upgrade |

Congo v2.13.0 → v2.14.0 diff (verified by fetching the tag locally):
- `baseof.html`: `Language.LanguageCode`→`.Locale`, `Language.LanguageDirection`→`.Direction`.
- `schema.html`: `.Site.LanguageCode`→`.Site.Language.Locale`.
- `head.html`: `Language.LanguageDirection`→`.Direction`, plus a new `hreflang`
  alternates block.
- `warnings.html`: the `{{ if .Author }}` block was **removed** — this is exactly
  what the site's override exists to suppress (the documented
  Congo+Hugo-0.124 `.Site.Author` incompatibility).
- `single.html`: a single-line addition.
- Theme CSS (`assets/css/main.css`, `compiled/main.css`): 2-line change only.
  The large diffs in v2.14.0 are vendored libs (mermaid/katex) and the theme's
  `exampleSite` — neither affects this site.

Site templates that shadow theme files (override reconciliation surface):
`single.html`, `index.html`, `list.html`, `_partials/head.html`,
`_partials/article-link.html`, `_partials/logo.html`,
`_partials/functions/warnings.html`, `_partials/header/basic.html`. Of these,
only `head.html` and `single.html` changed upstream between v2.13.0 and v2.14.0;
`logo.html`, `header/basic.html`, `list.html`, `index.html`, `article-link.html`
are unchanged upstream and need no reconciliation.

## Design

### 1. Version pins (Hugo → 0.162.1)

Update every declared pin:
- `.github/workflows/deploy.yml` — `hugo-version: '0.157.0'` → `'0.162.1'`.
- `.github/workflows/ci.yml` — `hugo-version: '0.157.0'` → `'0.162.1'`.
- `wrangler.toml` — both `HUGO_VERSION = "0.157.0"` entries → `"0.162.1"`.

### 2. Congo submodule (v2.13.0 → v2.14.0)

- The v2.14.0 tag has already been fetched into `themes/congo` locally during
  scoping. Implementation: `git -C themes/congo checkout v2.14.0`, then
  `git add themes/congo` in the parent repo to record the new submodule pointer.
- The submodule will be in detached HEAD at the v2.14.0 tag (normal for a pinned
  submodule).

### 3. Deprecation fixes + override reconciliation

- **`config/_default/languages.en.toml`**: rename the only deprecated key,
  `languageName = "English"` → `label = "English"`. (No `languageCode` or
  `languageDirection` keys are present at site level.)
- **`layouts/_partials/head.html`** (override): port the v2.14.0 changes —
  replace `site.Language.LanguageDirection` with `site.Language.Direction`, and
  add the `hreflang` alternates block (no-op for this single-language site,
  included for parity). Confirm the site's existing customizations in this file
  still apply after the edit; if the override no longer diverges from upstream
  v2.14.0 in any meaningful way, deleting it (to inherit the theme's) is
  acceptable.
- **`layouts/_partials/functions/warnings.html`**: **delete** the override. The
  v2.14.0 theme template no longer contains the `.Author` check that caused the
  panic, so the override is obsolete and the site inherits the theme version.
- **`layouts/single.html`** (override): diff against the v2.14.0 theme
  `single.html`; the upstream change is a single line — port it if it applies to
  this site's customized version, otherwise leave the override as-is and note
  why.
- No edits to `logo.html`, `header/basic.html`, `list.html`, `index.html`,
  `article-link.html` — unchanged upstream.

### 4. Documentation

- `CLAUDE.md`: update the Hugo version (`0.157.0` → `0.162.1`, in the project
  overview and the Cloudflare env-var note) and **remove/replace** the "Known
  Compatibility Issue" section about `warnings.html`, since Congo v2.14.0
  resolves it.
- `README.md`: update the Hugo version references (stack table, requirements
  note, structure comment, the `actions-hugo` `hugo-version` note) and the
  warnings.html compatibility-fix mentions.
- Congo version references: update `v2.13.0` → `v2.14.0` where the docs state the
  theme version.

### 5. Local pin (hand-off command)

After the repo changes, provide the user with:
`sudo snap refresh --hold hugo` (to stop snap auto-updating Hugo), with a note
confirming the held version should be 0.162.x. This is run by the user (sudo),
not by the implementer.

## Verification

- **Build / zero-warning gate:** `hugo --minify` exits with no `ERROR`/panic and
  emits **no `deprecat` warnings** (`hugo --minify 2>&1 | grep -i deprecat`
  returns nothing). This is the primary success criterion.
- **Output sanity:** site still builds 115 pages; home + `/blog` + `/projects`
  render the icon-row cards; an article page renders; mermaid/katex assets load.
- **Visual smoke-check:** on the dev server (`make serve`), confirm no layout
  regression on the home page, an article, and a page using mermaid — theme CSS
  changed only trivially, so this is a confirmation, not a deep audit.
- **Rollout via PR:** push the branch and open a PR. The GitHub Actions workflow
  builds on the **new pinned Hugo 0.162.1** and posts a `*.pages.dev` preview.
  Verify the preview (cards, an article, mermaid/katex, the `/writing/`→`/blog/`
  redirects still work) before merging to `main`.

## Risks / edge cases

- **Override drift:** the only risky override is `head.html`; the reconciliation
  is a one-line rename plus an optional additive block. Mitigated by diffing our
  override against both v2.13.0 and v2.14.0 during implementation.
- **Submodule branch tracking:** `.gitmodules` may track a branch (`stable`);
  checking out the `v2.14.0` tag detaches HEAD. This is intended for a pinned
  theme; recording the pointer via `git add themes/congo` is what matters.
- **CI = source of truth:** the local-vs-pinned mismatch is the reason for this
  task; after the bump, local (held at 0.162.x) and CI (0.162.1) agree. Verify on
  the PR preview, not only locally.
- **Behavioral changes 0.158–0.162:** beyond the four known deprecations, the
  zero-warning build + PR preview is the safety net for any other version-driven
  change. None are anticipated given the diff review.

## Files touched

- `.github/workflows/deploy.yml`, `.github/workflows/ci.yml`, `wrangler.toml`
- `themes/congo` (submodule pointer → v2.14.0)
- `config/_default/languages.en.toml`
- `layouts/_partials/head.html` (edit)
- `layouts/_partials/functions/warnings.html` (delete)
- `layouts/single.html` (review/port 1 line)
- `CLAUDE.md`, `README.md`
- (User-run, not committed) local `snap refresh --hold hugo`
