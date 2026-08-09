from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from typing import Optional
import csv
import io

from app.services.report_engine import generate_executive_report
from app.services.scan_storage import get_scan
from app.services.pdf_generator import generate_pdf_report
from app.database.mongodb import scan_collection

router = APIRouter(prefix="/reports", tags=["Executive Security Reporting"])

@router.get("/executive")
@router.get("")
def get_executive_report(target: Optional[str] = Query(None, description="Optional target scan filter")):
    """
    Generates CISO-level Executive Security & Compliance Report for latest or targeted scan.
    """
    query = {"target": target} if target else {}
    latest_scan = scan_collection.find_one(query, sort=[("timestamp", -1)])

    if not latest_scan:
        raise HTTPException(status_code=404, detail="No scan exists for this target. Run a scan first.")

    # Remove MongoDB ObjectId before processing
    latest_scan.pop("_id", None)
    return generate_executive_report(latest_scan)


@router.get("/export/pdf")
def export_pdf_report(target: Optional[str] = Query(None, description="Optional target range")):
    """
    Downloads executive CISO PDF security report.
    """
    query = {"target": target} if target else {}
    latest_scan = scan_collection.find_one(query, sort=[("timestamp", -1)])

    if not latest_scan:
        raise HTTPException(status_code=404, detail="No scan exists for this target. Run a scan first.")

    latest_scan.pop("_id", None)
    pdf_bytes = generate_pdf_report(latest_scan)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Security_Assistance_Executive_Report.pdf"}
    )


@router.get("/export/csv")
def export_csv_findings(target: Optional[str] = Query(None)):
    """
    Exports vulnerability findings and asset telemetry as a CSV file.
    """
    query = {"target": target} if target else {}
    latest_scan = scan_collection.find_one(query, sort=[("timestamp", -1)])
    if not latest_scan:
        raise HTTPException(status_code=404, detail="No scan exists for this target. Run a scan first.")
    vulns = latest_scan.get("vulnerabilities", []) if latest_scan else []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Host IP", "Hostname", "Port", "Service", "Vulnerability Finding", "Severity", "CVSS", "Recommendation"])

    for v in vulns:
        writer.writerow([
            v.get("ip", ""),
            v.get("hostname", ""),
            v.get("port", ""),
            v.get("service", ""),
            v.get("vulnerability", ""),
            v.get("severity", ""),
            v.get("cvss", 0.0),
            v.get("recommendation", "")
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Security_Assistance_Vulnerabilities.csv"}
    )
