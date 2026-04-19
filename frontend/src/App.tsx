import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '' });

// ── Types ────────────────────────────────────────────────────────────────────

interface OpenCodeModelUsage {
  model: string;
  provider: string;
  total_tokens: number;
  total_input: number;
  total_output: number;
  total_reasoning: number;
  total_cache_read: number;
  total_cache_write: number;
  calls: number;
  estimated_cost_usd: number;
}

interface OpenCodeDailyUsage {
  date: string;
  total_tokens: number;
  calls: number;
}

interface OpenCodeMetrics {
  total_tokens: number;
  total_input: number;
  total_output: number;
  total_reasoning: number;
  total_cache_read: number;
  total_cache_write: number;
  total_calls: number;
  total_estimated_cost_usd: number;
  by_model: OpenCodeModelUsage[];
  by_day: OpenCodeDailyUsage[];
  session_count: number;
}

interface OverallStats {
  total_traces: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  error_rate: number;
  models_used: number;
  traces_today: number;
  cost_today: number;
}

interface SessionSummary {
  session_id: string;
  total_calls: number;
  avg_latency_ms: number;
  total_tokens: number;
  estimated_cost_usd: number;
  first_call: string;
  last_call: string;
  error_count: number;
}

interface TraceDetail {
  trace_id: string;
  session_id: string | null;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  estimated_cost_usd: number;
  status: string;
  prompt_preview: string | null;
  response_preview: string | null;
  created_at: string;
}

interface ModelCost {
  model: string;
  provider: string;
  total_cost_usd: number;
  total_tokens: number;
  call_count: number;
}

interface DailyCost {
  date: string;
  total_cost_usd: number;
  call_count: number;
}

interface CostBreakdown {
  total_cost_usd: number;
  by_model: ModelCost[];
  by_day: DailyCost[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const PROVIDER_COLORS: Record<string, string> = {
  opencode: '#10b981',
  'github-copilot': '#6366f1',
  'zai-coding-plan': '#f59e0b',
  openai: '#10a37f',
  anthropic: '#d4a574',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatCost(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(3)}`;
  if (usd > 0) return `$${usd.toFixed(4)}`;
  return '$0.00';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] || '#6b7280';
}

function safePct(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

// ── Shared Components ────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon, color, delay = 0 }: { title: string; value: string; subtitle?: string; icon: string; color: string; delay?: number }) {
  return (
    <div
      className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50 hover:shadow-2xl hover:-translate-y-2 hover:border-gray-200 transition-all duration-500 ease-out overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 letter-spacing-2">{title}</p>
          <p className="text-4xl font-black mt-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-3 font-medium">{subtitle}</p>}
        </div>
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500"
          style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)`, border: `2px solid ${color}10` }}
        >
          {icon}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-baseline mb-3">
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        <span className="text-gray-600 text-sm font-mono font-medium">{formatNumber(value)}</span>
      </div>
      <div className="h-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full overflow-hidden shadow-inner relative">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${color}, ${color}CC)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

function Spinner({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute inset-2 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-400" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <p className="text-gray-600 font-semibold text-lg">{message}</p>
        {sub && <p className="text-gray-400 text-sm mt-2">{sub}</p>}
      </div>
    </div>
  );
}

function ModelCard({ model, index }: { model: OpenCodeModelUsage; index: number }) {
  return (
    <div
      className="group relative bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl p-6 border border-gray-200/60 hover:border-gray-300 hover:shadow-xl transition-all duration-500 overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            >
              {index + 1}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg mb-1">{model.model}</p>
              <span
                className="text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: `${getProviderColor(model.provider)}15`,
                  color: getProviderColor(model.provider),
                  border: `1.5px solid ${getProviderColor(model.provider)}30`
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getProviderColor(model.provider) }} />
                {model.provider}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-gray-900">{formatNumber(model.total_tokens)}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{model.calls} calls &middot; {formatCost(model.estimated_cost_usd)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${safePct(model.total_input, model.total_tokens)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Input
            </p>
          </div>
          <div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${safePct(model.total_output, model.total_tokens)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Output
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trace Explorer Tab ───────────────────────────────────────────────────────

function TraceExplorerTab() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [traces, setTraces] = useState<TraceDetail[]>([]);
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/traces/stats').then(r => setStats(r.data)).catch(() => {}),
      api.get('/traces/sessions').then(r => setSessions(r.data)).catch(() => {}),
      api.get('/traces/recent?limit=50').then(r => setTraces(r.data)).catch(() => {}),
      api.get('/traces/costs?days=30').then(r => setCosts(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner message="Loading trace data..." sub="Querying PostgreSQL" />;

  if (!stats || stats.total_traces === 0) return (
    <div className="p-8">
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/60 rounded-3xl p-10 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg flex-shrink-0">
            🔍
          </div>
          <div className="flex-1">
            <h3 className="font-black text-blue-900 text-2xl mb-2">No Traces Yet</h3>
            <p className="text-blue-800 font-medium text-lg mb-3">Send a request to the <code className="bg-white/60 px-2 py-1 rounded-lg text-sm">POST /chat</code> endpoint to start collecting traces.</p>
            <p className="text-sm text-blue-700 bg-white/50 rounded-xl px-4 py-3 inline-block font-medium">
              Or run <code className="font-mono">python scripts/seed_traces.py</code> to populate demo data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Total Traces" value={formatNumber(stats.total_traces)} subtitle={`${stats.traces_today} today`} icon="🔍" color="#3b82f6" delay={0} />
        <StatCard title="Avg Latency" value={`${Math.round(stats.avg_latency_ms)}ms`} subtitle={`${stats.models_used} models`} icon="⚡" color="#f59e0b" delay={100} />
        <StatCard title="Total Cost" value={formatCost(stats.total_cost_usd)} subtitle={`${formatCost(stats.cost_today)} today`} icon="💰" color="#8b5cf6" delay={200} />
        <StatCard title="Error Rate" value={`${(stats.error_rate * 100).toFixed(1)}%`} subtitle={`${stats.total_tokens} tokens`} icon="🛡️" color={stats.error_rate > 0.05 ? '#ef4444' : '#10b981'} delay={300} />
      </div>

      {/* Cost Charts */}
      {costs && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-500">
            <h3 className="font-black text-gray-900 text-lg mb-1">Cost by Model</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Last 30 days</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={costs.by_model} dataKey="total_cost_usd" nameKey="model" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {costs.by_model.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCost(v)} />
                <Legend layout="vertical" verticalAlign="middle" align="right" formatter={(v) => <span className="text-xs text-gray-600 font-semibold">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-500">
            <h3 className="font-black text-gray-900 text-lg mb-1">Daily Cost</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Spend over time</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costs.by_day} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [formatCost(v), 'Cost']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="total_cost_usd" fill="url(#costGradient)" radius={[6, 6, 0, 0]} name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      {sessions.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50">
          <h3 className="font-black text-gray-900 text-lg mb-1">Sessions</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">Grouped by session ID</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Session</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Calls</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Avg Latency</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Tokens</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Cost</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Errors</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{s.session_id.slice(0, 16)}...</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{s.total_calls}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{Math.round(s.avg_latency_ms)}ms</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatNumber(s.total_tokens)}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCost(s.estimated_cost_usd)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${s.error_count > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {s.error_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 text-xs">{formatTime(s.last_call)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Traces */}
      {traces.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50">
          <h3 className="font-black text-gray-900 text-lg mb-1">Recent Traces</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">Click a row to expand</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Time</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Model</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Tokens</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Latency</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Cost</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Prompt</th>
                </tr>
              </thead>
              <tbody>
                {traces.map((t) => (
                  <>
                    <tr
                      key={t.trace_id}
                      className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer"
                      onClick={() => setExpandedTrace(expandedTrace === t.trace_id ? null : t.trace_id)}
                    >
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatTime(t.created_at)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{t.model}</span>
                        <span className="text-gray-400 text-xs ml-2">{t.provider}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">{formatNumber(t.total_tokens)}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{Math.round(t.latency_ms)}ms</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatCost(t.estimated_cost_usd)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${t.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs truncate max-w-[200px]">{t.prompt_preview || '-'}</td>
                    </tr>
                    {expandedTrace === t.trace_id && (
                      <tr key={`${t.trace_id}-exp`} className="bg-gray-50/50">
                        <td colSpan={7} className="py-4 px-8">
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                              <p className="font-bold text-gray-700 mb-2">Prompt</p>
                              <p className="text-gray-600 bg-white rounded-xl p-4 border border-gray-100">{t.prompt_preview || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-700 mb-2">Response</p>
                              <p className="text-gray-600 bg-white rounded-xl p-4 border border-gray-100">{t.response_preview || 'N/A'}</p>
                            </div>
                            <div className="col-span-2 flex gap-6 text-xs text-gray-500">
                              <span>Trace: <code className="font-mono">{t.trace_id.slice(0, 8)}...</code></span>
                              <span>Prompt: {t.prompt_tokens} tokens</span>
                              <span>Completion: {t.completion_tokens} tokens</span>
                              {t.session_id && <span>Session: <code className="font-mono">{t.session_id.slice(0, 12)}...</code></span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── OpenCode Tab ─────────────────────────────────────────────────────────────

function OpenCodeTab() {
  const [metrics, setMetrics] = useState<OpenCodeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/opencode/metrics')
      .then(res => setMetrics(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load OpenCode metrics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner message="Loading OpenCode metrics..." sub="Analyzing your AI coding data" />;

  if (error) return (
    <div className="p-8">
      <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200/60 rounded-3xl p-10 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg flex-shrink-0">
            ⚠️
          </div>
          <div className="flex-1">
            <h3 className="font-black text-amber-900 text-2xl mb-2">OpenCode Database Not Found</h3>
            <p className="text-amber-800 font-medium text-lg mb-3">{error}</p>
            <p className="text-sm text-amber-700 bg-white/50 rounded-xl px-4 py-3 inline-block font-medium">
              Make sure OpenCode has been used at least once to generate the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Total Tokens" value={formatNumber(metrics.total_tokens)} subtitle="All time" icon="🎯" color="#10b981" delay={0} />
        <StatCard title="Coding Sessions" value={String(metrics.session_count)} subtitle="Unique projects" icon="💻" color="#3b82f6" delay={100} />
        <StatCard title="API Calls" value={String(metrics.total_calls)} subtitle="Total requests" icon="🔄" color="#8b5cf6" delay={200} />
        <StatCard title="Total Cost" value={formatCost(metrics.total_estimated_cost_usd)} subtitle="Estimated" icon="💰" color="#22c55e" delay={300} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-500">
          <h3 className="font-black text-gray-900 text-lg mb-1">Usage by Model</h3>
          <p className="text-sm text-gray-500 mb-8 font-medium">Token distribution across models</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={metrics.by_model.slice(0, 5)} dataKey="total_tokens" nameKey="model" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {metrics.by_model.slice(0, 5).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatNumber(value)} />
              <Legend layout="vertical" verticalAlign="middle" align="right" formatter={(value) => <span className="text-xs text-gray-600 font-semibold">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-500">
          <h3 className="font-black text-gray-900 text-lg mb-1">Token Breakdown</h3>
          <p className="text-sm text-gray-500 mb-8 font-medium">Input vs Output vs Cache</p>
          <div className="space-y-4">
            <ProgressBar label="Input" value={metrics.total_input} max={metrics.total_tokens} color="#3b82f6" />
            <ProgressBar label="Output" value={metrics.total_output} max={metrics.total_tokens} color="#10b981" />
            <ProgressBar label="Reasoning" value={metrics.total_reasoning} max={metrics.total_tokens} color="#8b5cf6" />
            <ProgressBar label="Cache Read" value={metrics.total_cache_read} max={metrics.total_tokens} color="#f59e0b" />
          </div>
          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
              <span className="text-gray-700 font-bold text-sm">Cache Efficiency</span>
              <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {metrics.total_cache_read > 0
                  ? `${((metrics.total_cache_read / metrics.total_tokens) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-500">
          <h3 className="font-black text-gray-900 text-lg mb-1">Recent Activity</h3>
          <p className="text-sm text-gray-500 mb-8 font-medium">Last 7 days trend</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={metrics.by_day.slice(0, 7).reverse()}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip formatter={(value: number) => formatNumber(value)} />
              <Area type="monotone" dataKey="total_tokens" stroke="#10b981" strokeWidth={2} fill="url(#areaGradient)" name="Tokens" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-gray-100/50 hover:shadow-xl transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Daily Usage</h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">Token consumption over the last 14 days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.by_day.slice(0, 14).reverse()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '12px 16px' }} formatter={(value: number) => [formatNumber(value), 'Tokens']} />
            <Bar dataKey="total_tokens" fill="url(#dailyGradient)" radius={[8, 8, 0, 0]} name="Tokens" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-6">Model Details</h2>
        <div className="grid grid-cols-2 gap-5">
          {metrics.by_model.map((model, idx) => (
            <ModelCard key={idx} model={model} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<'opencode' | 'traces'>('opencode');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl transform hover:scale-110 hover:rotate-6 transition-transform duration-300">
                  📊
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                  LLMOps Dashboard
                </h1>
                <p className="text-sm text-gray-600 font-semibold mt-1">AI Coding Usage Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-sm font-bold rounded-2xl shadow-sm border border-green-200 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-10">
          <div className="inline-flex bg-white/70 backdrop-blur-lg p-2 rounded-3xl shadow-lg border border-gray-200/50">
            <button
              onClick={() => setActiveTab('opencode')}
              className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-500 flex items-center gap-3 ${
                activeTab === 'opencode'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl scale-105'
                  : 'text-gray-600 hover:bg-gray-100/70'
              }`}
            >
              <span className="text-xl">🚀</span>
              OpenCode Usage
            </button>
            <button
              onClick={() => setActiveTab('traces')}
              className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-500 flex items-center gap-3 ${
                activeTab === 'traces'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl scale-105'
                  : 'text-gray-600 hover:bg-gray-100/70'
              }`}
            >
              <span className="text-xl">🔍</span>
              LLM Traces
            </button>
          </div>
        </div>

        {activeTab === 'traces' ? <TraceExplorerTab /> : <OpenCodeTab />}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm font-semibold">
            Built with React + FastAPI + PostgreSQL + TailwindCSS
          </p>
          <p className="text-gray-400 text-xs">
            Data sourced from OpenCode SQLite &amp; PostgreSQL trace store
          </p>
        </div>
      </div>
    </div>
  );
}
