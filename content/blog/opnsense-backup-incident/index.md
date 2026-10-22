---
title: "The Backup That Ate My Network"
aliases: ["/posts/opnsense-backup-incident/"]
date: 2026-03-04
lastUpdated: "2026-03-11"
draft: false
description: "My OPNsense VM froze during a 3am vzdump snapshot, severed all VLAN routing, and trapped Proxmox in a circular dependency. How a 30-line bash script replaced a full VM backup, and why that was the right call."
summary: "Scheduled vzdump backup → OPNsense snapshot freeze → VLAN routing severed → Proxmox can't reach backup storage. A circular dependency baked into my infrastructure. This is how I broke the loop."
tags:
  - proxmox
  - opnsense
  - homelab
  - networking
  - bash
  - automation
  - incident-response
images: ["/blog/opnsense-backup-incident/og-card.png"]
---

At 3am on a Tuesday, my scheduled Proxmox backup job killed my network. Not in the dramatic "something exploded" sense. More like it quietly held a pillow over its face until everything went still. The kind of failure you only find out about in the morning when you notice the timestamps stopped.

> **TL;DR:** A vzdump snapshot froze my OPNsense VM, severing the cross-VLAN route the backup job needed to reach storage. The backup was destroying the infrastructure it depended on. I removed OPNsense from the backup job and replaced it with a 30-line bash script that pulls the config XML via the OPNsense REST API: no snapshot, no freeze, no loop.

## What Happened

Proxmox runs nightly vzdump backups at 3am. VM 150, my OPNsense instance, was included in that job and configured to back up in snapshot mode. Snapshot mode briefly freezes the VM to get a consistent disk image. Brief, measured in seconds. Usually harmless.

OPNsense is not harmless to freeze. It's my primary firewall and router. Every inter-VLAN route in the lab runs through it. So when the snapshot paused VM 150, it didn't just pause a VM. It paused the network.

The path between my Proxmox management interface (VLAN 99) and my backup storage (a separate VLAN) goes through OPNsense. While OPNsense was frozen mid-snapshot, that path didn't exist. The backup job was holding the network hostage to complete a backup that required the network to complete.

The VM eventually recovered on its own. But the routing state was corrupt enough that I had to do a full Proxmox host reboot to restore connectivity.

## Root Cause

VM snapshot stun time scales with disk count. VMware's numbers put it around [188ms per VMDK under normal conditions](https://knowledge.broadcom.com/external/article/337998/vm-snapshot-stun-times-correlate-with-th.html), with aggregate stun reaching 132.5 seconds in extreme cases ([Broadcom KB #337998](https://knowledge.broadcom.com/external/article/337998/vm-snapshot-stun-times-correlate-with-th.html), [virten.net](https://www.virten.net/2015/10/how-long-are-virtual-machines-stunned-for-snapshots-and-vmotion/)), and Proxmox is not going to be fundamentally different. For most VMs, a fraction of a second is irrelevant. For a firewall, even a 200ms freeze drops in-flight routing state, and that's before accounting for the missing guest agent.

The dependency graph looked like this:

```
vzdump job → snapshot VM 150 → OPNsense freezes → VLAN routing drops
                                                         ↓
                              backup job needs VLAN routing to reach storage
```

A loop. The backup job was destroying the infrastructure it depended on.

There were compounding factors. OPNsense is FreeBSD-based, and the QEMU guest agent had been uninstalled previously because of exactly this kind of backup interference. Without the guest agent, Proxmox has no clean way to coordinate with the guest OS during snapshots. It just freezes and hopes. On a stateless VM that's fine. On your firewall, it isn't.

## The Fix I Didn't Use

The obvious move would have been to reinstall the guest agent, configure it properly, and try to make the snapshot cleaner. I considered it for about thirty seconds before deciding it was the wrong frame entirely.

The real question was: *why was I doing a full VM backup of OPNsense at all?*

OPNsense already syncs its config to Google Drive on every change. The VM image itself (the OS, the packages, the running state) is all reproducible. What matters is the config file. A full disk image of OPNsense adds maybe 4GB to my backup storage and contributes nothing I couldn't reconstruct from the config in ten minutes.

So the actual problem wasn't the snapshot mechanism. It was that I had the wrong backup strategy for this specific VM, and the wrong strategy was actively breaking my infrastructure.

## What I Actually Did

**Step 1: Remove VM 150 from the vzdump job entirely.**

Immediately broke the dependency loop. No more 3am roulette.

**Step 2: Identify the real gap.**

Google Drive backup is good. It's change-triggered and offsite. But it has a failure mode that I'd been ignoring: if OPNsense goes down, I can't reach Google Drive to pull the config and restore from it. The restore path requires the thing I'm restoring.

I needed a local copy of the config, on the Proxmox host itself, that doesn't require cross-VLAN routing or internet access to retrieve.

**Step 3: Set up an API-based config pull.**

OPNsense has a REST API with a backup endpoint. I created a dedicated read-only API user with backup privileges: no admin access, no write permissions, just enough to pull the config XML. The auth model is HTTP Basic with an API key and secret, the same model used by the [OPNsense diagnostics API for cross-VLAN network monitoring](/blog/cross-vlan-network-monitor/). Credentials stored in a root-only `.env` file on the Proxmox host.

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

Runs daily at 2am, an hour before the 3am backup job. The API call runs entirely within VLAN 99, Proxmox host to OPNsense management interface, so no cross-VLAN routing is required. The backup this script produces doesn't need OPNsense to work.

30-day retention. Each config file is around 347KB, so the full archive tops out around 10MB. The storage math is not interesting.

## Where Things Stand

Config is now backed up to two places:

| Location | Trigger | Requires internet | Requires OPNsense up |
|---|---|---|---|
| Google Drive | Every config change | Yes | Yes (to push) |
| Proxmox local | Daily at 2am | No | No (API only) |
| ~~VM disk image~~ | ~~Never~~ | N/A | N/A |

The circular dependency is gone. The backup job runs on a schedule that doesn't touch VM 150. The config pull runs on a separate schedule, stays within a single VLAN, and validates its own output before logging success.

The OPNsense VM can freeze, crash, or get deleted. The config is already on disk before any of that happens.

That's the whole thing. One early-morning reboot, one VM removed from a backup job, and a 30-line bash script that pulls XML over a local API call.

Not every OPNsense incident in this lab has been about backups, either. [A stuttering camera feed](/blog/camera-feed-stutter-vlan/) turned out to be a firewall rule that never accounted for a port I didn't know to look for.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/blog/opnsense-backup-incident/#article",
      "headline": "The Backup That Ate My Network",
      "description": "My OPNsense VM froze during a 3am vzdump snapshot, severed all VLAN routing, and trapped Proxmox in a circular dependency. Here's how a 30-line bash script replaced a full VM backup, and why that was the right call.",
      "datePublished": "2026-03-04T00:00:00Z",
      "dateModified": "2026-03-11T00:00:00Z",
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
        "url": "https://moshthesubnet.com/blog/opnsense-backup-incident/og-card.png",
        "width": 1200,
        "height": 630
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/blog/opnsense-backup-incident/"
      },
      "articleSection": "Homelab",
      "keywords": [
        "OPNsense",
        "Proxmox",
        "vzdump",
        "backup",
        "homelab",
        "bash",
        "incident response",
        "VLAN",
        "firewall",
        "config backup"
      ],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/blog/opnsense-backup-incident/#breadcrumb",
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
          "name": "The Backup That Ate My Network",
          "item": "https://moshthesubnet.com/blog/opnsense-backup-incident/"
        }
      ]
    }
  ]
}
</script>

<!-- Assumptions (2026-10-22 voice pass, delete after review):
- The original said "3am on a Tuesday" in the opener and "At 3am. On a Monday." later, then "a 4am reboot". I removed the weekday from the second mention and the reboot time rather than guess which was right. Put the real day back if you remember it. The sentence now ends at "restore connectivity." with no time or weekday.
- Cut: the Unitrends 60%/35% stat (TL;DR and chart) and the IDC/Zerto 32% stat. They were not part of your incident. The Broadcom snapshot-stun numbers stay because they explain the mechanism.
- "Proxmox is not going to be fundamentally different" is my bridge sentence, since the stun numbers are VMware's. Delete it if you'd rather not make that claim.
- Ending now stops at the flat summary; the "Sometimes the fix is smaller than the incident" moral is gone.
-->
