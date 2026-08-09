from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class ExecutiveReportModel(BaseModel):
    report_title: str
    generated_at: str
    target: str
    scan_id: Optional[str] = None
    executive_summary: str
    overall_risk_score: float
    overall_risk_level: str
    total_assets_scanned: int
    total_vulnerabilities_detected: int
    severity_breakdown: Dict[str, int]
    top_prioritized_actions: List[Dict[str, Any]]
    compliance_assessment: Dict[str, Any]
