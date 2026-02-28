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
├── Makefile                # Dev shortcuts (make serve, make build, make preview)
├── .env                    # Local secrets — NOT committed (in .gitignore)
└── themes/congo/           # Congo theme (git submodule, stable branch)
```

---

## Local Development — Preview Production Build

```bash
# Build and serve the minified output at your host IP (no hot reload)
# Use this to verify the production build before committing and pushing
make preview
# → http://<host-ip>:1313
```

`make preview` runs `hugo --minify` then serves `public/` via Python's built-in HTTP server. It does not use Hugo's dev server, so it reflects the exact output that will be deployed.

---

## Deployment

Pushes to `main` trigger the GitHub Actions workflow at `.github/workflows/deploy.yml`, which builds the Hugo site and deploys to Cloudflare Pages via Wrangler.

| Setting | Value |
|---------|-------|
| Build command | `hugo --minify` |
| Output directory | `public` |
| Hugo version | `0.157.0 Extended` |
| Cloudflare Pages project | `professional-website` |
| Production URL | `https://professional-website-6zy.pages.dev` |

### Required GitHub Repository Secrets

Set these under **Settings → Secrets and variables → Actions** in the GitHub repo:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with **Cloudflare Pages: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

---

## Cloudflare + Wrangler Setup — Troubleshooting Notes

This section documents the issues encountered when setting up Cloudflare Pages deployment via Wrangler CLI and GitHub Actions. Recorded here for future reference if credentials need to be rotated or the project needs to be rebuilt.

### 1. Cloudflare Pages Git Integration (OAuth) vs Wrangler CLI

Cloudflare's dashboard offers a GitHub OAuth integration that links your repo directly to a Pages project. In practice this involves authorising the Cloudflare Pages GitHub App via OAuth in the Cloudflare dashboard (**Pages → Create a project → Connect to Git**). This approach was bypassed in favour of the Wrangler CLI + GitHub Actions method, which gives more explicit control over the build and deploy steps.

The Wrangler approach (used here) works as follows:
1. A Cloudflare API token authenticates Wrangler.
2. GitHub Actions runs `wrangler pages deploy` on every push to `main`.
3. No OAuth app or Cloudflare dashboard Git connection is required.

### 2. Creating a Cloudflare API Token with the Right Permissions

Not all tokens work for Wrangler Pages commands. A token that is too narrowly scoped will authenticate successfully for read operations but fail silently when trying to create or deploy.

**Steps to create a working token:**

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Profile → API Tokens → Create Token**
2. Use the **Edit Cloudflare Pages** template, or create a custom token with:
   - **Account** → **Cloudflare Pages** → **Edit**
3. Scope the token to your account.
4. Copy the token — it is only shown once.

**Store it securely — never commit it or paste it in plaintext:**

```bash
# .env (gitignored)
export CLOUDFLARE_API_TOKEN=your-token-here
export CLOUDFLARE_ACCOUNT_ID=your-account-id-here
```

```bash
source .env   # load into current shell session before running wrangler
```

### 3. `wrangler whoami` Succeeds but `wrangler pages` Commands Fail

**Symptom:** `wrangler whoami` returns your account details, but `wrangler pages project create` (or `wrangler pages deploy`) fails with:

```
A request to the Cloudflare API (/memberships) failed.
Unable to authenticate request [code: 10001]
```

**Root cause:** Wrangler calls the `/memberships` endpoint to resolve your account ID automatically. This endpoint requires broader account permissions than the token may have, even if the token has `Cloudflare Pages: Edit`.

**Fix:** Provide the account ID explicitly so Wrangler skips the `/memberships` lookup:

```bash
export CLOUDFLARE_ACCOUNT_ID=your-account-id
wrangler pages project create your-project-name --production-branch main
```

Or inline:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id wrangler pages deploy public --project-name your-project-name
```

Your account ID is visible in the Cloudflare dashboard URL and in the output of `wrangler whoami`.

### 4. `wrangler pages project create` Requires `--production-branch`

**Symptom:** Running `wrangler pages project create <name>` (with account ID set) fails with:

```
Must specify a production branch.
```

**Fix:** Always pass `--production-branch`:

```bash
wrangler pages project create professional-website --production-branch main
```

### 5. GitHub Actions Workflow Setup

The workflow file at `.github/workflows/deploy.yml` handles CI/CD. Key points:

- Uses `actions/checkout@v4` with `submodules: true` — required because the Congo theme is a git submodule. Without this the Hugo build will fail with a missing theme error.
- Uses `peaceiris/actions-hugo@v3` with `hugo-version: '0.157.0'` and `extended: true` — Congo requires the extended Hugo build for CSS processing. Specifying the version prevents build failures if the default Hugo version changes.
- Uses `cloudflare/wrangler-action@v3` to deploy, passing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from repository secrets.

If the workflow fails at the deploy step with a `10001` auth error, verify:
1. The `CLOUDFLARE_API_TOKEN` secret is set and has **Cloudflare Pages: Edit** permission.
2. The `CLOUDFLARE_ACCOUNT_ID` secret is set correctly.
3. The token has not been revoked.

### 6. Rotating or Revoking API Tokens

If a token is compromised or needs rotation:

1. Go to **dash.cloudflare.com → Profile → API Tokens**
2. Find the token and click **Revoke** (or **Roll** to rotate in place)
3. Generate a new token following the steps in section 2 above
4. Update the `CLOUDFLARE_API_TOKEN` GitHub secret
5. Update your local `.env` file
