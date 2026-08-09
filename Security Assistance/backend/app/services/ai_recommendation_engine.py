"""
TrustGrid AI — Explainable AI Recommendation Engine
=====================================================
Produces context-aware, explainable recommendations using a weighted
multi-factor scoring model over local vulnerability and asset telemetry.

Score formula (0–100, normalized):
    30%  CVSS severity
    20%  Exploitability  (EPSS + exploit_status)
    20%  Asset Criticality
    15%  Network Exposure (service exposure profile)
    10%  Vulnerability Density (per-host vuln count)
     5%  Threat Intelligence (MITRE ATT&CK / CISA KEV)

Risk level bands:
    75–100  Critical
    50–74   High
    25–49   Medium
     0–24   Low

NOTE: All intelligence is LOCAL (threat_intelligence.py database).
No live external APIs are queried.
"""

from app.services.threat_intelligence import THREAT_DATABASE

# ---------------------------------------------------------------------------
# Configurable scoring weights (sum must equal 1.0)
# ---------------------------------------------------------------------------
SCORE_WEIGHTS = {
    "cvss":                0.30,
    "exploitability":      0.20,
    "asset_criticality":   0.20,
    "network_exposure":    0.15,
    "vulnerability_density": 0.10,
    "threat_intelligence": 0.05,
}

# Services considered "externally exposed" (i.e., internet-reachable)
EXPOSED_SERVICES = {"telnet", "ftp", "http", "microsoft-ds", "rdp", "msrpc"}

# Compliance catalog per service
COMPLIANCE_CATALOG = {
    "microsoft-ds": {
        "cis":   "CIS Control 4.1 — Disable Unnecessary Services",
        "nist":  "NIST SP 800-53 AC-3 / SC-7 (Boundary Protection)",
        "owasp": "A05:2021 — Security Misconfiguration",
    },
    "telnet": {
        "cis":   "CIS Control 9.2 — Ensure Encrypted Protocols Are Used",
        "nist":  "NIST SP 800-53 IA-5 / SC-8 (Transmission Confidentiality)",
        "owasp": "A02:2021 — Cryptographic Failures",
    },
    "ftp": {
        "cis":   "CIS Control 9.2 — Use Secure File Transfer Protocols",
        "nist":  "NIST SP 800-53 SC-8 (Transmission Integrity)",
        "owasp": "A02:2021 — Cryptographic Failures",
    },
    "http": {
        "cis":   "CIS Control 9.3 — Ensure HTTPS Is Enforced",
        "nist":  "NIST SP 800-53 SC-8 / SC-13 (Cryptographic Protection)",
        "owasp": "A05:2021 — Security Misconfiguration",
    },
    "https": {
        "cis":   "CIS Control 9.3 — Enforce TLS 1.2+ Configuration",
        "nist":  "NIST SP 800-53 SC-8 / SC-13",
        "owasp": "A02:2021 — Cryptographic Failures",
    },
    "rdp": {
        "cis":   "CIS Control 12.4 — Enforce Remote Access NLA",
        "nist":  "NIST SP 800-53 AC-17 (Remote Access)",
        "owasp": "A07:2021 — Identification and Authentication Failures",
    },
    "msrpc": {
        "cis":   "CIS Control 4.4 — Restrict RPC Services",
        "nist":  "NIST SP 800-53 AC-4 (Information Flow Enforcement)",
        "owasp": "A05:2021 — Security Misconfiguration",
    },
    "ssh": {
        "cis":   "CIS Control 4.5 — Use Approved Cryptographic Algorithms",
        "nist":  "NIST SP 800-53 SC-8 / IA-5",
        "owasp": "A02:2021 — Cryptographic Failures",
    },
}

_DEFAULT_COMPLIANCE = {
    "cis":   "CIS Control 7.1 — Vulnerability Management",
    "nist":  "NIST SP 800-53 SI-2 (Flaw Remediation)",
    "owasp": "A06:2021 — Vulnerable and Outdated Components",
}

# Remediation scripts per service (PowerShell + Bash)
# Labeled with safety disclaimer — NOT to be executed automatically
REMEDIATION_SCRIPTS = {
    "microsoft-ds": {
        "powershell": (
            "# Suggested remediation — review before execution.\n"
            "Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force\n"
            "New-NetFirewallRule -Name 'Block-SMB-445' -DisplayName 'Block SMB Port 445' "
            "-Direction Inbound -LocalPort 445 -Protocol TCP -Action Block"
        ),
        "bash": (
            "# Suggested remediation — review before execution.\n"
            "sudo ufw deny 445/tcp\n"
            "sudo systemctl disable smbd\n"
            "sudo systemctl stop smbd"
        ),
        "verify_powershell": "Get-SmbServerConfiguration | Select EnableSMB1Protocol",
        "verify_bash":       "systemctl status smbd",
    },
    "telnet": {
        "powershell": (
            "# Suggested remediation — review before execution.\n"
            "Stop-Service -Name 'TlntSvr' -Force\n"
            "Set-Service -Name 'TlntSvr' -StartupType Disabled"
        ),
        "bash": (
            "# Suggested remediation — review before execution.\n"
            "sudo systemctl stop telnet\n"
            "sudo systemctl disable telnet\n"
            "sudo ufw deny 23/tcp"
        ),
        "verify_powershell": "Get-Service TlntSvr | Select Status,StartType",
        "verify_bash":       "systemctl is-active telnet && ss -tlnp | grep :23",
    },
    "ftp": {
        "powershell": (
            "# Suggested remediation — review before execution.\n"
            "Stop-Service -Name 'ftpsvc' -Force\n"
            "Set-Service -Name 'ftpsvc' -StartupType Disabled"
        ),
        "bash": (
            "# Suggested remediation — review before execution.\n"
            "sudo systemctl stop vsftpd\n"
            "sudo systemctl disable vsftpd\n"
            "sudo ufw deny 21/tcp"
        ),
        "verify_powershell": "Get-Service ftpsvc | Select Status,StartType",
        "verify_bash":       "systemctl is-active vsftpd && ss -tlnp | grep :21",
    },
    "http": {
        "powershell": (
            "# Suggested remediation — review before execution.\n"
            "# Enforce HTTPS redirect in IIS\n"
            "Import-Module WebAdministration\n"
            "Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' "
            "-Name 'enabled' -Value 'true'"
        ),
        "bash": (
            "# Suggested remediation — review before execution.\n"
            "sudo a2enmod ssl\n"
            "sudo a2enmod rewrite\n"
            "sudo systemctl restart apache2"
        ),
        "verify_powershell": "Get-WebConfiguration '/system.webServer/httpRedirect'",
        "verify_bash":       "curl -I http://localhost | grep -i location",
    },
    "rdp": {
        "powershell": (
            "# Suggested remediation — review before execution.\n"
            "(Get-WmiObject -Class Win32_TSGeneralSetting "
            "-Namespace 'root\\cimv2\\terminalservices').SetUserAuthenticationRequired(1)"
        ),
        "bash": (
            "# Suggested remediation — review before execution.\n"
            "sudo ufw deny 3389/tcp"
        ),
        "verify_powershell": "Get-WmiObject -Class Win32_TSGeneralSetting | Select UserAuthenticationRequired",
        "verify_bash":       "ss -tlnp | grep :3389",
    },
    "msrpc": {
        "powershell": (
            "# Suggested remediation — review before execution.\n"
            "New-NetFirewallRule -Name 'Block-MSRPC-135' "
            "-DisplayName 'Restrict MSRPC 135' -Direction Inbound "
            "-LocalPort 135 -Protocol TCP -Action Block"
        ),
        "bash": (
            "# Suggested remediation — review before execution.\n"
            "sudo ufw deny 135/tcp"
        ),
        "verify_powershell": "Get-NetFirewallRule -Name 'Block-MSRPC-135' | Select Enabled",
        "verify_bash":       "ss -tlnp | grep :135",
    },
    "ssh": {
        "powershell": (
            "# Suggested remediation — review before execution.\n"
            "# Review OpenSSH config for weak cipher suites"
        ),
        "bash": (
            "# Suggested remediation — review before execution.\n"
            "# Edit /etc/ssh/sshd_config:\n"
            "# Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com\n"
            "# PermitRootLogin no\n"
            "sudo systemctl restart sshd"
        ),
        "verify_powershell": "ssh -Q cipher",
        "verify_bash":       "sshd -T | grep -E 'ciphers|permitrootlogin'",
    },
}


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------

def _cvss_to_100(cvss: float) -> float:
    """Normalize CVSS 0–10 to 0–100."""
    return min(100.0, max(0.0, cvss * 10.0))


def _exploitability_score(epss: float, exploit_status: str) -> float:
    """
    Combine EPSS (0–1) and exploit_status string into 0–100 score.
    Known-exploited / CISA KEV = +30 bonus, capped at 100.
    """
    base = epss * 70.0  # EPSS contributes up to 70
    bonus = 0.0
    status_lower = exploit_status.lower()
    if "known exploited" in status_lower or "cisa kev" in status_lower:
        bonus = 30.0
    elif "public exploit" in status_lower or "proof of concept" in status_lower:
        bonus = 15.0
    elif "potential" in status_lower or "active" in status_lower:
        bonus = 8.0
    return min(100.0, base + bonus)


def _criticality_to_100(criticality: str) -> float:
    """Convert asset criticality label to 0–100."""
    return {
        "Critical": 100.0,
        "High":     75.0,
        "Medium":   50.0,
        "Low":      25.0,
    }.get(criticality, 25.0)


def _exposure_score(service: str) -> float:
    """Network exposure score: externally-facing services score higher."""
    exposure_map = {
        "telnet":       100.0,
        "ftp":          90.0,
        "microsoft-ds": 90.0,
        "rdp":          85.0,
        "msrpc":        80.0,
        "http":         70.0,
        "https":        50.0,
        "ssh":          45.0,
        "dns":          35.0,
    }
    return exposure_map.get(service.lower(), 30.0)


def _density_score(vuln_count: int) -> float:
    """Higher vulnerability density per host = higher score (0–100)."""
    if vuln_count >= 6:
        return 100.0
    if vuln_count >= 4:
        return 80.0
    if vuln_count >= 3:
        return 65.0
    if vuln_count >= 2:
        return 50.0
    return 25.0


def _threat_intel_score(service: str) -> float:
    """Score from local threat intelligence database (MITRE / CISA KEV status)."""
    intel = THREAT_DATABASE.get(service, {})
    status = intel.get("exploit_status", "").lower()
    if "cisa kev" in status or "known exploited in wild" in status:
        return 100.0
    if "public exploit" in status:
        return 75.0
    if "proof of concept" in status:
        return 50.0
    if "active" in status:
        return 40.0
    return 15.0


def _risk_level(score: float) -> str:
    if score >= 75:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Medium"
    return "Low"


def _priority_from_score(score: float, severity: str) -> str:
    if score >= 75 or severity == "Critical":
        return "P1"
    if score >= 50 or severity == "High":
        return "P2"
    if score >= 25 or severity == "Medium":
        return "P3"
    return "P4"


# ---------------------------------------------------------------------------
# Explanation generator
# ---------------------------------------------------------------------------

def _generate_explanation(
    vuln: dict,
    factors: dict,
    risk_score: float,
    risk_level: str,
    asset_criticality: str,
) -> dict:
    """
    Build human-readable 'why_this_matters' and 'why_prioritized' from factor scores.
    Also populate business_impact and technical_impact.
    """
    service = vuln.get("service", "unknown")
    cve = vuln.get("cve", "")
    mitre = vuln.get("mitre_attack", "")
    exploit_status = vuln.get("exploit_status", "")
    cvss = vuln.get("cvss", 0.0)
    epss = vuln.get("epss_score", 0.0)

    reasons = []
    if factors["cvss"] >= 80:
        reasons.append(f"CVSS score {cvss:.1f} indicates a high-severity vulnerability")
    if factors["exploitability"] >= 70:
        reasons.append(f"Exploitation is {exploit_status.lower()} (EPSS: {epss*100:.0f}%)")
    if factors["asset_criticality"] >= 75:
        reasons.append(f"The affected asset has {asset_criticality} business criticality")
    if factors["network_exposure"] >= 70:
        reasons.append(f"The service ({service.upper()}) is externally network-exposed")
    if factors["vulnerability_density"] >= 50:
        reasons.append("Multiple vulnerabilities co-exist on the same host")
    if factors["threat_intelligence"] >= 75:
        reasons.append("Listed in local threat intelligence as a known high-risk vector")

    why_matters = (
        f"This vulnerability ({vuln.get('vulnerability', vuln.get('issue', ''))}) "
        f"carries a context-aware risk score of {risk_score:.0f}/100 ({risk_level}). "
    )
    if cve:
        why_matters += f"It is tracked under {cve}"
        if mitre:
            why_matters += f" and maps to MITRE ATT&CK {mitre}."
        else:
            why_matters += "."
    if reasons:
        why_matters += " Key risk factors: " + "; ".join(reasons) + "."

    why_prioritized = (
        f"Prioritized as {_priority_from_score(risk_score, vuln.get('severity',''))} because: "
        + ", ".join(reasons[:3]) + "." if reasons else
        f"Assigned based on CVSS {cvss:.1f} and severity {vuln.get('severity', 'Unknown')}."
    )

    # Service-specific impact language
    service_impacts = {
        "microsoft-ds": (
            "Allows ransomware lateral movement across all Windows hosts (EternalBlue / WannaCry vector).",
            "Remote unauthenticated code execution on SMB port 445. Full system compromise possible."
        ),
        "telnet": (
            "Credentials intercepted in cleartext, enabling full account takeover.",
            "Network traffic sniffing captures usernames and passwords in plaintext."
        ),
        "ftp": (
            "Sensitive data exfiltration and unauthorized access to file shares.",
            "Anonymous FTP login possible; file upload/download without authentication."
        ),
        "rdp": (
            "Remote desktop session hijack or ransomware deployment via BlueKeep.",
            "Unauthenticated RCE on RDP; allows persistent attacker foothold."
        ),
        "msrpc": (
            "Remote code execution via RPC exploits leading to domain controller compromise.",
            "Windows RPC endpoint enumeration and privilege escalation vectors."
        ),
        "http": (
            "Sensitive data transmitted in cleartext; path traversal risk.",
            "Web application attack surface via unencrypted HTTP and outdated server versions."
        ),
        "https": (
            "TLS downgrade attacks may expose encrypted traffic.",
            "Weak cipher suites allow man-in-the-middle interception."
        ),
        "ssh": (
            "Weak SSH configuration enables brute-force or PKCS#11 exploit attacks.",
            "Outdated OpenSSH with weak cipher suites; root login may be permitted."
        ),
    }
    business_impact, technical_impact = service_impacts.get(
        service,
        (
            "Potential data breach, service disruption, or compliance violation.",
            "Service may be exploited to gain unauthorized access or execute arbitrary code."
        )
    )

    return {
        "why_this_matters":  why_matters,
        "why_prioritized":   why_prioritized,
        "business_impact":   business_impact,
        "technical_impact":  technical_impact,
        "reasoning_points":  reasons,
    }


# ---------------------------------------------------------------------------
# Main scoring and recommendation builder
# ---------------------------------------------------------------------------

def score_vulnerability(vuln: dict, asset_criticality: str, vuln_count_on_host: int) -> dict:
    """
    Compute weighted risk score for a single enriched vulnerability.
    Returns factor scores (each 0-100) and combined normalized score.
    """
    service = vuln.get("service", "")
    cvss    = vuln.get("cvss", 0.0)
    epss    = vuln.get("epss_score", 0.10)
    exploit = vuln.get("exploit_status", "")

    f_cvss        = _cvss_to_100(cvss)
    f_exploit     = _exploitability_score(epss, exploit)
    f_criticality = _criticality_to_100(asset_criticality)
    f_exposure    = _exposure_score(service)
    f_density     = _density_score(vuln_count_on_host)
    f_threat_intel = _threat_intel_score(service)

    w = SCORE_WEIGHTS
    combined = (
        w["cvss"]                 * f_cvss
        + w["exploitability"]     * f_exploit
        + w["asset_criticality"]  * f_criticality
        + w["network_exposure"]   * f_exposure
        + w["vulnerability_density"] * f_density
        + w["threat_intelligence"] * f_threat_intel
    )
    combined = min(100.0, round(combined, 1))

    return {
        "risk_score":  combined,
        "risk_level":  _risk_level(combined),
        "risk_factors": {
            "cvss":                 round(f_cvss, 1),
            "exploitability":       round(f_exploit, 1),
            "asset_criticality":    round(f_criticality, 1),
            "network_exposure":     round(f_exposure, 1),
            "vulnerability_density": round(f_density, 1),
            "threat_intelligence":  round(f_threat_intel, 1),
        },
    }


def generate_ai_recommendations(vulnerabilities: list, assets: list) -> list:
    """
    Consume enriched vulnerabilities (output of vulnerability_engine + threat_intelligence)
    and produce explainable AI recommendations.

    Args:
        vulnerabilities: List of enriched vulnerability dicts from existing pipeline.
        assets:          List of classified asset dicts from existing pipeline.

    Returns:
        List of recommendation dicts sorted P1 → P4.
    """
    if not vulnerabilities:
        return []

    # Build IP → asset criticality map
    criticality_map = {a.get("ip"): a.get("criticality", "Low") for a in assets}

    # Build IP → vuln count map (for density scoring)
    density_map: dict = {}
    for v in vulnerabilities:
        ip = v.get("ip", "")
        density_map[ip] = density_map.get(ip, 0) + 1

    recommendations = []

    for vuln in vulnerabilities:
        ip               = vuln.get("ip", "")
        service          = vuln.get("service", "")
        asset_criticality = criticality_map.get(ip, "Low")
        vuln_count       = density_map.get(ip, 1)

        # --- Scoring ---
        scored = score_vulnerability(vuln, asset_criticality, vuln_count)
        risk_score  = scored["risk_score"]
        risk_level  = scored["risk_level"]
        risk_factors = scored["risk_factors"]
        priority    = _priority_from_score(risk_score, vuln.get("severity", ""))

        # --- Explanation ---
        explanation = _generate_explanation(
            vuln, risk_factors, risk_score, risk_level, asset_criticality
        )

        # --- Compliance ---
        comp = COMPLIANCE_CATALOG.get(service, _DEFAULT_COMPLIANCE)
        compliance = {
            "cis_control":  comp["cis"],
            "nist_800_53":  comp["nist"],
            "owasp_top_10": comp["owasp"],
        }

        # --- Threat intel enrichment ---
        intel = THREAT_DATABASE.get(service, {})
        cve         = vuln.get("cve") or intel.get("cve", "N/A")
        mitre       = vuln.get("mitre_attack") or intel.get("mitre_attack", "T1190")
        attack_name = intel.get("attack_name", "Exploit Public-Facing Application")

        # --- Remediation scripts ---
        scripts   = REMEDIATION_SCRIPTS.get(service, {})
        ps_script = scripts.get("powershell", "# No specific PowerShell remediation available.")
        bash_script = scripts.get("bash", "# No specific Bash remediation available.")
        verify_ps   = scripts.get("verify_powershell", "")
        verify_bash = scripts.get("verify_bash", "")

        # Build verification steps list
        verification_steps = []
        if verify_ps:
            verification_steps.append(f"Windows: {verify_ps}")
        if verify_bash:
            verification_steps.append(f"Linux:   {verify_bash}")
        verification_steps.append("Confirm service is no longer reachable from untrusted networks.")

        # Recommended actions (from vulnerability engine or default)
        rec_actions = vuln.get("ai_suggestions") or [
            vuln.get("recommendation", "Apply vendor security patch immediately."),
            f"Restrict access to port {vuln.get('port', '')} via host firewall.",
            "Enforce zero-trust network segmentation.",
        ]

        recommendations.append({
            # Core identity
            "ip":           ip,
            "hostname":     vuln.get("hostname", ip),
            "service":      service,
            "port":         vuln.get("port"),
            "issue":        vuln.get("vulnerability", vuln.get("issue", "Unknown")),
            "category":     vuln.get("category", "Security Misconfiguration"),
            "severity":     vuln.get("severity", "Medium"),
            "cvss":         vuln.get("cvss", 0.0),
            "cve":          cve,
            "mitre_attack": mitre,
            "attack_name":  attack_name,
            "epss_score":   vuln.get("epss_score", 0.0),
            "exploit_status": vuln.get("exploit_status", "Unknown"),

            # AI scoring
            "priority":     priority,
            "risk_score":   risk_score,
            "risk_level":   risk_level,
            "risk_factors": risk_factors,

            # Explanations
            "why_this_matters":   explanation["why_this_matters"],
            "why_prioritized":    explanation["why_prioritized"],
            "reasoning_points":   explanation["reasoning_points"],
            "business_impact":    explanation["business_impact"],
            "technical_impact":   explanation["technical_impact"],

            # Actions
            "recommended_actions":  rec_actions,
            "mitigation":           vuln.get("recommendation", rec_actions[0] if rec_actions else ""),
            "verification_steps":   verification_steps,

            # Compliance
            "compliance":           compliance,

            # Remediation scripts
            "script_fix_powershell": ps_script,
            "script_fix_bash":       bash_script,

            # Legacy compatibility fields
            "detected_version":  vuln.get("detected_version", ""),
            "ai_suggests":       rec_actions,
            "security_category": "Network & Infrastructure Security",

            # Metadata label
            "intelligence_source": "Local Threat Intelligence (TrustGrid AI)",
        })

    # Sort P1 → P2 → P3 → P4, then by risk_score descending within each tier
    priority_order = {"P1": 1, "P2": 2, "P3": 3, "P4": 4}
    recommendations.sort(
        key=lambda x: (priority_order.get(x["priority"], 99), -x["risk_score"])
    )
    return recommendations
