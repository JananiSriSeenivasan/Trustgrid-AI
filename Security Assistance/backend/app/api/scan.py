from fastapi import APIRouter, Query, BackgroundTasks, HTTPException
from typing import Dict, Any
import uuid

from app.services.network_scanner import scan_network, scan_metadata
from app.services.asset_classifier import classify_asset
from app.services.vulnerability_engine import assessment_coverage, detect_vulnerabilities
from app.services.threat_intelligence import enrich_with_threat_intelligence
from app.services.priority_engine import calculate_priority
from app.services.ai_risk_engine import calculate_ai_risk
from app.services.scan_storage import save_scan_result, get_scan

router = APIRouter(prefix="/scan", tags=["Network Scan Engine"])

# In-memory scan job tracker for background jobs
SCAN_JOBS: Dict[str, Dict[str, Any]] = {}

def _execute_full_scan_pipeline(target: str, mode: str = "demo", authorized: bool = False):
    """Internal orchestrator executing full discovery, classification, threat enrichment, and risk scoring."""
    raw_scan = scan_network(target, mode=mode, authorized=authorized)
    assets = classify_asset(raw_scan)
    raw_vulns = detect_vulnerabilities(assets)
    enriched_vulns = enrich_with_threat_intelligence(raw_vulns)
    prioritized_vulns = calculate_priority(enriched_vulns, assets)
    risk_info = calculate_ai_risk(enriched_vulns, assets)

    scan_id = save_scan_result(
        target=target,
        assets=assets,
        vulnerabilities=enriched_vulns,
        prioritized_vulnerabilities=prioritized_vulns,
        risk=risk_info,
        metadata=scan_metadata(raw_scan),
    )

    return {
        "scan_id": scan_id,
        "target": target,
        "assets": assets,
        "vulnerabilities": enriched_vulns,
        "prioritized_vulnerabilities": prioritized_vulns,
        "risk": risk_info
        ,"scan_metadata": scan_metadata(raw_scan)
        ,"assessment_coverage": assessment_coverage()
    }

@router.post("/")
@router.post("")
def start_scan(
    target: str = Query(..., description="IP address, CIDR subnet, or hostname to scan"),
    mode: str = Query("demo", description="demo, live, or auto"),
    authorized: bool = Query(False, description="Confirm authorisation before a live scan"),
):
    """
    Executes synchronous network discovery, asset classification, and security posture assessment.
    Backward compatible with legacy /scan POST endpoint.
    """
    try:
        result = _execute_full_scan_pipeline(target, mode=mode, authorized=authorized)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan processing error: {str(e)}")

def _background_scan_task(job_id: str, target: str, mode: str, authorized: bool):
    SCAN_JOBS[job_id]["status"] = "RUNNING"
    try:
        res = _execute_full_scan_pipeline(target, mode=mode, authorized=authorized)
        SCAN_JOBS[job_id]["status"] = "COMPLETED"
        SCAN_JOBS[job_id]["result"] = res
    except Exception as e:
        SCAN_JOBS[job_id]["status"] = "FAILED"
        SCAN_JOBS[job_id]["error"] = str(e)

@router.post("/async")
def start_async_scan(
    target: str,
    background_tasks: BackgroundTasks,
    mode: str = "demo",
    authorized: bool = False,
):
    """
    Initiates asynchronous non-blocking background network scan for enterprise scalability.
    """
    job_id = str(uuid.uuid4())[:8]
    SCAN_JOBS[job_id] = {
        "job_id": job_id,
        "target": target,
        "status": "PENDING"
    }
    background_tasks.add_task(_background_scan_task, job_id, target, mode, authorized)
    return {
        "message": "Async scan job submitted successfully.",
        "job_id": job_id,
        "status": "PENDING",
        "target": target,
        "mode": mode,
    }

@router.get("/status/{job_id}")
def get_async_scan_status(job_id: str):
    """
    Checks the status of an asynchronous scan job.
    """
    if job_id not in SCAN_JOBS:
        raise HTTPException(status_code=404, detail="Scan job_id not found")
    return SCAN_JOBS[job_id]
