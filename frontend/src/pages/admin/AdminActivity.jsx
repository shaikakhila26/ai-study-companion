import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import Loading from '../../components/Loading.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import AdminNav from './AdminNav.jsx';

export default function AdminActivity() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = (type) => {
    client
      .get('/admin/activity', { params: type ? { type } : {} })
      .then((res) => setEvents(res.data.events))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load activity'));
  };

  useEffect(() => load(''), []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Platform Activity</h1>
      <AdminNav />
      <ErrorBanner message={error} />

      <div className="flex gap-2 items-center">
        <input
          className="input max-w-xs"
          placeholder="Filter by event type (e.g. quiz_completed)"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
        <button className="btn-secondary text-sm" onClick={() => load(typeFilter)}>
          Filter
        </button>
        <button
          className="btn-secondary text-sm"
          onClick={() => {
            setTypeFilter('');
            load('');
          }}
        >
          Clear
        </button>
      </div>

      {!events ? (
        <Loading />
      ) : (
        <div className="card">
          <ul className="text-sm space-y-1 max-h-[70vh] overflow-y-auto">
            {events.map((e) => (
              <li key={e._id} className="border-b border-slate-100 py-1.5 flex justify-between">
                <span>{e.type.replaceAll('_', ' ')}</span>
                <span className="text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
