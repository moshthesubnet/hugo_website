# Website Redesign — Minimal Writer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign moshthesubnet.com from the Cyberviolet punk-rock aesthetic to a minimal, content-first design with muted teal accent on near-black background.

**Architecture:** Replace the Congo color scheme, rewrite custom CSS, replace homepage and single-post layouts, update config to change nav and metadata, restructure content URLs from `/posts/` to `/writing/` and `/docs/projects/` to `/projects/`. Hugo + Congo theme stays; only the presentation layer changes.

**Tech Stack:** Hugo 0.157.0 Extended, Congo v2.13.0 theme, CSS, Hugo templates (Go HTML)

---

### Task 1: Create the new color scheme

**Files:**
- Create: `assets/css/schemes/minimal.css`

- [ ] **Step 1: Create the minimal color scheme file**

Create `assets/css/schemes/minimal.css` with Congo's CSS custom property format. The neutral scale uses near-black to white grays, primary uses the muted teal accent (#5eead4), and secondary uses a slightly dimmed teal for visited links.

```css
/* Minimal scheme — near-black background, muted teal accent
   =========================================================== */
:root {
  /* Neutral — near-black through white */
  --color-neutral:         255, 255, 255;  /* #FFFFFF — light mode page bg (unused, dark-only) */
  --color-neutral-50:      250, 250, 250;  /* #FAFAFA */
  --color-neutral-100:     245, 245, 245;  /* #F5F5F5 */
  --color-neutral-200:     229, 229, 229;  /* #E5E5E5 */
  --color-neutral-300:     163, 163, 163;  /* #A3A3A3 */
  --color-neutral-400:     115, 115, 115;  /* #737373 */
  --color-neutral-500:      82,  82,  82;  /* #525252 */
  --color-neutral-600:      64,  64,  64;  /* #404040 */
  --color-neutral-700:      38,  38,  38;  /* #262626 */
  --color-neutral-800:      17,  17,  17;  /* #111111 — dark mode body bg */
  --color-neutral-900:      26,  26,  26;  /* #1A1A1A — code block bg */
  --color-neutral-950:      10,  10,  10;  /* #0A0A0A */

  /* Muted Teal — primary accent (#5eead4 family) */
  --color-primary-50:      240, 253, 250;
  --color-primary-100:     204, 251, 241;
  --color-primary-200:     153, 246, 228;
  --color-primary-300:      94, 234, 212;  /* #5eead4 — main accent */
  --color-primary-400:      45, 212, 191;
  --color-primary-500:      20, 184, 166;
  --color-primary-600:      13, 148, 136;
  --color-primary-700:      15, 118, 110;
  --color-primary-800:      17,  94,  89;
  --color-primary-900:      19,  78,  74;
  --color-primary-950:       4,  47,  46;

  /* Dimmed Teal — secondary (visited links, subtle accents) */
  --color-secondary-50:    240, 253, 250;
  --color-secondary-100:   204, 251, 241;
  --color-secondary-200:   153, 246, 228;
  --color-secondary-300:    76, 201, 176;  /* #4cc9b0 — visited links */
  --color-secondary-400:    56, 178, 156;
  --color-secondary-500:    38, 150, 132;
  --color-secondary-600:    28, 120, 106;
  --color-secondary-700:    22,  96,  85;
  --color-secondary-800:    18,  76,  68;
  --color-secondary-900:    14,  60,  54;
  --color-secondary-950:     8,  36,  32;
}
```

- [ ] **Step 2: Verify the file exists**

Run: `cat assets/css/schemes/minimal.css | head -5`
Expected: The comment header and `:root {` opening.

- [ ] **Step 3: Commit**

```bash
git add assets/css/schemes/minimal.css
git commit -m "feat: add minimal color scheme for website redesign"
```

---

### Task 2: Update Congo configuration

**Files:**
- Modify: `config/_default/params.toml`
- Modify: `config/_default/menus.en.toml`
- Modify: `config/_default/languages.en.toml`
- Modify: `config/_default/hugo.toml`

- [ ] **Step 1: Update params.toml**

Replace the entire file with:

```toml
colorScheme = "minimal"
defaultAppearance = "dark"
autoSwitchAppearance = false
enableSearch = true
enableCodeCopy = true
mainSections = ["writing"]

[header]
  layout = "basic"
  showTitle = true

[homepage]
  layout = "custom"

[article]
  showDate = true
  showDateUpdated = false
  showReadingTime = false
  showTableOfContents = true
  showAuthor = false
  mermaid = true

[list]
  showSummary = true
  groupByYear = false

[footer]
  showCopyright = true
  showThemeAttribution = false
```

Key changes: `colorScheme` → `minimal`, removed `logo`, `showTitle` → true (shows site title text in nav), `mainSections` → `["writing"]`, homepage layout → `custom`, `showAuthor` → false (no author card on posts), `showDate` → true.

- [ ] **Step 2: Update menus.en.toml**

Replace the entire file with:

```toml
[[main]]
  name = "Writing"
  pageRef = "writing"
  weight = 10

[[main]]
  name = "Projects"
  pageRef = "projects"
  weight = 20

[[main]]
  name = "About"
  pageRef = "about"
  weight = 30
```

- [ ] **Step 3: Update languages.en.toml**

Replace the entire file with:

```toml
title = "Skyler King"
languageName = "English"
weight = 1

[params]
  description = "Network and cloud engineering — projects, writing, and homelab documentation."

  [params.author]
    name = "Skyler King"
    headline = "Network & Cloud Engineer"
    bio = "Cloud & Network Engineering student at WGU. CCNA and a modest homelab I use to break things on purpose."
    links = [
      { github = "https://github.com/moshthesubnet" },
      { linkedin = "https://www.linkedin.com/in/skylerkingnetwork" },
      { instagram = "https://www.instagram.com/moshthesubnet" }
    ]
```

Key changes: `title` → `"Skyler King"` (this shows in the nav), removed author image, updated headline and bio.

- [ ] **Step 4: Update hugo.toml**

In `config/_default/hugo.toml`, add URL alias configuration. Add this block at the end of the file, after the existing `[markup]` section:

```toml
[permalinks]
  writing = "/writing/:filename/"
```

This ensures posts in the `writing` section get clean `/writing/slug/` URLs.

- [ ] **Step 5: Verify config loads**

Run: `cd /home/skyler/website && hugo config | head -20`
Expected: No errors. Should show `colorScheme = "minimal"` and `title = "Skyler King"`.

- [ ] **Step 6: Commit**

```bash
git add config/_default/params.toml config/_default/menus.en.toml config/_default/languages.en.toml config/_default/hugo.toml
git commit -m "feat: update Congo config for minimal redesign

New nav (Writing, Projects, About), minimal color scheme,
site title as nav text instead of logo."
```

---

### Task 3: Rewrite custom CSS

**Files:**
- Modify: `assets/css/custom.css` (complete rewrite)

- [ ] **Step 1: Replace custom.css with the minimal design styles**

Replace the entire contents of `assets/css/custom.css` with the new minimal styles. This is a complete rewrite — no salvageable code from the old file.

```css
/* =========================================================
   Minimal Writer — custom styles
   Near-black (#111111) · Muted Teal (#5eead4)
   Georgia (hero/titles) · System sans (body) · Fira Code (code)
   ========================================================= */

/* ---------------------------------------------------------
   TYPOGRAPHY
   --------------------------------------------------------- */
body, p, li, td, th {
  font-family: system-ui, -apple-system, -system-ui, 'Segoe UI', Roboto, sans-serif;
}

code, pre, kbd, samp {
  font-family: 'Fira Code', 'Courier New', monospace;
}

h1, h2, h3, h4, h5, h6 {
  font-family: system-ui, -apple-system, sans-serif;
  text-transform: none;
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1.3;
}

/* Hero and page titles use Georgia */
.home-hero-title,
.article-header h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 400;
}

/* ---------------------------------------------------------
   BASE
   --------------------------------------------------------- */
body {
  font-size: 0.9375rem;
  line-height: 1.8;
}

/* ---------------------------------------------------------
   PROSE — dark mode overrides
   --------------------------------------------------------- */
.prose {
  --tw-prose-invert-body:          #b0b0b0;
  --tw-prose-invert-headings:      #fafafa;
  --tw-prose-invert-links:         #5eead4;
  --tw-prose-invert-bold:          #e5e5e5;
  --tw-prose-invert-code:          #5eead4;
  --tw-prose-invert-pre-code:      #a3a3a3;
  --tw-prose-invert-pre-bg:        #1a1a1a;
  --tw-prose-invert-hr:            #262626;
  --tw-prose-invert-quote-borders: #262626;
  --tw-prose-invert-quotes:        #a3a3a3;
  --tw-prose-invert-counters:      #737373;
  --tw-prose-invert-bullets:       #525252;
}

/* ---------------------------------------------------------
   LINKS
   --------------------------------------------------------- */
a {
  color: #5eead4;
  text-decoration: none;
}

a:hover,
a:focus {
  text-decoration: underline;
}

a:visited {
  color: #4cc9b0;
}

/* No underline on image links or nav links */
a:has(img),
body > header a,
body > footer a {
  text-decoration: none !important;
}

body > header a:hover,
body > footer a:hover {
  text-decoration: underline !important;
}

/* ---------------------------------------------------------
   HEADER — minimal, no full-bleed
   --------------------------------------------------------- */
body > header {
  border-bottom: 1px solid #262626;
}

body > header,
body > header nav,
body > header a,
body > header a span,
body > header button,
body > header button span {
  color: #737373 !important;
}

/* Site title in nav */
body > header a[href="/"] span,
body > header a[href="/"] {
  color: #fafafa !important;
  font-weight: 500;
}

/* ---------------------------------------------------------
   FOOTER — minimal
   --------------------------------------------------------- */
body > footer {
  border-top: 1px solid #262626;
}

body > footer a {
  color: #5eead4 !important;
}

/* ---------------------------------------------------------
   HEADINGS — clean, no decorations
   --------------------------------------------------------- */
.prose h2 {
  color: #fafafa;
  font-size: 1.25rem;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  border-bottom: none;
  padding-bottom: 0;
}

.prose h3 {
  color: #fafafa;
  font-size: 1.1rem;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

/* ---------------------------------------------------------
   PARAGRAPHS & LISTS
   --------------------------------------------------------- */
.prose p {
  color: #b0b0b0;
  line-height: 1.8;
  margin-bottom: 1.25rem;
}

.prose li {
  color: #b0b0b0;
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

/* ---------------------------------------------------------
   BLOCKQUOTES
   --------------------------------------------------------- */
.prose blockquote {
  border-left: 2px solid #262626;
  color: #a3a3a3;
  font-style: normal;
  background: transparent;
  padding-left: 1rem;
}

/* ---------------------------------------------------------
   CODE
   --------------------------------------------------------- */
.prose code {
  color: #5eead4;
  font-size: 0.8125rem;
  background: rgba(94, 234, 212, 0.08);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
}

.prose pre {
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.prose pre code {
  color: #a3a3a3;
  background: transparent;
  padding: 0;
  border-radius: 0;
}

/* ---------------------------------------------------------
   TABLES
   --------------------------------------------------------- */
.prose table {
  border-collapse: collapse;
  width: 100%;
}

.prose th {
  text-align: left;
  color: #525252;
  font-weight: 400;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.5rem 0;
  border-bottom: 1px solid #262626;
}

.prose td {
  color: #a3a3a3;
  padding: 0.625rem 0;
  border-bottom: 1px solid #1a1a1a;
}

/* ---------------------------------------------------------
   TABLE OF CONTENTS
   --------------------------------------------------------- */
.toc a {
  color: #737373;
}

.toc a:hover,
.toc a.active {
  color: #5eead4;
}

/* ---------------------------------------------------------
   TAGS
   --------------------------------------------------------- */
article .tag,
.taxonomy-list a {
  color: #525252;
  font-size: 0.75rem;
  border: 1px solid #262626;
  padding: 0.1875rem 0.625rem;
  border-radius: 3px;
  text-decoration: none;
}

article .tag:hover,
.taxonomy-list a:hover {
  color: #a3a3a3;
  border-color: #525252;
  text-decoration: none;
}

/* ---------------------------------------------------------
   HOMEPAGE — custom layout
   --------------------------------------------------------- */
.home-hero-title {
  color: #fafafa;
  font-size: 2rem;
  line-height: 1.35;
  margin-bottom: 1.25rem;
}

.home-hero-intro {
  color: #a3a3a3;
  font-size: 0.9375rem;
  line-height: 1.7;
  max-width: 540px;
}

.home-divider {
  border: none;
  border-top: 1px solid #262626;
  margin: 0;
}

.home-section {
  padding: 2.5rem 0 0.75rem;
}

.home-section-label {
  color: #737373;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.home-entry {
  margin-bottom: 1.75rem;
}

.home-entry-title {
  color: #5eead4;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  text-decoration: none;
  display: block;
}

.home-entry-title:hover {
  text-decoration: underline;
}

.home-entry-desc {
  color: #525252;
  font-size: 0.8125rem;
}

.home-certs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #a3a3a3;
}

.home-certs-dot {
  color: #404040;
}

/* ---------------------------------------------------------
   ARTICLE HEADER — blog posts and project pages
   --------------------------------------------------------- */
.article-header {
  padding-top: 3rem;
  margin-bottom: 2rem;
}

.article-header .article-date {
  color: #525252;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}

.article-header .article-label {
  color: #525252;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}

.article-header h1 {
  color: #fafafa;
  font-size: 1.75rem;
  line-height: 1.3;
  margin-bottom: 1rem;
}

.article-header .article-summary {
  color: #737373;
  font-size: 0.875rem;
  line-height: 1.6;
}

/* Project metadata row */
.article-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.8125rem;
  padding-bottom: 2rem;
}

.article-meta-label {
  color: #525252;
  margin-bottom: 0.25rem;
}

.article-meta-value {
  color: #a3a3a3;
}

.article-meta-value a {
  color: #5eead4;
}

/* ---------------------------------------------------------
   WRITING/PROJECTS INDEX PAGES
   --------------------------------------------------------- */
.list-entry {
  margin-bottom: 1.75rem;
}

.list-entry-title {
  color: #5eead4;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  display: block;
  margin-bottom: 0.25rem;
}

.list-entry-title:hover {
  text-decoration: underline;
}

.list-entry-desc {
  color: #525252;
  font-size: 0.8125rem;
}

.list-entry-meta {
  color: #525252;
  font-size: 0.75rem;
  margin-top: 0.125rem;
}

/* Back link on project pages */
.back-link {
  padding: 1rem 0 2rem;
}

.back-link a {
  color: #5eead4;
  font-size: 0.875rem;
  text-decoration: none;
}

.back-link a:hover {
  text-decoration: underline;
}

/* ---------------------------------------------------------
   ALERT BOXES — keep but restyle
   --------------------------------------------------------- */
.alert {
  border-radius: 4px;
  padding: 1rem;
  margin: 1.5rem 0;
  font-size: 0.875rem;
}

/* ---------------------------------------------------------
   SCROLLBAR
   --------------------------------------------------------- */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #111111; }
::-webkit-scrollbar-thumb { background: #262626; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #525252; }

/* ---------------------------------------------------------
   RESPONSIVE
   --------------------------------------------------------- */
@media (max-width: 640px) {
  .home-hero-title {
    font-size: 1.5rem;
  }

  .article-header h1 {
    font-size: 1.375rem;
  }

  .article-meta {
    flex-direction: column;
    gap: 1rem;
  }
}
```

- [ ] **Step 2: Verify the file was written correctly**

Run: `head -5 assets/css/custom.css`
Expected: The comment header with "Minimal Writer".

- [ ] **Step 3: Commit**

```bash
git add assets/css/custom.css
git commit -m "feat: rewrite custom CSS for minimal design

Replace Cyberviolet punk-rock styles with minimal near-black
design. Muted teal accent, system sans body, Georgia titles."
```

---

### Task 4: Update extend-head.html

**Files:**
- Modify: `layouts/_partials/extend-head.html`

- [ ] **Step 1: Replace extend-head.html**

Remove Bebas Neue and Space Mono font imports, remove AOS library. Keep Fira Code (for code blocks) and keep the Open Graph meta tags.

Replace the entire file with:

```html
{{- /* Google Fonts — Fira Code (code blocks only) */ -}}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap">

{{- /* ── Open Graph / LinkedIn / Twitter Card ───────────────────────── */ -}}
{{- $ogImage := "" -}}
{{- if .Params.images -}}
  {{- $ogImage = index .Params.images 0 -}}
{{- else if .Params.cover -}}
  {{- $ogImage = .Params.cover | absURL -}}
{{- else -}}
  {{- $ogImage = .Site.Params.author.image | absURL -}}
{{- end -}}
{{- $ogTitle := cond .IsHome .Site.Title .Title -}}
{{- $ogDesc := .Params.description | default .Site.Params.description | default "" -}}
<meta property="og:type" content="{{ if .IsPage }}article{{ else }}website{{ end }}">
<meta property="og:url" content="{{ .Permalink }}">
<meta property="og:title" content="{{ $ogTitle }}">
<meta property="og:description" content="{{ $ogDesc }}">
<meta property="og:image" content="{{ $ogImage }}">
<meta property="og:site_name" content="{{ .Site.Title }}">
{{ if .IsPage -}}
<meta property="article:published_time" content="{{ .Date.Format "2006-01-02T15:04:05Z07:00" }}">
{{ with .Params.tags -}}
<meta property="article:tag" content="{{ delimit . ", " }}">
{{ end -}}
{{ end -}}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $ogTitle }}">
<meta name="twitter:description" content="{{ $ogDesc }}">
<meta name="twitter:image" content="{{ $ogImage }}">
{{- /* ── /Open Graph ──────────────────────────────────────────────────── */ -}}
```

- [ ] **Step 2: Commit**

```bash
git add layouts/_partials/extend-head.html
git commit -m "feat: strip AOS and extra fonts from head

Keep Fira Code for code blocks and OG meta tags.
Remove Bebas Neue, Space Mono, and AOS animation library."
```

---

### Task 5: Rewrite the homepage layout

**Files:**
- Modify: `layouts/index.html`

- [ ] **Step 1: Replace layouts/index.html**

Replace the entire file with the minimal homepage layout. This uses Hugo's template functions to dynamically pull recent posts and renders the hero, writing, projects, certifications, and footer sections.

```html
{{ define "main" }}
<div class="max-w-prose mx-auto px-6">

  {{/* ── Hero ──────────────────────────────────────────────── */}}
  <section style="padding: 3.75rem 0 3rem;">
    <h1 class="home-hero-title">My career path has more hops than my traceroute.</h1>
    <p class="home-hero-intro">Cloud & Network Engineering student at WGU. CCNA and a modest homelab I use to break things on purpose. I document the thinking behind every fix, build, and mistake.</p>
  </section>

  <hr class="home-divider">

  {{/* ── Recent Writing ────────────────────────────────────── */}}
  {{ $posts := first 3 (where .Site.RegularPages "Section" "writing") }}
  {{ if $posts }}
  <section class="home-section">
    <div class="home-section-label">Recent Writing</div>
    {{ range $posts }}
    <div class="home-entry">
      <a href="{{ .Permalink }}" class="home-entry-title">{{ .Title }}</a>
      <div class="home-entry-desc">{{ .Description }}</div>
    </div>
    {{ end }}
  </section>

  <hr class="home-divider">
  {{ end }}

  {{/* ── Featured Projects ─────────────────────────────────── */}}
  {{ $projects := where .Site.RegularPages "Section" "projects" }}
  {{ if $projects }}
  <section class="home-section">
    <div class="home-section-label">Featured Projects</div>
    {{ range first 3 $projects }}
    <div class="home-entry">
      <a href="{{ .Permalink }}" class="home-entry-title">{{ .Title }}</a>
      <div class="home-entry-desc">{{ .Description }}</div>
    </div>
    {{ end }}
  </section>

  <hr class="home-divider">
  {{ end }}

  {{/* ── Certifications ────────────────────────────────────── */}}
  <section class="home-section">
    <div class="home-section-label">Certifications</div>
    <div class="home-certs">
      <span>CCNA</span><span class="home-certs-dot">·</span>
      <span>Cloud+</span><span class="home-certs-dot">·</span>
      <span>CBROPS</span><span class="home-certs-dot">·</span>
      <span>ITIL 4</span><span class="home-certs-dot">·</span>
      <span>Linux Essentials</span><span class="home-certs-dot">·</span>
      <span>A+</span>
    </div>
  </section>

</div>
{{ end }}
```

- [ ] **Step 2: Verify the homepage renders**

Run: `cd /home/skyler/website && hugo --quiet 2>&1 | head -20`
Expected: No errors. The build should succeed.

- [ ] **Step 3: Commit**

```bash
git add layouts/index.html
git commit -m "feat: replace homepage with minimal layout

Hero statement, recent writing, featured projects, and
certifications in a single-column minimal design."
```

---

### Task 6: Rewrite the single post layout

**Files:**
- Modify: `layouts/single.html`

- [ ] **Step 1: Replace layouts/single.html**

Replace the terminal-chrome single post layout with a clean minimal layout. Keep the TOC support and cover image support from Congo.

```html
{{ define "main" }}
  {{- $images := .Resources.ByType "image" }}
  {{- $cover := $images.GetMatch (.Params.cover | default "*cover*") }}
  {{- $feature := $images.GetMatch (.Params.feature | default "*feature*") | default $cover }}
  <article>
    <header class="max-w-prose article-header">
      {{ if .Params.showBreadcrumbs | default (.Site.Params.article.showBreadcrumbs | default false) }}
        {{ partial "breadcrumbs.html" . }}
      {{ end }}

      {{/* Date or label */}}
      {{ if eq .Section "projects" }}
        <div class="article-label">Project</div>
      {{ else }}
        {{ if not .Date.IsZero }}
          <div class="article-date">{{ .Date.Format "January 2006" }}</div>
        {{ end }}
      {{ end }}

      <h1>{{ .Title | emojify }}</h1>

      {{ with .Description }}
        <p class="article-summary">{{ . }}</p>
      {{ end }}

      {{/* Project metadata row */}}
      {{ with .Params.stack }}
      <div class="article-meta">
        {{ with $.Params.stack }}
        <div>
          <div class="article-meta-label">Stack</div>
          <div class="article-meta-value">{{ . }}</div>
        </div>
        {{ end }}
        {{ with $.Params.integrations }}
        <div>
          <div class="article-meta-label">Integrations</div>
          <div class="article-meta-value">{{ . }}</div>
        </div>
        {{ end }}
        {{ with $.Params.source }}
        <div>
          <div class="article-meta-label">Source</div>
          <div class="article-meta-value"><a href="{{ . }}">GitHub →</a></div>
        </div>
        {{ end }}
      </div>
      {{ end }}

      {{ with $feature }}
        <div class="prose">
          {{ $altText := $.Params.featureAlt | default $.Params.coverAlt | default "" }}
          {{ $class := "mb-6 rounded-md" }}
          {{ $webp := $.Page.Site.Params.enableImageWebp | default true }}
          {{ partial "picture.html" (dict "img" . "alt" $altText "class" $class "lazy" false "webp" $webp) }}
          {{ with $.Params.coverCaption }}
            <figcaption class="-mt-3 mb-6 text-center">{{ . | markdownify }}</figcaption>
          {{ end }}
        </div>
      {{ end }}
    </header>

    {{/* Divider between header and body */}}
    <div class="max-w-prose"><hr class="home-divider" style="margin-bottom: 2rem;"></div>

    <section class="prose mt-0 flex max-w-full flex-col dark:prose-invert lg:flex-row">
      {{ if and (.Params.showTableOfContents | default (.Site.Params.article.showTableOfContents | default false)) (in .TableOfContents "<ul") }}
        <div class="order-first px-0 lg:order-last lg:max-w-xs lg:ps-8">
          <div class="toc pe-5 lg:sticky lg:top-10 print:hidden">
            {{ partial "toc.html" . }}
          </div>
        </div>
      {{ end }}
      <div class="min-h-0 min-w-0 max-w-prose grow">
        {{ .Content | emojify }}
      </div>
    </section>

    <footer class="max-w-prose pt-8 print:hidden">
      {{/* Back link for projects */}}
      {{ if eq .Section "projects" }}
        <div class="back-link"><a href="/projects/">← All Projects</a></div>
      {{ end }}

      {{ partial "sharing-links.html" . }}
      {{ partial "article-pagination.html" . }}
      {{ if .Params.showComments | default (.Site.Params.article.showComments | default false) }}
        {{ if templates.Exists "_partials/comments.html" }}
          <div class="pt-3">
            <hr class="border-dotted border-neutral-300 dark:border-neutral-600" />
            <div class="pt-3">
              {{ partial "comments.html" . }}
            </div>
          </div>
        {{ else }}
          {{ warnf "[CONGO] Comments are enabled for %s but no comments partial exists." .File.Path }}
        {{ end }}
      {{ end }}
    </footer>
  </article>
{{ end }}
```

- [ ] **Step 2: Commit**

```bash
git add layouts/single.html
git commit -m "feat: replace terminal-chrome post layout with minimal design

Clean article header with date/label, Georgia title, description
summary, and divider. Keeps TOC and cover image support."
```

---

### Task 7: Restructure content — move posts to writing

**Files:**
- Rename: `content/posts/` → `content/writing/`
- Modify: each post's front matter to add `aliases` for old URLs

- [ ] **Step 1: Rename the posts directory to writing**

```bash
cd /home/skyler/website
mv content/posts content/writing
```

- [ ] **Step 2: Update the writing section _index.md**

Replace `content/writing/_index.md` with:

```markdown
---
title: "Writing"
description: "Homelab incidents, networking deep-dives, and the occasional opinion."
---
```

- [ ] **Step 3: Add aliases to each post for old URL redirects**

For each post file, add an `aliases` field to the front matter so old `/posts/` URLs redirect. Add the alias line right after the `title:` line in each file.

In `content/writing/opnsense-backup-incident.md`, add after the title line:
```yaml
aliases: ["/posts/opnsense-backup-incident/"]
```

In `content/writing/cross-vlan-network-monitor.md`, add after the title line:
```yaml
aliases: ["/posts/cross-vlan-network-monitor/"]
```

In `content/writing/homelab-docs-automation-n8n-claude.md`, add after the title line:
```yaml
aliases: ["/posts/homelab-docs-automation-n8n-claude/"]
```

In `content/writing/layer3-vs-layer4-vpn-wireguard-twingate.md`, add after the title line:
```yaml
aliases: ["/posts/layer3-vs-layer4-vpn-wireguard-twingate/"]
```

In `content/writing/vpn-vs-vlan.md`, add after the title line:
```yaml
aliases: ["/posts/vpn-vs-vlan/"]
```

In `content/writing/truenas-immich-postgres-fix.md`, add after the title line:
```yaml
aliases: ["/posts/truenas-immich-postgres-fix/"]
```

- [ ] **Step 4: Verify the writing section builds**

Run: `cd /home/skyler/website && hugo list all 2>&1 | grep writing`
Expected: All 6 posts listed under the `writing` section.

- [ ] **Step 5: Commit**

```bash
git add content/writing/ content/posts/
git commit -m "feat: move posts to writing section with URL aliases

Rename content/posts → content/writing. Add aliases for old
/posts/* URLs so existing links redirect correctly."
```

---

### Task 8: Restructure content — promote projects to top-level

**Files:**
- Create: `content/projects/_index.md`
- Move: project content files from `content/docs/projects/` to `content/projects/`
- Modify: each project file to add `aliases` for old URLs

- [ ] **Step 1: Create the top-level projects section**

```bash
cd /home/skyler/website
mkdir -p content/projects
```

- [ ] **Step 2: Create projects section _index.md**

Create `content/projects/_index.md`:

```markdown
---
title: "Projects"
description: "Homelab builds, network tools, and infrastructure projects."
---
```

- [ ] **Step 3: Move project content files**

```bash
cd /home/skyler/website

# Copy project files to new location (keep originals until aliases are set)
cp content/docs/projects/cross_vlan_network_monitor.md content/projects/cross-vlan-network-monitor.md
cp content/docs/projects/VLAN_segmentation.md content/projects/vlan-segmentation.md
cp content/docs/projects/Local_AI_Coding_Agent.md content/projects/local-ai-coding-agent.md
cp content/docs/projects/ospf_lab.md content/projects/ospf-lab.md

# For the n8n project (bundle with index.md), copy the whole directory
cp -r content/docs/projects/n8n-homelab-docs-pipeline content/projects/n8n-homelab-docs-pipeline
```

- [ ] **Step 4: Add aliases and clean up front matter in each project file**

In `content/projects/cross-vlan-network-monitor.md`, add after the title line:
```yaml
aliases: ["/docs/projects/cross_vlan_network_monitor/"]
```

In `content/projects/vlan-segmentation.md`, add after the title line:
```yaml
aliases: ["/docs/projects/vlan_segmentation/"]
```

In `content/projects/local-ai-coding-agent.md`, add after the title line:
```yaml
aliases: ["/docs/projects/local_ai_coding_agent/"]
```

In `content/projects/ospf-lab.md`, add after the title line:
```yaml
aliases: ["/docs/projects/ospf_lab/"]
```

In `content/projects/n8n-homelab-docs-pipeline/index.md`, add after the title line:
```yaml
aliases: ["/docs/projects/n8n-homelab-docs-pipeline/"]
```

- [ ] **Step 5: Remove the old docs/projects overview page**

The `content/docs/projects/projects.md` overview page is no longer needed — the projects index replaces it. Remove it:

```bash
rm content/docs/projects/projects.md
```

Keep the original project files under `content/docs/projects/` for now so old URLs still work via Hugo's alias redirects from the new locations. They can be cleaned up later.

- [ ] **Step 6: Verify projects section builds**

Run: `cd /home/skyler/website && hugo list all 2>&1 | grep projects`
Expected: Project pages listed under both the new `/projects/` section and old `/docs/projects/` locations.

- [ ] **Step 7: Commit**

```bash
git add content/projects/ content/docs/projects/projects.md
git commit -m "feat: promote projects to top-level section

Move project content to content/projects/ with URL aliases
for old /docs/projects/* paths. Clean URL slugs (hyphens)."
```

---

### Task 9: Create the About page

**Files:**
- Create: `content/about/_index.md`

- [ ] **Step 1: Create the about section**

```bash
mkdir -p /home/skyler/website/content/about
```

- [ ] **Step 2: Create about page content**

Create `content/about/_index.md`. Pull the narrative from the existing `content/docs/bio.md` and restructure it for the new minimal layout:

```markdown
---
title: "About"
description: "Skyler King — Cloud & Network Engineering student, career changer, homelab enthusiast."
aliases: ["/docs/bio/"]
---

I'm Skyler King — a career changer turned network and cloud engineering student at WGU. Before tech, I worked as a Certified Occupational Therapy Assistant in the medical industry. I traded patient care for packet captures, and I haven't looked back.

I got into networking the way most people do: by breaking something in a homelab and spending a weekend figuring out why. That homelab has since grown into a multi-node Proxmox cluster with OPNsense, TrueNAS, Docker, and more VLANs than I probably need.

## What I'm working toward

I'm looking for my first network or cloud engineering role. I'm most interested in enterprise networking, network automation, and infrastructure that actually works when you need it to. My background in healthcare taught me that reliability isn't optional — it's the whole point.

## The homelab

Two Proxmox nodes, 17 VMs and LXCs, 7 VLANs, OPNsense firewall, Cisco switches, Unifi wireless. I use it to test everything I'm learning — from OSPF adjacencies to automated documentation pipelines. You can [explore the interactive topology diagram](/projects/homelab-topology.html) if you're curious.

## Certifications

| Certification | Issued |
| :--- | :--- |
| CompTIA Cloud+ | Dec 2025 |
| CCNA Cybersecurity (CBROPS) | Jun 2025 |
| Cisco CCNA | Feb 2025 |
| ITIL 4 Foundation | Jun 2024 |
| LPI Linux Essentials | May 2024 |
| CompTIA A+ | Mar 2024 |

## Get in touch

The best way to reach me is on [LinkedIn](https://www.linkedin.com/in/skylerkingnetwork). You can also find me on [GitHub](https://github.com/moshthesubnet) and [Instagram](https://instagram.com/moshthesubnet).
```

- [ ] **Step 3: Verify the about page builds**

Run: `cd /home/skyler/website && hugo --quiet && ls public/about/index.html`
Expected: The file exists.

- [ ] **Step 4: Commit**

```bash
git add content/about/
git commit -m "feat: create about page with bio and certifications

Standalone about page pulling narrative from old docs/bio.md.
Includes alias for /docs/bio/ redirect."
```

---

### Task 10: Remove old layout overrides and static assets

**Files:**
- Modify: `layouts/_partials/article-link.html` (remove terminal styling)
- Modify: `layouts/_partials/author.html` (remove or simplify)
- Delete: `static/css/aos.css`
- Delete: `static/js/aos.js`
- Delete: `static/js/extra.js`

- [ ] **Step 1: Remove AOS static assets**

```bash
cd /home/skyler/website
rm -f static/css/aos.css static/js/aos.js static/js/extra.js
```

- [ ] **Step 2: Simplify the article-link partial**

Replace `layouts/_partials/article-link.html` with a clean list entry partial. This partial is used by Congo's list templates to render each page entry.

```html
{{- $page := . -}}
<div class="list-entry">
  <a href="{{ $page.Permalink }}" class="list-entry-title">{{ $page.Title }}</a>
  {{ with $page.Description }}
    <div class="list-entry-desc">{{ . }}</div>
  {{ end }}
  {{ if eq $page.Section "writing" }}
    {{ if not $page.Date.IsZero }}
      <div class="list-entry-meta">{{ $page.Date.Format "January 2006" }}</div>
    {{ end }}
  {{ else if eq $page.Section "projects" }}
    {{ with $page.Params.stack }}
      <div class="list-entry-meta">{{ . }}</div>
    {{ end }}
  {{ end }}
</div>
```

- [ ] **Step 3: Remove the author partial override**

The author card is no longer shown on posts (we set `showAuthor = false` in params.toml). Remove the custom override so Congo's default (which respects the setting) takes over:

```bash
rm layouts/_partials/author.html
```

- [ ] **Step 4: Verify the build still succeeds**

Run: `cd /home/skyler/website && hugo --quiet 2>&1 | head -10`
Expected: Clean build with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A layouts/_partials/article-link.html layouts/_partials/author.html static/css/aos.css static/js/aos.js static/js/extra.js
git commit -m "feat: remove terminal styling, AOS, and author card

Clean article-link partial for list pages. Remove AOS animation
library and custom author card override."
```

---

### Task 11: Delete the old color scheme

**Files:**
- Delete: `assets/css/schemes/cyberviolet.css`

- [ ] **Step 1: Remove the old color scheme**

```bash
rm /home/skyler/website/assets/css/schemes/cyberviolet.css
```

- [ ] **Step 2: Verify the build uses the new scheme**

Run: `cd /home/skyler/website && hugo --quiet 2>&1`
Expected: No errors. The `minimal` scheme is now the only custom scheme.

- [ ] **Step 3: Commit**

```bash
git add assets/css/schemes/cyberviolet.css
git commit -m "chore: remove cyberviolet color scheme

Replaced by the minimal scheme in Task 1."
```

---

### Task 12: Update internal links in content

**Files:**
- Modify: `content/_index.md` (replaced by new homepage layout, but file still exists for Hugo)
- Modify: various content files that link to `/posts/`, `/docs/projects/`, or `/docs/bio/`

- [ ] **Step 1: Replace content/_index.md**

The homepage is now rendered by `layouts/index.html`, so `content/_index.md` only needs minimal front matter:

```markdown
---
title: "Home"
---
```

- [ ] **Step 2: Find and update internal links in content files**

Run: `cd /home/skyler/website && grep -rn '/posts/\|/docs/projects/\|/docs/bio/' content/ --include='*.md'`

For each match, update the URL:
- `/posts/` → `/writing/`
- `/docs/projects/` → `/projects/`
- `/docs/bio/` → `/about/`

- [ ] **Step 3: Verify no broken internal links remain**

Run: `cd /home/skyler/website && grep -rn '/posts/\|/docs/bio/' content/ --include='*.md'`
Expected: No matches (all updated). Links to `/docs/lab/` and `/docs/guides/` are fine — those stay.

- [ ] **Step 4: Commit**

```bash
git add content/
git commit -m "feat: update internal links to new URL structure

/posts/ → /writing/, /docs/projects/ → /projects/,
/docs/bio/ → /about/"
```

---

### Task 13: Full build verification and visual check

**Files:** None (verification only)

- [ ] **Step 1: Run a full clean build**

```bash
cd /home/skyler/website
rm -rf public/
hugo --minify 2>&1
```

Expected: Clean build with no errors or warnings (except possibly the Congo `.Site.Author` warning which is already worked around).

- [ ] **Step 2: Start the dev server and visually verify**

```bash
cd /home/skyler/website
make serve
```

Check each page in the browser:
- Homepage (`/`): Hero statement, recent writing, featured projects, certifications
- Writing index (`/writing/`): All posts listed with dates
- A blog post (`/writing/opnsense-backup-incident/`): Clean header with date, title, summary, divider, body
- Projects index (`/projects/`): All projects listed
- A project page (`/projects/cross-vlan-network-monitor/`): Label, title, summary, metadata row, body
- About page (`/about/`): Bio, certifications table, contact links
- Old URL redirect (`/posts/opnsense-backup-incident/`): Should redirect to `/writing/opnsense-backup-incident/`

- [ ] **Step 3: Verify the navigation**

On each page, confirm:
- Nav shows "Skyler King" on the left, "Writing / Projects / About" on the right
- Active section link is white (#fafafa), others are gray (#737373)
- Clicking "Skyler King" goes to homepage

- [ ] **Step 4: Commit any final fixes**

If any issues were found and fixed, commit them:

```bash
git add -A
git commit -m "fix: final adjustments from visual review"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-03-29-website-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?