const IMPACT_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Critical'];
const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

// Heat color for a given [row][col] cell (both 0-4, higher = worse)
function cellColor(row, col) {
  const heat = (row + col) / 8; // 0 → 1
  if (heat >= 0.875) return { bg: '#7f1d1d', border: '#ef4444', text: '#fca5a5', label: 'Critical Risk' };
  if (heat >= 0.625) return { bg: '#7c2d12', border: '#f97316', text: '#fdba74', label: 'High Risk' };
  if (heat >= 0.375) return { bg: '#78350f', border: '#f59e0b', text: '#fcd34d', label: 'Medium Risk' };
  if (heat >= 0.125) return { bg: '#14532d', border: '#22c55e', text: '#86efac', label: 'Low Risk' };
  return { bg: '#0f172a', border: '#334155', text: '#64748b', label: 'Minimal' };
}

// Map a vuln to a heat-map cell
function mapVulnToCell(vuln) {
  const cvss = vuln.cvss || 0;
  const epss = vuln.epss_score || 0;
  const col = Math.min(4, Math.floor(cvss / 2)); // Impact: CVSS 0-10 → 0-4
  const row = Math.min(4, Math.floor(epss * 5));  // Likelihood: EPSS 0-1 → 0-4
  return { row, col };
}

export default function RiskHeatMap({ vulnerabilities = [] }) {
  const [selected, setSelected] = useState(null);

  // Build cell → vulns mapping
  const cellMap = {};
  vulnerabilities.forEach((v) => {
    const { row, col } = mapVulnToCell(v);
    const key = `${row}-${col}`;
    if (!cellMap[key]) cellMap[key] = [];
    cellMap[key].push(v);
  });

  const selectedKey = selected ? `${selected.row}-${selected.col}` : null;
  const selectedVulns = selectedKey ? (cellMap[selectedKey] || []) : [];

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          🔥 Risk Heat Map
        </h2>
        <span className="text-xs text-gray-500">CVSS Impact × EPSS Likelihood</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Matrix */}
        <div className="p-5 flex-1">
          {/* Y-axis label */}
          <div className="flex items-stretch gap-2">
            <div className="flex flex-col justify-center items-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              <span className="text-xs text-gray-500">← Exploit Likelihood (EPSS) →</span>
            </div>
            <div className="flex-1">
              {/* Column header (Impact) */}
              <div className="flex mb-1 ml-16">
                {IMPACT_LABELS.map((l) => (
                  <div key={l} className="flex-1 text-center text-xs text-gray-500 truncate px-0.5">{l}</div>
                ))}
              </div>
              {/* Grid rows (row 4 = Almost Certain at top) */}
              {[4, 3, 2, 1, 0].map((row) => (
                <div key={row} className="flex items-center mb-1">
                  {/* Row label */}
                  <div className="w-16 text-right pr-2 text-xs text-gray-500 shrink-0">{LIKELIHOOD_LABELS[row]}</div>
                  {[0, 1, 2, 3, 4].map((col) => {
                    const key = `${row}-${col}`;
                    const c = cellColor(row, col);
                    const count = (cellMap[key] || []).length;
                    const isSelected = selected?.row === row && selected?.col === col;
                    return (
                      <div
                        key={col}
                        onClick={() => setSelected(isSelected ? null : { row, col })}
                        title={`${c.label}: ${count} finding(s)`}
                        className="flex-1 aspect-square flex flex-col items-center justify-center rounded mx-0.5 cursor-pointer transition-all duration-150"
                        style={{
                          backgroundColor: c.bg,
                          border: `1.5px solid ${isSelected ? '#fff' : c.border}`,
                          boxShadow: isSelected ? `0 0 0 2px ${c.border}` : 'none',
                          minHeight: 36,
                          minWidth: 36,
                        }}
                      >
                        {count > 0 && (
                          <span className="text-xs font-bold" style={{ color: c.text }}>{count}</span>
                        )}
                        {count > 0 && (
                          <span className="text-[9px] leading-none" style={{ color: c.text, opacity: 0.7 }}>vuln{count > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* X-axis bottom label */}
              <div className="ml-16 text-center text-xs text-gray-500 mt-1">← CVSS Impact →</div>
            </div>
          </div>
        </div>

        {/* Side panel: selected cell details */}
        <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-800 p-4">
          {selected && selectedVulns.length > 0 ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {LIKELIHOOD_LABELS[selected.row]} Likelihood × {IMPACT_LABELS[selected.col]} Impact
                </p>
                <p className="text-sm font-semibold text-white">{selectedVulns.length} Finding{selectedVulns.length > 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedVulns.map((v, i) => (
                  <div key={i} className="bg-gray-900 border border-red-500/40 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.hostname || v.ip || "Server 01"}</span>
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[10px] font-bold">
                        {v.severity || "Critical"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span className="font-mono text-cyan-400">CVSS {v.cvss?.toFixed(1) || '9.8'}</span>
                      <span className="text-yellow-400 font-semibold text-[11px]">Patch Immediately</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{v.vulnerability || v.issue}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : selected && selectedVulns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <p className="text-gray-600 text-xs">No vulnerabilities in this zone</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-semibold">Stage 4 AI Risk Heat Map</p>
              {vulnerabilities.length > 0 && (
                <div className="space-y-2">
                  {vulnerabilities.slice(0, 3).map((v, idx) => (
                    <div key={idx} className="bg-gray-900 border border-red-500/30 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{v.hostname || v.ip || `Server 0${idx+1}`}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          v.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          v.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                        }`}>
                          {v.severity || 'Critical'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-cyan-400 font-bold">CVSS {v.cvss?.toFixed(1) || '9.8'}</span>
                        <span className="text-yellow-400 font-semibold text-[11px]">Patch Immediately</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 w-full text-left">
                {[
                  { label: 'Critical Risk', bg: '#7f1d1d', border: '#ef4444' },
                  { label: 'High Risk', bg: '#7c2d12', border: '#f97316' },
                  { label: 'Medium Risk', bg: '#78350f', border: '#f59e0b' },
                  { label: 'Low Risk', bg: '#14532d', border: '#22c55e' },
                ].map((z) => (
                  <div key={z.label} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: z.bg, border: `1px solid ${z.border}` }} />
                    {z.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
