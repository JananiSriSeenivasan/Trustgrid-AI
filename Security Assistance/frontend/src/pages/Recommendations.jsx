
import { useState, useEffect } from 'react';
import { getRecommendations } from '../services/api';
import {
  ClipboardCheck,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  CheckCircle,
} from 'lucide-react';

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

function riskScoreColor(score) {
  if (score >= 75) return '#EF4444';
  if (score >= 50) return '#F97316';
  if (score >= 25) return '#F59E0B';
  return '#22C55E';
}

/* ============================================================
   RISK FACTOR BAR
   ============================================================ */

function FactorMini({ label, value }) {
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
    <div className="flex items-center gap-2 text-[10px]">

      <span className="
        text-[var(--text-muted)]
        w-32
        shrink-0
      ">
        {label}
      </span>

      <div className="
        flex-1
        bg-[var(--surface-2)]
        rounded-full
        h-1.5
        overflow-hidden
      ">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <span
        className="w-7 text-right font-bold"
        style={{ color }}
      >
        {pct}
      </span>

    </div>
  );
}

/* ============================================================
   RECOMMENDATION CARD
   ============================================================ */

function RecommendationCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const [activeScript, setActiveScript] =
    useState('powershell');

  const hasFactors =
    rec.risk_factors &&
    Object.keys(rec.risk_factors).length > 0;

  const riskScore = rec.risk_score;

  return (
    <div
      className="
        tg-card
        overflow-hidden
        hover:border-[var(--border-strong)]
        transition-all
        duration-200
      "
    >

      {/* ======================================================
          HEADER
         ====================================================== */}

      <button
        className="
          w-full
          text-left
          px-5
          py-4
          flex
          items-start
          justify-between
          gap-4
          hover:bg-[var(--surface-hover)]
          transition
        "
        onClick={() =>
          setExpanded((p) => !p)
        }
      >

        <div className="flex-1 min-w-0">

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
                rounded-md
                text-[10px]
                font-bold
                ${priorityBadge(
                  rec.priority
                )}
              `}
            >
              {rec.priority ?? '—'}
            </span>

            <span
              className={`
                px-2
                py-0.5
                rounded-md
                text-[10px]
                font-semibold
                ${severityBadge(
                  rec.severity
                )}
              `}
            >
              {rec.severity ?? '—'}
            </span>

            {rec.cvss != null && (
              <span className="
                text-[10px]
                text-[var(--text-muted)]
                font-mono
              ">
                CVSS {rec.cvss.toFixed(1)}
              </span>
            )}

            {riskScore != null && (
              <span
                className="
                  text-[10px]
                  font-bold
                  px-2
                  py-0.5
                  rounded-md
                "
                style={{
                  color: riskScoreColor(
                    riskScore
                  ),
                  background: `${riskScoreColor(
                    riskScore
                  )}15`,
                  border: `1px solid ${riskScoreColor(
                    riskScore
                  )}40`,
                }}
              >
                RS:{Math.round(riskScore)}
              </span>
            )}

            {rec.cve && (
              <span className="
                text-[10px]
                text-blue-400
                font-mono
              ">
                {rec.cve}
              </span>
            )}

          </div>

          <p className="
            text-[var(--text-primary)]
            text-sm
            font-semibold
            leading-snug
          ">
            {rec.issue ?? '—'}
          </p>

          <p className="
            text-[var(--text-muted)]
            text-[10px]
            mt-1
            font-mono
          ">
            {rec.ip ?? '—'}
          </p>

        </div>

        <div className="
          shrink-0
          w-8
          h-8
          rounded-lg
          bg-[var(--surface-2)]
          border
          border-[var(--border)]
          flex
          items-center
          justify-center
          text-[var(--text-muted)]
        ">
          {expanded ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}
        </div>

      </button>

      {/* ======================================================
          EXPANDED CONTENT
         ====================================================== */}

      {expanded && (
        <div className="
          border-t
          border-[var(--border)]
          px-5
          py-5
          space-y-4
        ">

          {/* WHY THIS MATTERS */}

          {rec.why_this_matters && (
            <div className="
              bg-cyan-500/5
              border
              border-cyan-500/15
              rounded-xl
              p-4
            ">

              <p className="
                text-[10px]
                text-cyan-400
                font-semibold
                uppercase
                tracking-wider
                mb-2
                flex
                items-center
                gap-1.5
              ">
                <Info size={11} />
                Why This Matters
              </p>

              <p className="
                text-xs
                text-[var(--text-secondary)]
                leading-relaxed
              ">
                {rec.why_this_matters}
              </p>

            </div>
          )}

          {/* WHY PRIORITIZED */}

          {rec.why_prioritized && (
            <div className="
              bg-orange-500/5
              border
              border-orange-500/15
              rounded-xl
              p-4
            ">

              <p className="
                text-[10px]
                text-orange-400
                font-semibold
                uppercase
                tracking-wider
                mb-2
                flex
                items-center
                gap-1.5
              ">
                <AlertTriangle size={11} />
                Why Prioritized
              </p>

              <p className="
                text-xs
                text-[var(--text-secondary)]
                leading-relaxed
              ">
                {rec.why_prioritized}
              </p>

            </div>
          )}

          {/* BUSINESS + TECHNICAL IMPACT */}

          {(rec.business_impact ||
            rec.technical_impact) && (

            <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-3
            ">

              {rec.business_impact && (
                <div className="
                  bg-red-500/5
                  border
                  border-red-500/15
                  rounded-xl
                  p-4
                ">

                  <p className="
                    text-[10px]
                    text-red-400
                    font-semibold
                    mb-2
                    flex
                    items-center
                    gap-1.5
                  ">
                    <Zap size={11} />
                    Business Impact
                  </p>

                  <p className="
                    text-[11px]
                    text-[var(--text-secondary)]
                    leading-relaxed
                  ">
                    {rec.business_impact}
                  </p>

                </div>
              )}

              {rec.technical_impact && (
                <div className="
                  bg-yellow-500/5
                  border
                  border-yellow-500/15
                  rounded-xl
                  p-4
                ">

                  <p className="
                    text-[10px]
                    text-yellow-400
                    font-semibold
                    mb-2
                    flex
                    items-center
                    gap-1.5
                  ">
                    <Shield size={11} />
                    Technical Impact
                  </p>

                  <p className="
                    text-[11px]
                    text-[var(--text-secondary)]
                    leading-relaxed
                  ">
                    {rec.technical_impact}
                  </p>

                </div>
              )}

            </div>
          )}

          {/* RISK FACTORS */}

          {hasFactors && (
            <div className="
              bg-[var(--surface-2)]
              border
              border-[var(--border)]
              rounded-xl
              p-4
            ">

              <p className="
                text-[10px]
                text-[var(--text-secondary)]
                font-semibold
                uppercase
                tracking-wider
                mb-3
              ">
                AI Risk Factor Breakdown
              </p>

              <div className="space-y-2.5">

                <FactorMini
                  label="CVSS Severity"
                  value={rec.risk_factors.cvss}
                />

                <FactorMini
                  label="Exploitability"
                  value={
                    rec.risk_factors
                      .exploitability
                  }
                />

                <FactorMini
                  label="Asset Criticality"
                  value={
                    rec.risk_factors
                      .asset_criticality
                  }
                />

                <FactorMini
                  label="Network Exposure"
                  value={
                    rec.risk_factors
                      .network_exposure
                  }
                />

                <FactorMini
                  label="Vulnerability Density"
                  value={
                    rec.risk_factors
                      .vulnerability_density
                  }
                />

                <FactorMini
                  label="Threat Intelligence"
                  value={
                    rec.risk_factors
                      .threat_intelligence
                  }

                />

              </div>

            </div>
          )}

          {/* DETECTED VERSION + ACTIONS */}

          {(rec.detected_version ||
            rec.recommended_actions
              ?.length > 0) && (

            <div className="
              bg-cyan-500/5
              border
              border-cyan-500/15
              rounded-xl
              p-4
            ">

              {rec.detected_version && (
                <div className="
                  flex
                  items-center
                  gap-2
                  mb-3
                ">

                  <span className="
                    text-[10px]
                    font-semibold
                    text-[var(--text-muted)]
                    uppercase
                    tracking-wider
                  ">
                    Detected:
                  </span>

                  <span className="
                    px-2
                    py-0.5
                    bg-red-500/15
                    text-red-300
                    border
                    border-red-500/30
                    rounded-md
                    text-[10px]
                    font-mono
                  ">
                    {rec.detected_version}
                  </span>

                </div>
              )}

              {rec.recommended_actions
                ?.length > 0 && (
                <>
                  <p className="
                    text-[10px]
                    font-semibold
                    text-cyan-400
                    mb-2
                  ">
                    Recommended Actions
                  </p>

                  <ul className="space-y-1.5">

                    {rec.recommended_actions.map(
                      (a, i) => (
                        <li
                          key={i}
                          className="
                            flex
                            items-start
                            gap-2
                            text-[11px]
                            text-[var(--text-secondary)]
                          "
                        >
                          <CheckCircle
                            size={12}
                            className="
                              text-cyan-400
                              mt-0.5
                              shrink-0
                            "
                          />

                          <span>{a}</span>

                        </li>
                      )
                    )}

                  </ul>
                </>
              )}

            </div>
          )}

          {/* MITRE + CVE */}

          {(rec.cve ||
            rec.mitre_attack) && (

            <div className="
              flex
              flex-wrap
              gap-2
            ">

              {rec.cve && (
                <span className="
                  px-2.5
                  py-1
                  bg-blue-500/10
                  text-blue-400
                  border
                  border-blue-500/20
                  rounded-lg
                  font-mono
                  text-[10px]
                ">
                  {rec.cve}
                </span>
              )}

              {rec.mitre_attack && (
                <span className="
                  px-2.5
                  py-1
                  bg-orange-500/10
                  text-orange-400
                  border
                  border-orange-500/20
                  rounded-lg
                  font-mono
                  text-[10px]
                ">
                  MITRE {rec.mitre_attack}
                </span>
              )}

              {rec.attack_name && (
                <span className="
                  px-2.5
                  py-1
                  bg-[var(--surface-2)]
                  text-[var(--text-secondary)]
                  border
                  border-[var(--border)]
                  rounded-lg
                  text-[10px]
                ">
                  {rec.attack_name}
                </span>
              )}

              {rec.epss_score != null && (
                <span className="
                  px-2.5
                  py-1
                  bg-[var(--surface-2)]
                  text-[var(--text-secondary)]
                  border
                  border-[var(--border)]
                  rounded-lg
                  text-[10px]
                ">
                  EPSS{' '}
                  {(
                    rec.epss_score * 100
                  ).toFixed(0)}
                  %
                </span>
              )}

            </div>
          )}

          {/* COMPLIANCE */}

          {rec.compliance && (
            <div>

              <p className="
                text-[10px]
                font-semibold
                text-[var(--text-muted)]
                mb-2
                uppercase
                tracking-wider
              ">
                Compliance Mapping
              </p>

              <div className="
                bg-[var(--surface-2)]
                border
                border-[var(--border)]
                rounded-xl
                p-3
                space-y-2
                text-[11px]
              ">

                {rec.compliance
                  .nist_800_53 && (
                  <p>
                    <span className="text-blue-400 font-semibold">
                      NIST SP 800-53:{' '}
                    </span>

                    <span className="text-[var(--text-secondary)]">
                      {rec.compliance
                        .nist_800_53}
                    </span>
                  </p>
                )}

                {rec.compliance
                  .cis_control && (
                  <p>
                    <span className="text-purple-400 font-semibold">
                      CIS Control:{' '}
                    </span>

                    <span className="text-[var(--text-secondary)]">
                      {rec.compliance
                        .cis_control}
                    </span>
                  </p>
                )}

                {rec.compliance
                  .owasp_top_10 && (
                  <p>
                    <span className="text-yellow-400 font-semibold">
                      OWASP Top 10:{' '}
                    </span>

                    <span className="text-[var(--text-secondary)]">
                      {rec.compliance
                        .owasp_top_10}
                    </span>
                  </p>
                )}

              </div>

            </div>
          )}

          {/* REMEDIATION SCRIPTS */}

          {(rec.script_fix_powershell ||
            rec.script_fix_bash) && (

            <div>

              <p className="
                text-[10px]
                font-semibold
                text-[var(--text-muted)]
                mb-2
                flex
                items-center
                gap-1.5
                uppercase
                tracking-wider
              ">
                <Terminal size={11} />
                Remediation Scripts
              </p>

              <div className="
                flex
                gap-1.5
                mb-2
              ">

                {rec.script_fix_powershell && (
                  <button
                    onClick={() =>
                      setActiveScript(
                        'powershell'
                      )
                    }
                    className={`
                      px-3
                      py-1.5
                      rounded-lg
                      text-[10px]
                      font-semibold
                      transition
                      border
                      ${
                        activeScript ===
                        'powershell'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
                      }
                    `}
                  >
                    PowerShell
                  </button>
                )}

                {rec.script_fix_bash && (
                  <button
                    onClick={() =>
                      setActiveScript('bash')
                    }
                    className={`
                      px-3
                      py-1.5
                      rounded-lg
                      text-[10px]
                      font-semibold
                      transition
                      border
                      ${
                        activeScript === 'bash'
                          ? 'bg-green-500/15 text-green-400 border-green-500/30'
                          : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
                      }
                    `}
                  >
                    Bash
                  </button>
                )}

              </div>

              <pre className="
                bg-[var(--code-bg)]
                border
                border-[var(--border)]
                rounded-xl
                p-4
                text-[11px]
                text-[var(--text-secondary)]
                font-mono
                overflow-x-auto
                whitespace-pre-wrap
                leading-relaxed
              ">
                {activeScript ===
                'powershell'
                  ? (
                      rec.script_fix_powershell ??
                      ''
                    )
                  : (
                      rec.script_fix_bash ??
                      ''
                    )}
              </pre>

              {/* VERIFICATION */}

              {rec.verification_steps
                ?.length > 0 && (

                <div className="mt-3">

                  <p className="
                    text-[10px]
                    text-[var(--text-muted)]
                    font-semibold
                    mb-2
                  ">
                    Verification Steps
                  </p>

                  <ul className="space-y-1.5">

                    {rec.verification_steps.map(
                      (s, i) => (
                        <li
                          key={i}
                          className="
                            text-[10px]
                            text-[var(--text-secondary)]
                            font-mono
                            flex
                            items-start
                            gap-2
                          "
                        >

                          <span className="
                            text-cyan-500
                            shrink-0
                          ">
                            {i + 1}.
                          </span>

                          <span>{s}</span>

                        </li>
                      )
                    )}

                  </ul>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] =
    useState('All');

  const fetchRecs = async () => {
    setLoading(true);
    setError(null);

    try {
      const res =
        await getRecommendations();

      setData(res);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Failed to load recommendations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="
        flex
        items-center
        justify-center
        min-h-[400px]
      ">

        <div className="
          tg-card
          px-6
          py-5
          flex
          items-center
          gap-3
        ">

          <RefreshCw
            size={22}
            className="
              text-cyan-400
              animate-spin
            "
          />

          <span className="
            text-sm
            text-[var(--text-secondary)]
          ">
            Loading recommendations…
          </span>

        </div>

      </div>
    );
  }

  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {
    return (
      <div className="
        flex
        flex-col
        items-center
        justify-center
        min-h-[400px]
        gap-4
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-red-500/10
          border
          border-red-500/20
          flex
          items-center
          justify-center
        ">

          <XCircle
            size={28}
            className="text-red-400"
          />

        </div>

        <p className="text-red-400 text-sm">
          {error}
        </p>

        <button
          onClick={fetchRecs}
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

  const allRecs =
    data?.recommendations || [];

  const priorities = [
    'All',
    'P1',
    'P2',
    'P3',
    'P4',
  ];

  const filtered =
    filter === 'All'
      ? allRecs
      : allRecs.filter(
          (r) => r.priority === filter
        );

  const p1Count =
    allRecs.filter(
      (r) => r.priority === 'P1'
    ).length;

  const avgRS = allRecs.length
    ? Math.round(
        allRecs.reduce(
          (s, r) =>
            s + (r.risk_score ?? 0),
          0
        ) / allRecs.length
      )
    : 0;

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="
        flex
        items-start
        justify-between
        gap-4
        flex-wrap
      ">

        <div className="flex items-center gap-3">

          <div className="
            w-11
            h-11
            rounded-xl
            bg-cyan-500/10
            border
            border-cyan-400/20
            flex
            items-center
            justify-center
          ">

            <ClipboardCheck
              size={21}
              className="text-cyan-400"
            />

          </div>

          <div>

            <h1 className="
              text-2xl
              font-bold
              text-[var(--text-primary)]
            ">
              AI Recommendations
            </h1>

            <p className="
              text-xs
              text-[var(--text-muted)]
              mt-1
            ">

              {data?.total_recommendations ??
                allRecs.length}{' '}
              explainable remediation
              playbooks

              {data?.target
                ? ` — ${data.target}`
                : ''}

              {data?.intelligence_source && (
                <span className="
                  ml-2
                  text-[var(--text-muted)]
                ">
                  · {data.intelligence_source}
                </span>
              )}

            </p>

          </div>

        </div>

        <button
          onClick={fetchRecs}
          className="
            tg-button-secondary
            px-4
            py-2
            text-xs
            flex
            items-center
            gap-2
          "
        >

          <RefreshCw size={13} />

          Refresh

        </button>

      </div>

      {/* ======================================================
          SUMMARY CARDS
         ====================================================== */}

      {allRecs.length > 0 && (
        <div className="
          grid
          grid-cols-1
          sm:grid-cols-3
          gap-4
        ">

          {/* P1 */}

          <div className="tg-card p-4">

            <div className="
              flex
              items-center
              justify-between
            ">

              <div>

                <p className="
                  text-[10px]
                  text-[var(--text-muted)]
                  uppercase
                  tracking-wider
                  font-bold
                ">
                  P1 Critical
                </p>

                <p className="
                  text-2xl
                  font-black
                  text-red-400
                  mt-1
                ">
                  {p1Count}
                </p>

              </div>

              <div className="
                w-10
                h-10
                rounded-xl
                bg-red-500/10
                border
                border-red-500/20
                flex
                items-center
                justify-center
              ">

                <AlertTriangle
                  size={18}
                  className="text-red-400"
                />

              </div>

            </div>

          </div>

          {/* TOTAL */}

          <div className="tg-card p-4">

            <div className="
              flex
              items-center
              justify-between
            ">

              <div>

                <p className="
                  text-[10px]
                  text-[var(--text-muted)]
                  uppercase
                  tracking-wider
                  font-bold
                ">
                  Total Findings
                </p>

                <p className="
                  text-2xl
                  font-black
                  text-[var(--text-primary)]
                  mt-1
                ">
                  {allRecs.length}
                </p>

              </div>

              <div className="
                w-10
                h-10
                rounded-xl
                bg-cyan-500/10
                border
                border-cyan-500/20
                flex
                items-center
                justify-center
              ">

                <ClipboardCheck
                  size={18}
                  className="text-cyan-400"
                />

              </div>

            </div>

          </div>

          {/* AVG RISK */}

          <div className="tg-card p-4">

            <div className="
              flex
              items-center
              justify-between
            ">

              <div>

                <p className="
                  text-[10px]
                  text-[var(--text-muted)]
                  uppercase
                  tracking-wider
                  font-bold
                ">
                  Avg Risk Score
                </p>

                <p
                  className="text-2xl font-black mt-1"
                  style={{
                    color:
                      avgRS >= 75
                        ? '#EF4444'
                        : avgRS >= 50
                        ? '#F97316'
                        : avgRS >= 25
                        ? '#F59E0B'
                        : '#22C55E',
                  }}
                >
                  {avgRS}/100
                </p>

              </div>

              <div className="
                w-10
                h-10
                rounded-xl
                bg-orange-500/10
                border
                border-orange-500/20
                flex
                items-center
                justify-center
              ">

                <Zap
                  size={18}
                  className="text-orange-400"
                />

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          PRIORITY FILTER
         ====================================================== */}

      <div className="tg-card p-4">

        <div className="
          flex
          items-center
          gap-2
          flex-wrap
        ">

          <span className="
            text-[10px]
            text-[var(--text-muted)]
            font-semibold
            uppercase
            tracking-wider
            mr-1
          ">
            Priority
          </span>

          {priorities.map((p) => (

            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`
                px-3
                py-1.5
                rounded-lg
                text-[10px]
                font-semibold
                border
                transition
                ${
                  filter === p
                    ? p === 'All'
                      ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-400'
                      : priorityBadge(p)
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

              {p}

              {p !== 'All' && (
                <span className="ml-1 opacity-60">
                  {
                    allRecs.filter(
                      (r) =>
                        r.priority === p
                    ).length
                  }
                </span>
              )}

            </button>

          ))}

        </div>

      </div>

      {/* ======================================================
          RECOMMENDATION LIST
         ====================================================== */}

      {filtered.length === 0 ? (

        <div className="
          tg-card
          p-12
          text-center
        ">

          <div className="
            w-14
            h-14
            rounded-2xl
            bg-cyan-500/10
            border
            border-cyan-500/15
            flex
            items-center
            justify-center
            mx-auto
            mb-4
          ">

            <ClipboardCheck
              size={28}
              className="text-cyan-400"
            />

          </div>

          <p className="
            text-sm
            font-semibold
            text-[var(--text-secondary)]
          ">
            No recommendations available
          </p>

          <p className="
            text-xs
            text-[var(--text-muted)]
            mt-1
          ">
            Run a scan from the Dashboard
            to generate recommendations.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {filtered.map((rec, i) => (
            <RecommendationCard
              key={i}
              rec={rec}
            />
          ))}

        </div>

      )}

    </div>
  );
}

export default Recommendations;

