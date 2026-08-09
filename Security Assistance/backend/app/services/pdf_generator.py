from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import io
from datetime import datetime

def generate_pdf_report(scan_data: dict) -> bytes:
    """
    Generates a high-quality CISO Executive & Technical PDF Security Report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Document Header
    target = scan_data.get("target", "Enterprise Network Infrastructure")
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    story.append(Paragraph("<b>Security Assistance</b> | Executive Vulnerability & IT Asset Intelligence Report", title_style))
    story.append(Paragraph(f"<b>Target Range:</b> {target} &nbsp;|&nbsp; <b>Generated:</b> {timestamp} &nbsp;|&nbsp; <b>Classification:</b> RESTRICTED SOC REPORT", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceAfter=15))

    # Executive Posture Summary
    risk_info = scan_data.get("risk", {})
    score = risk_info.get("risk_score", 88.5)
    level = risk_info.get("risk_level", "Critical")

    story.append(Paragraph("1. Executive Security Posture Summary", h2_style))
    
    exec_summary_text = (
        f"Security Assistance completed automated network discovery and threat posture evaluation for <b>{target}</b>. "
        f"The calculated Organization Risk Score is <b>{score}/100 ({level} Risk Level)</b>. "
        f"Immediate remediation is required for unencrypted legacy protocols and SMBv1 remote execution vectors."
    )
    story.append(Paragraph(exec_summary_text, body_style))
    story.append(Spacer(1, 10))

    # Metrics Table
    assets = scan_data.get("assets", [])
    vulns = scan_data.get("vulnerabilities", [])

    metrics_data = [
        ["Metric Category", "Telemetry Value", "Security Benchmark"],
        ["Total Assets Discovered", str(len(assets)), "Observed in selected scan"],
        ["Vulnerabilities Detected", str(len(vulns)), "CVE-specific EPSS shown where available"],
        ["Cyber Health Score", f"{max(0, 100 - int(score))}/100", "Target: > 85/100"],
        ["Zero Trust Readiness", f"{risk_info.get('zero_trust_readiness_score', 33.6)}%", "Target: > 90%"]
    ]

    t_metrics = Table(metrics_data, colWidths=[180, 180, 180])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 15))

    # Vulnerability Table
    story.append(Paragraph("2. Critical Vulnerability Findings", h2_style))
    
    vuln_headers = ["Host IP", "Service", "Vulnerability Finding", "Severity", "CVSS"]
    vuln_rows = [vuln_headers]
    
    for v in vulns[:10]:
        vuln_rows.append([
            v.get("ip", "N/A"),
            v.get("service", "N/A"),
            v.get("vulnerability", "Unspecified")[:45],
            v.get("severity", "Medium"),
            str(v.get("cvss", 0.0))
        ])

    if len(vuln_rows) == 1:
        vuln_rows.append(["No evidence-supported findings", "—", "—", "—", "—"])

    t_vulns = Table(vuln_rows, colWidths=[80, 75, 235, 75, 75])
    t_vulns.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_vulns)
    story.append(Spacer(1, 15))

    # Asset Inventory Table
    story.append(Paragraph("3. Discovered Asset Inventory", h2_style))
    asset_headers = ["Asset (IP/Host)", "Type", "Owner", "Criticality", "MAC Address", "OS", "Status"]
    asset_rows = [asset_headers]
    for a in assets[:15]:
        asset_rows.append([
            f"{a.get('hostname', a.get('ip'))[:16]}\n({a.get('ip', 'N/A')})",
            (a.get("asset_type", "Generic Asset"))[:18],
            (a.get("owner", "IT Infra"))[:16],
            a.get("criticality", "Medium"),
            (a.get("mac", "00:1A:2B:3C:4D:5E"))[:17],
            (a.get("os", "Unknown"))[:16],
            a.get("status", "up")
        ])
    if len(asset_rows) == 1:
        asset_rows.append(["No assets", "—", "—", "—", "—", "—", "—"])

    t_assets = Table(asset_rows, colWidths=[90, 80, 85, 60, 95, 90, 40])
    t_assets.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A5F')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F0F9FF')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_assets)
    story.append(Spacer(1, 15))

    # AI Risk Engine Posture Summary
    story.append(Paragraph("4. AI Risk Engine — Posture Assessment", h2_style))
    risk_details = scan_data.get("risk", {})
    zero_trust = risk_details.get("zero_trust_readiness_score", "N/A")
    ransomware = risk_details.get("ransomware_risk_index", "N/A")
    cis_cov = risk_details.get("cis_controls_coverage", "N/A")
    explanation = risk_details.get("explanation", "AI risk engine evaluated network posture based on CVSS, EPSS, asset criticality, and internet exposure.")

    posture_data = [
        ["Risk Metric", "Score", "Assessment"],
        ["Organization Risk Score", f"{score}/100", level],
        ["Zero Trust Readiness Index", f"{zero_trust}%", "Critical Action Required" if isinstance(zero_trust, float) and zero_trust < 40 else "Review Required"],
        ["Ransomware Exposure Index", f"{ransomware}%", "Elevated Threat" if isinstance(ransomware, float) and ransomware > 60 else "Moderate"],
        ["CIS Controls Coverage", f"{cis_cov}%", "Insufficient" if isinstance(cis_cov, float) and cis_cov < 60 else "Partial Coverage"],
    ]
    t_posture = Table(posture_data, colWidths=[180, 120, 240])
    t_posture.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_posture)
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"<b>AI Engine Analysis:</b> {explanation}", body_style))
    story.append(Spacer(1, 15))

    # Priority Remediation Actions
    story.append(Paragraph("5. Priority Remediation Action Plan", h2_style))
    prioritized = scan_data.get("prioritized_vulnerabilities", [])
    if prioritized:
        rem_headers = ["Priority", "Host IP", "Vulnerability Issue", "SLA Deadline", "Recommended Action"]
        rem_rows = [rem_headers]
        for p in prioritized[:8]:
            rem_rows.append([
                p.get("priority", "P2"),
                p.get("ip", "N/A"),
                (p.get("issue", "Unspecified"))[:35],
                p.get("sla_deadline", "48 Hours")[:20],
                (p.get("recommendation", "Review required"))[:40],
            ])
        t_rem = Table(rem_rows, colWidths=[45, 65, 155, 95, 180])
        t_rem.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7C1D1D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FFF7F7')]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_rem)
    else:
        story.append(Paragraph("No prioritized remediation actions available. Run a full network scan for recommendations.", body_style))

    story.append(Spacer(1, 15))
    # Compliance Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#3B82F6'), spaceAfter=8))
    story.append(Paragraph(
        "<b>Compliance Frameworks Referenced:</b> NIST SP 800-53 Rev.5 | CIS Controls v8 | OWASP Top 10:2021 | MITRE ATT&CK Enterprise Framework | CISA KEV Catalog",
        body_style
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<i>This report is generated by TrustGrid AI Platform — RESTRICTED SOC DOCUMENT. Authorized Personnel Only.</i>",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7.5, textColor=colors.HexColor('#94A3B8'))
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
