import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/activity', label: 'Activity' },
  { to: '/admin/ai-usage', label: 'AI Usage' },
  { to: '/admin/jobs', label: 'Jobs' },
];

export default function AdminNav() {
  const { pathname } = useLocation();
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={`text-sm px-3 py-1.5 rounded-lg border ${
            pathname === t.to ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
