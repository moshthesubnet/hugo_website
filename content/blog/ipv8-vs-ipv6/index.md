---
title: "IPv8 Wants to Replace IPv6. Here's Why It Probably Won't."
aliases: ["/posts/ipv8-vs-ipv6/"]
date: 2026-05-03
lastmod: 2026-05-03
draft: false
description: "A new IETF draft proposes IPv8 with 64-bit addresses and IPv4 backward compatibility. Can it succeed where IPv6's 28-year climb to 50% adoption stalled?"
summary: "On March 28, 2026, IPv6 carried more than half of Google's traffic for the first time — 28 years after RFC 2460. Two weeks later, an IETF draft for IPv8 hit Hacker News. Here's what IPv8 actually proposes, why IPv6 took so long, and why IPv8 is unlikely to do better."
coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&q=80"
coverImageAlt: "Server room rack filled with glowing network cables and blinking port indicators in a data center"
tags:
  - networking
  - ipv6
  - ipv8
  - ietf
  - protocols
  - bgp
  - ccna
images: ["/blog/ipv8-vs-ipv6/feature.png"]
---

*By [Skyler King](/docs/bio/) — CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*

{{< figure
  src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&q=80"
  alt="Server room rack filled with glowing network cables and blinking port indicators in a data center"
  caption="The infrastructure IPv6 took 28 years to fully reach. IPv8 wants to start over."
>}}

On March 28, 2026, IPv6 carried more than 50% of Google's measured internet traffic for the first time. Twenty-eight years after RFC 2460. The next day, it slipped back below the line.

Two weeks later, a solo engineer at a Bermuda company filed a 10-document IETF draft proposing an entirely new IP version. IPv8. It hit the Hacker News front page with 134 upvotes and 111 mostly skeptical comments. GPTZero flagged the draft itself at 76% probability of being AI-generated ([Cybernews](https://cybernews.com/tech/ipv8-proposal-slammed-by-tech-professionals/), 2026).

IPv6 dual-stack is on the CCNA exam. I know the theory cold — the address structure, the transition mechanisms, the reasons it was supposed to replace IPv4 by now. But studying a protocol that's been "in transition" for 28 years teaches you something the spec doesn't: adoption is never just a technical problem. So when a new IP protocol shows up claiming to fix everything IPv6 got wrong, I want to take it seriously. After reading the draft, the HN thread, and the adoption data, I think IPv8 is unlikely to go anywhere — but for reasons that are more interesting than "the spec has bugs."

{{< alert >}}
**TL;DR:** IPv8 is an individual IETF draft (April 2026) proposing 64-bit addresses with full IPv4 backward compatibility, bounded BGP routing tables, and Layer 3 OAuth2 authentication. IPv6 reached 50.10% of Google's traffic for the first time on March 28, 2026 — 28 years after RFC 2460 ([Internet Society Pulse](https://pulse.internetsociety.org/en/blog/2026/04/18-years-later-ipv6-reaches-majority/), 2026). IPv8 has no working group, no vendor support, and architectural problems that would block standardization. IPv6 didn't fail. NAT succeeded.
{{< /alert >}}

---

## What does IPv8 actually propose?

IPv8 is `draft-thain-ipv8-02`, filed April 14, 2026 and revised three days later. It's a 10-document protocol suite from a single author with no IETF working group sponsorship, no Area Director, and an expiration date of October 19, 2026 ([IETF Datatracker](https://datatracker.ietf.org/doc/draft-thain-ipv8/), 2026). The core draft proposes extending the IPv4 header by 8 octets to support 64-bit addresses structured as `r.r.r.r.n.n.n.n` — a 32-bit ASN-derived routing prefix followed by a 32-bit IPv4-compatible host address.

The headline claim: any IPv4 address is a valid IPv8 address with the routing prefix set to `0.0.0.0`. IPv4 is positioned as a mathematical subset of IPv8, not a separate protocol that needs translating. If true, that solves a real problem — the dual-stack operational tax that has slowed IPv6 deployment for two decades.

The companion specs go further. They define a unified Zone Server platform combining DHCP8, DNS8, NTP8, OAuth2 token caching, WHOIS8, ACL8, and NetLog8 — replacing the current fragmented mess of separate DHCP servers, DNS resolvers, NTP daemons, and firewall ACLs. They also specify BGP8 with mandatory WHOIS8 route validation, a Cost Factor (CF) routing metric that combines latency, loss, stability, capacity, and geographic distance, and a hard /16 minimum prefix rule that would compress today's 1 million+ BGP routing entries down to roughly one entry per origin AS — about 80,000 today ([CIDR Report](https://www.cidr-report.org/as2.0/), April 2026).

The most architecturally novel piece is mandatory OAuth2 JWT authentication at Layer 3. Every packet would carry a token. Every ingress would validate it. Authentication moves from the application layer down into the network itself.

It's an ambitious design. It is also, in its current form, almost certainly going nowhere. The reasons why are worth understanding.

---

## Why has IPv6 adoption been so slow?

IPv6 was first specified in RFC 1883 in December 1995 and finalized in RFC 2460 three years later. As of April 2026, multi-source measurements place global adoption between 40% and 50%, depending on whose ruler you use — Google measures 50.10%, APNIC 43.13%, Cloudflare 40.1% ([The Register](https://www.theregister.com/2026/04/17/ipv6_50_percent_google/), 2026). APNIC Labs projects that at current trajectories, universal adoption arrives around 2045.

That's a 50-year ramp for a protocol that was supposed to save the internet from running out of addresses.

<figure style="margin: 2.5rem 0; text-align: center;">
<svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; background: transparent;">
  <style>
    .axis { stroke: #6b7280; stroke-width: 1; }
    .label { fill: #e5e7eb; font-family: system-ui, sans-serif; font-size: 12px; }
    .label-bold { fill: #f3f4f6; font-family: system-ui, sans-serif; font-size: 13px; font-weight: 600; }
    .bar { fill: #5eead4; }
    .bar-low { fill: #5eead4; opacity: 0.45; }
    .pct { fill: #f9fafb; font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; }
    .title { fill: #f9fafb; font-family: Georgia, serif; font-size: 14px; font-weight: 600; }
  </style>
  <text x="20" y="22" class="title">IPv6 adoption by country/region (April 2026)</text>
  <line x1="160" y1="50" x2="160" y2="320" class="axis"/>
  <line x1="160" y1="320" x2="580" y2="320" class="axis"/>
  <text x="155" y="74" text-anchor="end" class="label-bold">France</text>
  <rect x="160" y="62" width="328" height="18" class="bar"/>
  <text x="492" y="76" class="pct">78%</text>
  <text x="155" y="104" text-anchor="end" class="label-bold">Germany</text>
  <rect x="160" y="92" width="319" height="18" class="bar"/>
  <text x="483" y="106" class="pct">76%</text>
  <text x="155" y="134" text-anchor="end" class="label-bold">India</text>
  <rect x="160" y="122" width="315" height="18" class="bar"/>
  <text x="479" y="136" class="pct">75%</text>
  <text x="155" y="164" text-anchor="end" class="label-bold">United States</text>
  <rect x="160" y="152" width="218" height="18" class="bar"/>
  <text x="382" y="166" class="pct">52%</text>
  <text x="155" y="194" text-anchor="end" class="label-bold">APNIC region</text>
  <rect x="160" y="182" width="210" height="18" class="bar"/>
  <text x="374" y="196" class="pct">50%</text>
  <text x="155" y="224" text-anchor="end" class="label-bold">LACNIC region</text>
  <rect x="160" y="212" width="164" height="18" class="bar-low"/>
  <text x="328" y="226" class="pct">39%</text>
  <text x="155" y="254" text-anchor="end" class="label-bold">RIPE NCC region</text>
  <rect x="160" y="242" width="118" height="18" class="bar-low"/>
  <text x="282" y="256" class="pct">28%</text>
  <text x="155" y="284" text-anchor="end" class="label-bold">AFRINIC region</text>
  <rect x="160" y="272" width="17" height="18" class="bar-low"/>
  <text x="181" y="286" class="pct">4%</text>
  <text x="160" y="340" class="label">0%</text>
  <text x="265" y="340" class="label">25%</text>
  <text x="370" y="340" class="label">50%</text>
  <text x="475" y="340" class="label">75%</text>
</svg>
<figcaption style="font-size: 0.85rem; color: #9ca3af; margin-top: 0.5rem;">Source: <a href="https://stats.labs.apnic.net/ipv6/" style="color: #5eead4;">APNIC Labs IPv6 Measurement</a> and <a href="https://pulse.internetsociety.org/en/blog/2026/04/18-years-later-ipv6-reaches-majority/" style="color: #5eead4;">Internet Society Pulse</a> (April 2026)</figcaption>
</figure>

The standard explanation is that IPv6 is technically harder, breaks too many things, and got rolled out badly. That's all true. It's also not the real story.

The real story is NAT. IPv6 was designed to solve IPv4 address exhaustion. By the time exhaustion became acute, NAT had already turned address exhaustion from a crisis into a budget line item. ISPs deployed Carrier-Grade NAT. Enterprises ran private RFC 1918 ranges behind their firewalls. The forcing function evaporated.

Once the burning platform stopped burning, the rest of the friction had time to compound. Enterprise application owners discovered that most of their stack was still IPv4-only and would stay that way through the next refresh cycle. Hardware refresh cycles take 10 to 20 years in serious infrastructure. Dual-stack deployment doubled operational complexity, and most teams ran both protocols indefinitely rather than ever completing the cutover. IPv4 addresses that traded for around $5 in 2011 now sell in the $50–60 range — a working secondary market that pays holders to sit on them, not migrate ([ipxo.com](https://www.ipxo.com/), 2025).

There's geography on top of all that. Mobile carriers — building greenfield networks on a tight timeline — lead the curve, sitting well above the global average. Enterprises lag well below it. France and Germany are above 75%. Africa averages 4%. There is no single "IPv6 adoption rate." There are dozens of curves moving at different speeds, and the network engineers managing them are doing it on top of [a workforce crisis](/blog/network-engineering-talent-void/) that's pulling institutional knowledge out the door faster than it's coming in.

This is the context IPv8 walks into. The technical critique of IPv6 is largely correct. The economic critique of IPv6 is what actually matters. IPv8 has very little to say about the economic critique.

---

## What happened to the protocols that didn't become IPv6?

When the IETF picked IPv6 in the early 1990s through the IPng (IP Next Generation) selection process, it evaluated three serious candidates: TUBA (TCP and UDP with Bigger Addresses), built on ISO CLNP with 20-byte addresses; CATNIP (Common Architecture for the Internet), an attempt to unify CLNP, IP, and IPX; and SIPP (Simple Internet Protocol Plus), the 128-bit proposal that won and became IPv6 ([LACNIC](https://blog.lacnic.net/en/ipv6-internet/)).

TUBA and CATNIP didn't fail because they were technically wrong. They failed because they didn't have a coalition.

SIPP won because it had vendor commitment, an industry working group, and a migration story that didn't require throwing out the existing IP architecture. The losing proposals were architecturally interesting and technically defensible. Today nobody remembers their names. That's the fate of an unsponsored protocol draft, no matter how clever the design.

This is the hardest lesson for anyone building a new protocol from outside the IETF process: protocol selection is a political and economic problem dressed up in technical specs. You don't win on the merits. You win because Cisco, Juniper, Microsoft, the Linux kernel maintainers, AWS, and a half-dozen national ISPs have all agreed in advance to ship your protocol on the same calendar. Without that coalition, your draft expires in six months and disappears into the IETF archives, joining TUBA and CATNIP in a graveyard most of the industry never knew existed.

IPv8 currently has zero of those signatures. One author. No working group. No vendor commitments. The draft expires in October.

---

## What does IPv8 actually get right?

I want to be fair to the proposal because the diagnosis is partly correct. IPv6's two original sins are real. First, it broke backward compatibility on day one — every IPv4 NAT box, firewall, and ACL needed to be replaced or dual-stacked. Second, the BGP routing table grows unboundedly because there's no architectural limit on prefix deaggregation, and operators announce more-specifics for traffic engineering, anycast, and DDoS scrubbing. Both are genuine, expensive, ongoing problems. IPv8 attempts to solve both.

The "IPv4 is a subset" framing is the most architecturally interesting idea in the draft. If a protocol can be adopted incrementally without flag days and without dual-stack, the migration economics change fundamentally. IPv6 chose a clean break and paid for it for 30 years. A protocol that doesn't require the break wouldn't repeat that mistake.

The bounded routing table is also a real structural fix. Today's BGP table sits north of 1 million prefixes and grows continuously, while only about 80,000 ASNs are actually announcing routes ([CIDR Report](https://www.cidr-report.org/as2.0/), April 2026). IPv8's "one entry per ASN" rule would compress those million prefixes down to roughly 80,000 — a ~13× reduction — because the address itself encodes the AS. Whether that's a *good* fix is a separate question (more on that below), but as a piece of structural reasoning, it correctly identifies a real long-term scaling problem.

{{< figure
  src="https://plus.unsplash.com/premium_photo-1682145181120-73cfdfc8a36d?w=1200&h=630&fit=crop&q=80"
  alt="Blue fiber optic cables inserted into ports of a network switch panel inside a server rack"
  caption="The unbounded BGP routing table is the kind of problem you only notice when you try to fit it on a router."
>}}

The Zone Server concept — collapsing DHCP, DNS, NTP, OAuth, WHOIS, ACL, and logging into a single managed plane — makes operational sense. Anyone who's built [a homelab inventory by stitching together OPNsense, Proxmox, and Docker APIs](/blog/cross-vlan-network-monitor/) has felt the pain of fragmented network management. Unifying those services isn't crazy. It's how every cloud provider already runs their internal network plane. The draft is just proposing to standardize that pattern as part of the IP suite itself.

The 8to4 tunneling story is also more honest than IPv6's. There is no flag day. There is no required dual-stack period. Whether the implementation actually delivers on that is a different question, but the framing is correct.

The diagnosis is good. The treatment is where it falls apart.

---

## Where does IPv8 break down?

The Hacker News thread on IPv8 ran 111 comments, most of them critical, and the criticisms cluster around six specific architectural problems. Any one of them would be enough to stall the draft in working group review. Together, they describe something that needs a significant redesign.

### The OAuth2 bootstrapping problem

Mandatory OAuth2 JWT at Layer 3 means every host needs a token to authenticate, and to get a token it needs to make a network request. This is a chicken-and-egg loop that the draft doesn't resolve. DHCP solves a similar problem only because the request is a Layer 2 broadcast that doesn't require routing or authentication. Putting OAuth2 below the layer where authentication has historically lived breaks the bootstrap path for every new device on the network. There are partial fixes (pre-shared tokens, out-of-band provisioning), but none of them are in the spec, and all of them re-introduce the management complexity that Layer 3 auth was supposed to eliminate.

### Mandating Cisco PVRST

The draft specifies Cisco's Per-VLAN Rapid Spanning Tree as a required element. IETF standards have to be implementable from open specifications without proprietary dependencies. This single requirement disqualifies the draft from advancing in its current form. Either it gets removed, or the draft does.

### The /16 minimum prefix kills traffic engineering

Modern BGP relies heavily on deaggregation. Anycast services (root DNS, CDN edges) announce more-specific prefixes to influence which path traffic takes. Load balancers split traffic by announcing different /24s from different peers. DDoS mitigation routes attack traffic to scrubbing centers by announcing temporary more-specifics. A mandatory /16 minimum eliminates all of this. The structural fix to BGP table growth comes at the cost of every traffic engineering tool the modern internet relies on.

### Conflating routing with identity breaks multihoming

If your routing prefix is derived from your ASN, you can't easily multihome through two providers, you can't switch ISPs without renumbering, and your identity is permanently tied to your routing. This is the same problem IPv6 wrestled with for years before settling on Provider-Independent address space. IPv8's design appears to make PI addressing structurally impossible.

### 64-bit addresses re-introduce a problem IPv6 already solved

IPv6 chose 128-bit addresses specifically because 64-bit was considered marginal at the scale of an internet that includes IoT, cellular, and possibly interplanetary networking. IPv8's 64-bit space gives you about 18.4 quintillion addresses, which sounds like a lot until you remember that's only 4 billion times the IPv4 space — perfectly fine until it isn't. Designing a successor protocol to land in roughly the same address-space neighborhood your predecessor explicitly rejected is a hard sell.

<div style="margin: 2.5rem 0; overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse; font-size: 0.92rem;">
<thead>
<tr style="border-bottom: 2px solid #5eead4;">
<th style="text-align: left; padding: 0.6rem;">Property</th>
<th style="text-align: left; padding: 0.6rem;">IPv4</th>
<th style="text-align: left; padding: 0.6rem;">IPv6</th>
<th style="text-align: left; padding: 0.6rem;">IPv8 (draft)</th>
</tr>
</thead>
<tbody>
<tr style="border-bottom: 1px solid #374151;"><td style="padding: 0.5rem;">Address bits</td><td style="padding: 0.5rem;">32</td><td style="padding: 0.5rem;">128</td><td style="padding: 0.5rem;">64</td></tr>
<tr style="border-bottom: 1px solid #374151;"><td style="padding: 0.5rem;">Total addresses</td><td style="padding: 0.5rem;">4.3B</td><td style="padding: 0.5rem;">340 undecillion</td><td style="padding: 0.5rem;">18.4 quintillion</td></tr>
<tr style="border-bottom: 1px solid #374151;"><td style="padding: 0.5rem;">IPv4 compatible</td><td style="padding: 0.5rem;">—</td><td style="padding: 0.5rem;">No (dual-stack)</td><td style="padding: 0.5rem;">Yes (claimed subset)</td></tr>
<tr style="border-bottom: 1px solid #374151;"><td style="padding: 0.5rem;">Year specified</td><td style="padding: 0.5rem;">1981</td><td style="padding: 0.5rem;">1995/1998</td><td style="padding: 0.5rem;">2026 (draft)</td></tr>
<tr style="border-bottom: 1px solid #374151;"><td style="padding: 0.5rem;">Global deployment*</td><td style="padding: 0.5rem;">~50–57% traffic</td><td style="padding: 0.5rem;">43–50% traffic</td><td style="padding: 0.5rem;">0%</td></tr>
<tr style="border-bottom: 1px solid #374151;"><td style="padding: 0.5rem;">IETF status</td><td style="padding: 0.5rem;">RFC 791</td><td style="padding: 0.5rem;">RFC 8200</td><td style="padding: 0.5rem;">Individual draft</td></tr>
<tr><td style="padding: 0.5rem;">BGP routing</td><td style="padding: 0.5rem;">Unbounded</td><td style="padding: 0.5rem;">Unbounded</td><td style="padding: 0.5rem;">~1 entry per ASN</td></tr>
</tbody>
</table>
<p style="font-size: 0.85rem; color: #9ca3af; margin-top: 0.5rem; text-align: center;">Sources: RFC 791, RFC 8200, draft-thain-ipv8-02. *Deployment % from <a href="https://pulse.internetsociety.org/en/blog/2026/04/18-years-later-ipv6-reaches-majority/" style="color: #5eead4;">Internet Society Pulse</a>, <a href="https://stats.labs.apnic.net/ipv6/" style="color: #5eead4;">APNIC Labs</a>, and <a href="https://www.theregister.com/2026/04/17/ipv6_50_percent_google/" style="color: #5eead4;">The Register</a> (April 2026); IPv4 share derived as the inverse of IPv6 measurements across the same sources.</p>
</div>

### Centralized Zone Servers re-introduce single points of failure

Distributed systems have spent 30 years moving away from centralized management planes for a reason. The Zone Server concept solves coordination problems by introducing a coordinator. That coordinator becomes the new failure mode.

And then there's the AI-generation question. Cybernews ran the draft through GPTZero and reported a 76% overall probability that it was AI-generated ([Cybernews](https://cybernews.com/tech/ipv8-proposal-slammed-by-tech-professionals/), 2026; also discussed by [CellStream](https://www.cellstream.com/2026/05/02/ip-version-clarification-and-ipv8/)). I want to be careful here: probabilistic detectors are not proof, and even if the prose was AI-assisted, the ideas can still be evaluated on their merits. But the surface-knowledgeable / depth-thin pattern that several HN reviewers noted lines up with what AI-assisted drafts often look like. Real protocol work has the texture of a thousand hours of operational experience pressed into a spec. This draft reads like a thoughtful first pass by someone who has read about the problems but hasn't lived inside them long enough to know which trade-offs are load-bearing.

That texture matters for IETF adoption. Working groups don't take drafts seriously without practitioner buy-in. Practitioners don't buy in without seeing the kind of detail that comes from operational scars.

---

## Will IPv8 suffer the same fate as IPv6?

IPv8 will probably fare worse than IPv6. IPv6 at least made it onto the standards track with full IETF backing, multi-vendor implementation, and OS-level support. IPv8 has none of that. The path from individual draft to deployed RFC runs through working group adoption, IETF Last Call, RFC Editor processing, and years of multi-organization implementation work. Without a working group, IPv8 doesn't have a vehicle. The draft expires in October 2026 unless someone picks it up.

But the question worth asking isn't "will IPv8 succeed?" It's "could *any* IP-layer successor protocol succeed right now?"

I don't think one could. Here's why.

For a new IP protocol to displace IPv6, you need a working group with genuine multi-vendor buy-in, OS support committed before the standard is finalized, at least one major cloud provider running production traffic, and migration tooling with no flag day. Those four are hard but not impossible.

The fifth is where every successor protocol breaks: an economic forcing function that CGNAT can't defuse. IPv4 exhaustion was supposed to be the forcing function for IPv6. NAT defused it. Today, with CGNAT widespread and IPv4 addresses commoditized in a working secondary market, there is no equivalent crisis waiting to drive a third transition. IPv8 doesn't solve a crisis. It improves on IPv6 in ways that don't create urgency.

<figure style="margin: 2.5rem 0; text-align: center;">
<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
  <style>
    .axis2 { stroke: #6b7280; stroke-width: 1; }
    .grid2 { stroke: #374151; stroke-width: 0.5; stroke-dasharray: 2 3; }
    .label2 { fill: #e5e7eb; font-family: system-ui, sans-serif; font-size: 11px; }
    .label2-bold { fill: #f3f4f6; font-family: system-ui, sans-serif; font-size: 12px; font-weight: 600; }
    .line2 { fill: none; stroke: #5eead4; stroke-width: 2.5; }
    .dot2 { fill: #5eead4; }
    .pct2 { fill: #f9fafb; font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; }
    .title2 { fill: #f9fafb; font-family: Georgia, serif; font-size: 14px; font-weight: 600; }
  </style>
  <text x="20" y="22" class="title2">IPv4 address market price ($/address)</text>
  <line x1="60" y1="50" x2="60" y2="260" class="axis2"/>
  <line x1="60" y1="260" x2="580" y2="260" class="axis2"/>
  <line x1="60" y1="100" x2="580" y2="100" class="grid2"/>
  <line x1="60" y1="153" x2="580" y2="153" class="grid2"/>
  <line x1="60" y1="207" x2="580" y2="207" class="grid2"/>
  <text x="50" y="105" text-anchor="end" class="label2">$60</text>
  <text x="50" y="158" text-anchor="end" class="label2">$40</text>
  <text x="50" y="212" text-anchor="end" class="label2">$20</text>
  <text x="50" y="265" text-anchor="end" class="label2">$0</text>
  <polyline class="line2" points="100,247 230,180 360,113 490,100"/>
  <circle cx="100" cy="247" r="5" class="dot2"/>
  <circle cx="230" cy="180" r="5" class="dot2"/>
  <circle cx="360" cy="113" r="5" class="dot2"/>
  <circle cx="490" cy="100" r="5" class="dot2"/>
  <text x="100" y="285" text-anchor="middle" class="label2-bold">2011</text>
  <text x="100" y="237" text-anchor="middle" class="pct2">$5</text>
  <text x="230" y="285" text-anchor="middle" class="label2-bold">2019</text>
  <text x="230" y="170" text-anchor="middle" class="pct2">$30</text>
  <text x="360" y="285" text-anchor="middle" class="label2-bold">2024</text>
  <text x="360" y="103" text-anchor="middle" class="pct2">$55</text>
  <text x="490" y="285" text-anchor="middle" class="label2-bold">2025</text>
  <text x="490" y="90" text-anchor="middle" class="pct2">$60</text>
</svg>
<figcaption style="font-size: 0.85rem; color: #9ca3af; margin-top: 0.5rem;">Source: <a href="https://www.ipxo.com/" style="color: #5eead4;">ipxo.com</a> — industry estimates aggregated from secondary-market reports (2025). The price climb is the failed forcing function.</figcaption>
</figure>

That last paragraph is the contrarian read I want to leave you with. IPv6 didn't fail. NAT succeeded. The crisis IPv6 was designed to solve got resolved by a workaround that turned out to be operationally cheaper than the official transition path. IPv6 deployment then ran on the slower clock of organic adoption, vendor enablement, and infrastructure refresh — and that clock runs in decades, not years.

IPv8 is showing up at the bottom of the same trough. There is no exhaustion crisis to ride. There is no vendor coalition pushing it. The economic case for re-plumbing the internet for a 13× routing table reduction and unified DHCP/DNS isn't there. It's a nice-to-have technical improvement in a market that doesn't reward nice-to-have technical improvements at the IP layer.

---

## What would actually have to be true for any IP successor to work?

If I were trying to build the protocol that *does* eventually replace IPv6 — and I'm not, but if I were — I'd start by accepting that the problem isn't technical. It's the coalition.

The working group has to exist before the spec is final. At least one major cloud provider commits to production traffic within 24 months of standardization. Linux, Windows, and the major mobile OSes all ship it simultaneously, by prior agreement. No flag day. No required dual-stack period. No broken tooling. And the forcing function has to be something CGNAT can't defuse — a security crisis, a routing collapse, a regulatory mandate, or a hardware refresh cycle operators were already planning.

That's the bar IPv6 met partially and IPv8 meets not at all.

The closest thing to a viable post-IPv6 future I can see isn't a new IP version. It's incremental evolution of IPv6 — better address allocation policy, BGP improvements, segment routing, eVPN, network slicing — riding on the IPv6 substrate that is finally, slowly, becoming the default. The infrastructure dollars are flowing toward making IPv6 work, not toward replacing it. Mobile-first deployments, hyperscaler backbones, and most greenfield enterprise networks are IPv6-default already.

If IPv8's good ideas (routing table compression, unified management, IPv4 backward compatibility) are going to live anywhere, they'll live as IETF extensions to existing protocols, contributed by the author with co-sponsorship from major operators. Not as a new IP version. The graveyard for new IP versions is already full.

---

## Frequently Asked Questions

### What is IPv8?

IPv8 is an IETF individual draft (`draft-thain-ipv8`) filed in April 2026 by an engineer at One Limited in Bermuda. It proposes a new IP protocol with 64-bit addresses structured as a routing prefix plus an IPv4-compatible host address, claiming any IPv4 address is a valid IPv8 address with the routing prefix set to zero. The draft has no IETF working group sponsorship and expires October 19, 2026 ([IETF Datatracker](https://datatracker.ietf.org/doc/draft-thain-ipv8/), 2026).

### Is IPv8 a real standard?

No. IPv8 exists as an individual IETF draft, not an adopted standard. There is no working group, no vendor implementation, no OS support, and no production deployment anywhere. Individual drafts can be filed by anyone and expire after six months without action. Cybernews reported that GPTZero flagged the draft itself at 76% probability of being AI-generated ([Cybernews](https://cybernews.com/tech/ipv8-proposal-slammed-by-tech-professionals/), 2026), which doesn't invalidate the ideas but raises legitimate questions about expertise depth.

### Will IPv8 replace IPv6?

Almost certainly not. IPv8 has no IETF working group, no vendor commitments, and architectural problems (Layer 3 OAuth2 bootstrapping, Cisco PVRST mandate, /16 minimum killing traffic engineering) that would block standardization. IPv6 took 28 years to reach 50% of Google's traffic with full IETF backing. IPv8 starts with none of that backing, so even a successful version would face a steeper climb.

### Why has IPv6 adoption been so slow?

Three reasons dominate. NAT (Network Address Translation) defused the IPv4 exhaustion crisis that was meant to force migration. Enterprise infrastructure refresh cycles take 10–20 years. And IPv6 broke backward compatibility with IPv4 on day one, requiring dual-stack deployments that doubled operational complexity. As of April 2026, global IPv6 adoption sits between 40% and 50% depending on methodology ([Internet Society Pulse](https://pulse.internetsociety.org/en/blog/2026/04/18-years-later-ipv6-reaches-majority/), 2026).

### What happened to IPv5?

IPv5 was assigned to the Internet Stream Protocol (ST and ST-II), an experimental real-time streaming protocol developed in the 1980s. It was never deployed at internet scale and is sometimes called "the IP version that wasn't." When the IETF chose the next IP version after IPv4, they skipped to IPv6 to avoid confusion with the existing IPv5 assignment ([LACNIC](https://blog.lacnic.net/en/ipv6-internet/)).

---

## The takeaway

- IPv8 is one engineer's draft, not a standard. Treat it as a thought experiment.
- The diagnosis is partly right — backward compatibility and unbounded BGP growth are real problems IPv6 never solved cleanly.
- The treatment has at least six architectural problems serious enough to block standardization as written.
- IPv6 didn't fail. NAT succeeded. The exhaustion crisis got patched by something operationally cheaper than the fix.
- Without a forcing function CGNAT can't defuse, no IP successor — IPv8 or otherwise — goes anywhere.

The internet upgrades its plumbing on geologic time. IPv6 took 28 years to reach majority on a single day. Any serious IPv8 conversation should be scheduled for around 2055 — and the thing that finally replaces IPv6 will probably look more like an IPv6 extension than a new IP version.

If you're a network engineer wrestling with where to put your time: IPv6 is still the answer. The dual-stack tax is real, but it's the tax you have to pay. IPv8 is interesting reading. It is not, yet, infrastructure.

If you want the broader context for why this transition is hitting now, my piece on [the coming network engineering talent void](/blog/network-engineering-talent-void/) covers the workforce side of the problem — the people who would have to migrate the next protocol are retiring, and the apprenticeship pipeline that taught them isn't producing replacements at scale. That's the slower crisis, and it'll shape what any successor protocol can realistically do.
