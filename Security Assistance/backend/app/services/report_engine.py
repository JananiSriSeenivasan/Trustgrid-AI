from datetime import datetime

def generate_executive_report(scan_data: dict) -> dict:
    """
    Generates an Enterprise SOC Executive Vulnerability & Risk Report suitable for CISOs and Auditors.
    """
    target = scan_data.get("target", "N/A")
    risk_info = scan_data.get("risk", {})
    risk_score = risk_info.get("risk_score", 0.0)
    risk_level = risk_info.get("risk_level", "Low")
    assets = scan_data.get("assets", [])
    vulnerabilities = scan_data.get("vulnerabilities", [])
    prioritized = scan_data.get("prioritized_vulnerabilities", [])

    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for v in vulnerabilities:
        sev = v.get("severity", "Low")
        if sev in severity_counts:
            severity_counts[sev] += 1

    summary_text = (
        f"TrustGrid AI completed an automated vulnerability assessment for target environment '{target}'. "
        f"A total of {len(assets)} assets and {len(vulnerabilities)} vulnerabilities were identified. "
        f"The composite enterprise risk score is evaluated at {risk_score}/100 ({risk_level} Risk Level). "
        f"Immediate remediation action is required for {severity_counts['Critical']} Critical and {severity_counts['High']} High findings."
    )

    top_actions = []
    for p in prioritized[:5]:
        top_actions.append({
            "ip": p.get("ip"),
            "issue": p.get("issue"),
            "priority": p.get("priority"),
            "sla": p.get("sla_deadline"),
            "recommendation": p.get("recommendation")
        })

    return {
        "report_title": f"Executive Security Assessment Report - {target}",
        "generated_at": datetime.utcnow().isoformat(),
        "target": target,
        "scan_id": scan_data.get("scan_id", "N/A"),
        "executive_summary": summary_text,
        "overall_risk_score": risk_score,
        "overall_risk_level": risk_level,
        "total_assets_scanned": len(assets),
        "total_vulnerabilities_detected": len(vulnerabilities),
        "severity_breakdown": severity_counts,
        "top_prioritized_actions": top_actions,
        "compliance_assessment": {
            "nist_800_53_status": "Non-Compliant" if severity_counts["Critical"] > 0 else "Compliant",
            "cis_controls_status": "Action Required" if len(vulnerabilities) > 0 else "Pass",
            "owasp_top_10_risk": "High" if severity_counts["High"] > 0 or severity_counts["Critical"] > 0 else "Low"
        }
    }
