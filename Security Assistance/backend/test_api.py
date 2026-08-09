from app.main import app
from app.api.scan import start_scan
from app.api.assets import get_assets
from app.api.vulnerability import get_vulnerabilities
from app.api.risk import get_risk
from app.api.recommendation import get_recommendations
from app.api.history import list_scan_history
from app.api.dashboard import get_dashboard_stats
from app.api.reports import get_executive_report

def test_direct_pipeline():
    print("\n--- Starting Direct Pipeline Integration Test ---")
    
    # 1. Scan Endpoint
    scan_res = start_scan(target="127.0.0.1")
    print(f"[OK] start_scan('127.0.0.1') -> Success | Scan ID: {scan_res.get('scan_id')} | Target: {scan_res.get('target')}")
    assert scan_res.get("scan_id") is not None
    assert len(scan_res.get("assets", [])) > 0

    # 2. Asset Intelligence
    assets_res = get_assets(target="127.0.0.1")
    print(f"[OK] get_assets() -> Success | Total Assets: {assets_res.get('total_assets')}")
    assert assets_res.get("total_assets") > 0

    # 3. Vulnerability Detection
    vuln_res = get_vulnerabilities(target="127.0.0.1")
    print(f"[OK] get_vulnerabilities() -> Success | Discovered Vulnerabilities: {vuln_res.get('total_vulnerabilities')}")
    assert vuln_res.get("total_vulnerabilities") > 0

    # 4. Risk Assessment
    risk_res = get_risk(target="127.0.0.1")
    print(f"[OK] get_risk() -> Success | Risk Level: {risk_res.get('risk', {}).get('risk_level')} | Risk Score: {risk_res.get('risk', {}).get('risk_score')}")
    assert risk_res.get("risk", {}).get("risk_score") is not None

    # 5. Recommendation & Playbook Advisor
    recs_res = get_recommendations(target="127.0.0.1")
    print(f"[OK] get_recommendations() -> Success | Total Recommendations: {recs_res.get('total_recommendations')}")
    assert recs_res.get("total_recommendations") > 0
    sample_rec = recs_res.get("recommendations")[0]
    print(f"   - Sample Compliance (NIST): {sample_rec.get('compliance', {}).get('nist_800_53')}")
    print(f"   - Sample PowerShell Fix Script: {sample_rec.get('script_fix_powershell')[:60]}...")

    # 6. History Management
    history_res = list_scan_history()
    print(f"[OK] list_scan_history() -> Success | Recorded Scans: {history_res.get('total_scans')}")
    assert history_res.get("total_scans") >= 0

    # 7. Dashboard Telemetry
    dash_res = get_dashboard_stats()
    print(f"[OK] get_dashboard_stats() -> Success | Risk Level: {dash_res.get('overall_risk_level')} | Assets: {dash_res.get('total_assets')}")
    assert dash_res.get("overall_risk_level") is not None

    # 8. Executive Security Report
    rep_res = get_executive_report(target="127.0.0.1")
    print(f"[OK] get_executive_report() -> Success | Report Title: '{rep_res.get('report_title')}'")
    assert rep_res.get("report_title") is not None

    print("\nALL 8 PIPELINE MODULES TESTED & PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_direct_pipeline()
