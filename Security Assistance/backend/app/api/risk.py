from fastapi import APIRouter, Query, HTTPException
from app.services.network_scanner import scan_metadata, scan_network
from app.services.asset_classifier import classify_asset
from app.services.vulnerability_engine import detect_vulnerabilities
from app.services.threat_intelligence import enrich_with_threat_intelligence
from app.services.priority_engine import calculate_priority
from app.services.ai_risk_engine import calculate_ai_risk
from app.services.scan_storage import save_scan_result
from app.services.vulnerability_engine import assessment_coverage

router = APIRouter(prefix="/risk", tags=["AI Risk Scoring & Prioritization"])

@router.get("/")
@router.get("")
def get_risk(
    target: str = Query(..., description="Target IP or hostname to analyze risk posture"),
    mode: str = Query("demo"),
    authorized: bool = Query(False),
):
    """
    Executes end-to-end vulnerability assessment pipeline and computes multi-factor AI Risk Score.
    """
    try:
        scan_result = scan_network(target, mode=mode, authorized=authorized)
        assets = classify_asset(scan_result)
        vulnerabilities = detect_vulnerabilities(assets)
        enriched_vulns = enrich_with_threat_intelligence(vulnerabilities)
        prioritized = calculate_priority(enriched_vulns, assets)
        risk = calculate_ai_risk(enriched_vulns, assets)

        scan_id = save_scan_result(
            target=target,
            assets=assets,
            vulnerabilities=enriched_vulns,
            prioritized_vulnerabilities=prioritized,
            risk=risk,
            metadata=scan_metadata(scan_result),
        )

        return {
            "scan_id": scan_id,
            "target": target,
            "assets": assets,
            "vulnerabilities": enriched_vulns,
            "prioritized_vulnerabilities": prioritized,
            "risk": risk,
            "scan_metadata": scan_metadata(scan_result),
            "assessment_coverage": assessment_coverage(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk evaluation error: {str(e)}")
