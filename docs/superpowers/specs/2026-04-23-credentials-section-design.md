# Design Spec: Credentials Section on Homepage

**Date:** 2026-04-23
**Status:** Approved

## Overview

Add a "CREDENTIALS" section to the homepage (`layouts/index.html`) positioned after the Projects block and before the Contact section. The section displays two Credly-verified badge cards (CCNA and CCNA Cybersecurity) using the existing visual language of the page — same eyebrow label, same card grid rhythm, same teal/gray color hierarchy.

---

## Layout

### Section wrapper

Follows the identical pattern used by the Writing and Projects sections:

```html
<section class="home-section">
  <div class="home-section-label">CREDENTIALS</div>
  <div class="home-cred-grid">
    <!-- two .home-cred-card elements -->
  </div>
</section>
<hr class="home-divider">
```

### Card structure

Each `.home-cred-card` is a flex row:

- **Left column** (`.home-cred-badge`, fixed ~160px width): holds the Credly `<div>` embed element. Credly's script replaces it with an interactive iframe showing the badge artwork, name, and verification link.
- **Right column** (`.home-cred-meta`, `flex: 1`): cert name, issuer, issued date — same text scale and color as existing card metadata.

```html
<div class="home-cred-card">
  <div class="home-cred-badge">
    <div data-iframe-width="150" data-iframe-height="270"
         data-share-badge-id="BADGE_ID"
         data-share-badge-host="https://www.credly.com"></div>
  </div>
  <div class="home-cred-meta">
    <div class="home-cred-title">CERT NAME</div>
    <div class="home-cred-issuer">Cisco Systems</div>
    <div class="home-cred-date">ISSUED DATE</div>
  </div>
</div>
```

The Credly embed script is included **once**, as the last element inside the section, after both cards:

```html
<script type="text/javascript" async src="//cdn.credly.com/assets/utilities/embed.js"></script>
```

---

## Credential Data

| Field | Card 1 | Card 2 |
|---|---|---|
| Badge ID | `97a687b5-f243-4a7d-8876-b09488998831` | `9b291214-7552-4ab4-a14b-6267fbe12da0` |
| Title | Cisco Certified Network Associate | Cisco CyberOps Associate |
| Issuer | Cisco Systems | Cisco Systems |
| Issued | Feb 2025 | Jun 2025 |

---

## CSS

All rules appended to `assets/css/custom.css`. No existing rules are modified.

```css
/* HOMEPAGE — credentials section */
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

---

## Files Changed

- `layouts/index.html` — credentials section inserted between Projects `<hr>` and Contact section
- `assets/css/custom.css` — append credentials card styles (no existing rules modified)

## Out of Scope

- No changes to `extend-head.html` — Credly script is inline in the section, not a site-wide head dependency
- No new Hugo content files — data is hardcoded in the template (only two static certs, no need for data files)
- No changes to nav, footer, or any other page
