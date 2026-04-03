---
title: "The Backup That Ate My Network"
aliases: ["/posts/opnsense-backup-incident/"]
date: 2026-03-04
lastUpdated: "2026-03-11"
draft: false
description: "My OPNsense VM froze during a 3am vzdump snapshot, severed all VLAN routing, and trapped Proxmox in a circular dependency. Here's how a 30-line bash script replaced a full VM backup — and why that was the right call."
summary: "Scheduled vzdump backup → OPNsense snapshot freeze → VLAN routing severed → Proxmox can't reach backup storage. A circular dependency baked into my infrastructure. This is how I broke the loop."
coverImage: "https://images.unsplash.com/photo-1718241905495-01e4e42c3eef?w=1200&h=630&fit=crop&q=80&fm=webp"
coverImageAlt: "Dark server room with rows of rack-mounted servers illuminated by LED indicators in a data center"
ogImage: "https://images.unsplash.com/photo-1718241905495-01e4e42c3eef?w=1200&h=630&fit=crop&q=80&fm=webp"
tags:
  - proxmox
  - opnsense
  - homelab
  - networking
  - bash
  - automation
  - incident-response
---

*By [Skyler King](/docs/bio/) — CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*

At 3am on a Tuesday, my scheduled Proxmox backup job killed my network. Not in the dramatic "something exploded" sense — more like it quietly held a pillow over its face until everything went still. The kind of failure you only find out about in the morning when you notice the timestamps stopped.

> **TL;DR:** A vzdump snapshot froze my OPNsense VM, severing the cross-VLAN route the backup job needed to reach storage. The backup was destroying the infrastructure it depended on. I removed OPNsense from the backup job and replaced it with a 30-line bash script that pulls the config XML via the OPNsense REST API — no snapshot, no freeze, no loop. A [Unitrends 2025 report](https://www.unitrends.com/blog/the-state-of-backup-and-recovery-2025-trends-and-challenges/) found that 60% of organizations believe they can recover within hours; only 35% actually can. This post is a close-up of how that gap happens.

## What Happened

<!-- [PERSONAL EXPERIENCE] -->

Backup-related errors are the single leading cause of data loss, responsible for [32% of all data loss incidents](https://www.businesswire.com/news/home/20240910352430/en/Zerto-Sponsored-Research-Finds-Backup-Only-Recovery-Solutions-Are-Failing-Organizations-One-Third-of-the-Time) ([IDC/Zerto](https://www.zerto.com), 2024). Most of those failures don't announce themselves. Mine didn't either — it just went quiet and waited for morning.

Proxmox runs nightly vzdump backups at 3am. VM 150 — my OPNsense instance — was included in that job and configured to back up in snapshot mode. Snapshot mode briefly freezes the VM to get a consistent disk image. Brief, measured in seconds. Usually harmless.

OPNsense is not harmless to freeze. It's my primary firewall and router. Every inter-VLAN route in the lab runs through it. So when the snapshot paused VM 150, it didn't just pause a VM — it paused the network.

The path between my Proxmox management interface (VLAN 99) and my backup storage (a separate VLAN) goes through OPNsense. While OPNsense was frozen mid-snapshot, that path didn't exist. The backup job was holding the network hostage to complete a backup that required the network to complete.

The VM eventually recovered on its own. But the routing state was corrupt enough that I had to do a full Proxmox host reboot to restore connectivity. At 3am. On a Monday.

## Root Cause

<!-- [UNIQUE INSIGHT] -->

VM snapshot stun time scales linearly with disk count — measured at approximately [188ms per VMDK under normal conditions](https://knowledge.broadcom.com/external/article/337998/vm-snapshot-stun-times-correlate-with-th.html), with aggregate stun reaching 132.5 seconds in extreme cases ([Broadcom KB #337998](https://knowledge.broadcom.com/external/article/337998/vm-snapshot-stun-times-correlate-with-th.html), [virten.net](https://www.virten.net/2015/10/how-long-are-virtual-machines-stunned-for-snapshots-and-vmotion/)). For most VMs, a fraction of a second is irrelevant. For a firewall, even a 200ms freeze drops in-flight routing state — and that's before accounting for the missing guest agent.

The dependency graph looked like this:

```
vzdump job → snapshot VM 150 → OPNsense freezes → VLAN routing drops
                                                         ↓
                              backup job needs VLAN routing to reach storage
```

A loop. The backup job was destroying the infrastructure it depended on.

There were compounding factors. OPNsense is FreeBSD-based, and the QEMU guest agent had been uninstalled previously because of exactly this kind of backup interference. Without the guest agent, Proxmox has no clean way to coordinate with the guest OS during snapshots — it just freezes and hopes. On a stateless VM that's fine. On your firewall, it isn't.

## The Fix I Didn't Use

The obvious move would have been to reinstall the guest agent, configure it properly, and try to make the snapshot cleaner. I considered it for about thirty seconds before deciding it was the wrong frame entirely.

The real question was: *why was I doing a full VM backup of OPNsense at all?*

OPNsense already syncs its config to Google Drive on every change. The VM image itself — the OS, the packages, the running state — is all reproducible. What matters is the config file. A full disk image of OPNsense adds maybe 4GB to my backup storage and contributes nothing I couldn't reconstruct from the config in ten minutes.

So the actual problem wasn't the snapshot mechanism. It was that I had the wrong backup strategy for this specific VM, and the wrong strategy was actively breaking my infrastructure.

## What I Actually Did

<!-- [PERSONAL EXPERIENCE] -->

**Step 1: Remove VM 150 from the vzdump job entirely.**

Immediately broke the dependency loop. No more 3am roulette.

**Step 2: Identify the real gap.**

Google Drive backup is good. It's change-triggered and offsite. But it has a failure mode that I'd been ignoring: if OPNsense goes down, I can't reach Google Drive to pull the config and restore from it. The restore path requires the thing I'm restoring.

I needed a local copy of the config, on the Proxmox host itself, that doesn't require cross-VLAN routing or internet access to retrieve.

**Step 3: Set up an API-based config pull.**

OPNsense has a REST API with a backup endpoint. I created a dedicated read-only API user with backup privileges — no admin access, no write permissions, just enough to pull the config XML. The auth model is HTTP Basic with an API key and secret — the same model used by the [OPNsense diagnostics API for cross-VLAN network monitoring](/writing/cross-vlan-network-monitor/). Credentials stored in a root-only `.env` file on the Proxmox host.

{{< alert >}}
Keep API credentials in a file with `chmod 600`, owned by root. The `.env` file should never be world-readable, and definitely shouldn't live in a directory served by anything.
{{< /alert >}}

**Step 4: Write the backup script.**

```bash
#!/bin/bash
source /root/opnsense-backups/.opnsense-backup.env
BACKUP_DIR="/root/opnsense-backups/configs"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/config-$DATE.xml"
RETENTION_DAYS=30
LOG="/root/opnsense-backups/backup.log"
mkdir -p "$BACKUP_DIR"
curl -sk -u "$API_KEY:$API_SECRET" \
  "https://$OPNSENSE_IP:$OPNSENSE_PORT/api/core/backup/download/this" \
  -o "$BACKUP_FILE"
if head -1 "$BACKUP_FILE" | grep -q "<?xml"; then
  echo "$(date): Backup successful → $BACKUP_FILE" >> "$LOG"
else
  echo "$(date): Backup FAILED" >> "$LOG"
  rm -f "$BACKUP_FILE"
  exit 1
fi
find "$BACKUP_DIR" -name "*.xml" -mtime +$RETENTION_DAYS -delete
```

The validation step matters. Without it, a failed API call (auth error, network blip, OPNsense being restarted) would silently write an error response to disk and log it as a success. Checking that the file starts with `<?xml` catches that before it becomes a problem at restore time.

**Step 5: Schedule it before the vzdump window.**

```
0 2 * * * /root/opnsense-backups/backup-opnsense.sh
```

Runs daily at 2am, an hour before the 3am backup job. The API call runs entirely within VLAN 99 — Proxmox host to OPNsense management interface — no cross-VLAN routing required. The backup this script produces doesn't need OPNsense to work.

30-day retention. Each config file is around 347KB, so the full archive tops out around 10MB. The storage math is not interesting.

{{< figure
  src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop&q=80"
  alt="Close-up of a rack-mounted patch panel with numbered Ethernet ports and blue patch cables"
  caption="Every numbered port is a dependency. Not all of them belong in the same backup job."
>}}

## Where Things Stand

<!-- [ORIGINAL DATA] -->

Config is now backed up to two places:

| Location | Trigger | Requires internet | Requires OPNsense up |
|---|---|---|---|
| Google Drive | Every config change | Yes | Yes (to push) |
| Proxmox local | Daily at 2am | No | No (API only) |
| ~~VM disk image~~ | ~~Never~~ | — | — |

<figure>
<svg role="img" aria-label="Backup Recovery: Expectation vs. Reality. 60% of organizations believe they can recover within hours; only 35% actually can. Source: Unitrends State of Backup and Recovery Report 2025, n=3,000+" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 252" style="max-width:600px;width:100%;background:transparent;">
  <title>Backup Recovery: Expectation vs. Reality</title>
  <text x="16" y="28" font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="#e5e7eb">Backup Recovery: Expectation vs. Reality</text>
  <text x="16" y="62" font-family="system-ui,sans-serif" font-size="12" fill="#9ca3af">Expect to recover within hours</text>
  <rect x="16" y="70" width="276" height="32" rx="4" fill="#5eead4"/>
  <text x="300" y="92" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#5eead4">60%</text>
  <text x="16" y="128" font-family="system-ui,sans-serif" font-size="12" fill="#9ca3af">Actually recovered within hours</text>
  <rect x="16" y="136" width="161" height="32" rx="4" fill="#2dd4bf"/>
  <text x="185" y="158" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#2dd4bf">35%</text>
  <line x1="16" y1="186" x2="584" y2="186" stroke="#374151" stroke-width="1"/>
  <text x="16" y="206" font-family="system-ui,sans-serif" font-size="11" fill="#6b7280">Source: Unitrends State of Backup and Recovery Report 2025, n=3,000+ IT professionals</text>
  <text x="16" y="222" font-family="system-ui,sans-serif" font-size="11" fill="#6b7280">The 25-point gap only shows up when you actually try to recover.</text>
</svg>
<figcaption style="font-size:0.8em;color:#737373;text-align:center;margin-top:0.5rem">
  Source: <a href="https://www.unitrends.com/blog/the-state-of-backup-and-recovery-2025-trends-and-challenges/">Unitrends State of Backup and Recovery Report 2025</a>
</figcaption>
</figure>

The circular dependency is gone. The backup job runs on a schedule that doesn't touch VM 150. The config pull runs on a separate schedule, stays within a single VLAN, and validates its own output before logging success.

The OPNsense VM can freeze, crash, or get deleted — the config is already on disk before any of that happens.

That's the whole thing. A 4am reboot, a removed VM from a backup job, and a 30-line bash script that pulls XML over a local API call. Sometimes the fix is smaller than the incident that revealed the need for it.

---

## Frequently Asked Questions

### Why not just reinstall the QEMU guest agent on OPNsense?

Installing the guest agent would let Proxmox coordinate with OPNsense during snapshots for a cleaner freeze. It addresses the mechanism, not the strategy. A 4GB VM image of a reproducible OS is still a poor backup compared to pulling the 347KB config that actually matters. The guest agent fix is technically correct but strategically wrong for a firewall VM.

### Does the OPNsense API backup capture everything?

The `/api/core/backup/download/this` endpoint returns the OPNsense config XML — firewall rules, VLAN configuration, DHCP settings, user accounts, and all interface config. It doesn't capture installed packages or custom scripts outside the standard config paths. For a typical homelab install those are reproducible. If you've modified files outside `/conf/`, document those separately.

### Why schedule the config pull before vzdump, not after?

If vzdump causes a network disruption — even a brief one — the API call running after it might fail. Scheduling the pull at 2am, an hour before the 3am vzdump window, means the local backup is already done before anything touches VM 150. The safety net goes in before the juggling starts.

### What if OPNsense is down when the backup script runs?

The script validates its own output: if the file doesn't start with `<?xml`, it logs failure, deletes the partial file, and exits with code 1. The previous day's config stays on disk. If you want active alerting on failures, exit code 1 plugs cleanly into a webhook — I route mine through [n8n for alerting](/writing/homelab-docs-automation-n8n-claude/).

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/writing/opnsense-backup-incident/#article",
      "headline": "The Backup That Ate My Network",
      "description": "My OPNsense VM froze during a 3am vzdump snapshot, severed all VLAN routing, and trapped Proxmox in a circular dependency. Here's how a 30-line bash script replaced a full VM backup — and why that was the right call.",
      "datePublished": "2026-03-04T00:00:00Z",
      "dateModified": "2026-03-11T00:00:00Z",
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
        "url": "https://images.unsplash.com/photo-1718241905495-01e4e42c3eef?w=1200&h=630&fit=crop&q=80&fm=webp",
        "width": 1200,
        "height": 630,
        "caption": "Dark server rack cabinets with tangled orange and teal fiber cables and green LED status indicators"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/writing/opnsense-backup-incident/"
      },
      "articleSection": "Homelab",
      "keywords": ["OPNsense", "Proxmox", "vzdump", "backup", "homelab", "bash", "incident response", "VLAN", "firewall", "config backup"],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/writing/opnsense-backup-incident/#breadcrumb",
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
          "item": "https://moshthesubnet.com/writing/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "The Backup That Ate My Network",
          "item": "https://moshthesubnet.com/writing/opnsense-backup-incident/"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://moshthesubnet.com/writing/opnsense-backup-incident/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Why not just reinstall the QEMU guest agent on OPNsense?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Installing the guest agent would let Proxmox coordinate with OPNsense during snapshots for a cleaner freeze. It addresses the mechanism, not the strategy. A 4GB VM image of a reproducible OS is still a poor backup compared to pulling the 347KB config that actually matters. The guest agent fix is technically correct but strategically wrong for a firewall VM."
          }
        },
        {
          "@type": "Question",
          "name": "Does the OPNsense API backup capture everything?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The /api/core/backup/download/this endpoint returns the OPNsense config XML — firewall rules, VLAN configuration, DHCP settings, user accounts, and all interface config. It doesn't capture installed packages or custom scripts outside the standard config paths. For a typical homelab install those are reproducible. If you've modified files outside /conf/, document those separately."
          }
        },
        {
          "@type": "Question",
          "name": "Why schedule the OPNsense config pull before vzdump, not after?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "If vzdump causes a network disruption — even a brief one — the API call running after it might fail. Scheduling the pull an hour before the vzdump window means the local backup is already done before anything touches VM 150. The safety net goes in before the juggling starts."
          }
        },
        {
          "@type": "Question",
          "name": "What if OPNsense is down when the backup script runs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The script validates its own output: if the file doesn't start with <?xml, it logs failure, deletes the partial file, and exits with code 1. The previous day's config stays on disk intact. Exit code 1 plugs cleanly into any webhook or alerting system for active notification."
          }
        }
      ]
    }
  ]
}
</script>
