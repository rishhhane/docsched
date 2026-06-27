import React, { useState, useEffect } from 'react';

export default function DoctorDropdown({ currentDoctor, allDoctors, doctorLeavesMap = {}, date, onSelect, onCancel }) {
  const [selectedId, setSelectedId] = useState(currentDoctor ? currentDoctor.id : '');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleChange = (e) => {
    const val = e.target.value;
    setSelectedId(val);
    onSelect(val === '' ? null : parseInt(val));
  };

  return (
    <div className="flex items-center gap-1.5 inline-block z-10">
      <select
        value={selectedId}
        onChange={handleChange}
        className="bg-white text-slate-800 rounded-lg px-2.5 py-1 text-sm border border-slate-300 shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer font-medium"
        autoFocus
      >
        <option value="">-- Unassigned --</option>
        <optgroup label="Priority 1" className="text-emerald-600 font-bold bg-white">
          {allDoctors.filter(d => d.priority === 1).map(d => {
            const isOnLeave = doctorLeavesMap[d.id]?.has(date);
            return (
              <option 
                key={d.id} 
                value={d.id} 
                className={`${isOnLeave ? 'text-red-600 font-semibold' : 'text-slate-800'} font-normal`}
                style={isOnLeave ? { color: '#dc2626' } : undefined}
              >
                {d.name}{isOnLeave ? ' (On Leave ⚠️)' : ''}
              </option>
            );
          })}
        </optgroup>
        <optgroup label="Priority 2" className="text-cyan-600 font-bold bg-white">
          {allDoctors.filter(d => d.priority === 2).map(d => {
            const isOnLeave = doctorLeavesMap[d.id]?.has(date);
            return (
              <option 
                key={d.id} 
                value={d.id} 
                className={`${isOnLeave ? 'text-red-600 font-semibold' : 'text-slate-800'} font-normal`}
                style={isOnLeave ? { color: '#dc2626' } : undefined}
              >
                {d.name}{isOnLeave ? ' (On Leave ⚠️)' : ''}
              </option>
            );
          })}
        </optgroup>
        <optgroup label="Priority 3" className="text-violet-600 font-bold bg-white">
          {allDoctors.filter(d => d.priority === 3).map(d => {
            const isOnLeave = doctorLeavesMap[d.id]?.has(date);
            return (
              <option 
                key={d.id} 
                value={d.id} 
                className={`${isOnLeave ? 'text-red-600 font-semibold' : 'text-slate-800'} font-normal`}
                style={isOnLeave ? { color: '#dc2626' } : undefined}
              >
                {d.name}{isOnLeave ? ' (On Leave ⚠️)' : ''}
              </option>
            );
          })}
        </optgroup>
      </select>
      <button
        onClick={onCancel}
        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
      >
        Cancel
      </button>
    </div>
  );
}
