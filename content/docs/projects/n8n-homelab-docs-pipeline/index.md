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

<div class="mermaid-zoom-container" id="arch-diagram">
  <div class="mermaid-zoom-controls">
    <button class="mermaid-btn" id="arch-zoom-in" title="Zoom in">+</button>
    <button class="mermaid-btn" id="arch-zoom-reset" title="Reset view">↺</button>
    <button class="mermaid-btn" id="arch-zoom-out" title="Zoom out">−</button>
  </div>
  <div class="mermaid-zoom-hint">scroll to zoom &middot; drag to pan</div>
  <div class="mermaid-zoom-viewport" id="arch-viewport">

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

  </div>
</div>

<style>
.mermaid-zoom-container {
  position: relative;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  background: #0d0d0d;
  overflow: hidden;
  min-height: 420px;
  margin: 1.5rem 0;
  user-select: none;
}
.mermaid-zoom-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 6px;
}
.mermaid-btn {
  background: #1a1a2e;
  color: #b794f4;
  border: 1px solid #553c9a;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.mermaid-btn:hover {
  background: #553c9a;
  color: #faf5ff;
}
.mermaid-zoom-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: #4a4a6a;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}
.mermaid-zoom-viewport {
  cursor: grab;
  width: 100%;
  height: 100%;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-sizing: border-box;
}
.mermaid-zoom-viewport:active {
  cursor: grabbing;
}
.mermaid-zoom-viewport svg {
  display: block;
  width: 100%;
  max-width: none !important;
  height: auto;
}
</style>

<script>
(function () {
  function initZoom() {
    var viewport = document.getElementById('arch-viewport');
    if (!viewport) return;

    var origVB = null;
    var curVB  = null;
    var dragging = false, startX, startY, startVBX, startVBY;

    function getSvg() { return viewport.querySelector('svg'); }

    /* Store original viewBox once SVG is ready */
    function initSvg(svg) {
      var vb = svg.viewBox.baseVal;
      origVB = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
      curVB  = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
    }

    /* Write curVB back to the SVG — pure vector, always crisp */
    function applyViewBox() {
      var svg = getSvg();
      if (svg && curVB) {
        svg.setAttribute('viewBox', curVB.x + ' ' + curVB.y + ' ' + curVB.w + ' ' + curVB.h);
      }
    }

    /* Convert screen-pixel delta to SVG-unit delta at current zoom */
    function pxToSvgUnits(dx, dy) {
      var rect = getSvg().getBoundingClientRect();
      return {
        x: dx * (curVB.w / rect.width),
        y: dy * (curVB.h / rect.height)
      };
    }

    function zoomBy(factor) {
      var newW = curVB.w / factor;
      var newH = curVB.h / factor;
      curVB.x += (curVB.w - newW) / 2;
      curVB.y += (curVB.h - newH) / 2;
      curVB.w  = newW;
      curVB.h  = newH;
      applyViewBox();
    }

    function waitForSvg() {
      var svg = getSvg();
      if (svg && svg.viewBox.baseVal.width > 0) { initSvg(svg); return; }
      new MutationObserver(function (_, obs) {
        var s = getSvg();
        if (s && s.viewBox.baseVal.width > 0) { obs.disconnect(); initSvg(s); }
      }).observe(viewport, { childList: true, subtree: true, attributes: true });
    }
    waitForSvg();

    document.getElementById('arch-zoom-in').addEventListener('click', function () {
      if (curVB) zoomBy(1.3);
    });
    document.getElementById('arch-zoom-out').addEventListener('click', function () {
      if (curVB) zoomBy(1 / 1.3);
    });
    document.getElementById('arch-zoom-reset').addEventListener('click', function () {
      if (origVB) { curVB = { x: origVB.x, y: origVB.y, w: origVB.w, h: origVB.h }; applyViewBox(); }
    });

    viewport.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (!curVB) return;
      zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    }, { passive: false });

    viewport.addEventListener('mousedown', function (e) {
      if (e.button !== 0 || !curVB) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startVBX = curVB.x; startVBY = curVB.y;
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging || !curVB) return;
      var delta = pxToSvgUnits(startX - e.clientX, startY - e.clientY);
      curVB.x = startVBX + delta.x;
      curVB.y = startVBY + delta.y;
      applyViewBox();
    });
    window.addEventListener('mouseup', function () { dragging = false; });

    var lastDist = null;
    viewport.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      } else if (e.touches.length === 1 && curVB) {
        dragging = true;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        startVBX = curVB.x; startVBY = curVB.y;
      }
    }, { passive: true });
    viewport.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && lastDist && curVB) {
        var dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        zoomBy(dist / lastDist);
        lastDist = dist;
        e.preventDefault();
      } else if (e.touches.length === 1 && dragging && curVB) {
        var delta = pxToSvgUnits(startX - e.touches[0].clientX, startY - e.touches[0].clientY);
        curVB.x = startVBX + delta.x;
        curVB.y = startVBY + delta.y;
        applyViewBox();
      }
    }, { passive: false });
    viewport.addEventListener('touchend', function () { dragging = false; lastDist = null; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZoom);
  } else {
    initZoom();
  }
})();
</script>

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

The workflow has 20 nodes across six logical stages. Both triggers fan into the same pipeline — the weekly schedule runs at 6am, the manual trigger is for on-demand runs.

{{< mermaid >}}
flowchart TD
    subgraph triggers["Triggers"]
        SCHED["Weekly 6am Trigger<br/>(Schedule)"]
        MANUAL["Manual Trigger"]
    end

    subgraph collect["API Collection (parallel)"]
        GI["Get Interfaces"]
        GA["Get Aliases"]
        GR["Get Routes"]
        GD["Get DHCP Leases<br/>(dnsmasq)"]
    end

    subgraph merge["Merge Chain"]
        M1["Merge1<br/>Interfaces + Aliases"]
        M2["Merge2<br/>Routes + DHCP"]
        M3["Merge3<br/>All 4 combined"]
    end

    subgraph state["State & Diff"]
        BSO["Build State Object<br/>(Code)"]
        RPS["Read Previous State<br/>(ReadWriteFile)"]
        DIFF["Diff: Detect Changes<br/>(Code — per section)"]
        IF["Changes Detected?<br/>(IF node)"]
    end

    subgraph claude["Claude Pipeline"]
        BCP["Build Claude Prompt<br/>(Code)"]
        SSH["SSH: Claude Code<br/>claude -p --dangerously-skip-permissions"]
        PCR["Parse Claude Response<br/>(Code — split on ===SPLIT===)"]
    end

    subgraph output["Output (parallel)"]
        WV["Write to Vault<br/>opnsense.yml + opnsense.md"]
        BCE["Build Changelog Entry<br/>(Code)"]
        SCS["Save Current State<br/>opnsense-state.json"]
        AC["Append Changelog<br/>changelog.md"]
        SKIP["No Changes — Skip<br/>(noOp)"]
    end

    SCHED --> GI & GA & GR & GD
    MANUAL --> GI & GA & GR & GD

    GI --> M1
    GA --> M1
    GR --> M2
    GD --> M2
    M1 --> M3
    M2 --> M3
    M3 --> BSO

    BSO --> RPS
    BSO --> DIFF
    RPS --> DIFF
    DIFF --> IF

    IF -->|true| BCP
    IF -->|false| SKIP

    BCP --> SSH
    SSH --> PCR

    PCR --> WV
    PCR --> BCE
    PCR --> SCS
    BCE --> AC

    classDef trigger fill:#1a365d,stroke:#63b3ed,stroke-width:2px,color:#ebf8ff
    classDef api fill:#1a202c,stroke:#4fd1c5,stroke-width:2px,color:#e6fffa
    classDef merge fill:#2d3748,stroke:#718096,stroke-width:1px,color:#e2e8f0
    classDef code fill:#44337a,stroke:#b794f4,stroke-width:2px,color:#faf5ff
    classDef io fill:#5f370e,stroke:#f6ad55,stroke-width:2px,color:#fffaf0
    classDef skip fill:#1a202c,stroke:#4a5568,stroke-width:1px,color:#718096

    class SCHED,MANUAL trigger
    class GI,GA,GR,GD api
    class M1,M2,M3 merge
    class BSO,RPS,DIFF,IF,BCP,PCR,BCE code
    class SSH,WV,SCS,AC io
    class SKIP skip
{{< /mermaid >}}

**Stage 1 — Triggers:** Both the weekly schedule (Monday, 6am) and the manual trigger fan out simultaneously to all four HTTP Request nodes. There's no ordering between them — n8n fires all four in parallel.

**Stage 2 — API Collection:** Four HTTP Request nodes hit the OPNsense REST API with Basic auth using a dedicated read-only API key. All four run in parallel:

| Node | Endpoint |
|------|----------|
| Get Interfaces | `/api/diagnostics/interface/getInterfaceConfig` |
| Get Aliases | `/api/firewall/alias/searchItem` |
| Get Routes | `/api/routes/routes/searchroute` |
| Get DHCP Leases | `/api/dnsmasq/leases/search` |

**Stage 3 — Merge Chain:** Merge nodes accept exactly two inputs, so the four responses are consolidated with a binary tree: Interfaces + Aliases → Merge1, Routes + DHCP → Merge2, then Merge1 + Merge2 → Merge3.

**Stage 4 — State & Diff:** `Build State Object` assembles a single JSON document with a `collected_at` timestamp and all four data sections, then fans out to two nodes simultaneously: it triggers `Read Previous State` (a ReadWriteFile node reading `opnsense-state.json` from the vault, `continueOnFail: true` to handle the first run) and feeds `Diff: Detect Changes` directly. Both paths converge at the Diff node, which compares each section independently — interfaces, aliases, routes, and DHCP leases — and produces a `has_changes` boolean and a human-readable `changes` array.

**Stage 5 — Claude Pipeline:** If changes are detected, `Build Claude Prompt` constructs the full prompt with the current state JSON and the changes list, then passes it inline to the SSH node. The command run on the Claude Code VM:

```bash
/home/skyler/.local/bin/claude -p --dangerously-skip-permissions '{prompt}'
```

Claude is instructed to return two outputs separated by `===SPLIT===`: a NetBox-compatible YAML file first, then the Obsidian Markdown doc. `Parse Claude Response` splits on that delimiter and strips any code fences Claude adds.

**Stage 6 — Output (parallel):** `Parse Claude Response` fans out to three Code nodes simultaneously:
- **Write to Vault** — writes `opnsense.yml` and `opnsense.md` to `/vault/homelab/topology/devices/` using `fs.writeFileSync`
- **Build Changelog Entry** → **Append Changelog** — formats a timestamped markdown entry and appends it to `/vault/homelab/topology/changelog.md`
- **Save Current State** — overwrites `opnsense-state.json` with the current run's data so the next diff has a baseline

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
