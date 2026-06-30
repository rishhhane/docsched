import React, { useState } from 'react';
import DoctorDropdown from './DoctorDropdown';

export default function ScheduleTable({ schedules, allDoctors, doctorLeavesMap = {}, consecutiveViolations = new Set(), onUpdate, title, headerColor, scrollRef, onScroll }) {
  const [editingCell, setEditingCell] = useState(null); // { scheduleId, slot } (e.g. slot = 'doctor_1_id')

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 2: return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 3: return 'bg-violet-50 text-violet-700 border border-violet-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getDayOfWeekColor = (dayName) => {
    if (dayName === 'Sat' || dayName === 'Sun') {
      return 'text-rose-600 font-semibold';
    }
    return 'text-slate-500';
  };

  const formatDayName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDayNumber = (dateStr) => {
    const d = new Date(dateStr);
    return d.getDate().toString().padStart(2, '0');
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg transition-all border border-slate-200">
      {/* Header bar */}
      <div className={`px-6 py-4 flex items-center justify-between border-b border-slate-200 ${headerColor}`}>
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          {title}
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
          {schedules.length} Days
        </span>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="overflow-x-hidden overflow-y-auto max-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
              <th className="py-3 px-1 sm:px-2 w-14 text-center font-bold">Date</th>
              <th className="py-3 px-1 sm:px-2 w-14 text-center font-bold">Day</th>
              <th className="py-3 px-2 xl:px-4 font-bold">Slot 1 (P1)</th>
              <th className="py-3 px-2 xl:px-4 font-bold">Slot 2 (P2)</th>
              <th className="py-3 px-2 xl:px-4 font-bold">Slot 3 (P3)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {schedules.map((s) => {
              const dayName = formatDayName(s.date);
              const isWeekend = dayName === 'Sat' || dayName === 'Sun';

              // Determine if doctors assigned are on leave
              const doc1OnLeave = s.doctor_1 && doctorLeavesMap[s.doctor_1.id]?.has(s.date);
              const doc2OnLeave = s.doctor_2 && doctorLeavesMap[s.doctor_2.id]?.has(s.date);
              const doc3OnLeave = s.doctor_3 && doctorLeavesMap[s.doctor_3.id]?.has(s.date);

              // Determine if doctors have consecutive shift violations
              const doc1Violation = s.doctor_1 && consecutiveViolations.has(`${s.date}_${s.shift}_${s.doctor_1.id}`);
              const doc2Violation = s.doctor_2 && consecutiveViolations.has(`${s.date}_${s.shift}_${s.doctor_2.id}`);
              const doc3Violation = s.doctor_3 && consecutiveViolations.has(`${s.date}_${s.shift}_${s.doctor_3.id}`);

              // Determine if doctors are repeated on the same shift row across P1/P2/P3
              const name1 = s.doctor_1?.name;
              const name2 = s.doctor_2?.name;
              const name3 = s.doctor_3?.name;

              const doc1Repeated = name1 && (name1 === name2 || name1 === name3);
              const doc2Repeated = name2 && (name2 === name1 || name2 === name3);
              const doc3Repeated = name3 && (name3 === name1 || name3 === name2);

              return (
                <tr key={s.id} className={`transition-colors hover:bg-slate-100/50 ${isWeekend ? 'bg-slate-100/30' : ''}`}>
                  {/* Date column */}
                  <td className="py-3 px-1 sm:px-2 text-center font-bold text-slate-700 bg-slate-50">
                    {formatDayNumber(s.date)}
                  </td>
                  
                  {/* Day column */}
                  <td className={`py-3 px-1 sm:px-2 text-center ${getDayOfWeekColor(dayName)}`}>
                    {dayName}
                  </td>

                  {/* Slot 1 (P1) */}
                  <td className="py-3 px-2 xl:px-4 font-medium">
                    {editingCell?.scheduleId === s.id && editingCell?.slot === 'doctor_1_id' ? (
                      <DoctorDropdown
                        currentDoctor={s.doctor_1}
                        allDoctors={allDoctors}
                        doctorLeavesMap={doctorLeavesMap}
                        date={s.date}
                        onSelect={(id) => {
                          onUpdate(s.id, { doctor_1_id: id });
                          setEditingCell(null);
                        }}
                        onCancel={() => setEditingCell(null)}
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ scheduleId: s.id, slot: 'doctor_1_id' })}
                        className="group flex items-center justify-between cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                      >
                        {s.doctor_1 ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityBadgeColor(1)}`}>
                              P1
                            </span>
                            {doc1OnLeave ? (
                              <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1" title={`${s.doctor_1.name} is on leave today!`}>
                                ⚠️ {s.doctor_1.name} (On Leave)
                              </span>
                            ) : doc1Violation ? (
                              <span className="text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse" title={`${s.doctor_1.name} has consecutive shifts (no rest gap)!`}>
                                🚨 {s.doctor_1.name} (Consecutive)
                              </span>
                            ) : doc1Repeated ? (
                              <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1" title={`${s.doctor_1.name} is assigned multiple times on this shift!`}>
                                🔄 {s.doctor_1.name} (Duplicate)
                              </span>
                            ) : (
                              <span className="text-slate-700 group-hover:text-emerald-600 transition-colors font-medium">
                                {s.doctor_1.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
                        )}
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-brand-600 font-bold transition-opacity">Swap</span>
                      </div>
                    )}
                  </td>

                  {/* Slot 2 (P2) */}
                  <td className="py-3 px-2 xl:px-4 font-medium">
                    {editingCell?.scheduleId === s.id && editingCell?.slot === 'doctor_2_id' ? (
                      <DoctorDropdown
                        currentDoctor={s.doctor_2}
                        allDoctors={allDoctors}
                        doctorLeavesMap={doctorLeavesMap}
                        date={s.date}
                        onSelect={(id) => {
                          onUpdate(s.id, { doctor_2_id: id });
                          setEditingCell(null);
                        }}
                        onCancel={() => setEditingCell(null)}
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ scheduleId: s.id, slot: 'doctor_2_id' })}
                        className="group flex items-center justify-between cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                      >
                        {s.doctor_2 ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityBadgeColor(s.doctor_2.priority)}`}>
                              P{s.doctor_2.priority}
                            </span>
                            {doc2OnLeave ? (
                              <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1" title={`${s.doctor_2.name} is on leave today!`}>
                                ⚠️ {s.doctor_2.name} (On Leave)
                              </span>
                            ) : doc2Violation ? (
                              <span className="text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse" title={`${s.doctor_2.name} has consecutive shifts (no rest gap)!`}>
                                🚨 {s.doctor_2.name} (Consecutive)
                              </span>
                            ) : doc2Repeated ? (
                              <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1" title={`${s.doctor_2.name} is assigned multiple times on this shift!`}>
                                🔄 {s.doctor_2.name} (Duplicate)
                              </span>
                            ) : (
                              <span className="text-slate-700 group-hover:text-cyan-600 transition-colors font-medium">
                                {s.doctor_2.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
                        )}
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-brand-600 font-bold transition-opacity">Swap</span>
                      </div>
                    )}
                  </td>

                  {/* Slot 3 (P3) */}
                  <td className="py-3 px-2 xl:px-4 font-medium">
                    {editingCell?.scheduleId === s.id && editingCell?.slot === 'doctor_3_id' ? (
                      <DoctorDropdown
                        currentDoctor={s.doctor_3}
                        allDoctors={allDoctors}
                        doctorLeavesMap={doctorLeavesMap}
                        date={s.date}
                        onSelect={(id) => {
                          onUpdate(s.id, { doctor_3_id: id });
                          setEditingCell(null);
                        }}
                        onCancel={() => setEditingCell(null)}
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ scheduleId: s.id, slot: 'doctor_3_id' })}
                        className="group flex items-center justify-between cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                      >
                        {s.doctor_3 ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityBadgeColor(s.doctor_3.priority)}`}>
                              P{s.doctor_3.priority}
                            </span>
                            {doc3OnLeave ? (
                              <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1" title={`${s.doctor_3.name} is on leave today!`}>
                                ⚠️ {s.doctor_3.name} (On Leave)
                              </span>
                            ) : doc3Violation ? (
                              <span className="text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse" title={`${s.doctor_3.name} has consecutive shifts (no rest gap)!`}>
                                🚨 {s.doctor_3.name} (Consecutive)
                              </span>
                            ) : doc3Repeated ? (
                              <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1" title={`${s.doctor_3.name} is assigned multiple times on this shift!`}>
                                🔄 {s.doctor_3.name} (Duplicate)
                              </span>
                            ) : (
                              <span className="text-slate-700 group-hover:text-brand-600 transition-colors font-medium">
                                {s.doctor_3.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
                        )}
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-brand-600 font-bold transition-opacity">Swap</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
