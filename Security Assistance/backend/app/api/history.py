from fastapi import APIRouter, HTTPException
from app.services.scan_storage import get_scan_history, get_scan, delete_scan

router = APIRouter(prefix="/history", tags=["Scan History Management"])

@router.get("/")
@router.get("")
def list_scan_history():
    """
    Retrieves history of past vulnerability assessments from MongoDB.
    """
    history = get_scan_history()
    return {
        "total_scans": len(history),
        "history": history
    }

@router.get("/latest")
def get_latest_scan_details():
    """Retrieve the full latest scan for topology and detail views."""
    history = get_scan_history(limit=1)
    if not history:
        raise HTTPException(status_code=404, detail="No scans are available yet")
    scan = get_scan(history[0]["scan_id"])
    if not scan:
        raise HTTPException(status_code=404, detail="Latest scan could not be loaded")
    return scan


@router.delete("/{scan_id}")
def remove_historical_scan(scan_id: str):
    """Remove one saved scan result from scan history."""
    if not delete_scan(scan_id):
        raise HTTPException(status_code=404, detail="Scan record not found")
    return {"message": "Scan history entry deleted", "scan_id": scan_id}

@router.get("/{scan_id}")
def get_historical_scan_details(scan_id: str):
    """
    Retrieves full details of a specific historical scan by scan_id or target name.
    """
    scan_doc = get_scan(scan_id)
    if not scan_doc:
        raise HTTPException(status_code=404, detail=f"Scan record '{scan_id}' not found")
    return scan_doc
