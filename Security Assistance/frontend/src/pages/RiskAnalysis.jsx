
import { useState } from 'react';
import { getRiskAnalysis } from '../services/api';
import {
  Activity,
  RefreshCw,
  XCircle,
  Search,
  AlertTriangle,
  CheckCircle,
  Server,
  Shield,
  Zap,
  GitBranch,
  BarChart2,
} from 'lucide-react';
import RiskHeatMap from '../components/RiskHeatMap';

function riskColor(level) {
  const map = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#22C55E',
  };

  return map[level] || '#6B7280';
}

function riskBorder(level) {
  const map = {
    Critical: 'border-red-500/30',
    High: 'border-orange-500/30',
    Medium: 'border-yellow-500/30',
    Low: 'border-green-500/30',
  };

  return map[level] || 'border-[var(--border)]';
}

function priorityBadge(p) {
  const map = {
    P1: 'bg-red-500/15 text-red-400 border border-red-500/30',
    P2: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    P3: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    P4: 'bg-green-500/15 text-green-400 border border-green-500/30',
  };

  return (
    map[p] ||
    'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]'
  );
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
      'bg-green-500/15 text-green-400 border border-green-500/30',
  };

  return (
    styles[sev] ||
    'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]'
  );
}

/* ============================================================
   RISK FACTOR BAR
   ============================================================ */

function FactorBar({ label, value, description }) {
  const pct = Math.round(value ?? 0);

  const color =
    pct >= 75
      ? '#EF4444'
      : pct >= 50
      ? '#F97316'
      : pct >= 25
      ? '#F59E0B'
      : '#22C55E';

  return (
    <div className="space-y-1.5">

      <div className="flex items-center justify-between text-xs">

        <span className="text-[var(--text-secondary)]">
          {label}
        </span>

        <span
          className="font-bold"
          style={{ color }}
        >
          {pct}%
        </span>

      </div>

      <div className="bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">

        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />

      </div>

      {description && (
        <p className="text-[10px] text-[var(--text-muted)]">
          {description}
        </p>
      )}

    </div>
  );
}

/* ============================================================
   METRIC PILL
   ============================================================ */

function MetricPill({ label, value, color }) {
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 text-center">

      <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider mb-1">
        {label}
      </p>

      <p
        className="font-bold text-sm"
        style={{ color }}
      >
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

function RiskAnalysis() {
  const [target, setTarget] = useState('');
  const [scanMode, setScanMode] = useState('auto');
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!target.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await getRiskAnalysis(
        target.trim(),
        {
          mode: scanMode,
          authorized,
        }
      );

      setData(res);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Risk analysis failed. Check backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const risk = data?.risk || {};
  const analysis = risk.analysis || {};
  const prioritized =
    data?.prioritized_vulnerabilities || [];
  const assets = data?.assets || [];
  const vulns = data?.vulnerabilities || [];
  const attackPaths = risk.attack_paths || [];

  const zeroTrust =
    risk.zero_trust_readiness_score;

  const ransomware =
    risk.ransomware_risk_index;

  const cisScore =
    risk.cis_controls_coverage;

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="flex items-start gap-3">

        <div
          className="
            w-11
            h-11
            rounded-xl
            flex
            items-center
            justify-center
            bg-cyan-500/10
            border
            border-cyan-400/20
          "
        >
          <Activity
            size={21}
            className="text-cyan-400"
          />
        </div>

        <div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            Risk Analysis
          </h1>

          <p className="text-xs text-[var(--text-muted)] mt-1">
            Enter a target to run an end-to-end AI
            risk assessment using local threat
            intelligence.
          </p>

        </div>

      </div>

      {/* ======================================================
          ANALYSIS FORM
         ====================================================== */}

      <div className="tg-card p-5">

        <form
          onSubmit={handleAnalyze}
          className="flex gap-3 flex-wrap"
        >

          <input
            id="risk-target-input"
            type="text"
            value={target}
            onChange={(e) =>
              setTarget(e.target.value)
            }
            placeholder="e.g. 192.168.1.0/24 · 10.0.0.10 · localhost · 127.0.0.1"
            className="
              flex-1
              min-w-[260px]
              h-11
              bg-[var(--surface-2)]
              border
              border-[var(--border)]
              rounded-xl
              px-4
              text-sm
              text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
              outline-none
              focus:border-cyan-400/50
              transition
            "
          />

          <select
            value={scanMode}
            onChange={(e) =>
              setScanMode(e.target.value)
            }
            className="
              h-11
              bg-[var(--surface-2)]
              border
              border-[var(--border)]
              rounded-xl
              px-3
              text-sm
              text-[var(--text-primary)]
              outline-none
              focus:border-cyan-400/50
            "
            aria-label="Risk scan mode"
          >
            <option value="live">
              Live Nmap
            </option>

            <option value="auto">
              Auto
            </option>
          </select>

          <button
            id="risk-analyze-btn"
            type="submit"
            disabled={
              loading || !target.trim()
            }
            className="
              tg-button-primary
              h-11
              px-5
              text-sm
              disabled:opacity-50
              flex
              items-center
              gap-2
            "
          >

            {loading ? (
              <RefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <Search size={15} />
            )}

            {loading
              ? 'Analyzing…'
              : 'Analyze Risk'}

          </button>

        </form>

        {true && (
          <label className="
            mt-4
            flex
            items-center
            gap-2
            text-xs
            text-yellow-400
          ">

            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) =>
                setAuthorized(
                  e.target.checked
                )
              }
              className="accent-cyan-500"
            />

            I am authorised to assess
            this target.

          </label>
        )}

      </div>

      {/* ======================================================
          ERROR
         ====================================================== */}

      {error && (
        <div className="
          flex
          items-center
          gap-3
          bg-red-500/10
          border
          border-red-500/30
          rounded-xl
          px-4
          py-3
        ">

          <XCircle
            size={18}
            className="text-red-400 shrink-0"
          />

          <p className="text-red-400 text-sm">
            {error}
          </p>

        </div>
      )}

      {/* ======================================================
          RESULTS
         ====================================================== */}

      {data && (
        <div className="space-y-5">

          {/* ==================================================
              RISK SCORE CARD
             ================================================== */}

          <div
            className={`
              tg-card
              border
              p-6
              ${riskBorder(
                risk.risk_level
              )}
            `}
          >

            <div className="
              flex
              items-center
              justify-between
              flex-wrap
              gap-6
            ">

              <div>

                <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                  Target
                </p>

                <p className="
                  font-mono
                  text-cyan-400
                  text-sm
                  font-semibold
                  mt-1
                ">
                  {data.target ?? '—'}
                </p>

                <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mt-4">
                  Scan ID
                </p>

                <p className="
                  font-mono
                  text-[var(--text-secondary)]
                  text-[10px]
                  mt-1
                ">
                  {data.scan_id ?? '—'}
                </p>

              </div>

              <div className="text-right">

                <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                  AI Risk Score
                </p>

                <p
                  className="
                    text-6xl
                    font-black
                    mt-1
                    leading-none
                  "
                  style={{
                    color: riskColor(
                      risk.risk_level
                    ),
                  }}
                >
                  {risk.risk_score != null
                    ? Math.round(
                        risk.risk_score
                      )
                    : '—'}
                </p>

                <p
                  className="text-base font-bold mt-2"
                  style={{
                    color: riskColor(
                      risk.risk_level
                    ),
                  }}
                >
                  {risk.risk_level ?? '—'}
                </p>

              </div>

            </div>

            {/* ANALYSIS METRICS */}

            {Object.keys(analysis).length >
              0 && (
              <div className="
                grid
                grid-cols-2
                sm:grid-cols-4
                gap-3
                mt-6
                pt-5
                border-t
                border-[var(--border)]
              ">

                <MetricPill
                  label="Vulnerabilities"
                  value={
                    analysis.vulnerability_count ??
                    '—'
                  }
                  color="#22D3EE"
                />

                <MetricPill
                  label="Business Criticality"
                  value={
                    analysis.business_criticality ??
                    '—'
                  }
                  color={riskColor(
                    analysis.business_criticality
                  )}
                />

                <MetricPill
                  label="EPSS Max"
                  value={
                    analysis.epss_threat_index != null
                      ? `${(
                          analysis.epss_threat_index *
                          100
                        ).toFixed(0)}%`
                      : '—'
                  }
                  color="#F97316"
                />

                <MetricPill
                  label="Exposure"
                  value={
                    analysis.internet_exposure
                      ? 'External'
                      : 'Internal'
                  }
                  color={
                    analysis.internet_exposure
                      ? '#EF4444'
                      : '#22C55E'
                  }
                />

              </div>
            )}

            {analysis.exploit_analysis && (
              <p className="
                text-[10px]
                text-[var(--text-muted)]
                mt-4
                leading-relaxed
              ">
                {analysis.exploit_analysis}
              </p>
            )}

          </div>

          {/* ==================================================
              RISK FACTOR BREAKDOWN
             ================================================== */}

          {prioritized.length > 0 &&
            (() => {

              const factorable =
                prioritized.filter(
                  (v) => v.risk_factors
                );

              if (!factorable.length)
                return null;

              const avg = (key) =>
                factorable.reduce(
                  (s, v) =>
                    s +
                    (v.risk_factors?.[
                      key
                    ] ?? 0),
                  0
                ) /
                factorable.length;

              return (
                <div className="tg-card p-6">

                  <h2 className="
                    text-sm
                    font-semibold
                    text-[var(--text-primary)]
                    mb-5
                    flex
                    items-center
                    gap-2
                  ">

                    <BarChart2
                      size={16}
                      className="text-cyan-400"
                    />

                    Risk Factor Breakdown

                    <span className="
                      text-[10px]
                      text-[var(--text-muted)]
                      font-normal
                    ">
                      Weighted AI Scoring Model
                    </span>

                  </h2>

                  <div className="space-y-4">

                    <FactorBar
                      label="CVSS Severity (30%)"
                      value={avg('cvss')}
                      description="Based on CVSSv3.1 base score — measures inherent technical severity"
                    />

                    <FactorBar
                      label="Exploitability (20%)"
                      value={avg(
                        'exploitability'
                      )}
                      description="EPSS probability + known exploit / CISA KEV status"
                    />

                    <FactorBar
                      label="Asset Criticality (20%)"
                      value={avg(
                        'asset_criticality'
                      )}
                      description="Business impact if compromised (Critical / High / Medium / Low)"
                    />

                    <FactorBar
                      label="Network Exposure (15%)"
                      value={avg(
                        'network_exposure'
                      )}
                      description="Whether the service is internet-reachable or internal-only"
                    />

                    <FactorBar
                      label="Vulnerability Density (10%)"
                      value={avg(
                        'vulnerability_density'
                      )}
                      description="Number of co-located vulnerabilities on the same host"
                    />

                    <FactorBar
                      label="Threat Intelligence (5%)"
                      value={avg(
                        'threat_intelligence'
                      )}
                      description="MITRE ATT&CK + CISA KEV status from local threat intelligence DB"
                    />

                  </div>

                  <p className="
                    text-[10px]
                    text-[var(--text-muted)]
                    mt-4
                  ">
                    Source: Local Threat
                    Intelligence (TrustGrid AI)
                    — no external API calls.
                  </p>

                </div>
              );

            })()}

          {/* ==================================================
              ASSETS
             ================================================== */}

          {assets.length > 0 && (
            <div className="tg-card p-5">

              <h2 className="
                text-sm
                font-semibold
                text-[var(--text-primary)]
                mb-4
                flex
                items-center
                gap-2
              ">

                <Server
                  size={16}
                  className="text-cyan-400"
                />

                Assets Discovered
                ({assets.length})

              </h2>

              <div className="overflow-x-auto">

                <table className="w-full text-xs">

                  <thead>

                    <tr className="
                      border-b
                      border-[var(--border)]
                      text-[var(--text-muted)]
                      text-left
                    ">

                      <th className="pb-3 pr-4 font-medium">
                        IP
                      </th>

                      <th className="pb-3 pr-4 font-medium">
                        Hostname
                      </th>

                      <th className="pb-3 pr-4 font-medium">
                        OS
                      </th>

                      <th className="pb-3 pr-4 font-medium">
                        Criticality
                      </th>

                      <th className="pb-3 font-medium">
                        Asset Type
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {assets.map((a, i) => (

                      <tr
                        key={i}
                        className="
                          border-b
                          border-[var(--border)]
                          last:border-0
                          hover:bg-[var(--surface-hover)]
                          transition
                        "
                      >

                        <td className="py-3 pr-4 font-mono text-cyan-400">
                          {a.ip ?? '—'}
                        </td>

                        <td className="py-3 pr-4 text-[var(--text-secondary)]">
                          {a.hostname ?? '—'}
                        </td>

                        <td className="py-3 pr-4 text-[var(--text-secondary)]">
                          {a.os ?? '—'}
                        </td>

                        <td className="py-3 pr-4">

                          {a.criticality ? (
                            <span
                              className="font-semibold"
                              style={{
                                color:
                                  riskColor(
                                    a.criticality
                                  ),
                              }}
                            >
                              {a.criticality}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">
                              —
                            </span>
                          )}

                        </td>

                        <td className="py-3 text-[var(--text-secondary)]">
                          {a.asset_type ?? '—'}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>
          )}

          {/* ==================================================
              PRIORITIZED VULNERABILITIES
             ================================================== */}

          {prioritized.length > 0 && (
            <div className="tg-card p-5">

              <h2 className="
                text-sm
                font-semibold
                text-[var(--text-primary)]
                mb-4
                flex
                items-center
                gap-2
              ">

                <AlertTriangle
                  size={16}
                  className="text-yellow-400"
                />

                Prioritized Vulnerabilities
                ({prioritized.length})

              </h2>

              <div className="space-y-3">

                {prioritized.map((v, i) => (

                  <div
                    key={i}
                    className="
                      bg-[var(--surface-2)]
                      border
                      border-[var(--border)]
                      rounded-xl
                      p-4
                      hover:border-[var(--border-strong)]
                      transition
                    "
                  >

                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-3
                      flex-wrap
                    ">

                      <div className="flex-1">

                        <div className="
                          flex
                          items-center
                          gap-1.5
                          flex-wrap
                          mb-2
                        ">

                          <span
                            className={`
                              px-2
                              py-0.5
                              rounded
                              text-[10px]
                              font-bold
                              ${priorityBadge(
                                v.priority
                              )}
                            `}
                          >
                            {v.priority}
                          </span>

                          <span
                            className={`
                              px-2
                              py-0.5
                              rounded
                              text-[10px]
                              font-semibold
                              ${severityBadge(
                                v.severity
                              )}
                            `}
                          >
                            {v.severity}
                          </span>

                          {v.risk_score != null && (
                            <span className="
                              text-[10px]
                              text-orange-400
                              font-bold
                            ">
                              RS:
                              {Math.round(
                                v.risk_score
                              )}
                            </span>
                          )}

                        </div>

                        <p className="
                          text-[var(--text-primary)]
                          text-sm
                          font-medium
                        ">
                          {v.issue ?? '—'}
                        </p>

                        <p className="
                          text-[var(--text-muted)]
                          text-[10px]
                          mt-1
                        ">
                          {v.reason ?? ''}
                        </p>

                      </div>

                      <div className="
                        text-right
                        text-[10px]
                        text-[var(--text-muted)]
                        shrink-0
                      ">

                        <p>
                          SLA:{' '}
                          <span className="text-orange-400 font-semibold">
                            {v.sla_deadline ?? '—'}
                          </span>
                        </p>

                        <p className="mt-1">
                          CVSS:{' '}
                          <span className="text-[var(--text-primary)] font-bold">
                            {v.cvss != null
                              ? v.cvss.toFixed(1)
                              : '—'}
                          </span>
                        </p>

                      </div>

                    </div>

                    <div className="
                      flex
                      flex-wrap
                      gap-3
                      mt-3
                      text-[10px]
                      text-[var(--text-muted)]
                    ">

                      <span>
                        Host:{' '}
                        <span className="font-mono text-cyan-400">
                          {v.ip ?? '—'}
                        </span>
                      </span>

                      {v.service && (
                        <span>
                          Service:{' '}
                          <span className="text-[var(--text-secondary)]">
                            {v.service}
                          </span>
                        </span>
                      )}

                      {v.asset_criticality && (
                        <span>
                          Criticality:{' '}
                          <span
                            style={{
                              color:
                                riskColor(
                                  v.asset_criticality
                                ),
                            }}
                          >
                            {v.asset_criticality}
                          </span>
                        </span>
                      )}

                    </div>

                    {v.recommendation && (
                      <p className="
                        text-[10px]
                        text-[var(--text-muted)]
                        mt-2
                        italic
                      ">
                        {v.recommendation}
                      </p>
                    )}

                  </div>

                ))}

              </div>

            </div>
          )}

          {/* ==================================================
              RISK HEAT MAP
             ================================================== */}

          {vulns.length > 0 && (
            <RiskHeatMap
              vulnerabilities={vulns}
            />
          )}

          {/* ==================================================
              SECURITY SCORES
             ================================================== */}

          {(zeroTrust != null ||
            ransomware != null ||
            cisScore != null) && (

            <div className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-4
            ">

              {/* Zero Trust */}

              {zeroTrust != null && (
                <div className="tg-card p-5">

                  <div className="
                    flex
                    items-center
                    gap-2
                    mb-3
                  ">

                    <Shield
                      size={16}
                      className="text-cyan-400"
                    />

                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Zero Trust Readiness
                    </p>

                  </div>

                  <p
                    className="text-3xl font-black"
                    style={{
                      color:
                        zeroTrust >= 70
                          ? '#22C55E'
                          : zeroTrust >= 40
                          ? '#F59E0B'
                          : '#EF4444',
                    }}
                  >
                    {zeroTrust.toFixed(1)}%
                  </p>

                  <div className="
                    mt-3
                    bg-[var(--surface-2)]
                    rounded-full
                    h-1.5
                    overflow-hidden
                  ">

                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${zeroTrust}%`,
                        backgroundColor:
                          zeroTrust >= 70
                            ? '#22C55E'
                            : zeroTrust >= 40
                            ? '#F59E0B'
                            : '#EF4444',
                      }}
                    />

                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] mt-2">
                    Target: &gt;90%
                  </p>

                </div>
              )}

              {/* Ransomware */}

              {ransomware != null && (
                <div className="tg-card p-5">

                  <div className="
                    flex
                    items-center
                    gap-2
                    mb-3
                  ">

                    <Zap
                      size={16}
                      className="text-red-400"
                    />

                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Ransomware Risk Index
                    </p>

                  </div>

                  <p
                    className="text-3xl font-black"
                    style={{
                      color:
                        ransomware >= 70
                          ? '#EF4444'
                          : ransomware >= 40
                          ? '#F97316'
                          : '#22C55E',
                    }}
                  >
                    {ransomware.toFixed(1)}%
                  </p>

                  <div className="
                    mt-3
                    bg-[var(--surface-2)]
                    rounded-full
                    h-1.5
                    overflow-hidden
                  ">

                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${ransomware}%`,
                        backgroundColor:
                          ransomware >= 70
                            ? '#EF4444'
                            : ransomware >= 40
                            ? '#F97316'
                            : '#22C55E',
                      }}
                    />

                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] mt-2">
                    Target: &lt;20%
                  </p>

                </div>
              )}

              {/* CIS */}

              {cisScore != null && (
                <div className="tg-card p-5">

                  <div className="
                    flex
                    items-center
                    gap-2
                    mb-3
                  ">

                    <CheckCircle
                      size={16}
                      className="text-green-400"
                    />

                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      CIS Controls Coverage
                    </p>

                  </div>

                  <p
                    className="text-3xl font-black"
                    style={{
                      color:
                        cisScore >= 70
                          ? '#22C55E'
                          : cisScore >= 40
                          ? '#F59E0B'
                          : '#EF4444',
                    }}
                  >
                    {cisScore.toFixed(1)}%
                  </p>

                  <div className="
                    mt-3
                    bg-[var(--surface-2)]
                    rounded-full
                    h-1.5
                    overflow-hidden
                  ">

                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${cisScore}%`,
                        backgroundColor:
                          cisScore >= 70
                            ? '#22C55E'
                            : cisScore >= 40
                            ? '#F59E0B'
                            : '#EF4444',
                      }}
                    />

                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] mt-2">
                    Target: &gt;85%
                  </p>

                </div>
              )}

            </div>
          )}

          {/* ==================================================
              AI EXPLANATION
             ================================================== */}

          {risk.explanation && (
            <div className="
              bg-cyan-500/5
              border
              border-cyan-500/20
              rounded-xl
              p-5
            ">

              <p className="
                text-xs
                text-cyan-400
                font-semibold
                mb-2
                flex
                items-center
                gap-2
              ">

                <Activity size={13} />

                AI Risk Engine Explanation

              </p>

              <p className="
                text-xs
                text-[var(--text-secondary)]
                leading-relaxed
              ">
                {risk.explanation}
              </p>

            </div>
          )}

          {/* ==================================================
              ATTACK PATHS
             ================================================== */}

          {attackPaths.length > 0 && (
            <div className="tg-card p-5">

              <h2 className="
                text-sm
                font-semibold
                text-[var(--text-primary)]
                mb-4
                flex
                items-center
                gap-2
              ">

                <GitBranch
                  size={16}
                  className="text-orange-400"
                />

                Attack Path Analysis (
                {attackPaths.length}{' '}
                vector
                {attackPaths.length !== 1
                  ? 's'
                  : ''}
                )

              </h2>

              <div className="space-y-3">

                {attackPaths.map(
                  (path, i) => (

                    <div
                      key={i}
                      className="
                        bg-[var(--surface-2)]
                        border
                        border-[var(--border)]
                        rounded-xl
                        p-4
                        hover:border-orange-500/30
                        transition
                      "
                    >

                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-3
                        flex-wrap
                      ">

                        <div>

                          <p className="
                            text-xs
                            text-orange-400
                            font-semibold
                            mb-1
                          ">
                            Step {i + 1}:{' '}
                            {path.step}
                          </p>

                          <p className="text-sm text-[var(--text-primary)]">
                            {path.vector}
                          </p>

                          <p className="
                            text-[10px]
                            text-[var(--text-muted)]
                            mt-1
                          ">
                            Target:{' '}
                            <span className="font-mono text-cyan-400">
                              {path.target_host}
                            </span>
                          </p>

                        </div>

                        <span className="
                          text-[10px]
                          bg-orange-500/10
                          text-orange-400
                          border
                          border-orange-500/30
                          px-2
                          py-1
                          rounded-lg
                          font-mono
                          shrink-0
                        ">
                          {path.mitre_technique}
                        </span>

                      </div>

                      <p className="
                        text-[10px]
                        text-[var(--text-muted)]
                        mt-2
                        italic
                      ">
                        {path.risk_impact}
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* ======================================================
          EMPTY STATE
         ====================================================== */}

      {!data &&
        !loading &&
        !error && (

          <div className="
            tg-card
            p-14
            text-center
          ">

            <div className="
              w-16
              h-16
              rounded-2xl
              bg-cyan-500/10
              border
              border-cyan-400/15
              flex
              items-center
              justify-center
              mx-auto
              mb-4
            ">

              <Activity
                size={30}
                className="text-cyan-400"
              />

            </div>

            <p className="
              text-sm
              font-semibold
              text-[var(--text-secondary)]
            ">
              Ready for Risk Analysis
            </p>

            <p className="
              text-xs
              text-[var(--text-muted)]
              mt-1
            ">
              Enter a target above to run
              an AI risk assessment.
            </p>

            <p className="
              text-[10px]
              text-[var(--text-muted)]
              mt-2
            ">
              Example: 127.0.0.1
            </p>

          </div>

        )}

    </div>
  );
}

export default RiskAnalysis;
