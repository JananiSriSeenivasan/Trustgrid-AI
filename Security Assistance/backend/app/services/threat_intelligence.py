"""Small, versioned local threat-intelligence snapshot.

It enriches only findings that already carry a specific CVE.  It must not turn
an open port into an arbitrary CVE assignment.
"""

from __future__ import annotations

from typing import Any


LOCAL_CVE_SNAPSHOT = {
    "CVE-2021-41773": {
        "mitre_attack": "T1190",
        "attack_name": "Exploit Public-Facing Application",
        "exploit_status": "Version-correlated; configuration validation required",
        "epss_score": 0.89,
        "cwe": "CWE-22",
        "source": "Local curated snapshot — refresh before production use",
    },
}

# Compatibility export for the existing assistant/recommendation modules. New
# code should use CVE-keyed LOCAL_CVE_SNAPSHOT rather than service-to-CVE maps.
THREAT_DATABASE: dict[str, dict[str, Any]] = {}


def enrich_with_threat_intelligence(vulnerabilities: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Add local CVE metadata while preserving evidence and uncertainty."""
    enriched: list[dict[str, Any]] = []
    for vulnerability in vulnerabilities:
        cve = vulnerability.get("cve")
        intel = LOCAL_CVE_SNAPSHOT.get(cve, {}) if cve else {}
        enriched.append(
            {
                **vulnerability,
                "mitre_attack": intel.get("mitre_attack", vulnerability.get("mitre_attack", "T1190")),
                "attack_name": intel.get("attack_name", vulnerability.get("attack_name", "Network Exposure")),
                "exploit_status": intel.get("exploit_status", vulnerability.get("exploit_status", "Assessment required")),
                "epss_score": intel.get("epss_score", 0.0),
                "cwe": intel.get("cwe", vulnerability.get("cwe")),
                "threat_intelligence_source": intel.get("source", "No CVE-specific local intelligence available"),
            }
        )
    return enriched
