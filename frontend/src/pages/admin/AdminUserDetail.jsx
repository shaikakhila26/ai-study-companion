import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Loading.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import AdminNav from './AdminNav.jsx';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get(`/admin/users/${userId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load user'));
  }, [userId]);

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="text-sm text-brand-600">&larr; All users</Link>
      <AdminNav />
      <ErrorBanner message={error} />
      {!data ? (
        <Loading />
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{data.user.name}</h1>
            <p className="text-slate-500 text-sm">{data.user.email} • {data.user.role}</p>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">Projects</h2>
            <ul className="text-sm space-y-1">
              {data.projects.map((p) => (
                <li key={p._id}>{p.name} — {p.goal}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">Mastery across Projects</h2>
            <ul className="text-sm space-y-1">
              {data.mastery.map((m) => (
                <li key={m._id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{m.conceptName}</span>
                  <span>{Math.round(m.level * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">AI usage</h2>
            <ul className="text-sm space-y-1">
              {data.aiUsage.map((u) => (
                <li key={u._id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{u._id}</span>
                  <span>{u.calls} calls • ${Number(u.totalCost || 0).toFixed(4)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">Recent activity</h2>
            <ul className="text-sm space-y-1 text-slate-600">
              {data.recentActivity.map((e) => (
                <li key={e._id}>
                  <span className="text-slate-400">{new Date(e.createdAt).toLocaleString()}</span> — {e.type.replaceAll('_', ' ')}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
