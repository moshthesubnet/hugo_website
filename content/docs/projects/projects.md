---
title: Overview
weight: 1
---

# Projects

Welcome to my homelab and networking projects portfolio. Here you'll find documentation of various infrastructure, security, and automation projects I've implemented.

---

## Network Infrastructure Projects

### [Privacy-First Local AI Coding Assistant](./local_ai_coding_agent/)

**Status:** ✅ Complete | **Date:** February 2026

Deployed a fully localized, privacy-first AI coding assistant for secure, terminal-based pair programming. This setup utilizes an open-weight model hosted on a Proxmox VM to assist with developing Python automation scripts for network engineering labs without exposing code to third-party APIs.

**Key Highlights:**

- Deployed Ollama on an Ubuntu Server virtual machine
- Hosted the Qwen2.5-Coder:7B model locally
- Integrated Aider on the local workstation for seamless terminal access
- Focused on security by utilizing a scoped coding tool rather than OS-level agents (e.g., OpenClaw)
- Automated Python scripting workflows for CCNA lab scenarios

**Technologies:** Proxmox, Ubuntu Server, Ollama, Qwen2.5-Coder, Aider, Python, Generative AI

[Read Full Documentation →](./local_ai_coding_agent/)

---

### [VLAN Segmentation and Security Hardening](./vlan_segmentation/)

**Status:** ✅ Complete | **Date:** January 2026

Comprehensive network redesign implementing proper VLAN segmentation, security hardening, and management network isolation. Migrated from insecure default VLAN 1 configuration to industry best-practice architecture with dedicated management VLAN and secure native VLAN.

**Key Highlights:**

- Eliminated VLAN 1 security vulnerabilities
- Implemented secure native VLAN (999)
- Created dedicated management network (VLAN 99)
- Configured inter-VLAN routing and firewall rules
- Isolated malware analysis, homelab, servers, and IoT networks

**Technologies:** VLANs, 802.1Q, Inter-VLAN Routing, Access Control Lists, Network Segmentation

[Read Full Documentation →](./vlan_segmentation/)

---

## Coming Soon

Additional projects currently in development or documentation:

- 🔄 **Homelab Automation with Ansible** - Configuration management and automated deployment
- 🔄 **Centralized Logging and Monitoring** - ELK Stack implementation for network visibility
- 🔄 **VPN Infrastructure** - Site-to-site and remote access VPN configuration
- 🔄 **Containerized Services** - Docker/Podman and Kubernetes homelab deployment

---

## About These Projects

These projects represent practical implementations of networking, security, and infrastructure concepts in my homelab environment. Each project includes:

- Detailed technical documentation
- Before and after configurations
- Lessons learned and challenges overcome
- Security considerations
- Future enhancement plans

All projects follow industry best practices and are continuously maintained and improved.

---

**Last Updated:** February 2026
