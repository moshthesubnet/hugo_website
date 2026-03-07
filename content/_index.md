---
showTitle: false
---

#   My career path has more hops than my traceroute

<div style="display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; margin: 2rem 0;">
  <div data-aos="zoom-in" data-aos-duration="800" style="flex: 0 0 auto;">
    <img class="profile-photo" src="/assets/github_profile.png" alt="Skyler King" style="width: 220px; border: 4px solid #00E5FF; box-shadow: 0 8px 24px rgba(0,229,255,0.4); display: block;">
  </div>
  <div style="flex: 1 1 260px;">
    <p>I'm <strong>Skyler King</strong> — a Cloud/Network Engineering student, homelab enthusiast, and emo/punk rock fan. I document everything from breaking OSPF in the lab to fixing critical infrastructure in production.</p>
  </div>
</div>

---

## ⚡ Current Status

**Role:** Pursuing Entry-Level Networking Roles  
**Focus:** Cisco Enterprise Networking, Automation, & Network Security  
**School:** WGU (B.S. Cisco, Cloud & Network Engineering)

---

## 🏆 Recent Wins

*Real-world problems I've solved:*

* **🚑 Critical Infrastructure Rescue:** Saved ~$15k in operational delays by diagnosing and fixing a critical IPsec VPN tunnel failure that had downed a production licensing server.
* **🛡️ Enterprise Network Segmentation:** Improved network performance by **30%** and eliminated VLAN 1 security vulnerabilities by migrating from a flat network to a secure, 7-VLAN architecture with dedicated management VLAN.
* **🚀 Rapid Site Deployment:** Built the IT infrastructure for a newly acquired office (25 workstations + conferencing) from zero to full operation in just **48 hours**.

---

## 🗒️ Certifications

*Validated skills. No paper tigers here.*

<div class="certifications-table">

| Badge | Certification | Date |
| :--- | :--- | :--- |
| **CLOUD+** | CompTIA Cloud+ | Dec 2025 |
| **CBROPS** | CCNA Cybersecurity | Jun 2025 |
| **CCNA** | Cisco Certified Network Associate | Feb 2025 |
| **ITIL 4** | ITIL Foundation | Jun 2024 |
| **LPI** | Linux Essentials | May 2024 |
| **A+** | CompTIA A+ | Mar 2024 |

</div>

---

## 🛠️ The Stack (Lab & Prod)

* **Hardware:** Cisco (Routers/Switches), Ubiquiti Unifi, Custom Proxmox Nodes
* **Software:** OPNsense, Docker, Splunk, Wireshark
* **Automation:** Python, Ansible, Terraform

---

## 🗺️ Lab Network Topology

An interactive map of my home lab's physical hierarchy and network segmentation — from the OPNsense firewall through the Unifi distribution core down to 17 VMs and LXCs spread across two Proxmox nodes, isolated across 7 VLANs.

The diagram covers:

- **Physical topology** — layer-by-layer view from WAN to wireless endpoints
- **VLAN map** — all 7 segments with filterable device lists and subnets
- **Proxmox Node 2 inventory** — every VM and LXC color-coded by VLAN
- **Lab highlights** — firewall design, malware sandbox, Zero Trust access, and more

[Explore the Interactive Diagram →](/projects/homelab-topology.html)

---

## 🔥 Featured Projects

### n8n Homelab Docs Pipeline

Built an automated documentation pipeline that treats live network state as the source of truth — polling OPNsense weekly, diffing against saved state, and triggering Claude Code via SSH to regenerate topology docs on every change.

- Stopped documentation from going stale by pulling live state from four OPNsense REST API endpoints on a weekly schedule
- Designed a 20-node n8n workflow with parallel API collection, state diffing, and conditional SSH execution
- Triggered Claude Code over SSH to generate both NetBox-compatible YAML and Obsidian Markdown automatically
- Enabled `fs` in n8n Code nodes to write directly to NFS-mounted TrueNAS storage, synced everywhere via Syncthing

[View Full Documentation →](/docs/projects/n8n-homelab-docs-pipeline/)

---

### VLAN Segmentation & Security Hardening

Redesigned my homelab network from an insecure flat configuration to a properly segmented architecture following industry best practices.

- Eliminated VLAN 1 security vulnerabilities
- Implemented secure native VLAN (999) to prevent VLAN hopping attacks
- Created dedicated management network (VLAN 99) for administrative access
- Deployed 7-VLAN architecture isolating home, malware analysis, homelab, servers, IoT, and management traffic

[View Full Documentation →](/docs/projects/vlan_segmentation/)

---

### Local AI Coding Agent (Ollama + Aider)

Deployed a fully localized, privacy-first AI coding assistant using Ollama and Aider to eliminate external API dependencies and subscription costs.

- Kept all code local with no external API calls or costs
- Provisioned a dedicated Ubuntu VM for resource-isolated AI workloads
- Integrated Aider CLI for terminal-based AI pair programming and automated Git commits
- Set up API access controls across isolated network VLANs

[View Full Documentation →](/docs/projects/local_ai_coding_agent/)

---

[Read My Full Story](/docs/bio/)
[Explore The Lab](/docs/lab/overview/)
[View All Projects](/docs/projects/projects/)

---

**Connect:**
[Instagram](https://instagram.com/moshthesubnet) · 
[LinkedIn](https://www.linkedin.com/in/skylerkingnetwork) · 
[GitHub](https://github.com/moshthesubnet)
