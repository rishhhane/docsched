import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctors, useAddDoctor, useDeleteDoctor, useUpdateDoctor } from '../api/apiClient';
import { UserPlus, Trash2, Calendar, Award, ArrowRight, Activity, Users } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { data: doctors = [], isLoading, error } = useDoctors();
  const addDoctorMutation = useAddDoctor();
  const deleteDoctorMutation = useDeleteDoctor();
  const updateDoctorMutation = useUpdateDoctor();

  const [name, setName] = useState('');
  const [priority, setPriority] = useState('1');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Doctor name is required');
      return;
    }

    addDoctorMutation.mutate(
      { name: name.trim(), priority: parseInt(priority) },
      {
        onSuccess: () => {
          setName('');
          setPriority('1');
        },
        onError: (err) => {
          setFormError(err.response?.data?.error || 'Failed to add doctor');
        }
      }
    );
  };

  const handleDelete = (id) => {
    deleteDoctorMutation.mutate(id);
  };

  // Metrics
  const totalDoctors = doctors.length;
  const p1Count = doctors.filter(d => d.priority === 1).length;
  const p2Count = doctors.filter(d => d.priority === 2).length;
  const p3Count = doctors.filter(d => d.priority === 3).length;

  // Sort doctors by priority tier, then alphabetically by name
  const sortedDoctors = [...doctors].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome header banner */}
      <div className="glass-panel rounded-3xl p-8 mb-8 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            <Activity className="text-brand-600 w-8 h-8 animate-pulse" />
            Doctor Schedule Management Portal
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl">
            Register medical practitioners, declare priority tiers, configure individual leaves, and automatically generate balanced shift schedules.
          </p>
        </div>
        <button
          onClick={() => navigate('/wizard')}
          className="glow-btn flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg hover-scale self-start md:self-center"
        >
          <Calendar className="w-5 h-5" />
          Schedule Wizard
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Metrics distribution cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel border border-slate-200 p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="bg-brand-500/10 p-3 rounded-xl border border-brand-500/20 text-brand-650">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Total Doctors</span>
            <span className="text-2xl font-black text-slate-800">{totalDoctors}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200 p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Priority 1 (Primary)</span>
            <span className="text-2xl font-black text-emerald-600">{p1Count}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200 p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 text-cyan-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Priority 2 (Secondary)</span>
            <span className="text-2xl font-black text-cyan-600">{p2Count}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200 p-5 rounded-2xl shadow-md flex items-center gap-4">
          <div className="bg-violet-500/10 p-3 rounded-xl border border-violet-500/20 text-violet-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Priority 3 (Tertiary)</span>
            <span className="text-2xl font-black text-violet-600">{p3Count}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-slate-200 shadow-md h-fit">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
            <UserPlus className="text-brand-600 w-5 h-5" />
            Add New Doctor
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Arthur Pendragon"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="1">Priority 1 (Core / Full Time)</option>
                <option value="2">Priority 2 (Associate / Part Time)</option>
                <option value="3">Priority 3 (On Call / Resident)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Slot scheduling relies on these priority tiers, filling core shifts first.
              </p>
            </div>

            {formError && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={addDoctorMutation.isPending}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md hover-scale flex items-center justify-center gap-2"
            >
              {addDoctorMutation.isPending ? 'Registering...' : 'Add Doctor'}
            </button>
          </form>
        </div>

        {/* Doctor List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3">
            Registered Practitioners
          </h2>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Loading doctor list...</div>
          ) : error ? (
            <div className="py-12 text-center text-rose-600 font-bold">Failed to load doctor list.</div>
          ) : doctors.length === 0 ? (
            <div className="py-16 text-center text-slate-500 italic">
              No doctors registered yet. Add sample doctors above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3 text-center">Priority</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {sortedDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-slate-700">{doc.name}</td>
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={doc.priority}
                          onChange={(e) => {
                            updateDoctorMutation.mutate({ id: doc.id, priority: parseInt(e.target.value) });
                          }}
                          disabled={updateDoctorMutation.isPending}
                          className={`text-xs font-bold uppercase rounded-md border px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer transition-all bg-white font-semibold ${
                            doc.priority === 1 ? 'text-emerald-600 border-emerald-250 bg-emerald-50/50 hover:bg-emerald-50' :
                            doc.priority === 2 ? 'text-cyan-600 border-cyan-250 bg-cyan-50/50 hover:bg-cyan-50' :
                            'text-violet-600 border-violet-250 bg-violet-50/50 hover:bg-violet-50'
                          }`}
                        >
                          <option value="1" className="bg-white text-emerald-600 font-semibold">Priority 1</option>
                          <option value="2" className="bg-white text-cyan-600 font-semibold">Priority 2</option>
                          <option value="3" className="bg-white text-violet-600 font-semibold">Priority 3</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleteDoctorMutation.isPending}
                          className="text-rose-600 hover:text-rose-500 p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-200 shadow-sm"
                          title="Delete Doctor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
