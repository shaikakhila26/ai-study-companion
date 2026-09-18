import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import Loading from '../components/Loading.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function ProjectAnalytics() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get(`/projects/${projectId}/analytics`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'));
  }, [projectId]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <Link to={`/projects/${projectId}`} className="text-sm text-brand-600">&larr; Project dashboard</Link>
      <h1 className="text-2xl font-semibold text-slate-800">Project Analytics</h1>

      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-3">Activity by type</h2>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          {Object.entries(data.activityByType).map(([type, count]) => (
            <div key={type} className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">{type.replaceAll('_', ' ')}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-3">Quiz performance over time</h2>
        {data.quizPerformanceOverTime.length === 0 ? (
          <p className="text-sm text-slate-400">No completed quizzes yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2">Completed</th>
                <th className="pb-2">Correct</th>
                <th className="pb-2">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {data.quizPerformanceOverTime.map((q, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1">{new Date(q.completedAt).toLocaleDateString()}</td>
                  <td className="py-1">
                    {q.correct}/{q.totalQuestions}
                  </td>
                  <td className="py-1">{q.averageScore !== null ? `${Math.round(q.averageScore * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-3">AI usage (this Project)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2">Feature</th>
              <th className="pb-2">Calls</th>
              <th className="pb-2">Tokens</th>
              <th className="pb-2">Avg latency</th>
              <th className="pb-2">Failures</th>
            </tr>
          </thead>
          <tbody>
            {data.aiUsageByFeature.map((u) => (
              <tr key={u._id} className="border-t border-slate-100">
                <td className="py-1">{u._id}</td>
                <td className="py-1">{u.calls}</td>
                <td className="py-1">{u.totalTokens}</td>
                <td className="py-1">{Math.round(u.avgLatencyMs)}ms</td>
                <td className="py-1">{u.failures}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
