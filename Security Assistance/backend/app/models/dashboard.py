from typing import List, Dict, Any
from pydantic import BaseModel

class SeverityBreakdown(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0

class TopVulnerableAsset(BaseModel):
    ip: str
    hostname: str
    asset_type: str
    criticality: str
    vulnerability_count: int
    risk_score: float

class DashboardStatsResponse(BaseModel):
    total_scans: int
    total_assets: int
    total_vulnerabilities: int
    overall_risk_score: float
    overall_risk_level: str
    severity_breakdown: SeverityBreakdown
    asset_type_distribution: Dict[str, int]
    top_vulnerable_assets: List[TopVulnerableAsset]
    compliance_summary: Dict[str, float]
