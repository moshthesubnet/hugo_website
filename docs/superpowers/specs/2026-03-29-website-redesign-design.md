# Website Redesign — Minimal Writer

**Date:** 2026-03-29
**Status:** Design approved, pending implementation

## Overview

Full visual redesign of moshthesubnet.com from the current punk-rock/emo "Cyberviolet" aesthetic to a minimal, content-first design inspired by personal engineering blogs (overreacted.io, jvns.ca). The site remains a Hugo + Congo stack deployed on Cloudflare Pages. The redesign covers color scheme, typography, layout, and navigation. Content and deployment pipeline are unchanged.

## Goals

- Look like a professional tech portfolio, not a themed personal page
- Prioritize readability and content over visual effects
- Avoid AI-slop signals: no generic gradients, glowing effects, floating illustrations, or over-designed hero sections
- Maintain personality through voice and writing, not visual gimmicks
- Focus on networking/cloud engineering as the professional identity

## Design Decisions

### Brand

- **Keep** the "Mosh The Subnet" domain (moshthesubnet.com) and brand name
- **Keep** the Instagram handle (@moshthesubnet)
- **Remove** the current logo from the header; replace with plain text "Skyler King"
- Logo redesign is a future project, out of scope here

### Color

- **Background:** Near-black (#111111)
- **Primary text:** #e5e5e5 (body), #fafafa (headings, nav name)
- **Secondary text:** #a3a3a3 (intro paragraph, metadata)
- **Muted text:** #525252 (descriptions, dates, tags)
- **Dividers:** #262626
- **Accent:** Muted teal (#5eead4) — used only on links, post/project titles, and inline code references
- **Link hover:** Underline appears on hover (simple text-decoration, no animation)
- **Visited links:** Slightly dimmed teal (#4cc9b0) — subtle enough to not distract
- **Code block background:** #1a1a1a with #262626 border
- **Dark mode only** — no light mode, no toggle

### Typography

- **Hero statement:** Georgia (serif), 32px, normal weight, normal case
- **Page titles (blog/project):** Georgia (serif), 28px, normal weight
- **Body text:** System sans-serif stack (system-ui, -apple-system, sans-serif), 15px, line-height 1.8
- **Nav / labels / metadata:** System sans-serif, 12-14px
- **Section labels:** System sans-serif, 12px, uppercase, letter-spacing 1.5px, color #737373
- **Code (inline):** Fira Code, 13px, colored #5eead4
- **Code (blocks):** Fira Code, 13px, on #1a1a1a background
- **No custom web fonts to load** except Fira Code for code blocks (already in use). Georgia and system-ui are native.

### What Gets Removed

- Bebas Neue font (uppercase headings)
- Space Mono font (body text)
- Cyber Violet / Electric Blue color scheme and the `cyberviolet` Congo color scheme
- Grain overlay (html::after noise texture)
- AOS (Animate On Scroll) library and all scroll animations
- Page load fade-in animation
- Neon glow / text-shadow effects
- Profile photo from homepage hero
- Social links from top navigation
- "Recent Wins" section with emoji bullets
- Certification table format (replaced with inline list)
- "The Stack" section from homepage (stack details live on project pages and about page)
- Lab topology link from homepage (moves to about page or stays in docs)

## Page Layouts

All pages share: 720px max-width content column, centered. Same nav, same footer, same divider style.

### Navigation

- **Left:** "Skyler King" (plain text, links to homepage)
- **Right:** Writing, Projects, About (three text links)
- **Active state:** Current section link turns #fafafa, others stay #737373
- **No logo, no icons, no hamburger menu on desktop**
- **Mobile:** The three links should stack or collapse gracefully; details left to implementation. Keep it simple — no animated hamburger menus.

### Homepage

Top to bottom:

1. **Hero** — Serif statement: "My career path has more hops than my traceroute." followed by a brief intro paragraph: "Network Engineering and Security student at WGU (Cisco Track). CCNA and a modest homelab I use to break things on purpose. I document the thinking behind every fix, build, and mistake."
2. **Divider**
3. **Recent Writing** — Section label + 3 most recent posts. Each shows title (teal, linked) and one-line description (#525252). No dates on the homepage listing.
4. **Divider**
5. **Featured Projects** — Section label + 3 featured projects. Same format as writing: title (teal, linked) + one-line description.
6. **Divider**
7. **Certifications** — Section label + inline list separated by dots: CCNA, Cloud+, CBROPS, ITIL 4, Linux Essentials, A+
8. **Divider**
9. **Footer**

### Blog Post Page (/writing/*)

1. **Date** — Month + year, #525252, above the title
2. **Title** — Georgia serif, 28px
3. **Summary** — One-line description, #737373
4. **Divider**
5. **Body** — System sans, 15px, line-height 1.8. Standard prose styling. Code blocks on #1a1a1a. Inline code in teal.
6. **Table of contents** — Keep Congo's built-in TOC for longer posts. It renders in the right margin on wide screens and collapses on narrow ones. Style it to match: #737373 text, #5eead4 for the active section.
7. **Tags** — At the bottom, understated: bordered pills in #262626 with #525252 text

### Project Page (/projects/*)

1. **Label** — "Project" in #525252
2. **Title** — Georgia serif, 28px
3. **Summary** — One-line description, #737373
4. **Metadata row** — Stack, Integrations, Source (GitHub link in teal). Compact, horizontal.
5. **Divider**
6. **Body** — Same prose styling as blog posts. Projects should use Problem / Approach / Key Decisions structure in their content.
7. **Back link** — "← All Projects" in teal at the bottom

### Writing Index Page (/writing)

- All posts listed chronologically (newest first)
- Each entry: title (teal, linked) + one-line description + date
- No pagination needed at current content volume; add later if needed

### Projects Index Page (/projects)

- All projects listed
- Each entry: title (teal, linked) + one-line description + stack summary
- No grid/cards — same simple list format as writing index

### About Page (/about)

- Brief bio in the same prose style as blog posts
- Can include: background, career change story, homelab overview, link to interactive topology, full cert list with dates, contact info
- Exact content is Skyler's to write; layout follows the same single-column prose format

### Footer

- Left: copyright line
- Right: GitHub, LinkedIn, Instagram as text links in teal
- Same 720px max-width as content

## URL Structure Changes

Current → New:
- `/posts/*` → `/writing/*` (matches new nav label)
- `/docs/projects/*` → `/projects/*` (top-level, not nested under docs)
- `/docs/bio/` → `/about/`
- `/docs/lab/*`, `/docs/guides/*` — keep as-is under docs, or move to a section accessible from about page. These are secondary content.

Hugo aliases should be set up for old URLs to avoid breaking existing links.

## Congo Theme Configuration

- New custom color scheme file replacing `cyberviolet.css`
- `params.toml` updates: new colorScheme name, keep dark mode only
- `menus.en.toml`: replace current nav with Writing, Projects, About
- `languages.en.toml`: update author headline, bio
- `custom.css`: complete rewrite — remove all current brand styles, replace with minimal styles
- `extend-head.html`: remove Bebas Neue and Space Mono font imports, remove AOS library. Keep Fira Code. Keep Open Graph meta tags.

## Out of Scope

- Logo redesign (future project)
- New content writing (existing content migrates as-is)
- Interactive homelab topology page (keep as-is, linked from about page or docs)
- Deployment pipeline changes (stays on Cloudflare Pages)
- SEO optimization beyond URL redirects
- Mobile-specific design beyond basic responsiveness (Congo handles this)
