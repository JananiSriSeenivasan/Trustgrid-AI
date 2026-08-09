def calculate_priority(vulnerabilities, assets):
    """
    AI Vulnerability Prioritization Engine using CVSS v3.1, EPSS exploit likelihood, 
    and Business Asset Criticality to determine SLA Remediation Deadlines (P1 to P4).
    """
    prioritized = []

    for vuln in vulnerabilities:
        cvss = vuln.get("cvss", 0.0)
        epss = vuln.get("epss_score", 0.10)
        exploit_status = vuln.get("exploit_status", "")
        confidence = vuln.get("confidence", "Potential")

        # Find corresponding asset criticality
        asset_criticality = "Low"
        for asset in assets:
            if asset.get("ip") == vuln.get("ip"):
                asset_criticality = asset.get("criticality", "Low")
                break

        priority = "P4"
        sla = "30 Days"
        reason = "Low risk vulnerability on non-critical asset."

        # SLA Decision Matrix (Tenable/Qualys benchmark standard)
        if confidence == "Confirmed" and (
            cvss >= 9.0
            or (cvss >= 8.0 and asset_criticality == "Critical")
            or "known exploited" in exploit_status.lower()
        ):
            priority = "P1"
            sla = "24 Hours (Emergency Patch)"
            reason = "Critical vulnerability with actively exploited vector or critical asset exposure."
        elif cvss >= 7.0 or (cvss >= 6.0 and asset_criticality in ["High", "Critical"]) or epss > 0.8:
            priority = "P2"
            sla = "72 Hours (Critical Remediation)"
            reason = "High severity issue on core asset or high EPSS exploit probability."
        elif cvss >= 4.0 or asset_criticality == "High":
            priority = "P3"
            sla = "7 Days (Standard Remediation)"
            reason = "Medium severity vulnerability requiring scheduled maintenance."
        else:
            priority = "P4"
            sla = "30 Days (Routine Maintenance)"
            reason = "Low severity finding without immediate exploit threat."

        prioritized.append({
            "ip": vuln["ip"],
            "issue": vuln["vulnerability"],
            "service": vuln["service"],
            "severity": vuln["severity"],
            "cvss": cvss,
            "epss_score": epss,
            "confidence": confidence,
            "asset_criticality": asset_criticality,
            "priority": priority,
            "sla_deadline": sla,
            "reason": reason,
            "recommendation": vuln["recommendation"]
        })

    # Sort P1 -> P2 -> P3 -> P4
    priority_order = {"P1": 1, "P2": 2, "P3": 3, "P4": 4}
    prioritized.sort(key=lambda x: priority_order.get(x["priority"], 99))

    return prioritized
