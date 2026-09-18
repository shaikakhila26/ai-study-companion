import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Loading from '../components/Loading.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function SpaceList() {
  const [spaces, setSpaces] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    client
      .get('/spaces')
      .then((res) => setSpaces(res.data.spaces))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load Spaces'));
  };

  useEffect(load, []);

  const createSpace = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/spaces', { name, description });
      setName('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create Space');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (!spaces) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Spaces</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New Space'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSpace} className="card space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-600">Name</label>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Description</label>
            <textarea className="input mt-1" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <button className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Space'}
          </button>
        </form>
      )}

      {spaces.length === 0 ? (
        <div className="card text-sm text-slate-500">
          A Space is a broad learning area (a skill, certification, or interest). Create your first one above.
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {spaces.map((s) => (
            <Link to={`/spaces/${s._id}`} key={s._id} className="card hover:shadow-md transition block">
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-slate-500 line-clamp-2">{s.description}</div>
              <div className="text-xs text-slate-400 mt-2">{s.projectCount} Project(s)</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
