import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface SessionMetric {
  session_id: string;
  total_calls: number;
  avg_latency_ms: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export default function App() {
  const [sessions, setSessions] = useState<SessionMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/metrics/sessions')
      .then(res => setSessions(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading metrics...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">LLMOps Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-3xl font-bold">{sessions.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-500">Avg Latency</p>
          <p className="text-3xl font-bold">
            {sessions.length ? Math.round(sessions.reduce((a, s) => a + s.avg_latency_ms, 0) / sessions.length) : 0}ms
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="text-3xl font-bold">
            ${sessions.reduce((a, s) => a + s.estimated_cost_usd, 0).toFixed(3)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Token Usage by Session</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sessions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="session_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_tokens" fill="#3b82f6" name="Tokens" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
