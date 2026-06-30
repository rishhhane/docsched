import React from 'react';

export default function LeaveCalendar({ doctor, month, year, selectedDates = [], onChange }) {
  const [lastClickedDate, setLastClickedDate] = React.useState(null);

  React.useEffect(() => {
    setLastClickedDate(null);
  }, [doctor, month, year]);

  if (!doctor) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
        <p className="text-sm">Please select a doctor to manage their leave dates.</p>
      </div>
    );
  }

  // Get date helper structures
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday, 1 is Monday...

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build dates list
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null); // blank spots for offset
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    days.push({ dayNum: d, dateStr });
  }

  const handleDateClick = (dateStr, e) => {
    let updated;
    if (e.shiftKey && lastClickedDate) {
      const startDay = parseInt(lastClickedDate.split('-')[2]);
      const endDay = parseInt(dateStr.split('-')[2]);
      const minDay = Math.min(startDay, endDay);
      const maxDay = Math.max(startDay, endDay);
      
      const rangeDates = [];
      for (let d = minDay; d <= maxDay; d++) {
        const dStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        rangeDates.push(dStr);
      }
      
      const shouldSelect = selectedDates.includes(lastClickedDate);
      if (shouldSelect) {
        updated = Array.from(new Set([...selectedDates, ...rangeDates]));
      } else {
        updated = selectedDates.filter(d => !rangeDates.includes(d));
      }
    } else {
      if (selectedDates.includes(dateStr)) {
        updated = selectedDates.filter(d => d !== dateStr);
      } else {
        updated = [...selectedDates, dateStr];
      }
    }
    setLastClickedDate(dateStr);
    onChange(updated);
  };

  const handleToggleWeekends = () => {
    const updated = [...selectedDates];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      if (isWeekend) {
        if (!updated.includes(dateStr)) {
          updated.push(dateStr);
        }
      }
    }
    onChange(updated);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800">
            Leave Calendar: <span className="text-brand-600">{doctor.name}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click on calendar dates to toggle leaves for this doctor.
          </p>
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={handleToggleWeekends}
            type="button"
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-sm"
          >
            Select Weekends
          </button>
          <button
            onClick={handleClearAll}
            type="button"
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shadow-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
        {weekdays.map((w, idx) => (
          <div key={w} className={`py-1.5 ${idx === 0 || idx === 6 ? 'text-rose-600' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, index) => {
          if (!d) {
            return <div key={`empty-${index}`} className="aspect-square bg-slate-100 rounded-xl" />;
          }

          const isSelected = selectedDates.includes(d.dateStr);
          const dateObj = new Date(year, month - 1, d.dayNum);
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={(e) => handleDateClick(d.dateStr, e)}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 hover-scale
                ${isSelected 
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20' 
                  : isWeekend 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }
              `}
            >
              <span className="text-sm">{d.dayNum}</span>
              {isSelected && (
                <span className="absolute bottom-1.5 text-[8px] tracking-wide uppercase font-extrabold px-1 rounded bg-rose-600 text-white">
                  LEAVE
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
