---
title: "Automating Homelab Documentation with n8n and Claude Code"
aliases: ["/posts/homelab-docs-automation-n8n-claude/"]
date: 2026-03-05
lastmod: 2026-03-23
draft: false
description: "Homelab docs go stale fast. My n8n pipeline polls OPNsense weekly, diffs state, and triggers Claude Code via SSH to rewrite docs automatically. Five gotchas that cost real time."
summary: "OPNsense REST API → n8n on DockerHost1 → Claude Code VM via SSH → NetBox YAML + Obsidian Markdown → Syncthing vault on TrueNAS. A documentation pipeline that updates itself, plus the five gotchas that nearly broke it."
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
images: ["/blog/homelab-docs-automation-n8n-claude/og-card.png"]
---

Homelab documentation has a half-life. You write it once, it's accurate for maybe 48 hours, then you add a VLAN, rename a firewall alias, move a VM, and quietly close the Obsidian tab without updating anything. Six months of weekend tinkering later, you have a vault full of beautiful lies.

{{< alert >}}
**TL;DR:** n8n polls the OPNsense REST API on a weekly schedule, diffs against saved state, and SSHs into a dedicated Claude Code VM on the Lab VLAN when something changes. Updated NetBox YAML and Obsidian Markdown are written to TrueNAS storage via SSH from the Claude Code VM and sync everywhere via Syncthing. Zero manual steps. Five gotchas below.
{{< /alert >}}

[Jump to download ↓](#how-to-import-this-workflow)

My setup is a seven-VLAN OPNsense network (Lab, Servers, IoT, Home, MGMT, Malware analysis, and WireGuard for remote access), and the state changes constantly. The fix I wanted: documentation that updates itself.

## How It Works

The architecture treats live network state as the single source of truth. n8n polls four OPNsense REST endpoints on a weekly schedule, compares the response against a saved JSON snapshot, and only routes to a Claude Code SSH session when something actually changed. If nothing changed (a quiet week with no new leases, no modified aliases, no route additions) the workflow ends silently and logs nothing.

n8n runs in Docker on **DockerHost1** in the Servers VLAN (10.30.40.0/28), alongside the other production containers. The generated docs land on NFS-mounted TrueNAS storage in the MGMT VLAN, which Syncthing replicates to every device.

Here's the full flow:

```text
OPNsense REST API (26.1.3) — MGMT VLAN gateway
    │
    ▼
n8n workflow (2.10.3) — Servers VLAN, DockerHost1
    │
    ├── diff against saved state JSON
    │
    ▼ (if changes detected)
SSH → Claude Code VM — Lab VLAN (10.30.30.0/24)
    │
    ├── generates NetBox-compatible YAML
    └── generates Obsidian Markdown
         │
         ▼ (base64 SSH writes back from n8n)
    NFS mount on Claude Code VM → TrueNAS (MGMT VLAN) → Syncthing → Obsidian vault
```

## Why SSH Into Claude Code

The obvious approach is hitting the Anthropic API directly from n8n. It's cleaner, completes in seconds, has fewer failure modes. The reason to route through Claude Code over SSH instead: Claude Pro. If you're already paying for it, Claude Code automation runs on that subscription at no additional cost. The API bills separately per token.

The other reason is context. Claude Code can see the existing documentation files, understand the structure, and update them incrementally rather than regenerating from scratch on every run. A direct API call doesn't know what the docs looked like before.

The tradeoff is latency and brittleness. An SSH session that spins up Claude Code, hands it context, and waits for file writes takes longer and has more failure modes than an HTTP request. For a scheduled documentation job, that's acceptable. For anything interactive or latency-sensitive, use the API instead.

Weekly cadence fits a homelab where the network topology doesn't change daily. If you rename an alias or spin up a new VM mid-week, the docs catch up Monday at 6am. Good enough.

## Setting Up the OPNsense API

The OPNsense REST API is accessible at `https://10.0.99.X/api/`, via the MGMT VLAN gateway, which is where infrastructure management traffic belongs. If you haven't worked with the OPNsense API before, I covered the auth model and endpoint basics in [my earlier post on OPNsense config backups](/blog/opnsense-backup-incident/).

Create a dedicated read-only API user: **System → Access → Users**, add a user, generate an API key. Under privileges, assign only what you need. I used `status` and `firewall` read permissions. No write access, no admin.

The four endpoints I'm pulling:

```http
GET /api/interfaces/overview/export          # interface state
GET /api/firewall/alias/searchItem           # firewall aliases
GET /api/routes/routes/searchroute           # static routes
GET /api/dnsmasq/leases/search               # DHCP leases (26.1+, Dnsmasq)
```

That last endpoint matters, and I'll come back to it in the gotchas.

n8n's HTTP Request nodes handle auth with HTTP Basic using the API key and secret. The OPNsense API returns JSON, which n8n works with natively.

## Pulling and Diffing Network State

n8n 2.10.3 runs in Docker on DockerHost1 in the Servers VLAN (10.30.40.0/28). The workflow has six stages: a schedule trigger, four parallel HTTP Request nodes, chained Merge nodes to consolidate the results, a Code node that diffs against saved state, an IF node that branches on whether anything changed, and the SSH execution pipeline.

The parallel API pull nodes each connect to a chain of Merge nodes. n8n Merge nodes only accept two inputs, which you discover the first time you try to fan in four data sources at once. The fix: chain them. Interfaces + Aliases into Merge1, Routes + DHCP into Merge2, then Merge1 + Merge2 into Merge3, which feeds Build State Object. Annoying, functional, expanded in gotcha five.

The diff logic in the Code node compares each section independently:

```javascript
const current = $input.all()[0].json;
const previous = $('Read Previous State').first().json;

const sections = ['interfaces', 'aliases', 'routes', 'dhcp_leases'];
const changes = [];

for (const section of sections) {
  const curr = JSON.stringify(current[section]);
  const prev = JSON.stringify(previous[section] || {});
  if (curr !== prev) changes.push(`${section} changed`);
}

return [{ json: { has_changes: changes.length > 0, changes } }];
```

`Read Previous State` is a separate Code node that reads the saved JSON snapshot from the vault via `fs.readFileSync`. State saving happens at the end of the pipeline via SSH; see gotcha three.

If `has_changes` is true, the IF node routes to SSH execution. If not, the workflow ends quietly.

## Triggering Claude Code Over SSH

The SSH node connects to the Claude Code VM on the Lab VLAN (10.30.30.0/24), a dedicated Ubuntu 24.04 VM on Proxmox that exists solely to run Claude Code sessions. It's separate from TrueNAS, separate from DockerHost1. Keeping it isolated means a runaway prompt can't touch anything important.

The command:

```bash
/home/skyler/.local/bin/claude \
  --print \
  --no-auto-updates \
  "$(cat /tmp/doc-prompt.txt)"
```

The prompt is pre-written by the n8n Code node and written to `/tmp/doc-prompt.txt` by a separate SSH node before this one runs, which sidesteps shell escaping on a large JSON payload. The `--print` flag makes Claude Code output to stdout and exit rather than opening an interactive session, which is the behavior you need for automation.

## Five Gotchas That Cost Real Time

Everything above sounds clean in retrospect. Getting there involved a lot of `exit code 1` and `permission denied`. Worth documenting so you don't spend an afternoon on the same things.

### 1. Non-Interactive SSH Sessions Don't Load .bashrc

When n8n connects over SSH and runs a command, it's a non-interactive, non-login shell. `.bashrc` and `.profile` don't run. Node, npm, and the `claude` binary installed perfectly fine during manual login were nowhere to be found.

The fix: use the full path to the binary. Find it with `which claude` in an interactive session, copy the absolute path, hardcode it in the SSH command. No aliases, no PATH magic.

Depending on how you installed it, the binary is probably at `~/.local/bin/claude`, `~/.npm-global/bin/claude`, or `/usr/local/bin/claude`. If it's not where you expect, `find / -name claude -type f 2>/dev/null` will locate it.

### 2. OPNsense 26.1 Changed the DHCP API Endpoint

OPNsense 26.1 "Witty Woodpecker" made Dnsmasq the default DHCP server for fresh installs, replacing ISC-DHCP. The API path and response schema changed when the underlying daemon changed.

The lease endpoint moved with it:

```http
# Old (pre-26.1, ISC-DHCP)
GET /api/dhcpv4/leases/searchlease

# New (26.1+, Dnsmasq)
GET /api/dnsmasq/leases/search
```

If you wrote automation against an older OPNsense version, test the endpoint before assuming anything. The old path still answers with valid JSON and zero results, so there is no error to catch. I was filtering on a key that no longer existed and getting empty results with no error: valid JSON, just not the JSON I expected. The [OPNsense 26.1 release notes](https://docs.opnsense.org/releases/CE_26.1.html) document this under the DHCP section.

### 3. n8n Code Nodes Run on n8n's Docker Host, Not on Your Vault Host

This one cost several runs before I understood what was happening. A Code node in n8n executes JavaScript on the machine running n8n, which is DockerHost1 in the Servers VLAN. Not on llm-server. Not on the machine where `/mnt/vault1337` is NFS-mounted. Doing `fs.writeFileSync('/mnt/vault1337/homelab/...')` in a Code node writes to DockerHost1's filesystem, where that path doesn't exist. The error: `ENOENT: no such file or directory`.

The instinct is to mount the vault on DockerHost1 too. Don't. It means two NFS clients writing to the same paths, more permission surface, and another mount to break. The actual fix: route all vault writes through SSH nodes, targeting the host that already has the vault mounted.

Since `Buffer` isn't available in n8n expression evaluators (only in Code nodes), you can't base64-encode in the SSH command expression directly. The pattern that works:

1. **Code node**: parse Claude's output, pre-encode each file as base64 and attach it to the item JSON:
```javascript
const base64Content = Buffer.from(markdownOutput).toString('base64');
return [{ json: { filename: 'opnsense.md', base64Content } }];
```

2. **SSH node**: decode on the target host using the pre-encoded value:
```bash
echo '{{ $json.base64Content }}' | base64 -d > /mnt/vault1337/homelab/topology/devices/opnsense.md
```

No filesystem access required on DockerHost1. The target host handles the write. The base64 encoding sidesteps every shell escaping issue with arbitrary text content.

### 4. NFS Permissions Are Now the SSH Host's Problem

The documentation output lands on a TrueNAS dataset mounted over NFS at `/mnt/vault1337` on the Claude Code VM, owned by the Syncthing user at UID 568, a TrueNAS-specific service account. Since vault writes go through SSH nodes (see gotcha three), the n8n container itself never touches NFS. No `group_add`, no volume mounts on DockerHost1 needed.

The permissions problem shifts entirely to the SSH target host. That host's user needs write access to the NFS mount. My fix: created a supplementary group on TrueNAS (GID 3000), added it to the dataset ACL with write permissions, added the SSH user to that group on llm-server, and confirmed NFS export honors the GID:

```bash
# on TrueNAS — check dataset ACL
nfs4_getfacl /mnt/vault1337/homelab

# on llm-server — confirm group membership
groups $USER

# test write as the SSH user
touch /mnt/vault1337/homelab/test && rm /mnt/vault1337/homelab/test
```

If your NFS export uses `mapall`, make sure it maps to a user that has ACL write permission on the dataset. Syncthing at UID 568 owns the files; your SSH user just needs group-level write access.

### 5. Merge Node Chaining for 4+ Inputs

Merge nodes accept exactly two inputs. With four parallel API calls, you need three Merge nodes: Interfaces + Aliases into Merge1, Routes + DHCP into Merge2, then Merge1 + Merge2 into Merge3. The visual result is an ugly binary tree. Not the prettiest, but it gets the job done.

## The Output

The generated output has two forms: structured YAML for NetBox and narrative Markdown for the Obsidian vault. Claude returns both in a single stdout response, separated by a `===SPLIT===` delimiter. The Parse Claude Response Code node splits on that, strips any code fences Claude adds, and pre-encodes each output as base64. Separate SSH nodes then write each file to the vault host using `echo '...' | base64 -d > /path/to/file`, which passes arbitrary text through the shell without escaping issues.

The NetBox YAML output for a DHCP entry on the Lab VLAN:

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

The Obsidian Markdown output reads like a network diagram in prose: a table of current leases, a section for each defined alias, and a diff summary at the top showing what changed since the last run. The diff is the part I actually look at. The full state is background context; the diff is the news.

## How to Import This Workflow

Download the template below and import it into your n8n workspace:

1. Click the button below to download the `.json` file.
2. Open your n8n instance and create a New Workflow.
3. Click the menu icon (three dots) in the top right corner and select **Import from File...**, then choose the downloaded file.
   *(Pro-tip: You can also open the file in any text editor, copy the raw JSON, and paste it directly onto your blank n8n canvas.)*
4. Open the OPNsense API, SSH Claude Code, and Code nodes to swap in your own credentials and file paths. You'll need an OPNsense API credential saved in n8n and SSH access configured to wherever Claude Code is running. Then toggle the workflow to **Active**.

{{< button href="/downloads/Homelab%20Topology%20Docs%20Pipeline%20template.json" download="Homelab Topology Docs Pipeline template.json" >}}Download Workflow Template{{< /button >}}

{{< alert >}}
**Note:** This workflow routes all file writes through SSH. The n8n container never touches the vault directly. You need SSH access from n8n to a host that has your vault mounted, and an OPNsense API credential and SSH credential configured in n8n. It will work on n8n Cloud as long as the SSH target is reachable.
{{< /alert >}}

## What's Next

Proxmox API collection is next: the same workflow pattern pointed at the Proxmox API for VM inventory, container states, and storage pools. After that, the one I actually want, which is pushing the NetBox YAML into NetBox's own API instead of leaving it in the vault as reference material.

That's the whole thing. A weekly cron, four API calls, a string comparison, and an SSH session that hands off to Claude Code. The docs update themselves now.

---

*Running OPNsense 26.1.3, n8n 2.10.3 on Docker, TrueNAS SCALE 24.10.2, and Claude Code on Ubuntu 24.04. The NFS mount is persistent across reboots and the n8n workflow runs without manual intervention. Until it doesn't, at which point I'll write about that too.*

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/blog/homelab-docs-automation-n8n-claude/#article",
      "headline": "Automating Homelab Documentation with n8n and Claude Code",
      "description": "Homelab docs go stale fast. My n8n pipeline polls OPNsense weekly, diffs state, and triggers Claude Code via SSH to rewrite docs automatically. Five gotchas that cost real time.",
      "datePublished": "2026-03-05T00:00:00Z",
      "dateModified": "2026-03-23T00:00:00Z",
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
        "url": "https://moshthesubnet.com/blog/homelab-docs-automation-n8n-claude/og-card.png",
        "width": 1200,
        "height": 630
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/blog/homelab-docs-automation-n8n-claude/"
      },
      "articleSection": "Homelab",
      "keywords": [
        "homelab",
        "n8n",
        "automation",
        "OPNsense",
        "Claude Code",
        "documentation",
        "networking",
        "TrueNAS",
        "Obsidian"
      ],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/blog/homelab-docs-automation-n8n-claude/#breadcrumb",
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
          "name": "Automating Homelab Documentation with n8n and Claude Code",
          "item": "https://moshthesubnet.com/blog/homelab-docs-automation-n8n-claude/"
        }
      ]
    }
  ]
}
</script>

<!-- Assumptions (2026-10-22 voice pass, delete after review):
- Corrected to match the project page: 26.1 DHCP endpoint is /api/dnsmasq/leases/search; claude binary at /home/skyler/.local/bin/claude; the prompt file is written by an SSH node. If the blog version was the accurate one, the project page is what needs fixing instead.
- "What's Next" cut from four paragraphs to two sentences. The Pi-hole integration and the "vault as a queryable graph" idea are gone from the post; restore them if they are still plans.
- Removed closers: "No noise. No manual steps. No 'I'll update the docs later.'" and "The vault stopped lying." and "Not just documenting the network; being the network record."
- Em dashes inside the text diagram, shell comments, and YAML example were left alone (code, not prose).
-->
