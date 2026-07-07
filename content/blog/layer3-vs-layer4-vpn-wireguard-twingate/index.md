---
title: "Layer 3 vs Layer 4 VPN: What's the Actual Difference?"
aliases: ["/posts/layer3-vs-layer4-vpn-wireguard-twingate/"]
date: 2026-03-13
draft: false
description: "Layer 3 VPNs (WireGuard) assign a virtual IP and put you on the network. Layer 4 ZTNA (TwinGate) brokers per-resource access with no IP assigned. Real lab breakdown with diagrams."
summary: "WireGuard and TwinGate both call themselves VPNs. One gives you a network interface and full subnet access. The other gives you a single door. Here's what that means for your lab and for anyone else you hand access to."
coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=630&fit=crop&q=80"
coverImageAlt: "Close-up of a silver padlock resting on a dark keyboard, symbolizing network access control and security"
tags: ["vpn", "wireguard", "ztna", "twingate", "networking", "homelab", "security", "ccna"]
images: ["/blog/layer3-vs-layer4-vpn-wireguard-twingate/feature.png"]
---

*By [Skyler King](/docs/bio/), CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*

{{< alert >}}
**TL;DR: The one-line version:**

| | WireGuard (Layer 3) | TwinGate (Layer 4) |
|---|---|---|
| **OSI Layer** | 3 (Network) | 4 (Transport) |
| **Virtual Interface** | Yes (`wg0`) | No |
| **IP Assigned** | Yes | No |
| **What You Can Reach** | Full subnet (`AllowedIPs`) | Defined resources only |
| **Access Control** | Firewall rules (external) | Connector policy (built-in) |
| **Blast Radius if Compromised** | Full `/24` (up to 254 hosts) | One port |
{{< /alert >}}

The word "VPN" is pulling double duty. WireGuard and TwinGate both use it. They don't work the same way, give you the same access scope, or fail the same way when credentials are compromised. One puts you on the network. The other puts you at a resource.

I'm CCNA certified and run both in my homelab — WireGuard for my own admin access, TwinGate for controlled external access to specific services. This post is the depth behind [a reel I made](https://www.instagram.com/moshthesubnet/) breaking down the architectural difference in 45 seconds. If you came from there: this is the why.

---

## What's the Difference Between a Layer 3 and Layer 4 VPN?

The OSI layer a VPN operates at determines what the connecting client actually gets: a presence on the network, or access to a specific service. Layer 3 assigns a virtual IP and routes traffic as if the client is a member of the network. Layer 4 proxies individual TCP/UDP sessions without creating a network interface at all — and the client never joins the network in any routing sense.

The naming confusion runs deeper than marketing. Technically, WireGuard is a Layer 3 VPN: it operates at the network layer, routes IP packets, and gives the connected peer a logical address on the subnet. TwinGate is a Layer 4 VPN — or more precisely, a Zero Trust Network Access (ZTNA) solution — that brokers sessions at the transport layer with no Layer 3 participation.

```
OSI Model
──────────────────────────────────────────────────────
Layer 4  Transport     ← ZTNA (TwinGate — per-session, no IP assigned)
Layer 3  Network       ← Layer 3 VPN (WireGuard — virtual IP, full subnet routing)
──────────────────────────────────────────────────────
```

Neither is more secure in the abstract. They solve different access problems, for different users, with different risk profiles.

{{< figure
  src="diagram-01-hook.png"
  alt="Two side-by-side boxes on a dark background: Layer 3 labeled WireGuard in green and Layer 4 labeled TwinGate in blue"
  caption="Same word. Different layer. Different access scope."
>}}

---

## What Is a Layer 3 VPN? WireGuard Explained

A Layer 3 VPN creates a virtual network interface on your device and routes IP packets through an encrypted tunnel. WireGuard is the clearest modern implementation of this — lean (roughly 4,000 lines of kernel code versus OpenVPN's roughly 600,000), fast, and explicit about what it does: cryptographically authenticated IP routing, nothing more.

When a WireGuard peer connects, the OS creates an interface — typically `wg0` — and assigns it a virtual IP from the peer's subnet. From that moment, the connected device is logically on the network. Not adjacent to it — on it, in the same sense your workstation is on the LAN when it's plugged in. The `AllowedIPs` directive controls what traffic gets routed through the tunnel. A peer with `AllowedIPs = 10.0.0.0/24` gets routing for every host in that range. Every device that answers on `10.0.x` is reachable from the connected peer.

WireGuard's job is encryption and peer authentication. Access control is left to whatever firewall sits on the receiving end. WireGuard itself doesn't restrict what an authenticated peer can reach — that's OPNsense's job, iptables' job, or whoever's writing the rules.

### My WireGuard Setup — What You Actually Get When You Connect

My WireGuard server runs on OPNsense. My personal peer config:

```ini
[Interface]
PrivateKey = <redacted>
Address = 10.0.0.2/24

[Peer]
PublicKey = <server-public-key>
Endpoint = <home-ip>:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
```

When I connect from a coffee shop, my laptop gets `10.0.0.2` and could reach something like `10.0.0.1` (OPNsense), `10.0.0.10` (if I had a web server there), `10.0.0.20` (if I had a Postgres instance there), `10.0.0.30` (if I had a NAS there), the management interface, all of it. That's the correct behavior for an admin who needs full network visibility. I'm the trusted user.

But think about what that config hands to a contractor. They're inside your `/24`. Everything that answers is reachable from their machine. WireGuard authenticated them; your firewall rules determine what they can actually do with that access — and if the rules are incomplete, missing, or wrong, the whole subnet is open.

{{< figure
  src="diagram-02-wireguard-tunnel.png"
  alt="Diagram showing a laptop connecting via an encrypted WireGuard dashed tunnel to a peer node, with wg0 interface label and IP address 10.0.0.2 shown below the client"
  caption="WireGuard drops a virtual interface on the connecting device. The client is on the network."
>}}

{{< figure
  src="diagram-03-wireguard-subnet.png"
  alt="Expanded network diagram showing a WireGuard client with tunnel access into a red-bordered subnet containing six labeled hosts, all marked as reachable"
  caption="A peer with AllowedIPs = 10.0.0.0/24. Every host in the /24 is reachable from the client. That's the point — and the risk."
>}}

---

## What Is a Layer 4 VPN? Zero Trust Network Access Explained

Layer 4 "VPNs" like TwinGate don't create a network interface. There's no `wg0`. There's no virtual IP. A connector process runs inside your network, connects outbound to the TwinGate control plane, and proxies access to specific resources — per app, per port — over TCP or UDP.

Gartner projected that by 2025, at least 70% of new remote access deployments would use ZTNA rather than traditional VPN services ([Gartner Market Guide for Zero Trust Network Access](https://www.gartner.com/), 2022). The driver isn't throughput — WireGuard is measurably faster than anything the TwinGate connector model adds. The driver is access scope. ZTNA enforces least-privilege architecturally, not via firewall rules that someone has to write, maintain, and get right every single time.

The model is structurally different from a VPN at every step: the client authenticates to the TwinGate cloud, not directly to your network; the connector in your network handles the session proxy; the network topology is invisible to the connecting client; and access is defined per-resource — `postgres.internal:5432`, `grafana.internal:3000`, one door at a time.

### TwinGate in My Lab — The Contractor Access Use Case

Say I had a Postgres instance at `10.0.0.20:5432`. With TwinGate, I ran the connector on my network and defined exactly one resource: that host, that port. A contractor who needs database access gets TwinGate credentials.

They can connect to port 5432. They cannot ping `10.0.0.1`. They cannot reach anything else — if I had a web server at `10.0.0.10`, a NAS, management interfaces — none of it exists from their perspective, because the connector hasn't brokered access to any of it. The network topology is invisible.

The first time I configured TwinGate, I tried to SSH to the host running the Postgres connector to verify it was working. Couldn't connect. Not a firewall issue, not a routing problem — the connector only proxies resources explicitly defined in the admin panel. I hadn't defined `host:22`. That was disorienting for about sixty seconds, then it was the clearest architectural lesson any tool has given me. Not a bug. That's the whole point.

{{< figure
  src="diagram-04-twingate-layer4.png"
  alt="Architecture diagram showing a remote user connecting through TwinGate cloud broker to a connector inside a dashed network boundary, with only a Postgres resource visible and other hosts absent"
  caption="TwinGate's connector model. The client never touches the network. The network topology is invisible."
>}}

---

## Layer 3 vs Layer 4 — The Direct Comparison

Same user. Same destination network. WireGuard puts them inside the `/24`. TwinGate puts them at a single port. The access model is architectural — it's not a setting you can toggle.

| Dimension | WireGuard (Layer 3) | TwinGate (Layer 4 / ZTNA) |
|-----------|---------------------|--------------------------|
| OSI Layer | 3 (Network) | 4 (Transport) |
| Virtual Interface Created | Yes (`wg0`) | No |
| IP Assigned to Client | Yes | No |
| Access Scope | Full subnet (`AllowedIPs`) | Defined resources only |
| Network Topology Visible to Client | Yes | No |
| Access Control | Firewall rules (external, manual) | Connector policy (built-in) |
| Ideal For | Admin tunnels, site-to-site | Per-app third-party access |
| Blast Radius if Compromised | Full `/24` (up to 254 hosts) | One defined port |

The blast radius column is where the decision actually lives:

<figure>
<svg viewBox="0 0 580 145" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Horizontal bar chart comparing blast radius: WireGuard Layer 3 exposes 254 hosts, TwinGate Layer 4 exposes 1 resource" style="width:100%;max-width:580px;background:transparent">
  <title>Blast Radius by Access Model: Compromised Credential</title>
  <style>
    .brl { font: 13px 'Fira Code', monospace; fill: #a0aec0; }
    .brv { font: 12px 'Fira Code', monospace; fill: #e2e8f0; }
    .bra { font: 11px monospace; fill: #718096; }
    .grid3 { stroke: #2d3748; stroke-width: 1; }
  </style>
  <line x1="195" y1="15" x2="195" y2="115" class="grid3"/>
  <line x1="286" y1="15" x2="286" y2="115" class="grid3"/>
  <line x1="377" y1="15" x2="377" y2="115" class="grid3"/>
  <line x1="468" y1="15" x2="468" y2="115" class="grid3"/>
  <line x1="558" y1="15" x2="558" y2="115" class="grid3"/>
  <text x="195" y="132" text-anchor="middle" class="bra">0</text>
  <text x="286" y="132" text-anchor="middle" class="bra">64</text>
  <text x="377" y="132" text-anchor="middle" class="bra">128</text>
  <text x="468" y="132" text-anchor="middle" class="bra">192</text>
  <text x="558" y="132" text-anchor="middle" class="bra">254 hosts</text>
  <!-- WireGuard: 254 → full 363px -->
  <text x="185" y="48" text-anchor="end" class="brl">WireGuard (L3)</text>
  <rect x="195" y="30" width="363" height="28" fill="#f87171" rx="3"/>
  <text x="566" y="48" class="brv">254</text>
  <!-- TwinGate: 1 → 8px for visibility, labeled -->
  <text x="185" y="98" text-anchor="end" class="brl">TwinGate (L4)</text>
  <rect x="195" y="80" width="9" height="28" fill="#60a5fa" rx="3"/>
  <text x="212" y="98" class="brv">1</text>
</svg>
<figcaption style="font-size:0.8em;color:#737373;margin-top:4px">Hosts or resources reachable by a compromised credential. WireGuard with AllowedIPs = 10.0.0.0/24 vs a TwinGate connector with one defined resource. Original data from the lab.</figcaption>
</figure>

Compromised credentials are the leading initial access vector — present in over a third of all data breaches, according to the [Verizon 2024 Data Breach Investigations Report](https://www.verizon.com/business/resources/reports/dbir/) (Verizon DBIR, 2024). The architectural difference between a Layer 3 VPN and a Layer 4 ZTNA solution is a direct answer to that number: if a WireGuard credential leaks, the attacker has the same `/24` access as the legitimate user. If a TwinGate credential leaks, the attacker has access to one port on one host. The layer you choose determines what you're handing over.

{{< figure
  src="diagram-05-comparison.png"
  alt="Side-by-side comparison: left panel shows WireGuard with a full green subnet containing four labeled hosts, right panel shows TwinGate with only one lit blue Postgres resource and two greyed-out inaccessible hosts"
  caption="Same user, same destination. The layer determines the blast radius."
>}}

---

## When Does the Layer Actually Matter?

The OSI layer is interesting in theory. In practice, the question is simpler: how much of your network do you want this connection to be able to see?

Layer 3 is the right model for yourself. When you're troubleshooting at 2am and need to SSH to an arbitrary host, pull up the OPNsense UI, check logs on a VM, or hit a Grafana dashboard you didn't plan for — you need full network access. Pre-defining every resource you might ever need would be hostile to how admin work actually happens. WireGuard is correct for this use case.

Layer 4 is the right model for everyone else. A contractor who needs database access doesn't need to see your network topology. A CI/CD pipeline calling an internal API doesn't need a virtual IP on your subnet. An external monitoring system polling one endpoint doesn't need routing to your NAS. ZTNA enforces least privilege not through firewall rules that have to be written, reviewed, and updated — but architecturally. The client literally cannot see what hasn't been defined.

{{< alert "warning" >}}
**The mistake:** Using WireGuard for contractor or third-party service access because it's already running. You're handing the entire `/24` to someone who needs one port. OPNsense firewall rules per-peer can approximate ZTNA, but they require ongoing maintenance, don't hide the network topology, and only work if every rule is correct every time.
{{< /alert >}}

---

## Do You Need One or Both?

In a real homelab or small production environment, the answer is almost always both — running in parallel for different trust levels. They're not competing. They serve different threat models.

### My Hybrid Setup

Both tools run simultaneously in my lab, scoped to different users and purposes:

**WireGuard** (admin access only):
- Config: `AllowedIPs = 10.0.0.0/24`
- Used for: OPNsense management UI, Proxmox console, SSH to any host, monitoring, full lab access
- Users: only me

**TwinGate** (controlled external access):
- Defined resources: Postgres instance, NetBox API endpoint, one internal Grafana dashboard
- Used for: external pipeline connections, occasional contractor or service access to specific ports
- Users: external services and anyone who doesn't need full network visibility

They coexist without conflict. The decision tree is short:

```
Who is connecting?
  ├── Me (admin, full access needed) → WireGuard
  └── Anyone else ↓

What do they need?
  ├── Specific service only → TwinGate
  └── General network access → WireGuard + scoped AllowedIPs + firewall rules
```

ZTNA doesn't replace WireGuard for admin tunnels. WireGuard doesn't have TwinGate's per-resource policy enforcement. Each tool is better at its own thing, and running both costs nothing except the time to configure the connector.

---

## Frequently Asked Questions

### Is TwinGate actually a VPN?

In the traditional sense, no. TwinGate doesn't create a virtual network interface or route IP packets at Layer 3. It proxies application connections through a connector. TwinGate uses "VPN" in marketing because that's the familiar category, but architecturally it's ZTNA: access to resources, not membership on a network. The distinction matters when you're reasoning about blast radius and network visibility.

### Can WireGuard do zero trust?

Not natively. WireGuard handles encryption and peer authentication at the kernel level. Per-resource access control is left to your firewall, which you configure and maintain separately. You can approximate ZTNA with OPNsense firewall rules scoped per WireGuard peer — but the virtual interface still exists, the network topology is visible to connected peers, and every firewall rule has to be correct every time. [See the VPN vs VLAN post for how this is configured in practice.](/blog/vpn-vs-vlan)

### Is Layer 4 more secure than Layer 3?

It's more narrow, not inherently more secure. Layer 4 limits access scope and shrinks blast radius if credentials are compromised. But the TwinGate control plane is an external dependency, and the connector itself is a trust boundary that needs hardening. "More secure" depends entirely on your threat model — for admin access where you need full network visibility, Layer 3 is the right answer.

### Does TwinGate work for a homelab?

Yes. The free tier supports a small number of resources and users — enough for a homelab. The connector runs in Docker or as a native Linux service and takes under 30 minutes to set up once you understand the model. The hardest part is internalizing that the connector only proxies what you define. Once you accept that as a feature rather than a limitation, the configuration logic is straightforward.

### Why couldn't I SSH to a host through TwinGate?

Because the connector only proxies resources explicitly defined in the TwinGate admin console. If `host:22` isn't a defined resource, it doesn't exist from the client's perspective — not blocked, just absent. Add the resource in the console (resource type `SSH`, your host IP, port 22), assign it to your user group, and it works. This behavior is intentional: it's the mechanism that keeps your network topology invisible to connecting clients.

---

## Where This Goes From Here

Layer 3 (WireGuard): virtual interface, virtual IP, full subnet access — you're on the network.
Layer 4 (TwinGate / ZTNA): no interface, no IP, brokered per-resource access — you're at a door.

Both say "VPN." They're doing fundamentally different things at different layers of the stack. The choice determines what you hand over when someone connects — and what they can do if those credentials ever end up somewhere they shouldn't.

If you're using WireGuard for everything including third-party access, the blast radius section is the one to re-read. The firewall-rules-per-peer approach works until it doesn't — until a rule is missing, credentials leak, or you forget to revoke access after a project ends.

For the full segmentation architecture this sits inside — the 7-VLAN setup, OPNsense inter-VLAN rules, and where WireGuard peers actually land — the [VPN vs VLAN breakdown](/blog/vpn-vs-vlan) has the full topology. And for the complete lab context, the [lab overview](/docs/lab/overview) shows where both tools live in the stack.

If you came here from the reel: Layer 3 is a network. Layer 4 is a door. That was the whole thing. This is just why the difference matters.
