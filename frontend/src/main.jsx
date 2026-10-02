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
    [project, setProject] = useState(""),
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
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");

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