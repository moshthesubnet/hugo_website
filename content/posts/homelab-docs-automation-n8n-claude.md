---
title: "Automating Homelab Documentation with n8n and Claude Code"
date: 2026-03-05
lastmod: 2026-03-05
draft: false
description: "Homelab docs go stale in hours. My n8n pipeline polls OPNsense, diffs state, and triggers Claude Code via SSH to update docs. Five gotchas from building this."
summary: "OPNsense API → n8n → Claude Code via SSH → NetBox YAML + Obsidian Markdown → Syncthing vault on TrueNAS. A documentation pipeline that updates itself, plus the five gotchas that made me want to close the laptop and go touch grass."
cover: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&q=80"
tags:
  - homelab
  - n8n
  - automation
  - opnsense
  - networking
  - claude-code
  - obsidian
  - truenas
  - documentation
---

![Dense network cables snake through dark server rack enclosures lit by green LEDs in a data center.](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&q=80)
*Photo by Taylor Vick on Unsplash*

Homelab documentation has a half-life. You write it once, it's accurate for maybe 48 hours, then you add a VLAN, rename a firewall alias, move a VM, and quietly close the Obsidian tab without updating anything. Multiply that by six months of weekend tinkering and you have a vault full of beautiful lies.

{{< alert >}}
**TL;DR:** n8n polls the OPNsense REST API every 15 minutes, diffs against saved state, SSHs into a Claude Code VM, and writes updated NetBox YAML and Obsidian Markdown to a Syncthing-replicated TrueNAS vault. Zero manual steps. Five gotchas below.
{{< /alert >}}

The [Stack Overflow 2024 developer survey](https://survey.stackoverflow.co/2024/) found developers spend over 30 minutes per day searching for solutions because documentation is wrong or missing. In a homelab where you're also the one letting the docs rot, it's worse. I've been running this homelab as a hands-on learning environment for network and cloud engineering. The fix I wanted: documentation that updates itself.

## How Does the Pipeline Actually Work?

The architecture treats your network's live state as the single source of truth. n8n polls four OPNsense REST endpoints on a 15-minute schedule, compares the response against a saved JSON snapshot, and routes to a Claude Code SSH session only when something changed. Generated docs land on NFS-mounted TrueNAS storage that Syncthing replicates to every device.

Here's the full flow:

```text
OPNsense REST API (26.1.3)
    │
    ▼
n8n workflow (2.10.3) — pulls interfaces, aliases, routes, DHCP leases
    │
    ├── diff against saved state JSON
    │
    ▼ (if changes detected)
SSH → Claude Code VM
    │
    ├── generates NetBox-compatible YAML
    └── generates Obsidian Markdown
         │
         ▼
    NFS mount → TrueNAS dataset → Syncthing → Obsidian vault
```

If nothing changed — a quiet 15 minutes with no new leases, no modified aliases, no route additions — the workflow ends silently and logs nothing. No noise. No manual steps. No "I'll update the docs later." Later never comes.

## Why Use Claude Code Over SSH Instead of the Direct API?

Routing automation through Claude Code via SSH costs nothing beyond an existing Claude Pro subscription. The obvious approach — hitting the Anthropic API directly from n8n — bills separately from Pro. For a pipeline that fires every 15 minutes around the clock, that billing difference is real.

The other reason is context. Claude Code can see the existing documentation files, understand the structure, and update them incrementally rather than regenerating from scratch every run. A direct API call has no awareness of what the docs looked like before.

The tradeoff is latency and brittleness. An HTTP request completes in seconds. An SSH session that spins up Claude Code, hands it context, and waits for file writes takes longer and has more failure modes. For a scheduled documentation job, that's acceptable. For anything interactive, use the API.

## Setting Up the OPNsense API

The OPNsense REST API lives at `https://10.30.30.1/api/` — my homelab router handles the management network (10.30.30.0/24) and infrastructure VLAN (10.0.99.0/24). If you haven't worked with the OPNsense API before, I covered the auth model and endpoint basics in [my earlier post on OPNsense config backups](/posts/opnsense-backup-incident/).

Create a dedicated read-only API user: **System → Access → Users**, add a user, generate an API key. Under privileges, assign only what you need — I used `status` and `firewall` read permissions. No write access, no admin.

The four endpoints I'm pulling:

```http
GET /api/interfaces/overview/export          # interface state
GET /api/firewall/alias/searchItem           # firewall aliases
GET /api/routes/routes/searchroute           # static routes
GET /api/dhcpv4/leases/search_lease          # DHCP leases (26.1+)
```

That last endpoint matters, and I'll come back to it in the gotchas.

n8n's HTTP Request nodes handle auth with HTTP Basic using the API key and secret. The OPNsense API returns JSON, which n8n works with natively.

## How Does the n8n Workflow Pull and Diff Network State?

n8n 2.10.3 runs in Docker on the infrastructure VLAN (10.0.99.14). The workflow has six stages: a schedule trigger, four parallel HTTP Request nodes, chained Merge nodes to consolidate the results, a Code node that diffs against saved state, an IF node that branches on whether anything changed, and the SSH execution node.

The parallel API pull nodes each connect to a Merge node. n8n Merge nodes only take two inputs — you discover this the first time you try to fan in four data sources at once. The fix: chain them. Merge A+B into AB, merge AB+C into ABC, merge ABC+D into final. Annoying, functional, expanded in gotcha five.

The diff logic in the Code node:

```javascript
const fs = require('fs');
const statePath = '/data/homelab-state.json';

const current = $input.all()[0].json;

let previous = {};
try {
  previous = JSON.parse(fs.readFileSync(statePath, 'utf8'));
} catch (e) {
  // first run, no saved state
}

const changed = JSON.stringify(current) !== JSON.stringify(previous);

if (changed) {
  fs.writeFileSync(statePath, JSON.stringify(current, null, 2));
}

return [{ json: { changed, payload: current } }];
```

If `changed` is true, the IF node routes to SSH execution. If not, the workflow ends quietly.

## Triggering Claude Code Over SSH

The SSH node connects to 10.0.99.20 — a lightweight Ubuntu VM that exists solely to run Claude Code. The command:

```bash
/home/claude/.npm-global/bin/claude \
  --print \
  --no-auto-updates \
  "$(cat /tmp/doc-prompt.txt)"
```

The prompt is pre-written by the n8n Code node and dropped to `/tmp/doc-prompt.txt` via a separate Write File operation before the SSH call. The `--print` flag makes Claude Code output to stdout and exit rather than opening an interactive session — that's the behavior you want for automation.

## What Are the Five Gotchas That Cost Real Time?

This is the part that took the most time. Everything above sounds clean in retrospect. Getting there involved a lot of `exit code 1` and `permission denied`.

### 1. Non-Interactive SSH Sessions Don't Load .bashrc

When n8n connects over SSH and runs a command, it's a non-interactive, non-login shell. `.bashrc` and `.profile` don't run. Node, npm, and the `claude` binary installed perfectly fine during manual login were nowhere to be found.

The fix: use the full path to the binary. Find it with `which claude` in an interactive session, copy the absolute path, hardcode it in the SSH command. No aliases, no PATH magic.

If your Claude Code binary is installed via npm globally, it's probably at `/home/user/.npm-global/bin/claude` or `/usr/local/bin/claude`. If it's not where you expect, `find / -name claude -type f 2>/dev/null` will locate it.

### 2. OPNsense 26.1 Changed the DHCP API Endpoint

OPNsense 26.1 "Witty Woodpecker" made Dnsmasq the default DHCP server for fresh installs, replacing ISC-DHCP. The API path and response schema changed when the underlying daemon changed.

The current endpoint for lease queries on 26.1:

```http
GET /api/dhcpv4/leases/search_lease
```

If you wrote automation against an older OPNsense version, test the endpoint before assuming the schema is identical. The `active_lease` field moved. I was filtering on a key that no longer existed and getting empty results with no error — valid JSON, just not the JSON I expected. The [OPNsense 26.1 release notes](https://docs.opnsense.org/releases/CE_26.1.html) document this under the DHCP section.

### 3. n8n's Write to File Node Expects Binary, Not Text

n8n 2.10.3's "Read/Write Files from Disk" node does not accept plain text strings. It expects binary data.

The fix: add a "Convert to File" node between your text output and the write node. Set the input field to the text string, output MIME type `text/plain` or `text/markdown`. The Convert to File node produces a binary blob the Write node can handle.

The error message — `Property 'data' is missing` — does not suggest "convert your string to binary first."

### 4. NFS Permissions: TrueNAS and Container UIDs

The documentation output lands on a TrueNAS dataset mounted over NFS, owned by the Syncthing user at UID 568 — a TrueNAS-specific service account UID. The n8n container runs as its own user. Writes fail.

My fix: created a supplementary group on TrueNAS (GID 3000), added it to the dataset ACL with write permissions, then added that GID to the n8n container via `group_add` in Docker Compose:

```yaml
services:
  n8n:
    image: n8nio/n8n:2.10.3
    group_add:
      - "3000"
    volumes:
      - /mnt/docs:/docs
```

Make sure your NFS export has `mapall user` set appropriately or that the GID is honored by the export rules. `nfs4_getfacl` is your friend for debugging this.

### 5. Merge Node Chaining for 4+ Inputs

**Merge nodes accept exactly two inputs.** If you have four parallel data sources, you need three Merge nodes chained in sequence. The visual result looks like an ugly binary tree. That's fine — it works.

## What Does the Documentation Output Look Like?

The generated output has two forms: structured YAML for NetBox and narrative Markdown for the Obsidian vault. Both are written in the same Claude Code session, targeting the same NFS mount.

The NetBox YAML output for a DHCP lease entry:

```yaml
prefixes:
  - prefix: 10.30.30.0/24
    description: Management VLAN
    status: active
    vlan:
      vid: 30
      name: MGMT

ip_addresses:
  - address: 10.30.30.45/24
    dns_name: proxmox-01.mgmt.lab
    status: active
    assigned_object_type: dcim.interface
```

The Obsidian Markdown output reads like a network diagram in prose: a table of current leases, a section for each defined alias, and a diff summary at the top showing what changed since the last run. The diff is the part I actually look at. The full state is background context; the diff is the news.

## What's Next for the Pipeline?

Three additions are on the list, in rough priority order.

**Proxmox API collection.** The same n8n workflow pattern, pointed at the Proxmox API instead of OPNsense. VM inventory, container states, storage pools. The Proxmox API is well-documented and the auth model is similar — API tokens with explicit permission scopes.

**Pi-hole integration.** DNS query logs and the local DNS record list. Useful for tracking which services are actually getting hit, and for maintaining a source-of-truth list of local DNS entries that doesn't live only inside Pi-hole's admin UI.

**NetBox push.** Right now the YAML output lands in the vault as reference material. The next step is wiring up the NetBox API so the YAML gets imported automatically. NetBox has a solid REST API and there's an n8n community node for it.

The longer-term goal: treat the Obsidian vault as a queryable graph. Link firewall alias definitions to the services that use them. Cross-reference DHCP leases against VM inventory. Surface when a lease exists for an IP with no corresponding DNS entry. Documentation as infrastructure, not an afterthought.

The pipeline is running. The docs are updating. r/homelab has over 810,000 members, which means there are at least 810,000 people with stale homelab documentation. This one's for them.

---

*Running OPNsense 26.1.3, n8n 2.10.3 on Docker, TrueNAS SCALE 24.10.2, and Claude Code on Ubuntu 22.04. The NFS mount is persistent across reboots and the n8n workflow runs without manual intervention. Until it doesn't — at which point I'll write about that too.*

## Frequently Asked Questions

**Can you use the Anthropic API directly instead of Claude Code?**

Yes, and for simpler cases it's cleaner. A direct API call from n8n completes in seconds and has fewer failure modes than an SSH session. The reason to route through Claude Code instead: if you're already paying for Claude Pro, Claude Code automation runs on that subscription at no additional cost. The Anthropic API bills separately per token.

**Does this work with routers other than OPNsense?**

The n8n workflow pattern works with any network device that exposes a REST API — pfSense, Mikrotik RouterOS 7+, or Ubiquiti UniFi all have documented REST interfaces. The diff logic and Claude Code SSH execution are router-agnostic. Swap the HTTP Request nodes and adjust the payload schema for your device.

**How do you handle SSH authentication between n8n and Claude Code?**

SSH key authentication. The n8n container mounts a private key at a known path; the Claude Code VM's `authorized_keys` file holds the corresponding public key. Password-based SSH in automation is a bad pattern — harder to rotate, easier to leak, and impossible to scope to a single host.

**What happens when the pipeline fails?**

n8n logs all execution failures with the error message and the node that threw it. I set up an Error Trigger workflow that sends a notification on failure. Because documentation isn't real-time-critical, a few missed runs means docs lag by an hour at most — acceptable for a homelab.

**Is the Claude Code VM always running?**

Yes, it's a persistent Ubuntu 22.04 VM on Proxmox — 2 vCPUs, 4GB RAM, mostly idle between SSH calls. You could snapshot it and spin it up on demand, but the startup overhead makes the 15-minute polling window awkward. Idle VM cost is cheap enough to leave it up.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/posts/homelab-docs-automation-n8n-claude/#article",
      "headline": "Automating Homelab Documentation with n8n and Claude Code",
      "description": "Homelab docs go stale in hours. My n8n pipeline polls OPNsense, diffs state, and triggers Claude Code via SSH to update docs. Five gotchas from building this.",
      "datePublished": "2026-03-05T00:00:00Z",
      "dateModified": "2026-03-05T00:00:00Z",
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
        "url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&q=80",
        "width": 1200,
        "height": 630,
        "caption": "Dense network cables in a dark server rack lit by green LEDs"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/posts/homelab-docs-automation-n8n-claude/"
      },
      "articleSection": "Homelab",
      "keywords": ["homelab", "n8n", "automation", "OPNsense", "Claude Code", "documentation", "networking", "TrueNAS", "Obsidian"],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/posts/homelab-docs-automation-n8n-claude/#breadcrumb",
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
          "name": "Automating Homelab Documentation with n8n and Claude Code",
          "item": "https://moshthesubnet.com/posts/homelab-docs-automation-n8n-claude/"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://moshthesubnet.com/posts/homelab-docs-automation-n8n-claude/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Can you use the Anthropic API directly instead of Claude Code for homelab automation?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. A direct API call from n8n completes in seconds and has fewer failure modes than SSH. The reason to route through Claude Code instead: if you're already paying for Claude Pro, Claude Code automation runs on that subscription at no additional cost. The Anthropic API bills separately per token."
          }
        },
        {
          "@type": "Question",
          "name": "Does this n8n documentation pipeline work with routers other than OPNsense?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The pattern works with any network device that exposes a REST API — pfSense, Mikrotik RouterOS 7+, and Ubiquiti UniFi all have documented REST interfaces. The diff logic and Claude Code SSH execution are router-agnostic. Swap the HTTP Request nodes and adjust the payload schema for your device."
          }
        },
        {
          "@type": "Question",
          "name": "How do you authenticate the SSH connection between n8n and Claude Code?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "SSH key authentication. The n8n container mounts a private key at a known path; the Claude Code VM's authorized_keys file holds the corresponding public key. Password-based SSH in automation is bad practice — harder to rotate, easier to leak, and impossible to scope to a single host."
          }
        },
        {
          "@type": "Question",
          "name": "What happens when the n8n to Claude Code automation pipeline fails?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "n8n logs all execution failures with the error message and the node that threw it. An Error Trigger workflow sends a notification on failure. Because documentation is not real-time-critical, a few missed runs means docs lag by an hour at most — acceptable for a homelab environment."
          }
        },
        {
          "@type": "Question",
          "name": "Does the Claude Code VM need to be running at all times?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, it runs as a persistent VM on Proxmox — 2 vCPUs, 4GB RAM, mostly idle between SSH calls. You could spin it up on demand, but startup overhead makes the 15-minute polling window awkward. The idle resource cost is low enough that keeping it always-on is the simpler choice."
          }
        }
      ]
    }
  ]
}
</script>
