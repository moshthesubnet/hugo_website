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

*Cross-VLAN device inventory via authenticated APIs — the router and hypervisor already know everything, so just ask them.*

---

## Project Overview

A FastAPI app that builds a cross-VLAN device inventory by querying OPNsense, Proxmox, and Docker directly. Everything lands in SQLite, renders on a dark-mode dashboard, and fires webhooks when devices appear or disappear.

## Summary

Standard ARP scanners are blind across VLAN boundaries. This app skips the scanning entirely — it queries OPNsense's global ARP/NDP tables, Proxmox's VM/LXC inventory, and Docker's container API concurrently and merges the results into a single device registry.

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

Docker containers using `--network host` share the daemon host's MAC and IP. The app attributes them back to the physical host's existing ARP entry rather than creating phantom device entries for each one.

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

- OPNsense provides the global ARP table (IPv4) and NDP neighbour table (IPv6) in a single API call, covering every VLAN it routes. Devices that only appear in NDP — IPv6-only endpoints with no ARP entry — get their own row with a null IPv4 field.
- Proxmox nodes are polled concurrently with per-node API tokens. The QEMU Guest Agent provides a live IP for running VMs before ARP resolves; offline VMs stay in the inventory with their last-known IP and a `stopped` badge rather than dropping off when the lease expires.
- Multiple Docker hosts are queried in parallel. Host-networked containers (`--network host`) are attributed back to the physical host's ARP entry rather than stored as separate rows with duplicate IPs. The detail panel for each container shows a **Host** row that resolves to the host device's alias when one is set. Logspout can be deployed per Docker host to stream container stdout/stderr into the syslog receiver, with logs attributed to the host's device row.
- nmap and SNMP are optional supplemental sources — useful for subnets OPNsense doesn't route or managed switches with ARP caches worth walking. OPNsense takes priority on any IP conflict.
- The syslog receiver parses RFC 3164, RFC 5424, and OPNsense `filterlog` CSV. All three land in the same device-linked log view. Appliances that send syslog from a management interface different from their data IP can have a secondary syslog IP set per-device.
- Disappearance tracking increments a counter each scan a device isn't seen. At `ALERT_DISAPPEARANCE_THRESHOLD` missed cycles (default: 3), a `device_gone` webhook fires. New MACs trigger `device_discovered`. Both POST a JSON payload with MAC, IP, alias, vendor, type, and last-seen timestamp.
- `/api/health` reports `ok` / `stale` / `unknown` for each of the seven discovery sources, with the last-success timestamp and result count. Staleness threshold is `SCAN_INTERVAL * 2`.
- The device table supports inline alias editing, type override, free-text notes, and secondary syslog IP — all persist across scan cycles. Bulk checkbox selection enables mass retype or JSON export of a filtered subset. Full inventory export as CSV or JSON is also available.

---

## Environment Configuration

Credentials and endpoints via environment variables (`.env` supported via `python-dotenv`):

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

The Docker Engine TCP sockets are unauthenticated — intentional for LAN-internal use, with OPNsense rules restricting port 2375 on each Docker host to the scanner's IP only. Proxmox API tokens are read-only and scoped per-node.

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

Six development phases, each triggered by a specific limitation hitting production.

### Phase 1 — ARP Prototype
Started with `scapy.srp()` wrapped in `run_in_executor`, a MAC OUI vendor lookup, and a CLI entrypoint. Saw exactly one VLAN. Required root. No persistence, no UI.

### Phase 2 — Docker & Proxmox Enrichment
Added `DockerInfo` and `ProxmoxInfo` dataclasses. Docker queried over TCP sockets with Unix socket fallback. Proxmox authenticated via `proxmoxer` API tokens — regex patterns extract MACs from Proxmox net config strings (`virtio`, `e1000`, `hwaddr=`). All nodes and hosts queried concurrently via `asyncio.gather` + `run_in_executor`.

### Phase 3 — Service, Persistence & Syslog
The project became a running service: SQLite schema with `upsert_device()` (alias excluded from upsert so manual labels survive), FastAPI background scan loop via `lifespan`, and the async UDP syslog receiver. RFC 3164, RFC 5424, and OPNsense `filterlog` CSV all handled. rsyslog relay support: when UDP source is `127.0.0.1`, the HOSTNAME field from the message is used as the real source IP.

### P1 Audit — Schema Migrations & OPNsense Module
Idempotent `_migrate_add_columns()` added `ipv6`, `custom_type`, `disappearance_count`, `notes`, `scan_count`, and `syslog_ip` to existing databases without breaking them. OPNsense queries extracted into `src/opnsense.py`. Both ARP and NDP response envelope formats handled (`list` or `{"arp": [...]}`). Multicast, broadcast, and incomplete entries filtered. NDP link-local (`fe80:`) addresses skipped.

### P2 Audit — Scapy Removed, 7-Source Merge
`scapy.srp()` was pulled from the main discovery loop and replaced by `query_opnsense()`. Seven sources now run concurrently. Merge priority: OPNsense ARP → nmap/SNMP (MACs not in ARP only) → Proxmox enrichment (or offline upsert) → NDP-only rows → Docker upserts independent.

### P3/P4 — Enriched Discovery & Dashboard Overhaul
Added nmap (`-sn -oX -`, XML parse, 120s timeout) and SNMP (`ipNetToMediaPhysAddress` MIB walk via `snmpwalk` subprocess). New API endpoints for notes, type overrides, secondary syslog IP, global log search, inventory export, and source health. Frontend rebuilt with per-type count chips, per-source health indicator dots, bulk checkbox actions, and a slide-in detail panel with inline editors for alias, type, notes, and syslog IP — plus a colour-coded syslog viewer per device.

### P5 — Host-Network Container Fix & Docker Host Attribution

#### Problem: Host-Network Containers Overwriting Docker Host Identity
Containers running with `--network host` share the daemon host's MAC address and IP — no independent network identity. The previous merge logic upserted these containers directly onto the host device record, overwriting its `device_type` with `docker-container` and `vendor` with `"Docker"`. If multiple host-network containers ran on the same host (e.g. rustdesk alongside logspout), the last container processed each scan cycle would clobber all prior metadata.

#### Fix: Accumulate Without Overwriting
- Host-network containers are collected into `_host_net_containers: dict[str, list[dict]]`, keyed by resolved host MAC, instead of being immediately upserted.
- After the main merge loop, `merge_host_containers(mac, containers)` is called once per host — reads the existing `metadata` JSON, injects `host_network_containers` as a list, and writes it back **without touching `device_type`, `vendor`, or any other column**.
- The Docker host keeps its `bare-metal` type and vendor identity. Its metadata now carries a `host_network_containers` array listing every `--network host` container currently running on it.

#### Docker Host Attribution
- `docker_host: str = ""` field added to `DockerInfo` dataclass, populated for every container: IP extracted from the TCP socket URL (`tcp://10.30.40.2:2375` → `"10.30.40.2"`), or `"localhost"` for Unix socket.
- Stored in each container's `metadata` JSON blob.
- Frontend: the Docker Container Details panel shows a **Host** row. At render time `allDevices` is searched for a device whose IP matches `metadata.docker_host`. If found and aliased, displays `"DockerHost1 (10.30.40.2)"`; falls back to the raw IP. Setting an alias on the Docker host retroactively improves the label for all containers on that host without a re-scan.

#### Logspout Syslog Forwarding
To stream container stdout/stderr into the syslog receiver, deploy one Logspout container per Docker host:

```bash
sudo docker run -d --name logspout --restart=always \
  -e SYSLOG_HOSTNAME=$(hostname) \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gliderlabs/logspout syslog+udp://MONITOR_IP:514
```

Logspout mounts the Docker socket, tails all container logs, and forwards them as UDP syslog datagrams. Messages arrive from the Docker host's IP so logs are attributed to the correct host device row. The container name is embedded in the syslog message body. The syslog receiver handles these without modification.

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

- TLS for Docker sockets: the TCP connections currently rely on firewall rules for access control. Mutual TLS would be a cleaner boundary.
- LLDP/CDP ingestion from managed switches via SNMP to map physical port topology alongside the IP inventory.
- Historical device presence graphing — `disappearance_count` tracks absence but doesn't record when a device came back. A time-series table would close that gap.
- Docker Compose packaging with a health check and restart policy.

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
