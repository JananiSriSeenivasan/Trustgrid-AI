import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  User,
  Shield,
  ChevronRight,
} from "lucide-react";
import { chatWithAssistant } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const SUGGESTED_PROMPTS = [
  "Why is my highest-risk asset critical?",
  "What should I fix first?",
  "Show critical vulnerabilities",
  "Explain CVE-2017-0144",
];

function severityColor(sev) {
  const map = {
    Critical: "#EF4444",
    High: "#F97316",
    Medium: "#F59E0B",
    Low: "#3B82F6",
  };

  return map[sev] || "#6B7280";
}

function BotMessage({ msg, dark }) {
  const relVulns = msg.related_vulnerabilities || [];
  const relAssets = msg.related_assets || [];
  const recActions = msg.recommended_actions || [];

  return (
    <div className="space-y-2">

      <div
        className={`text-[13px] leading-relaxed whitespace-pre-line ${
          dark ? "text-slate-200" : "text-slate-700"
        }`}
      >
        {msg.text}
      </div>

      {relVulns.length > 0 && (
        <div className="space-y-1 mt-2">
          {relVulns.slice(0, 3).map((v, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 border ${
                dark
                  ? "bg-slate-900 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <span
                className={`text-xs truncate max-w-[60%] ${
                  dark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {v.vulnerability ||
                  v.title ||
                  v.cve ||
                  "Vulnerability"}
              </span>

              <div className="flex items-center gap-2">
                {v.cvss != null && (
                  <span className="font-mono text-cyan-500 text-[10px]">
                    CVSS {Number(v.cvss).toFixed(1)}
                  </span>
                )}

                {v.severity && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      color: severityColor(v.severity),
                      backgroundColor: `${severityColor(
                        v.severity
                      )}18`,
                    }}
                  >
                    {v.severity}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {relAssets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {relAssets.slice(0, 3).map((a, i) => (
            <span
              key={i}
              className={`text-[9px] px-2 py-1 rounded ${
                dark
                  ? "bg-cyan-950 text-cyan-300"
                  : "bg-cyan-50 text-cyan-700"
              }`}
            >
              {a.hostname || a.ip}
            </span>
          ))}
        </div>
      )}

      {recActions.filter(Boolean).length > 0 && (
        <div
          className={`rounded-lg p-2 ${
            dark
              ? "bg-slate-900 border border-slate-700"
              : "bg-slate-50 border border-slate-200"
          }`}
        >
          <p
            className={`text-[9px] font-semibold uppercase tracking-wider mb-1 ${
              dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Recommended Actions
          </p>

          {recActions
            .filter(Boolean)
            .slice(0, 3)
            .map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-1 text-[10px] ${
                  dark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                <ChevronRight
                  size={10}
                  className="text-violet-500 mt-0.5 shrink-0"
                />
                <span>{a}</span>
              </div>
            ))}
        </div>
      )}

      {msg.sources?.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <span
            className={`text-[9px] ${
              dark ? "text-slate-600" : "text-slate-400"
            }`}
          >
            Sources:
          </span>

          {msg.sources.map((s) => (
            <span
              key={s}
              className={`text-[9px] px-1.5 py-0.5 rounded ${
                dark
                  ? "bg-slate-800 text-slate-500"
                  : "bg-violet-50 text-violet-500"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AIChatDrawer() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text:
        "SentinelX Security Assistant is ready.\n\n" +
        "I analyse your live network telemetry from MongoDB scan data. " +
        "Ask me about assets, vulnerabilities, CVEs, risk, or remediation playbooks.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sources: ["asset", "vulnerability", "risk"],
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const userText = text.trim();

    if (!userText || loading) return;

    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setLoading(true);

    try {
      const res = await chatWithAssistant(userText);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: res.answer || "No response from AI engine.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sources: res.sources || [],
          related_vulnerabilities:
            res.related_vulnerabilities || [],
          related_assets: res.related_assets || [],
          recommended_actions:
            res.recommended_actions || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            err.message ||
            "AI Assistant unavailable. Ensure backend is running.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-[80] w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-xl transition-all ${
          isOpen
            ? dark
              ? "bg-slate-800 text-white"
              : "bg-slate-900 text-white"
            : "bg-violet-600 hover:bg-violet-700 text-white"
        }`}
        title={isOpen ? "Close assistant" : "Open assistant"}
      >
        {isOpen ? <X size={20} /> : <Shield size={20} />}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div
          className={`fixed z-[70] top-[104px] right-6 w-[400px] max-w-[calc(100vw-32px)] h-[calc(100vh-128px)] max-h-[680px] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
            dark
              ? "bg-[#0f172a] border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Header */}
          <div
            className={`h-[72px] min-h-[72px] px-4 flex items-center justify-between border-b ${
              dark
                ? "border-slate-700 bg-[#111827]"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Shield size={20} className="text-violet-600" />
              </div>

              <div>
                <p
                  className={`text-sm font-bold ${
                    dark ? "text-white" : "text-slate-900"
                  }`}
                >
                  AI SECURITY ASSISTANT
                </p>

                <p
                  className={`text-[10px] mt-1 ${
                    dark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  Context: Live MongoDB Scan Data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[9px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-semibold">
                LOCAL INTEL
              </span>

              <button
                onClick={() => setIsOpen(false)}
                className={
                  dark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-400 hover:text-slate-700"
                }
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Bot
                      size={15}
                      className="text-violet-600"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-xl p-3 border ${
                    msg.sender === "user"
                      ? "bg-violet-600 border-violet-600 text-white"
                      : dark
                        ? "bg-slate-900 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  {msg.sender === "bot" ? (
                    <BotMessage
                      msg={msg}
                      dark={dark}
                    />
                  ) : (
                    <p className="text-[13px]">
                      {msg.text}
                    </p>
                  )}

                  <span
                    className={`block text-[9px] mt-2 text-right ${
                      msg.sender === "user"
                        ? "text-violet-200"
                        : dark
                          ? "text-slate-600"
                          : "text-slate-400"
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-violet-100 flex items-center justify-center">
                    <User
                      size={15}
                      className="text-violet-600"
                    />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div
                className={`text-xs ${
                  dark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                SentinelX is analysing your security data...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div
            className={`shrink-0 px-3 py-2 flex gap-2 overflow-x-auto border-t ${
              dark
                ? "border-slate-700 bg-[#111827]"
                : "border-slate-200 bg-white"
            }`}
          >
            {SUGGESTED_PROMPTS.slice(0, 2).map(
              (prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className={`shrink-0 text-[10px] px-3 py-2 rounded-lg border ${
                    dark
                      ? "border-violet-500/40 text-violet-300 bg-violet-500/10"
                      : "border-violet-200 text-violet-600 bg-violet-50"
                  }`}
                >
                  {prompt}
                </button>
              )
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className={`shrink-0 p-3 flex gap-2 border-t ${
              dark
                ? "border-slate-700 bg-[#0f172a]"
                : "border-slate-200 bg-white"
            }`}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your security posture..."
              disabled={loading}
              className={`flex-1 h-[44px] rounded-xl border px-3 text-sm outline-none ${
                dark
                  ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400"
              }`}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-[44px] h-[44px] shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default AIChatDrawer;
