def cvss_to_score(cvss):
    """Convert CVSS to weighted score."""

    if cvss >= 9:
        return 60
    elif cvss >= 7:
        return 45
    elif cvss >= 4:
        return 25
    else:
        return 10


def port_bonus(open_ports):
    """Bonus based on number of open ports."""

    if open_ports >= 7:
        return 15
    elif open_ports >= 4:
        return 10
    elif open_ports >= 1:
        return 5
    return 0


def criticality_bonus(level):
    """Bonus based on asset criticality."""

    mapping = {
        "Low": 5,
        "Medium": 10,
        "High": 20
    }

    return mapping.get(level, 0)


def risk_level(score):
    """Convert numeric score to risk level."""

    if score >= 81:
        return "Critical"
    elif score >= 61:
        return "High"
    elif score >= 31:
        return "Medium"
    else:
        return "Low"