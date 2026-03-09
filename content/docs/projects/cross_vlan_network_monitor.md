---
title: Cross-VLAN Network Monitor
description: A unified "God View" of every device on the homelab — bare metal, VMs, LXCs, and containers — discovered via authenticated APIs instead of raw sockets.
tags:
- Python
- FastAPI
- Homelab
- Networking
- OPNsense
- Proxmox
- Docker
weight: 6
---

# API-Driven Cross-VLAN Network Monitor

*A unified inventory of every device across every VLAN — no raw sockets, no per-segment probes, no root required.*

---

## Project Overview

This project is a FastAPI application that builds a real-time, cross-VLAN device inventory by querying the authoritative sources that already have complete network visibility: OPNsense (the edge router), Proxmox (the hypervisor), and Docker Engine. It stores everything in SQLite, presents it on a dark-mode dashboard, and fires webhooks when devices appear or disappear.

## Summary

Standard ARP scanners are blind across VLAN boundaries. Instead of working around that with per-VLAN probes or raw socket captures, this app queries OPNsense's global ARP/NDP tables, Proxmox's VM/LXC inventory, and Docker's container API — all concurrently — and merges the results into a single device registry with full-stack context for every endpoint.

---

## The Problem

Standard network scanners rely on layer-2 ARP broadcasts. This approach has a fundamental flaw in segmented networks: **ARP does not cross VLAN boundaries**. A scanner on VLAN 30 is completely blind to devices on VLANs 10, 20, and 99 without a dedicated probe on each segment.

The common workarounds — one scanner per VLAN, promiscuous-mode capture, flooding every segment — all require root privileges, raw sockets, or brittle host-level configuration. In a homelab with 5+ VLANs, dozens of VMs, and multiple Docker hosts, none of these scale cleanly.

Layer-2 scanning alone also can't answer: *Is that IP a VM or a container? Which Proxmox node is it on? What's its power state?* Resolving those questions requires querying something that actually knows — the hypervisor.

---

## Architecture

{{< mermaid >}}
graph TD
    subgraph Sources["Discovery Sources"]
        OPN["OPNsense REST API<br/>(ARP table, NDP, DHCP leases)"]
        PVE["Proxmox VE API<br/>(VMs, LXCs, Guest Agent IPs)"]
        DOC["Docker Engine API<br/>(containers, bridge networks)"]
    end

    subgraph App["FastAPI Application"]
        Scanner["Async Scanner<br/>(asyncio, httpx)"]
        Syslog["UDP Syslog Receiver<br/>(port 514)"]
        DB[("SQLite<br/>devices + syslogs")]
        API["REST API + Dashboard"]
    end

    subgraph Outputs["Outputs"]
        UI["Dark-mode Dashboard<br/>(Tailwind CSS, vanilla JS)"]
        WH["Webhook Alerts<br/>(device_discovered / device_gone)"]
    end

    OPN --> Scanner
    PVE --> Scanner
    DOC --> Scanner
    Scanner --> DB
    Syslog --> DB
    DB --> API
    API --> UI
    API --> WH

    classDef vlan fill:#121212,stroke:#4fd1c5,stroke-dasharray: 5 5,color:#eeeeee
    classDef device fill:#234e52,stroke:#4fd1c5,stroke-width:2px,color:#e6fffa
    classDef service fill:#44337a,stroke:#b794f4,stroke-width:2px,color:#faf5ff
    classDef storage fill:#5f370e,stroke:#f6ad55,stroke-width:2px,color:#ffffff

    class Sources vlan
    class Scanner,Syslog,API device
    class OPN,PVE,DOC service
    class DB storage
{{< /mermaid >}}

### Architecture Evolution

#### Before: Layer-2 ARP Scanning

The original prototype used `scapy` to send raw ARP broadcasts — a technique that requires `CAP_NET_RAW` or root and is inherently limited to one layer-2 segment at a time.

| Approach | Limitation |
|---|---|
| Scapy ARP broadcast | Single VLAN, requires root / `CAP_NET_RAW` |
| Per-VLAN scanner instances | Doesn't scale, no VM/container context |
| Promiscuous capture | Raw socket required, still no hypervisor context |

#### After: API-First Discovery

| Source | What it provides | Transport |
|---|---|---|
| OPNsense ARP/NDP API | Global layer-3 table for every routed VLAN | HTTPS (API key + secret) |
| OPNsense DHCP API | Hostnames for newly seen MACs | HTTPS (API key + secret) |
| Proxmox VE API | VM/LXC name, node, VMID, power state, IPs | HTTPS (API token) |
| Docker Engine API | Running containers, bridge IPs, host attribution | TCP or Unix socket |

OPNsense already has the complete ARP table for every VLAN it routes. Querying its API over HTTPS is more accurate than any local broadcast scan could be — and requires no elevated privileges on the scanner host.

---

## Technical Implementation

### Design Decisions

#### 1. asyncio Throughout

All I/O is non-blocking. OPNsense, Proxmox (multiple nodes), Docker (multiple hosts), and outbound webhooks are all awaited concurrently via `asyncio`. Blocking SDK calls (the Docker and Proxmox Python libraries) are offloaded to a thread pool via `run_in_executor` to avoid blocking the event loop.

#### 2. MAC Address as Primary Key

Devices are keyed by MAC address in SQLite. This means a VM that gets a new IP after a DHCP lease renewal is still tracked as the same device — its IP column updates, its history stays intact, and its alias and notes survive.

#### 3. Host-Networked Container Attribution

Docker containers using `--network host` share the daemon host's MAC and IP. Rather than creating phantom device entries for every host-networked container, the app attributes them back to the physical host's existing ARP entry. This keeps the inventory clean.

#### 4. OPNsense DHCP for Automatic Naming

Each scan cycle fetches active DHCP leases from OPNsense's dnsmasq API and uses them to populate hostnames on newly discovered devices. Manual aliases set through the UI are never overwritten by subsequent scans.

### External API Integrations

| Integration | Endpoint | Auth |
|---|---|---|
| OPNsense ARP | `GET /api/diagnostics/interface/getArp` | API key + secret (HTTP Basic) |
| OPNsense NDP | `GET /api/diagnostics/interface/getNdp` | API key + secret (HTTP Basic) |
| OPNsense DHCP | `GET /api/dnsmasq/leases/search` | API key + secret (HTTP Basic) |
| Proxmox VE | `proxmoxer` REST client | Per-node API tokens (`user@pam!token`) |
| Proxmox Guest IPs | `qemu/{id}/agent/network-get-interfaces` | Same token, best-effort |
| Docker Engine | Docker SDK over TCP or Unix socket | Unauthenticated (LAN-internal) |
| nmap (optional) | Subprocess ping sweep | None (`nmap` binary required) |
| SNMP (optional) | ARP-cache MIB walk | Community string |

### Tech Stack

| Layer | Technology |
|---|---|
| API framework | FastAPI (Python 3.12), Uvicorn |
| Async runtime | asyncio + httpx |
| Database | SQLite via aiosqlite |
| Frontend | Vanilla JS + Tailwind CSS (CDN, no build step) |
| Syslog receiver | Async UDP server (RFC 3164 / RFC 5424) |

---

## Key Features

- **Cross-VLAN discovery via OPNsense** — pulls the global ARP table (IPv4) and NDP neighbour table (IPv6) in a single API call, covering every VLAN the router is aware of. NDP-only devices (IPv6 with no ARP entry) are stored as their own rows with a null IPv4 field.
- **Multi-node Proxmox inventory** — polls multiple Proxmox hosts concurrently, uses the QEMU Guest Agent for live IPs when ARP hasn't resolved yet. Offline VMs are retained in the inventory with their last-known IP and a `stopped` state badge.
- **Distributed Docker mapping** — enumerates containers across multiple Docker hosts, handles host-networked containers correctly by attributing them to the physical host's ARP entry rather than creating phantom IPs.
- **Optional supplemental scanning (nmap + SNMP)** — nmap ping sweeps cover subnets not managed by OPNsense; SNMP ARP-cache walks pull device tables from managed switches. Both sources are folded in with OPNsense data taking priority on conflict.
- **Integrated syslog receiver** — async UDP server parses OPNsense `filterlog` CSV into human-readable firewall summaries. A secondary syslog IP can be configured per device for appliances that send from a different interface than their management IP.
- **Disappearance tracking and webhooks** — increments a `disappearance_count` each scan cycle a device is absent; fires `device_gone` when the count reaches `ALERT_DISAPPEARANCE_THRESHOLD` (default: 3). New devices trigger `device_discovered`. Webhook payload includes MAC, IP, alias, vendor, type, and last-seen timestamp.
- **Source health monitoring** — `/api/health` reports `ok` / `stale` / `unknown` status, last-success timestamp, and result count for each of the seven discovery sources. Staleness is computed against `SCAN_INTERVAL * 2`.
- **Device management UI** — aliases, custom type overrides, free-text notes, and secondary syslog IPs all survive subsequent scans. Bulk retype and bulk export (JSON) via checkbox selection. Full inventory export as CSV or JSON.

---

## Environment Configuration

All credentials are supplied via environment variables (`.env` supported via `python-dotenv`):

```
OPNSENSE_URL          # https://10.X.X.1
OPNSENSE_KEY          # API key (Basic Auth username)
OPNSENSE_SECRET       # API secret (Basic Auth password)

PROXMOX_NODES         # JSON array: [{"host":"…","user":"root@pam","token_id":"…","token_secret":"…"}]

DOCKER_HOSTS          # Comma-separated: tcp://10.X.X.X:2375,tcp://10.X.X.X:2375
NMAP_SUBNETS          # Optional CIDRs: 10.X.X.0/24,10.X.X.0/24
SNMP_HOSTS            # Optional JSON array: [{"host":"…","community":"public","port":161}]

SCAN_INTERVAL_SECONDS          # Discovery cycle frequency (default: 300)
SYSLOG_PORT                    # UDP port for syslog receiver (default: 514, requires root)
ALERT_WEBHOOK_URL              # HTTP endpoint for device events
ALERT_DISAPPEARANCE_THRESHOLD  # Missed scans before firing device_gone (default: 3)
DB_PATH                        # SQLite file path (default: ./network_monitor.db)
```

---

## Security Considerations

The Docker Engine TCP sockets are unauthenticated — this is intentional for the LAN-internal use case, but access is controlled at the firewall. OPNsense rules restrict connections to port 2375 on each Docker host to the scanner's IP only. Same principle applies to the Proxmox API: tokens have read-only scope and are scoped per-node.

The syslog receiver on UDP 514 requires root to bind (or `CAP_NET_BIND_SERVICE`). The rest of the app runs without elevated privileges.

---

## Testing and Validation

| Test | Expected Result | Actual Result |
|---|---|---|
| OPNsense ARP pull | All cross-VLAN devices returned | ✅ Pass |
| OPNsense NDP pull | IPv6 addresses stored, link-local filtered | ✅ Pass |
| Proxmox VM inventory | All nodes polled, stopped VMs included | ✅ Pass |
| Docker container mapping | Containers on both Docker hosts enumerated | ✅ Pass |
| Host-networked container | Attributed to host, no phantom IP | ✅ Pass |
| DHCP hostname population | New device gets hostname from lease | ✅ Pass |
| Device alias persistence | Alias survives next scan cycle | ✅ Pass |
| Type override persistence | Custom type survives next scan cycle | ✅ Pass |
| Syslog `filterlog` parsing | OPNsense firewall log readable in UI | ✅ Pass |
| Secondary syslog IP | Logs fetched from override IP, not primary | ✅ Pass |
| `device_gone` webhook | Fires after configured disappearance threshold | ✅ Pass |
| `device_discovered` webhook | Fires on first observation of new MAC | ✅ Pass |
| `/api/health` staleness | Source marked stale after 2× scan interval | ✅ Pass |
| DB schema migration | New columns added to existing DB without data loss | ✅ Pass |

---

## Development History

The project went through four main phases before reaching its current state, each addressing a specific limitation of the previous approach.

### Phase 1 — ARP Prototype
Started with `scapy.srp()` wrapped in `run_in_executor`, a MAC OUI vendor lookup, and a CLI entrypoint. Saw exactly one VLAN. Required root. No persistence, no UI.

### Phase 2 — Docker & Proxmox Enrichment
Added `DockerInfo` and `ProxmoxInfo` dataclasses. Docker queried over TCP sockets with Unix socket fallback. Proxmox authenticated via `proxmoxer` API tokens — regex patterns extract MACs from Proxmox net config strings (`virtio`, `e1000`, `hwaddr=`). All nodes and hosts queried concurrently via `asyncio.gather` + `run_in_executor`.

### Phase 3 — Service, Persistence & Syslog
The project became a running service: SQLite schema with `upsert_device()` (alias excluded from upsert so manual labels survive), FastAPI background scan loop via `lifespan`, and the async UDP syslog receiver. RFC 3164, RFC 5424, and OPNsense `filterlog` CSV all handled. rsyslog relay support: when UDP source is `127.0.0.1`, the HOSTNAME field from the message is used as the real source IP.

### P1 Audit — Schema Migrations & OPNsense Module
Idempotent `_migrate_add_columns()` added `ipv6`, `custom_type`, `disappearance_count`, `notes`, `scan_count`, and `syslog_ip` to existing databases without breaking them. OPNsense queries extracted into `src/opnsense.py`. Both ARP and NDP response envelope formats handled (`list` or `{"arp": [...]}`). Multicast, broadcast, and incomplete entries filtered. NDP link-local (`fe80:`) addresses skipped.

### P2 Audit — Scapy Removed, 7-Source Merge
The most significant change: `scapy.srp()` removed from the main discovery loop entirely, replaced by `query_opnsense()`. Seven sources now run concurrently. Merge priority: OPNsense ARP → nmap/SNMP (MACs not in ARP only) → Proxmox enrichment (or offline upsert) → NDP-only rows → Docker upserts independent.

### P3/P4 — Enriched Discovery & Dashboard Overhaul
Added nmap (`-sn -oX -`, XML parse, 120s timeout) and SNMP (`ipNetToMediaPhysAddress` MIB walk via `snmpwalk` subprocess). New API endpoints for notes, type overrides, secondary syslog IP, global log search, inventory export, and source health. Frontend rebuilt with per-type count chips, per-source health indicator dots, bulk checkbox actions, and a slide-in detail panel with inline editors for alias, type, notes, and syslog IP — plus a colour-coded syslog viewer per device.

---

## File Structure

```
src/
  main.py           FastAPI app, lifespan, scan loop, all API endpoints
  database.py       SQLite schema, migrations, async CRUD (devices + syslogs)
  opnsense.py       OPNsense ARP, NDP, and DHCP REST API clients
  identifiers.py    Docker (multi-host) and Proxmox (multi-node) discovery
  nmap_scanner.py   Optional nmap subprocess ping sweep
  snmp_scanner.py   Optional SNMP ARP-cache MIB walk
  syslog_server.py  Async UDP syslog receiver (RFC 3164, RFC 5424, filterlog)
  scanner.py        Legacy scapy ARP scanner (CLI use only)

frontend/
  index.html        Single-page dark-mode dashboard (vanilla JS + Tailwind CDN)

scan.py             CLI entrypoint for manual ARP scans
requirements.txt    Python dependencies
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Serve the dashboard HTML |
| `GET` | `/api/devices` | List all devices (filterable: `device_type`, `search`, `since`; paginated: `limit`, `offset`) |
| `GET` | `/api/devices/export` | Download inventory as CSV or JSON (`?format=csv\|json`) |
| `GET` | `/api/logs/{ip}` | Last 50 syslogs for a device IP |
| `GET` | `/api/logs` | Global syslog search (`?q=term&limit=N`) |
| `PUT` | `/api/devices/{mac}/alias` | Set human-readable alias |
| `PUT` | `/api/devices/{mac}/type` | Override device type (null to clear) |
| `PUT` | `/api/devices/{mac}/notes` | Set/clear operator notes |
| `PUT` | `/api/devices/{mac}/syslog-ip` | Set/clear secondary syslog IP |
| `GET` | `/api/health` | Per-source discovery health status |

---

## Future Enhancements

- **TLS for Docker sockets** — replace unauthenticated TCP with mutual TLS for the Docker Engine connections
- **LLDP/CDP ingestion** — pull neighbor tables from managed switches via SNMP to map physical port topology
- **Historical graphing** — track device online/offline history over time with a simple time-series view in the dashboard
- **Containerized deployment** — package as a Docker Compose stack with a health check and automatic restart policy

---

## Documentation and Maintenance

**VLAN Assignment:** 30 (HOMELAB)
**Stack:** Python 3.12, FastAPI, SQLite, Tailwind CSS
**Status:** Production — running continuously, scan interval 5 minutes

### Change Management

1. Test API credential changes in a dev `.env` first — a bad OPNsense key silently returns empty results rather than throwing
2. Adding a new Proxmox node: append to `PROXMOX_NODES` JSON array, restart the app, verify node appears in `/api/health`
3. Adding a new Docker host: append to `DOCKER_HOSTS`, no restart needed if hot-reload is enabled

---

**Project Date:** February 2026
**Last Updated:** March 2026
**Status:** Production
