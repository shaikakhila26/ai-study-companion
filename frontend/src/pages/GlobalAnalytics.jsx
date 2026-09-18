import React, { useEffect, useState } from 'react';
import client from '../api/client';
import Loading from '../components/Loading.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function GlobalAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Global Analytics</h1>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-slate-500">Spaces</div>
          <div className="text-2xl font-semibold">{data.spaceCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Projects</div>
          <div className="text-2xl font-semibold">{data.projectCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Overall progress</div>
          <div className="text-2xl font-semibold">{Math.round(data.overallProgress * 100)}%</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Quizzes completed</div>
          <div className="text-2xl font-semibold">{data.quizzesCompleted}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-3">Per-project quiz activity</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2">Project</th>
              <th className="pb-2">Quizzes completed</th>
            </tr>
          </thead>
          <tbody>
            {data.projects.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-1">{p.name}</td>
                <td className="py-1">{p.quizzesCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
