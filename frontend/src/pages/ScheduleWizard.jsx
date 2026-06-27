import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctors, useLeaves, useSaveLeaves, useGenerateSchedule } from '../api/apiClient';
import LeaveCalendar from '../components/LeaveCalendar';
import { Calendar, UserCheck, Play, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ScheduleWizard() {
  const navigate = useNavigate();
  const { data: doctors = [] } = useDoctors();
  const { data: leaves = [] } = useLeaves();
  const saveLeavesMutation = useSaveLeaves();
  const generateScheduleMutation = useGenerateSchedule();

  const [step, setStep] = useState(1);
  
  // Date state
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  // Selected doctor for leave editing
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const selectedDoctor = doctors.find(d => d.id === parseInt(selectedDoctorId));

  // Get leaves for the selected doctor specifically
  const doctorLeaves = leaves
    .filter(l => l.doctor_id === parseInt(selectedDoctorId))
    .map(l => l.leave_date);

  const handleLeavesChange = (newDates) => {
    if (!selectedDoctorId) return;
    saveLeavesMutation.mutate({
      doctor_id: parseInt(selectedDoctorId),
      leave_dates: newDates
    });
  };

  const handleGenerate = () => {
    generateScheduleMutation.mutate(
      { month, year },
      {
        onSuccess: () => {
          // Navigate to dashboard upon successful generation
          navigate(`/dashboard?month=${month}&year=${year}`);
        }
      }
    );
  };

  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Visual Stepper Progress Bar */}
      <div className="flex items-center justify-center mb-10 max-w-lg mx-auto">
        <div className="flex items-center w-full">
          {/* Step 1 */}
          <div className="flex flex-col items-center relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
              step >= 1 ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-550/20' : 'bg-white text-slate-400 border-slate-200 shadow-sm'
            }`}>
              1
            </div>
            <span className={`text-xs font-semibold mt-2 absolute top-10 whitespace-nowrap ${step === 1 ? 'text-brand-600' : 'text-slate-400'}`}>
              Pick Month
            </span>
          </div>

          {/* Line 1 */}
          <div className={`flex-1 h-1.5 mx-2 rounded-full transition-colors ${
            step >= 2 ? 'bg-brand-500' : 'bg-slate-200'
          }`} />

          {/* Step 2 */}
          <div className="flex flex-col items-center relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
              step >= 2 ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-550/20' : 'bg-white text-slate-400 border-slate-200 shadow-sm'
            }`}>
              2
            </div>
            <span className={`text-xs font-semibold mt-2 absolute top-10 whitespace-nowrap ${step === 2 ? 'text-brand-600' : 'text-slate-400'}`}>
              Set Leaves
            </span>
          </div>

          {/* Line 2 */}
          <div className={`flex-1 h-1.5 mx-2 rounded-full transition-colors ${
            step >= 3 ? 'bg-brand-500' : 'bg-slate-200'
          }`} />

          {/* Step 3 */}
          <div className="flex flex-col items-center relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
              step >= 3 ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-550/20' : 'bg-white text-slate-400 border-slate-200 shadow-sm'
            }`}>
              3
            </div>
            <span className={`text-xs font-semibold mt-2 absolute top-10 whitespace-nowrap ${step === 3 ? 'text-brand-600' : 'text-slate-400'}`}>
              Generate
            </span>
          </div>
        </div>
      </div>

      <div className="mt-14">
        {/* STEP 1: PICK MONTH */}
        {step === 1 && (
          <div className="glass-panel rounded-2xl p-8 border border-slate-200 shadow-md space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <Calendar className="text-brand-600 w-6 h-6" />
              Step 1: Select Scheduling Month & Year
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer font-medium shadow-sm"
                >
                  {monthsList.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md hover-scale flex items-center gap-2"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONFIGURE LEAVES */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 shadow-md">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-4">
                <UserCheck className="text-brand-600 w-6 h-6" />
                Step 2: Configure Doctor Leave Calendar
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Doctor to Declare Leaves
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer font-medium shadow-sm"
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (P{d.priority})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDoctor && (
              <LeaveCalendar
                doctor={selectedDoctor}
                month={month}
                year={year}
                selectedDates={doctorLeaves}
                onChange={handleLeavesChange}
              />
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm hover-scale flex items-center gap-2 border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md hover-scale flex items-center gap-2"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RUN SCHEDULER */}
        {step === 3 && (
          <div className="glass-panel rounded-2xl p-8 border border-slate-200 shadow-md text-center space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2.5 border-b border-slate-200 pb-3">
              <Play className="text-brand-600 w-6 h-6 animate-pulse" />
              Step 3: Generate Monthly Schedule
            </h2>

            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-2 shadow-sm">
                <span className="text-slate-500 text-sm block">Selected Target Month</span>
                <span className="text-2xl font-black text-slate-800">
                  {monthsList.find(m => m.value === month)?.label} {year}
                </span>
              </div>

              <p className="text-sm text-slate-500">
                The core scheduler runs in a single-pass balancing workload constraints, prioritizing Slot 1 (P1), Slot 2 (P2), and Slot 3 (P3) doctors, avoiding back-to-back night-to-morning duties, and excluding declared leave dates.
              </p>

              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-750 text-xs rounded-xl font-semibold">
                Warning: Triggering generation will overwrite any existing schedule for this month.
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={generateScheduleMutation.isPending}
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm hover-scale flex items-center gap-2 border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generateScheduleMutation.isPending}
                className="bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md hover-scale flex items-center gap-2"
              >
                {generateScheduleMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin" />
                    Generating Schedule...
                  </span>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white text-white" />
                    Generate Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
