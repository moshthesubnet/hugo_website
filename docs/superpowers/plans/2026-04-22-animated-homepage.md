# Animated Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six animated design elements to moshthesubnet.com's homepage — glowing photo ring, floating skill chips, typewriter tagline, particle star field, numbered cards, section eyebrow labels, and icon+label social links.

**Architecture:** Pure CSS keyframes handle the ring/chip/cursor animations; a single vanilla JS file (~100 lines, no libraries) handles the canvas particle field and typewriter loop. All HTML changes are confined to `layouts/index.html`. CSS additions append to `assets/css/custom.css`. The JS file is served from `static/` and loaded via `extend-head.html`.

**Tech Stack:** Hugo 0.157.0 (Go templates), vanilla JS (ES5-compatible), CSS3 keyframes, `requestAnimationFrame` canvas loop. No npm, no build step, no CDN.

---

## File Map

| File | Role |
| ---- | ---- |
| `static/js/hero-animations.js` | NEW — typewriter loop + canvas particle field |
| `layouts/_partials/extend-head.html` | MODIFY — add `<script defer>` tag |
| `layouts/index.html` | MODIFY — photo wrapper, typewriter span, chips, card numbers, section labels, social labels |
| `assets/css/custom.css` | MODIFY (append only) — all new animation/layout rules |

---

## Task 1: Wire Up the JS File

**Files:**

- Create: `static/js/hero-animations.js`
- Modify: `layouts/_partials/extend-head.html`

- [ ] **Step 1: Create the JS stub**

Create `static/js/hero-animations.js` with this content:

```js
(function () {
  'use strict';
  console.log('hero-animations loaded');
})();
```

- [ ] **Step 2: Add the script tag to extend-head.html**

Open `layouts/_partials/extend-head.html`. Append this line at the very end of the file (after the closing `Twitter Card` comment):

```html
{{- if .IsHome -}}
<script src="/js/hero-animations.js" defer></script>
{{- end -}}
```

The `IsHome` guard ensures the script only loads on the homepage — it has no targets on other pages.

- [ ] **Step 3: Verify the file loads**

```bash
make serve
```

Open `http://localhost:1313` in a browser. Open DevTools → Console. Confirm you see:

```
hero-animations loaded
```

No 404 errors in the Network tab.

- [ ] **Step 4: Commit**

```bash
cd /home/skyler/website
git add static/js/hero-animations.js layouts/_partials/extend-head.html
git commit -m "feat: wire up hero-animations.js stub"
```

---

## Task 2: Canvas Particle Star Field

**Files:**

- Modify: `static/js/hero-animations.js`
- Modify: `assets/css/custom.css`

- [ ] **Step 1: Add particle CSS to custom.css**

Append this block to the end of `assets/css/custom.css`:

```css
/* ---------------------------------------------------------
   HERO — particle star field
   --------------------------------------------------------- */
.home-hero {
  position: relative;
  overflow: hidden;
}

#hero-particles {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.home-hero > *:not(canvas) {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 2: Implement the particle loop in hero-animations.js**

Replace the entire contents of `static/js/hero-animations.js` with:

```js
(function () {
  'use strict';

  /* ── Particles ────────────────────────────────────────────── */
  function initParticles() {
    if (window.innerWidth < 641) return;

    var hero = document.querySelector('.home-hero');
    if (!hero) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext('2d');
    var dots = [];
    var COUNT = 60;
    var running = true;

    function resize() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function makeDot() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      };
    }

    function init() {
      resize();
      dots = [];
      for (var i = 0; i < COUNT; i++) dots.push(makeDot());
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) frame();
    });

    window.addEventListener('resize', resize);

    init();
    frame();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initParticles();
  });
})();
```

- [ ] **Step 3: Verify particles appear**

```bash
make serve
```

Open `http://localhost:1313`. The hero section should show small white drifting dots behind the content. They should move slowly and wrap at the edges. On a window narrowed below 641px, no canvas should be present in the DOM.

- [ ] **Step 4: Commit**

```bash
cd /home/skyler/website
git add static/js/hero-animations.js assets/css/custom.css
git commit -m "feat: add canvas particle star field to hero"
```

---

## Task 3: Typewriter Animation

**Files:**

- Modify: `layouts/index.html`
- Modify: `static/js/hero-animations.js`
- Modify: `assets/css/custom.css`

- [ ] **Step 1: Replace the static tagline in layouts/index.html**

Find this line in `layouts/index.html` (currently line 9):

```html
      <p class="home-hero-tagline">{{ .Site.Params.author.headline }}</p>
```

Replace it with:

```html
      <p class="home-hero-tagline"><span id="hero-typewriter"></span></p>
```

- [ ] **Step 2: Add the cursor CSS to custom.css**

Append this block to the end of `assets/css/custom.css`:

```css
/* ---------------------------------------------------------
   HERO — typewriter cursor
   --------------------------------------------------------- */
#hero-typewriter::after {
  content: '|';
  color: #5eead4;
  animation: cursor-blink 0.8s step-end infinite;
  margin-left: 1px;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
```

- [ ] **Step 3: Add the typewriter function to hero-animations.js**

Add this function inside the IIFE in `static/js/hero-animations.js`, before the `DOMContentLoaded` listener:

```js
  /* ── Typewriter ───────────────────────────────────────────── */
  function initTypewriter() {
    var el = document.getElementById('hero-typewriter');
    if (!el) return;

    var phrases = [
      'Network Enthusiast.',
      'Homelab Wrecker.',
      'Tech Content Wannabe.'
    ];
    var phraseIdx = 0;
    var charIdx = 0;
    var deleting = false;

    function tick() {
      var current = phrases[phraseIdx];
      if (!deleting) {
        charIdx++;
        el.textContent = current.slice(0, charIdx);
        if (charIdx === current.length) {
          deleting = true;
          setTimeout(tick, 2000);
          return;
        }
        setTimeout(tick, 80);
      } else {
        charIdx--;
        el.textContent = current.slice(0, charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, 40);
      }
    }

    setTimeout(tick, 800);
  }
```

- [ ] **Step 4: Call initTypewriter inside the DOMContentLoaded handler**

Find the `DOMContentLoaded` listener at the bottom of the file:

```js
  document.addEventListener('DOMContentLoaded', function () {
    initParticles();
  });
```

Replace it with:

```js
  document.addEventListener('DOMContentLoaded', function () {
    initParticles();
    initTypewriter();
  });
```

- [ ] **Step 5: Verify typewriter works**

```bash
make serve
```

Open `http://localhost:1313`. The tagline line should be blank for ~800ms then type out "Network Enthusiast." character by character, pause 2 seconds, delete, then type "Homelab Wrecker.", and so on cycling through all three phrases. A blinking teal `|` cursor should be visible at all times.

- [ ] **Step 6: Commit**

```bash
cd /home/skyler/website
git add layouts/index.html static/js/hero-animations.js assets/css/custom.css
git commit -m "feat: add typewriter animation to hero tagline"
```

---

## Task 4: Glowing Animated Photo Ring

**Files:**

- Modify: `layouts/index.html`
- Modify: `assets/css/custom.css`

- [ ] **Step 1: Wrap the profile photo in layouts/index.html**

Find this block in `layouts/index.html` (currently around line 7):

```html
    <img src="/img/profile.png" alt="{{ .Site.Params.author.name }}" class="home-hero-photo">
```

Replace it with:

```html
    <div class="home-hero-photo-wrap">
      <div class="home-hero-ring"></div>
      <img src="/img/profile.png" alt="{{ .Site.Params.author.name }}" class="home-hero-photo">
    </div>
```

- [ ] **Step 2: Add ring and glow CSS to custom.css**

Append this block to the end of `assets/css/custom.css`:

```css
/* ---------------------------------------------------------
   HERO — glowing animated photo ring
   --------------------------------------------------------- */
.home-hero-photo-wrap {
  position: relative;
  width: 304px;
  height: 304px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dim base ring */
.home-hero-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(94, 234, 212, 0.2);
}

/* Spinning arc overlay */
.home-hero-ring::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #5eead4;
  border-right-color: rgba(94, 234, 212, 0.4);
  animation: ring-spin 4s linear infinite;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

/* Photo — override old border, add glow pulse */
.home-hero-photo {
  width: 240px !important;
  height: 240px !important;
  border: 1px solid #262626 !important;
  position: relative;
  z-index: 2;
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 18px rgba(94, 234, 212, 0.2); }
  50%       { box-shadow: 0 0 32px rgba(94, 234, 212, 0.4); }
}

@media (max-width: 640px) {
  .home-hero-photo-wrap {
    width: auto;
    height: auto;
  }

  .home-hero-ring {
    display: none;
  }

  .home-hero-photo {
    width: 160px !important;
    height: 160px !important;
  }
}
```

- [ ] **Step 3: Verify the ring**

```bash
make serve
```

Open `http://localhost:1313`. The profile photo should have a dim circular ring around it with a bright teal arc spinning around it continuously. The photo itself should subtly pulse brighter/dimmer every ~3 seconds. At mobile width (< 641px), the ring should disappear and the photo should shrink cleanly.

- [ ] **Step 4: Commit**

```bash
cd /home/skyler/website
git add layouts/index.html assets/css/custom.css
git commit -m "feat: add glowing animated ring to hero photo"
```

---

## Task 5: Floating Skill Chip Badges

**Files:**

- Modify: `layouts/index.html`
- Modify: `assets/css/custom.css`

- [ ] **Step 1: Add the four chips inside the photo wrapper in layouts/index.html**

Find the `.home-hero-photo-wrap` block added in Task 4:

```html
    <div class="home-hero-photo-wrap">
      <div class="home-hero-ring"></div>
      <img src="/img/profile.png" alt="{{ .Site.Params.author.name }}" class="home-hero-photo">
    </div>
```

Replace it with:

```html
    <div class="home-hero-photo-wrap">
      <div class="home-hero-ring"></div>
      <img src="/img/profile.png" alt="{{ .Site.Params.author.name }}" class="home-hero-photo">
      <span class="home-hero-chip home-hero-chip--tl">Networking</span>
      <span class="home-hero-chip home-hero-chip--bl">Linux</span>
      <span class="home-hero-chip home-hero-chip--tr">Cloud</span>
      <span class="home-hero-chip home-hero-chip--br">Automation</span>
    </div>
```

- [ ] **Step 2: Add chip CSS to custom.css**

Append this block to the end of `assets/css/custom.css`:

```css
/* ---------------------------------------------------------
   HERO — floating skill chip badges
   --------------------------------------------------------- */
.home-hero-chip {
  position: absolute;
  background: #1a1a1a;
  border: 1px solid #5eead4;
  border-radius: 3px;
  color: #5eead4;
  font-size: 0.75rem;
  font-family: system-ui, -apple-system, sans-serif;
  padding: 0.25rem 0.625rem;
  white-space: nowrap;
  z-index: 3;
  animation: chip-float 3s ease-in-out infinite;
}

.home-hero-chip--tl { top: 12%;  left: -18%; animation-delay: 0s;     }
.home-hero-chip--bl { bottom: 18%; left: -14%; animation-delay: 0.75s;  }
.home-hero-chip--tr { top: 18%;  right: -14%; animation-delay: 1.5s;   }
.home-hero-chip--br { bottom: 12%; right: -18%; animation-delay: 2.25s; }

@keyframes chip-float {
  0%, 100% { transform: translateY(0);   }
  50%       { transform: translateY(-6px); }
}

@media (max-width: 640px) {
  .home-hero-chip { display: none; }
}
```

- [ ] **Step 3: Verify chips appear**

```bash
make serve
```

Open `http://localhost:1313`. Four teal-bordered chips (Networking, Linux, Cloud, Automation) should be visible at the corners of the photo ring, each gently floating up and down at slightly different rhythms. At mobile width (< 641px), all chips should be hidden.

- [ ] **Step 4: Commit**

```bash
cd /home/skyler/website
git add layouts/index.html assets/css/custom.css
git commit -m "feat: add floating skill chip badges to hero"
```

---

## Task 6: Numbered Project Cards + Hover Overlay

**Files:**

- Modify: `layouts/index.html`
- Modify: `assets/css/custom.css`

- [ ] **Step 1: Update the Writing cards range loop in layouts/index.html**

Find this block (currently around line 40):

```html
    <div class="home-card-grid">
      {{ range $posts }}
      <a href="{{ .Permalink }}" class="home-card">
        {{ with .Params.images }}
        <div class="home-card-thumb">
          <img src="{{ index . 0 }}" alt="{{ $.Title }}" loading="lazy">
        </div>
        {{ end }}
        <div class="home-card-body">
          <div class="home-card-title">{{ .Title }}</div>
          <div class="home-card-date">{{ .Date.Format "Jan 2006" }}</div>
          <div class="home-card-desc">{{ .Description }}</div>
          {{ with .Params.tags }}
          <div class="home-card-tags">
            {{ range first 3 . }}<span class="home-card-tag">{{ . }}</span>{{ end }}
          </div>
          {{ end }}
        </div>
      </a>
      {{ end }}
    </div>
```

Replace it with:

```html
    <div class="home-card-grid">
      {{ range $i, $post := $posts }}
      <a href="{{ $post.Permalink }}" class="home-card">
        <span class="home-card-num">{{ printf "%02d" (add $i 1) }}</span>
        {{ with $post.Params.images }}
        <div class="home-card-thumb">
          <img src="{{ index . 0 }}" alt="{{ $post.Title }}" loading="lazy">
        </div>
        {{ end }}
        <div class="home-card-body">
          <div class="home-card-title">{{ $post.Title }}</div>
          <div class="home-card-date">{{ $post.Date.Format "Jan 2006" }}</div>
          <div class="home-card-desc">{{ $post.Description }}</div>
          {{ with $post.Params.tags }}
          <div class="home-card-tags">
            {{ range first 3 . }}<span class="home-card-tag">{{ . }}</span>{{ end }}
          </div>
          {{ end }}
        </div>
      </a>
      {{ end }}
    </div>
```

- [ ] **Step 2: Update the Projects cards range loop in layouts/index.html**

Find the second card grid block (currently around line 72):

```html
    <div class="home-card-grid">
      {{ range first 3 $projects }}
      <a href="{{ .Permalink }}" class="home-card">
        {{ with .Params.images }}
        <div class="home-card-thumb">
          <img src="{{ index . 0 }}" alt="{{ $.Title }}" loading="lazy">
        </div>
        {{ end }}
        <div class="home-card-body">
          <div class="home-card-title">{{ .Title }}</div>
          <div class="home-card-date">{{ .Date.Format "Jan 2006" }}</div>
          <div class="home-card-desc">{{ .Description }}</div>
          {{ with .Params.tags }}
          <div class="home-card-tags">
            {{ range first 3 . }}<span class="home-card-tag">{{ . }}</span>{{ end }}
          </div>
          {{ end }}
        </div>
      </a>
      {{ end }}
    </div>
```

Replace it with:

```html
    <div class="home-card-grid">
      {{ range $i, $project := first 3 $projects }}
      <a href="{{ $project.Permalink }}" class="home-card">
        <span class="home-card-num">{{ printf "%02d" (add $i 1) }}</span>
        {{ with $project.Params.images }}
        <div class="home-card-thumb">
          <img src="{{ index . 0 }}" alt="{{ $project.Title }}" loading="lazy">
        </div>
        {{ end }}
        <div class="home-card-body">
          <div class="home-card-title">{{ $project.Title }}</div>
          <div class="home-card-date">{{ $project.Date.Format "Jan 2006" }}</div>
          <div class="home-card-desc">{{ $project.Description }}</div>
          {{ with $project.Params.tags }}
          <div class="home-card-tags">
            {{ range first 3 . }}<span class="home-card-tag">{{ . }}</span>{{ end }}
          </div>
          {{ end }}
        </div>
      </a>
      {{ end }}
    </div>
```

- [ ] **Step 3: Add card number and hover overlay CSS to custom.css**

Append this block to the end of `assets/css/custom.css`:

```css
/* ---------------------------------------------------------
   HOMEPAGE — numbered card badges + hover overlay
   --------------------------------------------------------- */
.home-card-num {
  position: absolute;
  top: 0.75rem;
  right: 0.875rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.75rem;
  color: rgba(94, 234, 212, 0.3);
  line-height: 1;
  z-index: 1;
}

/* Cards need relative positioning for the badge */
.home-card {
  position: relative;
}

/* Teal wash on thumbnail hover */
.home-card-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(94, 234, 212, 0.08);
  opacity: 0;
  transition: opacity 0.2s;
}

.home-card:hover .home-card-thumb::after {
  opacity: 1;
}

/* Thumbnail needs relative for the ::after overlay */
.home-card-thumb {
  position: relative;
}
```

- [ ] **Step 4: Verify numbered cards**

```bash
make serve
```

Open `http://localhost:1313`. Both the Writing and Projects card grids should show dim teal numbers `01`, `02`, `03` in the top-right corner of each card. Hovering over a card with a thumbnail image should show a very subtle teal overlay on the image. Hugo should report no template errors in the terminal.

- [ ] **Step 5: Commit**

```bash
cd /home/skyler/website
git add layouts/index.html assets/css/custom.css
git commit -m "feat: add numbered badges and hover overlay to homepage cards"
```

---

## Task 7: Section Eyebrow Labels

**Files:**

- Modify: `layouts/index.html`

- [ ] **Step 1: Add the WRITING label**

In `layouts/index.html`, find the Recent Writing section header (currently around line 37):

```html
  <section class="home-section">
    <div class="home-section-label">Recent Writing</div>
```

Replace it with:

```html
  <section class="home-section">
    <div class="home-section-label">WRITING</div>
```

- [ ] **Step 2: Add the PROJECTS label**

Find the Featured Projects section header (currently around line 68):

```html
  <section class="home-section">
    <div class="home-section-label">Featured Projects</div>
```

Replace it with:

```html
  <section class="home-section">
    <div class="home-section-label">PROJECTS</div>
```

- [ ] **Step 3: Add the GET IN TOUCH label**

Find the contact section (currently around line 97):

```html
  <section class="home-section home-contact">
    {{ partial "contact-form.html" . }}
```

Replace it with:

```html
  <section class="home-section home-contact">
    <div class="home-section-label">GET IN TOUCH</div>
    {{ partial "contact-form.html" . }}
```

- [ ] **Step 4: Verify labels**

```bash
make serve
```

Open `http://localhost:1313`. Three small uppercase gray labels should appear above their respective sections: "WRITING" above the writing cards, "PROJECTS" above the projects cards, and "GET IN TOUCH" above the contact form.

- [ ] **Step 5: Commit**

```bash
cd /home/skyler/website
git add layouts/index.html
git commit -m "feat: add section eyebrow labels to homepage"
```

---

## Task 8: Social Links — Icon + Label Text

**Files:**

- Modify: `layouts/index.html`
- Modify: `assets/css/custom.css`

- [ ] **Step 1: Add text labels to social link anchors in layouts/index.html**

Find the `.home-social-icons` block (currently around line 12):

```html
      <div class="home-social-icons">
        {{ range . }}
          {{ range $platform, $url := . }}
            <a href="{{ $url }}" class="home-social-link" title="{{ $platform }}" target="_blank" rel="noopener noreferrer">
              {{- if eq $platform "github" -}}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              {{- else if eq $platform "linkedin" -}}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              {{- else if eq $platform "instagram" -}}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              {{- end -}}
            </a>
          {{ end }}
        {{ end }}
      </div>
```

Replace it with:

```html
      <div class="home-social-icons">
        {{ range . }}
          {{ range $platform, $url := . }}
            <a href="{{ $url }}" class="home-social-link" title="{{ $platform }}" target="_blank" rel="noopener noreferrer">
              {{- if eq $platform "github" -}}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              <span class="home-social-label">GitHub</span>
              {{- else if eq $platform "linkedin" -}}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <span class="home-social-label">LinkedIn</span>
              {{- else if eq $platform "instagram" -}}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span class="home-social-label">Instagram</span>
              {{- end -}}
            </a>
          {{ end }}
        {{ end }}
      </div>
```

- [ ] **Step 2: Add social label CSS to custom.css**

Append this block to the end of `assets/css/custom.css`:

```css
/* ---------------------------------------------------------
   HERO — social icon + label
   --------------------------------------------------------- */
.home-social-link {
  gap: 0.4rem;
}

.home-social-label {
  font-size: 0.8125rem;
  color: #5eead4;
  font-family: system-ui, -apple-system, sans-serif;
}

@media (max-width: 640px) {
  .home-social-label { display: none; }
}
```

- [ ] **Step 3: Verify social labels**

```bash
make serve
```

Open `http://localhost:1313`. Social links in the hero should now show icon + text label side by side (e.g., GitHub icon followed by "GitHub"). At mobile width (< 641px), only the bare icons should appear.

- [ ] **Step 4: Commit**

```bash
cd /home/skyler/website
git add layouts/index.html assets/css/custom.css
git commit -m "feat: add text labels to hero social links"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 6 user-selected elements (7 implementation units) have a task. Particles ✓, typewriter ✓, glow ring ✓, chips ✓, numbered cards ✓, section labels ✓, social labels ✓.
- [x] **No placeholders:** Every step has exact code, exact commands, exact expected output.
- [x] **Type consistency:** `initParticles()` and `initTypewriter()` are both defined before they are called in the `DOMContentLoaded` handler. `$post` / `$project` variables are used consistently through the range loops in Task 6. `.home-hero-chip` class referenced in CSS matches the class added in HTML.
- [x] **Mobile responsive:** Chips hidden, ring hidden, social labels hidden, particles skipped on mobile — all covered.
- [x] **Task ordering:** JS wired first (Task 1) before JS logic added (Tasks 2–3). Ring wrapper built (Task 4) before chips added inside it (Task 5). Tasks 6–8 are independent.
