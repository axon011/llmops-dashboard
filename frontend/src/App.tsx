import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import axios from 'axios';

interface SessionMetric {
  session_id: string;
  total_calls: number;
  avg_latency_ms: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

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
  by_model: OpenCodeModelUsage[];
  by_day: OpenCodeDailyUsage[];
  session_count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const PROVIDER_COLORS: Record<string, string> = {
  opencode: '#10b981',
  'github-copilot': '#6e7681',
  'zai-coding-plan': '#f59e0b',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] || '#6b7280';
}

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <span className="tabular-nums">
      {value}{suffix}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon, color, delay = 0 }: { title: string; value: string; subtitle?: string; icon: string; color: string; delay?: number }) {
  return (
    <div 
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}05)` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{formatNumber(value)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${color}, ${color}80)` }}
        />
      </div>
    </div>
  );
}

function ModelCard({ model, index }: { model: OpenCodeModelUsage; index: number }) {
  return (
    <div 
      className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          >
            {index + 1}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{model.model}</p>
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ 
                backgroundColor: `${getProviderColor(model.provider)}15`,
                color: getProviderColor(model.provider)
              }}
            >
              {model.provider}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">{formatNumber(model.total_tokens)}</p>
          <p className="text-xs text-gray-500">{model.calls} calls</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="flex-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(model.total_input / model.total_tokens) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Input</p>
        </div>
        <div className="flex-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(model.total_output / model.total_tokens) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Output</p>
        </div>
      </div>
    </div>
  );
}

function LangfuseTab() {
  const [sessions, setSessions] = useState<SessionMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/metrics/sessions')
      .then(res => setSessions(res.data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading metrics...</p>
      </div>
    </div>
  );

  const avgLatency = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.avg_latency_ms, 0) / sessions.length) : 0;
  const totalCost = sessions.reduce((a, s) => a + s.estimated_cost_usd, 0);
  const totalTokens = sessions.reduce((a, s) => a + s.total_tokens, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Sessions" value={String(sessions.length)} icon="📊" color="#3b82f6" delay={0} />
        <StatCard title="Avg Latency" value={`${avgLatency}ms`} icon="⚡" color="#f59e0b" delay={100} />
        <StatCard title="Total Tokens" value={formatNumber(totalTokens)} icon="🎯" color="#10b981" delay={200} />
        <StatCard title="Est. Cost" value={`$${totalCost.toFixed(3)}`} icon="💰" color="#8b5cf6" delay={300} />
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Token Usage by Session</h2>
            <p className="text-gray-500 text-sm mt-1">Visualization of token consumption across sessions</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sessions} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="session_id" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="total_tokens" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Tokens" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OpenCodeTab() {
  const [metrics, setMetrics] = useState<OpenCodeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://localhost:8000/opencode/metrics')
      .then(res => setMetrics(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load OpenCode metrics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading OpenCode metrics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl">⚠️</div>
          <div>
            <h3 className="font-bold text-amber-800 text-lg">OpenCode Database Not Found</h3>
            <p className="text-amber-700 mt-1">{error}</p>
            <p className="text-sm text-amber-600 mt-2">Make sure OpenCode has been used at least once to generate the database.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard 
          title="Total Tokens" 
          value={formatNumber(metrics.total_tokens)} 
          subtitle="All time"
          icon="🎯" 
          color="#10b981" 
          delay={0}
        />
        <StatCard 
          title="Coding Sessions" 
          value={String(metrics.session_count)} 
          subtitle="Unique projects"
          icon="💻" 
          color="#3b82f6" 
          delay={100}
        />
        <StatCard 
          title="API Calls" 
          value={String(metrics.total_calls)} 
          subtitle="Total requests"
          icon="🔄" 
          color="#8b5cf6" 
          delay={200}
        />
        <StatCard 
          title="Total Cost" 
          value="$0.00" 
          subtitle="All free models"
          icon="✅" 
          color="#22c55e" 
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Usage by Model - Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Usage by Model</h3>
          <p className="text-sm text-gray-500 mb-6">Token distribution across models</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={metrics.by_model.slice(0, 5)}
                dataKey="total_tokens"
                nameKey="model"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
              >
                {metrics.by_model.slice(0, 5).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatNumber(value)} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Token Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Token Breakdown</h3>
          <p className="text-sm text-gray-500 mb-6">Input vs Output vs Cache</p>
          <div className="space-y-4">
            <ProgressBar label="Input" value={metrics.total_input} max={metrics.total_tokens} color="#3b82f6" />
            <ProgressBar label="Output" value={metrics.total_output} max={metrics.total_tokens} color="#10b981" />
            <ProgressBar label="Reasoning" value={metrics.total_reasoning} max={metrics.total_tokens} color="#8b5cf6" />
            <ProgressBar label="Cache Read" value={metrics.total_cache_read} max={metrics.total_tokens} color="#f59e0b" />
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Cache Efficiency</span>
              <span className="text-lg font-bold text-green-600">
                {metrics.total_cache_read > 0 
                  ? `${((metrics.total_cache_read / metrics.total_tokens) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Recent Activity</h3>
          <p className="text-sm text-gray-500 mb-6">Last 7 days trend</p>
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
              <Area 
                type="monotone" 
                dataKey="total_tokens" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#areaGradient)" 
                name="Tokens"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Usage Chart */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daily Usage</h2>
            <p className="text-gray-500 text-sm mt-1">Token consumption over the last 14 days</p>
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
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              formatter={(value: number) => [formatNumber(value), 'Tokens']}
            />
            <Bar dataKey="total_tokens" fill="url(#dailyGradient)" radius={[4, 4, 0, 0]} name="Tokens" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Model Cards Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Model Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {metrics.by_model.map((model, idx) => (
            <ModelCard key={idx} model={model} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'langfuse' | 'opencode'>('opencode');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                📊
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  LLMOps Dashboard
                </h1>
                <p className="text-sm text-gray-500">AI Coding Usage Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                ● Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-8">
          <div className="inline-flex bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('opencode')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'opencode'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🚀 OpenCode Usage
            </button>
            <button
              onClick={() => setActiveTab('langfuse')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'langfuse'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 Langfuse Metrics
            </button>
          </div>
        </div>

        {activeTab === 'langfuse' ? <LangfuseTab /> : <OpenCodeTab />}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <p className="text-center text-gray-400 text-sm">
          Built with React + FastAPI • Data sourced from OpenCode SQLite
        </p>
      </div>
    </div>
  );
}
