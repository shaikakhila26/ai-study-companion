import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import Loading from '../components/Loading.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function SpaceDetail() {
  const { spaceId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', goal: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    client
      .get(`/spaces/${spaceId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load Space'));
  };

  useEffect(load, [spaceId]);

  const createProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post(`/spaces/${spaceId}/projects`, form);
      setForm({ name: '', description: '', goal: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create Project');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/spaces" className="text-sm text-brand-600">&larr; All Spaces</Link>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{data.space.name}</h1>
            <p className="text-slate-500 text-sm">{data.space.description}</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createProject} className="card space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-600">Project name</label>
            <input
              className="input mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Learning goal</label>
            <input
              className="input mt-1"
              placeholder="e.g. Understand core machine learning concepts for an interview"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Description</label>
            <textarea
              className="input mt-1"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      )}

      {data.projects.length === 0 ? (
        <div className="card text-sm text-slate-500">No Projects in this Space yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.projects.map((p) => (
            <Link to={`/projects/${p._id}`} key={p._id} className="card hover:shadow-md transition block">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-slate-500">{p.goal}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
