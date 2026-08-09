from app.services.ai_risk_engine import calculate_ai_risk

def calculate_risk(vulnerabilities, assets=None):
    """
    Calculates composite risk score. Backward compatible helper wrapping calculate_ai_risk.
    """
    if assets is None:
        assets = []
        
    ai_result = calculate_ai_risk(vulnerabilities, assets)
    
    return {
        "risk_score": ai_result["risk_score"],
        "risk_level": ai_result["risk_level"],
        "total_vulnerabilities": len(vulnerabilities),
        "analysis": ai_result.get("analysis", {})
    }