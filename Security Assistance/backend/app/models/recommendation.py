from typing import List, Optional
from pydantic import BaseModel, Field

class ComplianceMapping(BaseModel):
    nist_800_53: str
    cis_control: str
    owasp_top_10: str

class RecommendationModel(BaseModel):
    ip: str
    issue: str
    severity: str
    cvss: float
    priority: str
    security_category: str
    recommended_actions: List[str]
    compliance: Optional[ComplianceMapping] = None
    script_fix_powershell: Optional[str] = None
    script_fix_bash: Optional[str] = None

class RecommendationResponseModel(BaseModel):
    target: str
    total_recommendations: int
    recommendations: List[RecommendationModel]
