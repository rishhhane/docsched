import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSchedule, useUpdateSchedule, useDoctors } from '../api/apiClient';
import ScheduleTable from '../components/ScheduleTable';
import StatsPanel from '../components/StatsPanel';
import { Download, Sun, Moon, ArrowLeft, Loader2, Calendar, Undo, Redo } from 'lucide-react';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const now = new Date();
  const month = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString());
  const year = parseInt(searchParams.get('year') || now.getFullYear().toString());

  // Fetch schedule and stats
  const { data, isLoading, error } = useSchedule(month, year);
  const schedules = data?.schedules || [];
  
  // Fetch all doctors for the select dropdowns
  const { data: doctors = [] } = useDoctors();

  // Initialize the inline update mutation
  const updateScheduleMutation = useUpdateSchedule(month, year);

  const doctorLeavesMap = React.useMemo(() => {
    const map = {};
    (data?.stats || []).forEach(s => {
      map[s.doctor_id] = new Set(s.leave_dates);
    });
    return map;
  }, [data]);

  const consecutiveViolations = React.useMemo(() => {
    const violations = new Set();
    const schedules = data?.schedules || [];
    
    // Group schedules by date
    const byDate = {};
    schedules.forEach(s => {
      if (!byDate[s.date]) {
        byDate[s.date] = {};
      }
      byDate[s.date][s.shift] = s;
    });
    
    // Get sorted list of dates
    const dates = Object.keys(byDate).sort();
    
    dates.forEach((dateStr, idx) => {
      const dayShifts = byDate[dateStr];
      const morning = dayShifts.morning;
      const evening = dayShifts.evening;
      
      const morningDocs = [morning?.doctor_1?.id, morning?.doctor_2?.id, morning?.doctor_3?.id].filter(Boolean);
      const eveningDocs = [evening?.doctor_1?.id, evening?.doctor_2?.id, evening?.doctor_3?.id].filter(Boolean);
      
      // Rule 1: Morning & Evening of the same day (no back-to-back rest gap)
      morningDocs.forEach(docId => {
        if (eveningDocs.includes(docId)) {
          violations.add(`${dateStr}_morning_${docId}`);
          violations.add(`${dateStr}_evening_${docId}`);
        }
      });
      
      // Rule 2: Evening of day D & Morning of day D+1 (no back-to-back rest gap)
      if (idx < dates.length - 1) {
        const nextDateStr = dates[idx + 1];
        const nextMorning = byDate[nextDateStr]?.morning;
        const nextMorningDocs = [nextMorning?.doctor_1?.id, nextMorning?.doctor_2?.id, nextMorning?.doctor_3?.id].filter(Boolean);
        
        eveningDocs.forEach(docId => {
          if (nextMorningDocs.includes(docId)) {
            violations.add(`${dateStr}_evening_${docId}`);
            violations.add(`${nextDateStr}_morning_${docId}`);
          }
        });
      }
    });
    
    return violations;
  }, [data]);

  const [undoStack, setUndoStack] = React.useState([]);
  const [redoStack, setRedoStack] = React.useState([]);

  React.useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, [month, year]);

  const handleUpdateSlot = (scheduleId, updatedFields) => {
    const scheduleEntry = schedules.find(s => s.id === scheduleId);
    if (scheduleEntry) {
      const previousFields = {};
      Object.keys(updatedFields).forEach(key => {
        const slotName = key.replace('_id', '');
        previousFields[key] = scheduleEntry[slotName] ? scheduleEntry[slotName].id : null;
      });

      setUndoStack(prev => [...prev, { id: scheduleId, updatedFields, previousFields }]);
      setRedoStack([]);
    }

    updateScheduleMutation.mutate({
      id: scheduleId,
      ...updatedFields
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);

    updateScheduleMutation.mutate({
      id: action.id,
      ...action.previousFields
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);

    updateScheduleMutation.mutate({
      id: action.id,
      ...action.updatedFields
    });
  };

  const morningScrollRef = React.useRef(null);
  const eveningScrollRef = React.useRef(null);

  const handleScroll = (sourceRef, targetRef) => {
    return (e) => {
      const source = sourceRef.current;
      const target = targetRef.current;
      if (source && target) {
        if (Math.abs(target.scrollTop - e.target.scrollTop) > 0.5) {
          target.scrollTop = e.target.scrollTop;
        }
      }
    };
  };

  const handleMorningScroll = handleScroll(morningScrollRef, eveningScrollRef);
  const handleEveningScroll = handleScroll(eveningScrollRef, morningScrollRef);

  const getMonthName = (m) => {
    return new Date(2000, m - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold">Loading schedule dashboards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 glass-panel border border-rose-500/20 p-6 rounded-2xl text-center space-y-4 shadow-2xl">
        <h3 className="text-rose-400 font-bold text-lg">Error Loading Schedule</h3>
        <p className="text-sm text-slate-400">
          {error.response?.data?.error || 'A problem occurred while retrieving schedule entries.'}
        </p>
        <button
          onClick={() => navigate('/wizard')}
          className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 px-5 rounded-xl transition-all shadow-md"
        >
          Return to Wizard
        </button>
      </div>
    );
  }

  
  // Filter and sort shifts chronologically
  const morningSchedules = schedules
    .filter(s => s.shift === 'morning')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
    
  const eveningSchedules = schedules
    .filter(s => s.shift === 'evening')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="w-full px-2 sm:px-4 py-8 space-y-8">
      {/* Top dashboard action bar */}
      <div className="glass-panel rounded-3xl p-4 md:p-6 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all hover-scale shadow-sm"
            title="Go to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Dashboard</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1">
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Calendar className="text-brand-600 w-6 h-6" />
                Schedule for
              </h1>
              
              <div className="flex items-center gap-2">
                <select
                  value={month}
                  onChange={(e) => setSearchParams({ month: e.target.value, year: year.toString() })}
                  className="bg-white text-slate-800 rounded-xl px-3 py-1.5 text-sm border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>

                <select
                  value={year}
                  onChange={(e) => setSearchParams({ month: month.toString(), year: e.target.value })}
                  className="bg-white text-slate-800 rounded-xl px-3 py-1.5 text-sm border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Download PDF button linking to /api/export/pdf */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`flex items-center gap-1.5 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm ${
              undoStack.length === 0
                ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover-scale'
            }`}
            title="Undo last swap"
          >
            <Undo className="w-4 h-4" />
            Undo
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`flex items-center gap-1.5 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm ${
              redoStack.length === 0
                ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover-scale'
            }`}
            title="Redo last undone swap"
          >
            <Redo className="w-4 h-4" />
            Redo
          </button>

          <button
            onClick={() => navigate('/wizard')}
            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition-all hover-scale shadow-sm"
          >
            Adjust Configuration
          </button>
          
          <a
            href={`/api/export/pdf?month=${month}&year=${year}`}
            download
            className="glow-btn flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover-scale"
          >
            <Download className="w-5 h-5" />
            Download PDF Report
          </a>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="glass-panel border border-slate-200 rounded-2xl p-16 text-center space-y-4">
          <p className="text-slate-500">No schedules exist for this month yet.</p>
          <button
            onClick={() => navigate('/wizard')}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md hover-scale"
          >
            Open Wizard to Generate
          </button>
        </div>
      ) : (
        <>
          {/* Morning & Evening shift tables displayed side-by-side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ScheduleTable
              schedules={morningSchedules}
              allDoctors={doctors}
              doctorLeavesMap={doctorLeavesMap}
              consecutiveViolations={consecutiveViolations}
              onUpdate={handleUpdateSlot}
              title="Morning Shift (08:00 - 16:00)"
              headerColor="bg-amber-50 border-b border-amber-200 text-amber-800"
              scrollRef={morningScrollRef}
              onScroll={handleMorningScroll}
            />
            
            <ScheduleTable
              schedules={eveningSchedules}
              allDoctors={doctors}
              doctorLeavesMap={doctorLeavesMap}
              consecutiveViolations={consecutiveViolations}
              onUpdate={handleUpdateSlot}
              title="Evening Shift (16:00 - 00:00)"
              headerColor="bg-brand-50 border-b border-brand-200 text-brand-800"
              scrollRef={eveningScrollRef}
              onScroll={handleEveningScroll}
            />
          </div>

          {/* Detailed Statistics Panels */}
          <StatsPanel
            stats={data?.stats || []}
            rankings={data?.rankings || []}
          />
        </>
      )}
    </div>
  );
}
