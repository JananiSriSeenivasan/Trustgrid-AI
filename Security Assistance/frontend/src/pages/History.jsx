import { useState, useEffect } from 'react';
import { getScanHistory, deleteScanHistoryEntry } from '../services/api';
import { History as HistoryIcon, RefreshCw, XCircle, Clock, Trash2 } from 'lucide-react';

function riskColor(level) {
  const map = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#22C55E',
  };
  return map[level] || '#6B7280';
}

function riskBadge(level) {
  const styles = {
    Critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
    High: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    Medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    Low: 'bg-green-500/15 text-green-400 border border-green-500/30',
  };
  return styles[level] || 'bg-gray-700/40 text-gray-400 border border-gray-600';
}

function formatTimestamp(ts) {
  if (!ts) return 'Not Available';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return ts;
  }
}

function timeAgo(ts) {
  if (!ts) return '';
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return '';
  }
}

function History() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getScanHistory();
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteScan = async (scan) => {
    if (!window.confirm(`Delete the scan record for ${scan.target || 'this target'}? This cannot be undone.`)) return;
    setDeletingId(scan.scan_id);
    setError(null);
    try {
      await deleteScanHistoryEntry(scan.scan_id);
      setData((current) => ({
        ...current,
        total_scans: Math.max(0, (current?.total_scans || 1) - 1),
        history: (current?.history || []).filter((item) => item.scan_id !== scan.scan_id),
      }));
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to delete this scan record.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={28} className="text-cyan-400 animate-spin" />
        <span className="ml-3 text-gray-400">Loading scan history…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <XCircle size={36} className="text-red-400" />
        <p className="text-red-400 font-semibold">{error}</p>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm text-white transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const history = data?.history || [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HistoryIcon size={24} className="text-cyan-400" />
            Scan History
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {data?.total_scans ?? history.length} historical scans on record
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-12 text-center">
          <Clock size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">No scan history found. Run a scan from the Dashboard.</p>
        </div>
      ) : (
        <>
          {/* ── Summary Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Critical', 'High', 'Medium', 'Low'].map((level) => {
              const count = history.filter((s) => s.risk_level === level).length;
              return (
                <div
                  key={level}
                  className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex flex-col gap-1"
                >
                  <p className="text-xs text-gray-400">{level} Risk Scans</p>
                  <p
                    className="text-2xl font-black"
                    style={{ color: riskColor(level) }}
                  >
                    {count}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Table ── */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#0d1520]">
                    <th className="text-left px-5 py-3 text-gray-400 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Target</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Timestamp</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Risk Level</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Risk Score</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Vulnerabilities</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Scan ID</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((scan, i) => (
                    <tr
                      key={scan.scan_id || i}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                    >
                      <td className="px-5 py-3 text-gray-600 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 text-cyan-400 font-medium max-w-xs">
                        <span className="truncate block" title={scan.target}>
                          {scan.target ?? 'Not Available'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{formatTimestamp(scan.timestamp)}</span>
                          <span className="text-gray-600 text-xs">{timeAgo(scan.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {scan.risk_level ? (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${riskBadge(
                              scan.risk_level
                            )}`}
                          >
                            {scan.risk_level}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">Not Available</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteScan(scan)}
                          disabled={deletingId === scan.scan_id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
                        >
                          <Trash2 size={13} /> {deletingId === scan.scan_id ? 'Deleting' : 'Delete'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-bold text-base"
                          style={{ color: riskColor(scan.risk_level) }}
                        >
                          {scan.risk_score != null
                            ? `${parseFloat(scan.risk_score).toFixed(1)}`
                            : '—'}
                        </span>
                        <span className="text-gray-600 text-xs">/100</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-semibold">
                        {scan.total_vulnerabilities != null
                          ? scan.total_vulnerabilities
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs text-gray-500 truncate block max-w-32"
                          title={scan.scan_id}
                        >
                          {scan.scan_id ?? 'Not Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Timeline view ── */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Clock size={15} className="text-cyan-400" />
              Scan Timeline
            </h2>
            <div className="relative pl-4">
              {/* Vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-800" />
              <div className="space-y-4">
                {history.slice(0, 10).map((scan, i) => (
                  <div key={i} className="relative pl-5">
                    {/* Dot */}
                    <div
                      className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: riskColor(scan.risk_level) }}
                    />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-white font-medium truncate max-w-xs">
                          {scan.target ?? 'Unknown Target'}
                        </p>
                        <p className="text-xs text-gray-500">{formatTimestamp(scan.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {scan.risk_level && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${riskBadge(
                              scan.risk_level
                            )}`}
                          >
                            {scan.risk_level}
                          </span>
                        )}
                        {scan.total_vulnerabilities != null && (
                          <span className="text-xs text-gray-500">
                            {scan.total_vulnerabilities} vuln
                            {scan.total_vulnerabilities !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {history.length > 10 && (
                  <p className="text-xs text-gray-600 pl-5 italic">
                    +{history.length - 10} more scans — see table above
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default History;
