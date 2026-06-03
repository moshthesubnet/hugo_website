# Article Header Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the OG image card from article view and replace the current multi-element article header with a clean single-line metadata strip below the title.

**Architecture:** Two files change — `layouts/single.html` (template restructure) and `assets/css/custom.css` (remove dead rules, add strip rule). No new partials needed. Verify via Hugo build + rendered HTML inspection.

**Tech Stack:** Hugo 0.157.0 Extended, Congo theme v2.13.0, Tailwind CSS (via Congo), custom CSS at `assets/css/custom.css`

---

## File Map

| File | Change |
|------|--------|
| `layouts/single.html` | Remove image vars, date/label block, description block, project meta row, feature image block. Add `.article-meta-strip` div after `<h1>`. |
| `assets/css/custom.css` | Remove `.article-date`, `.article-label`, `.article-summary`, `.article-meta*` rules. Add `.article-meta-strip` rule. |

---

### Task 1: Restructure `layouts/single.html`

**Files:**
- Modify: `layouts/single.html`

- [ ] **Step 1: Replace the entire file with the new template**

Open `layouts/single.html` and replace the full contents with:

```html
{{ define "main" }}
  <article>
    <header class="max-w-prose article-header">
      {{ if .Params.showBreadcrumbs | default (.Site.Params.article.showBreadcrumbs | default false) }}
        {{ partial "breadcrumbs.html" . }}
      {{ end }}

      <h1>{{ .Title | emojify }}</h1>

      {{/* Metadata strip */}}
      <div class="article-meta-strip">
        {{- if eq .Section "projects" -}}
          Project
          {{- with .Params.stack }} · {{ . }}{{ end -}}
          {{- with .Params.source }} · <a href="{{ . }}">GitHub →</a>{{ end -}}
        {{- else -}}
          Blog
          {{- if not .Date.IsZero }} · {{ .Date.Format "January 2006" }}{{ end -}}
           · {{ .ReadingTime }} min read
        {{- end -}}
      </div>
    </header>

    {{/* Divider between header and body */}}
    <div class="max-w-prose mb-8"><hr class="home-divider"></div>

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

    <section class="max-w-prose home-section home-contact" style="padding-top:3rem;">
      {{ partial "contact-form.html" . }}
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

- [ ] **Step 2: Verify Hugo builds without errors**

```bash
hugo --minify 2>&1 | tail -5
```

Expected: `Total in NNNms` with no ERROR lines.

- [ ] **Step 3: Spot-check built HTML for a blog post**

```bash
grep -A 10 'article-header' public/blog/ipv8-vs-ipv6/index.html | head -20
```

Expected: `<h1>` followed by `<div class="article-meta-strip">` containing `Blog · May 2026`. No `article-summary`, no `feature.png` `<img>` or `<picture>` tag in the header.

- [ ] **Step 4: Spot-check built HTML for a project page**

```bash
ls public/projects/ | head -3
```

Then (replace `<slug>` with an actual project dir):

```bash
grep -A 10 'article-header' public/projects/<slug>/index.html | head -20
```

Expected: `<h1>` followed by `<div class="article-meta-strip">` containing `Project`. Stack and GitHub link present if those front matter fields exist.

- [ ] **Step 5: Commit**

```bash
git add layouts/single.html
git commit -m "feat: replace article header with metadata strip, drop OG card on-page"
```

---

### Task 2: Update CSS

**Files:**
- Modify: `assets/css/custom.css`

- [ ] **Step 1: Remove `.article-date` rule**

Find and delete this block (currently around line 432):

```css
.article-header .article-date {
  color: #525252;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}
```

- [ ] **Step 2: Remove `.article-label` rule**

Find and delete this block:

```css
.article-header .article-label {
  color: #525252;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}
```

- [ ] **Step 3: Remove `.article-summary` rule**

Find and delete this block:

```css
.article-header .article-summary {
  color: #737373;
  font-size: 0.875rem;
  line-height: 1.6;
}
```

- [ ] **Step 4: Remove project metadata row rules**

Find and delete this entire block (comment + four rule sets):

```css
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
```

- [ ] **Step 5: Remove responsive `.article-meta` rule**

In the `@media (max-width: 640px)` block, find and delete:

```css
  .article-meta {
    flex-direction: column;
    gap: 1rem;
  }
```

- [ ] **Step 6: Add `.article-meta-strip` rule**

In the article header section (after `.article-header h1 { ... }`), add:

```css
.article-meta-strip {
  font-size: 0.8125rem;
  color: #525252;
  margin-top: 0.75rem;
}

.article-meta-strip a {
  color: #5eead4;
  text-decoration: none;
}

.article-meta-strip a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 7: Verify Hugo builds without errors**

```bash
hugo --minify 2>&1 | tail -5
```

Expected: `Total in NNNms` with no ERROR lines.

- [ ] **Step 8: Commit**

```bash
git add assets/css/custom.css
git commit -m "style: replace article-date/label/summary/meta CSS with article-meta-strip"
```

---

### Task 3: Visual Verification

**Files:** none modified

- [ ] **Step 1: Start the dev server**

```bash
make serve
```

- [ ] **Step 2: Check a blog post header**

Open a blog post (e.g. `/blog/ipv8-vs-ipv6/`). Verify:
- Title renders in large Georgia serif
- Single metadata line below: `Blog · May 2026 · N min read` in muted gray
- No OG image card between header and divider
- No description paragraph
- Divider line then article body

- [ ] **Step 3: Check a project page header**

Open a project page (e.g. `/projects/`). Click through to a project. Verify:
- Title renders correctly
- Metadata strip shows `Project` (plus stack/GitHub if those front matter fields exist)
- No feature image, no description, no column metadata row

- [ ] **Step 4: Stop the dev server**

`Ctrl+C`
