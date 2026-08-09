import { Search, ScanLine } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const titles = {
  "/": ["Security Overview", "Real-time visibility into your security posture"],
  "/assets": ["Asset Inventory", "Discovered infrastructure and ownership"],
  "/vulnerabilities": ["Vulnerability Management", "Identify, prioritize and remediate findings"],
  "/risk": ["Risk Intelligence", "Explainable risk scoring and exposure analysis"],
  "/recommendations": ["Remediation Center", "Business-risk prioritized remediation actions"],
  "/history": ["Network Discovery", "Scan history and discovery results"],
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [title, subtitle] = titles[pathname] || ["Security Assistance", "AI-powered security operations platform"];
  const submit = (event) => {
    event.preventDefault();
    if (search.trim()) navigate(`/vulnerabilities?search=${encodeURIComponent(search)}`);
  };
  return <header className="tg-topbar">
    <div className="tg-page-title"><h1>{title}</h1><p>{subtitle}</p></div>
    <div className="tg-topbar-actions">
      <form className="tg-global-search" onSubmit={submit}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets, CVEs, IPs..." /></form>
      <button className="tg-run-scan" onClick={() => navigate("/")}><ScanLine size={16} /> Run Security Scan</button>
    </div>
  </header>;
}
