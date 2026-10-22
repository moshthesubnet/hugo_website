const {
  useState
} = React;

/* -- Data ----------------------------------------------------------- */

const VLAN_COLOR = {
  10: '#5eead4',
  20: '#f87171',
  30: '#fbbf24',
  40: '#4ade80',
  50: '#c084fc',
  60: '#60a5fa',
  70: '#fb923c',
  99: '#34d399',
  999: '#818cf8'
};
const VLANS = [{
  id: 10,
  name: 'HOME',
  subnet: '10.10.0.0/24',
  devices: ['Workstation', 'Routers of Rohan (WiFi)']
}, {
  id: 20,
  name: 'MALWARE',
  subnet: '10.20.0.0/24',
  devices: ['Kali Linux VM', 'Parrot OS VM', 'Security Onion VM']
}, {
  id: 30,
  name: 'LAB',
  subnet: '10.30.0.0/24',
  devices: ['Cisco CML VM', 'NetBox VM', 'LLM Server VM', 'C-3PO VM', 'Raspberry Pi', 'Twingate LXC', 'Bookstack LXC', 'NLA Probe LXC']
}, {
  id: 40,
  name: 'SERVERS',
  subnet: '10.40.0.0/28',
  devices: ['Docker Host 1 VM', 'Docker Host 2 VM', 'Rocky 9 Server VM', 'Gitea LXC', 'Pi-hole LXC', 'Pi-hole 2 LXC', 'NAS (Backup)']
}, {
  id: 50,
  name: 'IoT',
  subnet: '10.50.0.0/24',
  devices: ['Home Assistant VM', 'IoT devices (SSID: IoT WiFi)']
}, {
  id: 60,
  name: 'IPv6',
  subnet: '10.60.0.0/24',
  devices: ['Reserved for IPv6 testing, no hosts yet']
}, {
  id: 70,
  name: 'DMZ',
  subnet: '10.70.0.0/28',
  devices: ['3CX PBX VM']
}, {
  id: 99,
  name: 'MGMT',
  subnet: '10.99.0.0/24',
  devices: ['OPNsense VM', 'pve1', 'pve2', 'pve3', 'PDM VM', 'TrueNAS VM', 'USW Pro Max 16 PoE', 'Cisco Catalyst 2960X', 'Unifi AP']
}, {
  id: 999,
  name: 'NATIVE',
  subnet: 'No IP, trunk only',
  devices: ['Trunk: OPNsense → Dist Switch', 'All inter-switch links']
}];
const guest = (name, type, vlanId, stopped = false) => ({
  name,
  type,
  vlanId,
  stopped,
  icon: '>'
});
const PROXMOX_NODES = [{
  name: 'pve1',
  role: 'Main compute',
  guests: [guest('Pi-hole', 'LXC', 40), guest('Twingate', 'LXC', 30), guest('Bookstack', 'LXC', 30), guest('NLA Probe', 'LXC', 30), guest('iperf3', 'LXC', null, true), guest('TrueNAS', 'VM', 99), guest('PDM', 'VM', 99), guest('Docker Host 1', 'VM', 40), guest('Docker Host 2', 'VM', 40), guest('Rocky 9 Server', 'VM', 40), guest('Cisco CML', 'VM', 30), guest('NetBox', 'VM', 30), guest('LLM Server', 'VM', 30), guest('C-3PO', 'VM', 30, true), guest('Home Asst.', 'VM', 50), guest('3CX PBX', 'VM', 70, true), guest('Kali Linux', 'VM', 20, true), guest('Parrot OS', 'VM', 20, true), guest('Sec. Onion', 'VM', 20, true), guest('DC01', 'VM', null, true), guest('DC02', 'VM', null, true), guest('WRK01', 'VM', null, true), guest('LNX01', 'VM', null, true)]
}, {
  name: 'pve2',
  role: 'Git / GitOps',
  guests: [guest('Gitea', 'LXC', 40)]
}];
const HIGHLIGHTS = [{
  icon: '~',
  title: 'Virtualised Firewall',
  desc: 'OPNsense runs as a VM on its own small node (pve3) with the physical NICs passed through. All traffic passes through it before reaching the distribution switch, with VLAN-aware firewall rules per segment.'
}, {
  icon: '~',
  title: 'Three Nodes, One Pane',
  desc: 'pve1, pve2 and pve3 are standalone Proxmox hosts, not a cluster. Proxmox Datacenter Manager ties them together for monitoring and management from one place.'
}, {
  icon: '~',
  title: 'Unifi Distribution Core',
  desc: 'USW Pro Max 16 PoE aggregates every VLAN trunk and provides PoE to the access point. Managed centrally via the Unifi Network Application.'
}, {
  icon: '~',
  title: 'Config in Git',
  desc: 'Docker Compose stacks live in a self-hosted Gitea repo on pve2. Ansible deploys them to both Docker hosts, so the repo is the source of truth instead of whatever happens to be on disk.'
}, {
  icon: '~',
  title: 'Isolated Lab Segment',
  desc: 'VLAN 30 (Lab) contains the LLM Server, Cisco CML, NetBox, Raspberry Pi, and internal services, kept separate from the home network so experiments stay contained.'
}, {
  icon: '~',
  title: 'Malware Sandbox',
  desc: 'VLAN 20 hard-isolates Kali, Parrot OS and Security Onion with a deny-all outbound firewall rule, preventing any lateral movement into the main network.'
}, {
  icon: '~',
  title: 'Redundant DNS',
  desc: 'Two Pi-hole instances on separate nodes (pve1 and pve3) sit behind one firewall alias, so name resolution survives either node going down.'
}, {
  icon: '~',
  title: 'DMZ for Voice',
  desc: 'VLAN 70 is a small DMZ for the self-hosted 3CX phone system, kept apart from every internal segment.'
}, {
  icon: '~',
  title: 'Dedicated Management',
  desc: 'VLAN 99 holds the firewall, switches, AP, all three Proxmox nodes, PDM and TrueNAS. VLAN 999 is the native trunk VLAN with no IP assignment, mitigating VLAN hopping.'
}, {
  icon: '~',
  title: 'Zero Trust Remote Access',
  desc: 'Twingate LXC on VLAN 30 provides Zero Trust Network Access to internal services without exposing any ports or running a traditional VPN.'
}];

/* -- Helpers -------------------------------------------------------- */

const vc = id => VLAN_COLOR[id] || '#525252';

/* -- Sub-components ------------------------------------------------- */

const Connector = ({
  label
}) => /*#__PURE__*/React.createElement("div", {
  className: "layer-connector"
}, /*#__PURE__*/React.createElement("div", {
  className: "connector-line"
}), /*#__PURE__*/React.createElement("div", {
  className: "connector-arrow"
}, "|"), label && /*#__PURE__*/React.createElement("div", {
  className: "connector-label"
}, label));
const DeviceNode = ({
  icon,
  name,
  subtitle,
  vlanId,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: `device${onClick ? ' clickable' : ''}`,
  onClick: onClick
}, /*#__PURE__*/React.createElement("div", {
  className: "device-header"
}, /*#__PURE__*/React.createElement("div", {
  className: "device-icon"
}, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  className: "device-name"
}, name), subtitle && /*#__PURE__*/React.createElement("div", {
  className: "device-subtitle"
}, subtitle))), vlanId && /*#__PURE__*/React.createElement("span", {
  className: "vlan-badge",
  style: {
    background: `${vc(vlanId)}12`,
    color: vc(vlanId),
    border: `1px solid ${vc(vlanId)}30`
  }
}, "VLAN ", vlanId));

/* -- Root component ------------------------------------------------- */

const HomelabTopology = () => {
  const [selectedVlan, setSelectedVlan] = useState(null);
  const [pveExpanded, setPveExpanded] = useState({
    pve1: true,
    pve2: true
  });
  const toggleNode = name => setPveExpanded(prev => ({
    ...prev,
    [name]: !prev[name]
  }));
  const [expandedVlan, setExpandedVlan] = useState(null);
  const toggleFilter = id => setSelectedVlan(prev => prev === id ? null : id);
  const toggleVlanRow = id => setExpandedVlan(prev => prev === id ? null : id);
  const dimmed = g => selectedVlan !== null && g.vlanId !== selectedVlan;
  const filteredVlans = selectedVlan ? VLANS.filter(v => v.id === selectedVlan) : VLANS;
  return /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header"
  }, /*#__PURE__*/React.createElement("h1", null, "Home Lab Network Topology"), /*#__PURE__*/React.createElement("p", {
    className: "subtitle"
  }, "Proxmox \xB7 OPNsense \xB7 Unifi \xB7 9 VLANs \xB7 26 Guests")), /*#__PURE__*/React.createElement("div", {
    className: "stats-row"
  }, [['3', 'Proxmox Nodes'], ['19', 'Virtual Machines'], ['7', 'LXC Containers'], ['9', 'VLANs'], ['3', 'Switches / APs'], ['2', 'WiFi SSIDs']].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-number"
  }, n), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, l)))), /*#__PURE__*/React.createElement("div", {
    className: "topology-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "Physical Topology"), /*#__PURE__*/React.createElement("div", {
    className: "topology-layers"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topology-layer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "layer-label"
  }, "WAN"), /*#__PURE__*/React.createElement("div", {
    className: "layer-nodes"
  }, /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "~",
    name: "Internet",
    subtitle: "ISP Upstream"
  }))), /*#__PURE__*/React.createElement(Connector, {
    label: "WAN uplink"
  }), /*#__PURE__*/React.createElement("div", {
    className: "topology-layer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "layer-label"
  }, "Edge \xB7 pve3"), /*#__PURE__*/React.createElement("div", {
    className: "layer-nodes"
  }, /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "F",
    name: "OPNsense VM",
    subtitle: "Firewall / Router",
    vlanId: 99,
    onClick: () => toggleFilter(99)
  }), /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "D",
    name: "Pi-hole 2",
    subtitle: "Secondary DNS (LXC)",
    vlanId: 40,
    onClick: () => toggleFilter(40)
  }))), /*#__PURE__*/React.createElement(Connector, {
    label: "Trunk port \xB7 VLAN 999"
  }), /*#__PURE__*/React.createElement("div", {
    className: "topology-layer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "layer-label"
  }, "Distribution Layer"), /*#__PURE__*/React.createElement("div", {
    className: "layer-nodes"
  }, /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "S",
    name: "USW Pro Max 16 PoE",
    subtitle: "Distribution Switch",
    vlanId: 99,
    onClick: () => toggleFilter(99)
  }))), /*#__PURE__*/React.createElement(Connector, {
    label: "Tagged VLANs on all trunk ports"
  }), /*#__PURE__*/React.createElement("div", {
    className: "topology-layer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "layer-label"
  }, "Access Layer"), /*#__PURE__*/React.createElement("div", {
    className: "layer-nodes"
  }, /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "C",
    name: "Catalyst 2960X",
    subtitle: "Cisco Access Switch",
    vlanId: 99,
    onClick: () => toggleFilter(99)
  }), /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "W",
    name: "Unifi AP",
    subtitle: "Wireless Access Point",
    vlanId: 99,
    onClick: () => toggleFilter(99)
  }), /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "P",
    name: "Workstation",
    subtitle: "Direct Connect",
    vlanId: 10,
    onClick: () => toggleFilter(10)
  }), /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "N",
    name: "NAS (Backup)",
    subtitle: "Direct Connect",
    vlanId: 40,
    onClick: () => toggleFilter(40)
  }))), /*#__PURE__*/React.createElement(Connector, {
    label: "Trunk \xB7 all VLANs"
  }), /*#__PURE__*/React.createElement("div", {
    className: "topology-layer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "layer-label"
  }, "Server Layer \xB7 pve1 + pve2"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, PROXMOX_NODES.map(node => {
    const expanded = pveExpanded[node.name];
    const vms = node.guests.filter(g => g.type === 'VM').length;
    const lxcs = node.guests.length - vms;
    const meta = [vms > 0 && `${vms} VM${vms === 1 ? '' : 's'}`, lxcs > 0 && `${lxcs} LXC${lxcs === 1 ? '' : 's'}`].filter(Boolean).join(' \xB7 ');
    return /*#__PURE__*/React.createElement("div", {
      key: node.name,
      className: "proxmox-compound"
    }, /*#__PURE__*/React.createElement("div", {
      className: "proxmox-header",
      onClick: () => toggleNode(node.name)
    }, /*#__PURE__*/React.createElement("div", {
      className: "proxmox-title"
    }, node.name.toUpperCase(), /*#__PURE__*/React.createElement("span", {
      className: "proxmox-meta"
    }, node.role)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "proxmox-meta"
    }, meta), /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#5eead4',
        fontSize: '0.875rem',
        fontFamily: "'Fira Code', monospace"
      }
    }, expanded ? '[-]' : '[+]'))), expanded && /*#__PURE__*/React.createElement("div", {
      className: "guest-grid"
    }, node.guests.map((g, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: `guest-card${dimmed(g) ? ' dimmed' : ''}`,
      style: {
        borderLeftColor: vc(g.vlanId)
      },
      onClick: g.vlanId ? () => toggleFilter(g.vlanId) : undefined
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: vc(g.vlanId),
        fontWeight: 700,
        fontSize: '0.625rem'
      }
    }, g.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "guest-name"
    }, g.name), /*#__PURE__*/React.createElement("div", {
      className: "guest-type"
    }, g.stopped ? `${g.type} \xB7 stopped` : g.type))))));
  }))), /*#__PURE__*/React.createElement(Connector, {
    label: "Wireless SSIDs via Unifi AP \xB7 wired via Catalyst 2960X"
  }), /*#__PURE__*/React.createElement("div", {
    className: "topology-layer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "layer-label"
  }, "Wireless & Edge Endpoints"), /*#__PURE__*/React.createElement("div", {
    className: "layer-nodes"
  }, /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "W",
    name: "Routers of Rohan",
    subtitle: "Home WiFi SSID",
    vlanId: 10,
    onClick: () => toggleFilter(10)
  }), /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "I",
    name: "IoT WiFi",
    subtitle: "IoT SSID",
    vlanId: 50,
    onClick: () => toggleFilter(50)
  }), /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "R",
    name: "Raspberry Pi",
    subtitle: "via Catalyst 2960X",
    vlanId: 30,
    onClick: () => toggleFilter(30)
  })))), selectedVlan && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontFamily: "'Fira Code', monospace",
      fontSize: '0.75rem',
      color: '#525252',
      textAlign: 'center'
    }
  }, "Showing VLAN ", selectedVlan, " \u2014 click any node or \"All\" to clear filter")), /*#__PURE__*/React.createElement("div", {
    className: "topology-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "VLAN Map"), /*#__PURE__*/React.createElement("div", {
    className: "filter-tabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: "filter-tab",
    style: {
      borderColor: '#525252',
      background: selectedVlan === null ? '#525252' : 'transparent',
      color: selectedVlan === null ? '#111111' : '#525252'
    },
    onClick: () => setSelectedVlan(null)
  }, "All"), VLANS.map(v => /*#__PURE__*/React.createElement("button", {
    key: v.id,
    className: "filter-tab",
    style: {
      borderColor: vc(v.id),
      background: selectedVlan === v.id ? vc(v.id) : 'transparent',
      color: selectedVlan === v.id ? '#111111' : vc(v.id)
    },
    onClick: () => toggleFilter(v.id)
  }, "VLAN ", v.id))), /*#__PURE__*/React.createElement("div", {
    className: "vlan-list"
  }, filteredVlans.map(vlan => /*#__PURE__*/React.createElement("div", {
    key: vlan.id
  }, /*#__PURE__*/React.createElement("div", {
    className: `vlan-item vlan-${vlan.id}${expandedVlan === vlan.id ? ' active' : ''}`,
    onClick: () => toggleVlanRow(vlan.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "vlan-id",
    style: {
      color: vc(vlan.id)
    }
  }, "VLAN ", vlan.id), /*#__PURE__*/React.createElement("div", {
    className: "vlan-name"
  }, vlan.name), /*#__PURE__*/React.createElement("div", {
    className: "vlan-subnet"
  }, vlan.subnet)), expandedVlan === vlan.id && /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#1a1a1a',
      borderLeft: `3px solid ${vc(vlan.id)}`,
      borderRadius: '0 0 3px 3px',
      padding: '12px 16px',
      marginTop: -2
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "vlan-device-list"
  }, vlan.devices.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "vlan-device-chip"
  }, d))))))), /*#__PURE__*/React.createElement("div", {
    className: "security-check"
  }, /*#__PURE__*/React.createElement("div", {
    className: "security-check-title"
  }, "Security Posture"), /*#__PURE__*/React.createElement("ul", {
    style: {
      marginLeft: '20px',
      lineHeight: '1.8'
    }
  }, /*#__PURE__*/React.createElement("li", null, "VLAN 999 is the secure native trunk VLAN, with no IP assignment"), /*#__PURE__*/React.createElement("li", null, "Malware lab (VLAN 20) isolated with strict deny-all firewall rules"), /*#__PURE__*/React.createElement("li", null, "VLAN 99 is the management network: firewall, switches, AP, Proxmox nodes, PDM and TrueNAS"), /*#__PURE__*/React.createElement("li", null, "Zero Trust remote access via Twingate, no inbound ports needed"), /*#__PURE__*/React.createElement("li", null, "3CX phone system isolated in its own DMZ (VLAN 70)")))), /*#__PURE__*/React.createElement("div", {
    className: "improvements-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "improvements-title"
  }, "Lab Highlights"), /*#__PURE__*/React.createElement("div", {
    className: "improvements-grid"
  }, HIGHLIGHTS.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "improvement-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "improvement-title"
  }, h.title), /*#__PURE__*/React.createElement("div", {
    className: "improvement-desc"
  }, h.desc))))), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-title"
  }, "VLAN Color Legend"), /*#__PURE__*/React.createElement("div", {
    className: "legend-grid"
  }, VLANS.map(v => /*#__PURE__*/React.createElement("div", {
    key: v.id,
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: vc(v.id)
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN ", v.id, " \u2014 ", v.name))))));
};
ReactDOM.render(/*#__PURE__*/React.createElement(HomelabTopology, null), document.getElementById('root'));

