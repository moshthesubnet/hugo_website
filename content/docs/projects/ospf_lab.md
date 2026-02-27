---
title: 2-Area OSPF Lab
weight: 5
---

# Building a 2-Area OSPF Lab in Cisco Modeling Labs (CML)

*A hands-on walkthrough of configuring multi-area OSPF, DHCP, and end-to-end connectivity using Cisco IOL routers and Alpine Linux.*

---

## Overview

This lab demonstrates the configuration of a two-area OSPF network using Cisco Modeling Labs (CML) Free Tier. The goal was to build a realistic enterprise-style routing topology, troubleshoot adjacency issues, configure DHCP for an end host, and verify end-to-end connectivity across OSPF area boundaries.

This type of lab is foundational for anyone pursuing CCNA or CCNP certifications and reflects real-world network segmentation practices used in enterprise environments.

---

## Lab Topology

The lab consisted of the following nodes, all running within CML Free Tier:

- 4 x Cisco IOL Routers (R1, R2, R3, R4)
- 1 x Unmanaged Switch (SW-1) connecting R1 to the end host
- 1 x Alpine Linux machine acting as the end-user PC (desktop-1)

**Logical connectivity:**

| Link | Subnet | OSPF Area |
|------|--------|-----------|
| R1 E0/0 — R2 E0/0 | 10.10.0.0/31 | Area 1 |
| R2 E0/1 — R3 E0/0 | 10.20.0.0/31 | Area 0 (Backbone) |
| R3 E0/1 — R4 E0/0 | 10.30.0.0/31 | Area 0 (Backbone) |
| R1 E0/1 — SW-1 — Desktop | 10.0.0.0/24 | Area 1 |

---

## OSPF Design

The lab was designed around two OSPF areas:

- **Area 0 (Backbone):** Connects R2, R3, and R4. All inter-area traffic must traverse this area.
- **Area 1:** Connects R1 and the Alpine Linux end host back to R2, which acts as the Area Border Router (ABR).

R2 serves as the ABR — it maintains interfaces in both Area 1 and Area 0 and is responsible for generating Type 3 Summary LSAs that allow routers in Area 1 to learn about Area 0 prefixes, and vice versa.

---

## Key Configurations

### OSPF — R1 (Area 1)

```
router ospf 1
 network 10.10.0.0 0.0.0.1 area 1
 network 10.0.0.0 0.0.0.255 area 1
```

### OSPF — R2 (ABR)

```
router ospf 1
 network 10.10.0.1 0.0.0.0 area 1
 network 10.20.0.0 0.0.0.0 area 0
```

### OSPF — R3 (Area 0)

```
router ospf 1
 network 10.20.0.1 0.0.0.0 area 0
 network 10.30.0.0 0.0.0.0 area 0
```

### OSPF — R4 (Area 0)

```
router ospf 1
 network 10.30.0.1 0.0.0.0 area 0
```

### DHCP — R1 (serving the Alpine Linux host)

```
ip dhcp excluded-address 10.0.0.1
ip dhcp pool LAN
 network 10.0.0.0 255.255.255.0
 default-router 10.0.0.1
 dns-server 8.8.8.8
```

---

## Troubleshooting & Lessons Learned

Several real-world troubleshooting scenarios arose during the lab:

- **Mismatched /31 subnets:** Initial IP addressing placed `10.20.0.1` and `10.20.0.2` on the same router, which are actually in *different* /31 subnets. This prevented OSPF adjacency from forming. Resolution: reassigned IPs using consistent /31 pairs (e.g., `10.20.0.0` and `10.20.0.1`).

- **Incorrect OSPF network statements:** Network statements that didn't match the actual interface IPs prevented OSPF from advertising routes. Resolved by verifying interface IPs with `show ip interface brief` and correcting the wildcard masks.

- **DHCP on wrong interface:** The Alpine Linux machine was connected via SW-1 to R1's E0/1, which mapped to `eth1` (not `eth0`) inside the VM. Running `udhcpc -i eth1` instead of `eth0` resolved the DHCP failure.

- **ABR configuration:** R2 required separate network statements for each area — the R1-facing interface in Area 1 and the R3-facing interface in Area 0. Misconfiguring both into the same area would have broken inter-area routing.

---

## Verification

The following commands were used to confirm successful lab completion:

| Command | Expected Result |
|---------|----------------|
| `show ip ospf neighbor` | All routers show neighbors in FULL state |
| `show ip route ospf` | R1 shows `O IA` routes for 10.20.0.0/31 and 10.30.0.0/31 |
| `show running-config \| section router ospf` | Correct network statements confirmed on each router |
| `ping 10.30.0.1` (from R1) | Successful ping across both OSPF areas |
| `udhcpc -i eth1` (Alpine Linux) | DHCP lease obtained from R1 |

---

## Skills Demonstrated

- Multi-area OSPF design and configuration (RFC 2328)
- Area Border Router (ABR) configuration and inter-area routing
- IPv4 addressing with /31 point-to-point subnets
- DHCP server configuration on Cisco IOS
- Linux networking (Alpine Linux, udhcpc, ip link)
- Systematic network troubleshooting methodology
- Cisco Modeling Labs (CML) Free Tier topology design

---

## Conclusion

This lab provided hands-on experience with one of the most important routing protocols in enterprise networking. By working through real configuration errors and troubleshooting them systematically, the lab reinforced both theoretical OSPF knowledge and practical IOS command-line skills.

The complete topology — from DHCP-assigned end host through two OSPF areas to a remote router — mirrors the kind of multi-area designs found in real enterprise and service provider environments, making it directly applicable to both certification study and professional networking work.
