---
title: "n8n Homelab Docs Pipeline"
date: 2026-02-28
lastmod: 2026-03-05
description: "Automated homelab documentation pipeline. n8n pulls live state from OPNsense, diffs it, and triggers Claude Code over SSH to regenerate Obsidian Markdown and NetBox YAML on every change."
summary: "An n8n workflow that keeps homelab docs honest — polling OPNsense weekly, detecting drift, and invoking Claude Code via SSH to rewrite topology docs automatically."
tags:
  - homelab
  - n8n
  - automation
  - claude-code
  - opnsense
  - obsidian
  - infrastructure-as-code
draft: false
mermaid: true
weight: 6
---

## What It Does

Homelab documentation rots. You add a VLAN, rename an alias, spin up a new VM, and the docs are immediately wrong. This pipeline treats the live network as the source of truth and keeps the docs in sync automatically.

A weekly n8n workflow pulls current state from four OPNsense REST API endpoints, diffs it against the last known state, and — if anything changed — SSHs into a dedicated Claude Code VM to regenerate two documentation artifacts: a NetBox-compatible YAML topology file and an Obsidian Markdown doc with frontmatter, tables, wiki-links, and a changelog entry. Both files land on a TrueNAS NFS share that Syncthing propagates to every device.

Zero manual steps. The docs update themselves.

---

## Architecture

{{< mermaid >}}
graph LR
  subgraph trigger["Trigger"]
    CRON["Weekly Cron<br/>(n8n Scheduler)"]
    MANUAL["Manual Trigger"]
  end
  
  subgraph servers["Servers VLAN - DockerHost1"]
    N8N["n8n 2.10.3<br/>(Docker)"]
    DIFF["Diff vs saved state"]
  end
  
  subgraph mgmt["MGMT VLAN"]
    OPN["OPNsense 26.1<br/>REST API"]
    TRUENAS["TrueNAS<br/>NFS Share"]
  end
  
  subgraph lab["Lab VLAN"]
    CLAUDE["Claude Code VM<br/>Ubuntu 24.04"]
  end
  
  subgraph sync["Syncthing"]
    OBSIDIAN["Obsidian Vault<br/>(all devices)"]
  end

  CRON --> N8N
  MANUAL --> N8N
  
  %% Corrected data flow
  N8N -->|"1. GET API state"| OPN
  OPN -->|"2. Return JSON"| DIFF
  DIFF -->|"3. SSH claude -p<br/>(if changed)"| CLAUDE
  CLAUDE -->|"4. Return stdout"| N8N
  N8N -->|"5. Write via NFS"| TRUENAS
  TRUENAS -->|"6. Background Sync"| OBSIDIAN

  classDef vlan fill:#121212,stroke:#4fd1c5,stroke-dasharray: 5 5,color:#eeeeee
  classDef service fill:#44337a,stroke:#b794f4,stroke-width:2px,color:#faf5ff
  classDef storage fill:#5f370e,stroke:#f6ad55,stroke-width:2px,color:#ffffff
  classDef trigger fill:#1a365d,stroke:#63b3ed,stroke-width:2px,color:#ebf8ff

  class trigger,servers,mgmt,lab,sync vlan
  class N8N,DIFF,CLAUDE service
  class TRUENAS,OBSIDIAN storage
  class CRON,MANUAL trigger
{{< /mermaid >}}

---

## Tech Stack

| Component | Role |
|-----------|------|
| **n8n 2.10.3** | Workflow orchestration — scheduling, HTTP, SSH, diffing, file writes |
| **OPNsense 26.1** | Network state source — interfaces, aliases, routes, DHCP leases |
| **Claude Code** | Documentation generation — runs `claude -p` non-interactively over SSH |
| **TrueNAS** | NFS share hosting the Obsidian vault |
| **Syncthing** | Vault replication to all devices |
| **Obsidian** | Documentation consumption |
| **Proxmox** | Hosts the Claude Code VM (Ubuntu 24.04, 2 vCPUs, 4GB RAM) |

---

## n8n Workflow Breakdown

The workflow has eight nodes in sequence:

1. **Schedule Trigger** — weekly cron with a manual trigger fallback
2. **HTTP Request ×4** — parallel pulls from four OPNsense endpoints
3. **Merge (chained ×3)** — consolidates the four parallel responses (Merge nodes only accept two inputs; chaining is required)
4. **Code node** — diffs current JSON against `/data/homelab-state.json`; writes new state if changed
5. **IF node** — routes on `changed: true/false`
6. **Convert to File** — serializes the prompt string to binary (required by the Write node)
7. **Write File** — drops the prompt to `/tmp/doc-prompt.txt` on the Claude Code VM
8. **SSH node** — executes `claude --print --no-auto-updates "$(cat /tmp/doc-prompt.txt)"`

The diff logic is a single `JSON.stringify` comparison. Blunt, but reliable for this use case — if the API response changed in any way, the docs get regenerated.

---

## OPNsense API Endpoints

Four endpoints cover the full network state picture:

```http
GET /api/interfaces/overview/export      # physical + VLAN interface state
GET /api/firewall/alias/searchItem       # all firewall aliases
GET /api/routes/routes/searchroute       # static routes
GET /api/dnsmasq/leases/search           # DHCP leases (OPNsense 26.1 / Dnsmasq)
```

Auth is HTTP Basic with a read-only API key scoped to `status` and `firewall` permissions — no write access, no admin. The API user was created under **System → Access → Users** specifically for this workflow.

---

## Documentation Output

**NetBox YAML** — structured topology data formatted for NetBox IPAM import:

```yaml
prefixes:
  - prefix: 10.30.30.0/24
    description: Lab VLAN — HomeLab VMs
    status: active
    vlan:
      vid: 30
      name: Lab

ip_addresses:
  - address: 10.30.30.X/24
    dns_name: vm-hostname.lab.local
    status: active
    assigned_object_type: dcim.interface
```

**Obsidian Markdown** — a human-readable topology doc with:
- Wiki-links to host entries (`[[NetBox]]`, `[[DockerHost1]]`, etc.)
- DHCP lease tables per VLAN
- Firewall alias inventory
- A changelog section showing what changed on this run

The changelog is what actually gets read. Full state is background context. The diff is the news.

---

## Challenges Solved

### NFS Permissions

TrueNAS runs Syncthing at UID 568 — a platform-specific service account. The n8n Docker container runs as its own user. Writes to the NFS share fail by default.

**Fix:** Created a supplementary group (GID 3000) on TrueNAS, added it to the dataset ACL with write permissions, and added it to the n8n container via `group_add` in Docker Compose:

```yaml
services:
  n8n:
    image: n8nio/n8n:2.10.3
    group_add:
      - "3000"
    volumes:
      - /mnt/docs:/docs
```

### Claude Code PATH in Non-Interactive SSH

n8n SSH sessions are non-interactive and non-login — `.bashrc` and `.profile` don't load. The `claude` binary is invisible to the shell.

**Fix:** Hardcode the full binary path. For a user-local npm install:

```bash
/home/skyler/.local/bin/claude --print --no-auto-updates "$(cat /tmp/doc-prompt.txt)"
```

Find it with `which claude` in an interactive session, then never use a shell alias or `$PATH` reference in the SSH command.

### n8n Code Node — No `fs` Module

The n8n Code node sandboxes JavaScript and blocks Node built-ins including `fs`. Reading and writing files from the Code node directly isn't possible.

**Fix:** Use the dedicated **Read/Write Files from Disk** node for file operations. The Code node handles the diff logic only; file I/O is a separate node.

### n8n Write Node — Binary Only

The Write node doesn't accept plain text strings. Passing a string directly throws `Property 'data' is missing`.

**Fix:** Add a **Convert to File** node before the Write node. Input: the text string. Output MIME type: `text/plain`. The Convert node produces the binary blob the Write node expects.

### OPNsense 26.1 DHCP Endpoint Change

OPNsense 26.1 switched the default DHCP daemon from ISC-DHCP to Dnsmasq. The API path changed:

```
# Old (pre-26.1)
GET /api/dhcpv4/leases/searchlease

# New (26.1+, Dnsmasq)
GET /api/dnsmasq/leases/search
```

The old endpoint returns valid JSON with zero results — no error, just silence. Check the [OPNsense 26.1 release notes](https://docs.opnsense.org/releases/CE_26.1.html) if your lease queries come back empty after an upgrade.

### Merge Node Input Limit

n8n Merge nodes accept exactly two inputs. With four parallel API calls, you need three chained Merge nodes:

```
A ──┐
    Merge(AB) ──┐
B ──┘            Merge(ABC) ──┐
C ──────────────┘              Merge(ABCD) → next node
D ─────────────────────────────┘
```

---

## Planned Additions

- **Proxmox API integration** — VM inventory, container states, storage pool usage from Pve1 and Pve3
- **Pi-hole integration** — DNS record list and query stats from both Pi-hole instances on the Servers VLAN
- **NetBox push** — auto-import the generated YAML via the NetBox REST API instead of leaving it as reference material
- **Vault graph queries** — cross-reference DHCP leases against VM inventory; surface hosts with no DNS entry

---

## Related

- [Blog post: Automating Homelab Documentation with n8n and Claude Code](/posts/homelab-docs-automation-n8n-claude/) — the full writeup with gotchas and reasoning
