---
title: "How to Build Your Own Router/Firewall Using Proxmox"
date: 2026-06-26
draft: true
description: "The exact hardware used to build a dedicated Proxmox node running OPNsense and Pi-hole — component choices, PCIe constraints, and a full cost breakdown."
summary: "ASRock N100M + 2.5G dual-port NIC + 16GB DDR4 + 1TB NVMe in a 2U chassis for $413.38. Runs OPNsense VM and Pi-hole LXC. Here's what was chosen, why, and what the PCIe limits mean for NIC upgrades."
tags:
  - proxmox
  - opnsense
  - homelab
  - networking
  - hardware
  - pihole
  - firewall
  - self-hosted
images: ["/projects/proxmox-opnsense-router-build/feature.png"]
weight: 10
---

*By [Skyler King](/docs/bio/) — CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*

Running a router and firewall on dedicated hardware means buying a box that does exactly one job and nothing else. Virtualizing it on Proxmox gets you the same isolation — the firewall is still its own OS on its own virtual disk — but you gain config portability, snapshot-based restore, and the ability to run a second service (like a DNS sinkhole) on the same physical node without touching the firewall's resources.

This page documents the exact hardware used to build the second Proxmox node in the lab. It's been running OPNsense and Pi-hole continuously for over 106 days as of this writing. If you had a similar backup incident to the one [documented here](/blog/opnsense-backup-incident/), you already know why keeping the firewall VM isolated on its own node matters.

{{< figure
  src="feature.png"
  alt="2U rackmount server chassis front panel"
  caption="The RackChoice 2U chassis. Replace this with front-of-chassis photo."
>}}

## Hardware

All six components sourced from Amazon. The board came used-listed but was verified new; everything else was new.

| Component | Model | Paid |
|-----------|-------|------|
| Motherboard | ASRock N100M Micro ATX | $129.00 |
| NIC | 2.5G Dual Port PCIe (Intel I226) | $52.99 |
| RAM | Crucial 16GB DDR4 3200MHz (CT16G4DFRA32A) | $27.54 |
| PSU | Thermaltake Smart 500W 80+ White (PS-SPD-0500NPCWUS-W) | $39.95 |
| Storage | Crucial P3 1TB NVMe M.2 (CT1000P3SSD8) | $64.90 |
| Chassis | RackChoice 2U Micro ATX Compact Rackmount | $99.00 |
| **Total** | | **$413.38** |

{{< figure
  src="internals.jpg"
  alt="Inside the chassis showing motherboard, RAM, NVMe SSD, and PCIe NIC installed"
  caption="Replace with real internals photo."
>}}
