const NetworkTopology = () => {
  const beforeTopology = [{
    id: 1,
    name: 'LAN',
    subnet: '10.30.X.0/24',
    vlanClass: 'vlan-1',
    note: 'Default VLAN - Security Risk!'
  }, {
    id: 20,
    name: 'MALWARE',
    subnet: '10.0.X.0/24',
    vlanClass: 'vlan-20'
  }, {
    id: 30,
    name: 'HOMELAB',
    subnet: '10.30.X.0/24',
    vlanClass: 'vlan-30'
  }, {
    id: 40,
    name: 'SERVERS',
    subnet: '10.30.X.0/28',
    vlanClass: 'vlan-40'
  }, {
    id: 50,
    name: 'IoT',
    subnet: '10.30.X.0/24',
    vlanClass: 'vlan-50'
  }];
  const afterTopology = [{
    id: 999,
    name: 'Native',
    subnet: 'No IP Assignment',
    vlanClass: 'vlan-999',
    note: 'Secure Native VLAN'
  }, {
    id: 10,
    name: 'Home',
    subnet: '10.10.X.0/24',
    vlanClass: 'vlan-10'
  }, {
    id: 20,
    name: 'MALWARE',
    subnet: '10.0.X.0/24',
    vlanClass: 'vlan-20'
  }, {
    id: 30,
    name: 'HOMELAB',
    subnet: '10.30.X.0/24',
    vlanClass: 'vlan-30'
  }, {
    id: 40,
    name: 'SERVERS',
    subnet: '10.30.X.0/28',
    vlanClass: 'vlan-40'
  }, {
    id: 50,
    name: 'IoT',
    subnet: '10.30.X.0/24',
    vlanClass: 'vlan-50'
  }, {
    id: 99,
    name: 'MGMT',
    subnet: '10.0.X.0/24',
    vlanClass: 'vlan-99',
    note: 'Management Network'
  }];
  const improvements = [{
    icon: '🛡️',
    title: 'Native VLAN Security',
    desc: 'Changed native VLAN from 1 to 999 with no IP addressing, preventing VLAN hopping attacks'
  }, {
    icon: '🔧',
    title: 'Dedicated Management',
    desc: 'Created VLAN 99 for network device management, isolating administrative access'
  }, {
    icon: '🚫',
    title: 'Eliminated VLAN 1',
    desc: 'Removed VLAN 1 from production use, following industry best practices'
  }, {
    icon: '🔒',
    title: 'Enhanced Segmentation',
    desc: 'Maintained strong isolation between malware, homelab, servers, and IoT networks'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header"
  }, /*#__PURE__*/React.createElement("h1", null, "VLAN Segmentation Evolution"), /*#__PURE__*/React.createElement("p", {
    className: "subtitle"
  }, "Network Topology Comparison")), /*#__PURE__*/React.createElement("div", {
    className: "comparison-wrapper"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topology-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-badge badge-before"
  }, "Before"), /*#__PURE__*/React.createElement("h2", {
    className: "section-title"
  }, "Original Configuration"), /*#__PURE__*/React.createElement("div", {
    className: "network-diagram"
  }, /*#__PURE__*/React.createElement("div", {
    className: "device"
  }, /*#__PURE__*/React.createElement("div", {
    className: "device-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "device-icon"
  }, "\uD83D\uDD00"), /*#__PURE__*/React.createElement("div", {
    className: "device-name"
  }, "Core Switch / Router")), /*#__PURE__*/React.createElement("div", {
    className: "vlan-list"
  }, beforeTopology.map(vlan => /*#__PURE__*/React.createElement("div", {
    key: vlan.id,
    className: `vlan-item ${vlan.vlanClass}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "vlan-id"
  }, "VLAN ", vlan.id), /*#__PURE__*/React.createElement("div", {
    className: "vlan-name"
  }, vlan.name), /*#__PURE__*/React.createElement("div", {
    className: "vlan-subnet"
  }, vlan.subnet)))))), /*#__PURE__*/React.createElement("div", {
    className: "security-warning"
  }, /*#__PURE__*/React.createElement("div", {
    className: "security-warning-title"
  }, "\u26A0\uFE0F Security Concerns"), /*#__PURE__*/React.createElement("ul", {
    style: {
      marginLeft: '20px',
      lineHeight: '1.8'
    }
  }, /*#__PURE__*/React.createElement("li", null, "Using VLAN 1 for user traffic"), /*#__PURE__*/React.createElement("li", null, "Default native VLAN exposed"), /*#__PURE__*/React.createElement("li", null, "No dedicated management network"), /*#__PURE__*/React.createElement("li", null, "Vulnerable to VLAN hopping")))), /*#__PURE__*/React.createElement("div", {
    className: "topology-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-badge badge-after"
  }, "After"), /*#__PURE__*/React.createElement("h2", {
    className: "section-title"
  }, "Improved Configuration"), /*#__PURE__*/React.createElement("div", {
    className: "network-diagram"
  }, /*#__PURE__*/React.createElement("div", {
    className: "device"
  }, /*#__PURE__*/React.createElement("div", {
    className: "device-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "device-icon"
  }, "\uD83D\uDD00"), /*#__PURE__*/React.createElement("div", {
    className: "device-name"
  }, "Core Switch / Router")), /*#__PURE__*/React.createElement("div", {
    className: "vlan-list"
  }, afterTopology.map(vlan => /*#__PURE__*/React.createElement("div", {
    key: vlan.id,
    className: `vlan-item ${vlan.vlanClass}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "vlan-id"
  }, "VLAN ", vlan.id), /*#__PURE__*/React.createElement("div", {
    className: "vlan-name"
  }, vlan.name), /*#__PURE__*/React.createElement("div", {
    className: "vlan-subnet"
  }, vlan.subnet)))))), /*#__PURE__*/React.createElement("div", {
    className: "security-check"
  }, /*#__PURE__*/React.createElement("div", {
    className: "security-check-title"
  }, "\u2713 Security Improvements"), /*#__PURE__*/React.createElement("ul", {
    style: {
      marginLeft: '20px',
      lineHeight: '1.8'
    }
  }, /*#__PURE__*/React.createElement("li", null, "Secure native VLAN (999) implemented"), /*#__PURE__*/React.createElement("li", null, "VLAN 1 removed from production"), /*#__PURE__*/React.createElement("li", null, "Dedicated management VLAN (99)"), /*#__PURE__*/React.createElement("li", null, "Industry best practices applied"))))), /*#__PURE__*/React.createElement("div", {
    className: "improvements-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "improvements-title"
  }, /*#__PURE__*/React.createElement("span", null, "\u2728"), " Key Improvements"), /*#__PURE__*/React.createElement("div", {
    className: "improvements-grid"
  }, improvements.map((improvement, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "improvement-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "improvement-icon"
  }, improvement.icon), /*#__PURE__*/React.createElement("div", {
    className: "improvement-title"
  }, improvement.title), /*#__PURE__*/React.createElement("div", {
    className: "improvement-desc"
  }, improvement.desc))))), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-title"
  }, "VLAN Color Legend"), /*#__PURE__*/React.createElement("div", {
    className: "legend-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#ff5252'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 1 - Default (Removed)")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#7b61ff'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 999 - Native")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#00d9ff'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 10 - Home")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#ff3d71'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 20 - Malware")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#ffa41b'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 30 - Homelab")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#4caf50'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 40 - Servers")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#9c27b0'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 50 - IoT")), /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-color",
    style: {
      backgroundColor: '#00ff9d'
    }
  }), /*#__PURE__*/React.createElement("span", null, "VLAN 99 - Management")))));
};
ReactDOM.render(/*#__PURE__*/React.createElement(NetworkTopology, null), document.getElementById('root'));

