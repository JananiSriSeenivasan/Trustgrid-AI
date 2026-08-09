"""Local, evidence-grounded security assistant.

It is deliberately not presented as an LLM or external RAG service. Answers
are generated from the latest stored assessment and local remediation logic.
"""

from __future__ import annotations

import re
from typing import Any

from app.database.mongodb import scan_collection
from app.services.ai_recommendation_engine import generate_ai_recommendations
from app.services.priority_engine import calculate_priority
from app.services.threat_intelligence import LOCAL_CVE_SNAPSHOT


def _latest_scan() -> dict[str, Any]:
    return scan_collection.find_one(sort=[("timestamp", -1)]) or {}


def _asset_for_question(question: str, assets: list[dict[str, Any]]) -> dict[str, Any] | None:
    for asset in assets:
        if asset.get("ip", "").lower() in question:
            return asset
        hostname = asset.get("hostname", "").lower()
        if hostname and hostname in question:
            return asset
    return None


def _related_for_asset(asset: dict[str, Any] | None, findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not asset:
        return findings[:3]
    return [finding for finding in findings if finding.get("ip") == asset.get("ip")][:5]


def _response(answer: str, intent: str, assets: list[dict[str, Any]], findings: list[dict[str, Any]], actions: list[str]) -> dict[str, Any]:
    return {
        "answer": answer,
        "intent": intent,
        "sources": ["latest scan data", "local remediation catalogue"],
        "related_assets": assets[:3],
        "related_vulnerabilities": findings[:5],
        "recommended_actions": actions[:4],
    }


def process_security_question(message: str) -> dict[str, Any]:
    question = message.lower().strip()
    scan = _latest_scan()
    if not scan:
        return _response("No assessment is stored yet. Run a demo or authorised live scan first.", "NO_DATA", [], [], [])

    assets = scan.get("assets", [])
    findings = scan.get("vulnerabilities", [])
    risk = scan.get("risk", {})
    selected_asset = _asset_for_question(question, assets)
    related_findings = _related_for_asset(selected_asset, findings)

    cve_match = re.search(r"cve-\d{4}-\d{4,7}", question)
    if cve_match:
        cve = cve_match.group(0).upper()
        matching = [finding for finding in findings if finding.get("cve") == cve]
        intel = LOCAL_CVE_SNAPSHOT.get(cve)
        if intel:
            answer = (
                f"{cve} appears in the local intelligence snapshot as {intel['attack_name']}. "
                f"Its local EPSS reference is {intel['epss_score'] * 100:.0f}%. "
                "A matching version is an assessment lead, not proof of exploitation; validate configuration and patches."
            )
        else:
            answer = f"{cve} is not in the bundled local intelligence snapshot. Add a current CVE feed before using it for a remediation decision."
        return _response(answer, "CVE_EXPLANATION", [selected_asset] if selected_asset else [], matching, ["Validate vendor advisory applicability.", "Confirm patch state before remediation."])

    if any(word in question for word in ["fix", "patch", "remediat", "priority", "first"]):
        recommendations = generate_ai_recommendations(findings, assets)
        top = recommendations[:3]
        actions = [recommendation.get("mitigation", "Review remediation guidance.") for recommendation in top]
        summary = "\n".join(
            f"{item.get('priority')} — {item.get('hostname', item.get('ip'))}: {item.get('issue')}" for item in top
        ) or "No remediation items are available."
        return _response(f"Highest-priority remediation items:\n{summary}", "REMEDIATION", [], [item for item in findings if item.get('ip') in {rec.get('ip') for rec in top}], actions)

    if selected_asset:
        evidence_count = len(selected_asset.get("scan_evidence", []))
        answer = (
            f"{selected_asset.get('hostname', selected_asset.get('ip'))} is classified as "
            f"{selected_asset.get('asset_type')} with {selected_asset.get('criticality')} business criticality. "
            f"The latest assessment has {len(related_findings)} evidence-supported finding(s) and {evidence_count} recorded scan observation(s)."
        )
        return _response(answer, "ASSET_ANALYSIS", [selected_asset], related_findings, [finding.get("recommendation", "Review the finding.") for finding in related_findings])

    if any(word in question for word in ["critical", "risk", "posture", "why"]):
        top = sorted(findings, key=lambda item: item.get("cvss", 0), reverse=True)[:3]
        answer = (
            f"Latest posture: {risk.get('risk_score', 0):.1f}/100 ({risk.get('risk_level', 'Low')}). "
            f"This is an explainable screening score based on CVSS, evidence confidence, asset criticality, service exposure, and local CVE intelligence where available."
        )
        return _response(answer, "RISK_EXPLANATION", [], top, [finding.get("recommendation", "Review the finding.") for finding in top])

    if any(word in question for word in ["asset", "inventory", "host", "server"]):
        answer = f"The latest scan contains {len(assets)} asset(s) and {len(findings)} evidence-supported finding(s)."
        return _response(answer, "ASSET_INVENTORY", assets, findings[:3], [])

    priorities = calculate_priority(findings, assets)
    return _response(
        f"Security Assistance is using the latest {scan.get('scan_metadata', {}).get('mode', 'unknown')} assessment for {scan.get('target', 'the selected target')}. "
        f"Ask about an asset IP, a CVE, current risk, or what to remediate first.",
        "GENERAL",
        [],
        findings[:3],
        [item.get("recommendation", "Review the finding.") for item in priorities[:3]],
    )
