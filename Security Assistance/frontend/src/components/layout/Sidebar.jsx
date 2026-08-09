import { useState } from "react";
import {
  Activity, ChevronLeft, ChevronRight, ClipboardCheck,
  LayoutDashboard, ScanLine, Server, ShieldAlert, ShieldCheck, History
} from "lucide-react";
import { NavLink } from "react-router-dom";

const primaryItems = [
  { name: "Overview", path: "/", icon: LayoutDashboard },
  { name: "Asset Discovery", path: "/history", icon: ScanLine },
  { name: "Asset Inventory", path: "/assets", icon: Server },
  { name: "Vulnerability Management", path: "/vulnerabilities", icon: ShieldAlert },
  { name: "Risk Intelligence", path: "/risk", icon: Activity },
  { name: "Remediation", path: "/recommendations", icon: ClipboardCheck },
];

const secondaryItems = [
  { name: "Scan History", path: "/history", icon: History },
];

function NavigationItem({ item, compact }) {
  const Icon = item.icon;
  return <NavLink to={item.path} end={item.path === "/"} title={compact ? item.name : undefined}
    className={({ isActive }) => `tg-nav-item ${isActive ? "tg-nav-active" : ""}`}>
    <Icon size={17} strokeWidth={1.8} />
    {!compact && <span>{item.name}</span>}
  </NavLink>;
}

export default function Sidebar() {
  const [compact, setCompact] = useState(false);
  return <aside className={`tg-sidebar ${compact ? "tg-sidebar-compact" : ""}`}>
    <div className="tg-brand">
      <div className="tg-brand-mark"><ShieldCheck size={19} /></div>
      {!compact && <div><strong>Security Assistance</strong><small>AI-powered security operations platform</small></div>}
      <button className="tg-collapse" onClick={() => setCompact(!compact)} aria-label="Toggle sidebar">
        {compact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
    <nav className="tg-navigation">
      {!compact && <p className="tg-nav-heading">Security workspace</p>}
      {primaryItems.map(item => <NavigationItem key={item.name} item={item} compact={compact} />)}
      {!compact && <p className="tg-nav-heading tg-nav-heading-secondary">Platform</p>}
      {secondaryItems.map(item => <NavigationItem key={item.name} item={item} compact={compact} />)}
    </nav>
  </aside>;
}
