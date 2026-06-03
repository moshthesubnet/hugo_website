# Article Header Redesign

**Date:** 2026-06-03  
**Status:** Approved

## Problem

The article header on blog and project pages is redundant. It renders `date → title → description` as text, and then immediately renders the OG image card (`feature.png`) below it — which repeats the same title and description plus tags and domain. Together they create a double-header before the reader reaches any content.

Additionally, the header itself has too many stacked elements. The description paragraph largely repeats what the opening paragraph of the post says.

## Decision

Remove the OG card from article view and replace the current multi-element header with a minimal **metadata strip** below the title.

### Blog articles

```
[h1 title]

Blog · May 2026 · 8 min read
──────────────────────────────
[article content begins]
```

### Project pages

```
[h1 title]

Project · [stack front matter] · GitHub →
──────────────────────────────
[article content begins]
```

If no `stack` field is present, strip is `Project · GitHub →`. If no `source` field, strip is `Project · [stack]`. If neither, strip is `Project`.

## What Changes

### `layouts/single.html`

- Remove the `$feature` / `$cover` image block entirely — OG card no longer renders on-page.
- Remove the `<p class="article-summary">` description block.
- Replace the existing `article-date` / `article-label` div with a single `.article-meta-strip` element.
- For blog: strip = `Blog · {{ .Date.Format "January 2006" }} · {{ .ReadingTime }} min read`
- For projects: strip = `Project` + optional ` · {{ .Params.stack }}` + optional ` · <a href="{{ .Params.source }}">GitHub →</a>`
- Remove the multi-field `.article-meta` column block (stack/integrations/source row).

### `assets/css/custom.css`

- Remove `.article-summary` rule block.
- Remove `.article-meta`, `.article-meta-label`, `.article-meta-value` rule blocks.
- Add `.article-meta-strip`: `font-size: 0.8125rem`, `color: #525252`, single line, `margin-bottom: 2rem`.
- Links inside `.article-meta-strip` use the existing teal accent (`#5eead4`).

## Brand Flexibility

The `Blog` / `Project` label at the start of the strip is a natural slot for a logo mark or badge later. The structural change needed to accommodate that would be minimal (swap text for an inline SVG or `<img>`).

## Out of Scope

- Changing the `images:` front matter or OG meta tag wiring — the card still appears in social previews.
- Redesigning the `article-pagination` footer or sharing links.
- Changing the project `Integrations` field behavior elsewhere (it is simply no longer displayed in the header; the front matter remains valid).
