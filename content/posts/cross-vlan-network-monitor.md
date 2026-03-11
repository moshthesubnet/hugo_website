---
title: "My Router Already Knew. I Just Wasn't Asking."
date: 2026-03-09
lastmod: 2026-03-09
draft: false
description: "ARP can't cross VLANs. I built a FastAPI app that queries OPNsense, Proxmox, and Docker APIs for a complete homelab device inventory — no raw sockets, no root required."
summary: "ARP broadcast → hits one VLAN → sees nothing else. OPNsense REST API → global ARP table for every VLAN → Proxmox API → VM name, node, power state → Docker API → containers with correct host attribution. All merged into SQLite. No raw sockets. No root."
cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&q=80"
coverAlt: "Close-up of a green circuit board with rows of electronic components under cool blue lighting."
ogImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&q=80"
tags:
  - homelab
  - python
  - fastapi
  - networking
  - opnsense
  - proxmox
  - docker
  - automation
---

![Close-up of a green circuit board with rows of electronic components under cool blue lighting.](https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&q=80)
*Photo by Alexandre Debiève on Unsplash*

I wanted a dashboard that showed every device on my homelab network. Not just the ones on my workstation's VLAN — every VM, every LXC, every container, across all seven VLANs. One page, everything, live state.

The naive approach is to run a scanner. I tried that. It saw exactly one VLAN.

{{< alert >}}
**TL;DR:** 38% of organizations can't identify all devices accessing their networks ([Ivanti, 2025](https://www.ivanti.com/blog/state-of-cybersecurity-report)). ARP broadcasts don't cross VLAN boundaries, so a segmented homelab is structurally worse. I built a FastAPI app that queries OPNsense's global ARP table, Proxmox's VM inventory, and Docker Engine directly — no raw sockets, no root. Everything lands in SQLite and renders on a dark-mode dashboard.
{{< /alert >}}

## The ARP Problem

38% of organizations can't identify all devices accessing their networks, according to Ivanti's 2025 State of Cybersecurity report — and that's in environments with dedicated security tooling. Add VLAN segmentation and the number gets worse. 71% of security teams say visibility gaps actively delay threat detection ([AlgoSec, 2025](https://algosec.com/state-of-network-security/)), and the root cause is usually the same: scanners that can only see one layer-2 segment at a time.

<figure>
<svg role="img" aria-label="Horizontal bar chart titled Network Visibility Gap showing three statistics: 38% of organizations cannot identify all devices (Ivanti 2025), 71% of security teams say visibility gaps delay detection (AlgoSec 2025), and over 90% of ransomware attacks involved unmanaged devices (Microsoft MDDR 2024)." xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 210" style="max-width:620px;width:100%;background:transparent;">
  <title>Network Visibility Gap — Key Statistics</title>
  <rect x="0" y="0" width="620" height="210" fill="#0f172a" rx="8"/>
  <text x="310" y="26" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="13" font-weight="600">Network Visibility Gap</text>
  <!-- Bar 1: 38% -->
  <text x="215" y="62" text-anchor="end" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11">Can't identify all devices</text>
  <rect x="222" y="50" width="144" height="18" rx="3" fill="#6d28d9"/>
  <text x="372" y="63" fill="#c4b5fd" font-family="system-ui,sans-serif" font-size="12" font-weight="600">38%</text>
  <!-- Bar 2: 71% -->
  <text x="215" y="102" text-anchor="end" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11">Visibility gaps delay detection</text>
  <rect x="222" y="90" width="269" height="18" rx="3" fill="#2563eb"/>
  <text x="497" y="103" fill="#93c5fd" font-family="system-ui,sans-serif" font-size="12" font-weight="600">71%</text>
  <!-- Bar 3: 90%+ -->
  <text x="215" y="142" text-anchor="end" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11">Ransomware via unmanaged devices</text>
  <rect x="222" y="130" width="342" height="18" rx="3" fill="#0e7490"/>
  <text x="570" y="143" fill="#67e8f9" font-family="system-ui,sans-serif" font-size="12" font-weight="600">90%+</text>
  <!-- Scale labels -->
  <text x="222" y="168" fill="#475569" font-family="system-ui,sans-serif" font-size="10">0%</text>
  <text x="317" y="168" fill="#475569" font-family="system-ui,sans-serif" font-size="10">25%</text>
  <text x="412" y="168" fill="#475569" font-family="system-ui,sans-serif" font-size="10">50%</text>
  <text x="507" y="168" fill="#475569" font-family="system-ui,sans-serif" font-size="10">75%</text>
  <text x="310" y="193" text-anchor="middle" fill="#475569" font-family="system-ui,sans-serif" font-size="10">Sources: Ivanti 2025 · AlgoSec 2025 · Microsoft MDDR 2024</text>
</svg>
<figcaption>The visibility problem isn't unique to homelabs — it's a structural issue in any segmented network.</figcaption>
</figure>

ARP is a layer-2 protocol. When you run a scanner on VLAN 30, it sends broadcast frames. Broadcasts stop at router boundaries. VLAN 30 can't see VLAN 10, VLAN 99, or anything else that a router sits between.

The standard workarounds are all bad in different ways. Running one scanner per VLAN requires a probe on every segment and still gives you raw IPs with no VM context. Promiscuous-mode capture needs `CAP_NET_RAW` or root and is limited to whatever traffic happens to be flowing. SPAN port mirroring is a hardware requirement, more config, same blind spots.

None of them answer the question I actually cared about: *Is that IP a VM or a container? Which Proxmox node is it on? Is it stopped or running?* Layer-2 scanning doesn't have access to that context. The hypervisor does.

## The shift

OPNsense routes every VLAN, which means it maintains the global ARP table for every subnet it handles. One authenticated API call to `GET /api/diagnostics/interface/getArp` returns IP-MAC pairs for every device on every VLAN, regardless of which segment the scanner is on.

That's the whole insight. The router already knows. I just hadn't asked it.

Proxmox has the same property — the hypervisor knows the name, node, VMID, and power state of every guest before a single packet hits the wire. Docker knows its own containers. Querying them directly is just more accurate than guessing from broadcast traffic.

## How It Works

The app is a FastAPI service with an async scanner loop that runs every five minutes:

```
OPNsense ARP/NDP API  ─┐
OPNsense DHCP API     ─┤
Proxmox VE API (×N)   ─┼──► async merge ──► SQLite ──► dashboard + webhooks
Docker Engine API (×N) ─┤
nmap (optional)        ─┤
SNMP (optional)        ─┘
```

All sources run concurrently via `asyncio`. The Proxmox and Docker SDKs have blocking calls, so those get offloaded via `run_in_executor`. Full cycle takes a few seconds.

Devices are keyed by MAC address. That matters — a VM that picks up a new IP after a lease renewal is still the same device in the database. Aliases, notes, and type overrides survive across scans because they're stored on the MAC record, not the IP.

## OPNsense: The Global ARP Table

This is the core of the whole thing. OPNsense exposes two endpoints for layer-3 discovery:

```http
GET /api/diagnostics/interface/getArp   # IPv4
GET /api/diagnostics/interface/getNdp   # IPv6
```

Auth is HTTP Basic with an API key and secret — same model as [the OPNsense config backup API](/posts/opnsense-backup-incident/). The response is a flat list of IP/MAC/interface tuples. The interface field tells you which VLAN that device belongs to.

A separate call pulls DHCP leases:

```http
GET /api/dnsmasq/leases/search
```

Each scan cycle, active leases are used to populate hostnames on newly discovered devices. Manual aliases in the UI always take precedence and are never overwritten.

{{< alert "warning" >}}
If you're on OPNsense 26.1+, the DHCP lease endpoint changed from `dhcp/leases/search_lease` to `dnsmasq/leases/search` when the default DHCP backend switched to Dnsmasq. If you're getting empty results with no error, that's probably it.
{{< /alert >}}

OPNsense maintains the global ARP table for every VLAN it routes, exposing it through an authenticated REST API. A single call to `GET /api/diagnostics/interface/getArp` returns IP-MAC-interface tuples covering every device on every routed subnet — without raw socket access or elevated privileges on the scanning host. Ivanti's 2025 research found 38% of organizations lack full device visibility ([Ivanti](https://www.ivanti.com/blog/state-of-cybersecurity-report), 2025); the OPNsense API approach closes that gap in one query.

## Proxmox: the name behind the IP

OPNsense gives me IP and MAC. Proxmox gives me the name.

The app polls one or more nodes concurrently with per-node API tokens. For each QEMU VM and LXC container it grabs: name, node, VMID, power state, and an IP if one is available.

For running QEMU VMs, the QEMU Guest Agent endpoint (`qemu/{id}/agent/network-get-interfaces`) returns a live IP — useful when ARP hasn't resolved yet, like right after a VM boots. LXC containers use `/lxc/{id}/interfaces` for the same reason. Both are best-effort: if the agent isn't installed or the call fails, the ARP-sourced IP is the fallback.

Stopped VMs are still tracked. Their ARP entries disappear when the lease expires, but the Proxmox record keeps them in the inventory with a `stopped` badge. They don't vanish just because they're off.

## Docker: Containers Without Phantom IPs

71.1% of developers globally use Docker ([Docker, 2025](https://www.docker.com/resources/sonatype-developer-survey/)), with a median of 11.5 containers per host in orchestrated environments ([Datadog, 2023](https://www.datadoghq.com/container-report/)). At that density, a scanner that only resolves layer-3 addresses gives you one row where there could be a dozen services — and no indication which host is actually responsible for them.

Docker's engine API (`GET /containers/json`) returns running containers with their network configurations. The tricky part is host-networked containers — ones running with `--network host`. Those containers share the host's MAC address and IP, so they don't have their own ARP entry. If you create a device record for each one, you end up with phantom IPs that duplicate the host.

The fix: check whether a container's network mode is `host`, and if so, collect it for later rather than upserting immediately. After the main merge loop, `merge_host_containers()` injects those containers into the host's metadata JSON without touching `device_type`, `vendor`, or any other column. The Docker host keeps its `bare-metal` type. Its detail panel gets a "Host-Network Containers" block listing each container by name, image, and status.

There's also a host attribution feature for bridge-networked containers. Every container now carries a `docker_host` field — the IP extracted from the TCP socket URL (`tcp://10.30.40.2:2375`). In the dashboard, the container's detail panel shows a **Host** row that resolves `docker_host` against the device list. If the Docker host has an alias set, it shows `"DockerHost1 (10.30.40.2)"`. If not, it shows the raw IP. Setting an alias on the host retroactively improves the label for every container on it without a re-scan.

Multiple Docker hosts are queried in parallel. TCP sockets (`tcp://host:2375`) are the practical option for remote daemons — unauthenticated, but restricted at the firewall to the scanner's IP only.

Docker containers using `--network host` share the daemon host's MAC and IP, creating duplicate device rows in any inventory that doesn't account for this. With 71.1% of developers now running Docker ([Docker](https://www.docker.com/resources/sonatype-developer-survey/), 2025) and 11.5 containers per host as a realistic baseline ([Datadog](https://www.datadoghq.com/container-report/), 2023), container-aware attribution is a practical requirement, not an edge case.

## SNMP: ARP Caches from Anything Else

There's a fourth optional source that covers non-OPNsense devices. The SNMP integration walks `ipNetToMediaPhysAddress` (OID `1.3.6.1.2.1.4.22.1.2`) on any SNMP-capable device — managed switches, other routers, anything that maintains an ARP cache and speaks SNMPv2c. The result is the same IP-MAC pairs OPNsense already provides, but sourced from gear that doesn't have a REST API.

In my lab I don't use it — OPNsense routes everything so there's no coverage gap. But if your topology has a segment that isn't behind OPNsense, or you're running a second router, SNMP is how you close that gap without touching the discovery architecture. Results show up in the health dot row the same way every other source does.

```bash
# JSON array of SNMP targets
SNMP_HOSTS='[{"host":"10.0.99.1","community":"public"}]'
```

## Syslog, Webhooks, and the UI

There's a UDP syslog receiver running alongside the API on port 514. OPNsense can be configured to ship `filterlog` messages there. The app parses those CSV payloads into readable firewall log summaries:

```
[BLOCK] IN on igb0 | tcp 203.0.113.1:443 → 10.X.X.X:8080
```

Logs are stored per source IP and linked to the device that generated them. Some appliances send syslog from a different interface than their management IP — there's a per-device secondary syslog IP field to handle that case without creating a separate device entry.

Container logs can be streamed in the same way using Logspout — one container per Docker host, mounted on the Docker socket, forwarding all container stdout/stderr as UDP syslog datagrams to the receiver:

```bash
sudo docker run -d --name logspout --restart=always \
  -e SYSLOG_HOSTNAME=$(hostname) \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gliderlabs/logspout syslog+udp://MONITOR_IP:514
```

Messages arrive from the Docker host's IP, so logs land on the host's device row. The container name is embedded in the message body — no parser changes needed.

Disappearance tracking works by incrementing a `disappearance_count` for any device not seen in the current scan cycle. When that counter hits `ALERT_DISAPPEARANCE_THRESHOLD` (default: 3 consecutive missed scans), a `device_gone` webhook fires. New MACs trigger `device_discovered`. Both events POST a structured JSON payload — MAC, IP, alias, vendor, type, last-seen — to any HTTP endpoint.

The dashboard is vanilla JavaScript and Tailwind CSS, no build step. At the top: per-type count chips (Total, Bare-metal, VM, LXC, Docker) and per-source health indicator dots (OPNsense ARP, DHCP, Proxmox, Docker, NDP, nmap, SNMP) that go amber/red when a source hasn't returned results in two scan intervals. The device table has a client-side filter that searches across IP, MAC, vendor, and alias in real time.

Clicking a row opens a slide-in detail panel with everything about that device: IPv4, IPv6 (if the NDP table has it), MAC, vendor, first-seen timestamp, Proxmox metadata (node, VMID, power state) or Docker metadata (image, container ID, networks) depending on type. Inline editors for alias, type override, and notes. A syslog viewer that colour-codes entries by severity. Bulk checkbox selection enables mass retype or export of a filtered subset.

The `/api/health` endpoint is the thing I check first when something looks off. It tells you the last-success timestamp and result count for each of the seven sources. If Proxmox shows `stale` but everything else is `ok`, you know where to look.

`/api/devices/export` dumps the full device list as CSV or JSON — useful for feeding into other tools or just taking a snapshot before a planned maintenance window. `/api/logs` is a global syslog full-text search across all devices, separate from the per-device log view in the detail panel.

## Environment Configuration

```bash
OPNSENSE_URL=https://10.X.X.1
OPNSENSE_KEY=your-api-key
OPNSENSE_SECRET=your-api-secret

# JSON array of Proxmox nodes
# token_id format is user@realm!tokenname (e.g. monitor@pve!scanner)
PROXMOX_NODES='[{"host":"10.X.X.X","user":"monitor@pve","token_id":"monitor@pve!scanner","token_secret":"..."}]'

# Comma-separated Docker TCP sockets
DOCKER_HOSTS=tcp://10.X.X.X:2375,tcp://10.X.X.X:2375

# Optional: comma-separated CIDR blocks for nmap supplemental sweeps
NMAP_SUBNETS=10.30.40.0/24,10.30.50.0/24

# Optional: JSON array of SNMP targets for ARP-cache walks
SNMP_HOSTS='[{"host":"10.X.X.X","community":"public"}]'

SCAN_INTERVAL_SECONDS=300
SYSLOG_PORT=514
ALERT_WEBHOOK_URL=http://10.X.X.X:8123/api/webhook/network-events
ALERT_DISAPPEARANCE_THRESHOLD=3
DB_PATH=./network_monitor.db
```

Loaded via `python-dotenv`. The Proxmox token only needs read permissions — no console access, no VM management. The `token_id` field expects the full `user@realm!tokenname` string, not just the token name. OPNsense API user is the same: minimum scope.

## What It Actually Looks Like

Before this, I had no cross-VLAN inventory. After a scan cycle:

- Every device on every VLAN shows up with its MAC, IP, hostname (from DHCP), and which VLAN interface OPNsense learned it from
- VMs have a "Proxmox" column in the detail panel showing the node, VMID, and power state — `ubuntu-dev` on `pveX` (VMID XXX), running
- Containers show up attributed to the host they're running on, not as phantom IPs
- Stopped VMs stay in the list with a grey badge instead of disappearing when their ARP entry expires
- Devices with IPv6 addresses from the NDP table show both addresses — handy for confirming SLAAC is working on a segment

The syslog view is the part I actually keep open. Severity is colour-coded — emergency and alert in red, warning in amber, info in blue, debug in grey. Seeing `[BLOCK]` entries linked to a named device rather than a raw IP makes it much faster to trace what's hitting the firewall.

The health dot row at the top is the other one I check regularly. Seven coloured dots, one per discovery source. All green is a good morning. An amber Proxmox dot means a node didn't respond in the last two scan cycles — usually a VM that's rebooting, occasionally a token that expired.

## What Didn't Work the First Time

<!-- [PERSONAL EXPERIENCE] -->
The first implementation used `scapy` for ARP scanning as a fallback for non-OPNsense subnets. Scapy needs `CAP_NET_RAW`. The moment I tried running it as a non-root user in a container, it failed silently — no error, no results, no indication of why. Spent more time than I want to admit on that before checking the capability requirements.

Switched to nmap subprocess calls for the optional supplemental scanning path. `nmap -sn` doesn't need raw socket access for ping sweeps — it falls back to ICMP echo, which works without root in most environments. Not perfect, but sufficient for the subnets OPNsense doesn't cover.

Host-networked Docker containers also caused duplicate entries on the first pass. Every `--network host` container was getting its own device row with the same IP as the host. The attribution logic — checking `container['HostConfig']['NetworkMode'] == 'host'` and merging rather than inserting — fixed it. The dashboard went from looking wrong to looking correct.

## How It Got Here

<!-- [PERSONAL EXPERIENCE] -->
The first commit was a scapy ARP scanner with a MAC OUI lookup and a CLI flag. It was fine for a single subnet. The moment I added a second VLAN it became useless, which is when the API approach clicked.

Docker and Proxmox discovery came next — the MAC extraction for Proxmox is regex against their net config strings, which encode adapter types like `virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0`. There are six adapter type prefixes to handle. Getting that right took longer than the OPNsense integration did.

Then persistence, then the syslog receiver. The syslog RFC parsing is annoying because OPNsense sends RFC 3164 but the timestamp format has a year-rollover edge case in December that I didn't discover until January. The rsyslog relay case — where UDP source is `127.0.0.1` because syslog is being forwarded — was another one that only showed up in production.

The biggest single change was removing scapy from the main discovery loop entirely. That happened after the P1 audit when it became obvious that OPNsense ARP was strictly better in every way: no privileges required, covers all VLANs, returns the same data. Scapy is still in the repo for CLI use but hasn't run in months.

The database schema has migrated idempotently through each phase — `_migrate_add_columns()` checks for column existence before adding, so old databases pick up `ipv6`, `custom_type`, `disappearance_count`, `notes`, `scan_count`, and `syslog_ip` on next startup without losing anything.

## Frequently Asked Questions

**Why not just use Nmap for everything?**

Nmap doesn't cross VLAN boundaries any better than ARP does. You can run it against a CIDR that spans multiple subnets, but from the host's perspective, it's still sending probes from one layer-3 location. It also has no VM or container context — it sees IPs, not what's running behind them.

**What's the performance overhead?**

The OPNsense API calls complete in under a second. Proxmox API calls depend on how many nodes you have and how many VMs are on each — two nodes with fifty guests takes a few seconds total. Docker is fast. Full cycle on my setup is around four seconds. Sqlite writes are synchronous but negligible at this scale.

**Do you need the QEMU Guest Agent installed on every VM?**

No. Guest Agent IP resolution is best-effort. If the agent isn't installed or the call fails, the app uses the ARP-sourced IP from OPNsense as a fallback. VMs without the Guest Agent still appear in the inventory — they just use ARP for their IP rather than the agent report.

**How do you handle VMs that share an IP through NAT or load balancers?**

They show up as a single ARP entry. There's no way to distinguish them at the layer-3 level without inspecting traffic, which this app deliberately avoids. If you're running HAProxy or a NAT rule that maps multiple backends to one IP, those backends won't appear separately in the inventory.

**Can this run in Docker itself?**

Yes. The included `docker-compose.yml` uses `network_mode: host`, which is the practical option — it binds directly to the host's network stack and avoids the port mapping complexity for UDP 514. If you can't use host networking, binding port 514 requires either root in the container or `--cap-add NET_BIND_SERVICE`. The easier workaround is remapping to a high port (`SYSLOG_PORT=5140`) at the Docker layer and reconfiguring OPNsense to send there instead. Everything except the syslog receiver runs fine unprivileged.

**What's the security case for tracking every device by MAC?**

Microsoft's 2024 Digital Defense Report found over 90% of ransomware attacks involved unmanaged or unmonitored devices as the initial access point. Most of those devices aren't intentionally hidden — they're just outside whatever scanner is in use. Keying inventory on MAC address means devices that rotate IPs or go offline temporarily don't vanish from the record. A device that appears on the network gets a row. That row persists until explicitly removed.

---

*Python 3.12, FastAPI 0.115, Ubuntu VM, HOMELAB VLAN. The only outage was a dropped firewall rule blocking the scanner from the OPNsense management IP — which the scanner noticed before I did.*

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/posts/cross-vlan-network-monitor/#article",
      "headline": "My Router Already Knew. I Just Wasn't Asking.",
      "description": "Standard ARP scanners are blind across VLAN boundaries. I built a FastAPI app that skips the scanning entirely and queries OPNsense, Proxmox, and Docker directly for a cross-VLAN device inventory.",
      "datePublished": "2026-03-09T00:00:00Z",
      "dateModified": "2026-03-09T00:00:00Z",
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
        "url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&q=80",
        "width": 1200,
        "height": 630,
        "caption": "Close-up of a green circuit board with rows of electronic components under cool blue lighting"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/posts/cross-vlan-network-monitor/"
      },
      "articleSection": "Homelab",
      "keywords": ["homelab", "network monitoring", "VLAN", "OPNsense", "Proxmox", "Docker", "FastAPI", "Python", "ARP", "cross-VLAN"],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/posts/cross-vlan-network-monitor/#breadcrumb",
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
          "item": "https://moshthesubnet.com/posts/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "My Router Already Knew. I Just Wasn't Asking.",
          "item": "https://moshthesubnet.com/posts/cross-vlan-network-monitor/"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://moshthesubnet.com/posts/cross-vlan-network-monitor/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Why not just use Nmap for cross-VLAN network discovery?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nmap doesn't cross VLAN boundaries any better than ARP does. It sends probes from one layer-3 location and has no VM or container context. It sees IPs, not what's running behind them. OPNsense's global ARP table already has every device across every routed VLAN in a single API call."
          }
        },
        {
          "@type": "Question",
          "name": "Does the QEMU Guest Agent need to be installed on every Proxmox VM?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Guest Agent IP resolution is best-effort. If the agent isn't installed or the call fails, the app falls back to the ARP-sourced IP from OPNsense. VMs without the Guest Agent still appear in the inventory."
          }
        },
        {
          "@type": "Question",
          "name": "Can the cross-VLAN network monitor run in Docker?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The only complication is the syslog receiver on UDP 514 — binding a port below 1024 requires either root in the container or NET_BIND_SERVICE capability, or remapping to a higher port at the Docker layer. Everything else runs fine unprivileged."
          }
        },
        {
          "@type": "Question",
          "name": "How does the app handle host-networked Docker containers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Containers using --network host share the daemon host's MAC and IP. The app detects this and attributes them back to the physical host's ARP entry rather than creating duplicate device records with phantom IPs."
          }
        },
        {
          "@type": "Question",
          "name": "What is the security case for tracking every network device by MAC address?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Microsoft's 2024 Digital Defense Report found over 90% of ransomware attacks involved unmanaged or unmonitored devices as the initial access point. Keying inventory on MAC address means devices that rotate IPs or go temporarily offline don't escape the record — a device that appears on the network gets a row that persists until explicitly removed."
          }
        }
      ]
    }
  ]
}
</script>
