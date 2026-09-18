import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function Tutor() {
  const { projectId } = useParams();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    client
      .get(`/projects/${projectId}/tutor/history`)
      .then((res) => setMessages(res.data.messages))
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', content: q, createdAt: new Date().toISOString() }]);
    setAsking(true);
    setError('');
    try {
      const res = await client.post(`/projects/${projectId}/tutor/ask`, { question: q });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations,
          unsupported: res.data.unsupported,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'The Tutor could not answer that.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link to={`/projects/${projectId}`} className="text-sm text-brand-600">&larr; Project dashboard</Link>
      <h1 className="text-2xl font-semibold text-slate-800">AI Tutor</h1>
      <ErrorBanner message={error} />

      <div className="card h-[55vh] overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Ask anything about this Project's uploaded material. The Tutor only answers from what you've
            uploaded, and will say so if it doesn't have enough evidence.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : m.unsupported
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <div>{m.content}</div>
              {m.citations?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                  {m.citations.map((c, ci) => (
                    <div key={ci} className="text-xs text-slate-500">
                      Source: {c.materialTitle}
                      {c.page ? ` — Page ${c.page}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={ask} className="flex gap-2">
        <input
          className="input"
          placeholder="Ask the Tutor a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={asking}
        />
        <button className="btn-primary" disabled={asking}>
          {asking ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}
