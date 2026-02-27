# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo static site using the [Hextra](https://github.com/imfing/hextra) theme, migrated from MkDocs Material. Deployed on Cloudflare Pages.

- **Hugo version**: 0.157.0 Extended (required — Hextra needs the extended build for CSS processing)
- **Theme**: Hextra, added as a git submodule at `themes/hextra/`
- **Content**: Markdown files in `content/`
- **Deploy target**: Cloudflare Pages (build output: `public/`)

## Commands

```bash
# Local dev server (live reload, includes drafts)
hugo server -D

# Production build
hugo --minify

# New content page
hugo new content docs/my-page.md
```

## Architecture

### Content Structure

Content lives in `content/` and maps directly to URL paths:

- `content/_index.md` — home page (uses `layout: hextra-home`)
- `content/docs/` — documentation section (sidebar auto-generated from directory structure)
- Add new sections by creating `content/<section>/_index.md`

Sidebar navigation is **automatically generated** from the `content/docs/` directory hierarchy. Control ordering with `weight` frontmatter. Use `_index.md` files to title sections.

### Configuration

`hugo.toml` — main site config. Key areas:
- `baseURL` and `title` — update before deploying
- `[menu.main]` — top navbar links
- `[params]` — Hextra theme options (search, footer, page width, etc.)

Re-enable `enableGitInfo = true` in `hugo.toml` after the first git commit to show last-modified dates on pages.

### Cloudflare Pages Deployment

`wrangler.toml` specifies the project name and build output dir. In the Cloudflare Pages dashboard (or CI), set:
- **Build command**: `hugo --minify`
- **Build output directory**: `public`
- **Environment variable**: `HUGO_VERSION = 0.157.0`

### Hextra Shortcodes

Hextra provides shortcodes for common documentation patterns — use these instead of raw HTML:

- `{{< callout type="info" >}}` — note/warning/info boxes (replaces MkDocs admonitions)
- `{{< tabs >}}` / `{{< tab >}}` — tabbed content
- `{{< cards >}}` / `{{< card >}}` — card grids
- `{{< steps >}}` — numbered step lists
- `{{< filetree >}}` — directory tree display
- `{{< details >}}` — collapsible sections

### Customization

- Override any theme layout by copying it from `themes/hextra/layouts/` to the site's `layouts/`
- Add custom CSS in `assets/css/custom.css` (create this file)
- Theme partials meant to be overridden live in `themes/hextra/layouts/_partials/custom/`
