def generate_recommendations(vulnerabilities):
    """
    AI Remediation Advisor generating actionable mitigation strategies, 
    Compliance Standard mappings (NIST, CIS, OWASP), and automated CLI patch scripts.
    """
    recommendations = []

    priority_map = {
        "Critical": "P1",
        "High": "P2",
        "Medium": "P3",
        "Low": "P4"
    }

    compliance_catalog = {
        "microsoft-ds": {
            "nist": "NIST SP 800-53 AC-3 / SC-7 (Boundary Protection)",
            "cis": "CIS Control 4.1 (Disable Unnecessary Services)",
            "owasp": "A05:2021-Security Misconfiguration",
            "ps": "Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force; New-NetFirewallRule -Name 'Block-SMB-Inbound' -DisplayName 'Block SMB Port 445' -Direction Inbound -LocalPort 445 -Protocol TCP -Action Block",
            "bash": "sudo ufw deny 445/tcp && sudo systemctl disable smbd"
        },
        "telnet": {
            "nist": "NIST SP 800-53 IA-5 / SC-8 (Transmission Confidentiality)",
            "cis": "CIS Control 9.2 (Ensure Encrypted Protocols Are Used)",
            "owasp": "A02:2021-Cryptographic Failures",
            "ps": "Stop-Service -Name 'TlntSvr' -Force; Set-Service -Name 'TlntSvr' -StartupType Disabled",
            "bash": "sudo systemctl stop telnetd && sudo systemctl disable telnetd && sudo ufw deny 23/tcp"
        },
        "ftp": {
            "nist": "NIST SP 800-53 SC-8 (Transmission Integrity)",
            "cis": "CIS Control 9.2 (Use Secure File Transfer Protocols)",
            "owasp": "A02:2021-Cryptographic Failures",
            "ps": "Stop-Service -Name 'ftpsvc' -Force; Set-Service -Name 'ftpsvc' -StartupType Disabled",
            "bash": "sudo systemctl stop vsftpd && sudo systemctl disable vsftpd && sudo ufw deny 21/tcp"
        },
        "http": {
            "nist": "NIST SP 800-53 SC-8 / SC-13 (Cryptographic Protection)",
            "cis": "CIS Control 9.3 (Ensure HTTPS Is Enforced)",
            "owasp": "A05:2021-Security Misconfiguration",
            "ps": "# Enforce IIS HTTPS Redirect\nImport-Module WebAdministration; Set-WebConfigurationProperty -Filter '/system.webServer/httpRedirect' -Name 'enabled' -Value 'true'",
            "bash": "sudo a2enmod ssl && sudo a2enmod rewrite && sudo systemctl restart apache2"
        },
        "msrpc": {
            "nist": "NIST SP 800-53 AC-4 (Information Flow Enforcement)",
            "cis": "CIS Control 4.4 (Restrict RPC Services)",
            "owasp": "A05:2021-Security Misconfiguration",
            "ps": "New-NetFirewallRule -Name 'Block-MSRPC-135' -DisplayName 'Restrict MSRPC 135' -Direction Inbound -LocalPort 135 -Protocol TCP -Action Block",
            "bash": "sudo ufw deny 135/tcp"
        },
        "rdp": {
            "nist": "NIST SP 800-53 AC-17 (Remote Access)",
            "cis": "CIS Control 12.4 (Enforce Remote Access NLA)",
            "owasp": "A07:2021-Identification and Authentication Failures",
            "ps": "(Get-WmiObject -class 'Win32_TSGeneralSetting' -Namespace 'root\\cimv2\\terminalservices').SetUserAuthenticationRequired(1)",
            "bash": "sudo ufw deny 3389/tcp"
        }
    }

    for vuln in vulnerabilities:
        srv = vuln.get("service", "").lower()
        comp = compliance_catalog.get(srv, {
            "nist": "NIST SP 800-53 SI-2 (Flaw Remediation)",
            "cis": "CIS Control 7.1 (Vulnerability Management)",
            "owasp": "A06:2021-Vulnerable and Outdated Components",
            "ps": "# Generic Windows mitigation: Review service binding and firewall rules",
            "bash": f"# Generic Linux mitigation: sudo ufw deny {vuln.get('port', 80)}/tcp"
        })

        detected = vuln.get("detected_version") or f"{srv.upper()} Service Exposed"
        ai_suggests = vuln.get("ai_suggestions") or [
            vuln.get("recommendation", "Apply security patch"),
            f"Restrict access to port {vuln.get('port', 80)} via host firewall",
            "Enforce zero trust network segmentation"
        ]

        recommendation = {
            "ip": vuln["ip"],
            "hostname": vuln.get("hostname", vuln["ip"]),
            "issue": vuln["vulnerability"],
            "severity": vuln["severity"],
            "cvss": vuln["cvss"],
            "priority": priority_map.get(vuln["severity"], "P4"),
            "security_category": "Network & Infrastructure Security",
            "detected_version": detected,
            "ai_suggests": ai_suggests,
            "recommended_actions": ai_suggests,
            "compliance": {
                "nist_800_53": comp["nist"],
                "cis_control": comp["cis"],
                "owasp_top_10": comp["owasp"]
            },
            "script_fix_powershell": comp["ps"],
            "script_fix_bash": comp["bash"]
        }

        recommendations.append(recommendation)

    # Sort P1 -> P2 -> P3 -> P4
    priority_order = {"P1": 1, "P2": 2, "P3": 3, "P4": 4}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 99))

    return recommendations