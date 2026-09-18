import React from 'react';

const trendColor = { improving: 'bg-emerald-500', stable: 'bg-brand-500', attention: 'bg-amber-500' };
const trendLabel = { improving: 'Improving', stable: 'Stable', attention: 'Needs attention' };

export default function MasteryBar({ conceptName, level, trend }) {
  const pct = Math.round((level || 0) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{conceptName}</span>
        <span className="text-slate-500">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${trendColor[trend] || 'bg-brand-500'} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      {trend && <div className="text-xs text-slate-400 mt-1">{trendLabel[trend]}</div>}
    </div>
  );
}
