---
title: "Fix Immich 2.6 Postgres Upgrade Failure on TrueNAS"
aliases: ["/posts/truenas-immich-postgres-fix/"]
date: 2026-03-20
lastmod: 2026-03-20
draft: false
description: "Immich 2.6 dropped PG15 binaries from pgvecto, breaking every TrueNAS install on Postgres 15. Recover 17,512+ assets with this pg_dump → pg_restore fix."
summary: "Immich 2.6.x dropped PG15 binaries from pgvecto, which is an instant brick on every TrueNAS install still running Postgres 15. Your data is untouched. Here's the pg_dump → pg_restore path out, including the rename trap that costs you an hour."
coverImage: "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=1200&h=630&fit=crop&q=80&fm=webp"
coverImageAlt: "Multiple hard drive disks from a network attached storage array representing database storage and data recovery"
tags:
  - immich
  - truenas
  - postgres
  - homelab
  - self-hosted
  - docker
  - database
  - incident-response
images: ["/blog/truenas-immich-postgres-fix/feature.png"]
---

*By [Skyler King](/docs/bio/) (CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.)*

Immich 2.6.0 dropped on March 20, 2026, and immediately broke every TrueNAS Community Edition install still running Postgres 15. No warning. No graceful fallback. The app update fires, the pgvecto upgrade container starts, and then stopped. Nothing. The Immich server never comes back up.

The failure is specific: the new pgvecto image ships without the Postgres 15 binaries that `pg_upgrade` needs for an in-place major version migration. Your photos, albums, and metadata are completely intact. The problem is that the upgrade can't run, and until it does, Immich won't start.

This post covers exactly what broke, the one mistake that costs an extra hour during recovery, and a tested step-by-step fix using `pg_dump` and `pg_restore`. Every command below was run against a live 17,512-asset library on March 20, 2026.

{{< alert >}}
**TL;DR:** Immich 2.6 forces a mandatory Postgres 15 → 18 upgrade, but the new pgvecto image dropped the PG15 binaries `pg_upgrade` needs. Your data is safe: the migration fails before touching anything. Fix: spin up a temp PG15 container, `pg_dump`, move the PG15 dir *completely out* of the `pgData` mount (renaming inside it doesn't work), let Immich initialize fresh PG18, then `pg_restore`.
{{< /alert >}}

{{< figure
  src="https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=1200&h=630&fit=crop&q=80&fm=webp"
  alt="Multiple hard drive disks from a network attached storage array, the kind of storage Immich depends on in a TrueNAS homelab"
>}}

## What Caused the Immich 2.6 Update to Break on TrueNAS?

Immich runs on **41.2% of all self-hosted homelab setups** (fourth overall in the 2024 Self-Hosted Survey, n=2,181, behind only Home Assistant, Sonarr, and Jellyfin) ([Self-Hosted Survey 2024](https://selfhosted-survey-2024.deployn.de/)). That adoption makes this a widespread incident, not a niche edge case. The 2.6.x release enforced a mandatory Postgres major version upgrade from 15 to 18, a change that had been building for months while a prior bug was silently letting installations skip it.

The root cause is in the container image. The new `pgvecto` image (which manages Postgres extensions and handles database version migrations) no longer ships the Postgres 15 binaries at `/usr/lib/postgresql/15/bin`. When Immich starts an upgrade, the `pgvecto_upgrade` init container fires, looks for those binaries to run `pg_upgrade`, and fails immediately:

```
[ix-postgres-upgrade]   - [2026-03-20 10:38:43] - Starting upgrade from PostgreSQL [15] to [18]
[ix-postgres-upgrade]   - [2026-03-20 10:38:43] - ERROR: Old PostgreSQL [15] binaries not found at [/usr/lib/postgresql/15/bin]
[ix-postgres-main]      - [2026-03-20 10:38:43] - ERROR: Upgrade failed
```

The critical thing: **the upgrade fails before it modifies any data.** Your Postgres 15 data directory is sitting there untouched. The Immich server container and everything downstream simply never get to start. They depend on `pgvecto_upgrade` completing cleanly, and it never does.

<!-- [PERSONAL EXPERIENCE] -->
What this looks like in the TrueNAS Apps UI: Immich shows as failed. The app lifecycle log shows the pgvecto container pulling successfully (images already cached from a previous pull), then `pgvecto_upgrade` starting and exiting code 1 in under a second. Nothing after that. The main Immich server container doesn't even attempt to start.

> **First-hand summary for anyone linking directly to this section:** Immich 2.6.x enforces a mandatory Postgres 15-to-18 major version upgrade on TrueNAS Community Edition installs. The new pgvecto container image ships without PG15 binaries, causing `pg_upgrade` to exit code 1 before modifying any data. A `pg_dump` → `pg_restore` procedure recovered all 17,512 assets from an 87MB backup in under 30 minutes, with face tags, albums, and shared links intact. ([truenas/apps issue #4628](https://github.com/truenas/apps/issues/4628))

<figure>
  <svg viewBox="0 0 560 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Area line chart showing Immich GitHub star growth from 2,000 in 2022 to 95,300 stars in March 2026" style="width:100%;max-width:560px;background:transparent;overflow:visible">
    <title>Immich GitHub Star Growth (2022–March 2026)</title>
    <!-- Grid lines -->
    <g stroke="rgba(148,163,184,0.18)" stroke-width="1">
      <line x1="60" y1="270" x2="540" y2="270"/>
      <line x1="60" y1="212" x2="540" y2="212"/>
      <line x1="60" y1="155" x2="540" y2="155"/>
      <line x1="60" y1="97" x2="540" y2="97"/>
      <line x1="60" y1="40" x2="540" y2="40"/>
    </g>
    <!-- Y-axis labels -->
    <g fill="#94a3b8" font-size="11" text-anchor="end" font-family="system-ui,sans-serif">
      <text x="52" y="274">0</text>
      <text x="52" y="216">25K</text>
      <text x="52" y="159">50K</text>
      <text x="52" y="101">75K</text>
      <text x="52" y="44">100K</text>
    </g>
    <!-- Area fill -->
    <polygon
      points="60,265 156,229 252,178 348,144 444,70 540,51 540,270 60,270"
      fill="rgba(94,234,212,0.08)"
      stroke="none"/>
    <!-- Line -->
    <polyline
      points="60,265 156,229 252,178 348,144 444,70 540,51"
      fill="none"
      stroke="#5eead4"
      stroke-width="2.5"
      stroke-linejoin="round"
      stroke-linecap="round"/>
    <!-- Data points -->
    <g fill="#5eead4">
      <circle cx="60" cy="265" r="4"/>
      <circle cx="156" cy="229" r="4"/>
      <circle cx="252" cy="178" r="4"/>
      <circle cx="348" cy="144" r="4"/>
      <circle cx="444" cy="70" r="4"/>
      <circle cx="540" cy="51" r="5" stroke="white" stroke-width="2"/>
    </g>
    <!-- Start and end labels -->
    <text x="68" y="255" fill="#94a3b8" font-size="10" font-family="system-ui,sans-serif">2K</text>
    <text x="513" y="41" fill="#5eead4" font-size="11" font-weight="600" font-family="system-ui,sans-serif">95.3K ★</text>
    <!-- v2.6.x annotation -->
    <line x1="540" y1="51" x2="521" y2="26" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>
    <text x="519" y="22" fill="#f59e0b" font-size="10" font-family="system-ui,sans-serif" text-anchor="end">v2.6.x (Mar 2026)</text>
    <!-- X-axis labels -->
    <g fill="#94a3b8" font-size="11" text-anchor="middle" font-family="system-ui,sans-serif">
      <text x="60" y="290">2022</text>
      <text x="156" y="290">2023</text>
      <text x="252" y="290">2024</text>
      <text x="348" y="290">Jan '25</text>
      <text x="444" y="290">Dec '25</text>
      <text x="540" y="290">Mar '26</text>
    </g>
    <!-- Title -->
    <text x="300" y="18" fill="#e2e8f0" font-size="13" font-weight="600" text-anchor="middle" font-family="system-ui,sans-serif">Immich GitHub Stars (2022–Mar 2026)</text>
  </svg>
  <figcaption style="font-size:0.8rem;color:#737373;text-align:center;margin-top:0.5rem">Source: <a href="https://github.com/immich-app/immich">github.com/immich-app/immich</a> (live, March 2026); <a href="https://immich.app/blog/2025-year-in-review">Immich 2025 Year in Review</a></figcaption>
</figure>

## The Rename Trap: Why 15.bak Inside pgData Still Fails

<!-- [UNIQUE INSIGHT] -->
Here's the mistake that costs an hour. The obvious first move is renaming the PG15 data directory (`mv 15 15.bak`) so Immich initializes a fresh PG18 database on the next start. It looks like it should work. It doesn't.

The `pgvecto_upgrade` container mounts the **entire `pgData` directory** and scans everything inside it. It doesn't check directory names. It looks for PostgreSQL data files at any path under the mount point. When it finds `15.bak/docker/` and sees PG15 data files, it tries the upgrade again. Same error. Same failure.

Here's the log, captured live on the second failed start after the rename:

```
[ix-postgres-main]      - Checking directory [/var/lib/postgresql/15.bak/docker]
[ix-postgres-main]      -   - Found database: PostgreSQL [15]
[ix-postgres-main]      - Using highest version found: PostgreSQL [15] at [/var/lib/postgresql/15.bak/docker]
[ix-postgres-upgrade]   - Starting upgrade from PostgreSQL [15] to [18]
[ix-postgres-upgrade]   - ERROR: Old PostgreSQL [15] binaries not found at [/usr/lib/postgresql/15/bin]
[ix-postgres-main]      - ERROR: Upgrade failed
```

The `.bak` suffix is completely invisible to the upgrade script. The only way to make it initialize fresh PG18 is to move the PG15 directory **outside the `pgData` mount point entirely**: don't rename it within `pgData` or suffix it. Move it one full level up.

{{< figure
  src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=630&fit=crop&q=80&fm=webp"
  alt="Dark monitor displaying terminal command output with colorful syntax highlighting, in the environment where this entire fix runs"
>}}

## How to Fix It: Complete pg_dump → pg_restore Recovery

<!-- [ORIGINAL DATA] -->
These steps were run live on a TrueNAS Community Edition system on March 20, 2026. The Immich library had 17,512 assets. The database dump was 87MB. Total time from snapshot to verified restore: under 30 minutes.

{{< alert "warning" >}}
**Before any command: take a ZFS snapshot.** In the TrueNAS UI, go to **Datasets → [your immich dataset] → Add Snapshot**. Snapshot the parent dataset recursively. This catches both your `pgData` and photo library in one shot. Two clicks. Don't skip it.
{{< /alert >}}

### Step 1: Find your pgData host path

```bash
sudo docker inspect ix-immich-pgvecto_upgrade-1 2>/dev/null \
  | grep -A3 '"Mounts"' | grep '"Source"'
```

This returns the host path for your Postgres data volume, something like `/mnt/YOURPOOL/immich/pgData`. Every command below uses this path, so write it down.

### Step 2: Confirm the directory structure

```bash
sudo ls /mnt/YOURPOOL/immich/pgData/
# Expected: 15  (plus possibly a legacy data/ dir)

sudo ls /mnt/YOURPOOL/immich/pgData/15/
# Expected: docker
```

You're looking for `15/docker/`. That's the exact subdirectory you'll mount in Step 3.

### Step 3: Start a temporary PG15 container

Replace `/mnt/YOURPOOL/immich/pgData` with your actual path from Step 1:

```bash
sudo docker run --rm -d \
  --name immich-pg15-temp \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -e POSTGRES_USER=immich \
  -e POSTGRES_DB=immich \
  -v /mnt/YOURPOOL/immich/pgData/15/docker:/var/lib/postgresql/data \
  ghcr.io/immich-app/postgres:15-vectorchord0.4.3-pgvectors0.2.0
```

`POSTGRES_HOST_AUTH_METHOD=trust` skips password auth for local connections. It's fine for a short-lived container that isn't exposed outside the host. Wait about 10 seconds, then verify it started cleanly:

```bash
sudo docker logs immich-pg15-temp 2>&1 | tail -5
```

You want to see `database system is ready to accept connections` in the output before proceeding.

### Step 4: Dump the database

```bash
sudo docker exec immich-pg15-temp \
  pg_dump -U immich -d immich -Fc \
  -f /var/lib/postgresql/data/immich_backup.dump
```

This runs silently. When it returns to the prompt, verify the dump file landed on the host:

```bash
sudo ls -lh /mnt/YOURPOOL/immich/pgData/15/docker/immich_backup.dump
```

You want a non-zero file size. The 87MB result from this incident is a reasonable reference for a moderately sized library.

### Step 5: Stop the temp container

```bash
sudo docker stop immich-pg15-temp
```

### Step 6: Move the PG15 dir out of pgData, not just rename it

```bash
sudo mv /mnt/YOURPOOL/immich/pgData/15 /mnt/YOURPOOL/immich/15.bak
```

Note the destination: `/mnt/YOURPOOL/immich/15.bak`, one directory **above** `pgData`, not inside it. Your dump file is safe at `/mnt/YOURPOOL/immich/15.bak/docker/immich_backup.dump`. Nothing is deleted.

Verify `pgData` is now clear:

```bash
sudo ls /mnt/YOURPOOL/immich/pgData/
# Should show: data   (or be empty, either is fine)
```

### Step 7: Start Immich from the TrueNAS UI

Go to **Apps → Immich → Start**. With no Postgres 15 data visible under `pgData`, the pgvecto container initializes a fresh PG18 database. Wait until the app shows Running before continuing.

### Step 8: Restore and verify

Copy the dump file somewhere the running PG18 container can access, then restore:

```bash
sudo cp /mnt/YOURPOOL/immich/15.bak/docker/immich_backup.dump /tmp/

sudo docker cp /tmp/immich_backup.dump ix-immich-pgvecto-1:/tmp/

sudo docker exec ix-immich-pgvecto-1 pg_restore \
  -U immich -d immich --clean --if-exists \
  /tmp/immich_backup.dump
```

A successful restore returns to the prompt with no output. Verify your data is back:

```bash
sudo docker exec ix-immich-pgvecto-1 \
  psql -U immich -d immich -c "SELECT COUNT(*) FROM asset;"
```

The table is `asset` (singular), not `assets`. If the count matches your library, open Immich in the browser and check photos, albums, face assignments, and shared links. Once everything looks right, clean up the backup:

```bash
sudo rm -rf /mnt/YOURPOOL/immich/15.bak
```

Hold off on that until you've confirmed the UI looks correct. Keep the ZFS snapshot around for a few more days.

## What If You Already Deleted pgData?

{{< figure
  src="https://images.unsplash.com/photo-1591405351990-4726e331f141?w=1200&h=630&fit=crop&q=80&fm=webp"
  alt="Close-up of a silver hard disk drive platter. A reminder that physical data recovery is far harder than a ZFS rollback taken before the incident"
>}}

If you deleted the `pgData` directory before dumping, your Postgres data is gone. Albums, face assignments, people groupings, shared links, memory albums. All of that lived in the database.

Your actual photo files almost certainly live on a separate dataset and should be intact. The path forward from here:

1. Start Immich fresh, which initializes a clean empty database
2. In the Immich UI, go to **Administration → Jobs → Library Scan** to re-import your photos
3. Face assignments and albums will need to be rebuilt manually

If you took a ZFS snapshot before the update, you can roll back. In TrueNAS: **Datasets → [dataset] → Snapshots → [snapshot name] → Rollback**. The snapshot is the fastest path to a full recovery. This is exactly why that step isn't optional.

## How to Prevent This on the Next TrueNAS App Update

**97% of self-hosters use containerization** for their homelab apps. Docker Compose accounts for 83.2% of setups alone ([Self-Hosted Survey 2024](https://selfhosted-survey-2024.deployn.de/)). Container-based app updates are fast and convenient, but they can silently package breaking infrastructure changes. A Postgres major version jump isn't obvious from a UI that just says "Update available."

In my experience maintaining TrueNAS app deployments, three habits make the difference between a planned migration and an incident recovery:

**First: snapshot before every app update.** TrueNAS makes it two clicks. The Datasets panel has "Add Snapshot" on every dataset. Do it recursively on the parent to catch everything in one shot. ZFS snapshots are instant and storage-efficient. There's no cost to doing it every time.

**Beyond snapshots, read the release notes on version bumps.** The jump from 2.5.x to 2.6.x included a mandatory Postgres major version migration. It's in the changelog. 90 seconds of reading before hitting Update would have turned this into a planned procedure instead of an incident.

**Finally, run a monthly `pg_dump`.** The `-Fc` flag produces a compressed, restorable backup. Store it outside your `pgData` volume, on your photo dataset or a separate backup dataset. It takes one line in a cron job. For a full automation approach, the same webhook and scheduling patterns from [Automating Homelab Documentation with n8n and Claude Code](/blog/homelab-docs-automation-n8n-claude/) apply cleanly here, replacing the doc generation step with a `pg_dump` exec. I also documented the same backup-before-the-thing-you're-backing-up-depends-on problem with [OPNsense config backups](/blog/opnsense-backup-incident/).

Privacy is the second-most-cited reason people run their own infrastructure at home: 34.7% of self-hosters name it as a primary motivation ([Self-Hosted Survey 2024](https://selfhosted-survey-2024.deployn.de/)). Self-hosting your photo library instead of handing it to Google means you own the failure modes. The backup is the cost of that ownership.

<figure>
  <svg viewBox="0 0 560 255" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Horizontal bar chart: primary self-hosting motivations. Learning/skill-building 35.3%, Privacy 34.7%, Cost savings 16%, Other 14%" style="width:100%;max-width:560px;background:transparent;overflow:visible">
    <title>Why People Self-Host: Primary Motivations (2024 Self-Hosted Survey, n=2,181)</title>
    <!-- Title -->
    <text x="280" y="18" fill="#e2e8f0" font-size="13" font-weight="600" text-anchor="middle" font-family="system-ui,sans-serif">Why People Self-Host (n=2,181)</text>
    <!-- Baseline -->
    <line x1="163" y1="30" x2="163" y2="243" stroke="rgba(148,163,184,0.25)" stroke-width="1"/>
    <!-- Bars -->
    <rect x="164" y="33"  width="331" height="38" rx="4" fill="#5eead4" opacity="0.85"/>
    <rect x="164" y="88"  width="325" height="38" rx="4" fill="#2dd4bf" opacity="0.85"/>
    <rect x="164" y="143" width="150" height="38" rx="4" fill="#14b8a6" opacity="0.85"/>
    <rect x="164" y="198" width="131" height="38" rx="4" fill="#64748b" opacity="0.85"/>
    <!-- Left labels -->
    <g fill="#cbd5e1" font-size="12" text-anchor="end" font-family="system-ui,sans-serif" dominant-baseline="middle">
      <text x="157" y="52">Learning</text>
      <text x="157" y="107">Privacy</text>
      <text x="157" y="162">Cost savings</text>
      <text x="157" y="217">Other</text>
    </g>
    <!-- Percentage labels (outside bars) -->
    <g fill="#e2e8f0" font-size="12" font-weight="600" font-family="system-ui,sans-serif" dominant-baseline="middle">
      <text x="502" y="52">35.3%</text>
      <text x="496" y="107">34.7%</text>
      <text x="321" y="162">16.0%</text>
      <text x="302" y="217">14.0%</text>
    </g>
  </svg>
  <figcaption style="font-size:0.8rem;color:#737373;text-align:center;margin-top:0.5rem">Source: <a href="https://selfhosted-survey-2024.deployn.de/">Self-Hosted Survey 2024</a> (n=2,181, August 2024)</figcaption>
</figure>

{{< figure
  src="https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1200&h=630&fit=crop&q=80&fm=webp"
  alt="Multiple monitors displaying code with blue and red ambient lighting, a homelab workstation where these incidents get diagnosed"
>}}

---

## Frequently Asked Questions

### Why doesn't the new pgvecto image just include the PG15 binaries?

Shipping both PG15 and PG18 binaries in the same container image increases image size and maintenance burden. The expectation was that `pg_upgrade` would handle in-place migration from the data directory, a reasonable assumption. But the toolchain changes in the new image made that impossible for existing Postgres 15 installs without an intermediate step. The specific issue is tracked in the [truenas/apps GitHub repository at issue #4628](https://github.com/truenas/apps/issues/4628). As of March 20, 2026, the community is actively working through variations of this fix.

### What exactly does the pgvecto_upgrade container do?

`pgvecto_upgrade` is a one-shot init container that runs before the main Postgres container starts. It checks the on-disk data directory for the running Postgres version, compares it against the target version in the new image, and, if they differ, attempts an in-place upgrade using `pg_upgrade`. If the migration completes (or isn't needed), the container exits cleanly and everything downstream starts normally. If it fails, it exits code 1 and the entire stack waits. The Immich server, the web UI, the ML microservice: none of it starts until `pgvecto_upgrade` exits successfully.

### Does this fix work on Docker Compose installations?

Yes. The core `pg_dump` → `pg_restore` steps are identical. The difference is in how you find your volume path: use `docker inspect <your-pgvecto-container-name> | grep -A3 Mounts | grep Source`, and how you restart Immich after moving the PG15 directory. Instead of the TrueNAS Apps UI, run `docker compose down` followed by `docker compose up -d`. The same rename trap applies: move the PG15 dir outside the `pgData` mount, not just rename it within.

### What does the EINVAL: immich.postgres_image_selector error mean?

That error appears when you try to update Immich through the TrueNAS Apps UI before the stored app configuration accepts the new `vectorchord_18_image` value. The stored config still references the Postgres 15 image selector, which 2.6.x no longer recognizes. In some cases, editing the app config (not updating, just editing the existing deployment) and manually changing the Postgres Image dropdown to the 18 option lets the migration attempt start. If that migration then hits the binary-not-found error described above, the `pg_dump` recovery procedure in this post is the path forward.

### Do face recognition and smart search work after the restore?

Yes. `pg_dump -Fc` captures the full database state, including the vector embeddings that power face recognition and smart search. After `pg_restore`, those features work without any reprocessing. Immich may kick off some background jobs automatically after startup. That's normal. Your existing face assignments, people groupings, and tagged memories will be intact.

## Takeaways

Immich 2.6 turned a routine app update into a data recovery exercise for a lot of people on March 20, 2026. The root cause was specific (a missing toolchain in a container image), but the fix is straightforward once you understand what actually broke.

The takeaways:

- **Your data never left.** The upgrade failed before touching anything. The `pg_dump` captures exactly what you had before 2.6.0 landed.
- **The rename trap is real.** Moving `15/` to `15.bak/` inside `pgData` doesn't trick the upgrade script. It scans the mount, not the directory name. Move it one level up.
- **Snapshots before updates.** Every time. Two clicks. The cost of skipping one is a manual library scan and losing all your albums.

If you're watching this issue develop, the community thread at [forums.truenas.com](https://forums.truenas.com/t/immich-app-update-to-2-6-0-fails-with-postress-error/64604) and [truenas/apps issue #4628](https://github.com/truenas/apps/issues/4628) are the places to watch for updates.

---

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/blog/truenas-immich-postgres-fix/#article",
      "headline": "Fix Immich 2.6 Postgres Upgrade Failure on TrueNAS",
      "description": "Immich 2.6 dropped PG15 binaries from pgvecto, breaking every TrueNAS install on Postgres 15. Recover 17,512+ assets with this pg_dump → pg_restore fix.",
      "datePublished": "2026-03-20T00:00:00Z",
      "dateModified": "2026-03-20T00:00:00Z",
      "author": {
        "@type": "Person",
        "@id": "https://moshthesubnet.com/#author",
        "name": "Skyler",
        "url": "https://moshthesubnet.com"
      },
      "publisher": {
        "@type": "Organization",
        "@id": "https://moshthesubnet.com/#organization",
        "name": "moshthesubnet",
        "url": "https://moshthesubnet.com"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=1200&h=630&fit=crop&q=80&fm=webp",
        "width": 1200,
        "height": 630,
        "caption": "Dense wall of color-coded ethernet cables running into a data center patch panel"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/blog/truenas-immich-postgres-fix/"
      },
      "articleSection": "Homelab",
      "keywords": ["Immich", "TrueNAS", "Postgres", "pgvecto", "pg_dump", "pg_restore", "homelab", "self-hosted", "Docker", "database migration", "incident response"],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/blog/truenas-immich-postgres-fix/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://moshthesubnet.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Posts",
          "item": "https://moshthesubnet.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Fix Immich 2.6 Postgres Upgrade Failure on TrueNAS",
          "item": "https://moshthesubnet.com/blog/truenas-immich-postgres-fix/"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://moshthesubnet.com/blog/truenas-immich-postgres-fix/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Why doesn't the new pgvecto image just include the PG15 binaries?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Shipping both PG15 and PG18 binaries in the same container image increases image size and maintenance burden. The toolchain changes in the new image made in-place migration impossible for existing Postgres 15 installs without an intermediate step. The issue is tracked in truenas/apps at issue #4628."
          }
        },
        {
          "@type": "Question",
          "name": "What exactly does the pgvecto_upgrade container do?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "pgvecto_upgrade is a one-shot init container that runs before the main Postgres container starts. It checks the on-disk data directory version, compares it to the target version in the new image, and attempts an in-place upgrade using pg_upgrade. If it fails, it exits code 1 and the entire Immich stack (server, web UI, ML microservice) never starts."
          }
        },
        {
          "@type": "Question",
          "name": "Does this fix work on Docker Compose installations?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The core pg_dump to pg_restore steps are identical. Find your volume path with docker inspect, and restart with docker compose down and docker compose up -d instead of the TrueNAS Apps UI. The rename trap applies the same way: move the PG15 dir outside the pgData mount entirely."
          }
        },
        {
          "@type": "Question",
          "name": "What does the EINVAL immich.postgres_image_selector error mean?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "This error appears when the stored TrueNAS app config still references the Postgres 15 image selector, which Immich 2.6.x no longer accepts. Editing the app config (not updating it) and changing the Postgres Image dropdown to the 18 option may let the migration start. If it then fails with the binary-not-found error, follow the pg_dump recovery procedure in this post."
          }
        },
        {
          "@type": "Question",
          "name": "Do face recognition and smart search work after the restore?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. pg_dump with the -Fc flag captures the full database state, including the vector embeddings that power face recognition and smart search. After pg_restore, those features work without reprocessing. Your existing face assignments, people groupings, and tagged memories will be intact."
          }
        }
      ]
    }
  ]
}
</script>
