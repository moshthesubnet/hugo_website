---
title: "Fix Immich 2.6 Postgres Upgrade Failure on TrueNAS"
aliases: ["/posts/truenas-immich-postgres-fix/"]
date: 2026-03-20
lastmod: 2026-03-20
draft: false
description: "Immich 2.6 dropped PG15 binaries from pgvecto, breaking every TrueNAS install on Postgres 15. Recover 17,512+ assets with this pg_dump → pg_restore fix."
summary: "Immich 2.6.x dropped PG15 binaries from pgvecto, which is an instant brick on every TrueNAS install still running Postgres 15. Your data is untouched. Here's the pg_dump → pg_restore path out, including the rename trap that costs you an hour."
tags:
  - immich
  - truenas
  - postgres
  - homelab
  - self-hosted
  - docker
  - database
  - incident-response
images: ["/blog/truenas-immich-postgres-fix/og-card.png"]
---

Immich 2.6.0 dropped on March 20, 2026, and immediately broke every TrueNAS Community Edition install still running Postgres 15. No warning. No graceful fallback. The app update fires, the pgvecto upgrade container starts, and then stops. Nothing. The Immich server never comes back up.

The failure is specific: the new pgvecto image ships without the Postgres 15 binaries that `pg_upgrade` needs for an in-place major version migration. Your photos, albums, and metadata are completely intact. The problem is that the upgrade can't run, and until it does, Immich won't start.

This post covers exactly what broke, the one mistake that costs an extra hour during recovery, and a tested step-by-step fix using `pg_dump` and `pg_restore`. Every command below was run against a live 17,512-asset library on March 20, 2026.

{{< alert >}}
**TL;DR:** Immich 2.6 forces a mandatory Postgres 15 → 18 upgrade, but the new pgvecto image dropped the PG15 binaries `pg_upgrade` needs. Your data is safe: the migration fails before touching anything. Fix: spin up a temp PG15 container, `pg_dump`, move the PG15 dir *completely out* of the `pgData` mount (renaming inside it doesn't work), let Immich initialize fresh PG18, then `pg_restore`.
{{< /alert >}}

## What Caused the Immich 2.6 Update to Break on TrueNAS?

The 2.6.x release enforced a mandatory Postgres major version upgrade from 15 to 18, a change that had been building for months while a prior bug was silently letting installations skip it.

The root cause is in the container image. The new `pgvecto` image (which manages Postgres extensions and handles database version migrations) no longer ships the Postgres 15 binaries at `/usr/lib/postgresql/15/bin`. When Immich starts an upgrade, the `pgvecto_upgrade` init container fires, looks for those binaries to run `pg_upgrade`, and fails immediately:

```
[ix-postgres-upgrade]   - [2026-03-20 10:38:43] - Starting upgrade from PostgreSQL [15] to [18]
[ix-postgres-upgrade]   - [2026-03-20 10:38:43] - ERROR: Old PostgreSQL [15] binaries not found at [/usr/lib/postgresql/15/bin]
[ix-postgres-main]      - [2026-03-20 10:38:43] - ERROR: Upgrade failed
```

The critical thing: **the upgrade fails before it modifies any data.** Your Postgres 15 data directory is sitting there untouched. The Immich server container and everything downstream simply never get to start. They depend on `pgvecto_upgrade` completing cleanly, and it never does.

What this looks like in the TrueNAS Apps UI: Immich shows as failed. The app lifecycle log shows the pgvecto container pulling successfully (images already cached from a previous pull), then `pgvecto_upgrade` starting and exiting code 1 in under a second. Nothing after that. The main Immich server container doesn't even attempt to start.

The issue is tracked at [truenas/apps #4628](https://github.com/truenas/apps/issues/4628).

## The Rename Trap: Why 15.bak Inside pgData Still Fails

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

## How to Fix It: Complete pg_dump → pg_restore Recovery

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

If you deleted the `pgData` directory before dumping, your Postgres data is gone. Albums, face assignments, people groupings, shared links, memory albums. All of that lived in the database.

Your actual photo files almost certainly live on a separate dataset and should be intact. The path forward from here:

1. Start Immich fresh, which initializes a clean empty database
2. In the Immich UI, go to **Administration → Jobs → Library Scan** to re-import your photos
3. Face assignments and albums will need to be rebuilt manually

If you took a ZFS snapshot before the update, you can roll back. In TrueNAS: **Datasets → [dataset] → Snapshots → [snapshot name] → Rollback**. The snapshot is the fastest path to a full recovery. This is exactly why that step isn't optional.

## How to Prevent This on the Next TrueNAS App Update

Container-based app updates are fast and convenient, but they can silently package breaking infrastructure changes. A Postgres major version jump isn't obvious from a UI that just says "Update available."

Three habits would have turned this into a planned migration instead of an incident recovery:

**First: snapshot before every app update.** TrueNAS makes it two clicks. The Datasets panel has "Add Snapshot" on every dataset. Do it recursively on the parent to catch everything in one shot. ZFS snapshots are instant and storage-efficient. There's no cost to doing it every time.

**Beyond snapshots, read the release notes on version bumps.** The jump from 2.5.x to 2.6.x included a mandatory Postgres major version migration. It's in the changelog. 90 seconds of reading before hitting Update would have turned this into a planned procedure instead of an incident.

**Finally, run a monthly `pg_dump`.** The `-Fc` flag produces a compressed, restorable backup. Store it outside your `pgData` volume, on your photo dataset or a separate backup dataset. It takes one line in a cron job. For a full automation approach, the same webhook and scheduling patterns from [Automating Homelab Documentation with n8n and Claude Code](/blog/homelab-docs-automation-n8n-claude/) apply cleanly here, replacing the doc generation step with a `pg_dump` exec. I also documented the same backup-before-the-thing-you're-backing-up-depends-on problem with [OPNsense config backups](/blog/opnsense-backup-incident/).

Self-hosting your photo library instead of handing it to Google means you own the failure modes. The backup is the cost of that ownership.

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
        "name": "Skyler King",
        "url": "https://moshthesubnet.com/about/"
      },
      "publisher": {
        "@type": "Organization",
        "@id": "https://moshthesubnet.com/#organization",
        "name": "moshthesubnet",
        "url": "https://moshthesubnet.com"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://moshthesubnet.com/blog/truenas-immich-postgres-fix/og-card.png",
        "width": 1200,
        "height": 630
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/blog/truenas-immich-postgres-fix/"
      },
      "articleSection": "Homelab",
      "keywords": [
        "Immich",
        "TrueNAS",
        "Postgres",
        "pgvecto",
        "pg_dump",
        "pg_restore",
        "homelab",
        "self-hosted",
        "Docker",
        "database migration",
        "incident response"
      ],
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
    }
  ]
}
</script>

<!-- Assumptions (2026-10-22 voice pass, delete after review):
- Cut: Self-Hosted Survey stats (41.2%, 97%, 83.2%, 34.7%), the GitHub-star chart, the motivations chart, and the "First-hand summary for anyone linking directly" capsule. The commands and the rename-trap section are untouched.
- "In my experience maintaining TrueNAS app deployments" became "Three habits would have turned this into a planned migration" so it does not imply a fleet. Adjust if you do run more than one.
- Five Unsplash photos removed; the post now has no images. If you have a screenshot of the failed app state or the terminal, it belongs where the first photo was.
-->
