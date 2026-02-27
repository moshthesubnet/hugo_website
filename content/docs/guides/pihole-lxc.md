---
title: Pi-hole LXC
weight: 1
---

# 🚫 Pi-hole (LXC Deployment)
Pi-hole is a network-wide ad blocker that acts as a DNS sinkhole. By intercepting DNS requests for known ad servers and trackers, it prevents them from ever reaching your devices. LXC (Linux Containers) offer a lightweight, "bare-metal" feel for virtualization, giving your Pi-hole high performance with minimal overhead compared to a full VM.

### 1. Prerequisites
*  Proxmox VE installed and reachable.

*  Static IP Address reserved (e.g., 192.168.1.5).

*  Debian 12 or Ubuntu 24.04 Standard CT Template.

### 2. Create the LXC Container
* Log in to your Proxmox Web UI and click Create CT.

* General: Set Hostname (e.g., pihole-01) and a root password.

* Template: Select your Linux distribution template.

* Root Disk: 8GB is plenty.

* CPU: 1 Core (Pi-hole is extremely lightweight).

* Memory: 512MB RAM (256MB Swap).

* Network:

  * Set IPv4 to Static.

  * IPv4/CIDR: 192.168.1.5/24 (Adjust to your network).

  * Gateway: 192.168.1.1 (Your router).

  * DNS: Use host settings.

### 3. Automated Installation
Start the container, open the Console, and log in as root. Run the following commands:

#### Update and install curl
```
apt update && apt upgrade -y
apt install curl -y
```
Run the official Pi-hole installer
```
curl -sSL https://install.pi-hole.net | bash
```
### 4. Configuration Wizard

Follow the on-screen prompts to complete the setup.

{{< alert >}}
**Official Resources**

* [Pi-hole Official Site](https://pi-hole.net)
* [Official Installation Guide](https://docs.pi-hole.net/main/basic-install/)
* [Post-Installation Steps](https://docs.pi-hole.net/guides/post-install/)
* [Pi-hole CLI Command Reference](https://docs.pi-hole.net/core/pihole-command/)
{{< /alert >}}

{{< alert "danger" >}}
**Troubleshooting**

If you lose the admin password generated at the end of the install, run this command in the LXC console to set a new one:

```bash
pihole -a -p
```
{{< /alert >}}

{{< alert >}}
**(Optional) Secondary DNS**

Set your Secondary DNS to `1.1.1.1` for a fallback if your lab goes down.
{{< /alert >}}
