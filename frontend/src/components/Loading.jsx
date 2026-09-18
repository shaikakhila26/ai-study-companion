import React from 'react';

export default function Loading({ label = 'Loading...' }) {
  return <div className="p-8 text-center text-slate-400 text-sm">{label}</div>;
}
