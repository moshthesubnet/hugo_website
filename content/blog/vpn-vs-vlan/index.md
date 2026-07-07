---
title: "VPN vs VLAN: The Difference That Actually Matters"
aliases: ["/posts/vpn-vs-vlan/"]
date: 2026-03-12
draft: false
description: "VPN vs VLAN explained at the OSI layer level: what each protects, what each can't do, and how to run both in a homelab. With a real 7-VLAN + WireGuard setup."
summary: "VPN and VLAN share two words but solve completely different problems. Here's what each one does, why you can't swap one for the other, and how I run both in my homelab."
tags: ["networking", "vpn", "vlan", "wireguard", "opnsense", "homelab", "ccna", "security"]
images: ["/blog/vpn-vs-vlan/og-card.png"]
---

*By [Skyler King](/docs/bio/), CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*

{{< alert >}}
**TL;DR: The one-line version:**

| | VLAN | VPN |
|---|---|---|
| **OSI Layer** | Layer 2 | Layer 3+ |
| **What it does** | Isolates traffic inside your network | Encrypts traffic crossing an untrusted network |
| **Where it lives** | Your switch | Your router / firewall |
| **Protects against** | Internal lateral movement | Eavesdropping on public networks |
| **Homelab tool** | UniFi switch + 802.1Q tags | WireGuard on OPNsense |
| **Replaces the other?** | No | No |
{{< /alert >}}

The VPN vs VLAN confusion is in the names. Both start with "Virtual." Both end with "Network." That's where the similarity stops. A VLAN and a VPN operate at different layers of the network stack and protect against completely different threats. You can't substitute one for the other, and in a well-designed network, you're running both.

This post is the long-form version of [a reel I made](https://www.instagram.com/p/DVzS9a6Rtwv/) on exactly this question. I'm CCNA certified and run a homelab with 7 VLANs and WireGuard in daily use — this isn't theoretical. If you're here from the reel, this is the depth behind the 45 seconds.

---

## What's the Core Difference Between a VPN and a VLAN?

The names overlap but the mechanisms don't.

A **VLAN** (Virtual Local Area Network) is a Layer 2 concept. It creates logical boundaries on a physical switch. You can have ten devices plugged into the same hardware and have them live in completely separate broadcast domains — they might as well be on different physical networks, because from Layer 2's perspective, they are.

A **VPN** (Virtual Private Network) is Layer 3 and above. It's an encrypted tunnel between two endpoints across a network you don't control — typically the public internet. The router or firewall does the work, not the switch.

The clean way to think about it:

```
OSI Model
─────────────────────────────────────────────────────
Layer 7  Application
Layer 6  Presentation
Layer 5  Session
Layer 4  Transport       ← VPN (IPsec / WireGuard / OpenVPN)
Layer 3  Network         ← VPN (tunnel endpoints, IP routing)
Layer 2  Data Link       ← VLAN (802.1Q tagging, broadcast domains)
Layer 1  Physical        (the actual cable or radio)
─────────────────────────────────────────────────────
```

One is about isolation *within* your network. The other is about security *across* an untrusted network. Neither replaces the other, because they're not playing the same game.

---

## What Is a VLAN and How Does It Work?

A VLAN creates logical network boundaries on a physical switch using 802.1Q tagging. When a frame leaves an access port and hits the trunk, the switch stamps a 4-byte VLAN tag into the Ethernet header. That tag follows the frame everywhere on the trunk, and devices in VLAN 50 are invisible to devices in VLAN 40 — not because of a firewall, but because the switch just doesn't forward frames between them.

The consequences of this are worth sitting with. A device on VLAN 50 can't send an ARP broadcast that reaches VLAN 40. It can't initiate a connection. It's not filtered — it's structurally isolated at Layer 2. Isolation that deep is hard to bypass.

For inter-VLAN routing to happen at all, a Layer 3 device has to be in the path. On my network that's OPNsense, running router-on-a-stick off a trunk port from the UniFi switch. Every packet that crosses VLAN boundaries goes through OPNsense, which means every cross-VLAN packet hits a firewall rule. The default policy is deny. Every allow is explicit.

### My VLAN Setup — 7 Segments, One Physical Network

My lab runs 7 VLANs on one UniFi switch:

| VLAN ID | Name | Subnet | Access Policy |
|---------|------|--------|---------------|
| 999 | Native | None | No IP addressing (VLAN hopping prevention) |
| 10 | Home | 10.10.0.0/24 | Trusted user devices; can reach VLAN 40 on specific ports |
| 20 | Malware | 10.20.0.0/24 | Fully isolated: no outbound, no inter-VLAN |
| 30 | Homelab | 10.30.0.0/24 | Lab/testing; can reach VLAN 40 for testing |
| 40 | Servers | 10.40.0.0/28 | Production; controlled inbound only |
| 50 | IoT | 10.50.0.0/24 | Internet-only (ports 80, 443, 53); no inter-VLAN |
| 99 | MGMT | 10.99.0.0/24 | Admin access only from specific workstation |

The trunk port configuration on the Cisco Catalyst carries all of them:

```
interface GigabitEthernet0/1
 description Trunk to OPNsense
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,50,99
 no shutdown
```

VLAN 999 as the native VLAN means untagged frames land there, which has no IP address and no routes. VLAN hopping via DTP or untagged frame injection goes nowhere useful. Access ports for IoT devices are explicitly assigned to VLAN 50. There's no path for a smart bulb to wander into VLAN 40.

{{< alert "warning" >}}
**The thing VLAN isolation does not do:** encrypt traffic. A device on VLAN 50 sends unencrypted traffic to its internet gateway. It's isolated from other VLANs, but the traffic itself isn't protected. Keep reading.
{{< /alert >}}

Here's how isolation levels break down across my VLANs — higher scores mean more restricted access:

<figure>
<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Horizontal bar chart showing isolation level by VLAN, with VLAN 20 (Malware) and VLAN 50 (IoT) having the highest isolation scores" style="width:100%;max-width:600px;background:transparent">
  <title>VLAN Isolation Level by Segment</title>
  <style>
    .label { font: 13px 'Fira Code', monospace; fill: #a0aec0; }
    .value { font: 12px 'Fira Code', monospace; fill: #e2e8f0; }
    .axis  { font: 11px monospace; fill: #718096; }
    .bar-20 { fill: #fc4f4f; }
    .bar-50 { fill: #5eead4; }
    .bar-40 { fill: #2dd4bf; }
    .bar-99 { fill: #14b8a6; }
    .bar-30 { fill: #0d9488; }
    .bar-10 { fill: #115e59; }
    .grid   { stroke: #2d3748; stroke-width: 1; }
  </style>
  <!-- Grid lines: bar area 165–575, each unit = 41px -->
  <line x1="165" y1="20" x2="165" y2="270" class="grid"/>
  <line x1="247" y1="20" x2="247" y2="270" class="grid"/>
  <line x1="329" y1="20" x2="329" y2="270" class="grid"/>
  <line x1="411" y1="20" x2="411" y2="270" class="grid"/>
  <line x1="493" y1="20" x2="493" y2="270" class="grid"/>
  <line x1="575" y1="20" x2="575" y2="270" class="grid"/>
  <!-- Axis labels -->
  <text x="165" y="285" text-anchor="middle" class="axis">0</text>
  <text x="247" y="285" text-anchor="middle" class="axis">2</text>
  <text x="329" y="285" text-anchor="middle" class="axis">4</text>
  <text x="411" y="285" text-anchor="middle" class="axis">6</text>
  <text x="493" y="285" text-anchor="middle" class="axis">8</text>
  <text x="575" y="285" text-anchor="middle" class="axis">10</text>
  <!-- VLAN 20: score 10 → 410px -->
  <text x="155" y="47" text-anchor="end" class="label">VLAN 20 / Malware</text>
  <rect x="165" y="33" width="410" height="20" class="bar-20" rx="2"/>
  <text x="583" y="47" class="value">10</text>
  <!-- VLAN 50: score 9 → 369px -->
  <text x="155" y="87" text-anchor="end" class="label">VLAN 50 / IoT</text>
  <rect x="165" y="73" width="369" height="20" class="bar-50" rx="2"/>
  <text x="542" y="87" class="value">9</text>
  <!-- VLAN 40: score 7 → 287px -->
  <text x="155" y="127" text-anchor="end" class="label">VLAN 40 / Servers</text>
  <rect x="165" y="113" width="287" height="20" class="bar-40" rx="2"/>
  <text x="460" y="127" class="value">7</text>
  <!-- VLAN 99: score 6 → 246px -->
  <text x="155" y="167" text-anchor="end" class="label">VLAN 99 / MGMT</text>
  <rect x="165" y="153" width="246" height="20" class="bar-99" rx="2"/>
  <text x="419" y="167" class="value">6</text>
  <!-- VLAN 30: score 4 → 164px -->
  <text x="155" y="207" text-anchor="end" class="label">VLAN 30 / Homelab</text>
  <rect x="165" y="193" width="164" height="20" class="bar-30" rx="2"/>
  <text x="337" y="207" class="value">4</text>
  <!-- VLAN 10: score 2 → 82px -->
  <text x="155" y="247" text-anchor="end" class="label">VLAN 10 / Home</text>
  <rect x="165" y="233" width="82" height="20" class="bar-10" rx="2"/>
  <text x="255" y="247" class="value">2</text>
</svg>
<figcaption style="font-size:0.8em;color:#737373;margin-top:4px">Isolation score by segment (0 = open, 10 = fully isolated). Original data from the lab's OPNsense firewall policy.</figcaption>
</figure>

---

## What Is a VPN and How Does It Work?

A VPN creates an encrypted tunnel between two endpoints. Your traffic is encapsulated and encrypted before it leaves your device, traverses the untrusted network as ciphertext, and decrypts at the other end. From the public network's perspective, all it sees is encrypted packets going to one destination.

There are two fundamentally different VPN architectures worth knowing:

- **Remote access VPN** — one device tunneling into a network. You're at a coffee shop; your laptop dials into your homelab. This is what most people mean when they say "I need a VPN."
- **Site-to-site VPN** — two networks connecting to each other permanently. Branch office to headquarters. Homelab to a cloud VPS. No individual client setup, just two routers with a tunnel between them.

As for protocol, three are worth knowing:

- **WireGuard** — modern, fast, small codebase (~4,000 lines vs OpenVPN's ~600,000). Handles key exchange with Curve25519. In benchmark testing on a Protectli VP6670 running OPNsense 25.7, WireGuard sustained 5,010 Mbps versus OpenVPN's 1,050 Mbps, a nearly 5x throughput advantage, with IPsec landing at 4,300 Mbps in between. *(Protectli Knowledge Base, September 2025, iPerf3 methodology)*
- **IPsec** — battle-tested, widely supported, slightly more complex to configure. High performance when using hardware offload. This is what enterprise site-to-site tunnels typically run.
- **OpenVPN** — slower, but runs over TCP if needed, which makes it firewall-friendly. Useful when you're behind a restrictive network that blocks UDP.

<figure>
<svg viewBox="0 0 560 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Horizontal bar chart comparing VPN protocol throughput: WireGuard 5010 Mbps, IPsec 4300 Mbps, OpenVPN 1050 Mbps" style="width:100%;max-width:560px;background:transparent">
  <title>VPN Protocol Throughput Comparison</title>
  <style>
    .bl { font: 13px 'Fira Code', monospace; fill: #a0aec0; }
    .bv { font: 12px 'Fira Code', monospace; fill: #e2e8f0; }
    .ba { font: 11px monospace; fill: #718096; }
    .grid2 { stroke: #2d3748; stroke-width: 1; }
  </style>
  <line x1="160" y1="20" x2="160" y2="155" class="grid2"/>
  <line x1="262" y1="20" x2="262" y2="155" class="grid2"/>
  <line x1="364" y1="20" x2="364" y2="155" class="grid2"/>
  <line x1="466" y1="20" x2="466" y2="155" class="grid2"/>
  <line x1="540" y1="20" x2="540" y2="155" class="grid2"/>
  <text x="160" y="168" text-anchor="middle" class="ba">0</text>
  <text x="262" y="168" text-anchor="middle" class="ba">1,250</text>
  <text x="364" y="168" text-anchor="middle" class="ba">2,500</text>
  <text x="466" y="168" text-anchor="middle" class="ba">3,750</text>
  <text x="540" y="168" text-anchor="middle" class="ba">5,010 Mbps</text>
  <!-- WireGuard -->
  <text x="150" y="47" text-anchor="end" class="bl">WireGuard</text>
  <rect x="160" y="33" width="380" height="22" fill="#5eead4" rx="2"/>
  <text x="548" y="47" class="bv">5,010</text>
  <!-- IPsec -->
  <text x="150" y="92" text-anchor="end" class="bl">IPsec (AES256)</text>
  <rect x="160" y="78" width="326" height="22" fill="#2dd4bf" rx="2"/>
  <text x="494" y="92" class="bv">4,300</text>
  <!-- OpenVPN -->
  <text x="150" y="137" text-anchor="end" class="bl">OpenVPN</text>
  <rect x="160" y="123" width="80" height="22" fill="#14b8a6" rx="2"/>
  <text x="248" y="137" class="bv">1,050</text>
</svg>
<figcaption style="font-size:0.8em;color:#737373;margin-top:4px">Throughput in Mbps on a Protectli VP6670, OPNsense 25.7, iPerf3 over 60-second runs. Source: <a href="https://kb.protectli.com/kb/vpn-performance-results/">Protectli Knowledge Base, September 2025</a>.</figcaption>
</figure>

### WireGuard on OPNsense — My Setup

I run WireGuard as a remote access server on my OPNsense box. When I'm on public WiFi — coffee shop, airport, hotel — my laptop connects to WireGuard first. All traffic routes through the tunnel back into my homelab before hitting the internet. The coffee shop's network sees one encrypted UDP stream to my home IP. Nothing else is visible.

The configuration is straightforward: WireGuard listens on UDP port 51820. Each peer gets a public/private keypair, and the server's config maps each peer's public key to the VLANs it's allowed to reach via `AllowedIPs`. My laptop peer has `AllowedIPs = 0.0.0.0/0` for full tunnel. A trusted friend who needs occasional access to a specific service would get a more restricted `AllowedIPs`.

The WireGuard interface terminates on OPNsense, which means VPN peers land in whatever VLAN OPNsense's firewall rules assign them. By default, authenticated WireGuard clients in my setup can only reach VLAN 40 (Servers) on specific ports. They can't wander into VLAN 20 or VLAN 50 just because they have a valid key.

---

## VPN vs VLAN — The Direct Comparison

They're not competing. They protect against different threats:

| Dimension | VLAN | VPN |
|-----------|------|-----|
| OSI Layer | Layer 2 | Layer 3–4 |
| Scope | Within your network | Across untrusted networks |
| Encryption | None | Yes (required) |
| Hardware required | Managed switch (802.1Q) | Router / firewall with VPN support |
| Primary use case | Device isolation, segmentation | Remote access, secure transit |
| Homelab example | IoT on VLAN 50, isolated from VLAN 40 | WireGuard for road warrior access |
| Complexity | Low–medium | Medium |
| What it can't do | Encrypt traffic, protect remote access | Isolate broadcast domains, segment internal traffic |

The mistake I see: *"I put my IoT devices on their own VLAN. They're secure."* Secure from what, exactly?

VLAN isolation means your smart bulb on VLAN 50 can't initiate a connection to your server on VLAN 40. That's real protection. But if that bulb has a vulnerability and gets compromised, its traffic to the internet is still unencrypted. An attacker who's already on your network and can sniff VLAN 50's egress traffic sees it in plaintext. VLAN doesn't help you there.

Conversely, if you're running WireGuard for remote access but no VLAN segmentation, all your devices are in the same broadcast domain. A compromised IoT device can see the same network as your production server. VPN doesn't help you there either.

---

## Can a VPN and VLAN Work Together?

Yes — and in a well-designed network, they do. Each covers what the other can't.

On my setup:

- VLAN 50 (IoT) keeps smart home devices off VLAN 40 (Servers). Layer 2 isolation enforced at the switch.
- WireGuard on OPNsense keeps my remote access encrypted regardless of what network I'm connecting from.
- OPNsense firewall rules control which VLANs WireGuard peers can reach. A VPN connection is not a blanket pass to the whole network.

The OPNsense inter-VLAN firewall rules that make this work look like this:

| Source | Destination | Protocol | Port | Action |
|--------|-------------|----------|------|--------|
| VLAN 50 (IoT) | any | TCP/UDP | 80, 443, 53 | Allow |
| VLAN 50 (IoT) | any internal | any | any | **Block** |
| WireGuard peers | VLAN 40 (Servers) | TCP | 22, 443, 8006 | Allow |
| WireGuard peers | VLAN 50 (IoT) | any | any | **Block** |
| WireGuard peers | VLAN 20 (Malware) | any | any | **Block** |
| any | any | any | any | **Block** (default) |

When I connect over WireGuard from a coffee shop, I land in a WireGuard interface that OPNsense treats like any other network interface. The firewall rules above decide what I can reach. IoT VLAN 50 is not on that list. Malware VLAN 20 is definitely not on that list.

The architecture: VLAN segmentation provides the internal trust boundaries. WireGuard provides the encrypted transport to cross an untrusted external network. OPNsense sits at the intersection and enforces both.

---

## When Should You Use a VLAN vs a VPN?

The question isn't which one — it's which problem you're solving right now.

**Use a VLAN when:**
- You want to isolate devices on the same physical network from each other
- You need to reduce broadcast traffic (large flat networks have broadcast storms)
- You're enforcing internal access policies (IoT away from servers, malware away from everything)
- The threat is internal lateral movement

**Use a VPN when:**
- You're connecting to your network from outside it
- You're on a network you don't control and don't trust
- You need encrypted transit between two physically separate networks
- The threat is eavesdropping on traffic in transit

**Use both when:**
- You want internal segmentation *and* secure remote access
- Your homelab has devices at different trust levels *and* you need to reach it remotely
- You want WireGuard peers to only access specific VLANs, not everything

A three-question shortcut:

```
Are you trying to separate devices on the same LAN?
  ├── Yes → VLAN
  └── No ↓

Are you connecting from outside your network?
  ├── Yes → VPN
  └── No ↓

Is the traffic crossing a public or untrusted network?
  ├── Yes → VPN
  └── No → Check whether you actually need anything at all
```

---

## Frequently Asked Questions

**Is a VLAN more secure than a VPN?**

They're not comparable — they secure different things. A VLAN is more effective than a VPN at isolating broadcast domains and preventing lateral movement inside your network. A VPN is more effective than a VLAN at protecting traffic in transit across untrusted networks. Running neither means you're exposed on both fronts. Running both means you've closed both gaps.

**Can you have a VPN inside a VLAN?**

Yes. A VPN client on VLAN 30 (Homelab) can initiate a WireGuard tunnel to the internet just like any other traffic. And separately, WireGuard terminates on OPNsense and can route authenticated peers into whatever VLAN the firewall rules specify. These two things are independent — where the client lives (VLAN) and how the remote access tunnel is routed (WireGuard config) are separate configuration concerns.

**Do I need a VPN if I already have a VLAN?**

If you ever access your network remotely or connect from public WiFi, yes. VLANs provide zero protection for traffic that's left your network. VLAN isolation is entirely an internal construct — it stops at your router's WAN interface. Once your traffic hits the public internet, the VLAN tag is gone and the traffic is whatever protocol you're running, encrypted or not.

**What hardware do I need to use VLANs?**

A managed switch that supports IEEE 802.1Q VLAN tagging. Unmanaged switches cannot do VLANs — they just forward all frames to all ports. On the routing side, any router or firewall that supports subinterfaces or VLAN-aware interfaces will work — OPNsense, pfSense, VyOS, Cisco IOS, and most prosumer routers handle this. For WireGuard specifically, OPNsense has built-in WireGuard support as of 23.1.

**Does WireGuard work with VLANs?**

Yes. WireGuard is a network interface from the OS's perspective, and OPNsense treats it like any other interface with firewall rules attached. You configure `AllowedIPs` on each peer to control what subnets they can route to, and OPNsense's firewall rules control inter-VLAN access for WireGuard peers the same way it controls access for any other source. The two systems compose cleanly.

---

## Where This Goes From Here

VLAN = Layer 2, enforced by the switch, no encryption, internal isolation.
VPN = Layer 3+, enforced by the firewall, encrypted tunnel, external transit security.

Neither replaces the other. They're doing different things at different layers of the stack.

If you want to see the full VLAN architecture this is based on, the [VLAN segmentation project writeup](/projects/vlan-segmentation) has the before/after topology, the full firewall rules matrix, and the configuration examples. For the homelab stack context, the [lab overview](/docs/lab/overview) shows how everything fits together — Proxmox, OPNsense, UniFi, and where the WireGuard endpoint lives.

If you came here from the reel: that's the whole thing, expanded. The switch enforces the VLANs. OPNsense enforces the routing and the firewall rules. WireGuard handles the encrypted tunnel from outside. They're not competing — they're stacked.
