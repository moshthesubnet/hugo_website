# Job Rejection Response Framework — Blog Post Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a 2,500–3,200 word hybrid research-backed + practical-playbook blog post at `content/blog/job-rejection-response-framework/index.md` targeting IT/networking job seekers who have just received a job rejection.

**Architecture:** Tiered by stage (ATS → early interview → final round), weighted heaviest toward final-round. Personal anecdote from author anchors the intro and Stage 3. Research from 11 peer-reviewed sources is distributed across sections; all citations link to the source URL. Congo `{{< alert >}}` shortcode used for TL;DR box and the 6-item action checklist.

**Tech Stack:** Hugo 0.162.1 Extended, Congo v2.14.0, Markdown, Unsplash (cover + inline images)

## Global Constraints

- Output path: `content/blog/job-rejection-response-framework/index.md`
- Cover image: `content/blog/job-rejection-response-framework/feature.png`
- Hugo front matter follows Congo conventions exactly (see Task 1 for full template)
- Post stays `draft: true` until Task 8 explicitly sets it to `false`
- The hospital organization is never named — always "a large regional hospital organization"
- No fabricated personal details — the conclusion's outcome sentence requires author input (see Task 7 blocker)
- All research citations must link to the actual source URL from the research brief
- Word count target: 2,500–3,200 words (measure with `wc -w` before publishing)
- Congo shortcodes: `{{< alert >}}` for callout boxes — do not use raw HTML

---

## File Map

| File | Action | Purpose |
| --- | --- | --- |
| `content/blog/job-rejection-response-framework/index.md` | Create | The post itself |
| `content/blog/job-rejection-response-framework/feature.png` | Create | Cover image (downloaded from Unsplash) |

---

### Task 1: Scaffold post file with front matter

**Files:**

- Create: `content/blog/job-rejection-response-framework/index.md`

- [ ] **Step 1: Create the post directory and file**

```bash
mkdir -p ~/website/content/blog/job-rejection-response-framework
```

- [ ] **Step 2: Write the front matter and author line**

Write the following to `content/blog/job-rejection-response-framework/index.md`:

```markdown
---
title: "The Further You Get, The More It Stings: How to Respond to Job Rejection at Every Stage"
date: 2026-06-26
lastmod: 2026-06-26
draft: true
description: "From ATS filters to final-round losses, here's what peer-reviewed research actually says to do after a job rejection — and why the next 72 hours matter most."
summary: "A resume rejection stings. A final-round rejection after you thought you nailed it is a different category of pain. Here's what 11 peer-reviewed studies say to do at each stage — and why the next 72 hours determine whether this rejection helps or hurts your next attempt."
coverAlt: "Professional reviewing documents at a desk with a laptop and coffee"
tags:
  - career
  - job-search
  - networking
  - hiring
  - IT-career
images: ["/blog/job-rejection-response-framework/feature.png"]
---

*By [Skyler King](/docs/bio/) — CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*
```

- [ ] **Step 3: Verify Hugo renders the draft without errors**

```bash
cd ~/website && hugo server -D 2>&1 | head -20
```

Expected: Server starts, no build errors. Navigate to `http://localhost:1313/blog/job-rejection-response-framework/` and confirm the page loads (will be nearly empty — that's fine).

- [ ] **Step 4: Commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/ && git commit -m "feat: scaffold job rejection post with front matter"
```

---

### Task 2: Source and download cover image

**Files:**

- Create: `content/blog/job-rejection-response-framework/feature.png`

- [ ] **Step 1: Find a suitable Unsplash image**

Search Unsplash for a professional/office/job-search image. Good search terms: "job interview", "professional desk", "office laptop". The image should be neutral and professional — no rejection-specific imagery (no red X, no sad faces). Landscape orientation, minimum 1200×630px.

Candidate URLs to check (pick the best fit):

- `https://unsplash.com/photos/person-using-laptop-on-white-table-KdeqA3aTnBY` — laptop on desk, clean
- `https://unsplash.com/photos/macbook-pro-on-brown-wooden-table-ZVprbBmT8QA` — professional setup
- Search: `https://unsplash.com/s/photos/job-interview?orientation=landscape`

- [ ] **Step 2: Download image as feature.png**

After selecting the image, download the full-size version and save it as:

```
content/blog/job-rejection-response-framework/feature.png
```

If using curl, get the direct download URL from the Unsplash photo page (click "Download free" → right-click → copy image URL):

```bash
curl -L "PASTE_DIRECT_IMAGE_URL_HERE" -o ~/website/content/blog/job-rejection-response-framework/feature.png
```

- [ ] **Step 3: Verify image renders in Hugo**

```bash
cd ~/website && hugo server -D 2>&1 | grep -i error
```

Expected: No errors. Navigate to the post page and confirm the cover image appears.

- [ ] **Step 4: Commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/feature.png && git commit -m "feat: add cover image for job rejection post"
```

---

### Task 3: Write Introduction and H2 1

**Files:**

- Modify: `content/blog/job-rejection-response-framework/index.md`

**Target word count for this task:** ~540 words (Introduction ~220 + H2 1 ~320)

**Use the blog-writer agent** with the following brief:

> Write the Introduction and first H2 section for a blog post titled "The Further You Get, The More It Stings: How to Respond to Job Rejection at Every Stage."
>
> **Voice/tone:** Confident, first-person, professional with personality. No hedging. This is a portfolio-quality writeup for moshthesubnet.com.
>
> **Introduction (~220 words):**
> Open in media res with this personal story: the author applied to a large regional hospital organization for an associate IT role. He had combined healthcare and IT experience he expected to be a real differentiator. Walked out of the final interview feeling like he'd answered everything well. The rejection came two weeks later. Use those specific details — don't generalize them. Then name the specific emotional experience: the sting of thinking you were the right fit. Pivot to: what you do in the next 72 hours is what actually determines whether this rejection helps or hurts your next attempt. Promise the reader the post covers what the data says to do at each stage, from ATS rejections to final-round losses.
>
> Close the intro with this Congo shortcode TL;DR box:
> ```
> {{< alert >}}
> **TL;DR:** Job rejection hurts more the further you get — and that's documented in the research. The difference between rejection that informs your next attempt and rejection that derails it is almost entirely in your response within the first 72 hours. This post covers what to do at each stage: resume/ATS, early interview, and final round.
> {{< /alert >}}
> ```
>
> **H2: Why Job Rejection in IT Hits Different (~320 words):**
> Cover three IT-specific dynamics that amplify rejection pain:
> 1. **Volume + ATS invisibility** — most resumes are filtered before a human sees them; rejection at scale erodes self-efficacy even when it's algorithmic. Reference that ATS filters affect the majority of applications at large organizations.
> 2. **The expectation gap** — IT job seekers who bring rare skill combinations (healthcare + IT, cloud + security, netdevops) often feel rejection as "the market is broken" rather than "something specific needs to change." The author's own case — healthcare + IT background — is the example.
> 3. **Professional rejection sensitivity** — the 2025 Springer *Current Psychology* study found this is a measurable dispositional trait that compounds career damage if not actively managed. Cite as: ([Springer, 2025](https://link.springer.com/article/10.1007/s12144-025-08609-x))
>
> Close with the transition: the research distinguishes between rejection that *informs* and rejection that *derails*. The difference is almost entirely in the response. That's what the rest of this post is about.
>
> Also cite: PMC qualitative study (2022) on the "cycle of hope and disappointment" finding: ([PMC, 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9797253/))

- [ ] **Step 1: Dispatch blog-writer agent with the brief above**

- [ ] **Step 2: Append the returned content to the post file after the author line**

- [ ] **Step 3: Verify word count is in range**

```bash
wc -w ~/website/content/blog/job-rejection-response-framework/index.md
```

Expected: 550–600 words (front matter + author line + intro + H2 1).

- [ ] **Step 4: Verify Hugo builds clean**

```bash
cd ~/website && hugo server -D 2>&1 | grep -i error
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/index.md && git commit -m "feat: write intro and H2 1 (why IT rejection hits different)"
```

---

### Task 4: Write H2 2 — Stage 1: Resume/ATS Rejection

**Files:**

- Modify: `content/blog/job-rejection-response-framework/index.md`

**Target word count for this task:** ~420 words

**Use the blog-writer agent** with the following brief:

> Write the second H2 section for the job rejection blog post. Append to existing content.
>
> **H2: Stage 1 — The Resume/ATS Rejection (~420 words)**
>
> Structure: "what makes this stage unique" → "what the research says" → "what to do."
>
> **What makes this stage unique:** Low emotional investment per rejection, but volume accumulates fast. The real danger isn't one rejection — it's the accumulation eroding self-efficacy before you ever get in a room. Name the ATS reality: rejection at this stage is often a keyword or formatting mismatch, not a judgment on your skills. This distinction matters.
>
> **What the research says:** Cite these two studies inline:
> - PMC rejection letter study (2019, n=138): response timing matters most — fast rejections preserve reapplication intent and signal organizational respect; slow or silent rejection is what actually damages candidate perception. ([PMC, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6826967/))
> - Feedback-seeking meta-analysis (Cambridge Core, 13 longitudinal studies, n=1,527): treating rejection as data rather than verdict predicts better outcomes at all stages. ([Cambridge Core](https://www.cambridge.org/core/journals/spanish-journal-of-psychology/article/abs/feedbackseeking-behavior-in-organizations-a-metaanalysis-and-systematical-review-of-longitudinal-studies/6FFDC8E5984077B6AD8C5BF8292A0A63))
>
> **What to do (4 concrete actions, numbered list):**
> 1. Don't personalize it — audit your resume against the job description as a technical problem, not a self-evaluation. You're debugging a keyword mismatch, not re-examining your worth.
> 2. Identify one specific gap (keyword, format, experience framing) and fix it before the next application. One change per rejection keeps improvements concrete.
> 3. If you have any network connection to the company, a warm introduction beats a cold reapplication every time.
> 4. Log it — one line in a spreadsheet or note: what you applied for, what you changed, what you'll try next. Patterns only appear when you track them.

- [ ] **Step 1: Dispatch blog-writer agent with the brief above**

- [ ] **Step 2: Append the returned content to the post file**

- [ ] **Step 3: Verify cumulative word count**

```bash
wc -w ~/website/content/blog/job-rejection-response-framework/index.md
```

Expected: ~950–1,050 words total.

- [ ] **Step 4: Verify Hugo builds clean**

```bash
cd ~/website && hugo server -D 2>&1 | grep -i error
```

- [ ] **Step 5: Commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/index.md && git commit -m "feat: write H2 2 (stage 1 — resume/ATS rejection)"
```

---

### Task 5: Write H2 3 — Stage 2: Early Interview Rejection

**Files:**

- Modify: `content/blog/job-rejection-response-framework/index.md`

**Target word count for this task:** ~430 words

**Use the blog-writer agent** with the following brief:

> Write the third H2 section for the job rejection blog post. Append to existing content.
>
> **H2: Stage 2 — The Early Interview Rejection (~430 words)**
>
> Structure: "what makes this stage unique" → "what the research says" → "what to do."
>
> **What makes this stage unique:** You've been seen now. Rejection here feels personal in a way ATS filtering doesn't — there was a human on the other side. This is where rejection sensitivity starts functioning as a career liability: people with high rejection sensitivity avoid seeking feedback, which breaks the improvement loop entirely. Name this dynamic explicitly — it's the trap this section is designed to help the reader avoid.
>
> **What the research says:** Cite these three studies:
> - Feedback-seeking behavior meta-analysis (Cambridge Core, 13 longitudinal studies, n=1,527): actively seeking feedback after rejection predicts measurably improved future performance. ([Cambridge Core](https://www.cambridge.org/core/journals/spanish-journal-of-psychology/article/abs/feedbackseeking-behavior-in-organizations-a-metaanalysis-and-systematical-review-of-longitudinal-studies/6FFDC8E5984077B6AD8C5BF8292A0A63))
> - MDPI rejection sensitivity study: high rejection sensitivity → avoid feedback → no calibration → repeat the same mistakes. A self-defeating cycle. ([MDPI](https://www.mdpi.com/2813-9844/8/1/5))
> - JOBS program RCT (Vinokur et al., 1995, n=1,122): participants who anticipated rejection and pre-planned their response had significantly higher reemployment rates and lower depression rates two years later. The 24-48 hour buffer isn't a sign of weakness — it's the strategy that works. ([DOL CLEAR](https://clear.dol.gov/Study/Jobs-I-Preventive-Intervention-Unemployed-Individuals-Short-and-long-term-effects))
>
> **What to do (4 concrete actions, numbered list):**
> 1. Wait 24–48 hours before responding to anything or making any decisions. This is the single most evidence-backed step in the entire post.
> 2. Send a gracious, brief reply thanking the interviewer. Keep the relationship alive — 15% of rejected candidates get hired by the same company within 12 months.
> 3. Request specific, actionable feedback. Frame it as wanting to improve, not as challenging the decision. "I'd appreciate any feedback on where I fell short relative to what you were looking for" is a clean framing.
> 4. Extract one specific lesson in writing before submitting your next application. Not a feeling — a fact. "My answer to the behavioral question about conflict resolution was vague. Next time, use the STAR format."

- [ ] **Step 1: Dispatch blog-writer agent with the brief above**

- [ ] **Step 2: Append the returned content to the post file**

- [ ] **Step 3: Verify cumulative word count**

```bash
wc -w ~/website/content/blog/job-rejection-response-framework/index.md
```

Expected: ~1,380–1,500 words total.

- [ ] **Step 4: Verify Hugo builds clean**

```bash
cd ~/website && hugo server -D 2>&1 | grep -i error
```

- [ ] **Step 5: Commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/index.md && git commit -m "feat: write H2 3 (stage 2 — early interview rejection)"
```

---

### Task 6: Write H2 4 — Stage 3: Final Round Rejection

**Files:**

- Modify: `content/blog/job-rejection-response-framework/index.md`

**Target word count for this task:** ~540 words

**⚠️ AUTHOR INPUT REQUIRED before writing the conclusion in Task 7:** The conclusion needs one honest sentence from Skyler about what actually happened after the hospital organization rejection (e.g., did he receive feedback? is he considering reapplying? did the follow-up process help?). Get this before starting Task 7 — do not fabricate or generalize.

**Use the blog-writer agent** with the following brief:

> Write the fourth H2 section for the job rejection blog post. This is the heaviest section — the personal story lives here in full.
>
> **H2: Stage 3 — The Final Round Rejection (The One That Really Stings) (~540 words)**
>
> Structure: open with personal story → "what makes this stage unique" → "what the research says" → "what to do."
>
> **Open with the personal story:** The author applied to a large regional hospital organization for an associate IT role. He had combined healthcare and IT experience — the kind of background you don't see very often in IT candidates, and exactly what a healthcare organization should want. He walked out of the final interview feeling like he'd answered everything well. The rejection came two weeks later. Use this story to anchor the section — it's the concrete example of what makes Stage 3 different.
>
> **What makes this stage unique:** Highest emotional stakes. Multiple rounds of investment. The expectation gap is at its widest — when you had genuine reason to believe you were the right fit, rejection hits differently than when you were a long shot. This is the stage where the research finds the most severe psychological consequences if the response isn't deliberate.
>
> **What the research says (most citations of any section):**
> - PMC qualitative study (2022): final-round rejection triggers a "constant cycle of hope and disappointment" that measurably decreases self-worth and confidence in future job search ability if not actively countered. ([PMC, 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9797253/))
> - Frontiers in Psychology scoping review (2025, 22 studies): cognitive reappraisal — reframing *how you think about* the rejection — is positively associated with continued job search behavior. Expressive suppression — bottling the emotion — is negatively associated. The move is not to stop feeling it. It's to reframe it. ([Frontiers, 2025](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1596847/full))
> - Cambridge Core (2025) + Wiley IJSA (2007): procedural fairness moderates outcomes. If the process felt fair — you were treated with respect, given timely communication, a real chance to perform — the loss is more tolerable and less likely to produce self-limiting beliefs. ([Cambridge Core, 2025](https://www.cambridge.org/core/journals/journal-of-management-and-organization/article/candidates-reactions-to-job-application-rejections-at-different-phases-of-the-recruitment-process/19E355C9402182D3AABE524EDBD8582C)) ([Wiley IJSA, 2007](https://onlinelibrary.wiley.com/doi/10.1111/j.1468-2389.2007.00397.x))
> - Springer *Current Psychology* (2025): people with high professional rejection sensitivity at this stage are most likely to internalize "I'm not good enough for roles like this." Naming the mechanism — knowing that this is a documented, measurable tendency, not an objective truth — is itself protective. ([Springer, 2025](https://link.springer.com/article/10.1007/s12144-025-08609-x))
>
> **What to do (5 concrete actions, numbered list):**
> 1. Full 48-hour buffer. No responses, no new applications, no rumination loops. The JOBS program RCT found this buffer is correlated with better two-year outcomes — treat it as protected time.
> 2. Send a gracious follow-up within 48–72 hours. Keep the door open for reapplication or referral. The 15% rehire stat from Stage 2 applies here too — and it's even more relevant when you made it to the final round.
> 3. Request feedback framed around the role's specific requirements. Not "why didn't I get it?" but "what would have made my candidacy stronger for this specific role?" More targeted than early-round requests.
> 4. Connect with the hiring manager or interviewers on LinkedIn as a professional peer, not a rejected candidate. Research from a daily diary study of 160 professionals found that networking after a setback produces immediate mood improvement through positive affect — it works even when it feels counterintuitive. ([PMC, daily diary study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6243093/))
> 5. Structured reflection: write down one thing you'd do differently and one thing you did well. Growth mindset research shows the lesson only sticks when it's extracted in writing, not just felt. One paragraph, done.

- [ ] **Step 1: Dispatch blog-writer agent with the brief above**

- [ ] **Step 2: Append the returned content to the post file**

- [ ] **Step 3: Verify cumulative word count**

```bash
wc -w ~/website/content/blog/job-rejection-response-framework/index.md
```

Expected: ~1,920–2,060 words total.

- [ ] **Step 4: Verify Hugo builds clean**

```bash
cd ~/website && hugo server -D 2>&1 | grep -i error
```

- [ ] **Step 5: Commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/index.md && git commit -m "feat: write H2 4 (stage 3 — final round rejection)"
```

---

### Task 7: Write H2 5 (Reappraisal Framework) and Conclusion

**Files:**

- Modify: `content/blog/job-rejection-response-framework/index.md`

**Target word count for this task:** ~580 words (H2 5 ~430 + Conclusion ~150)

**⚠️ BLOCKER:** Before writing the conclusion, confirm with Skyler: what actually happened after the hospital organization rejection? (Did you receive feedback? Are you considering reapplying? Did sending the follow-up help?) One honest sentence is all that's needed. Do not proceed with the conclusion until you have this. Do not fabricate.

**Use the blog-writer agent** with the following brief:

> Write the final two sections for the job rejection blog post.
>
> **H2: The Reappraisal Framework — Rejection as Calibration (~430 words)**
>
> This section pulls everything together into a unified model. Core argument: rejection is a calibration event, not a verdict — but only if you process it deliberately. The research shows the window for doing this is 24–72 hours; after that, avoidance and suppression take over and the potential learning is lost.
>
> Present the 6-step action checklist inside a Congo alert box:
>
> ```
> {{< alert >}}
> **The 72-Hour Framework**
>
> 1. **Take the buffer** (24–48 hrs minimum) — no responses, no decisions, no loops
> 2. **Send the gracious reply** — keep the relationship intact
> 3. **Request specific, actionable feedback** — frame it as improvement, not challenge
> 4. **Make one network contact** — weak tie preferred (someone you know loosely in the field, not your closest friends)
> 5. **Extract one lesson in writing** — a fact, not a feeling
> 6. **Apply that lesson to your next application before sending it**
> {{< /alert >}}
>
> ```
>
> Explain the weak tie recommendation: NBER research on social networks and labor market outcomes shows that weak ties — people you know loosely across different circles — outperform strong ties for new job opportunities because they provide access to non-redundant information. Your close friends already know the same jobs you do. ([NBER](https://www.nber.org/system/files/working_papers/w18786/w18786.pdf))
>
> Close with the JOBS program RCT two-year follow-up as the closing argument: participants who pre-planned their rejection response had higher reemployment rates, higher income, and lower rates of depression two years later. ([PubMed](https://pubmed.ncbi.nlm.nih.gov/10658883/)) The framework isn't about feeling better in the moment. It's about compounding better outcomes over time.
>
> **Conclusion (~150 words):**
>
> Close the loop on the personal story — briefly, without melodrama. [AUTHOR WILL PROVIDE: one honest sentence about what actually happened after the hospital organization rejection.] Then invite the reader: if this framework helped, share it with someone in your network who's in the middle of a job search right now. That's it — no long summary, no recap.

- [ ] **Step 1: Get Skyler's input on the conclusion outcome sentence before dispatching the agent**

- [ ] **Step 2: Dispatch blog-writer agent with the brief above (including the author-provided outcome sentence)**

- [ ] **Step 3: Append the returned content to the post file**

- [ ] **Step 4: Verify cumulative word count hits target range**

```bash
wc -w ~/website/content/blog/job-rejection-response-framework/index.md
```

Expected: 2,500–3,200 words total. If under 2,500, ask the blog-writer agent to expand the thinnest section. If over 3,200, trim the Framework section first.

- [ ] **Step 5: Verify Hugo builds clean**

```bash
cd ~/website && hugo server -D 2>&1 | grep -i error
```

- [ ] **Step 6: Commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/index.md && git commit -m "feat: write H2 5 (reappraisal framework) and conclusion"
```

---

### Task 8: QA, SEO check, and publish

**Files:**

- Modify: `content/blog/job-rejection-response-framework/index.md`

- [ ] **Step 1: Run blog-reviewer agent**

Dispatch the blog-reviewer agent against the completed post. It will score the post across 5 categories (100-point system), flag AI-detectable phrases, and identify issues by severity. Fix any HIGH severity issues before proceeding.

- [ ] **Step 2: Run blog-seo agent**

Dispatch the blog-seo agent to validate on-page SEO. It will check: title tag, meta description, heading hierarchy, internal/external links, canonical URL, OG meta tags. Fix any FAIL items.

- [ ] **Step 3: Manually verify all citation links resolve**

Check each of these links opens and loads the correct study:

```
https://link.springer.com/article/10.1007/s12144-025-08609-x
https://pmc.ncbi.nlm.nih.gov/articles/PMC9797253/
https://pmc.ncbi.nlm.nih.gov/articles/PMC6826967/
https://www.cambridge.org/core/journals/spanish-journal-of-psychology/article/abs/feedbackseeking-behavior-in-organizations-a-metaanalysis-and-systematical-review-of-longitudinal-studies/6FFDC8E5984077B6AD8C5BF8292A0A63
https://www.mdpi.com/2813-9844/8/1/5
https://clear.dol.gov/Study/Jobs-I-Preventive-Intervention-Unemployed-Individuals-Short-and-long-term-effects
https://pubmed.ncbi.nlm.nih.gov/10658883/
https://www.cambridge.org/core/journals/journal-of-management-and-organization/article/candidates-reactions-to-job-application-rejections-at-different-phases-of-the-recruitment-process/19E355C9402182D3AABE524EDBD8582C
https://onlinelibrary.wiley.com/doi/10.1111/j.1468-2389.2007.00397.x
https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1596847/full
https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6243093/
https://www.nber.org/system/files/working_papers/w18786/w18786.pdf
```

For any broken link: find the correct URL for the same source and update it in the post.

- [ ] **Step 4: Set draft to false**

In `content/blog/job-rejection-response-framework/index.md`, change:

```yaml
draft: true
```

to:

```yaml
draft: false
```

- [ ] **Step 5: Run production build and confirm no errors**

```bash
cd ~/website && hugo --minify 2>&1 | tail -5
```

Expected: `Total in X ms` with no ERROR lines.

- [ ] **Step 6: Final commit**

```bash
cd ~/website && git add content/blog/job-rejection-response-framework/index.md && git commit -m "feat: publish job rejection response framework post"
```
