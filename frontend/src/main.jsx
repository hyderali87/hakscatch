import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Layers,
  FileText,
  ShieldCheck,
  GitBranch,
  Radio,
  Settings,
  ArrowUpRight,
  RefreshCw,
  Search,
  X,
  ChevronRight,
  KeyRound,
  Menu,
  CircleDot,
  LogOut,
  Copy,
  Database,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import "./style.css";
const tabs = [
  ["Overview", Activity],
  ["Traces", Layers],
  ["Logs", FileText],
  ["Evaluations", ShieldCheck],
  ["Drift lab", GitBranch],
  ["Metrics", Radio],
  ["Integration", Settings],
];
const nf = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const date = (s) => new Date(s).toLocaleString();
function Badge({ children, tone = "" }) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Empty({
  text = "No data yet. Send telemetry using the SDK or run the demo seed script.",
}) {
  return (
    <div className="empty">
      <Database size={28} />
      <h3>Nothing here yet</h3>
      <p>{text}</p>
    </div>
  );
}
function App() {
  const [key, setKey] = useState(""),
    [draftKey, setDraftKey] = useState(""),
    [connected, setConnected] = useState(false);
  const [tab, setTab] = useState("Overview"),
    [project, setProject] = useState("demo"),
    [hours, setHours] = useState(24),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [tick, setTick] = useState(0),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [offset, setOffset] = useState(0),
    [detail, setDetail] = useState(null),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState("");
  async function api(path, options = {}) {
    const r = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
        ...options.headers,
      },
    });
    const body = await r.json();
    if (!r.ok)
      throw new Error(
        typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail || body),
      );
    return body;
  }
  const scope = `project=${encodeURIComponent(project)}&hours=${hours}`;
  async function login(e) {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/overview?project=demo", {
        headers: { "X-API-Key": draftKey },
      });
      if (!r.ok)
        throw Error("Connection failed. Check your admin key and API service.");
      setKey(draftKey);
      setDraftKey("");
      setConnected(true);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (!connected) return;
    let active = true;
    setLoading(true);
    setError("");
    const paths = {
      Overview: `overview?${scope}`,
      Traces: `traces?${scope}&q=${encodeURIComponent(query)}&status=${filter}&offset=${offset}`,
      Logs: `logs?${scope}&q=${encodeURIComponent(query)}&level=${filter}&offset=${offset}`,
      Evaluations: `evaluations?${scope}&offset=${offset}`,
      Metrics: `metrics?${scope}`,
      "Drift lab": `baselines?project=${encodeURIComponent(project)}`,
    };
    if (!paths[tab]) {
      setLoading(false);
      return;
    }
    api("/api/" + paths[tab])
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, project, hours, tick, connected, query, filter, offset]);
  function navigate(name) {
    setData(null);
    setTab(name);
    setQuery("");
    setFilter("");
    setOffset(0);
    setDetail(null);
    setMobile(false);
    setNotice("");
  }
  async function openTrace(id) {
    try {
      setDetail(
        await api(
          `/api/traces/${encodeURIComponent(id)}?project=${encodeURIComponent(project)}`,
        ),
      );
    } catch (e) {
      setError(e.message);
    }
  }
  async function evaluate(mode) {
    setBusy(true);
    setError("");
    try {
      await api(
        `/api/traces/${encodeURIComponent(detail.id)}/evaluate?project=${encodeURIComponent(project)}&mode=${mode}`,
        { method: "POST" },
      );
      await openTrace(detail.id);
      setTick((t) => t + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!connected)
    return (
      <main className="login">
        <div className="login-glow" />
        <div className="login-card">
          <div className="logo">
            <span className="mark">
              <Activity />
            </span>
            haks<span>catch</span>
          </div>
          <Badge tone="purple">OPEN SOURCE · AI OBSERVABILITY</Badge>
          <h1>
            See what your
            <br />
            agents are doing.
          </h1>
          <p>
            Traces, evidence, and behavior. One place to understand your AI
            systems.
          </p>
          <form onSubmit={login}>
            <label>Admin API key</label>
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="Paste key from your .env file"
              required
              autoComplete="off"
            />
            <button className="primary">
              Open workspace <ArrowUpRight size={17} />
            </button>
          </form>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          <small>
            <KeyRound size={13} /> Key stays in this tab’s memory. Use HTTPS
            outside localhost.
          </small>
        </div>
      </main>
    );
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="logo">
          <span className="mark">
            <Activity size={22} />
          </span>
          haks<span>catch</span>
        </div>
        <div className="workspace">
          <span className="avatar">HL</span>
          <div>
            HAKS LABS<small>Observability workspace</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <div className="nav-label">OBSERVE & UNDERSTAND</div>
        <nav>
          {tabs.map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              {name}
              {tab === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div>
            <span className="live-dot" /> Self-hosted workspace
          </div>
          <small>hakscatch v0.1 · MIT licensed</small>
          <button
            onClick={() => {
              setConnected(false);
              setKey("");
              setData(null);
              setDetail(null);
            }}
          >
            <LogOut size={15} />
            Disconnect
          </button>
        </div>
      </aside>
      <div className="main">
        <header>
          <button
            className="mobile-toggle icon"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <strong>{tab}</strong>
          </div>
          <div className="header-right">
            <Badge tone="green">API connected</Badge>
            <span className="avatar small">HA</span>
          </div>
        </header>
        <main className="content">
          <div className="page-title">
            <div>
              <div className="eyebrow">AI SYSTEM INTELLIGENCE</div>
              <h1>{tab === "Overview" ? "Your AI, in focus." : tab}</h1>
              <p>
                {
                  {
                    Overview:
                      "A clear view of performance, quality, and behavior.",
                    Traces:
                      "Follow requests through agents, models, and tools.",
                    Logs: "Search the events behind every decision.",
                    Evaluations:
                      "Evidence-grounding checks and model judgments.",
                    "Drift lab":
                      "Compare today’s vectors and agent behavior to a known baseline.",
                    Metrics:
                      "Custom numeric measurements from your applications.",
                    Integration:
                      "Connect your application in a few lines of Python.",
                  }[tab]
                }
              </p>
            </div>
            <button
              className="outline"
              onClick={() => setTick((t) => t + 1)}
              aria-label="Refresh data"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
          <div className="scope">
            <label>
              Project
              <input
                aria-label="Project"
                value={project}
                onChange={(e) => {
                  setProject(e.target.value);
                  setOffset(0);
                  setDetail(null);
                }}
              />
            </label>
            <label>
              Time window
              <select
                aria-label="Time window"
                value={hours}
                onChange={(e) => {
                  setHours(Number(e.target.value));
                  setOffset(0);
                }}
              >
                <option value={24}>Last 24 hours</option>
                <option value={168}>Last 7 days</option>
                <option value={720}>Last 30 days</option>
              </select>
            </label>
            <span>UTC storage · local display</span>
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
              <button
                className="icon"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {notice && <div className="notice">{notice}</div>}
          {loading && !data ? (
            <div className="empty">Loading workspace…</div>
          ) : (
            <>
              {tab === "Overview" && data && (
                <>
                  <div className="kpis">
                    {[
                      [
                        "Total traces",
                        nf.format(data.summary.traces),
                        "Captured requests",
                      ],
                      [
                        "P95 latency",
                        nf.format(data.summary.p95_latency) + " ms",
                        "95th percentile",
                      ],
                      [
                        "Error rate",
                        data.summary.traces
                          ? nf.format(
                              (100 * data.summary.errors) / data.summary.traces,
                            ) + "%"
                          : "—",
                        data.summary.errors + " failed requests",
                      ],
                      [
                        "Tokens processed",
                        nf.format(data.summary.tokens),
                        "Input + output tokens",
                      ],
                    ].map(([title, value, note], i) => (
                      <section className="kpi" key={title}>
                        <div>
                          {title}
                          <span className="kpi-icon">
                            {i === 0 ? (
                              <Layers size={16} />
                            ) : i === 1 ? (
                              <Activity size={16} />
                            ) : i === 2 ? (
                              <ShieldCheck size={16} />
                            ) : (
                              <Radio size={16} />
                            )}
                          </span>
                        </div>
                        <strong>{value}</strong>
                        <small>{note}</small>
                      </section>
                    ))}
                  </div>
                  <section className="panel chart-panel">
                    <div className="panel-head">
                      <div>
                        <h2>Request activity</h2>
                        <p>Hourly throughput across the selected project</p>
                      </div>
                      <Badge tone="purple">● Requests</Badge>
                    </div>
                    {data.series.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={data.series}>
                          <defs>
                            <linearGradient
                              id="purple"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#a58aff"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="100%"
                                stopColor="#a58aff"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#292834" vertical={false} />
                          <XAxis
                            dataKey="time"
                            tickFormatter={(v) =>
                              new Date(v).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            }
                            stroke="#838192"
                            fontSize={11}
                          />
                          <YAxis
                            stroke="#838192"
                            allowDecimals={false}
                            fontSize={11}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#20202c",
                              border: "1px solid #444",
                              borderRadius: 10,
                            }}
                            labelFormatter={date}
                          />
                          <Area
                            type="monotone"
                            dataKey="requests"
                            stroke="#a58aff"
                            strokeWidth={2.5}
                            fill="url(#purple)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty />
                    )}
                  </section>
                  <div className="two-grid">
                    <section className="panel">
                      <div className="panel-head">
                        <h2>Quality starts with evidence</h2>
                        <ShieldCheck color="#b69aff" />
                      </div>
                      <p>
                        Inspect an individual trace, run a grounding check, or
                        request a local LLM judgment.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate("Traces")}
                      >
                        Explore traces <ArrowUpRight size={16} />
                      </button>
                    </section>
                    <section className="panel">
                      <div className="panel-head">
                        <h2>Watch behavior evolve</h2>
                        <GitBranch color="#80dabb" />
                      </div>
                      <p>
                        Compare embedding centroids and agent tool transitions
                        using versioned baselines.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate("Drift lab")}
                      >
                        Open drift lab <ArrowUpRight size={16} />
                      </button>
                    </section>
                  </div>
                </>
              )}
              {(tab === "Traces" || tab === "Logs") && (
                <>
                  <div className="toolbar">
                    <div className="search">
                      <Search size={16} />
                      <input
                        aria-label="Search"
                        placeholder={
                          tab === "Traces"
                            ? "Search name or trace ID"
                            : "Search log words"
                        }
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setOffset(0);
                        }}
                      />
                    </div>
                    <select
                      aria-label="Status filter"
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setOffset(0);
                      }}
                    >
                      <option value="">
                        All {tab === "Traces" ? "statuses" : "levels"}
                      </option>
                      {(tab === "Traces"
                        ? ["ok", "error"]
                        : ["DEBUG", "INFO", "WARN", "ERROR"]
                      ).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {data?.length ? (
                    <div className="panel table-wrap">
                      <table>
                        <thead>
                          <tr>
                            {(tab === "Traces"
                              ? [
                                  "Request",
                                  "Model",
                                  "Status",
                                  "Latency",
                                  "Tokens",
                                  "Received",
                                ]
                              : ["Level", "Message", "Trace", "Received"]
                            ).map((x) => (
                              <th key={x}>{x}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((r) =>
                            tab === "Traces" ? (
                              <tr key={r.id}>
                                <td>
                                  <button
                                    className="trace-link"
                                    onClick={() => openTrace(r.id)}
                                  >
                                    {r.name}
                                    <small>{r.id.slice(0, 18)}…</small>
                                  </button>
                                </td>
                                <td>{r.model}</td>
                                <td>
                                  <Badge
                                    tone={r.status === "ok" ? "green" : "red"}
                                  >
                                    {r.status}
                                  </Badge>
                                </td>
                                <td>{nf.format(r.latency_ms)} ms</td>
                                <td>
                                  {nf.format(r.input_tokens + r.output_tokens)}
                                </td>
                                <td>{date(r.created_at)}</td>
                              </tr>
                            ) : (
                              <tr key={r.id}>
                                <td>
                                  <Badge
                                    tone={
                                      r.level === "ERROR"
                                        ? "red"
                                        : r.level === "WARN"
                                          ? "amber"
                                          : "green"
                                    }
                                  >
                                    {r.level}
                                  </Badge>
                                </td>
                                <td className="log-message">
                                  {r.message}
                                  <details>
                                    <summary>Attributes</summary>
                                    <pre>
                                      {JSON.stringify(r.attributes, null, 2)}
                                    </pre>
                                  </details>
                                </td>
                                <td>
                                  {r.trace_id ? (
                                    <button
                                      className="text-button"
                                      onClick={() => openTrace(r.trace_id)}
                                    >
                                      {r.trace_id.slice(0, 10)}…
                                    </button>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td>{date(r.created_at)}</td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty />
                  )}
                  <Pager
                    offset={offset}
                    count={data?.length || 0}
                    size={tab === "Traces" ? 50 : 100}
                    setOffset={setOffset}
                  />
                </>
              )}
              {tab === "Evaluations" && (
                <>
                  {data?.length ? (
                    <div className="eval-grid">
                      {data.map((e) => (
                        <Evaluation key={e.id} e={e} openTrace={openTrace} />
                      ))}
                    </div>
                  ) : (
                    <Empty text="Open a trace to run a grounding check or an LLM judge evaluation." />
                  )}
                  <Pager
                    offset={offset}
                    count={data?.length || 0}
                    size={100}
                    setOffset={setOffset}
                  />
                </>
              )}
              {tab === "Metrics" &&
                (data?.length ? (
                  <div className="panel table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {[
                            "Metric",
                            "Unit",
                            "Samples",
                            "Mean",
                            "Minimum",
                            "Maximum",
                          ].map((x) => (
                            <th key={x}>{x}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((r) => (
                          <tr key={r.name + r.unit}>
                            <td>{r.name}</td>
                            <td>{r.unit || "—"}</td>
                            <td>{r.samples}</td>
                            <td>{nf.format(r.mean)}</td>
                            <td>{nf.format(r.min)}</td>
                            <td>{nf.format(r.max)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty />
                ))}
              {tab === "Drift lab" && (
                <DriftLab
                  key={project}
                  baselines={data || []}
                  api={api}
                  project={project}
                  refresh={() => setTick((t) => t + 1)}
                  setError={setError}
                />
              )}
              {tab === "Integration" && (
                <div className="two-grid">
                  <section className="panel">
                    <Badge tone="purple">PYTHON SDK</Badge>
                    <h2>Instrument your first request</h2>
                    <p>
                      Install the bundled SDK with{" "}
                      <code>pip install ./sdk</code>. Set HAKSCATCH_URL and
                      HAKSCATCH_INGEST_KEY in your application environment.
                    </p>
                    <pre>{`from hakscatch import Client

hc = Client.from_env(project="${project.replace(/[^a-zA-Z0-9_-]/g, "")}", capture_content=True)
with hc.trace("support-agent", model="local-model") as run:
    run.prompt = "What is the refund policy?"
    run.contexts = ["Refunds are available for 30 days."]
    run.response = "Refunds are available for 30 days."
    run.tools = ["search", "answer"]

hc.metric("retrieval.recall", 0.9, unit="ratio")
hc.log("INFO", "Request completed")`}</pre>
                  </section>
                  <section className="panel">
                    <h2>Your stack, your data</h2>
                    <ul className="guide-list">
                      <li>
                        <strong>React + Vite</strong>
                        <span>Browser dashboard and evaluation workbench</span>
                      </li>
                      <li>
                        <strong>FastAPI + Python</strong>
                        <span>Authenticated JSON ingestion and analytics</span>
                      </li>
                      <li>
                        <strong>PostgreSQL</strong>
                        <span>
                          Persistent traces, logs, metrics, and baselines
                        </span>
                      </li>
                      <li>
                        <strong>Ollama (optional)</strong>
                        <span>Local LLM-as-a-judge, no paid API required</span>
                      </li>
                    </ul>
                    <p>
                      See the included README for Docker and Codespaces setup.
                      The API schema is available at <code>/docs</code> through
                      the backend port (8000).
                    </p>
                    <Badge>Single workspace · projects are filters</Badge>
                  </section>
                </div>
              )}
            </>
          )}
          <footer>
            hakscatch{" "}
            <span>Built by HAKS LABS · Understand every inference.</span>
            <span>Scores are diagnostics, not guarantees.</span>
          </footer>
        </main>
      </div>
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <section
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Trace detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-head">
              <div>
                <div className="eyebrow">TRACE EXPLORER</div>
                <h2>{detail.name}</h2>
              </div>
              <button
                className="icon"
                aria-label="Close trace"
                onClick={() => setDetail(null)}
              >
                <X />
              </button>
            </div>
            <p className="mono">{detail.id}</p>
            <div className="detail-meta">
              <Badge tone={detail.status === "ok" ? "green" : "red"}>
                {detail.status}
              </Badge>
              <span>{detail.model}</span>
              <span>{nf.format(detail.latency_ms)} ms</span>
            </div>
            <h3>Span hierarchy</h3>
            {detail.payload.spans.length ? (
              detail.payload.spans.map((s) => {
                let depth = 0,
                  p = s.parent_id;
                const map = Object.fromEntries(
                  detail.payload.spans.map((x) => [x.id, x]),
                );
                while (p && depth < 10) {
                  depth++;
                  p = map[p]?.parent_id;
                }
                return (
                  <div
                    className="span"
                    key={s.id}
                    style={{ marginLeft: depth * 14 }}
                  >
                    <CircleDot size={13} />
                    <strong>{s.name}</strong>
                    <Badge>{s.kind}</Badge>
                    <span>{s.duration_ms} ms</span>
                    <Badge tone={s.status === "error" ? "red" : "green"}>
                      {s.status}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p>No spans attached.</p>
            )}
            {[
              ["Prompt", detail.payload.prompt],
              ["Response", detail.payload.response],
              ["Evidence contexts", detail.payload.contexts.join("\n\n")],
              ["Tool sequence", detail.payload.tools.join(" → ")],
            ].map(([l, v]) => (
              <div key={l}>
                <h3>{l}</h3>
                <pre>{v || "Not captured"}</pre>
              </div>
            ))}
            <div className="actions">
              <button
                className="primary"
                disabled={busy}
                onClick={() => evaluate("lexical")}
              >
                Run grounding check
              </button>
              <button
                className="outline"
                disabled={busy}
                onClick={() => evaluate("judge")}
              >
                {busy ? "Evaluating…" : "Run LLM judge"}
              </button>
            </div>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            <p className="muted">
              Grounding uses lexical overlap. Judge requires a configured Ollama
              model.
            </p>
            {detail.evaluations.map((e) => (
              <Evaluation key={e.id} e={e} />
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
function Pager({ offset, count, size, setOffset }) {
  return (
    <div className="pager">
      <button
        className="outline"
        disabled={!offset}
        onClick={() => setOffset(Math.max(0, offset - size))}
      >
        Previous
      </button>
      <span>Page {Math.floor(offset / size) + 1}</span>
      <button
        className="outline"
        disabled={count < size}
        onClick={() => setOffset(offset + size)}
      >
        Next
      </button>
    </div>
  );
}
function Evaluation({ e, openTrace }) {
  const r = e.result;
  return (
    <section className="panel evaluation">
      <div className="panel-head">
        <Badge tone="purple">{e.kind.replaceAll("_", " ")}</Badge>
        <small>{date(e.created_at)}</small>
      </div>
      <h3>{r.method}</h3>
      <div className="eval-score">
        {r.status === "insufficient_data"
          ? "Insufficient evidence"
          : r.groundedness !== undefined
            ? `${Math.round(r.groundedness * 100)}% grounded`
            : nf.format(r.score)}
        {r.alert !== undefined && (
          <Badge tone={r.alert ? "amber" : "green"}>
            {r.alert ? "Threshold exceeded" : "Within threshold"}
          </Badge>
        )}
      </div>
      <p>{r.reasoning || r.reason || r.note}</p>
      {r.unsupported_claims?.length > 0 && (
        <ul>
          {r.unsupported_claims.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
      <details>
        <summary>Result details</summary>
        <pre>{JSON.stringify(r, null, 2)}</pre>
      </details>
      {e.trace_id && openTrace && (
        <button className="text-button" onClick={() => openTrace(e.trace_id)}>
          View trace <ArrowUpRight size={14} />
        </button>
      )}
    </section>
  );
}
function DriftLab({ baselines, api, project, refresh, setError }) {
  const [kind, setKind] = useState("vector"),
    [name, setName] = useState("baseline-v1"),
    [space, setSpace] = useState("demo-embedding-v1"),
    [input, setInput] = useState("[[1,0,0],[0.95,0.05,0],[0.9,0.1,0]]"),
    [baseline, setBaseline] = useState(""),
    [threshold, setThreshold] = useState(0.2),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  async function submit(compare) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      let samples = JSON.parse(input);
      const payload = {
        project,
        name,
        kind,
        embedding_space: kind === "vector" ? space : "",
        vectors: kind === "vector" ? samples : [],
        tool_sequences: kind === "agent" ? samples : [],
      };
      if (compare) {
        payload.baseline_id = Number(baseline);
        payload.threshold = Number(threshold);
        setResult(
          await api("/api/drift", {
            method: "POST",
            body: JSON.stringify(payload),
          }),
        );
      } else {
        const b = await api("/api/baselines", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setBaseline(String(b.id));
        setNote("Baseline saved. Paste current samples, then compare.");
        refresh();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="two-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>Baseline workbench</h2>
          <GitBranch size={20} />
        </div>
        <label>
          Signal
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setBaseline("");
              setResult(null);
              setInput(
                e.target.value === "vector"
                  ? "[[1,0,0],[0.95,0.05,0],[0.9,0.1,0]]"
                  : '[["search","answer"],["search","answer"]',
              );
            }}
          >
            <option value="vector">Vector drift</option>
            <option value="agent">Agent drift</option>
          </select>
        </label>
        <label>
          Baseline / sample name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {kind === "vector" && (
          <label>
            Embedding space identifier
            <input value={space} onChange={(e) => setSpace(e.target.value)} />
          </label>
        )}
        <label>
          {kind === "vector"
            ? "Embedding vectors (JSON array)"
            : "Tool sequences (JSON array)"}
          <textarea
            rows={7}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <p className="muted">
          Example values are synthetic. Supply at least 2 samples; larger
          representative windows give more useful diagnostics.
        </p>
        <button
          className="outline"
          disabled={busy}
          onClick={() => submit(false)}
        >
          Save as new baseline
        </button>
        {note && <p className="notice">{note}</p>}
      </section>
      <section className="panel">
        <h2>Compare a current window</h2>
        <p>
          Save a baseline first. Then replace the JSON samples with your current
          window and run a comparison.
        </p>
        <label>
          Reference baseline
          <select
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
          >
            <option value="">Select baseline</option>
            {baselines
              .filter((b) => b.kind === kind)
              .map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name} · #{b.id}
                </option>
              ))}
          </select>
        </label>
        <label>
          Alert threshold (0–1)
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </label>
        <button
          className="primary"
          disabled={busy || !baseline}
          onClick={() => submit(true)}
        >
          {busy ? "Working…" : "Compare samples"}
          <ArrowUpRight size={16} />
        </button>
        <div className="method-note">
          <h3>
            {kind === "vector"
              ? "Normalized centroid shift"
              : "Tool-transition divergence"}
          </h3>
          <p>
            {kind === "vector"
              ? "Compares mean directions of normalized vectors. Embedding model, dimensions, version, and preprocessing must match."
              : "Jensen–Shannon divergence compares adjacent tool transitions, including start and end states. It detects behavior changes, not whether they are harmful."}
          </p>
        </div>
        {result && <Evaluation e={result} />}
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
