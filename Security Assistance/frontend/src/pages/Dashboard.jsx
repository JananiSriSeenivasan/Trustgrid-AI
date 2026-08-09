
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, startScan, getLatestScan } from '../services/api';
import {
  Activity,
  AlertTriangle,
  Server,
  ShieldAlert,
  Scan,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Cpu,
} from 'lucide-react';
import NetworkTopologyMap from '../components/NetworkTopologyMap';

function riskColor(level) {
  const map = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#3B82F6',
  };

  return map[level] || '#6B7280';
}

function severityBadge(sev) {
  const styles = {
    Critical:
      'bg-red-500/15 text-red-400 border border-red-500/30',
    High:
      'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    Medium:
      'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    Low:
      'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  };

  return styles[sev] || 'bg-gray-700 text-gray-300';
}

function formatTs(ts) {
  if (!ts) return 'Never';

  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div
      className="
        tg-card
        tg-card-hover
        p-5
        flex
        items-start
        gap-4
        relative
        overflow-hidden
      "
    >
      {/* Decorative glow */}
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-10"
        style={{ backgroundColor: color }}
      />

      <div
        className="
          w-11
          h-11
          rounded-xl
          flex
          items-center
          justify-center
          shrink-0
          border
        "
        style={{
          backgroundColor: `${color}12`,
          borderColor: `${color}25`,
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>

      <div className="relative min-w-0">
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </p>

        <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 tracking-tight">
          {value ?? '—'}
        </p>

        {sub && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function SeverityBar({ label, value, total, color }) {
  const pct =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-[var(--text-secondary)]">
        {label}
      </span>

      <div className="flex-1 bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <span className="text-xs font-semibold text-[var(--text-primary)] w-6 text-right">
        {value}
      </span>
    </div>
  );
}

function ComplianceRow({ label, score }) {
  const n = parseFloat(score);

  const color =
    n >= 80
      ? '#22C55E'
      : n >= 60
      ? '#F59E0B'
      : '#EF4444';

  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-secondary)]">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <div className="w-24 bg-[var(--surface-2)] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${Math.min(Math.max(n, 0), 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>

        <span
          className="text-xs font-semibold w-12 text-right"
          style={{ color }}
        >
          {n.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function RiskPostureCard({ score, level }) {
  const color = riskColor(level);

  const numericScore = Number(score) || 0;

  const pct = Math.min(
    Math.max(Math.round((numericScore / 100) * 283), 0),
    283
  );

  return (
    <div className="tg-card p-6 flex items-center gap-6 relative overflow-hidden">

      {/* Glow */}
      <div
        className="absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: color }}
      />

      {/* SVG Gauge */}
      <div
        className="relative shrink-0"
        style={{ width: 110, height: 110 }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="8"
          />

          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${pct} ${283 - pct}`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dasharray 0.8s ease',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[var(--text-primary)] leading-none">
            {Math.round(numericScore)}
          </span>

          <span className="text-[9px] text-[var(--text-muted)] mt-1">
            /100
          </span>
        </div>
      </div>

      <div className="relative">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.18em] mb-1">
          Overall Risk Score
        </p>

        <p
          className="text-2xl font-black"
          style={{ color }}
        >
          {level}
        </p>

        <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-xs">
          {numericScore >= 75
            ? 'Immediate action required.'
            : numericScore >= 50
            ? 'High priority remediation needed.'
            : numericScore >= 25
            ? 'Schedule remediation.'
            : 'Posture is acceptable.'}
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [topologyAssets, setTopologyAssets] = useState([]);

  const [scanTarget, setScanTarget] = useState('');
  const [scanMode, setScanMode] = useState('auto');
  const [authorized, setAuthorized] = useState(false);
  const [scanMsg, setScanMsg] = useState(null);

  const [scanning, setScanning] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getDashboardStats();

      setStats(data);

      try {
        const latest = await getLatestScan();

        setTopologyAssets(
          latest?.assets || []
        );
      } catch (_) {
        // Latest scan is optional
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Failed to load dashboard stats.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleScan = async (e) => {
    e.preventDefault();

    if (!scanTarget.trim()) return;

    setScanning(true);
    setScanMsg(null);

    try {
      const res = await startScan(
        scanTarget.trim(),
        {
          mode: scanMode,
          authorized,
        }
      );

      const source = 'Scan results';

      setScanMsg({
        type: 'success',
        text: `Scan complete — ${source} loaded for ${res.target}.`,
      });

      if (res.assets?.length > 0) {
        setTopologyAssets(res.assets);
      }

      await fetchStats();
    } catch (err) {
      setScanMsg({
        type: 'error',
        text:
          err?.response?.data?.detail ||
          'Scan failed. Check backend.',
      });
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="tg-card px-6 py-5 flex items-center gap-3">
          <RefreshCw
            size={22}
            className="text-cyan-400 animate-spin"
          />

          <span className="text-sm text-[var(--text-secondary)]">
            Loading security dashboard…
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">

        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <XCircle
            size={30}
            className="text-red-400"
          />
        </div>

        <p className="text-red-400 text-sm">
          {error}
        </p>

        <button
          onClick={fetchStats}
          className="tg-button-primary px-5 py-2.5 text-sm"
        >
          Retry
        </button>

      </div>
    );
  }

  const sev =
    stats?.severity_breakdown || {};

  const totalVulns =
    stats?.total_vulnerabilities || 0;

  const compliance =
    stats?.compliance_summary || {};

  const complianceScores = Object.entries(compliance).filter(
    ([, score]) => Number.isFinite(Number(score))
  );

  const cisCompliance = Number(compliance.cis_controls_compliance);

  const topAssets =
    stats?.top_vulnerable_assets || [];

  return (
    <div className="space-y-6">

      {/* ===================================================
          PAGE HEADER
         =================================================== */}

      <div className="flex items-start justify-between flex-wrap gap-4">

        <div>

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
              <Cpu
                size={20}
                className="text-cyan-400"
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                Security Overview
              </h1>

              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Real-time visibility into assets, vulnerabilities and organizational cyber risk.
              </p>
            </div>

          </div>

          {stats?.latest_scan_timestamp && (
            <p className="text-xs text-[var(--text-muted)] mt-3 flex items-center gap-1.5">
              <Clock size={12} />

              Last Scan:
              <span className="text-[var(--text-secondary)]">
                {formatTs(
                  stats.latest_scan_timestamp
                )}
              </span>

              {stats.latest_scan_target && (
                <span className="font-mono text-[var(--text-muted)] ml-1">
                  ({stats.latest_scan_target})
                </span>
              )}
            </p>
          )}

        </div>

        {/* Actions */}

        <div className="flex items-center gap-2 flex-wrap">

          <a
            href="/api/reports/export/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="
              px-4
              py-2
              bg-red-600
              hover:bg-red-500
              text-white
              text-xs
              font-semibold
              rounded-xl
              transition
              shadow-sm
            "
          >
            PDF Report
          </a>

          <a
            href="/api/reports/export/csv"
            target="_blank"
            rel="noopener noreferrer"
            className="
              tg-button-secondary
              px-4
              py-2
              text-xs
            "
          >
            Export CSV
          </a>

          <button
            onClick={fetchStats}
            className="
              tg-button-secondary
              px-4
              py-2
              text-xs
              flex
              items-center
              gap-1.5
            "
          >
            <RefreshCw size={13} />
            Refresh
          </button>

        </div>

      </div>

      {/* ===================================================
          KPI CARDS
         =================================================== */}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">

        <StatCard
          icon={Server}
          label="Total Assets"
          value={
            stats?.total_assets ??
            stats?.assets_count ??
            0
          }
          color="#22D3EE"
          sub="Assets across the environment"
        />

        <StatCard
          icon={ShieldAlert}
          label="Assets at Risk"
          value={topAssets.length}
          color="#F97316"
          sub="Assets requiring review"
        />

        <StatCard
          icon={AlertTriangle}
          label="Critical Vulnerabilities"
          value={sev.Critical || 0}
          color="#EF4444"
          sub="Require immediate action"
        />

        <StatCard
          icon={Activity}
          label="Cyber Health Score"
          value={
            Math.round(
              Number(
                stats?.risk_score ??
                stats?.overall_risk_score ??
                0
              )
            )
          }
          color="#3B82F6"
          sub="Based on latest scan"
        />

        <StatCard
          icon={CheckCircle}
          label="Compliance Score"
          value={Number.isFinite(cisCompliance) ? `${Math.round(cisCompliance)}%` : "--"}
          color="#22C55E"
          sub="CIS baseline coverage"
        />

      </div>

      {/* ===================================================
          SCAN FORM
         =================================================== */}

      <div className="tg-card p-5">

        <div className="flex items-center justify-between mb-4">

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center">
                <Scan
                  size={15}
                  className="text-cyan-400"
                />
              </span>

              Run New Security Scan
            </p>

            <p className="text-xs text-[var(--text-muted)] mt-1 ml-10">
              Discover assets and analyze security exposure
            </p>
          </div>

        </div>

        <form
          onSubmit={handleScan}
          className="flex gap-3 flex-wrap"
        >

          <input
            id="scan-target-input"
            type="text"
            value={scanTarget}
            onChange={(e) =>
              setScanTarget(e.target.value)
            }
            placeholder="Target IP, hostname or network"
            className="
              flex-1
              min-w-[240px]
              h-10
              px-3
              rounded-xl
              bg-[var(--surface-2)]
              border
              border-[var(--border)]
              text-sm
              text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
              outline-none
              focus:border-cyan-400/50
              focus:ring-2
              focus:ring-cyan-400/10
            "
          />

          <select
            value={scanMode}
            onChange={(e) =>
              setScanMode(e.target.value)
            }
            className="
              h-10
              px-3
              rounded-xl
              bg-[var(--surface-2)]
              border
              border-[var(--border)]
              text-sm
              text-[var(--text-primary)]
              outline-none
              focus:border-cyan-400/50
            "
          >
            <option value="auto">
              Automatic Scan
            </option>

            <option value="live">
              Live Scan
            </option>
          </select>

          <label className="flex items-center gap-2 px-3 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-secondary)] cursor-pointer">

            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) =>
                setAuthorized(e.target.checked)
              }
              className="accent-cyan-500"
            />

            Authorized

          </label>

          <button
            type="submit"
            disabled={
              scanning ||
              !scanTarget.trim()
            }
            className="
              tg-button-primary
              h-10
              px-5
              text-sm
              flex
              items-center
              gap-2
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {scanning ? (
              <>
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
                Scanning...
              </>
            ) : (
              <>
                <Scan size={15} />
                Start Scan
              </>
            )}
          </button>

        </form>

        {scanMsg && (
          <div
            className={`
              mt-4
              p-3
              rounded-xl
              border
              flex
              items-start
              gap-2
              text-xs
              ${
                scanMsg.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }
            `}
          >
            {scanMsg.type === 'success' ? (
              <CheckCircle
                size={15}
                className="shrink-0 mt-0.5"
              />
            ) : (
              <XCircle
                size={15}
                className="shrink-0 mt-0.5"
              />
            )}

            <span>{scanMsg.text}</span>
          </div>
        )}

      </div>

      {/* ===================================================
          RISK + SEVERITY
         =================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Risk Posture */}

        <RiskPostureCard
          score={
            stats?.risk_score ??
            stats?.overall_risk_score ??
            0
          }
          level={
            stats?.risk_level ??
            stats?.overall_risk_level ??
            'Low'
          }
        />

        {/* Severity Distribution */}

        <div className="tg-card p-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Vulnerability Severity
              </h2>

              <p className="text-xs text-[var(--text-muted)] mt-1">
                Current security findings
              </p>
            </div>

            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <ShieldAlert
                size={17}
                className="text-red-400"
              />
            </div>

          </div>

          <div className="space-y-4">

            <SeverityBar
              label="Critical"
              value={sev.Critical || 0}
              total={totalVulns}
              color="#EF4444"
            />

            <SeverityBar
              label="High"
              value={sev.High || 0}
              total={totalVulns}
              color="#F97316"
            />

            <SeverityBar
              label="Medium"
              value={sev.Medium || 0}
              total={totalVulns}
              color="#F59E0B"
            />

            <SeverityBar
              label="Low"
              value={sev.Low || 0}
              total={totalVulns}
              color="#3B82F6"
            />

          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">

            <span className="text-xs text-[var(--text-muted)]">
              Total findings
            </span>

            <span className="text-sm font-bold text-[var(--text-primary)]">
              {totalVulns}
            </span>

          </div>

        </div>

      </div>

      {/* ===================================================
          COMPLIANCE + TOP VULNERABLE ASSETS
         =================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Compliance */}

        <div className="tg-card p-6">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/15 flex items-center justify-center">
              <CheckCircle
                size={17}
                className="text-green-400"
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Compliance Overview
              </h2>

              <p className="text-xs text-[var(--text-muted)] mt-1">
                Security framework scores
              </p>
            </div>

          </div>

          {complianceScores.length > 0 ? (
            <div>
              {complianceScores.map(
                ([label, score]) => (
                  <ComplianceRow
                    key={label}
                    label={label}
                    score={score}
                  />
                )
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Shield
                size={26}
                className="mx-auto text-[var(--text-muted)] mb-2"
              />

              <p className="text-xs text-[var(--text-muted)]">
                No compliance data available.
              </p>
            </div>
          )}

        </div>

        {/* Top vulnerable assets */}

        <div className="tg-card p-6">

          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
                <Server
                  size={17}
                  className="text-orange-400"
                />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Top Vulnerable Assets
                </h2>

                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Assets requiring attention
                </p>
              </div>

            </div>

            <TrendingUp
              size={17}
              className="text-[var(--text-muted)]"
            />

          </div>

          {topAssets.length > 0 ? (
            <div className="space-y-2">

              {topAssets.slice(0, 5).map(
                (asset, index) => {

                  const level =
                    asset.risk_level ||
                    asset.severity ||
                    asset.criticality ||
                    'Low';

                  return (
                    <div
                      key={
                        asset.ip ||
                        asset.hostname ||
                        index
                      }
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        p-3
                        rounded-xl
                        bg-[var(--surface-2)]
                        border
                        border-[var(--border)]
                        hover:border-[var(--border-strong)]
                        transition
                      "
                    >

                      <div className="min-w-0">

                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {asset.hostname ||
                            asset.ip ||
                            `Asset ${index + 1}`}
                        </p>

                        {asset.ip && (
                          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                            {asset.ip}
                          </p>
                        )}

                      </div>

                      <span
                        className={`
                          px-2
                          py-1
                          rounded-lg
                          text-[10px]
                          font-bold
                          shrink-0
                          ${severityBadge(level)}
                        `}
                      >
                        {level}
                      </span>

                    </div>
                  );
                }
              )}

            </div>
          ) : (
            <div className="py-8 text-center">

              <CheckCircle
                size={26}
                className="mx-auto text-green-400 mb-2"
              />

              <p className="text-xs text-[var(--text-muted)]">
                No vulnerable assets reported.
              </p>

            </div>
          )}

        </div>

      </div>

      {/* ===================================================
          NETWORK TOPOLOGY
         =================================================== */}

      <div className="tg-card overflow-hidden">

        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Network Topology
            </h2>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              Discovered infrastructure and connected assets
            </p>
          </div>

          <Activity
            size={17}
            className="text-cyan-400"
          />

        </div>

        <div className="p-2">
          <NetworkTopologyMap
            assets={topologyAssets}
          />
        </div>

      </div>

      {/* ===================================================
          REMEDIATION STATUS
         =================================================== */}

      {topologyAssets.length > 0 && (
        <div className="tg-card p-5">

          <div className="flex items-start gap-3">

            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center shrink-0">
              <Shield
                size={17}
                className="text-yellow-400"
              />
            </div>

            <div>

              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Remediation Verification
              </h2>

              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-5">
                Recommendations are not applied automatically.
                Use the remediation guidance, then run an
                authorised follow-up scan to verify that the
                exposure has changed.
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Dashboard;
