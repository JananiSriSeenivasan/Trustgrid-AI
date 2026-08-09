"""Network discovery with explicit live and demo modes.

The scanner deliberately separates observed evidence from simulated telemetry.  A
port being open is useful evidence, but it is not proof that a CVE is present.
"""

from __future__ import annotations

import ipaddress
import re
import shutil
from typing import Any

from app.config import settings

try:  # The application can still run in demo mode without python-nmap installed.
    import nmap
except ImportError:  # pragma: no cover - depends on the deployment host
    nmap = None


VALID_MODES = {"demo", "live", "auto"}
HOSTNAME_RE = re.compile(r"^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$")


def validate_target(target: str) -> str:
    """Validate an IP, CIDR range, or hostname before passing it to Nmap."""
    clean = (target or "").strip()
    if not clean:
        raise ValueError("A target IP, CIDR range, or hostname is required.")

    try:
        network = ipaddress.ip_network(clean, strict=False)
        # A bounded range avoids accidentally launching an enterprise-wide scan.
        if network.num_addresses > 4096:
            raise ValueError("Live scans are limited to 4,096 addresses per request.")
        return clean
    except ValueError as network_error:
        if "/" in clean:
            raise network_error

    if not HOSTNAME_RE.fullmatch(clean):
        raise ValueError("Target must be a valid IP address, CIDR range, or hostname.")
    return clean


def _evidence(check: str, result: str, source: str = "nmap") -> dict[str, str]:
    return {"source": source, "check": check, "result": result}


def _demo_asset(
    ip: str,
    hostname: str,
    os_name: str,
    mac: str,
    ports: list[dict[str, Any]],
    evidence: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "ip": ip,
        "mac": mac,
        "hostname": hostname,
        "status": "up",
        "os": os_name,
        "ports": ports,
        "scan_evidence": evidence,
        "scan_metadata": {
            "mode": "demo",
            "source": "simulated",
            "notice": "Demo telemetry only. It was not collected from a live network.",
        },
    }


def _generate_demo_scan(target: str) -> list[dict[str, Any]]:
    """Return clearly labelled deterministic data for a presentation or offline run."""
    lowered = target.lower()
    if "server 12" in lowered or "server12" in lowered or "srv12" in lowered:
        return [
            _demo_asset(
                "192.168.1.12",
                "srv12-demo.domain.local",
                "Windows Server 2019 Datacenter",
                "00:1A:2B:99:C1:12",
                [
                    {"port": 445, "service": "microsoft-ds", "version": "SMBv1", "protocol": "tcp"},
                    {"port": 3389, "service": "ms-wbt-server", "version": "Microsoft Terminal Services", "protocol": "tcp"},
                    {"port": 443, "service": "https", "version": "Apache/2.4.18", "protocol": "tcp"},
                ],
                [
                    _evidence("smb-protocols", "SMBv1 dialect enabled", "demo-fixture"),
                    _evidence("rdp-exposure", "RDP service reachable on TCP/3389", "demo-fixture"),
                    _evidence("ssl-enum-ciphers", "TLSv1.0 cipher suite detected", "demo-fixture"),
                ],
            )
        ]

    return [
        _demo_asset(
            "10.10.10.10",
            "dc-demo-01.lab.local",
            "Windows Server 2022",
            "00:1A:2B:3C:4D:10",
            [
                {"port": 445, "service": "microsoft-ds", "version": "SMBv1", "protocol": "tcp"},
                {"port": 135, "service": "msrpc", "version": "Microsoft Windows RPC", "protocol": "tcp"},
            ],
            [_evidence("smb-protocols", "SMBv1 dialect enabled", "demo-fixture")],
        ),
        _demo_asset(
            "10.10.10.25",
            "web-demo-01.lab.local",
            "Ubuntu 22.04 LTS",
            "52:54:00:12:34:25",
            [
                {"port": 80, "service": "http", "version": "Apache/2.4.49", "protocol": "tcp"},
                {"port": 443, "service": "https", "version": "nginx/1.20.1", "protocol": "tcp"},
                {"port": 21, "service": "ftp", "version": "vsftpd 3.0.3", "protocol": "tcp"},
            ],
            [
                _evidence("ftp-anon", "Anonymous FTP login allowed", "demo-fixture"),
                _evidence("ssl-enum-ciphers", "TLSv1.0 enabled", "demo-fixture"),
            ],
        ),
        _demo_asset(
            "10.10.10.80",
            "camera-demo-01.lab.local",
            "Embedded Linux",
            "B8:27:EB:70:80:01",
            [
                {"port": 23, "service": "telnet", "version": "BusyBox telnetd", "protocol": "tcp"},
                {"port": 554, "service": "rtsp", "version": "IP camera RTSP", "protocol": "tcp"},
            ],
            [_evidence("service-discovery", "Telnet service reachable on TCP/23", "demo-fixture")],
        ),
    ]


def _script_evidence(script_data: Any, source: str = "nmap") -> list[dict[str, str]]:
    if not script_data:
        return []
    if isinstance(script_data, dict):
        return [_evidence(str(name), str(output), source) for name, output in script_data.items()]
    if isinstance(script_data, list):
        return [_evidence(str(item.get("id", "nmap-script")), str(item.get("output", "")), source) for item in script_data]
    return [_evidence("nmap-script", str(script_data), source)]


def _live_scan(target: str) -> list[dict[str, Any]]:
    nmap_bin = shutil.which("nmap") or settings.NMAP_PATH
    if not nmap or not nmap_bin:
        raise RuntimeError("Nmap and python-nmap must be installed for a live scan.")

    scanner = nmap.PortScanner(nmap_search_path=(nmap_bin,))
    scanner.scan(
        hosts=target,
        arguments="-sV -O --version-light --host-timeout 20s --top-ports 100 "
        "--script smb-protocols,ftp-anon,ssl-enum-ciphers",
    )

    assets: list[dict[str, Any]] = []
    for host in scanner.all_hosts():
        host_data = scanner[host]
        addresses = host_data.get("addresses", {})
        os_matches = host_data.get("osmatch", [])
        os_name = os_matches[0].get("name", "Unknown") if os_matches else "Unknown"
        evidence = _script_evidence(host_data.get("hostscript"))
        ports: list[dict[str, Any]] = []

        for protocol in host_data.all_protocols():
            for port, service in host_data[protocol].items():
                if service.get("state") != "open":
                    continue
                evidence.extend(_script_evidence(service.get("script")))
                ports.append(
                    {
                        "port": int(port),
                        "service": service.get("name", "unknown"),
                        "version": " ".join(
                            part for part in [service.get("product", ""), service.get("version", ""), service.get("extrainfo", "")] if part
                        ).strip() or "Unknown",
                        "protocol": protocol,
                    }
                )

        assets.append(
            {
                "ip": host,
                "mac": addresses.get("mac"),
                "hostname": host_data.hostname() or host,
                "status": host_data.state(),
                "os": os_name,
                "ports": ports,
                "scan_evidence": evidence,
                "scan_metadata": {
                    "mode": "live",
                    "source": "nmap",
                    "command_profile": "-sV -O --version-light --top-ports 100 with targeted NSE checks",
                },
            }
        )

    if not assets:
        raise RuntimeError("No live hosts were discovered for the supplied target.")
    return assets


def scan_network(target: str, mode: str = "demo", authorized: bool = False) -> list[dict[str, Any]]:
    """Discover assets in an explicitly selected mode.

    ``live`` requires the caller to acknowledge that they are authorised to
    assess the target. ``auto`` attempts live discovery only after that
    acknowledgement; it otherwise uses demo data.
    """
    clean_target = validate_target(target)
    mode = (mode or "demo").strip().lower()
    if mode == "synthetic":  # compatibility for the original API
        mode = "demo"
    if mode not in VALID_MODES:
        raise ValueError("Mode must be one of: demo, live, or auto.")

    if mode == "demo" or (mode == "auto" and not authorized):
        return _generate_demo_scan(clean_target)

    if not authorized:
        raise PermissionError("Live network scans require authorised=true.")

    try:
        return _live_scan(clean_target)
    except Exception:
        if mode == "auto" and settings.ALLOW_SYNTHETIC_FALLBACK:
            return _generate_demo_scan(clean_target)
        raise


def scan_metadata(scan_data: list[dict[str, Any]]) -> dict[str, Any]:
    """Expose one consistent provenance record for API, storage, and reports."""
    if not scan_data:
        return {"mode": "unknown", "source": "unknown"}
    return scan_data[0].get("scan_metadata", {"mode": "unknown", "source": "unknown"})
