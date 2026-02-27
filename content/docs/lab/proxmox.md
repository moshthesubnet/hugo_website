---
title: Proxmox
weight: 2
---

# 🛡️ Proxmox Virtualization Environment

This is the "brain" of my homelab. I use Proxmox VE to host everything from core network services to experimental security labs and development environments.

---

## 🖥️ The Hardware

I run a **2-node Proxmox setup** (non-clustered). Each node serves a specific purpose to optimize resource allocation and minimize single points of failure.

### Primary Node - Network & Production Services

* **CPU:** Intel Core i5-13600K
* **RAM:** 128GB DDR5
* **Form Factor:** Desktop Case
* **Storage:** Local LVM pool for VM disks + NFS share (Synology) for backups
* **Primary Workloads:**
    * OPNsense virtualized firewall
    * Production Docker hosts
    * Core network services (DNS, DHCP)

### Secondary Node - Lab & Development

* **CPU:** Intel N100
* **RAM:** 16GB DDR4
* **Form Factor:** Rack-mounted 1U chassis
* **Storage:** Local LVM pool for VM disks + NFS share (Synology) for backups
* **Primary Workloads:**
    * Ubuntu/Rocky Linux test VMs
    * Malware analysis lab (isolated VLAN 20)
    * Experimental containers

---

## 🌐 Network Integration

Both Proxmox nodes are **trunked to the UniFi switch**, allowing VMs and containers to be assigned to specific VLANs for proper segmentation and security isolation.

### VLAN Assignment Strategy

| VLAN | VM/Container Type | Security Posture |
| :--- | :--- | :--- |
| **40 (Servers)** | Production Ubuntu/Rocky VMs | Firewalled, monitored |
| **20 (Malware)** | Security lab, Kali Linux, pentesting | Fully isolated, no internet |
| **30 (Homelab)** | Development & testing VMs | Isolated from production |
| **99 (Management)** | Proxmox web GUI access | Restricted to admin workstation |

**Bridge Configuration:** Each Proxmox node uses a VLAN-aware bridge (`vmbr0`) configured to trunk VLANs 10, 20, 30, 40, 50, and 99.

[Learn more about my VLAN architecture →](../projects/VLAN_segmentation/)

---

## 🐳 Docker Infrastructure

I recently optimized my container strategy for efficiency and simplified management.

### The Migration

**Before:** 3 separate Ubuntu VM Docker hosts (resource-intensive, complex management)  
**After:** 2-node Docker cluster (reduced overhead, centralized orchestration)

### Current Setup

* **Runtime:** Docker Engine (managed via CLI and automation scripts)
* **Storage:** Persistent data mapped to NFS shares on TrueNAS/Synology for reliability
* **Deployment:** Manual deployment via SSH + future automation with Ansible

### Key Services Running

| Service | Purpose | VLAN |
| :--- | :--- | :--- |
| **n8n** | Workflow automation (Telegram ↔ Google Calendar) | 40 |
| **Home Assistant** | Smart home orchestration | 40 |
| **Pi-hole** | Network-wide DNS filtering & ad blocking | 40 |
| **Uptime Kuma** | Service monitoring & alerting | 40 |
| **MkDocs** | Documentation site (this site!) | 40 |

---

## 🔒 Security & Isolation

Proxmox VMs are strategically isolated based on their risk profile:

* **Malware Lab (VLAN 20):** Completely air-gapped from other networks. Used for testing Kali Linux tools, analyzing suspicious files, and learning offensive security techniques.
* **Production Services (VLAN 40):** Firewalled access from Home VLAN, monitored for anomalies.
* **Management Access (VLAN 99):** Proxmox GUI accessible only from dedicated admin VLAN with ACL restrictions.

---

## 📦 Backup Strategy

**Proxmox Native Backups:**
* Daily Automated Snapshots stored on NFS share (Synology NAS)
* 4 day retention policy

**Critical VMs:**
* Daily snapshots before major changes
* Manual exports before system updates

**Future Enhancement:**
* Automated offsite backups to AWS S3 using Terraform

---

## 🛠️ Current Projects & Roadmap

### In Progress

* [ ] **Terraform for VM Provisioning:** Automate Ubuntu VM deployment with predefined configurations
* [ ] **Ansible Configuration Management:** Deploy consistent Docker configurations across both nodes
* [ ] **Proxmox Clustering:** Evaluate HA clustering for critical services

### Completed

* [x] Consolidated Docker infrastructure from 3 hosts to 2
* [x] Implemented VLAN-aware bridging on both Proxmox nodes
* [x] Deployed NFS-backed persistent storage for containers
* [x] Migrated OPNsense to virtualized environment

---

## 💡 Lessons Learned

**What Works:**
* Separating network services (firewall) from lab workloads across two nodes provides better stability
* NFS-backed storage for Docker volumes enables easy VM migration
* VLAN trunk configuration allows flexible VM placement without network reconfiguration

**What I'd Change:**
* Initially over-provisioned Ubuntu VMs for Docker—lean Alpine-based VMs would've been more efficient
* Should have implemented configuration management (Ansible) from day one instead of manual setup

---

## 📊 Resource Utilization

*Current allocation across both nodes:*

**Primary Node (i5-13600K):**

* VMs Running: 13
* LXCs Running: 4
* Total RAM Allocated: 60GB / 128GB


**Secondary Node (N100):**

* VMs Running: 1
* LXCs Running: 1
* Total RAM Allocated: 12GB / 16GB


---

> **Note:** Documentation is a living, breathing thing. As I scale and optimize, I update these specs to reflect the current state of "The Subnet."
