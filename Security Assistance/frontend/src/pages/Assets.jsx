
import { useEffect, useState } from "react";
import {
  Server,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAssets } from "../services/api";

function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const loadAssets = async () => {
    setLoading(true);

    try {
      const data = await getAssets();

      setAssets(
        Array.isArray(data)
          ? data
          : data?.assets || []
      );
    } catch (error) {
      console.error("Failed to load assets:", error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const value = search.toLowerCase();

    return (
      String(asset.ip || "")
        .toLowerCase()
        .includes(value) ||
      String(asset.hostname || "")
        .toLowerCase()
        .includes(value) ||
      String(asset.os || "")
        .toLowerCase()
        .includes(value) ||
      String(asset.status || "")
        .toLowerCase()
        .includes(value)
    );
  });

  const toggleExpanded = (index) => {
    setExpanded(
      expanded === index ? null : index
    );
  };

  return (
    <div className="space-y-6">

      {}

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
              bg-cyan-500/10
              border
              border-cyan-400/20
            "
          >
            <Server
              size={21}
              className="text-cyan-400"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Assets
            </h1>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              Discover and monitor your infrastructure
            </p>
          </div>

        </div>

        <button
          onClick={loadAssets}
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
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>

      {

      }

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="tg-card p-5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center">
              <Server
                size={18}
                className="text-cyan-400"
              />
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)]">
                Total Assets
              </p>

              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {assets.length}
              </p>
            </div>

          </div>

        </div>

        <div className="tg-card p-5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
              <ShieldCheck
                size={18}
                className="text-green-400"
              />
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)]">
                Healthy
              </p>

              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {
                  assets.filter(
                    (asset) =>
                      String(
                        asset.status || ""
                      ).toLowerCase() ===
                      "healthy"
                  ).length
                }
              </p>
            </div>

          </div>

        </div>

        <div className="tg-card p-5">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <ShieldAlert
                size={18}
                className="text-red-400"
              />
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)]">
                At Risk
              </p>

              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {
                  assets.filter(
                    (asset) =>
                      String(
                        asset.status || ""
                      ).toLowerCase() !==
                      "healthy"
                  ).length
                }
              </p>
            </div>

          </div>

        </div>

      </div>

      { }

      <div className="tg-card p-4">

        <div
          className="
            flex
            items-center
            gap-3
            h-11
            px-3
            rounded-xl
            bg-[var(--surface-2)]
            border
            border-[var(--border)]
            focus-within:border-cyan-400/40
            transition
          "
        >

          <Search
            size={17}
            className="text-[var(--text-muted)]"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by IP, hostname, OS or status..."
            className="
              flex-1
              bg-transparent
              outline-none
              text-sm
              text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
            "
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}

        </div>

      </div>

      {
        
      }

      <div className="tg-card overflow-hidden">

        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Discovered Assets
            </h2>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              {filteredAssets.length} asset
              {filteredAssets.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <span className="text-xs text-[var(--text-muted)]">
            {search
              ? "Filtered"
              : "All assets"}
          </span>

        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">

            <RefreshCw
              size={22}
              className="text-cyan-400 animate-spin"
            />

            <span className="ml-3 text-sm text-[var(--text-secondary)]">
              Loading assets...
            </span>

          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-16 text-center">

            <Server
              size={32}
              className="mx-auto text-[var(--text-muted)] mb-3"
            />

            <p className="text-sm font-medium text-[var(--text-secondary)]">
              No assets found
            </p>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              Try changing your search or run a scan.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Asset
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    IP Address
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    OS
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Details
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredAssets.map(
                  (asset, index) => {

                    const isExpanded =
                      expanded === index;

                    const status =
                      String(
                        asset.status || ""
                      ).toLowerCase();

                    const healthy =
                      status ===
                        "healthy" ||
                      status ===
                        "online" ||
                      status ===
                        "active";

                    return (
                      <tr
                        key={
                          asset.id ||
                          asset.ip ||
                          index
                        }
                        className="
                          border-b
                          border-[var(--border)]
                          last:border-0
                          hover:bg-[var(--surface-hover)]
                          transition
                        "
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center">
                              <Server
                                size={16}
                                className="text-cyan-400"
                              />
                            </div>

                            <div className="min-w-0">

                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {asset.hostname ||
                                  asset.name ||
                                  "Unknown Asset"}
                              </p>

                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                {asset.type ||
                                  asset.asset_type ||
                                  "Host"}
                              </p>

                            </div>

                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <span className="font-mono text-xs text-[var(--text-secondary)]">
                            {asset.ip ||
                              asset.ip_address ||
                              "—"}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span className="text-xs text-[var(--text-secondary)]">
                            {asset.os ||
                              asset.operating_system ||
                              "Unknown"}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              px-2.5
                              py-1
                              rounded-lg
                              text-[10px]
                              font-semibold
                              ${
                                healthy
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }
                            `}
                          >

                            <span
                              className={`
                                w-1.5
                                h-1.5
                                rounded-full
                                ${
                                  healthy
                                    ? "bg-green-400"
                                    : "bg-red-400"
                                }
                              `}
                            />

                            {asset.status ||
                              "Unknown"}

                          </span>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              toggleExpanded(
                                index
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-1
                              px-2.5
                              py-1.5
                              rounded-lg
                              text-xs
                              text-[var(--text-secondary)]
                              hover:text-[var(--text-primary)]
                              hover:bg-[var(--surface-2)]
                              transition
                            "
                          >

                            {isExpanded ? (
                              <>
                                Hide
                                <ChevronUp
                                  size={14}
                                />
                              </>
                            ) : (
                              <>
                                View
                                <ChevronDown
                                  size={14}
                                />
                              </>
                            )}

                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Assets;

