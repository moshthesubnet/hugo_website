# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo static site using the [Congo](https://github.com/jpanther/congo) theme, migrated from MkDocs Material. Deployed on Cloudflare Pages.

- **Hugo version**: 0.157.0 Extended (required — Congo needs the extended build for CSS processing)
- **Theme**: Congo v2.13.0, added as a git submodule at `themes/congo/`
- **Content**: Markdown files in `content/`
- **Deploy target**: Cloudflare Pages (build output: `public/`)

## Commands

```bash
# Local dev server — accessible on the host IP (recommended)
make serve

# Local dev server — localhost only
hugo server -D

# Production build
hugo --minify

# New blog post
hugo new content blog/my-post.md

# New project page
hugo new content projects/my-project.md
```

`make serve` auto-detects the host IP via `hostname -I` and binds to all interfaces, so the site is reachable from other devices on the network at `http://<host-ip>:1313/`.

## Architecture

### Content Structure

Content lives in `content/` and maps directly to URL paths:

- `content/_index.md` — home page (feed shows `blog/` only; controlled by `mainSections` in `params.toml`)
- `content/blog/` — blog posts; narrative/storytelling angle, linked from home feed
- `content/projects/` — technical spec deep-dives; linked from `/projects/` in the nav
- `content/about/` — about page

Add new sections by creating `content/<section>/_index.md`. Control nav links in `config/_default/menus.en.toml`.

### Configuration

Config is split into `config/_default/`:
- `hugo.toml` — baseURL, theme, markup, outputs
- `languages.en.toml` — title, `[params.author]` block, description
- `menus.en.toml` — top navbar links
- `params.toml` — colorScheme, appearance, search, homepage layout, article display, footer

### Cloudflare Pages Deployment

`wrangler.toml` specifies the project name and build output dir. In the Cloudflare Pages dashboard (or CI), set:
- **Build command**: `hugo --minify`
- **Build output directory**: `public`
- **Environment variable**: `HUGO_VERSION = 0.157.0`

### Congo Shortcodes

Congo provides shortcodes for common documentation patterns — use these instead of raw HTML:

- `{{< alert >}}` — info callout box
- `{{< alert "danger" >}}` — danger/error callout box
- `{{< alert "warning" >}}` — warning callout box
- `{{< mermaid >}} ... {{< /mermaid >}}` — Mermaid diagrams
- `{{< badge >}}` — inline badges
- `{{< button >}}` — styled buttons
- `{{< figure >}}` — images with captions
- `{{< lead >}}` — lead/intro paragraph text

### Customization

- Override any theme layout by copying it from `themes/congo/layouts/` to the site's `layouts/`
- Congo uses `_partials/` and `_shortcodes/` (underscore prefix, Hugo 0.126+ convention)
- Add custom CSS in `assets/css/custom.css` — Congo bundles it automatically
- Extend the `<head>` via `layouts/_partials/extend-head.html`

### Known Compatibility Issue

Congo v2.13.0 has a bug with Hugo 0.157.0: `_partials/functions/warnings.html` calls `{{ if .Author }}` on the site object, which panics because `.Site.Author` was removed in Hugo 0.124+. This is worked around by overriding that partial at `layouts/_partials/functions/warnings.html`.

# moshthesubnet.com

## Stack
- Hugo with Congo theme
- Deployed on Cloudflare Pages via GitHub Actions / Wrangler CLI
- Pushes to `main` trigger production deployment; PRs get a `*.pages.dev` preview URL posted as a comment

## Content
- Blog posts live in content/blog/ as markdown files
- Project docs live in content/projects/ as markdown files
- About page at content/about/_index.md
- Front matter follows Congo conventions (title, date, draft, tags, description, summary)

## Design language
- Colors: Near-black (#111111) background, muted teal (#5eead4) accent, neutral grays
- Headings: System sans-serif (body), Georgia (hero/page titles)
- Code blocks: Fira Code
- Aesthetic: minimal, content-first, single-column, no visual gimmicks
- Tone: professional with personality — dry networking humor, confident first-person

## Writing style
- Posts are portfolio-quality writeups: confident, technical, first-person
- Not tutorials — document the thinking and decision-making process, not just steps
