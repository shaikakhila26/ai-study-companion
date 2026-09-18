import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import AdminNav from './AdminNav.jsx';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/admin/overview')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load admin overview'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
      <AdminNav />
      <ErrorBanner message={error} />
      {!data ? (
        <Loading />
      ) : (
        <>
          <div className="grid sm:grid-cols-5 gap-4">
            {Object.entries(data.counts).map(([k, v]) => (
              <div className="card" key={k}>
                <div className="text-sm text-slate-500 capitalize">{k}</div>
                <div className="text-2xl font-semibold">{v}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-3">System health</h2>
              <div className="text-sm">
                Database:{' '}
                <span className={data.systemHealth.database === 'connected' ? 'text-emerald-600' : 'text-red-600'}>
                  {data.systemHealth.database}
                </span>
              </div>
              <h3 className="font-medium text-slate-600 mt-4 mb-1 text-sm">Background jobs</h3>
              {Object.entries(data.jobStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm border-t border-slate-100 py-1">
                  <span className="text-slate-500">{status}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-3">AI usage (platform-wide)</h2>
              <div className="text-sm space-y-1">
                <div>Total calls: {data.aiUsage.totalCalls}</div>
                <div>Total tokens: {data.aiUsage.totalTokens}</div>
                <div>Estimated cost: ${Number(data.aiUsage.totalCost || 0).toFixed(4)}</div>
                <div>Failures: {data.aiUsage.failures}</div>
                <div>Avg latency: {Math.round(data.aiUsage.avgLatencyMs || 0)}ms</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
