from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.database.mongodb import assets_collection, scan_collection
from app.services.network_scanner import scan_network, scan_metadata
from app.services.asset_classifier import classify_asset

router = APIRouter(prefix="/assets", tags=["Asset Inventory & Intelligence"])

@router.get("/")
@router.get("")
def get_assets(
    target: Optional[str] = Query(None, description="Optional target IP/hostname to scan or filter"),
    mode: str = Query("demo"),
    authorized: bool = Query(False),
):
    """
    Retrieves IT Asset Inventory, classified asset types, and business criticality ratings.
    """
    if target:
        scan_res = scan_network(target, mode=mode, authorized=authorized)
        assets = classify_asset(scan_res)
        return {
            "target": target,
            "total_assets": len(assets),
            "assets": assets,
            "scan_metadata": scan_metadata(scan_res),
        }

    # Retrieve stored assets from database
    stored_assets = []
    try:
        cursor = assets_collection.find()
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            stored_assets.append(doc)
    except Exception as e:
        print(f"[AssetsAPI] DB lookup note: {e}")

    # Fallback to latest scan in database if assets collection empty
    if not stored_assets:
        latest = scan_collection.find_one(sort=[("timestamp", -1)])
        if latest and "assets" in latest:
            stored_assets = latest["assets"]

    return {
        "message": "Asset inventory retrieved successfully",
        "total_assets": len(stored_assets),
        "assets": stored_assets
    }

@router.get("/{ip}")
def get_asset_by_ip(ip: str):
    """
    Retrieves detailed security profile for a specific asset IP address.
    """
    asset = assets_collection.find_one({"ip": ip})
    if not asset:
        latest = scan_collection.find_one(sort=[("timestamp", -1)])
        if latest and "assets" in latest:
            asset = next((a for a in latest["assets"] if a.get("ip") == ip), None)

    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset with IP '{ip}' not found")

    if "_id" in asset:
        asset["_id"] = str(asset["_id"])

    return asset
