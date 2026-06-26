---
title: "How to Build Your Own Router/Firewall Using Proxmox"
date: 2026-06-26
draft: false
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
images: ["/projects/proxmox-opnsense-router-build/feature.jpg"]
weight: 10
---

*By [Skyler King](/docs/bio/) — CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*

Running a router and firewall on dedicated hardware means buying a box that does exactly one job and nothing else. Virtualizing it on Proxmox gets you the same isolation — the firewall is still its own OS on its own virtual disk — but you gain config portability, snapshot-based restore, and the ability to run a second service (like a DNS sinkhole) on the same physical node without touching the firewall's resources.

This page documents the exact hardware used to build the second Proxmox node in the lab. It's been running OPNsense and Pi-hole continuously for over 106 days as of this writing. If you had a similar backup incident to the one [documented here](/blog/opnsense-backup-incident/), you already know why keeping the firewall VM isolated on its own node matters.

{{< figure
  src="feature.jpg"
  alt="RackChoice 2U chassis installed in the rack, blue power LED active, patch panel above"
  caption="Node 2 in the rack. Patch panel above, switched PDU below. Blue LED means it's doing its job."
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
  alt="ASRock N100M motherboard with Crucial P3 NVMe SSD in the M.2 slot and 2.5G NIC in the PCIe slot"
  caption="ASRock N100M (Rev. 1.03) with the Crucial P3 1TB NVMe seated in the M.2 slot. The 2.5G dual-port NIC occupies the x16 PCIe slot at the bottom."
>}}

## Build Notes

### Motherboard and CPU

The ASRock N100M ships with the Intel N100 already soldered on — no separate CPU purchase. The N100 is a quad-core chip running up to 3.4 GHz with a 6W TDP, which makes it a reasonable fit for a node that's on around the clock doing routing and DNS. The single DDR4 DIMM slot supports up to 32GB, so there's room to expand memory without touching anything else.

### Chassis

The 2U chassis was chosen over 1U primarily for airflow headroom and the option to add components later. That expansion never happened — the build has stayed the same since day one — but the extra space hasn't caused any problems either. If you're space-constrained in a shallow rack, a 1U would work fine with this board.

{{< figure
  src="internals-wide.jpg"
  alt="Interior of the 2U chassis showing Thermaltake 500W PSU, empty drive bays, ASRock N100M motherboard, and cabling"
  caption="Plenty of room inside. The drive bays on the left are unused — the NVMe handles all storage."
>}}

### NIC — Working Within the PCIe Constraint

This is the most consequential decision in the build. The N100M's x16 slot runs at **x2 electrical** — about 16 Gbps of PCIe 3.0 bandwidth. A dual-port 10G NIC would need up to 20 Gbps to saturate both ports simultaneously, which exceeds the slot's budget. 10G was off the table.

The dual-port 2.5G NIC fits cleanly: two ports at 2.5G each is 5 Gbps combined, well under the ceiling. One port goes to WAN, one port goes to the LAN switch as a trunk. OPNsense handles VLAN tagging on the trunk port — the same configuration that was already running on the previous setup, so there was no new ground to break there.

{{< figure
  src="rear-panel.jpg"
  alt="Rear of the node showing dual 2.5G RJ45 ports with green link LEDs active on both interfaces"
  caption="Both ports active — green LEDs on both interfaces. Top port trunks to the switch (LAN), bottom port is WAN."
>}}

{{< alert >}}
**Reader note:** If you want to skip the trunk port and assign a physical interface per VLAN instead, a **quad-port 2.5G NIC** (4 × 2.5G = 10 Gbps) still fits under the ~16 Gbps PCIe budget and gives you four ports to work with.
{{< /alert >}}

## Services Running

Both services have been up for 106 days without intervention as of this writing.

### OPNsense (VM)

Primary firewall and inter-VLAN router for the entire lab. Every packet crossing a VLAN boundary routes through this VM. It's also the DHCP server for all VLANs, with Pi-hole set as the upstream DNS resolver.

| Resource | Allocated |
|----------|-----------|
| vCPUs | 4 |
| RAM | 12 GiB (dedicated; ~7 GiB in active use) |
| Boot disk | 128 GiB |

The 12 GiB RAM allocation is larger than OPNsense strictly needs — active usage sits around 7 GiB — but the headroom costs nothing on this node and avoids ever having to revisit it. For the full VLAN layout this VM routes, see the [VLAN segmentation project](/projects/vlan-segmentation/).

### Pi-hole LXC (Pi-hole2)

DNS ad-blocking across all VLANs. OPNsense's DHCP server hands out Pi-hole's IP as the DNS resolver for every subnet, so ad and tracker blocking applies network-wide without configuring anything on individual devices.

| Resource | Allocated |
|----------|-----------|
| vCPUs | 2 |
| RAM | 256 MiB |
| Swap | 256 MiB |
| Boot disk | 9.75 GiB |
| Type | Unprivileged LXC (Ubuntu) |

256 MiB is more than enough for Pi-hole; it's consistently using about 100 MiB under load.

## Cost: Then vs. Now

Prices at build are from Amazon order history. Current prices verified June 2026.

| Component | At Build | Current (Jun 2026) |
|-----------|----------|--------------------|
| ASRock N100M Micro ATX | $129.00 | $99.99 |
| 2.5G Dual Port PCIe NIC (Intel I226) | $52.99 | $40.99 |
| Crucial 16GB DDR4 3200MHz | $27.54 | $124.00 |
| Thermaltake Smart 500W 80+ White PSU | $39.95 | $37.99 |
| Crucial P3 1TB NVMe M.2 | $64.90 | $264.00 |
| RackChoice 2U Micro ATX Chassis | $99.00 | $99.00 |
| **Total** | **$413.38** | **$665.97** |

{{< alert "warning" >}}
**Building this today?** The biggest price swings are in RAM (+$96) and the SSD (+$199). The Crucial P3 is a Gen3 NVMe — now that Gen4 drives dominate the market, Gen3 stock has thinned out and prices have climbed. The N100M's M.2 slot runs at Gen3x2 speeds regardless of drive generation, so a Gen4 1TB NVMe (~$136 as of this writing) is the smarter buy for a new build — same speed at the slot, lower price.
{{< /alert >}}

## In the Rack

{{< figure
  src="in-rack.jpg"
  alt="RackChoice 2U chassis installed in the rack with patch panel above and switched PDU below, blue power LED active"
  caption="Node 2 in context. Patch panel above, switched PDU below."
>}}

The node sits directly below the patch panel in the rack, above the switched PDU. It's the only thing in the rack that's routing your traffic and blocking ads at the same time.
