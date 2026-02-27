---
title: VLAN Segmentation
weight: 2
---

# VLAN Segmentation Project

## Project Overview

This project documents the redesign and implementation of network segmentation using VLANs to improve security, management, and network isolation in my homelab environment.

## Executive Summary

Successfully migrated from a basic VLAN configuration using the insecure default VLAN 1 for LAN traffic to a properly segmented network with a secure native VLAN and dedicated management VLAN. This implementation follows industry best practices for network security and segmentation.

## Network Topology

{{< callout type="info" >}}
**Interactive Diagram**

View the **[interactive network topology diagram →](/projects/network-topology-diagram.html)** showing the before and after configurations side-by-side.

The diagram features:

- Side-by-side comparison of original vs. improved design
- Color-coded VLANs for easy identification
- Security improvements highlighted
- Interactive hover effects
{{< /callout >}}

---

## Network Architecture Evolution

### Before: Initial Topology

The original network configuration had several security concerns:

| VLAN ID | Name | Network Subnet | Purpose |
|---------|------|----------------|---------|
| 1 | LAN | 10.30.X.0/24 | General LAN traffic (Default VLAN) |
| 20 | MALWARE | 10.0.X.0/24 | Malware analysis environment |
| 30 | HOMELAB | 10.30.X.0/24 | Lab testing environment |
| 40 | SERVERS | 10.30.X.0/28 | Production servers |
| 50 | IoT | 10.30.X.0/24 | Internet of Things devices |

**Key Issues Identified:**

- Using VLAN 1 as the native VLAN (security vulnerability)
- VLAN 1 carrying user traffic (against best practices)
- No dedicated management VLAN for network device administration
- Potential for VLAN hopping attacks

### After: Improved Topology

The redesigned network architecture addresses security concerns and implements proper segmentation:

| VLAN ID | Name | Network Subnet | Purpose |
|---------|------|----------------|---------|
| 999 | Native | N/A | Native VLAN (no IP addressing) |
| 10 | Home | 10.10.X.0/24 | General home network traffic |
| 20 | MALWARE | 10.0.X.0/24 | Isolated malware analysis |
| 30 | HOMELAB | 10.30.X.0/24 | Lab and testing environment |
| 40 | SERVERS | 10.30.X.0/28 | Production server subnet |
| 50 | IoT | 10.30.X.0/24 | IoT device isolation |
| 99 | MGMT | 10.0.X.0/24 | Network management |

**Improvements Implemented:**

- Native VLAN changed to 999 (no IP addressing for security)
- Dedicated management VLAN (99) for switch/router administration
- VLAN 1 completely removed from production use
- Maintained existing segmentation for malware, homelab, servers, and IoT
- Renamed general LAN to "Home" with new subnet for clarity

---

## Technical Implementation

### Design Decisions

#### 1. Native VLAN Security (VLAN 999)

**Rationale:**

The native VLAN carries untagged traffic on trunk ports. Using VLAN 1 as the native VLAN is a well-known security risk because:

- VLAN 1 cannot be deleted from Cisco switches
- Certain control plane traffic defaults to VLAN 1
- It's the first VLAN attackers target for VLAN hopping attacks

**Implementation:**

- Changed native VLAN to 999 across all trunk links
- VLAN 999 has no IP addressing or user traffic
- Prevents unauthorized access through untagged frames

#### 2. Management VLAN (VLAN 99)

**Rationale:**

Separating management traffic from user data provides:

- Enhanced security through network isolation
- Easier access control and monitoring
- Protection of administrative interfaces
- Simplified troubleshooting

**Implementation:**

- Created VLAN 99 with subnet 10.0.X.0/24
- Assigned all switch and router management interfaces to this VLAN
- Implemented access control lists (ACLs) restricting management access
- Enabled SSH only on VLAN 99 interface

#### 3. Network Segmentation Strategy

**VLAN 10 - Home Network (10.10.X.0/24):**

- General user traffic for trusted home devices
- Workstations, laptops, phones
- Access to internet and select server resources

**VLAN 20 - MALWARE Analysis (10.0.X.0/24):**

- Heavily isolated environment for malware analysis
- No outbound internet access
- Firewall rules block all inter-VLAN communication
- Snapshot/rollback capabilities for VMs

**VLAN 30 - HOMELAB (10.30.X.0/24):**

- Testing and development environment
- Isolated from production servers
- Can be reset without impacting production

**VLAN 40 - SERVERS (10.30.X.0/28):**

- Production server subnet (/28 = 14 usable hosts)
- Smaller subnet reflects current server needs
- Controlled access from other VLANs via firewall rules
- Hosts critical services (DNS, DHCP, file servers, etc.)

**VLAN 50 - IoT (10.30.X.0/24):**

- Isolated smart home and IoT devices
- No direct access to servers or home network
- Internet access only (restricted outbound)
- Prevents IoT devices from becoming pivot points

### Configuration Examples

#### Switch Configuration (Trunk Port)
```
interface GigabitEthernet0/1
 description Trunk to Core Router
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,50,99
 no shutdown
```

#### Switch Configuration (Access Port - Home VLAN)
```
interface GigabitEthernet0/2
 description Home Network Access Port
 switchport mode access
 switchport access vlan 10
 switchport port-security
 switchport port-security maximum 2
 spanning-tree portfast
 no shutdown
```

---

## Security Enhancements

### Implemented Security Measures

#### 1. VLAN Hopping Prevention

- Native VLAN changed to unused VLAN 999
- All access ports explicitly assigned to VLANs
- Disabled DTP (Dynamic Trunking Protocol) on access ports

#### 2. Management Access Control

- Management VLAN (99) isolated from user VLANs
- SSH access only (Telnet disabled)
- ACLs restricting management access to specific IP addresses
- Strong passwords and AAA authentication

#### 3. Inter-VLAN Routing Controls

- Firewall rules control traffic between VLANs
- Default deny policy with explicit allow rules
- MALWARE VLAN has no access to other networks
- IoT VLAN restricted to internet only

#### 4. Port Security

- MAC address limiting on access ports
- Sticky MAC learning where appropriate
- Violation actions configured (shutdown)


### Firewall Rules Summary

**Home VLAN (10) can access:**

- Internet (all protocols)
- SERVERS VLAN (specific services: DNS, DHCP, HTTP/S, SMB)
- Denied to: MALWARE, IoT, HOMELAB

**MALWARE VLAN (20) can access:**

- Nothing (completely isolated)

**HOMELAB VLAN (30) can access:**

- Internet (all protocols)
- SERVERS VLAN (all services for testing)
- Denied to: MALWARE, Home, IoT

**SERVERS VLAN (40):**

- Outbound: Internet (for updates)
- Inbound: Controlled access from Home and HOMELAB

**IoT VLAN (50) can access:**

- Internet only (specific ports: 80, 443, 53)
- Denied to: All other VLANs

**MGMT VLAN (99):**

- Access from specific admin workstation only
- No access from other VLANs

---

## Lessons Learned

### Challenges Encountered

#### 1. Native VLAN Mismatch Issues

- Initial misconfiguration caused trunk links to fail
- **Solution:** Verified native VLAN configuration on both ends of trunks
- Used `show interfaces trunk` to confirm consistency

#### 2. Management Access Lockout Risk

- Changing management VLAN could cause lockout
- **Solution:** Maintained console cable access during changes
- Configured rollback timer on switches

### Best Practices Applied

- Never use VLAN 1 for user traffic
- Change native VLAN to unused VLAN ID (999)
- Create dedicated management VLAN
- Explicitly configure trunk allowed VLANs
- Document all VLAN assignments and IP schemes
- Implement port security on access ports
- Use descriptive VLAN names and interface descriptions
- Test changes in lab environment first (VLAN 30)
- Maintain network diagrams and IP address documentation

---

## Testing and Validation

### Connectivity Testing

**Test Matrix:**

| Source VLAN | Destination VLAN | Expected Result | Actual Result |
|-------------|------------------|-----------------|---------------|
| Home (10) | Internet | Allow | ✅ Pass |
| Home (10) | SERVERS (40) | Allow (specific ports) | ✅ Pass |
| Home (10) | MALWARE (20) | Deny | ✅ Pass |
| Home (10) | IoT (50) | Deny | ✅ Pass |
| MALWARE (20) | Internet | Deny | ✅ Pass |
| MALWARE (20) | All VLANs | Deny | ✅ Pass |
| IoT (50) | Internet | Allow (80, 443, 53) | ✅ Pass |
| IoT (50) | SERVERS (40) | Deny | ✅ Pass |
| HOMELAB (30) | SERVERS (40) | Allow (all) | ✅ Pass |
| MGMT (99) | All devices | Allow (SSH/HTTPS) | ✅ Pass |

### Verification Commands

```
# Verify VLAN configuration
show vlan brief

# Verify trunk configuration and native VLAN
show interfaces trunk

# Verify spanning tree for VLAN
show spanning-tree vlan 10

# Verify inter-VLAN routing
show ip interface brief

# Test connectivity
ping 10.30.X.10 source 10.10.X.100
```

---

## Future Enhancements

### Planned Improvements

#### 1. Voice VLAN Implementation

- Add VLAN 60 for VoIP traffic
- Configure QoS for voice priority
- Implement LLDP-MED for IP phone discovery

#### 2. Guest Network

- Add VLAN 80 for guest WiFi
- Completely isolated from all internal networks
- Captive portal for authentication

#### 3. Monitoring and Logging

- Implement VLAN-specific traffic monitoring
- Configure NetFlow for traffic analysis
- Centralized syslog server in SERVERS VLAN

#### 4. Advanced Security

- Implement Private VLANs for IoT device isolation
- Configure DHCP snooping to prevent rogue DHCP servers
- Enable Dynamic ARP Inspection (DAI)
- Implement IP Source Guard

#### 5. Automation

- Develop Ansible playbooks for VLAN provisioning
- Automated backup of switch configurations
- VLAN configuration validation scripts


---

## Documentation and Maintenance

### Network Diagram

{{< callout type="info" >}}
**Visual Reference**

Refer to the interactive network topology diagram for a visual representation of this architecture. The diagram shows the before and after configurations side-by-side.
{{< /callout >}}

### IP Address Management (IPAM)

Complete subnet allocation and usage tracking maintained in separate spreadsheet.

**Quick Reference:**

| VLAN | Name | Subnet |
|------|------|--------|
| 10 | Home | 10.10.X.0/24 |
| 20 | MALWARE | 10.0.X.0/24 |
| 30 | HOMELAB | 10.30.X.0/24 |
| 40 | SERVERS | 10.30.X.0/28 |
| 50 | IoT | 10.30.X.0/24 |
| 99 | MGMT | 10.0.X.0/24 |

### Change Management

All network changes follow this process:

1. **Document** proposed change
2. **Test** in HOMELAB VLAN if possible
3. **Schedule** maintenance window
4. **Implement** during low-usage period
5. **Validate** and test
6. **Update** documentation

### Backup Procedures

- Weekly automated configuration backups
- Stored in SERVERS VLAN (10.30.X.5)
- Offsite backup to cloud storage
- Configuration version control using Git

---

## Conclusion

This VLAN segmentation project significantly improved the security posture and manageability of my homelab network. By following industry best practices and implementing proper network segmentation, I've created a more secure, scalable, and maintainable network infrastructure.

### Key Achievements

- Eliminated VLAN 1 security vulnerabilities
- Implemented secure native VLAN (999)
- Created dedicated management network (VLAN 99)
- Maintained strong network segmentation across security zones
- Improved network documentation and change management

This project demonstrates practical application of networking concepts including VLANs, inter-VLAN routing, network security, and access control—all fundamental skills for network engineering and cybersecurity.

---

## References and Resources

- Cisco VLAN Security Best Practices
- NIST Network Segmentation Guidelines
- CIS Controls for Network Infrastructure
- IEEE 802.1Q Standard (VLAN Tagging)

---

**Project Date:** December 2025

**Last Updated:** February 2026  

**Status:** Production Implementation Complete
