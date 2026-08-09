def classify_asset(scan_data):
    """
    Classifies scanned network hosts into enterprise IT asset types, assigns business criticality,
    and maps department ownership per PDF Stage 2 specs.
    """
    assets = []

    for item in scan_data:
        if "error" in item:
            continue

        detected_services = []
        services_list = []

        for port in item.get("ports", []):
            srv_name = (port.get("service") or "").lower()
            detected_services.append(srv_name)
            services_list.append({
                "port": port.get("port"),
                "service": srv_name,
                "version": port.get("version", "Unknown"),
                "protocol": port.get("protocol", "tcp")
            })

        hostname_lower = (item.get("hostname") or "").lower()
        os_lower = (item.get("os") or "").lower()

        asset_type = "Linux Server"
        owner = "IT Infrastructure"
        criticality = "Medium"

        # Asset Intelligence Heuristic Categorization Rules (Stage 2 PDF)
        if any(s in detected_services for s in ["microsoft-ds", "msrpc", "kerberos", "ldap"]) or "windows" in os_lower:
            if any(s in detected_services for s in ["oracle", "mysql", "postgresql", "ms-sql-s"]):
                asset_type = "Database Server"
                owner = "ERP Data Team"
                criticality = "Critical"
            else:
                asset_type = "Windows Server"
                owner = "IT Infrastructure"
                criticality = "High" if "dc" in hostname_lower or "domain" in hostname_lower else "High"
        elif any(s in detected_services for s in ["oracle", "mysql", "postgresql", "ms-sql-s", "mongodb", "redis"]):
            asset_type = "Database Server"
            owner = "ERP Data Team"
            criticality = "Critical"
        elif "firewall" in hostname_lower or any(s in detected_services for s in ["bgp", "openvpn", "ipsec"]):
            asset_type = "Firewall"
            owner = "Network Security"
            criticality = "Critical"
        elif "switch" in hostname_lower or "router" in hostname_lower or any(s in detected_services for s in ["snmp"]):
            asset_type = "Switch / Router"
            owner = "Network Operations"
            criticality = "High"
        elif "cctv" in hostname_lower or "camera" in hostname_lower or "rtsp" in detected_services:
            asset_type = "CCTV Camera"
            owner = "Facilities Security"
            criticality = "Medium"
        elif "iot" in hostname_lower or "mqtt" in detected_services or "coap" in detected_services:
            asset_type = "IoT Device"
            owner = "IoT Operations"
            criticality = "Medium"
        elif "cloud" in hostname_lower or "aws" in hostname_lower or "azure" in hostname_lower:
            asset_type = "Cloud Server"
            owner = "Cloud DevOps"
            criticality = "High"
        elif "desktop" in hostname_lower or hostname_lower.startswith("pc-"):
            asset_type = "Desktop"
            owner = "Corporate Endpoints"
            criticality = "Low"
        elif "laptop" in hostname_lower or "workstation" in hostname_lower:
            asset_type = "Laptop"
            owner = "Corporate Endpoints"
            criticality = "Low"
        elif any(s in detected_services for s in ["http", "https", "nginx", "apache"]):
            asset_type = "Linux Server"
            owner = "AppSec / DevOps"
            criticality = "High"

        # Preserve unknown values. Fabricating a MAC address would make the
        # inventory appear more precise than the scan evidence supports.
        mac_address = item.get("mac") or "Unknown"

        assets.append({
            "ip": item.get("ip"),
            "mac": mac_address,
            "hostname": item.get("hostname", item.get("ip")),
            "status": item.get("status", "up"),
            "asset_type": asset_type,
            "owner": owner,
            "criticality": criticality,
            "services": services_list,
            "ports": services_list,
            "os": item.get("os", "Unknown"),
            "scan_evidence": item.get("scan_evidence", []),
            "scan_metadata": item.get("scan_metadata", {}),
            "classification_basis": {
                "services": detected_services,
                "os": item.get("os", "Unknown"),
                "hostname": item.get("hostname", item.get("ip")),
            },
        })

    return assets
