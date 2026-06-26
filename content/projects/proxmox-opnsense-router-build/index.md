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

## Build Notes

### Motherboard and CPU

The ASRock N100M ships with the Intel N100 already soldered on — no separate CPU purchase. The N100 is a quad-core chip running up to 3.4 GHz with a 6W TDP, which makes it a reasonable fit for a node that's on around the clock doing routing and DNS. The single DDR4 DIMM slot supports up to 32GB, so there's room to expand memory without touching anything else.

### Chassis

The 2U chassis was chosen over 1U primarily for airflow headroom and the option to add components later. That expansion never happened — the build has stayed the same since day one — but the extra space hasn't caused any problems either. If you're space-constrained in a shallow rack, a 1U would work fine with this board.

### NIC — Working Within the PCIe Constraint

This is the most consequential decision in the build. The N100M's x16 slot runs at **x2 electrical** — about 16 Gbps of PCIe 3.0 bandwidth. A dual-port 10G NIC would need up to 20 Gbps to saturate both ports simultaneously, which exceeds the slot's budget. 10G was off the table.

The dual-port 2.5G NIC fits cleanly: two ports at 2.5G each is 5 Gbps combined, well under the ceiling. One port goes to WAN, one port goes to the LAN switch as a trunk. OPNsense handles VLAN tagging on the trunk port — the same configuration that was already running on the previous setup, so there was no new ground to break there.

{{< figure
  src="rear-panel.jpg"
  alt="Rear panel of the 2U chassis showing dual 2.5G RJ45 ports and PSU"
  caption="Replace with real rear panel photo."
>}}

{{< alert >}}
**Reader note:** If you want to skip the trunk port and assign a physical interface per VLAN instead, a **quad-port 2.5G NIC** (4 × 2.5G = 10 Gbps) still fits under the ~16 Gbps PCIe budget and gives you four ports to work with.
{{< /alert >}}
