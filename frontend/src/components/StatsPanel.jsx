import React from 'react';

export default function StatsPanel({ stats, rankings }) {
  // Calculate average shifts to evaluate equity
  const totalAssignedShifts = stats.reduce((sum, s) => sum + s.total_shifts, 0);
  const avgShifts = stats.length > 0 ? (totalAssignedShifts / stats.length).toFixed(1) : 0;

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 2: return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 3: return 'bg-violet-50 text-violet-700 border border-violet-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getEquityBadge = (totalShifts) => {
    const diff = totalShifts - parseFloat(avgShifts);
    if (diff > 3) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Overworked
        </span>
      );
    } else if (diff < -3) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Underutilized
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Balanced
      </span>
    );
  };

  // Find max shifts to scale progress bars
  const maxShifts = Math.max(...stats.map(s => s.total_shifts), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      
      {/* 1. Workload Table (Takes 2 cols on lg screens) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Workload & Leaves Reference</h3>
            <p className="text-xs text-slate-500 mt-0.5">Summary of shifts assigned and leaves per doctor</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Average Shifts / Doctor</span>
            <span className="text-lg font-bold text-brand-600">{avgShifts}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                <th className="py-2.5 px-3">Doctor</th>
                <th className="py-2.5 px-3 text-center">Priority</th>
                <th className="py-2.5 px-3 text-center">Morning</th>
                <th className="py-2.5 px-3 text-center">Evening</th>
                <th className="py-2.5 px-3 text-center">Total Shifts</th>
                <th className="py-2.5 px-3">Leave Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {[...stats]
                .sort((a, b) => {
                  if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                  }
                  return a.doctor_name.localeCompare(b.doctor_name);
                })
                .map((s) => (
                  <tr key={s.doctor_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-750">{s.doctor_name}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityBadgeColor(s.priority)}`}>
                        P{s.priority}
                      </span>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">{s.morning_shifts}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{s.evening_shifts}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      {s.total_shifts}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-[200px] truncate text-slate-500 text-xs">
                    {s.leave_dates.length > 0 ? (
                      <span title={s.leave_dates.join(', ')}>
                        {s.leave_dates.map(date => date.split('-')[2]).join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Workload Rankings (Takes 1 col on lg screens) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col">
        <div className="border-b border-slate-200 pb-4 mb-4">
          <h3 className="font-bold text-lg text-slate-800">Equity Rankings</h3>
          <p className="text-xs text-slate-500 mt-0.5">Ranked by fewest shifts assigned (most eligible first)</p>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1">
          {rankings.map((r, idx) => {
            const pct = Math.round((r.total_shifts / maxShifts) * 100);
            return (
              <div key={r.doctor_id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600 bg-slate-200 w-5 h-5 flex items-center justify-center rounded-full">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-700">{r.doctor_name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getPriorityBadgeColor(r.priority)}`}>
                    P{r.priority}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-brand-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-12 text-right">
                    {r.total_shifts} shifts
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>M: {r.morning_shifts} • E: {r.evening_shifts}</span>
                  {getEquityBadge(r.total_shifts)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
