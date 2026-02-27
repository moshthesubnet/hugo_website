# Mosh The Subnet — Personal Documentation Site

Personal documentation site for Skyler King — Cloud/Network Engineering student, homelab enthusiast. Built with [Hugo](https://gohugo.io/) and the [Congo](https://github.com/jpanther/congo) theme, deployed on [Cloudflare Pages](https://pages.cloudflare.com/).

**Live site:** [moshthesubnet.com](https://moshthesubnet.com)

---

## Purpose

This repository serves as the source of truth for my homelab and networking work. It documents:

- **Homelab infrastructure** — hardware inventory, Proxmox setup, VLAN architecture, and network topology
- **Project documentation** — detailed write-ups of completed networking, security, and automation projects with configurations, lessons learned, and verification steps
- **Guides** — step-by-step deployment guides for self-hosted services (Pi-hole, containers, etc.)
- **Professional profile** — certifications, accomplishments, and technical competencies

The goal is to apply a "documentation-first" engineering mindset: if it's running in the lab, it's documented here.

---

## Content

| Section | Description |
|---------|-------------|
| `content/docs/lab/` | Homelab overview, hardware specs, Proxmox virtualization environment |
| `content/docs/projects/` | VLAN segmentation hardening, local AI coding agent (Ollama + Aider), 2-area OSPF lab |
| `content/docs/guides/` | Deployment guides (Pi-hole LXC, etc.) |
| `content/docs/bio.md` | About page — professional accomplishments, certifications, and core competencies |
| `content/_index.md` | Home page — intro, recent wins, certifications table, featured projects |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Static site generator | Hugo 0.157.0 Extended |
| Theme | Congo v2.13.0 |
| Deployment | Cloudflare Pages |
| Version control | Git |
| Diagrams | Mermaid (via Congo shortcode) |
| Scroll animations | AOS (Animate On Scroll) |
| Custom fonts | Bebas Neue (Google Fonts) |

---

## Local Development

```bash
# Clone with submodules (required for Congo theme)
git clone --recurse-submodules https://github.com/moshthesubnet/hugo_website.git
cd hugo_website

# Start dev server — accessible from any device on the local network
make serve
# → http://<host-ip>:1313

# Localhost-only alternative
hugo server -D

# Production build
hugo --minify
```

> Hugo 0.157.0 Extended is required. The extended build is needed for Congo's CSS processing.

---

## Project History

This site has gone through two full migrations:

**Phase 1 — MkDocs → Hugo/Hextra**
The original documentation was written in MkDocs Material. A custom `migrate.py` script was written to port all content into Hugo, handling admonition conversion, tab shortcodes, internal link rewriting, image paths, and front matter normalization.

**Phase 2 — Hextra → Congo**
The theme was migrated from Hextra to Congo to gain native Mermaid diagram support, a cleaner split-config structure, and a better profile/portfolio layout. This involved:
- Replacing all `{{< callout >}}` shortcodes with Congo's `{{< alert >}}`
- Converting raw mermaid code fences to `{{< mermaid >}}` shortcodes
- Splitting the monolithic `hugo.toml` into `config/_default/{hugo,languages.en,menus.en,params}.toml`
- Rewriting `assets/css/custom.css` to target Congo's DOM (`article`, `main`) instead of MkDocs selectors
- Fixing a Congo v2.13.0 / Hugo 0.157.0 incompatibility in `_partials/functions/warnings.html`

---

## Repository Structure

```
.
├── config/_default/        # Hugo + Congo config (split by concern)
│   ├── hugo.toml           # Base URL, markup, outputs
│   ├── languages.en.toml   # Title, author block, description
│   ├── menus.en.toml       # Navbar links (Docs, GitHub, LinkedIn, Instagram)
│   └── params.toml         # Theme appearance, article/list display options
├── content/                # All site content (Markdown)
│   ├── _index.md           # Home page
│   └── docs/               # Documentation section
├── assets/css/custom.css   # Custom styles (Bebas Neue, dark palette, AOS, tables)
├── static/
│   ├── assets/             # Images and SVGs
│   ├── css/aos.css         # Animate On Scroll library
│   └── js/                 # AOS library + custom scroll animation init
├── layouts/_partials/      # Congo partial overrides
│   ├── extend-head.html    # Injects AOS scripts into <head>
│   ├── favicons.html       # Custom favicon override
│   └── functions/
│       └── warnings.html   # Compatibility fix for Congo + Hugo 0.157.0
├── migrate.py              # MkDocs → Hugo content migration script
├── Makefile                # Dev shortcuts (make serve, make build)
└── themes/congo/           # Congo theme (git submodule, stable branch)
```

---

## Deployment

Deployed automatically via Cloudflare Pages on push to `main`.

| Setting | Value |
|---------|-------|
| Build command | `hugo --minify` |
| Output directory | `public` |
| Environment variable | `HUGO_VERSION = 0.157.0` |
