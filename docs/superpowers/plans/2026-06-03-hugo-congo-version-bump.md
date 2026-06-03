# Hugo 0.162.1 + Congo v2.14.0 Version Bump — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bump the Hugo pin from 0.157.0 → 0.162.1 and upgrade the Congo theme submodule v2.13.0 → v2.14.0, clearing all four build deprecation warnings and retiring the now-obsolete `warnings.html` override.

**Architecture:** Two-task split: Task 1 contains the entire coupled upgrade (version pins + submodule + deprecation fixes + override reconciliation) so it produces a zero-warning build in one coherent commit. Task 2 updates project documentation to match. Everything stays on the feature branch `feat/hugo-congo-version-bump`; a PR is opened at the end so the new Hugo 0.162.1 CI build produces a Cloudflare preview before anything lands on `main`.

**Tech Stack:** Hugo 0.162.1 Extended, Congo v2.14.0 (git submodule), GitHub Actions (`peaceiris/actions-hugo`), Cloudflare Pages (`wrangler.toml`), Go templates.

---

## Context for implementers

**No unit-test suite.** "Testing" = `hugo --minify` producing no `ERROR`/panic and zero `deprecat` warnings:
```bash
hugo --minify 2>&1 | grep -iE "error|panic|deprecat"
# expected: no output
```

**Already on branch** `feat/hugo-congo-version-bump`. All commits go here.

**Congo submodule** (`themes/congo`) already has the v2.14.0 tag fetched locally. You only need to check it out — no network fetch required.

**The four deprecation warnings and where each lives:**

| Warning message | Origin | Fix |
|---|---|---|
| `languages.en.languageName` deprecated | site `config/_default/languages.en.toml` | rename key |
| `.Language.LanguageDirection` deprecated | site override `layouts/_partials/head.html:59` | rename in our override |
| `.Language.LanguageCode` deprecated | theme `baseof.html` | fixed automatically by Congo v2.14.0 |
| `.Site.LanguageCode` deprecated | theme `schema.html` | fixed automatically by Congo v2.14.0 |

**Override reconciliation surface** — only two site overrides changed upstream between v2.13.0 and v2.14.0:
- `layouts/_partials/head.html` — one RTL rename + new hreflang block to port.
- `layouts/single.html` — the upstream change (adding `showTaxonomies` to the article-meta conditional) is inside Congo's standard single-page metadata block, which **our `single.html` does not use** (we have a custom article header instead). Leave `layouts/single.html` unchanged.

**`warnings.html` override** — our site override at `layouts/_partials/functions/warnings.html` exists solely to suppress the `.Author` panic. Congo v2.14.0 removed that check from the theme, making our override identical to (and superseded by) the theme's. Delete it.

---

## File structure

| File | Action | Reason |
|---|---|---|
| `.github/workflows/deploy.yml` | Modify | `hugo-version` pin |
| `.github/workflows/ci.yml` | Modify | `hugo-version` pin |
| `wrangler.toml` | Modify | `HUGO_VERSION` (×2) |
| `themes/congo` | Submodule checkout | v2.14.0 |
| `config/_default/languages.en.toml` | Modify | `languageName` → `label` |
| `layouts/_partials/head.html` | Modify | `.Direction` rename + hreflang block |
| `layouts/_partials/functions/warnings.html` | Delete | superseded by Congo v2.14.0 |
| `layouts/single.html` | No change | upstream change doesn't apply |
| `CLAUDE.md` | Modify | version numbers + remove compat section |
| `README.md` | Modify | version numbers + remove compat references |

---

## Task 1: Core upgrade — zero-warning build

**Files:** `.github/workflows/deploy.yml`, `.github/workflows/ci.yml`, `wrangler.toml`, `themes/congo` (submodule), `config/_default/languages.en.toml`, `layouts/_partials/head.html`, `layouts/_partials/functions/warnings.html`

- [ ] **Step 1: Bump Hugo pin in `deploy.yml`**

In `.github/workflows/deploy.yml` line 26, change:
```yaml
          hugo-version: '0.157.0'
```
to:
```yaml
          hugo-version: '0.162.1'
```

- [ ] **Step 2: Bump Hugo pin in `ci.yml`**

In `.github/workflows/ci.yml` line 20, change:
```yaml
          hugo-version: '0.157.0'
```
to:
```yaml
          hugo-version: '0.162.1'
```

- [ ] **Step 3: Bump Hugo pin in `wrangler.toml`**

`wrangler.toml` currently reads:
```toml
name = "hugo_website"
pages_build_output_dir = "public"

[env.production.vars]
HUGO_VERSION = "0.157.0"

[env.preview.vars]
HUGO_VERSION = "0.157.0"
```

Replace both `"0.157.0"` values so the file reads:
```toml
name = "hugo_website"
pages_build_output_dir = "public"

[env.production.vars]
HUGO_VERSION = "0.162.1"

[env.preview.vars]
HUGO_VERSION = "0.162.1"
```

- [ ] **Step 4: Upgrade the Congo submodule to v2.14.0**

```bash
git -C themes/congo checkout v2.14.0
git add themes/congo
```

Verify:
```bash
git -C themes/congo describe --tags
# expected: v2.14.0
git diff --cached -- themes/congo | head -5
# expected: shows old hash -> new hash for subproject commit
```

- [ ] **Step 5: Fix the deprecated config key in `languages.en.toml`**

In `config/_default/languages.en.toml`, change:
```toml
languageName = "English"
```
to:
```toml
label = "English"
```

The file should now read:
```toml
title = "Skyler King"
label = "English"
weight = 1

[params]
  description = "Network and cloud engineering — projects, writing, and homelab documentation."

  [params.author]
    name = "Skyler King"
    image = "assets/github_profile.png"
    headline = "Networking | Cloud | IT"
    bio = "Converting homelab chaos into production-grade infrastructure — through multi-VLAN lab builds, network automation, and six certifications that prove reliability was never just a healthcare value."
    links = [
      { github = "https://github.com/moshthesubnet" },
      { linkedin = "https://www.linkedin.com/in/skylerkingnetwork" },
      { instagram = "https://www.instagram.com/moshthesubnet" }
    ]
```

- [ ] **Step 6: Port the RTL rename in `layouts/_partials/head.html`**

Line 59 currently reads:
```go-html-template
  {{ if eq (site.Language.LanguageDirection | default "ltr") "rtl" }}
```

Change it to:
```go-html-template
  {{ if eq (site.Language.Direction | default "ltr") "rtl" }}
```

- [ ] **Step 7: Add the hreflang alternates block to `layouts/_partials/head.html`**

Find this block near the end of the file (currently lines 145–151):
```go-html-template
  {{/* Vendor */}}
  {{ partial "vendor.html" . }}
  {{/* Analytics */}}
  {{ partial "analytics.html" . }}
  {{/* Extend head - eg. for custom analytics scripts, etc. */}}
  {{ if templates.Exists "_partials/extend-head.html" }}
    {{ partial "extend-head.html" . }}
  {{ end }}
```

Replace it with (inserts the hreflang block between analytics and extend-head):
```go-html-template
  {{/* Vendor */}}
  {{ partial "vendor.html" . }}
  {{/* Analytics */}}
  {{ partial "analytics.html" . }}
  {{/* Declare alternates */}}
  {{- if .IsTranslated -}}
    <link rel="alternate" hreflang="{{ .Lang }}" href="{{ .Permalink }}" />
    {{- range .Translations -}}
      <link rel="alternate" hreflang="{{ .Lang }}" href="{{ .Permalink }}" />
    {{- end -}}
  {{- end -}}
  {{/* Extend head - eg. for custom analytics scripts, etc. */}}
  {{ if templates.Exists "_partials/extend-head.html" }}
    {{ partial "extend-head.html" . }}
  {{ end }}
```

- [ ] **Step 8: Delete the obsolete `warnings.html` override**

```bash
git rm layouts/_partials/functions/warnings.html
```

Congo v2.14.0's own `warnings.html` (now inherited from `themes/congo/`) contains the same three `warnf` checks without the `.Author` panic check, so this override is no longer needed.

- [ ] **Step 9: Verify zero deprecation warnings and clean build**

```bash
hugo --minify 2>&1 | grep -iE "error|panic|deprecat"
```
Expected: **no output**. If any `deprecat` warnings remain, stop and report before committing.

Then run the full check:
```bash
hugo --minify 2>&1 | tail -n 5
```
Expected: page count ~115, no `ERROR`, total build time printed.

Also confirm the submodule pointer is staged:
```bash
git status --short
```
Expected: `M  themes/congo` (staged submodule pointer change) plus the other modified files.

- [ ] **Step 10: Commit the core upgrade**

```bash
git add .github/workflows/deploy.yml \
        .github/workflows/ci.yml \
        wrangler.toml \
        config/_default/languages.en.toml \
        layouts/_partials/head.html \
        themes/congo
git commit -m "build: bump Hugo 0.157.0→0.162.1 and Congo v2.13.0→v2.14.0

Coupled upgrade: Congo v2.14.0 requires Hugo >=0.158.0 and fixes the
deprecated .Language.LanguageCode, .Language.LanguageDirection, and
.Site.LanguageCode usages in the theme. Site-side: rename languageName
-> label in languages.en.toml; port the .Direction rename and add the
hreflang alternates block in the head.html override. warnings.html
override is now obsolete (removed in separate commit).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 11: Commit the warnings.html deletion**

(This will already be staged from Step 8. If you committed it together with Step 10, skip this step and note it in your report.)

```bash
git commit -m "chore: delete obsolete warnings.html override

Congo v2.14.0 removed the .Author check that caused the Hugo 0.124+
panic, making this site override identical to the theme version.
Site now inherits the theme's warnings.html directly.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Documentation cleanup

**Files:** `CLAUDE.md`, `README.md`

Update version numbers and remove the now-resolved compatibility-issue notes.

- [ ] **Step 1: Update `CLAUDE.md` — version numbers**

Line 9: change `0.157.0` → `0.162.1`:
```markdown
- **Hugo version**: 0.162.1 Extended (required — Congo needs the extended build for CSS processing)
```

Line 10: change `Congo v2.13.0` → `Congo v2.14.0`:
```markdown
- **Theme**: Congo v2.14.0, added as a git submodule at `themes/congo/`
```

Line 61: change `HUGO_VERSION = 0.157.0` → `HUGO_VERSION = 0.162.1`:
```markdown
- **Environment variable**: `HUGO_VERSION = 0.162.1`
```

- [ ] **Step 2: Remove the "Known Compatibility Issue" section from `CLAUDE.md`**

Delete this entire block (currently lines 83–86):
```markdown
### Known Compatibility Issue

Congo v2.13.0 has a bug with Hugo 0.157.0: `_partials/functions/warnings.html` calls `{{ if .Author }}` on the site object, which panics because `.Site.Author` was removed in Hugo 0.124+. This is worked around by overriding that partial at `layouts/_partials/functions/warnings.html`.
```

- [ ] **Step 3: Update `README.md` — stack table**

Line 38: change `Hugo 0.157.0 Extended` → `Hugo 0.162.1 Extended`:
```markdown
| Static site generator | Hugo 0.162.1 Extended |
```

Line 39: change `Congo v2.13.0` → `Congo v2.14.0`:
```markdown
| Theme | Congo v2.14.0 |
```

- [ ] **Step 4: Update `README.md` — requirements note and migration bullet**

Line 66: change `0.157.0 Extended` → `0.162.1 Extended`:
```markdown
> Hugo 0.162.1 Extended is required. The extended build is needed for Congo's CSS processing.
```

Line 83: remove (or update) the compatibility-fix bullet. Change:
```markdown
- Fixing a Congo v2.13.0 / Hugo 0.157.0 incompatibility in `_partials/functions/warnings.html`
```
to (the migration happened; the fix is now resolved upstream):
```markdown
- Fixing a Congo v2.13.0 / Hugo 0.157.0 incompatibility in `_partials/functions/warnings.html` (resolved in Congo v2.14.0)
```

- [ ] **Step 5: Update `README.md` — structure tree and CI note**

Line 108: update the warnings.html comment in the repo tree:
```
│       └── warnings.html   # Compatibility fix for Congo + Hugo 0.157.0
```
Change to:
```
│       └── warnings.html   # Congo theme warnings (override removed in v2.14.0)
```

Wait — the `warnings.html` override was deleted in Task 1. The tree entry should be removed entirely. Delete the line:
```
│       └── warnings.html   # Compatibility fix for Congo + Hugo 0.157.0
```

Line 138: change `0.157.0 Extended` → `0.162.1 Extended`:
```markdown
| Hugo version | `0.162.1 Extended` |
```

Line 235: update the `actions-hugo` note — change `'0.157.0'` → `'0.162.1'`:
```markdown
- Uses `peaceiris/actions-hugo@v3` with `hugo-version: '0.162.1'` and `extended: true` — Congo requires the extended Hugo build for CSS processing. Specifying the version prevents build failures if the default Hugo version changes.
```

- [ ] **Step 6: Verify no remaining stale version references**

```bash
grep -rn "0\.157\|v2\.13\|Congo.*0\.157\|warnings\.html.*compat\|warnings\.html.*Hugo" \
  CLAUDE.md README.md
```
Expected: no output (or only the one "resolved in Congo v2.14.0" note you just added on README line 83).

- [ ] **Step 7: Commit docs update**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update Hugo/Congo versions and remove resolved compat note

Bump documented versions to Hugo 0.162.1 / Congo v2.14.0. Remove the
Known Compatibility Issue section from CLAUDE.md and update the
README stack table, requirements note, and CI note to match.
The warnings.html workaround is now resolved upstream.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Open PR + hand off local pin

- [ ] **Step 1: Final zero-warning build check**

```bash
hugo --minify 2>&1 | grep -iE "error|panic|deprecat"
```
Expected: **no output**.

```bash
hugo --minify 2>&1 | tail -n 3
```
Expected: build summary, no errors.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feat/hugo-congo-version-bump
```

- [ ] **Step 3: Open a PR**

```bash
gh pr create \
  --base main \
  --title "build: Hugo 0.162.1 + Congo v2.14.0 version bump" \
  --body "$(cat <<'EOF'
## Summary

- Bump Hugo pin 0.157.0 → 0.162.1 in \`deploy.yml\`, \`ci.yml\`, and \`wrangler.toml\`
- Upgrade Congo theme submodule v2.13.0 → v2.14.0
- Clear all four v0.158+ deprecation warnings:
  - \`languageName\` → \`label\` in \`languages.en.toml\`
  - \`Language.LanguageDirection\` → \`Language.Direction\` in \`head.html\` override
  - Two theme-origin deprecations fixed by the Congo upgrade automatically
- Delete obsolete \`layouts/_partials/functions/warnings.html\` override (fixed upstream in Congo v2.14.0)
- Update \`CLAUDE.md\` and \`README.md\` version references

## Test plan

- [ ] CI build passes on the new Hugo 0.162.1 pin (check Actions tab)
- [ ] Cloudflare Pages preview renders: home icon-row cards, an article page, a mermaid diagram
- [ ] \`/writing/\` → \`/blog/\` redirects still work on the preview URL
- [ ] Zero deprecation warnings locally: \`hugo --minify 2>&1 | grep -i deprecat\` returns no output

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

The Actions workflow will build on Hugo 0.162.1 and post a `*.pages.dev` preview URL as a PR comment. Verify that preview before merging to `main`.

- [ ] **Step 4: Report the local snap hold command to the user**

Tell the user to run this to prevent their local Hugo snap from auto-updating past 0.162.x:

```bash
sudo snap refresh --hold hugo
```

To confirm the held version afterwards:
```bash
snap list hugo
# Expected: hugo  0.162.0  ...  held
```

(The snap is currently at 0.162.0 locally; 0.162.1 is the repo pin. The patch delta is trivial and 0.162.0 builds the site identically — the snap hold prevents future drift, which is the goal.)

---

## Self-review: spec coverage check

- Hugo pins (deploy.yml, ci.yml, wrangler.toml both entries) → Task 1 Steps 1–3 ✅
- Congo submodule v2.14.0 → Task 1 Step 4 ✅
- Zero deprecation warnings gate → Task 1 Step 9 + Task 3 Step 1 ✅
- `languageName` → `label` in languages.en.toml → Task 1 Step 5 ✅
- `head.html` `.Direction` rename → Task 1 Step 6 ✅
- `head.html` hreflang block → Task 1 Step 7 ✅
- Delete `warnings.html` override → Task 1 Step 8 + 11 ✅
- `single.html` review → addressed in context section (upstream change doesn't apply) ✅
- CLAUDE.md version + compat section removal → Task 2 Steps 1–2 ✅
- README.md version + compat references → Task 2 Steps 3–5 ✅
- Local snap hold hand-off → Task 3 Step 4 ✅
- PR-based rollout with preview verification → Task 3 Steps 2–3 ✅
