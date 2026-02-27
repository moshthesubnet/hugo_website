---
title: Overview
weight: 1
---

# 🗺️ Lab Overview

Welcome to the heart of **The Subnet**. My homelab is a hybrid environment designed for high-availability services, network experimentation, and professional development.

The primary goal of this lab is to mirror enterprise-grade networking and virtualization in a residential setting, providing a safe "sandbox" to test configurations before they ever reach a production environment.

---

## 🏗️ High-Level Architecture

My lab is built on three core pillars:

1. **Virtualization:** A 2-node Proxmox VE setup managing compute resources for VMs and containers.
2. **Infrastructure:** An OPNsense and UniFi-powered backbone with secure VLAN segmentation following Cisco best practices.
3. **Automation:** A "self-healing" mindset using n8n, Python, and Bash to handle repetitive tasks.

---

## 📌 Hardware Inventory

| Component | Device | Role |
| :--- | :--- | :--- |
| **Gateway** | OPNsense VM | Main Router & Firewall |
| **Core Switching** | UniFi USW Pro Max 16 PoE | Layer 2/3 Backbone |
| **Lab Switching** | Cisco Catalyst 2960X | Lab Environment & Testing |
| **Wireless** | UniFi U7 Pro | High-speed Wi-Fi 7 Connectivity |
| **Compute** | 2x Proxmox Nodes | Hosting VMs and Docker Clusters |
| **Storage** | TrueNAS Scale / Synology | Centralized Data & Backups |

---

## 🔡 Network Architecture

My network follows enterprise segmentation principles with dedicated VLANs for security and performance optimization.

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

### Networking Philosophy

I treat my home network like a mini-enterprise:

* **Security by Segmentation:** IoT and Lab devices are isolated from trusted personal data to reduce attack surface.
* **Static Infrastructure:** Core services (Servers, Switches, APs) use static IPs outside DHCP pools for reliability.
* **Defense in Depth:** Multiple layers of security including VLAN isolation, firewall rules, and access control lists.
* **Documentation First:** If it isn't documented here, it doesn't exist.

---

## 🛠️ Current Tech Stack

*Technologies I'm actively working with:*

**Virtualization & Containers:**
* Proxmox VE, Docker, LXC, Podman

**Networking:**
* Cisco IOS, OPNsense, UniFi, VLANs (802.1Q), OSPF, IPsec VPN

**Automation & Scripting:**
* Python, Ansible, Bash, YAML, n8n

**Monitoring & Security:**
* Uptime Kuma, Wireshark, Splunk, Pi-hole

---

## 📈 Recent Updates

* **Feb 2026:** Deployed Ollama on Ubuntu VM and integrated multiple local LLMs with Aider to create a self-hosted AI coding agent environment.
* **Feb 2026:** Completed VLAN segmentation security hardening project—eliminated VLAN 1, implemented native VLAN 999, and created dedicated management VLAN 99.
* **Jan 2026:** Deployed LXC container running MkDocs for local documentation testing and continuous deployment.
* **Jan 2026:** Migrated and consolidated Docker infrastructure from 3 hosts to 2 for better resource management.

---

## 🔥 Active Projects

Currently working on:

* **Network Automation:** Developing Python scripts for automated Cisco device configuration and compliance checking
* **Infrastructure as Code:** Implementing Terraform for automated Proxmox VM provisioning
* **Monitoring Stack:** Deploying centralized logging with ELK stack across all VLANs

[View all projects →](../projects/projects/)

---

> "The lab is never finished. It only evolves."
