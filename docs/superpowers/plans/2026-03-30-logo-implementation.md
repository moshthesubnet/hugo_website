# Switch Stack Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Switch Stack" logo as an inline SVG in the site header and generate favicon PNGs.

**Architecture:** Create the SVG source file, override Congo's `logo.html` partial to render the inline SVG next to "Skyler King," add CSS hover transitions, and generate favicon PNGs from a simplified SVG using a Python script with Pillow.

**Tech Stack:** Hugo (Congo theme), SVG, CSS, Python 3 + Pillow (for PNG favicon generation)

**Spec:** `docs/superpowers/specs/2026-03-29-logo-design.md`

---

### Task 1: Create the SVG source file

**Files:**
- Create: `assets/img/logo.svg`

- [ ] **Step 1: Write the SVG**

Create `assets/img/logo.svg` with the full Switch Stack mark — four bars with ports, LEDs, cascade, and opacity fade:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 22" width="26" height="22">
  <!-- Switch 1 (top, 0.3 opacity) -->
  <rect x="3" y="1" width="18" height="3.5" fill="#5eead4" opacity="0.3"/>
  <circle cx="5" cy="2.75" r="0.7" fill="#fafafa" opacity="0.3"/>
  <rect x="8" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
  <rect x="11" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
  <rect x="14" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
  <rect x="17" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
  <!-- Switch 2 (0.5 opacity) -->
  <rect x="2" y="6" width="18" height="3.5" fill="#5eead4" opacity="0.5"/>
  <circle cx="4" cy="7.75" r="0.7" fill="#fafafa" opacity="0.5"/>
  <rect x="7" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
  <rect x="10" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
  <rect x="13" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
  <rect x="16" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
  <!-- Switch 3 (0.75 opacity) -->
  <rect x="1" y="11" width="18" height="3.5" fill="#5eead4" opacity="0.75"/>
  <circle cx="3" cy="12.75" r="0.7" fill="#fafafa" opacity="0.75"/>
  <rect x="6" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
  <rect x="9" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
  <rect x="12" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
  <rect x="15" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
  <!-- Switch 4 (bottom, full opacity) -->
  <rect x="0" y="16" width="18" height="3.5" fill="#5eead4" opacity="1"/>
  <circle cx="2" cy="17.75" r="0.7" fill="#fafafa"/>
  <rect x="5" y="17" width="1.5" height="1.5" fill="#111111"/>
  <rect x="8" y="17" width="1.5" height="1.5" fill="#111111"/>
  <rect x="11" y="17" width="1.5" height="1.5" fill="#111111"/>
  <rect x="14" y="17" width="1.5" height="1.5" fill="#111111"/>
</svg>
```

- [ ] **Step 2: Verify the SVG renders correctly**

Open the SVG in a browser to confirm it matches the approved preview:
```bash
xdg-open assets/img/logo.svg 2>/dev/null || echo "Open assets/img/logo.svg in a browser manually"
```

- [ ] **Step 3: Commit**

```bash
git add assets/img/logo.svg
git commit -m "feat: add Switch Stack logo SVG source"
```

---

### Task 2: Override the Congo logo partial

**Files:**
- Create: `layouts/_partials/logo.html`
- Reference: `themes/congo/layouts/_partials/logo.html` (original partial)

The original Congo `logo.html` checks `header.logo` param for an image, then shows the site title. We override it to insert our inline SVG before the title text.

- [ ] **Step 1: Create the logo partial override**

Create `layouts/_partials/logo.html`:

```html
{{/* Switch Stack logo — inline SVG for CSS hover control */}}
<a class="site-logo-link" rel="me" href="{{ "" | relLangURL }}" style="display: inline-flex; align-items: center; gap: 8px;">
  <svg class="site-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 22" width="20" height="17" aria-hidden="true">
    <!-- Switch 1 (top, 0.3 opacity) -->
    <rect class="switch-bar" x="3" y="1" width="18" height="3.5" fill="#5eead4" opacity="0.3"/>
    <circle class="switch-led" cx="5" cy="2.75" r="0.7" fill="#fafafa" opacity="0.3"/>
    <rect class="switch-port" x="8" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
    <rect class="switch-port" x="11" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
    <rect class="switch-port" x="14" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
    <rect class="switch-port" x="17" y="2" width="1.5" height="1.5" fill="#111111" opacity="0.3"/>
    <!-- Switch 2 (0.5 opacity) -->
    <rect class="switch-bar" x="2" y="6" width="18" height="3.5" fill="#5eead4" opacity="0.5"/>
    <circle class="switch-led" cx="4" cy="7.75" r="0.7" fill="#fafafa" opacity="0.5"/>
    <rect class="switch-port" x="7" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
    <rect class="switch-port" x="10" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
    <rect class="switch-port" x="13" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
    <rect class="switch-port" x="16" y="7" width="1.5" height="1.5" fill="#111111" opacity="0.5"/>
    <!-- Switch 3 (0.75 opacity) -->
    <rect class="switch-bar" x="1" y="11" width="18" height="3.5" fill="#5eead4" opacity="0.75"/>
    <circle class="switch-led" cx="3" cy="12.75" r="0.7" fill="#fafafa" opacity="0.75"/>
    <rect class="switch-port" x="6" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
    <rect class="switch-port" x="9" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
    <rect class="switch-port" x="12" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
    <rect class="switch-port" x="15" y="12" width="1.5" height="1.5" fill="#111111" opacity="0.75"/>
    <!-- Switch 4 (bottom, full opacity) -->
    <rect class="switch-bar" x="0" y="16" width="18" height="3.5" fill="#5eead4" opacity="1"/>
    <circle class="switch-led" cx="2" cy="17.75" r="0.7" fill="#fafafa" opacity="1"/>
    <rect class="switch-port" x="5" y="17" width="1.5" height="1.5" fill="#111111" opacity="1"/>
    <rect class="switch-port" x="8" y="17" width="1.5" height="1.5" fill="#111111" opacity="1"/>
    <rect class="switch-port" x="11" y="17" width="1.5" height="1.5" fill="#111111" opacity="1"/>
    <rect class="switch-port" x="14" y="17" width="1.5" height="1.5" fill="#111111" opacity="1"/>
  </svg>
  {{- if .Site.Params.header.showTitle | default true }}
    <span>{{ .Site.Title | markdownify | emojify }}</span>
  {{- end }}
</a>
```

Note: This replaces the original partial entirely. The original supported an image-based logo via `header.logo` param — we no longer need that since we're using inline SVG. The `showTitle` check is preserved.

- [ ] **Step 2: Verify the header renders**

```bash
# Hugo dev server should already be running; if not:
make serve
```

Open `http://10.30.30.30:1313` and confirm:
- The Switch Stack icon appears to the left of "Skyler King"
- They are vertically aligned
- The gap between icon and text is ~8px
- The icon is approximately the same height as the text

- [ ] **Step 3: Commit**

```bash
git add layouts/_partials/logo.html
git commit -m "feat: override logo partial with inline Switch Stack SVG"
```

---

### Task 3: Add CSS hover transition

**Files:**
- Modify: `assets/css/custom.css` (after the HEADER section, around line 110)

- [ ] **Step 1: Add the hover styles**

Add this CSS block after line 109 (after the `body > header a[href="/"]` rule) in `assets/css/custom.css`:

```css
/* Switch Stack logo hover — "stack coming online" */
.site-logo .switch-bar,
.site-logo .switch-led,
.site-logo .switch-port {
  transition: opacity 0.2s ease;
}

.site-logo-link:hover .switch-bar,
.site-logo-link:hover .switch-led,
.site-logo-link:hover .switch-port {
  opacity: 1 !important;
}

/* Remove default link underline from logo link */
.site-logo-link {
  text-decoration: none !important;
}

.site-logo-link span {
  color: #fafafa !important;
  font-weight: 500;
}
```

- [ ] **Step 2: Verify the hover effect**

Open `http://10.30.30.30:1313` in a browser. Hover over the logo+text in the header. Confirm:
- All four bars smoothly transition to full opacity
- LEDs and ports all become fully visible
- The transition is subtle (~0.2s ease)
- No underline appears on hover

- [ ] **Step 3: Commit**

```bash
git add assets/css/custom.css
git commit -m "feat: add Switch Stack hover transition CSS"
```

---

### Task 4: Generate and replace favicon PNGs

**Files:**
- Create: `scripts/generate-favicon.py`
- Replace: `static/assets/favicon.png`
- Replace: `static/assets/favicon-32.png`

The favicon is a simplified version — four cascading teal bars with opacity fade, no ports or LEDs.

- [ ] **Step 1: Write the favicon generation script**

Create `scripts/generate-favicon.py`:

```python
"""Generate favicon PNGs from the simplified Switch Stack logo.

Uses Pillow to draw the four cascading bars at 16x16 and 32x32.
No ports or LEDs at favicon scale — just the bars with opacity fade.
"""

from PIL import Image, ImageDraw


def draw_switch_stack(size: int) -> Image.Image:
    """Draw the simplified switch stack favicon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Teal color: #5eead4 = (94, 234, 212)
    teal = (94, 234, 212)

    # Four bars with opacity fade, scaled to fit the square
    # Bars occupy roughly 80% width, with cascade offset
    bar_count = 4
    opacities = [0.3, 0.5, 0.75, 1.0]

    # Geometry scaled to target size
    margin = round(size * 0.08)
    bar_height = round(size * 0.17)
    bar_width = round(size * 0.75)
    spacing = round((size - 2 * margin - bar_count * bar_height) / (bar_count - 1))
    cascade_step = round(size * 0.04)

    for i, opacity in enumerate(opacities):
        x = margin + (bar_count - 1 - i) * cascade_step
        y = margin + i * (bar_height + spacing)
        alpha = round(opacity * 255)
        color = (*teal, alpha)
        draw.rectangle([x, y, x + bar_width, y + bar_height], fill=color)

    return img


if __name__ == "__main__":
    # Generate 16x16
    img_16 = draw_switch_stack(16)
    img_16.save("static/assets/favicon.png")
    print("Generated static/assets/favicon.png (16x16)")

    # Generate 32x32
    img_32 = draw_switch_stack(32)
    img_32.save("static/assets/favicon-32.png")
    print("Generated static/assets/favicon-32.png (32x32)")
```

- [ ] **Step 2: Run the script**

```bash
cd /home/skyler/website && python3 scripts/generate-favicon.py
```

Expected output:
```
Generated static/assets/favicon.png (16x16)
Generated static/assets/favicon-32.png (32x32)
```

- [ ] **Step 3: Verify the favicons**

Check the files exist and have reasonable sizes:
```bash
file static/assets/favicon.png static/assets/favicon-32.png
```

Expected: Both should be PNG files. Open in a browser or image viewer to confirm four teal bars with opacity fade on a transparent background.

- [ ] **Step 4: Update favicons.html to include 32px variant**

Read `layouts/_partials/favicons.html`. It currently only references `favicon.png`. Add the 32px variant:

Replace the contents of `layouts/_partials/favicons.html` with:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/favicon-32.png">
```

- [ ] **Step 5: Verify favicon in browser**

Open `http://10.30.30.30:1313` and check the browser tab. The favicon should show the simplified switch stack bars.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-favicon.py static/assets/favicon.png static/assets/favicon-32.png layouts/_partials/favicons.html
git commit -m "feat: generate and replace favicon PNGs with Switch Stack mark"
```

---

### Task 5: Clean up preview page and old logo files

**Files:**
- Delete: `content/logo-preview.md`
- Delete: `assets/img/logo transparent.png` (old logo)

- [ ] **Step 1: Remove the preview page**

```bash
rm content/logo-preview.md
```

- [ ] **Step 2: Remove the old transparent logo**

```bash
rm "assets/img/logo transparent.png"
```

Note: Keep `assets/img/logo.png` and `static/assets/logo.png` for now — they may be referenced elsewhere. The new SVG source at `assets/img/logo.svg` is the canonical logo going forward.

- [ ] **Step 3: Final verification**

Open `http://10.30.30.30:1313` and verify:
- Header: Switch Stack icon + "Skyler King" text, vertically aligned
- Hover: All bars transition to full opacity smoothly
- Favicon: Simplified switch stack bars in the browser tab
- No broken pages or missing assets

- [ ] **Step 4: Commit**

```bash
git add -u content/logo-preview.md "assets/img/logo transparent.png"
git commit -m "chore: remove logo preview page and old transparent logo"
```
