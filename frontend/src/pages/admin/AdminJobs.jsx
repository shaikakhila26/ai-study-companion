import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import AdminNav from './AdminNav.jsx';

export default function AdminJobs() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/admin/jobs')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load jobs'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Background Jobs</h1>
      <AdminNav />
      <ErrorBanner message={error} />
      {!data ? (
        <Loading />
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2">Type</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Attempts</th>
                <th className="pb-2">Last error</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.recentJobs.map((j) => (
                <tr key={j._id} className="border-t border-slate-100">
                  <td className="py-1">{j.type}</td>
                  <td className="py-1">{j.status}</td>
                  <td className="py-1">{j.attempts}</td>
                  <td className="py-1 text-red-500">{j.lastError || ''}</td>
                  <td className="py-1">{new Date(j.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
