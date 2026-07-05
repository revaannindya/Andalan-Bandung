import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Boxes, ArrowDownCircle, ArrowUpCircle, History as HistoryIcon,
  FileBarChart2, Settings as SettingsIcon, Search, Plus, Pencil, Trash2, Download,
  Upload, Moon, Sun, X, ChevronDown, ArrowUpDown, AlertTriangle, PackageX, Package,
  Palette, TrendingUp, TrendingDown, Menu, Save, RotateCcw, Database, ImageIcon,
  CheckCircle2, XCircle, Info, ArrowUp, ArrowDown, FileDown, RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";

/* ============================================================================
   CONSTANTS
============================================================================ */

const SIZES = ["S", "M", "L", "XL", "XXL"];

const STORAGE_KEYS = {
  colors: "ab:colors",
  transactions: "ab:transactions",
  settings: "ab:settings",
  backups: "ab:backups:index",
};

const SEED_COLORS = [
  { id: "c-black", name: "Black", hex: "#1c1c1c", sizes: { S: 24, M: 40, L: 35, XL: 18, XXL: 6 }, lastUpdated: new Date().toISOString() },
  { id: "c-white", name: "White", hex: "#f4f4f2", sizes: { S: 30, M: 45, L: 38, XL: 20, XXL: 10 }, lastUpdated: new Date().toISOString() },
  { id: "c-navy", name: "Navy", hex: "#1e3a5f", sizes: { S: 8, M: 6, L: 4, XL: 2, XXL: 0 }, lastUpdated: new Date().toISOString() },
  { id: "c-maroon", name: "Maroon", hex: "#6b1f2a", sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, lastUpdated: new Date().toISOString() },
  { id: "c-army", name: "Army Green", hex: "#4b5320", sizes: { S: 15, M: 22, L: 20, XL: 9, XXL: 3 }, lastUpdated: new Date().toISOString() },
];

const DEFAULT_SETTINGS = {
  businessName: "ANDALAN BANDUNG",
  subtitle: "Kaos Polos Inventory Management",
  logo: null,
  lowStockThreshold: 10,
};

const CHART_COLORS = ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2", "#B7E4C7"];

/* ============================================================================
   UTILITIES
============================================================================ */

const uid = (p = "id") => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const cx = (...args) => args.filter(Boolean).join(" ");

const calcTotal = (sizes) => SIZES.reduce((sum, s) => sum + (Number(sizes[s]) || 0), 0);

const getStatus = (total, threshold) => {
  if (total <= 0) return "out";
  if (total <= threshold) return "low";
  return "in";
};

const statusMeta = {
  out: { label: "Out of Stock", color: "#DC2626", bg: "#FEE2E2", bgDark: "#3f1d1d" },
  low: { label: "Low Stock", color: "#D97706", bg: "#FEF3C7", bgDark: "#3f2d0f" },
  in: { label: "In Stock", color: "#1B4332", bg: "#D1FAE0", bgDark: "#0f2a1c" },
};

const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const isSameDay = (iso, dateStr) => (iso || "").slice(0, 10) === dateStr;

const fmtNum = (n) => (Number(n) || 0).toLocaleString("en-US");

/* ============================================================================
   TOAST SYSTEM
============================================================================ */

const ToastContext = React.createContext(null);

function ToastProvider({ children, dark }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "success") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  };
  const colors = {
    success: { bg: dark ? "#0f2a1c" : "#ECFDF3", border: "#52B788", text: dark ? "#95D5B2" : "#1B4332" },
    error: { bg: dark ? "#3f1d1d" : "#FEF2F2", border: "#DC2626", text: dark ? "#FCA5A5" : "#991B1B" },
    info: { bg: dark ? "#0f2333" : "#EFF6FF", border: "#3B82F6", text: dark ? "#93C5FD" : "#1E40AF" },
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm">
        {toasts.map((t) => {
          const c = colors[t.type];
          return (
            <div
              key={t.id}
              style={{ background: c.bg, borderColor: c.border, color: c.text }}
              className="flex items-start gap-2.5 rounded-xl border-l-4 shadow-lg px-4 py-3 animate-[toastIn_0.25s_ease-out]"
            >
              <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
              <div className="text-sm font-medium leading-snug flex-1">{t.message}</div>
              <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      `}</style>
    </ToastContext.Provider>
  );
}

function useToast() {
  return React.useContext(ToastContext);
}

/* ============================================================================
   CONFIRM DIALOG
============================================================================ */

function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel, dark }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4" style={{ animation: "fadeIn 0.15s ease-out" }}>
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className={cx(
          "relative w-full max-w-sm rounded-2xl p-5 shadow-2xl",
          dark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
        )}
        style={{ animation: "scaleIn 0.15s ease-out" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={cx("p-2 rounded-full", danger ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700")}>
            <AlertTriangle size={18} />
          </div>
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <p className={cx("text-sm mb-5", dark ? "text-gray-300" : "text-gray-600")}>{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={cx(
              "px-4 py-2 rounded-lg text-sm font-medium transition",
              dark ? "bg-gray-700 hover:bg-gray-600 text-gray-100" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cx(
              "px-4 py-2 rounded-lg text-sm font-medium text-white transition",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-700 hover:bg-emerald-800"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SMALL UI PRIMITIVES
============================================================================ */

function Card({ children, className, dark, padded = true }) {
  return (
    <div
      className={cx(
        "rounded-2xl border shadow-sm",
        dark ? "bg-gray-800/70 border-gray-700" : "bg-white border-gray-100",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function Badge({ status }) {
  const m = statusMeta[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: m.color, background: m.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function Skeleton({ className, dark }) {
  return (
    <div
      className={cx("rounded-lg", dark ? "bg-gray-700" : "bg-gray-200", className)}
      style={{
        backgroundImage: `linear-gradient(90deg, transparent, ${dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}, transparent)`,
        backgroundSize: "400px 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs opacity-60">{hint}</span>}
    </label>
  );
}

function inputCls(dark) {
  return cx(
    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/40",
    dark
      ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-500"
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500"
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 overflow-y-auto" style={{ animation: "fadeIn 0.15s ease-out" }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cx(
          "relative w-full rounded-2xl shadow-2xl my-auto modal-surface",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        style={{ animation: "scaleIn 0.18s ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b modal-header">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================================
   PERSISTENCE HOOK (shared storage acts as our real-time-ish backend)
============================================================================ */

function useSharedState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const latestRef = useRef(value);
  latestRef.current = value;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(key, true);
        if (!cancelled && res && res.value != null) {
          setValue(JSON.parse(res.value));
        } else if (!cancelled) {
          await window.storage.set(key, JSON.stringify(initialValue), true);
          setValue(initialValue);
        }
      } catch (e) {
        try {
          await window.storage.set(key, JSON.stringify(initialValue), true);
        } catch (e2) {}
        if (!cancelled) setValue(initialValue);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback(async (next) => {
    setValue(next);
    try {
      await window.storage.set(key, JSON.stringify(next), true);
    } catch (e) {
      console.error("storage set failed", e);
    }
  }, [key]);

  // Poll for changes from other sessions/tabs to simulate real-time sync
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await window.storage.get(key, true);
        if (res && res.value != null) {
          const remote = JSON.stringify(JSON.parse(res.value));
          const local = JSON.stringify(latestRef.current);
          if (remote !== local) {
            setValue(JSON.parse(res.value));
          }
        }
      } catch (e) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [key]);

  return [value, persist, loaded];
}

/* ============================================================================
   SIDEBAR / NAV
============================================================================ */

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "stockin", label: "Stock In", icon: ArrowDownCircle },
  { id: "stockout", label: "Stock Out", icon: ArrowUpCircle },
  { id: "transactions", label: "Transactions", icon: HistoryIcon },
  { id: "reports", label: "Reports", icon: FileBarChart2 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function Sidebar({ active, setActive, dark, settings, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={cx(
          "fixed lg:sticky top-0 h-screen z-40 flex flex-col border-r transition-all duration-200",
          dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100",
          collapsed ? "w-[76px]" : "w-64",
          mobileOpen ? "left-0" : "-left-72 lg:left-0"
        )}
      >
        <div className={cx("flex items-center gap-3 px-4 h-16 border-b shrink-0", dark ? "border-gray-800" : "border-gray-100")}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg,#1B4332,#40916C)" }}
          >
            {settings.logo ? (
              <img src={settings.logo} alt="logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              "AB"
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className={cx("font-bold text-sm leading-tight truncate", dark ? "text-white" : "text-gray-900")}>
                {settings.businessName}
              </div>
              <div className="text-[11px] opacity-60 truncate">{settings.subtitle}</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActive(item.id); setMobileOpen(false); }}
                className={cx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "text-white shadow-md"
                    : dark ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-900"
                )}
                style={isActive ? { background: "linear-gradient(135deg,#1B4332,#2D6A4F)" } : {}}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cx(
            "hidden lg:flex items-center justify-center gap-2 mx-3 mb-4 py-2 rounded-xl text-xs font-medium transition",
            dark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          )}
        >
          <Menu size={14} />
          {!collapsed && "Collapse"}
        </button>
      </aside>
    </>
  );
}

/* ============================================================================
   TOPBAR
============================================================================ */

function Topbar({ dark, setDark, settings, setMobileOpen, syncedAt }) {
  return (
    <div className={cx(
      "sticky top-0 z-20 flex items-center justify-between gap-3 px-4 lg:px-6 h-16 border-b backdrop-blur",
      dark ? "bg-gray-900/85 border-gray-800" : "bg-white/85 border-gray-100"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <button className="lg:hidden p-2 rounded-lg hover:bg-black/5" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{settings.businessName}</div>
          <div className="flex items-center gap-1.5 text-[11px] opacity-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Synced {syncedAt}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDark((d) => !d)}
          className={cx(
            "p-2.5 rounded-xl transition",
            dark ? "bg-gray-800 text-amber-300 hover:bg-gray-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          )}
          title="Toggle dark mode"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   DASHBOARD STAT CARD
============================================================================ */

function StatCard({ label, value, icon: Icon, dark, tint, sub }) {
  const tints = {
    green: { bg: dark ? "#0f2a1c" : "#ECFDF3", fg: "#1B4332" },
    blue: { bg: dark ? "#0f2333" : "#EFF6FF", fg: "#1E40AF" },
    amber: { bg: dark ? "#3f2d0f" : "#FFFBEB", fg: "#B45309" },
    red: { bg: dark ? "#3f1d1d" : "#FEF2F2", fg: "#B91C1C" },
    purple: { bg: dark ? "#2a1a3f" : "#F5F3FF", fg: "#6D28D9" },
    teal: { bg: dark ? "#0f2a2a" : "#ECFEFF", fg: "#0E7490" },
  };
  const t = tints[tint] || tints.green;
  return (
    <Card dark={dark} className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.fg }}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <div className={cx("text-xs font-medium opacity-60", dark && "text-gray-300")}>{label}</div>
        <div className={cx("text-2xl font-bold tabular-nums", dark ? "text-white" : "text-gray-900")} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {value}
        </div>
        {sub && <div className="text-[11px] opacity-50 mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

/* ============================================================================
   MAIN APP
============================================================================ */

export default function App() {
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [syncedAt, setSyncedAt] = useState("just now");

  const [colors, setColors, colorsLoaded] = useSharedState(STORAGE_KEYS.colors, SEED_COLORS);
  const [transactions, setTransactions, txLoaded] = useSharedState(STORAGE_KEYS.transactions, []);
  const [settings, setSettings, settingsLoaded] = useSharedState(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

  const loaded = colorsLoaded && txLoaded && settingsLoaded;

  useEffect(() => {
    const t = setInterval(() => setSyncedAt("just now"), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <ToastProvider dark={dark}>
      <div className={cx("min-h-screen w-full flex", dark ? "dark bg-gray-950 text-gray-100" : "bg-[#F7F9F7] text-gray-900")}>
        <GlobalStyle dark={dark} />
        <Sidebar
          active={active} setActive={setActive} dark={dark} settings={settings}
          collapsed={collapsed} setCollapsed={setCollapsed}
          mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar dark={dark} setDark={setDark} settings={settings} setMobileOpen={setMobileOpen} syncedAt={syncedAt} />
          <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
            {!loaded ? (
              <LoadingSkeletons dark={dark} />
            ) : (
              <>
                {active === "dashboard" && (
                  <Dashboard colors={colors} transactions={transactions} settings={settings} dark={dark} setActive={setActive} />
                )}
                {active === "inventory" && (
                  <Inventory colors={colors} setColors={setColors} transactions={transactions} setTransactions={setTransactions} settings={settings} dark={dark} />
                )}
                {active === "stockin" && (
                  <StockForm mode="in" colors={colors} setColors={setColors} transactions={transactions} setTransactions={setTransactions} dark={dark} />
                )}
                {active === "stockout" && (
                  <StockForm mode="out" colors={colors} setColors={setColors} transactions={transactions} setTransactions={setTransactions} dark={dark} />
                )}
                {active === "transactions" && (
                  <Transactions transactions={transactions} settings={settings} dark={dark} />
                )}
                {active === "reports" && (
                  <Reports colors={colors} transactions={transactions} settings={settings} dark={dark} />
                )}
                {active === "settings" && (
                  <SettingsPage
                    settings={settings} setSettings={setSettings}
                    colors={colors} setColors={setColors}
                    transactions={transactions} setTransactions={setTransactions}
                    dark={dark}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

function GlobalStyle({ dark }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      * { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }
      body { margin: 0; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: ${dark ? "#374151" : "#D1D5DB"}; border-radius: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      .modal-surface { background: ${dark ? "#1f2937" : "#ffffff"}; color: ${dark ? "#f3f4f6" : "#111827"}; }
      .modal-header { border-color: ${dark ? "#374151" : "#f3f4f6"}; }
      table { border-collapse: separate; border-spacing: 0; }
    `}</style>
  );
}

function LoadingSkeletons({ dark }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} dark={dark} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton dark={dark} className="h-72 lg:col-span-2" />
        <Skeleton dark={dark} className="h-72" />
      </div>
    </div>
  );
}

/* ============================================================================
   DASHBOARD
============================================================================ */

function Dashboard({ colors, transactions, settings, dark, setActive }) {
  const totalStock = useMemo(() => colors.reduce((s, c) => s + calcTotal(c.sizes), 0), [colors]);
  const totalColors = colors.length;
  const today = todayISO();

  const stockInToday = useMemo(
    () => transactions.filter((t) => t.type === "in" && isSameDay(t.date, today)).reduce((s, t) => s + Number(t.qty || 0), 0),
    [transactions, today]
  );
  const stockOutToday = useMemo(
    () => transactions.filter((t) => t.type === "out" && isSameDay(t.date, today)).reduce((s, t) => s + Number(t.qty || 0), 0),
    [transactions, today]
  );

  const rows = useMemo(() => colors.map((c) => ({ ...c, total: calcTotal(c.sizes), status: getStatus(calcTotal(c.sizes), settings.lowStockThreshold) })), [colors, settings.lowStockThreshold]);
  const lowStock = rows.filter((r) => r.status === "low");
  const outOfStock = rows.filter((r) => r.status === "out");

  const recentTx = useMemo(() => [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6), [transactions]);

  const stockByColor = rows.map((r) => ({ name: r.name, value: r.total, fill: r.hex || "#52B788" }));
  const stockBySize = SIZES.map((s) => ({ name: s, value: colors.reduce((sum, c) => sum + (Number(c.sizes[s]) || 0), 0) }));

  const movement = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const inQty = transactions.filter((t) => t.type === "in" && isSameDay(t.date, key)).reduce((s, t) => s + Number(t.qty || 0), 0);
      const outQty = transactions.filter((t) => t.type === "out" && isSameDay(t.date, key)).reduce((s, t) => s + Number(t.qty || 0), 0);
      days.push({ date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), in: inQty, out: outQty });
    }
    return days;
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm opacity-60 mt-0.5">Overview of your kaos polos inventory</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Stock" value={fmtNum(totalStock)} icon={Package} dark={dark} tint="green" sub="pcs across all colors" />
        <StatCard label="Total Colors" value={totalColors} icon={Palette} dark={dark} tint="purple" sub="active variants" />
        <StatCard label="Stock In Today" value={fmtNum(stockInToday)} icon={TrendingUp} dark={dark} tint="blue" sub="pcs received" />
        <StatCard label="Stock Out Today" value={fmtNum(stockOutToday)} icon={TrendingDown} dark={dark} tint="teal" sub="pcs shipped" />
        <StatCard label="Low Stock" value={lowStock.length} icon={AlertTriangle} dark={dark} tint="amber" sub="colors need restock" />
        <StatCard label="Out of Stock" value={outOfStock.length} icon={PackageX} dark={dark} tint="red" sub="colors unavailable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card dark={dark} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Stock Movement (30 days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={movement}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#F3F4F6"} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} stroke={dark ? "#9CA3AF" : "#9CA3AF"} />
              <YAxis tick={{ fontSize: 10 }} stroke={dark ? "#9CA3AF" : "#9CA3AF"} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, background: dark ? "#1f2937" : "#fff", color: dark ? "#fff" : "#111" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="in" name="Stock In" stroke="#2D6A4F" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="out" name="Stock Out" stroke="#DC2626" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card dark={dark}>
          <h3 className="font-semibold text-sm mb-4">Stock by Size</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stockBySize}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#F3F4F6"} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={dark ? "#9CA3AF" : "#9CA3AF"} />
              <YAxis tick={{ fontSize: 10 }} stroke={dark ? "#9CA3AF" : "#9CA3AF"} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, background: dark ? "#1f2937" : "#fff", color: dark ? "#fff" : "#111" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2D6A4F" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card dark={dark}>
          <h3 className="font-semibold text-sm mb-4">Stock by Color</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stockByColor} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {stockByColor.map((entry, i) => <Cell key={i} fill={entry.fill} stroke={dark ? "#1f2937" : "#fff"} strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, background: dark ? "#1f2937" : "#fff", color: dark ? "#fff" : "#111" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card dark={dark}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Recent Transactions</h3>
            <button onClick={() => setActive("transactions")} className="text-xs font-medium text-emerald-600 hover:underline">View all</button>
          </div>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {recentTx.length === 0 && <EmptyRow dark={dark} text="No transactions yet." />}
            {recentTx.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <div className={cx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", t.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                  {t.type === "in" ? <ArrowDownCircle size={15} /> : <ArrowUpCircle size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{t.color} &middot; {t.size}</div>
                  <div className="text-[11px] opacity-50">{fmtDate(t.date)}</div>
                </div>
                <div className={cx("font-semibold tabular-nums", t.type === "in" ? "text-emerald-600" : "text-red-600")}>
                  {t.type === "in" ? "+" : "-"}{t.qty}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card dark={dark}>
          <h3 className="font-semibold text-sm mb-3">Needs Attention</h3>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {outOfStock.length === 0 && lowStock.length === 0 && <EmptyRow dark={dark} text="All colors are healthy!" />}
            {outOfStock.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0 border" style={{ background: c.hex }} />
                  <span className="truncate font-medium">{c.name}</span>
                </div>
                <Badge status="out" />
              </div>
            ))}
            {lowStock.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0 border" style={{ background: c.hex }} />
                  <span className="truncate font-medium">{c.name}</span>
                </div>
                <span className="text-xs opacity-60">{c.total} pcs</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyRow({ text, dark }) {
  return <div className={cx("text-sm text-center py-6 opacity-50")}>{text}</div>;
}

/* ============================================================================
   INVENTORY
============================================================================ */

function Inventory({ colors, setColors, transactions, setTransactions, settings, dark }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showAdd, setShowAdd] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const rows = useMemo(() => {
    let r = colors.map((c) => ({ ...c, total: calcTotal(c.sizes), status: getStatus(calcTotal(c.sizes), settings.lowStockThreshold) }));
    if (search.trim()) r = r.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (statusFilter !== "all") r = r.filter((c) => c.status === statusFilter);
    if (sortBy === "highest") r = [...r].sort((a, b) => b.total - a.total);
    else if (sortBy === "lowest") r = [...r].sort((a, b) => a.total - b.total);
    else r = [...r].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    return r;
  }, [colors, search, statusFilter, sortBy, settings.lowStockThreshold]);

  const handleAddColor = (data) => {
    if (colors.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) {
      toast("A color with this name already exists.", "error");
      return false;
    }
    const newColor = { id: uid("c"), name: data.name, hex: data.hex, sizes: data.sizes, lastUpdated: new Date().toISOString() };
    setColors([...colors, newColor]);
    toast(`${data.name} added to inventory.`, "success");
    setShowAdd(false);
    return true;
  };

  const handleEditStock = (id, newSizes) => {
    setColors(colors.map((c) => (c.id === id ? { ...c, sizes: newSizes, lastUpdated: new Date().toISOString() } : c)));
    toast("Stock manually updated.", "success");
    setEditRow(null);
  };

  const handleDelete = () => {
    setColors(colors.filter((c) => c.id !== deleteRow.id));
    toast(`${deleteRow.name} removed from inventory.`, "success");
    setDeleteRow(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm opacity-60 mt-0.5">Manage colors, sizes, and stock levels</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition"
          style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)" }}
        >
          <Plus size={16} /> Add New Color
        </button>
      </div>

      <Card dark={dark} padded={false}>
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center border-b" style={{ borderColor: dark ? "#374151" : "#F3F4F6" }}>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by color name..." className={cx(inputCls(dark), "pl-9")} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls(dark) + " md:w-48"}>
            <option value="all">All Statuses</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputCls(dark) + " md:w-52"}>
            <option value="recent">Sort: Recently Updated</option>
            <option value="highest">Sort: Highest Stock</option>
            <option value="lowest">Sort: Lowest Stock</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cx("text-left text-xs uppercase tracking-wide opacity-50", dark ? "bg-gray-800/40" : "bg-gray-50/60")}>
                <th className="px-4 py-3 font-semibold">Color</th>
                {SIZES.map((s) => <th key={s} className="px-3 py-3 font-semibold text-center">{s}</th>)}
                <th className="px-3 py-3 font-semibold text-center">Total</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Last Updated</th>
                <th className="px-3 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center opacity-50">No colors match your filters.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className={cx("border-t transition", dark ? "border-gray-800 hover:bg-gray-800/40" : "border-gray-50 hover:bg-emerald-50/40")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full border shrink-0" style={{ background: row.hex }} />
                      <span className="font-medium">{row.name}</span>
                    </div>
                  </td>
                  {SIZES.map((s) => (
                    <td key={s} className="px-3 py-3 text-center tabular-nums opacity-80">{row.sizes[s] || 0}</td>
                  ))}
                  <td className="px-3 py-3 text-center font-bold tabular-nums">{row.total}</td>
                  <td className="px-3 py-3"><Badge status={row.status} /></td>
                  <td className="px-3 py-3 text-xs opacity-60 whitespace-nowrap">{fmtDate(row.lastUpdated)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setEditRow(row)} className={cx("p-2 rounded-lg", dark ? "hover:bg-gray-700" : "hover:bg-gray-100")} title="Edit stock manually">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteRow(row)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete color">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddColorModal open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddColor} dark={dark} />
      <EditStockModal row={editRow} onClose={() => setEditRow(null)} onSave={handleEditStock} dark={dark} />
      <ConfirmDialog
        open={!!deleteRow}
        title="Delete color?"
        message={`This will permanently remove "${deleteRow?.name}" and its stock from inventory. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteRow(null)}
        dark={dark}
      />
    </div>
  );
}

function AddColorModal({ open, onClose, onSave, dark }) {
  const blank = { name: "", hex: "#2D6A4F", sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } };
  const [data, setData] = useState(blank);

  useEffect(() => { if (open) setData(blank); }, [open]); // eslint-disable-line

  const total = calcTotal(data.sizes);

  const submit = () => {
    if (!data.name.trim()) return;
    const ok = onSave({ ...data, name: data.name.trim() });
    if (ok) setData(blank);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Color">
      <div className="space-y-4">
        <Field label="Color Name">
          <input autoFocus value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g. Charcoal" className={inputCls(dark)} />
        </Field>
        <Field label="Swatch">
          <input type="color" value={data.hex} onChange={(e) => setData({ ...data, hex: e.target.value })} className="h-10 w-16 rounded-lg border cursor-pointer" />
        </Field>
        <div>
          <div className="font-medium text-sm mb-2">Initial Stock</div>
          <div className="grid grid-cols-5 gap-2">
            {SIZES.map((s) => (
              <div key={s}>
                <div className="text-xs text-center opacity-60 mb-1">{s}</div>
                <input
                  type="number" min={0} value={data.sizes[s]}
                  onChange={(e) => setData({ ...data, sizes: { ...data.sizes, [s]: Math.max(0, Number(e.target.value) || 0) } })}
                  className={inputCls(dark) + " text-center"}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={cx("flex items-center justify-between rounded-xl px-4 py-3", dark ? "bg-gray-900" : "bg-emerald-50")}>
          <span className="text-sm font-medium">Total Stock</span>
          <span className="text-lg font-bold tabular-nums" style={{ color: "#1B4332" }}>{total}</span>
        </div>
        <button disabled={!data.name.trim()} onClick={submit} className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-40 transition" style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)" }}>
          Save Color
        </button>
      </div>
    </Modal>
  );
}

function EditStockModal({ row, onClose, onSave, dark }) {
  const [sizes, setSizes] = useState({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
  useEffect(() => { if (row) setSizes(row.sizes); }, [row]);
  if (!row) return null;
  const total = calcTotal(sizes);
  return (
    <Modal open={!!row} onClose={onClose} title={`Edit Stock — ${row.name}`}>
      <div className="space-y-4">
        <div className={cx("text-xs rounded-lg px-3 py-2", dark ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-700")}>
          Manual edits should be used only when absolutely necessary. Prefer Stock In / Stock Out for regular changes.
        </div>
        <div className="grid grid-cols-5 gap-2">
          {SIZES.map((s) => (
            <div key={s}>
              <div className="text-xs text-center opacity-60 mb-1">{s}</div>
              <input
                type="number" min={0} value={sizes[s]}
                onChange={(e) => setSizes({ ...sizes, [s]: Math.max(0, Number(e.target.value) || 0) })}
                className={inputCls(dark) + " text-center"}
              />
            </div>
          ))}
        </div>
        <div className={cx("flex items-center justify-between rounded-xl px-4 py-3", dark ? "bg-gray-900" : "bg-emerald-50")}>
          <span className="text-sm font-medium">Total Stock</span>
          <span className="text-lg font-bold tabular-nums" style={{ color: "#1B4332" }}>{total}</span>
        </div>
        <button onClick={() => onSave(row.id, sizes)} className="w-full py-2.5 rounded-xl text-white font-semibold" style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)" }}>
          <span className="inline-flex items-center gap-2"><Save size={16} /> Save Changes</span>
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================================
   STOCK IN / STOCK OUT FORM
============================================================================ */

function StockForm({ mode, colors, setColors, transactions, setTransactions, dark }) {
  const toast = useToast();
  const isIn = mode === "in";
  const [form, setForm] = useState({ date: todayISO(), color: colors[0]?.name || "", size: "S", qty: "", party: "", notes: "" });

  useEffect(() => {
    if (!form.color && colors.length) setForm((f) => ({ ...f, color: colors[0].name }));
    // eslint-disable-next-line
  }, [colors]);

  const selectedColor = colors.find((c) => c.name === form.color);
  const availableForSize = selectedColor ? selectedColor.sizes[form.size] || 0 : 0;

  const reset = () => setForm({ date: todayISO(), color: colors[0]?.name || "", size: "S", qty: "", party: "", notes: "" });

  const submit = () => {
    const qty = Number(form.qty);
    if (!form.color) { toast("Please select a color.", "error"); return; }
    if (!qty || qty <= 0) { toast("Quantity must be greater than zero.", "error"); return; }
    if (!isIn && qty > availableForSize) {
      toast(`Not enough stock. Only ${availableForSize} pcs of ${form.color} (${form.size}) available.`, "error");
      return;
    }

    const colorObj = colors.find((c) => c.name === form.color);
    const newSizes = { ...colorObj.sizes };
    newSizes[form.size] = (Number(newSizes[form.size]) || 0) + (isIn ? qty : -qty);

    setColors(colors.map((c) => (c.id === colorObj.id ? { ...c, sizes: newSizes, lastUpdated: new Date().toISOString() } : c)));

    const tx = {
      id: uid("tx"),
      date: form.date,
      type: isIn ? "in" : "out",
      color: form.color,
      size: form.size,
      qty,
      party: form.party || (isIn ? "—" : "—"),
      notes: form.notes,
      timestamp: new Date().toISOString(),
    };
    setTransactions([tx, ...transactions]);
    toast(`${isIn ? "Stock in" : "Stock out"} recorded: ${qty} pcs ${form.color} (${form.size}).`, "success");
    reset();
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {isIn ? <ArrowDownCircle className="text-emerald-600" /> : <ArrowUpCircle className="text-red-500" />}
          {isIn ? "Stock In" : "Stock Out"}
        </h1>
        <p className="text-sm opacity-60 mt-0.5">
          {isIn ? "Record incoming stock from a supplier." : "Record outgoing stock to a customer."}
        </p>
      </div>

      <Card dark={dark}>
        <div className="space-y-4">
          <Field label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls(dark)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Color">
              <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={inputCls(dark)}>
                {colors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Size">
              <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={inputCls(dark)}>
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Quantity" hint={!isIn ? `Available: ${availableForSize} pcs` : undefined}>
            <input type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" className={inputCls(dark)} />
          </Field>
          <Field label={isIn ? "Supplier" : "Customer"}>
            <input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder={isIn ? "e.g. CV Konveksi Jaya" : "e.g. Toko Baju Rina"} className={inputCls(dark)} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Optional notes..." className={inputCls(dark)} />
          </Field>
          <button
            onClick={submit}
            className="w-full py-2.5 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition"
            style={{ background: isIn ? "linear-gradient(135deg,#1B4332,#2D6A4F)" : "linear-gradient(135deg,#7f1d1d,#b91c1c)" }}
          >
            Save {isIn ? "Stock In" : "Stock Out"}
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   TRANSACTIONS
============================================================================ */

function Transactions({ transactions, settings, dark }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const rows = useMemo(() => {
    let r = [...transactions];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((t) => t.color.toLowerCase().includes(q) || (t.party || "").toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q));
    }
    if (typeFilter !== "all") r = r.filter((t) => t.type === typeFilter);
    r.sort((a, b) => sortBy === "newest" ? new Date(b.timestamp) - new Date(a.timestamp) : new Date(a.timestamp) - new Date(b.timestamp));
    return r;
  }, [transactions, search, typeFilter, sortBy]);

  const exportExcel = () => {
    const data = rows.map((t) => ({
      Date: fmtDate(t.date),
      Type: t.type === "in" ? "Stock In" : "Stock Out",
      Color: t.color,
      Size: t.size,
      Quantity: t.qty,
      "Supplier/Customer": t.party,
      Notes: t.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `${settings.businessName.replace(/\s+/g, "_")}_Transactions_${todayISO()}.xlsx`);
  };

  const exportPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rowsHtml = rows.map((t) => `
      <tr>
        <td>${fmtDate(t.date)}</td>
        <td>${t.type === "in" ? "Stock In" : "Stock Out"}</td>
        <td>${t.color}</td>
        <td>${t.size}</td>
        <td style="text-align:right">${t.qty}</td>
        <td>${t.party || "-"}</td>
        <td>${t.notes || "-"}</td>
      </tr>`).join("");
    win.document.write(`
      <html><head><title>Transaction History</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111}
        h1{color:#1B4332;margin-bottom:0}
        p{color:#666;margin-top:4px}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#1B4332;color:#fff}
      </style></head><body>
      <h1>${settings.businessName}</h1>
      <p>Transaction History — Generated ${fmtDate(new Date().toISOString())}</p>
      <table><thead><tr><th>Date</th><th>Type</th><th>Color</th><th>Size</th><th>Qty</th><th>Supplier/Customer</th><th>Notes</th></tr></thead>
      <tbody>${rowsHtml}</tbody></table>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-sm opacity-60 mt-0.5">All stock movements in one place</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className={cx("inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium", dark ? "bg-gray-800 hover:bg-gray-700" : "bg-white border border-gray-200 hover:bg-gray-50")}>
            <FileDown size={16} /> Excel
          </button>
          <button onClick={exportPDF} className={cx("inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium", dark ? "bg-gray-800 hover:bg-gray-700" : "bg-white border border-gray-200 hover:bg-gray-50")}>
            <FileDown size={16} /> PDF
          </button>
        </div>
      </div>

      <Card dark={dark} padded={false}>
        <div className="p-4 flex flex-col md:flex-row gap-3 border-b" style={{ borderColor: dark ? "#374151" : "#F3F4F6" }}>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search color, party, notes..." className={cx(inputCls(dark), "pl-9")} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputCls(dark) + " md:w-44"}>
            <option value="all">All Types</option>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputCls(dark) + " md:w-44"}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cx("text-left text-xs uppercase tracking-wide opacity-50", dark ? "bg-gray-800/40" : "bg-gray-50/60")}>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Color</th>
                <th className="px-3 py-3 font-semibold">Size</th>
                <th className="px-3 py-3 font-semibold text-center">Qty</th>
                <th className="px-3 py-3 font-semibold">Supplier/Customer</th>
                <th className="px-3 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center opacity-50">No transactions found.</td></tr>}
              {rows.map((t) => (
                <tr key={t.id} className={cx("border-t", dark ? "border-gray-800" : "border-gray-50")}>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="px-3 py-3">
                    <span className={cx("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold", t.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                      {t.type === "in" ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                      {t.type === "in" ? "Stock In" : "Stock Out"}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium">{t.color}</td>
                  <td className="px-3 py-3">{t.size}</td>
                  <td className="px-3 py-3 text-center font-semibold tabular-nums">{t.qty}</td>
                  <td className="px-3 py-3">{t.party || "-"}</td>
                  <td className="px-3 py-3 max-w-[200px] truncate opacity-70">{t.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   REPORTS
============================================================================ */

function Reports({ colors, transactions, settings, dark }) {
  const [period, setPeriod] = useState("daily");

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (period === "daily") start.setDate(end.getDate() - 0);
    if (period === "weekly") start.setDate(end.getDate() - 6);
    if (period === "monthly") start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [period]);

  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= range.start && d <= range.end;
    });
  }, [transactions, range]);

  const inTotal = filteredTx.filter((t) => t.type === "in").reduce((s, t) => s + Number(t.qty || 0), 0);
  const outTotal = filteredTx.filter((t) => t.type === "out").reduce((s, t) => s + Number(t.qty || 0), 0);

  const rows = colors.map((c) => ({ ...c, total: calcTotal(c.sizes) }));
  const currentInventory = rows.reduce((s, c) => s + c.total, 0);
  const highestStock = [...rows].sort((a, b) => b.total - a.total)[0];
  const lowestStock = [...rows].sort((a, b) => a.total - b.total)[0];

  const soldByColor = useMemo(() => {
    const map = {};
    filteredTx.filter((t) => t.type === "out").forEach((t) => { map[t.color] = (map[t.color] || 0) + Number(t.qty || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTx]);
  const mostSoldColor = soldByColor[0];

  const chartData = useMemo(() => {
    const map = {};
    filteredTx.forEach((t) => {
      const key = fmtDate(t.date);
      if (!map[key]) map[key] = { date: key, in: 0, out: 0 };
      map[key][t.type] += Number(t.qty || 0);
    });
    return Object.values(map);
  }, [filteredTx]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm opacity-60 mt-0.5">Performance summary for the selected period</p>
        </div>
        <div className={cx("inline-flex rounded-xl p-1 gap-1", dark ? "bg-gray-800" : "bg-gray-100")}>
          {["daily", "weekly", "monthly"].map((p) => (
            <button
              key={p} onClick={() => setPeriod(p)}
              className={cx("px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition", period === p ? "bg-white shadow text-emerald-800" : "opacity-60 hover:opacity-100")}
              style={period === p && dark ? { background: "#1f2937", color: "#95D5B2" } : {}}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Stock In" value={fmtNum(inTotal)} icon={TrendingUp} dark={dark} tint="blue" />
        <StatCard label="Stock Out" value={fmtNum(outTotal)} icon={TrendingDown} dark={dark} tint="teal" />
        <StatCard label="Current Inventory" value={fmtNum(currentInventory)} icon={Package} dark={dark} tint="green" />
        <StatCard label="Most Sold Color" value={mostSoldColor ? mostSoldColor.name : "—"} icon={Palette} dark={dark} tint="purple" sub={mostSoldColor ? `${mostSoldColor.value} pcs sold` : "no sales yet"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card dark={dark}>
          <h3 className="font-semibold text-sm mb-4">Stock In vs Out</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#F3F4F6"} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, background: dark ? "#1f2937" : "#fff", color: dark ? "#fff" : "#111" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="in" name="Stock In" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
              <Bar dataKey="out" name="Stock Out" fill="#DC2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card dark={dark}>
          <h3 className="font-semibold text-sm mb-4">Most Sold Colors</h3>
          {soldByColor.length === 0 ? <EmptyRow dark={dark} text="No sales in this period." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={soldByColor} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#F3F4F6"} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} stroke="#9CA3AF" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, background: dark ? "#1f2937" : "#fff", color: dark ? "#fff" : "#111" }} />
                <Bar dataKey="value" fill="#40916C" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card dark={dark} className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 text-red-600 shrink-0"><TrendingDown size={20} /></div>
          <div>
            <div className="text-xs opacity-60 font-medium">Lowest Stock Color</div>
            <div className="font-bold">{lowestStock ? lowestStock.name : "—"}</div>
            <div className="text-xs opacity-50">{lowestStock ? `${lowestStock.total} pcs` : ""}</div>
          </div>
        </Card>
        <Card dark={dark} className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700 shrink-0"><TrendingUp size={20} /></div>
          <div>
            <div className="text-xs opacity-60 font-medium">Highest Stock Color</div>
            <div className="font-bold">{highestStock ? highestStock.name : "—"}</div>
            <div className="text-xs opacity-50">{highestStock ? `${highestStock.total} pcs` : ""}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================================
   SETTINGS
============================================================================ */

function SettingsPage({ settings, setSettings, colors, setColors, transactions, setTransactions, dark }) {
  const toast = useToast();
  const [form, setForm] = useState(settings);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [backups, setBackups] = useState([]);

  useEffect(() => setForm(settings), [settings]);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEYS.backups, true);
        if (res && res.value) setBackups(JSON.parse(res.value));
      } catch (e) {}
    })();
  }, []);

  const saveSettings = () => {
    setSettings(form);
    toast("Settings saved.", "success");
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logo: reader.result });
    reader.readAsDataURL(file);
  };

  const exportData = () => {
    const payload = { colors, transactions, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.businessName.replace(/\s+/g, "_")}_backup_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Data exported.", "success");
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.colors) setColors(data.colors);
        if (data.transactions) setTransactions(data.transactions);
        if (data.settings) setSettings(data.settings);
        toast("Data imported successfully.", "success");
      } catch (err) {
        toast("Invalid backup file.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const backupNow = async () => {
    const snapshot = { id: uid("bk"), createdAt: new Date().toISOString(), colors, transactions, settings };
    try {
      await window.storage.set(`ab:backup:${snapshot.id}`, JSON.stringify(snapshot), true);
      const newIndex = [{ id: snapshot.id, createdAt: snapshot.createdAt }, ...backups].slice(0, 10);
      setBackups(newIndex);
      await window.storage.set(STORAGE_KEYS.backups, JSON.stringify(newIndex), true);
      toast("Backup created.", "success");
    } catch (e) {
      toast("Backup failed.", "error");
    }
  };

  const restoreBackup = async (id) => {
    try {
      const res = await window.storage.get(`ab:backup:${id}`, true);
      if (res && res.value) {
        const snap = JSON.parse(res.value);
        setColors(snap.colors);
        setTransactions(snap.transactions);
        setSettings(snap.settings);
        toast("Backup restored.", "success");
      }
    } catch (e) {
      toast("Restore failed.", "error");
    }
    setConfirmRestore(null);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm opacity-60 mt-0.5">Configure your business profile and data</p>
      </div>

      <Card dark={dark}>
        <h3 className="font-semibold text-sm mb-4">Business Profile</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: "linear-gradient(135deg,#1B4332,#40916C)" }}>
              {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : "AB"}
            </div>
            <div className="flex gap-2">
              <button onClick={() => logoInputRef.current?.click()} className={cx("inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium", dark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200")}>
                <ImageIcon size={15} /> Upload Logo
              </button>
              {form.logo && (
                <button onClick={() => setForm({ ...form, logo: null })} className="px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">Remove</button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
          <Field label="Business Name">
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={inputCls(dark)} />
          </Field>
          <Field label="Subtitle">
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls(dark)} />
          </Field>
          <Field label="Low Stock Threshold" hint="Colors at or below this total are marked Low Stock">
            <input type="number" min={1} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Math.max(1, Number(e.target.value) || 1) })} className={inputCls(dark)} />
          </Field>
          <button onClick={saveSettings} className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)" }}>
            Save Settings
          </button>
        </div>
      </Card>

      <Card dark={dark}>
        <h3 className="font-semibold text-sm mb-1">Data Management</h3>
        <p className="text-xs opacity-60 mb-4">Export a full backup, import a previous one, or restore from a saved snapshot.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportData} className={cx("inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium", dark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200")}>
            <Download size={15} /> Export Data
          </button>
          <button onClick={() => fileInputRef.current?.click()} className={cx("inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium", dark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200")}>
            <Upload size={15} /> Import Data
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importData} />
          <button onClick={backupNow} className={cx("inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium", dark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200")}>
            <Database size={15} /> Backup Now
          </button>
          <button onClick={() => setConfirmRestore("open")} className={cx("inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium", dark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200")}>
            <RotateCcw size={15} /> Restore Backup
          </button>
        </div>

        {confirmRestore === "open" && (
          <div className={cx("mt-4 rounded-xl border p-3 space-y-2", dark ? "border-gray-700" : "border-gray-200")}>
            <div className="text-xs font-semibold opacity-60 mb-1">Saved Backups</div>
            {backups.length === 0 && <div className="text-sm opacity-50">No backups saved yet.</div>}
            {backups.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{fmtDateTime(b.createdAt)}</span>
                <button onClick={() => restoreBackup(b.id)} className="text-emerald-600 font-medium hover:underline">Restore</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
