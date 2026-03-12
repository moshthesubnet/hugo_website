---
title: Overview
weight: 1
---

Two Proxmox nodes, an OPNsense firewall, and a UniFi switch stack. 7 VLANs, automated where possible, documented here.

The goal is to run real infrastructure at home — configurations get tested here before they touch anything that matters.

---

## Architecture

- Proxmox VE on two nodes, hosting VMs and containers
- OPNsense + UniFi for routing, switching, and VLAN enforcement
- Automation via n8n, Python, and Bash for repetitive tasks

---

## Hardware

| Component | Device | Role |
| :--- | :--- | :--- |
| **Gateway** | OPNsense VM | Main Router & Firewall |
| **Core Switching** | UniFi USW Pro Max 16 PoE | Layer 2/3 Backbone |
| **Lab Switching** | Cisco Catalyst 2960X | Lab Environment & Testing |
| **Wireless** | UniFi U7 Pro | High-speed Wi-Fi 7 Connectivity |
| **Compute** | 2x Proxmox Nodes | Hosting VMs and Docker Clusters |
| **Storage** | TrueNAS Scale / Synology | Centralized Data & Backups |

---

## Network

### Topology

An interactive diagram of the full lab network — physical hierarchy, VLAN segments, and all VMs/LXCs across both Proxmox nodes.

[View the Interactive Network Topology →](/projects/homelab-topology.html)

### VLAN Structure

| VLAN ID | Name | Purpose |
| :--- | :--- | :--- |
| 999 | Native | Secure native VLAN (no IP addressing) |
| 10 | Home | Trusted end-user devices |
| 20 | Malware | Isolated cybersecurity lab & malware analysis |
| 30 | Homelab | Testing different OS and configurations |
| 40 | Servers | Production Ubuntu/Rocky Linux VMs |
| 50 | IoT | Smart home devices (isolated) |
| 99 | Management | Network device administration |

[Read the full VLAN Segmentation project documentation →](../projects/vlan_segmentation/)

### Networking philosophy

I treat my home network like a mini-enterprise:

* IoT and lab devices are isolated from trusted personal data
* Core services (servers, switches, APs) use static IPs outside DHCP pools
* Multiple layers: VLAN isolation, firewall rules, and ACLs
* If it isn't documented here, it doesn't exist

---

## Tech stack

**Virtualization & Containers:**
* Proxmox VE, Docker, LXC, Podman

**Networking:**
* Cisco IOS, OPNsense, UniFi, VLANs (802.1Q), OSPF, IPsec VPN

**Automation & Scripting:**
* Python, Ansible, Bash, YAML, n8n

**Monitoring & Security:**
* Uptime Kuma, Wireshark, Splunk, Pi-hole

---

## Recent updates

* **Feb 2026:** Deployed Ollama on Ubuntu VM and integrated multiple local LLMs with Aider to create a self-hosted AI coding agent environment.
* **Feb 2026:** Completed VLAN segmentation security hardening project: eliminated VLAN 1, implemented native VLAN 999, and created dedicated management VLAN 99.
* **Jan 2026:** Deployed LXC container running MkDocs for local documentation testing and continuous deployment.
* **Jan 2026:** Migrated and consolidated Docker infrastructure from 3 hosts to 2 for better resource management.

---

## Active projects

Currently working on:

* **Network Automation:** Developing Python scripts for automated Cisco device configuration and compliance checking
* **Infrastructure as Code:** Implementing Terraform for automated Proxmox VM provisioning
* **Monitoring Stack:** Deploying centralized logging with ELK stack across all VLANs

[View all projects →](../projects/projects/)

---

