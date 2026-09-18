import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Loading from '../components/Loading.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/home')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load home'));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Welcome back</h1>
        <p className="text-slate-500 text-sm">Where you were, how you're doing, and what to do next.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-slate-500">Overall progress</div>
          <div className="text-3xl font-semibold text-brand-700 mt-1">{Math.round(data.overallProgress * 100)}%</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Areas needing attention</div>
          <div className="text-lg font-medium mt-1">
            {data.attentionAreas.length ? data.attentionAreas.slice(0, 3).join(', ') : 'None right now'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Recommended next action</div>
          <div className="text-sm font-medium mt-1">
            {data.recommendedNextAction ? data.recommendedNextAction.text : 'Keep going — nothing urgent yet.'}
          </div>
        </div>
      </div>

      {data.continueLearning && (
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Continue learning</div>
            <div className="text-lg font-medium">{data.continueLearning.name}</div>
            <div className="text-sm text-slate-500">{data.continueLearning.goal}</div>
          </div>
          <Link to={`/projects/${data.continueLearning._id}`} className="btn-primary">
            Continue
          </Link>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Recent Projects</h2>
        {data.recentProjects.length === 0 ? (
          <div className="card text-sm text-slate-500">
            No Projects yet. <Link to="/spaces" className="text-brand-600 font-medium">Create a Space</Link> to get started.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.recentProjects.map((p) => (
              <Link to={`/projects/${p._id}`} key={p._id} className="card hover:shadow-md transition block">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-slate-500">{p.goal}</div>
                {p.space && (
                  <span className="badge mt-2" style={{ backgroundColor: `${p.space.color}20`, color: p.space.color }}>
                    {p.space.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {data.otherRecommendations?.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Other recommendations</h2>
          <ul className="space-y-2">
            {data.otherRecommendations.map((r) => (
              <li key={r._id} className="card text-sm">
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
