import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import AdminNav from './AdminNav.jsx';

export default function AdminAIUsage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/admin/ai-usage')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load AI usage'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">AI Usage & Evaluation</h1>
      <AdminNav />
      <ErrorBanner message={error} />
      {!data ? (
        <Loading />
      ) : (
        <>
          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">By feature</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-2">Feature</th>
                  <th className="pb-2">Calls</th>
                  <th className="pb-2">Tokens</th>
                  <th className="pb-2">Cost (est.)</th>
                  <th className="pb-2">Avg latency</th>
                  <th className="pb-2">Failures</th>
                </tr>
              </thead>
              <tbody>
                {data.byFeature.map((f) => (
                  <tr key={f._id} className="border-t border-slate-100">
                    <td className="py-1">{f._id}</td>
                    <td className="py-1">{f.calls}</td>
                    <td className="py-1">{f.totalTokens}</td>
                    <td className="py-1">${Number(f.totalCost || 0).toFixed(4)}</td>
                    <td className="py-1">{Math.round(f.avgLatencyMs)}ms</td>
                    <td className="py-1">{f.failures}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">Recent failures</h2>
            {data.recentFailures.length === 0 ? (
              <p className="text-sm text-slate-400">No recent AI call failures.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {data.recentFailures.map((f) => (
                  <li key={f._id} className="border-b border-slate-100 py-1">
                    <span className="text-red-600">{f.feature}</span> — {f.errorMessage}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
