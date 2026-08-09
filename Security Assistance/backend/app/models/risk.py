from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PrioritizedVulnerabilityModel(BaseModel):
    ip: str
    issue: str
    service: str
    severity: str
    cvss: float
    asset_criticality: str
    priority: str = Field(..., description="P1 (Emergency), P2 (Critical), P3 (High), P4 (Medium/Low)")
    sla_deadline: Optional[str] = Field(default="7 Days", description="Remediation SLA timeframe")
    reason: str
    recommendation: str

class RiskAnalysisDetail(BaseModel):
    vulnerability_count: int
    business_criticality: str
    exploit_analysis: str
    internet_exposure: bool
    epss_threat_index: Optional[float] = 0.0

class RiskModel(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str = Field(..., description="Low, Medium, High, Critical")
    total_vulnerabilities: int = 0
    analysis: Optional[Dict[str, Any]] = None

class RiskResponseModel(BaseModel):
    scan_id: Optional[str] = None
    target: str
    assets: List[Dict[str, Any]]
    vulnerabilities: List[Dict[str, Any]]
    prioritized_vulnerabilities: List[PrioritizedVulnerabilityModel]
    risk: RiskModel
