import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import Loading from '../components/Loading.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import MasteryBar from '../components/MasteryBar.jsx';

function Section({ title, items, emptyText }) {
  return (
    <div className="card">
      <h2 className="font-semibold text-slate-700 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <MasteryBar key={m.concept} conceptName={m.concept} level={m.level} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Growth() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get(`/projects/${projectId}/growth`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load growth data'));
  }, [projectId]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <Link to={`/projects/${projectId}`} className="text-sm text-brand-600">&larr; Project dashboard</Link>
      <h1 className="text-2xl font-semibold text-slate-800">Growth Analysis</h1>
      <p className="text-sm text-slate-500">How your concept mastery is changing over time.</p>

      <div className="grid sm:grid-cols-3 gap-4">
        <Section title="🟢 Improving" items={data.improving} emptyText="Nothing improving yet — keep practicing." />
        <Section title="🔵 Stable" items={data.stable} emptyText="Nothing stable yet." />
        <Section title="🟠 Needs attention" items={data.attention} emptyText="Nothing flagged — good job." />
      </div>
    </div>
  );
}
