from fastapi import APIRouter

from app.database.mongodb import scan_collection, storage_mode

router = APIRouter(prefix="/dashboard", tags=["SOC Dashboard Telemetry"])


@router.get("/stats")
@router.get("/")
def get_dashboard_stats():
    """Return a latest-scan posture plus a real historical risk trend."""
    scans = list(scan_collection.find().sort("timestamp", -1))
    latest = scans[0] if scans else {}
    assets = latest.get("assets", [])
    vulnerabilities = latest.get("vulnerabilities", [])
    severity_breakdown = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    asset_types: dict[str, int] = {}
    vulnerable_assets: dict[str, dict] = {}

    for asset in assets:
        asset_type = asset.get("asset_type", "Unclassified")
        asset_types[asset_type] = asset_types.get(asset_type, 0) + 1

    for vulnerability in vulnerabilities:
        severity = vulnerability.get("severity", "Low")
        if severity in severity_breakdown:
            severity_breakdown[severity] += 1
        ip = vulnerability.get("ip", "Unknown")
        entry = vulnerable_assets.setdefault(
            ip,
            {
                "ip": ip,
                "hostname": vulnerability.get("hostname", ip),
                "vulnerability_count": 0,
                "max_cvss": 0.0,
                "severity": severity,
            },
        )
        entry["vulnerability_count"] += 1
        entry["max_cvss"] = max(entry["max_cvss"], vulnerability.get("cvss", 0.0))

    critical = severity_breakdown["Critical"]
    high = severity_breakdown["High"]
    compliance = {
        "nist_800_53_compliance": max(0.0, round(100 - critical * 15 - high * 5, 1)),
        "cis_controls_compliance": max(0.0, round(100 - critical * 12 - high * 4, 1)),
        "owasp_top_10_compliance": max(0.0, round(100 - critical * 10 - high * 3, 1)),
        "notice": "Screening estimate from evidence-supported findings; not a formal compliance assessment.",
    }
    trend = [
        {
            "scan_id": str(scan.get("_id", "")),
            "timestamp": scan.get("timestamp"),
            "risk_score": scan.get("risk", {}).get("risk_score", 0.0),
            "risk_level": scan.get("risk", {}).get("risk_level", "Low"),
        }
        for scan in reversed(scans[:20])
    ]

    return {
        "total_scans": len(scans),
        "total_assets": len(assets),
        "total_vulnerabilities": len(vulnerabilities),
        "critical_vulnerabilities": critical,
        "high_vulnerabilities": high,
        "overall_risk_score": latest.get("risk", {}).get("risk_score", 0.0),
        "overall_risk_level": latest.get("risk", {}).get("risk_level", "Low"),
        "latest_scan_timestamp": latest.get("timestamp"),
        "latest_scan_target": latest.get("target"),
        "latest_scan_metadata": latest.get("scan_metadata", {}),
        "storage_mode": storage_mode,
        "severity_breakdown": severity_breakdown,
        "asset_type_distribution": asset_types,
        "top_vulnerable_assets": sorted(
            vulnerable_assets.values(),
            key=lambda item: (item["max_cvss"], item["vulnerability_count"]),
            reverse=True,
        )[:5],
        "compliance_summary": compliance,
        "risk_trend": trend,
    }
