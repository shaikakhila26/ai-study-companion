import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import ErrorBanner from '../components/ErrorBanner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Materials() {
  const { projectId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);
  const pollRef = useRef(null);

  const load = () => {
    client
      .get(`/projects/${projectId}/materials`)
      .then((res) => setMaterials(res.data.materials))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load materials'));
  };

  useEffect(() => {
    load();
    // Poll while anything is queued/processing -- this is what lets the
    // user see queued -> processing -> ready without reloading the page.
    pollRef.current = setInterval(() => {
      client.get(`/projects/${projectId}/materials`).then((res) => {
        setMaterials(res.data.materials);
      });
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [projectId]);

  const upload = async (e) => {
    e.preventDefault();
    const file = fileInput.current.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await client.post(`/projects/${projectId}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fileInput.current.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to={`/projects/${projectId}`} className="text-sm text-brand-600">&larr; Project dashboard</Link>
      <h1 className="text-2xl font-semibold text-slate-800">Materials</h1>
      <ErrorBanner message={error} />

      <form onSubmit={upload} className="card flex items-center gap-3">
        <input ref={fileInput} type="file" accept="application/pdf" className="text-sm" />
        <button className="btn-primary" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
        <span className="text-xs text-slate-400">PDF only, up to 25MB. Processing runs in the background.</span>
      </form>

      {materials.length === 0 ? (
        <div className="card text-sm text-slate-500">No material uploaded yet.</div>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m._id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-slate-400">
                  {m.pageCount ? `${m.pageCount} pages` : m.originalFilename}
                  {m.failureReason && <span className="text-red-500"> — {m.failureReason}</span>}
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
