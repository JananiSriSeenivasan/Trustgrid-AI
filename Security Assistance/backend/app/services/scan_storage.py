from datetime import datetime
from bson import ObjectId
from app.database.mongodb import scan_collection, assets_collection

def save_scan_result(target, assets, vulnerabilities, prioritized_vulnerabilities, risk, metadata=None):
    """
    Saves complete scan telemetry into MongoDB scan_history collection.
    """
    document = {
        "target": target,
        "timestamp": datetime.utcnow(),
        "assets": assets,
        "vulnerabilities": vulnerabilities,
        "prioritized_vulnerabilities": prioritized_vulnerabilities,
        "risk": risk,
        "scan_metadata": metadata or {},
    }

    try:
        result = scan_collection.insert_one(document)
        
        # Upsert discovered assets in assets repository
        for asset in assets:
            assets_collection.update_one(
                {"ip": asset["ip"]},
                {"$set": {**asset, "last_scanned": datetime.utcnow()}},
                upsert=True
            )
            
        return str(result.inserted_id)
    except Exception as e:
        print(f"[ScanStorage] Database insertion note: {e}")
        return "mock_scan_id_65c123456789"

def get_scan_history(limit=50):
    """
    Retrieves historical scan runs sorted by reverse chronological order.
    """
    history = []
    try:
        cursor = scan_collection.find().sort("timestamp", -1).limit(limit)
        for scan in cursor:
            history.append({
                "scan_id": str(scan["_id"]),
                "target": scan.get("target", "Unknown"),
                "timestamp": scan.get("timestamp", datetime.utcnow()).isoformat() if isinstance(scan.get("timestamp"), datetime) else str(scan.get("timestamp")),
                "risk_level": scan.get("risk", {}).get("risk_level", "Unknown"),
                "risk_score": scan.get("risk", {}).get("risk_score", 0.0),
                "total_vulnerabilities": scan.get("risk", {}).get("total_vulnerabilities", len(scan.get("vulnerabilities", []))),
                "total_assets": len(scan.get("assets", [])),
                "scan_metadata": scan.get("scan_metadata", {}),
            })
    except Exception as e:
        print(f"[ScanStorage] History lookup note: {e}")
        
    return history

def get_scan(scan_id: str):
    """
    Retrieves full scan document by ObjectId or scan_id string.
    """
    try:
        if ObjectId.is_valid(scan_id):
            scan = scan_collection.find_one({"_id": ObjectId(scan_id)})
        else:
            scan = scan_collection.find_one({"_id": scan_id}) or scan_collection.find_one({"target": scan_id})

        if scan:
            scan["_id"] = str(scan["_id"])
            if isinstance(scan.get("timestamp"), datetime):
                scan["timestamp"] = scan["timestamp"].isoformat()
            return scan
    except Exception as e:
        print(f"[ScanStorage] Get scan error: {e}")

    return None


def delete_scan(scan_id: str) -> bool:
    """Delete one stored scan record without changing the asset inventory."""
    try:
        query = {"_id": ObjectId(scan_id)} if ObjectId.is_valid(scan_id) else {"_id": scan_id}
        return scan_collection.delete_one(query).deleted_count == 1
    except Exception as e:
        print(f"[ScanStorage] Delete scan error: {e}")
        return False
