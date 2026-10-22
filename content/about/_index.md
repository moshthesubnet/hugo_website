---
title: "About"
description: "Skyler King: help desk tech at an MSP, WGU network engineering student, and homelabber working toward network automation."
aliases: ["/docs/bio/"]
---

I'm Skyler King. I work help desk at a managed service provider in Utah and study network engineering and security at WGU. Before tech, I worked as a Certified Occupational Therapy Assistant. I traded ADLs for ACLs, and I haven't looked back.

## How I got here

It started with tinkering. I liked building my own PCs, which led to buying my first NAS, which led to the first time I actually watched devices find and talk to each other across my LAN. That was the hook, but I didn't have a name for what I wanted to do yet.

That part came later. I was doing concussion rehab at a small startup, and one of my last clients was a software engineer at Google on the Google Fiber side. We got talking about how he ended up in software and what other paths existed in IT, and that's the conversation where I first heard the term "network engineer." I went home, did the research, watched every "day in the life" video I could find, and decided that was it.

## Where I am now

I started as an L1 at an MSP in July 2026. Most days I'm working a fast ticket queue across 25+ client organizations, and no two of them are set up the same way. A couple of months in, I started helping train new L1s on escalation, mostly on what the next tier actually needs from you so the ticket doesn't come right back.

This fall I went out of state with one of our L2s to onboard a newly acquired site. Over three days in a four-floor building we pulled out the previous provider's gear (none of it labeled, and the old APs were hidden inside the ceiling tiles), then installed 40 UniFi access points, 12 switches, a new firewall, UPS units, and workstations, and heat-mapped every floor to confirm coverage. One snag: three iPads for a nurse call system were locked in mounts we didn't have the tool for, so scanning the MDM enrollment QR code wasn't happening. Turns out you can AirDrop the enrollment link straight to them.

Before that I spent two years at a medical device manufacturer, where I started as an intern and was offered a full-time role. That's where I fixed a production IPsec tunnel failure that was costing about $15K in downtime, rebuilt a flat network into proper VLANs, and stood up an office's network in 48 hours.

## What I'm working toward

Network automation. I want to spend less time fixing things by hand and more time building the stuff that keeps them from breaking. I'm coming at it from the networking side, since that's where I have the most reps.

This year I finished WGU's Python for IT Automation course. I'm on a term break right now and pick classes back up in January 2027. At home I recently moved all my Docker stacks to deploy from a Git repo with Ansible, and a CI runner is next. After that, a hybrid Active Directory lab with Entra ID and an Azure hub-and-spoke network are still on the bench. They're moving slower now that I'm working full-time.

## The homelab

Three Proxmox nodes, 26 VMs and LXCs, 9 VLANs, OPNsense firewall, Cisco switches, Unifi wireless. My main desktop runs Windows 11, but I live in Linux for the work that matters. My laptop dual-boots Zorin OS and Windows 11, and the lab itself is Linux-first: Ubuntu Server for general workloads, Rocky Linux for RHEL-family practice, Kali for security tooling, and REMnux for malware analysis, with OPNsense (FreeBSD) on the perimeter and TrueNAS plus Synology handling storage. Self-hosted Gitea holds the config, and Ansible deploys it.

I use it to test everything I'm learning, from OSPF adjacencies to automated documentation pipelines. You can [explore the interactive topology diagram](/projects/homelab-topology.html) if you're curious.

## Off the clock

These days I mostly post on LinkedIn as Skyler King, about once a week, usually about networking, certs, or whatever broke in the lab. The **@moshthesubnet** accounts on Instagram and Facebook are quiet for now. If something I learned saved me hours, it usually ends up on LinkedIn.

## Certifications

| Certification | Issued |
| :--- | :--- |
| CompTIA Cloud+ | Dec 2025 |
| CCNA Cybersecurity | Jun 2025 |
| Cisco CCNA | Feb 2025 |
| ITIL 4 Foundation | Jun 2024 |
| LPI Linux Essentials | May 2024 |
| CompTIA A+ | Mar 2024 |

CompTIA Security+ is in progress.
