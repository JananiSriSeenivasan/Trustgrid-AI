"""Seed one explicitly-labelled demo scan when the store is empty."""

from datetime import datetime

from app.database.mongodb import assets_collection, scan_collection
from app.services.ai_risk_engine import calculate_ai_risk
from app.services.asset_classifier import classify_asset
from app.services.network_scanner import scan_metadata, scan_network
from app.services.priority_engine import calculate_priority
from app.services.threat_intelligence import enrich_with_threat_intelligence
from app.services.vulnerability_engine import detect_vulnerabilities


def seed_database():
    if scan_collection.count_documents({}) > 0:
        return

    raw_scan = scan_network("demo.lab.local", mode="demo")
    assets = classify_asset(raw_scan)
    vulnerabilities = enrich_with_threat_intelligence(detect_vulnerabilities(assets))
    risk = calculate_ai_risk(vulnerabilities, assets)
    scan_collection.insert_one(
        {
            "target": "demo.lab.local",
            "timestamp": datetime.utcnow(),
            "assets": assets,
            "vulnerabilities": vulnerabilities,
            "prioritized_vulnerabilities": calculate_priority(vulnerabilities, assets),
            "risk": risk,
            "scan_metadata": scan_metadata(raw_scan),
        }
    )
    for asset in assets:
        assets_collection.update_one(
            {"ip": asset["ip"]},
            {"$set": {**asset, "last_scanned": datetime.utcnow()}},
            upsert=True,
        )
