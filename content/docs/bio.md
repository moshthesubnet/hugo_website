---
title: About & Accomplishments
description: "Skyler King — Cloud/Network Engineering student at WGU, CCNA certified, six certifications in two years. Career changer building toward enterprise networking roles through homelab work and real production experience."
weight: 1
lastUpdated: "2026-03-12"
tags: ["about", "networking", "career"]
---

<!-- [PERSONAL EXPERIENCE] Career change narrative — first-hand account -->

> **TL;DR:** Career changer who retrained into networking from scratch — six certifications in two years, a CCNA, a homelab running 17 VMs across 7 VLANs, and real production experience that includes saving an estimated $15k in downtime by diagnosing a failed IPsec VPN tunnel. Currently finishing a B.S. in Cloud and Network Engineering at WGU.

---
## Who I Am

I didn't come up through a CS degree. My background was entirely non-technical — I have a B.S. from Utah State (2017) in a health science field (kinesiology), and I spent a few years doing work that had nothing to do with networking.

Then I decided to change that. <!-- [PERSONAL EXPERIENCE] -->

The decision was deliberate, not accidental. Before enrolling anywhere, I researched which networking certifications actually mattered to employers — which ones showed up in job postings, which ones hiring managers actually cared about. CCNA came up as the number one most sought-after certification in networking, and it wasn't close. That settled it. I enrolled in the WGU B.S. in Cloud and Network Engineering, specifically the Cisco Track, because the program is built around earning those certifications: A+, Linux Essentials, CCNA, ITIL, CCNA Cybersecurity, Cloud+. The degree and the credentials are the same thing. <!-- [PERSONAL EXPERIENCE] -->

What I didn't anticipate was the homelab getting out of hand. It started as a study environment and turned into something I'd be comfortable running in a small production context. The homelab wasn't a side project — it was the curriculum. You don't really understand VLANs until you've misconfigured one at midnight and had to trace exactly what broke.

I like emo and punk rock. This and the networking career aren't as unrelated as they seem — both are about doing things intentionally, even when the easier path is right there.

---
## Professional Accomplishments

*From my recent work as an IT Intern:*

### Production Environment

**Critical Infrastructure Rescue** — A production licensing server went down. The root cause was a failed IPsec VPN tunnel, which nobody had caught until the downstream impact became obvious. I diagnosed it, traced the failure, and restored connectivity. Estimated cost of the downtime if it had continued: $15k in operational delays. Time to resolution: same day. <!-- [ORIGINAL DATA] -->

**Enterprise Network Segmentation** — Took a flat Layer 2 network with 150+ devices and segmented it into five secure VLANs. Reduced broadcast traffic, eliminated unnecessary device-to-device exposure, and improved measurable network performance by 30%. The kind of project where the right answer and the easy answer are not the same thing.

**Rapid Site Deployment** — Newly acquired office, no existing infrastructure. Network, conferencing, and 25 workstations fully operational in 48 hours. Compressed timeline, no shortcuts on the network design.

### Homelab Projects

**VLAN Security Hardening** — Redesigned my homelab from a flat default config to a properly segmented 7-VLAN architecture following Cisco best practices. Eliminated VLAN 1 vulnerabilities, locked down native VLAN (999), built out a dedicated management VLAN (99), and isolated home, malware analysis, homelab, servers, IoT, and management traffic behind OPNsense firewall rules. <!-- [ORIGINAL DATA] -->

[View full documentation →](../projects/vlan_segmentation/)

**Proxmox Virtualization Cluster** — Multi-node Proxmox setup running 17 VMs and LXC containers: Netbox, Pi-hole DNS, Docker hosts, Ollama LLM servers, and a few things that probably shouldn't be running but are educational.

**Network Automation Pipeline** — Built an n8n workflow that polls OPNsense REST APIs weekly, diffs against saved network state, and triggers Claude Code via SSH to regenerate topology documentation automatically. Documentation that's always current because it comes from the network itself. <!-- [ORIGINAL DATA] -->

[View full documentation →](../projects/n8n-homelab-docs-pipeline/)

---
## Certifications

Six certifications, earned in sequence, each one building on the last.

| Certification | Issuing Organization | Date Earned |
| :--- | :--- | :--- |
| **CompTIA Cloud+** | CompTIA | Dec 2025 |
| **CCNA Cybersecurity** | Cisco | Jun 2025 |
| **Cisco Certified Network Associate (CCNA)** | Cisco | Feb 2025 |
| **ITIL Foundation** | AXELOS | Jun 2024 |
| **LPI Linux Essentials** | LPI | May 2024 |
| **CompTIA A+** | CompTIA | Mar 2024 |

---
## Core Competencies

### Networking & Security

- **Cisco:** IOS configuration, OSPF, EIGRP, VLANs, STP, inter-VLAN routing
- **Security:** VLAN segmentation, ACLs, OPNsense firewall, IPsec VPN, VLAN hopping prevention
- **Visibility:** Wireshark, tcpdump, Splunk, Elastic SIEM

### Infrastructure & Systems

- **Virtualization:** Proxmox (production homelab), VMware, Hyper-V, LXC
- **Cloud:** Azure, AWS, Docker, CI/CD
- **Automation:** Python, Ansible, n8n, Terraform

---
## Education

- **B.S. Network Engineering and Security** — Western Governors University *(Currently Enrolled)*
- **B.S.** — Utah State University (2017)

---
## FAQ

**What kind of roles are you targeting?**

Entry-level or junior networking roles — network engineer, network operations, or cloud/network support. Preference for environments where there's actual infrastructure to work with and problems that require diagnosis, not just ticket resolution.

**Are you actively looking?**

Yes. If you've read this far and your team runs Cisco gear, I'd like to talk.

**Why networking after a completely different background?**

Partly because I found it interesting in a way that most work isn't. Partly because networks are deterministic — something is either working or it isn't, and the reason is always findable. That appeals to me. The career change wasn't a pivot so much as a decision to go toward something I was already spending time on anyway.

**What does your homelab actually look like?**

Two Proxmox nodes running 17 VMs and LXCs, OPNsense as the firewall, Unifi for switching and wireless, TrueNAS for storage, 7 VLANs for segmentation. The documentation for most of it lives in the [Projects section](../projects/projects/). It started as a study environment and turned into something I'd be comfortable using in a small production context.

**What are you working on or studying right now?**

Finishing the WGU degree, continuing Ansible automation work, and getting more reps with cloud networking — specifically AWS and Azure network architecture. Also keeping the homelab documentation pipeline running, which forces me to think about network state in a structured way.

---
## Projects

Full documentation of my homelab work lives in the [Projects section](../projects/projects/).
