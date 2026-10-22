---
title: "My Router Already Knew. I Just Wasn't Asking."
aliases: ["/posts/cross-vlan-network-monitor/"]
date: 2026-03-09
lastmod: 2026-03-09
draft: false
description: "ARP can't cross VLANs. I built a FastAPI app that queries OPNsense, Proxmox, and Docker APIs for a complete homelab device inventory: no raw sockets, no root required."
summary: "ARP broadcast → hits one VLAN → sees nothing else. OPNsense REST API → global ARP table for every VLAN → Proxmox API → VM name, node, power state → Docker API → containers with correct host attribution. All merged into SQLite. No raw sockets. No root."
tags:
  - homelab
  - python
  - fastapi
  - networking
  - opnsense
  - proxmox
  - docker
  - automation
images: ["/blog/cross-vlan-network-monitor/og-card.png"]
---

I wanted a dashboard that showed every device on my homelab network. Not just the ones on my workstation's VLAN: every VM, every LXC, every container, across all seven VLANs. One page, everything, live state.

The naive approach is to run a scanner. I tried that. It saw exactly one VLAN.

{{< alert >}}
**TL;DR:** ARP broadcasts don't cross VLAN boundaries, so a scanner in a segmented homelab sees one VLAN and nothing else. I built a FastAPI app that queries OPNsense's global ARP table, Proxmox's VM inventory, and Docker Engine directly: no raw sockets, no root. Everything lands in SQLite and renders on a dark-mode dashboard.
{{< /alert >}}

## The ARP Problem

ARP is a layer-2 protocol. When you run a scanner on VLAN 30, it sends broadcast frames. Broadcasts stop at router boundaries. VLAN 30 can't see VLAN 10, VLAN 99, or anything else that a router sits between.

The standard workarounds are all bad in different ways. Running one scanner per VLAN requires a probe on every segment and still gives you raw IPs with no VM context. Promiscuous-mode capture needs `CAP_NET_RAW` or root and is limited to whatever traffic happens to be flowing. SPAN port mirroring is a hardware requirement, more config, same blind spots.

None of them answer the question I actually cared about: *Is that IP a VM or a container? Which Proxmox node is it on? Is it stopped or running?* Layer-2 scanning doesn't have access to that context. The hypervisor does.

## The shift

OPNsense routes every VLAN, which means it maintains the global ARP table for every subnet it handles. One authenticated API call to `GET /api/diagnostics/interface/getArp` returns IP-MAC pairs for every device on every VLAN, regardless of which segment the scanner is on.

That's the whole insight. The router already knows. I just hadn't asked it.

Proxmox has the same property: the hypervisor knows the name, node, VMID, and power state of every guest before a single packet hits the wire. Docker knows its own containers. Querying them directly is just more accurate than guessing from broadcast traffic.

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

Devices are keyed by MAC address. That matters: a VM that picks up a new IP after a lease renewal is still the same device in the database. Aliases, notes, and type overrides survive across scans because they're stored on the MAC record, not the IP.

## OPNsense: The Global ARP Table

This is the core of the whole thing. OPNsense exposes two endpoints for layer-3 discovery:

```http
GET /api/diagnostics/interface/getArp   # IPv4
GET /api/diagnostics/interface/getNdp   # IPv6
```

Auth is HTTP Basic with an API key and secret, same model as [the OPNsense config backup API](/blog/opnsense-backup-incident/). The response is a flat list of IP/MAC/interface tuples. The interface field tells you which VLAN that device belongs to.

A separate call pulls DHCP leases:

```http
GET /api/dnsmasq/leases/search
```

Each scan cycle, active leases are used to populate hostnames on newly discovered devices. Manual aliases in the UI always take precedence and are never overwritten.

{{< alert "warning" >}}
If you're on OPNsense 26.1+, the DHCP lease endpoint changed from `dhcp/leases/search_lease` to `dnsmasq/leases/search` when the default DHCP backend switched to Dnsmasq. If you're getting empty results with no error, that's probably it.
{{< /alert >}}

## Proxmox: the name behind the IP

OPNsense gives me IP and MAC. Proxmox gives me the name.

The app polls one or more nodes concurrently with per-node API tokens. For each QEMU VM and LXC container it grabs: name, node, VMID, power state, and an IP if one is available.

For running QEMU VMs, the QEMU Guest Agent endpoint (`qemu/{id}/agent/network-get-interfaces`) returns a live IP, useful when ARP hasn't resolved yet, like right after a VM boots. LXC containers use `/lxc/{id}/interfaces` for the same reason. Both are best-effort: if the agent isn't installed or the call fails, the ARP-sourced IP is the fallback.

Stopped VMs are still tracked. Their ARP entries disappear when the lease expires, but the Proxmox record keeps them in the inventory with a `stopped` badge. They don't vanish just because they're off.

## Docker: Containers Without Phantom IPs

A scanner that only resolves layer-3 addresses gives you one row for a Docker host where there could be a dozen services, and no indication which host is responsible for them.

Docker's engine API (`GET /containers/json`) returns running containers with their network configurations. The tricky part is host-networked containers, ones running with `--network host`. Those containers share the host's MAC address and IP, so they don't have their own ARP entry. If you create a device record for each one, you end up with phantom IPs that duplicate the host.

The fix: check whether a container's network mode is `host`, and if so, collect it for later rather than upserting immediately. After the main merge loop, `merge_host_containers()` injects those containers into the host's metadata JSON without touching `device_type`, `vendor`, or any other column. The Docker host keeps its `bare-metal` type. Its detail panel gets a "Host-Network Containers" block listing each container by name, image, and status.

There's also a host attribution feature for bridge-networked containers. Every container now carries a `docker_host` field: the IP extracted from the TCP socket URL (`tcp://10.30.40.2:2375`). In the dashboard, the container's detail panel shows a **Host** row that resolves `docker_host` against the device list. If the Docker host has an alias set, it shows `"DockerHost1 (10.30.40.2)"`. If not, it shows the raw IP. Setting an alias on the host retroactively improves the label for every container on it without a re-scan.

Multiple Docker hosts are queried in parallel. TCP sockets (`tcp://host:2375`) are the practical option for remote daemons, unauthenticated, but restricted at the firewall to the scanner's IP only.

## SNMP: ARP Caches from Anything Else

There's a fourth optional source that covers non-OPNsense devices. The SNMP integration walks `ipNetToMediaPhysAddress` (OID `1.3.6.1.2.1.4.22.1.2`) on any SNMP-capable device: managed switches, other routers, anything that maintains an ARP cache and speaks SNMPv2c. The result is the same IP-MAC pairs OPNsense already provides, but sourced from gear that doesn't have a REST API.

In my lab I don't use it. OPNsense routes everything so there's no coverage gap. But if your topology has a segment that isn't behind OPNsense, or you're running a second router, SNMP is how you close that gap without touching the discovery architecture. Results show up in the health dot row the same way every other source does.

```bash
# JSON array of SNMP targets
SNMP_HOSTS='[{"host":"10.0.99.1","community":"public"}]'
```

## Syslog, Webhooks, and the UI

There's a UDP syslog receiver running alongside the API on port 514. OPNsense can be configured to ship `filterlog` messages there. The app parses those CSV payloads into readable firewall log summaries:

```
[BLOCK] IN on igb0 | tcp 203.0.113.1:443 → 10.X.X.X:8080
```

Logs are stored per source IP and linked to the device that generated them. Some appliances send syslog from a different interface than their management IP: there's a per-device secondary syslog IP field to handle that case without creating a separate device entry.

Container logs can be streamed in the same way using Logspout, one container per Docker host, mounted on the Docker socket, forwarding all container stdout/stderr as UDP syslog datagrams to the receiver:

```bash
sudo docker run -d --name logspout --restart=always \
  -e SYSLOG_HOSTNAME=$(hostname) \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gliderlabs/logspout syslog+udp://MONITOR_IP:514
```

Messages arrive from the Docker host's IP, so logs land on the host's device row. The container name is embedded in the message body: no parser changes needed.

Disappearance tracking works by incrementing a `disappearance_count` for any device not seen in the current scan cycle. When that counter hits `ALERT_DISAPPEARANCE_THRESHOLD` (default: 3 consecutive missed scans), a `device_gone` webhook fires. New MACs trigger `device_discovered`. Both events POST a structured JSON payload (MAC, IP, alias, vendor, type, last-seen) to any HTTP endpoint.

The dashboard is vanilla JavaScript and Tailwind CSS, no build step. At the top: per-type count chips (Total, Bare-metal, VM, LXC, Docker) and per-source health indicator dots (OPNsense ARP, DHCP, Proxmox, Docker, NDP, nmap, SNMP) that go amber/red when a source hasn't returned results in two scan intervals. The device table has a client-side filter that searches across IP, MAC, vendor, and alias in real time.

Clicking a row opens a slide-in detail panel with everything about that device: IPv4, IPv6 (if the NDP table has it), MAC, vendor, first-seen timestamp, Proxmox metadata (node, VMID, power state) or Docker metadata (image, container ID, networks) depending on type. Inline editors for alias, type override, and notes. A syslog viewer that colour-codes entries by severity. Bulk checkbox selection enables mass retype or export of a filtered subset.

The `/api/health` endpoint is the thing I check first when something looks off. It tells you the last-success timestamp and result count for each of the seven sources. If Proxmox shows `stale` but everything else is `ok`, you know where to look.

`/api/devices/export` dumps the full device list as CSV or JSON, useful for feeding into other tools or just taking a snapshot before a planned maintenance window. `/api/logs` is a global syslog full-text search across all devices, separate from the per-device log view in the detail panel.

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

Loaded via `python-dotenv`. The Proxmox token only needs read permissions: no console access, no VM management. The `token_id` field expects the full `user@realm!tokenname` string, not just the token name. OPNsense API user is the same: minimum scope.

## What It Actually Looks Like

Before this, I had no cross-VLAN inventory. After a scan cycle:

- Every device on every VLAN shows up with its MAC, IP, hostname (from DHCP), and which VLAN interface OPNsense learned it from
- VMs have a "Proxmox" column in the detail panel showing the node, VMID, and power state: `ubuntu-dev` on `pveX` (VMID XXX), running
- Containers show up attributed to the host they're running on, not as phantom IPs
- Stopped VMs stay in the list with a grey badge instead of disappearing when their ARP entry expires
- Devices with IPv6 addresses from the NDP table show both addresses, handy for confirming SLAAC is working on a segment

The syslog view is the part I actually keep open. Severity is colour-coded: emergency and alert in red, warning in amber, info in blue, debug in grey. Seeing `[BLOCK]` entries linked to a named device rather than a raw IP makes it much faster to trace what's hitting the firewall.

The health dot row at the top is the other one I check regularly. Seven coloured dots, one per discovery source. All green is a good morning. An amber Proxmox dot means a node didn't respond in the last two scan cycles, usually a VM that's rebooting, occasionally a token that expired.

## What Didn't Work the First Time

The first implementation used `scapy` for ARP scanning as a fallback for non-OPNsense subnets. Scapy needs `CAP_NET_RAW`. The moment I tried running it as a non-root user in a container, it failed silently: no error, no results, no indication of why. Spent more time than I want to admit on that before checking the capability requirements.

Switched to nmap subprocess calls for the optional supplemental scanning path. `nmap -sn` doesn't need raw socket access for ping sweeps, it falls back to ICMP echo, which works without root in most environments. Not perfect, but sufficient for the subnets OPNsense doesn't cover.

Host-networked Docker containers also caused duplicate entries on the first pass. Every `--network host` container was getting its own device row with the same IP as the host. The attribution logic, checking `container['HostConfig']['NetworkMode'] == 'host'` and merging rather than inserting, fixed it. The dashboard went from looking wrong to looking correct.

The syslog parsing deserves one more note. OPNsense sends RFC 3164, and that timestamp format has a year-rollover edge case in December that I didn't discover until January. The rsyslog relay case, where the UDP source is `127.0.0.1` because syslog is being forwarded, was another one that only showed up once the thing was running for real.

The phase-by-phase build history is on the [project page](/projects/cross-vlan-network-monitor/). The same instinct, not trusting the one VLAN you can see, is what eventually cracked a [camera feed that only stuttered across VLAN boundaries](/blog/camera-feed-stutter-vlan/). Same lab, different protocol.

---

*Python 3.12, FastAPI 0.115, Ubuntu VM, HOMELAB VLAN. The only outage was a dropped firewall rule blocking the scanner from the OPNsense management IP, which the scanner noticed before I did.*

*Source code: [moshthesubnet/netcensus on GitHub](https://github.com/moshthesubnet/netcensus)*

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/blog/cross-vlan-network-monitor/#article",
      "headline": "My Router Already Knew. I Just Wasn't Asking.",
      "description": "Standard ARP scanners are blind across VLAN boundaries. I built a FastAPI app that skips the scanning entirely and queries OPNsense, Proxmox, and Docker directly for a cross-VLAN device inventory.",
      "datePublished": "2026-03-09T00:00:00Z",
      "dateModified": "2026-03-09T00:00:00Z",
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
        "url": "https://moshthesubnet.com/blog/cross-vlan-network-monitor/og-card.png",
        "width": 1200,
        "height": 630
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/blog/cross-vlan-network-monitor/"
      },
      "articleSection": "Homelab",
      "keywords": [
        "homelab",
        "network monitoring",
        "VLAN",
        "OPNsense",
        "Proxmox",
        "Docker",
        "FastAPI",
        "Python",
        "ARP",
        "cross-VLAN"
      ],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/blog/cross-vlan-network-monitor/#breadcrumb",
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
          "name": "My Router Already Knew. I Just Wasn't Asking.",
          "item": "https://moshthesubnet.com/blog/cross-vlan-network-monitor/"
        }
      ]
    }
  ]
}
</script>

<!-- Assumptions (2026-10-22 voice pass, delete after review):
- Cut: the Ivanti/AlgoSec/Microsoft statistics (TL;DR, opener, chart, and the two repeated "capsule" paragraphs) and the Docker/Datadog adoption stats. None of them were about your lab.
- "How It Got Here" is gone from the post because the project page's Development History covers it phase by phase; I kept the two syslog war stories (December rollover, rsyslog relay) since they only existed here.
- The FAQ answer about tracking by MAC (Microsoft ransomware stat) went with the FAQ section.
- Restored the italic footer and the GitHub source link, which the FAQ removal had swept away.
-->
