
import { useState, useEffect } from 'react';
import { getVulnerabilities } from '../services/api';
import {
  ShieldAlert,
  RefreshCw,
  XCircle,
  ExternalLink,
} from 'lucide-react';

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

function cvssColor(score) {
  if (score >= 9) return '#EF4444';
  if (score >= 7) return '#F97316';
  if (score >= 4) return '#F59E0B';
  return '#22C55E';
}

function Vulnerabilities() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchVulns = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getVulnerabilities();
      setData(res);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Failed to load vulnerabilities.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulns();
  }, []);

  /* =====================================================
     LOADING
     ===================================================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="tg-card px-6 py-5 flex items-center gap-3">
          <RefreshCw
            size={22}
            className="text-cyan-400 animate-spin"
          />

          <span className="text-sm text-[var(--text-secondary)]">
            Loading vulnerabilities…
          </span>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
     ===================================================== */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">

        <div
          className="
            w-14
            h-14
            rounded-2xl
            flex
            items-center
            justify-center
            bg-red-500/10
            border
            border-red-500/20
          "
        >
          <XCircle
            size={30}
            className="text-red-400"
          />
        </div>

        <p className="text-sm text-red-400">
          {error}
        </p>

        <button
          onClick={fetchVulns}
          className="
            tg-button-primary
            px-5
            py-2.5
            text-sm
          "
        >
          Retry
        </button>

      </div>
    );
  }

  const allVulns =
    data?.vulnerabilities || [];

  const severities = [
    'All',
    'Critical',
    'High',
    'Medium',
    'Low',
  ];

  const filtered =
    filter === 'All'
      ? allVulns
      : allVulns.filter(
          (v) => v.severity === filter
        );

  const counts = severities
    .slice(1)
    .reduce((acc, s) => {
      acc[s] = allVulns.filter(
        (v) => v.severity === s
      ).length;

      return acc;
    }, {});

  const criticalCount =
    counts.Critical || 0;

  const highCount =
    counts.High || 0;

  const mediumCount =
    counts.Medium || 0;

  const lowCount =
    counts.Low || 0;

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
         ================================================= */}

      <div className="flex items-start justify-between gap-4 flex-wrap">

        <div className="flex items-center gap-3">

          <div
            className="
              w-11
              h-11
              rounded-xl
              flex
              items-center
              justify-center
              bg-red-500/10
              border
              border-red-500/20
            "
          >
            <ShieldAlert
              size={22}
              className="text-red-400"
            />
          </div>

          <div>

            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Vulnerability Center
            </h1>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              {data?.total_vulnerabilities ??
                allVulns.length}{' '}
              vulnerabilities detected
              {data?.target
                ? ` — target: ${data.target}`
                : ''}
            </p>

          </div>

        </div>

        <button
          onClick={fetchVulns}
          disabled={loading}
          className="
            tg-button-secondary
            flex
            items-center
            gap-2
            px-4
            py-2
            text-sm
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh
        </button>

      </div>

      {/* =================================================
          SUMMARY CARDS
         ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Critical */}

        <div className="tg-card p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Critical
              </p>

              <p className="text-2xl font-bold text-red-400 mt-1">
                {criticalCount}
              </p>

            </div>

            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <ShieldAlert
                size={17}
                className="text-red-400"
              />
            </div>

          </div>

        </div>

        {/* High */}

        <div className="tg-card p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                High
              </p>

              <p className="text-2xl font-bold text-orange-400 mt-1">
                {highCount}
              </p>

            </div>

            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
              <ShieldAlert
                size={17}
                className="text-orange-400"
              />
            </div>

          </div>

        </div>

        {/* Medium */}

        <div className="tg-card p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Medium
              </p>

              <p className="text-2xl font-bold text-yellow-400 mt-1">
                {mediumCount}
              </p>

            </div>

            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center">
              <ShieldAlert
                size={17}
                className="text-yellow-400"
              />
            </div>

          </div>

        </div>

        {/* Low */}

        <div className="tg-card p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Low
              </p>

              <p className="text-2xl font-bold text-green-400 mt-1">
                {lowCount}
              </p>

            </div>

            <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/15 flex items-center justify-center">
              <ShieldAlert
                size={17}
                className="text-green-400"
              />
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          SEVERITY FILTER
         ================================================= */}

      <div className="tg-card p-4">

        <div className="flex items-center gap-2 flex-wrap">

          <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1">
            Filter:
          </span>

          {severities.map((s) => (

            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                px-3
                py-1.5
                rounded-lg
                text-xs
                font-semibold
                border
                transition
                ${
                  filter === s
                    ? s === 'All'
                      ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-400'
                      : severityBadge(s)
                    : `
                      bg-[var(--surface-2)]
                      border-[var(--border)]
                      text-[var(--text-secondary)]
                      hover:border-[var(--border-strong)]
                      hover:text-[var(--text-primary)]
                    `
                }
              `}
            >
              {s}

              {s !== 'All' &&
                counts[s] > 0 && (
                  <span className="ml-1.5 opacity-70">
                    {counts[s]}
                  </span>
                )}
            </button>

          ))}

        </div>

      </div>

      {/* =================================================
          VULNERABILITY LIST
         ================================================= */}

      {filtered.length === 0 ? (

        <div className="tg-card p-12 text-center">

          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">

            <ShieldAlert
              size={28}
              className="text-[var(--text-muted)]"
            />

          </div>

          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No vulnerabilities found
          </p>

          <p className="text-xs text-[var(--text-muted)] mt-1">
            No findings match the selected filter.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {filtered.map((vuln, i) => (

            <div
              key={i}
              className="
                tg-card
                p-5
                hover:border-[var(--border-strong)]
                transition
              "
            >

              {/* =================================================
                  TOP SECTION
                 ================================================= */}

              <div className="flex items-start justify-between gap-4 flex-wrap">

                {/* LEFT */}

                <div className="flex-1 min-w-0">

                  <div className="flex items-center gap-2 flex-wrap mb-2">

                    <span
                      className={`
                        px-2
                        py-0.5
                        rounded
                        text-xs
                        font-bold
                        ${severityBadge(
                          vuln.severity
                        )}
                      `}
                    >
                      {vuln.severity ??
                        'Unknown'}
                    </span>

                    {vuln.cve && (
                      <span className="
                        px-2
                        py-0.5
                        rounded
                        text-xs
                        font-mono
                        bg-blue-500/10
                        text-blue-400
                        border
                        border-blue-500/30
                      ">
                        {vuln.cve}
                      </span>
                    )}

                    {vuln.exploit_status && (
                      <span className="
                        px-2
                        py-0.5
                        rounded
                        text-xs
                        bg-red-500/10
                        text-red-400
                        border
                        border-red-500/20
                      ">
                        {vuln.exploit_status}
                      </span>
                    )}

                  </div>

                  <p className="text-[var(--text-primary)] font-semibold text-sm leading-snug">
                    {vuln.vulnerability ??
                      'Not Available'}
                  </p>

                  <p className="text-[var(--text-muted)] text-xs mt-1 leading-5">
                    {vuln.recommendation ??
                      'No recommendation available'}
                  </p>

                </div>

                {/* RIGHT META */}

                <div className="flex flex-col items-end gap-1 shrink-0">

                  <span
                    className="text-lg font-bold"
                    style={{
                      color: cvssColor(
                        vuln.cvss ?? 0
                      ),
                    }}
                  >
                    {vuln.cvss != null
                      ? `CVSS ${vuln.cvss.toFixed(
                          1
                        )}`
                      : 'N/A'}
                  </span>

                  {vuln.epss_score != null && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      EPSS{' '}
                      {(
                        vuln.epss_score * 100
                      ).toFixed(0)}
                      %
                    </span>
                  )}

                </div>

              </div>

              {/* =================================================
                  FOOTER META
                 ================================================= */}

              <div className="
                flex
                items-center
                gap-4
                mt-4
                pt-3
                border-t
                border-[var(--border)]
                flex-wrap
                text-xs
                text-[var(--text-muted)]
              ">

                <span>
                  Host:{' '}
                  <span className="font-mono text-cyan-400">
                    {vuln.ip ?? '—'}
                  </span>
                </span>

                {vuln.hostname && (
                  <span>
                    Hostname:{' '}
                    <span className="text-[var(--text-secondary)]">
                      {vuln.hostname}
                    </span>
                  </span>
                )}

                {vuln.port != null && (
                  <span>
                    Port:{' '}
                    <span className="font-mono text-[var(--text-secondary)]">
                      {vuln.port}
                    </span>
                  </span>
                )}

                {vuln.service && (
                  <span>
                    Service:{' '}
                    <span className="text-[var(--text-secondary)]">
                      {vuln.service}
                    </span>
                  </span>
                )}

                {vuln.mitre_attack && (
                  <span className="flex items-center gap-1">

                    MITRE:{' '}

                    <span className="text-purple-400 font-mono">
                      {vuln.mitre_attack}
                    </span>

                    {vuln.attack_name && (
                      <span className="text-[var(--text-muted)]">
                        ({vuln.attack_name})
                      </span>
                    )}

                  </span>
                )}

                {vuln.cve && (
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${vuln.cve}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      ml-auto
                      inline-flex
                      items-center
                      gap-1
                      text-cyan-400
                      hover:text-cyan-300
                      transition
                    "
                  >
                    Details
                    <ExternalLink
                      size={12}
                    />
                  </a>
                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default Vulnerabilities;

