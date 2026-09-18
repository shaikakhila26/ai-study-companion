import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import Loading from '../components/Loading.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import MasteryBar from '../components/MasteryBar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get(`/projects/${projectId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load Project'));
  }, [projectId]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{data.project.name}</h1>
        <p className="text-slate-500 text-sm">{data.project.goal}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to={`/projects/${projectId}/materials`} className="btn-secondary text-sm">Materials</Link>
        <Link to={`/projects/${projectId}/tutor`} className="btn-secondary text-sm">AI Tutor</Link>
        <Link to={`/projects/${projectId}/quiz`} className="btn-secondary text-sm">Adaptive Quiz</Link>
        <Link to={`/projects/${projectId}/growth`} className="btn-secondary text-sm">Growth</Link>
        <Link to={`/projects/${projectId}/analytics`} className="btn-secondary text-sm">Analytics</Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-slate-500">Overall progress</div>
          <div className="text-3xl font-semibold text-brand-700 mt-1">{Math.round(data.overallProgress * 100)}%</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Needs attention</div>
          <div className="text-sm font-medium mt-1">
            {data.attentionConcepts.length ? data.attentionConcepts.join(', ') : 'Nothing flagged'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Improving</div>
          <div className="text-sm font-medium mt-1">
            {data.improvingConcepts.length ? data.improvingConcepts.join(', ') : 'Not enough evidence yet'}
          </div>
        </div>
      </div>

      {data.recommendations.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-3">Recommended next steps</h2>
          <ul className="space-y-2 text-sm">
            {data.recommendations.map((r) => (
              <li key={r._id} className="border-l-2 border-brand-400 pl-3">
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-3">Concept mastery</h2>
          {data.mastery.length === 0 ? (
            <p className="text-sm text-slate-500">Upload material and take a quiz to see mastery here.</p>
          ) : (
            <div className="space-y-3">
              {data.mastery.map((m) => (
                <MasteryBar key={m._id} conceptName={m.conceptName} level={m.level} trend={m.trend} />
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-3">Materials</h2>
          {data.materials.length === 0 ? (
            <p className="text-sm text-slate-500">
              No material yet. <Link to={`/projects/${projectId}/materials`} className="text-brand-600 font-medium">Upload a PDF</Link>.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span>{m.title}</span>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
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
    </div>
  );
}
