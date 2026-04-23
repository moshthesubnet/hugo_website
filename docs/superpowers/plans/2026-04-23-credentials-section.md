# Credentials Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CREDENTIALS section to the homepage showing two Credly-verified badge cards (CCNA and CCNA Cybersecurity) positioned after Projects and before Contact.

**Architecture:** Two static files change — CSS styles appended to `assets/css/custom.css`, and HTML inserted into `layouts/index.html` between the projects closing `{{ end }}` and the contact section comment. The Credly embed script is included inline once at the bottom of the credentials section; no head changes needed.

**Tech Stack:** Hugo Go templates, vanilla CSS, Credly badge embed (external iframe, loaded async)

---

## File Map

| File | Change |
|---|---|
| `assets/css/custom.css` | Append credentials card styles (no existing rules modified) |
| `layouts/index.html` | Insert credentials section at line 107 (between `{{ end }}` and `{{/* ── Contact */}}`) |

---

### Task 1: Add credentials CSS

**Files:**
- Modify: `assets/css/custom.css` (append to end of file)

- [ ] **Step 1: Append credentials styles to `assets/css/custom.css`**

Add the following block at the very end of the file:

```css
/* ---------------------------------------------------------
   HOMEPAGE — credentials section
   --------------------------------------------------------- */
.home-cred-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.home-cred-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 2rem;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 1.5rem;
}

.home-cred-badge {
  flex-shrink: 0;
  width: 150px;
}

.home-cred-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.home-cred-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #e5e5e5;
  line-height: 1.3;
}

.home-cred-issuer {
  font-size: 0.875rem;
  color: #5eead4;
}

.home-cred-date {
  font-size: 0.8125rem;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .home-cred-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/custom.css
git commit -m "feat: add credentials card CSS styles"
```

---

### Task 2: Add credentials HTML section

**Files:**
- Modify: `layouts/index.html` (insert between line 106 and line 108)

The current file has this structure around the insertion point (lines 103–112):

```html
  </section>

  <hr class="home-divider">
  {{ end }}

  {{/* ── Contact ───────────────────────────────────────────── */}}
  <section class="home-section home-contact">
```

- [ ] **Step 1: Insert the credentials section into `layouts/index.html`**

Replace the block from `  <hr class="home-divider">` (the one after the projects closing `</section>`, around line 105) through `  {{ end }}` with the following — which keeps the existing projects `<hr>` and `{{ end }}`, then appends the new credentials section before contact:

Find this exact text in `layouts/index.html`:

```
  <hr class="home-divider">
  {{ end }}

  {{/* ── Contact ───────────────────────────────────────────── */}}
```

Replace it with:

```
  <hr class="home-divider">
  {{ end }}

  {{/* ── Credentials ──────────────────────────────────────── */}}
  <section class="home-section">
    <div class="home-section-label">CREDENTIALS</div>
    <div class="home-cred-grid">

      <div class="home-cred-card">
        <div class="home-cred-badge">
          <div data-iframe-width="150" data-iframe-height="270"
               data-share-badge-id="97a687b5-f243-4a7d-8876-b09488998831"
               data-share-badge-host="https://www.credly.com"></div>
        </div>
        <div class="home-cred-meta">
          <div class="home-cred-title">Cisco Certified Network Associate</div>
          <div class="home-cred-issuer">Cisco Systems</div>
          <div class="home-cred-date">Feb 2025</div>
        </div>
      </div>

      <div class="home-cred-card">
        <div class="home-cred-badge">
          <div data-iframe-width="150" data-iframe-height="270"
               data-share-badge-id="9b291214-7552-4ab4-a14b-6267fbe12da0"
               data-share-badge-host="https://www.credly.com"></div>
        </div>
        <div class="home-cred-meta">
          <div class="home-cred-title">Cisco CyberOps Associate</div>
          <div class="home-cred-issuer">Cisco Systems</div>
          <div class="home-cred-date">Jun 2025</div>
        </div>
      </div>

    </div>
    <script type="text/javascript" async src="//cdn.credly.com/assets/utilities/embed.js"></script>
  </section>

  <hr class="home-divider">

  {{/* ── Contact ───────────────────────────────────────────── */}}
```

- [ ] **Step 2: Verify Hugo builds without errors**

Run:
```bash
hugo --minify 2>&1 | tail -5
```

Expected: build completes with `Total in NNN ms`, no `ERROR` lines.

- [ ] **Step 3: Verify section renders in dev server**

Run (if not already running):
```bash
make serve
```

Open the homepage. Scroll past Projects. Confirm:
- "CREDENTIALS" eyebrow label is visible
- Two cards render with dark `#1a1a1a` background
- Credly badge iframes load (may take a moment — they are external)
- Card metadata shows cert title in light text, issuer in teal, date in gray
- On a narrow viewport (≤640px), cards stack vertically and center-align

- [ ] **Step 4: Commit**

```bash
git add layouts/index.html
git commit -m "feat: add credentials section with Credly badge cards to homepage"
```
