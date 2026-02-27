# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo static site using the [Congo](https://github.com/jpanther/congo) theme, migrated from MkDocs Material. Deployed on Cloudflare Pages.

- **Hugo version**: 0.157.0 Extended (required — Congo needs the extended build for CSS processing)
- **Theme**: Congo v2.13.0, added as a git submodule at `themes/congo/`
- **Content**: Markdown files in `content/`
- **Deploy target**: Cloudflare Pages (build output: `public/`)

## Migration

`migrate.py` migrates content from the MkDocs source repo (`moshthesubnet/my-lab-docs`) into this Hugo project.

```bash
# Clone from GitHub and migrate (default)
python3 migrate.py

# Use an existing local clone
python3 migrate.py --source /path/to/my-lab-docs
```

Requires PyYAML (`python3 -m pip install pyyaml`). The script handles admonitions, tabs, internal links, icons, image paths, front matter, assets, and AOS scripts. See the end-of-run summary for manual follow-up items (custom CSS selectors, home page layout, material icons).

## Commands

```bash
# Local dev server — accessible on the host IP (recommended)
make serve

# Local dev server — localhost only
hugo server -D

# Production build
hugo --minify

# New content page
hugo new content docs/my-page.md
```

`make serve` auto-detects the host IP via `hostname -I` and binds to all interfaces, so the site is reachable from other devices on the network at `http://<host-ip>:1313/`.

## Architecture

### Content Structure

Content lives in `content/` and maps directly to URL paths:

- `content/_index.md` — home page
- `content/docs/` — documentation section (sidebar auto-generated from directory structure)
- Add new sections by creating `content/<section>/_index.md`

Sidebar navigation is **automatically generated** from the `content/docs/` directory hierarchy. Control ordering with `weight` frontmatter. Use `_index.md` files to title sections.

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
