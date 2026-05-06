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
  devices: ['Cisco CML VM', 'Netbox VM', 'LLM Server VM', 'Windows 11 VM', 'Home Assistant VM', 'Raspberry Pi', 'MkDocs LXC', 'Bookstack LXC', 'Twingate LXC']
}, {
  id: 40,
  name: 'SERVERS',
  subnet: '10.40.0.0/28',
  devices: ['TrueNAS VM', 'NAS (Backup)', 'Docker Host 1 VM', 'Docker Host 2 VM', 'Docker Host 3 VM', 'Podman Host VM']
}, {
  id: 50,
  name: 'IoT',
  subnet: '10.50.0.0/24',
  devices: ['IoT devices (SSID: IoT WiFi)']
}, {
  id: 99,
  name: 'MGMT',
  subnet: '10.99.0.0/24',
  devices: ['OPNsense VM', 'USW Pro Max 16 PoE', 'Cisco Catalyst 2960X', 'Unifi AP', 'DNS 1', 'DNS 2 LXC']
}, {
  id: 999,
  name: 'NATIVE',
  subnet: 'No IP — trunk only',
  devices: ['Trunk: OPNsense → Dist Switch', 'All inter-switch links']
}];
const PROXMOX_GUESTS = [{
  name: 'DNS 2',
  type: 'LXC',
  vlanId: 99,
  icon: '>'
}, {
  name: 'Twingate',
  type: 'LXC',
  vlanId: 30,
  icon: '>'
}, {
  name: 'Bookstack',
  type: 'LXC',
  vlanId: 30,
  icon: '>'
}, {
  name: 'MkDocs',
  type: 'LXC',
  vlanId: 30,
  icon: '>'
}, {
  name: 'TrueNAS',
  type: 'VM',
  vlanId: 40,
  icon: '>'
}, {
  name: 'Docker Host 1',
  type: 'VM',
  vlanId: 40,
  icon: '>'
}, {
  name: 'Docker Host 2',
  type: 'VM',
  vlanId: 40,
  icon: '>'
}, {
  name: 'Docker Host 3',
  type: 'VM',
  vlanId: 40,
  icon: '>'
}, {
  name: 'Windows 11',
  type: 'VM',
  vlanId: 30,
  icon: '>'
}, {
  name: 'Home Asst.',
  type: 'VM',
  vlanId: 30,
  icon: '>'
}, {
  name: 'Netbox',
  type: 'VM',
  vlanId: 30,
  icon: '>'
}, {
  name: 'Cisco CML',
  type: 'VM',
  vlanId: 30,
  icon: '>'
}, {
  name: 'LLM Server',
  type: 'VM',
  vlanId: 30,
  icon: '>'
}, {
  name: 'Kali Linux',
  type: 'VM',
  vlanId: 20,
  icon: '>'
}, {
  name: 'Parrot OS',
  type: 'VM',
  vlanId: 20,
  icon: '>'
}, {
  name: 'Sec. Onion',
  type: 'VM',
  vlanId: 20,
  icon: '>'
}, {
  name: 'Podman Host',
  type: 'VM',
  vlanId: 40,
  icon: '>'
}];
const HIGHLIGHTS = [{
  icon: '~',
  title: 'Virtualised Firewall',
  desc: 'OPNsense runs as a VM on Proxmox Node 1. All traffic passes through it before reaching the distribution switch, with VLAN-aware firewall rules per segment.'
}, {
  icon: '~',
  title: 'Unifi Distribution Core',
  desc: 'USW Pro Max 16 PoE aggregates every VLAN trunk and provides PoE to the access point. Managed centrally via the Unifi Network Application.'
}, {
  icon: '~',
  title: 'Isolated Lab Segment',
  desc: 'VLAN 30 (Lab) contains the LLM Server, Cisco CML, Netbox, Windows 11, Home Assistant, Raspberry Pi, and internal services — kept completely separate from the home network so experiments stay contained.'
}, {
  icon: '~',
  title: 'Malware Sandbox',
  desc: 'VLAN 20 hard-isolates Kali, Parrot OS and Security Onion with a deny-all outbound firewall rule, preventing any lateral movement into the main network.'
}, {
  icon: '~',
  title: 'Dedicated Management',
  desc: 'VLAN 99 hosts network management devices alongside DNS infrastructure (DNS 1 & DNS 2). VLAN 999 is the secure native/trunk VLAN with no IP assignment, mitigating VLAN hopping.'
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
  const [pveExpanded, setPveExpanded] = useState(true);
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
  }, "Proxmox \xB7 OPNsense \xB7 Unifi \xB7 7 VLANs \xB7 17 Guests")), /*#__PURE__*/React.createElement("div", {
    className: "stats-row"
  }, [['2', 'Proxmox Nodes'], ['13', 'Virtual Machines'], ['4', 'LXC Containers'], ['7', 'VLANs'], ['3', 'Switches / APs'], ['2', 'WiFi SSIDs']].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
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
  }, "Edge \xB7 Proxmox Node 1"), /*#__PURE__*/React.createElement("div", {
    className: "layer-nodes"
  }, /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "F",
    name: "OPNsense VM",
    subtitle: "Firewall / Router",
    vlanId: 99,
    onClick: () => toggleFilter(99)
  }), /*#__PURE__*/React.createElement(DeviceNode, {
    icon: "D",
    name: "DNS 1",
    subtitle: "Primary DNS Server",
    vlanId: 99,
    onClick: () => toggleFilter(99)
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
  }, "Server Layer \xB7 Proxmox Node 2"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "proxmox-compound"
  }, /*#__PURE__*/React.createElement("div", {
    className: "proxmox-header",
    onClick: () => setPveExpanded(e => !e)
  }, /*#__PURE__*/React.createElement("div", {
    className: "proxmox-title"
  }, "PROXMOX NODE 2"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "proxmox-meta"
  }, "13 VMs \xB7 4 LXCs"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#5eead4',
      fontSize: '0.875rem',
      fontFamily: "'Fira Code', monospace"
    }
  }, pveExpanded ? '[-]' : '[+]'))), pveExpanded && /*#__PURE__*/React.createElement("div", {
    className: "guest-grid"
  }, PROXMOX_GUESTS.map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `guest-card${dimmed(g) ? ' dimmed' : ''}`,
    style: {
      borderLeftColor: vc(g.vlanId)
    },
    onClick: () => toggleFilter(g.vlanId)
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
  }, g.type)))))))), /*#__PURE__*/React.createElement(Connector, {
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
  }, /*#__PURE__*/React.createElement("li", null, "VLAN 999 is the secure native trunk VLAN \u2014 no IP assignment"), /*#__PURE__*/React.createElement("li", null, "Malware lab (VLAN 20) isolated with strict deny-all firewall rules"), /*#__PURE__*/React.createElement("li", null, "VLAN 99 hosts management devices and DNS infrastructure (DNS 1 & DNS 2)"), /*#__PURE__*/React.createElement("li", null, "Zero Trust remote access via Twingate \u2014 no exposed public ports")))), /*#__PURE__*/React.createElement("div", {
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

