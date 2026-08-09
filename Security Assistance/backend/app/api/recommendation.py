from fastapi import APIRouter, Query
from typing import Optional
from app.services.network_scanner import scan_metadata, scan_network
from app.services.asset_classifier import classify_asset
from app.services.vulnerability_engine import detect_vulnerabilities
from app.services.threat_intelligence import enrich_with_threat_intelligence
from app.services.ai_recommendation_engine import generate_ai_recommendations
from app.database.mongodb import scan_collection

router = APIRouter(prefix="/recommendation", tags=["AI Remediation Advisor"])


@router.get("/")
@router.get("")
def get_recommendations(
    target: Optional[str] = Query(None, description="Target IP or CIDR subnet"),
    mode: str = Query("demo"),
    authorized: bool = Query(False),
):
    """
    Generates explainable AI recommendations using a weighted multi-factor scoring model.
    Each recommendation includes risk score, risk factors, why_this_matters,
    business/technical impact, compliance mappings, and remediation scripts.
    All intelligence is LOCAL — no external AI APIs are used.
    """
    if target:
        scan_result = scan_network(target, mode=mode, authorized=authorized)
        assets = classify_asset(scan_result)
        raw_vulns = detect_vulnerabilities(assets)
        enriched_vulns = enrich_with_threat_intelligence(raw_vulns)
        recommendations = generate_ai_recommendations(enriched_vulns, assets)
        return {
            "target": target,
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
            "intelligence_source": "Local curated threat-intelligence snapshot",
            "scan_metadata": scan_metadata(scan_result),
        }

    # Retrieve from latest scan in database
    latest = scan_collection.find_one(sort=[("timestamp", -1)])
    if latest and "vulnerabilities" in latest:
        assets = latest.get("assets", [])
        vulns  = latest.get("vulnerabilities", [])
        recommendations = generate_ai_recommendations(vulns, assets)
        return {
            "target": latest.get("target", "Stored Scan Database"),
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
            "intelligence_source": "Local curated threat-intelligence snapshot",
            "scan_metadata": latest.get("scan_metadata", {}),
        }

    return {
        "target": "N/A",
        "total_recommendations": 0,
        "recommendations": [],
        "intelligence_source": "Local curated threat-intelligence snapshot",
    }
