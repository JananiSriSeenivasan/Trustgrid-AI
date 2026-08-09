from typing import List, Optional
from pydantic import BaseModel, Field

class ServiceDetail(BaseModel):
    port: int
    service: str
    version: Optional[str] = "Unknown"
    protocol: Optional[str] = "tcp"

class AssetModel(BaseModel):
    ip: str
    hostname: Optional[str] = "Unknown"
    status: Optional[str] = "up"
    asset_type: str = Field(default="Unknown", description="Classified type e.g. Windows Server, Web Server, Linux Server, Database Server")
    criticality: str = Field(default="Medium", description="Business Criticality: Low, Medium, High, Critical")
    services: List[ServiceDetail] = []
    os: Optional[str] = "Unknown"
    mac_address: Optional[str] = "N/A"
    vendor: Optional[str] = "N/A"

class AssetListResponse(BaseModel):
    total_assets: int
    assets: List[AssetModel]
