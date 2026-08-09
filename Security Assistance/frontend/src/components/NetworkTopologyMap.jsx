import { useEffect, useRef, useState } from 'react';
import { Network, Shield, Server, Globe, Database, Wifi } from 'lucide-react';

const CRITICALITY_COLORS = {
  Critical: '#EF4444',
  High:     '#F97316',
  Medium:   '#F59E0B',
  Low:      '#22C55E',
};

const ASSET_TYPE_ICONS = {
  'Active Directory / Windows Server': '🖥️',
  'Enterprise Database Server':        '🗄️',
  'Public Web Application Server':     '🌐',
  'Linux Application Server':          '🐧',
  'Network Device':                    '🔌',
  'IoT / Embedded Device':             '📡',
  'Cloud Endpoint':                    '☁️',
  'Generic IT Asset':                  '💻',
};

function getNodeColor(asset) {
  return CRITICALITY_COLORS[asset.criticality] || '#6B7280';
}

function getIcon(assetType) {
  return ASSET_TYPE_ICONS[assetType] || '💻';
}

function placeNodes(assets, cx, cy, r) {
  if (!assets || assets.length === 0) return [];
  return assets.map((asset, i) => {
    const angle = (2 * Math.PI * i) / assets.length - Math.PI / 2;
    return {
      ...asset,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });
}

export default function NetworkTopologyMap({ assets = [] }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  const W = 700, H = 400;
  const cx = W / 2, cy = H / 2;
  const radius = Math.min(W, H) * 0.33;

  const nodes = placeNodes(assets, cx, cy, radius);

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Network size={15} className="text-cyan-400" />
          Network Topology Map
        </h2>
        <span className="text-xs text-gray-500">{assets.length} host{assets.length !== 1 ? 's' : ''} discovered</span>
      </div>

      {assets.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
          Run a scan to generate the topology map.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          {/* SVG Canvas */}
          <div className="flex-1 overflow-auto">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ minHeight: 280, maxHeight: 420 }}
            >
              {/* Grid dots background */}
              <defs>
                <pattern id="topo-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="#1e2a3a" />
                </pattern>
                {/* Glow filter for critical nodes */}
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-cyan">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect width={W} height={H} fill="url(#topo-grid)" />

              {/* Edges: node → gateway */}
              {nodes.map((node, i) => {
                const isActive = hovered?.ip === node.ip || selected?.ip === node.ip;
                return (
                  <line
                    key={`edge-${i}`}
                    x1={cx} y1={cy}
                    x2={node.x} y2={node.y}
                    stroke={isActive ? getNodeColor(node) : '#1e3a4a'}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={isActive ? '' : '4 3'}
                    opacity={isActive ? 0.9 : 0.45}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                );
              })}

              {/* Gateway node */}
              <g>
                <circle cx={cx} cy={cy} r={28} fill="#0f1f30" stroke="#00E5FF" strokeWidth={2} filter="url(#glow-cyan)" />
                <circle cx={cx} cy={cy} r={22} fill="#0a1520" stroke="#00b4cc" strokeWidth={1.5} />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#00E5FF">🛡️</text>
                <text x={cx} y={cy + 38} textAnchor="middle" fontSize="10" fill="#00E5FF" fontWeight="600">Gateway</text>
              </g>

              {/* Asset nodes */}
              {nodes.map((node, i) => {
                const color = getNodeColor(node);
                const isSelected = selected?.ip === node.ip;
                const isHovered = hovered?.ip === node.ip;
                const r = isSelected ? 22 : isHovered ? 20 : 18;
                const ports = node.ports || node.services || [];
                const portCount = ports.length;

                return (
                  <g
                    key={`node-${i}`}
                    onClick={() => setSelected(isSelected ? null : node)}
                    onMouseEnter={() => setHovered(node)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Outer ring for critical */}
                    {node.criticality === 'Critical' && (
                      <circle cx={node.x} cy={node.y} r={r + 6} fill="none" stroke="#EF4444" strokeWidth={1} opacity={0.4} strokeDasharray="3 2" />
                    )}
                    <circle
                      cx={node.x} cy={node.y} r={r}
                      fill={`${color}22`}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      filter={isSelected ? 'url(#glow-red)' : undefined}
                      style={{ transition: 'all 0.15s ease' }}
                    />
                    {/* Icon */}
                    <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="13">
                      {getIcon(node.asset_type)}
                    </text>
                    {/* Port count badge */}
                    {portCount > 0 && (
                      <g>
                        <circle cx={node.x + r - 4} cy={node.y - r + 4} r={7} fill="#1e293b" stroke={color} strokeWidth={1} />
                        <text x={node.x + r - 4} y={node.y - r + 4} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill={color} fontWeight="bold">{portCount}</text>
                      </g>
                    )}
                    {/* Hostname label */}
                    <text
                      x={node.x}
                      y={node.y + r + 13}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill={isSelected || isHovered ? color : '#94a3b8'}
                      fontWeight={isSelected ? '700' : '400'}
                      style={{ transition: 'fill 0.15s ease' }}
                    >
                      {node.ip}
                    </text>
                    {/* Criticality label */}
                    <text
                      x={node.x}
                      y={node.y + r + 24}
                      textAnchor="middle"
                      fontSize="7.5"
                      fill={color}
                      opacity={0.8}
                    >
                      {node.criticality || 'Unknown'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Inspection panel */}
          <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-800 p-4">
            {selected ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">IP Address</p>
                  <p className="font-mono text-cyan-400 text-sm font-bold">{selected.ip}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Hostname</p>
                  <p className="text-gray-300 text-xs">{selected.hostname || 'Not Available'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">OS</p>
                  <p className="text-gray-300 text-xs">{selected.os || 'Not Available'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Asset Type</p>
                  <p className="text-gray-300 text-xs">{selected.asset_type || 'Generic IT Asset'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Criticality</p>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: getNodeColor(selected), backgroundColor: `${getNodeColor(selected)}20`, border: `1px solid ${getNodeColor(selected)}40` }}
                  >
                    {selected.criticality || 'Unknown'}
                  </span>
                </div>
                {(selected.ports || selected.services || []).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Open Ports</p>
                    <div className="flex flex-wrap gap-1">
                      {(selected.ports || selected.services || []).map((p, i) => (
                        <span key={i} title={p.service || ''} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-xs font-mono">
                          {p.port}/{p.protocol || 'tcp'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-gray-600 hover:text-gray-400 transition mt-1"
                >
                  × Clear selection
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Server size={28} className="text-gray-700 mb-2" />
                <p className="text-gray-600 text-xs">Click a node to inspect</p>
                <div className="mt-4 space-y-1.5 w-full text-left">
                  {Object.entries(CRITICALITY_COLORS).map(([level, color]) => (
                    <div key={level} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      {level}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
