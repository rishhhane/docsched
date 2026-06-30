import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import ScheduleWizard from './pages/ScheduleWizard';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { useCurrentUser, useLogout } from './api/apiClient';
import { Stethoscope, LogOut, User as UserIcon } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <span className="text-slate-500 text-xs font-semibold mt-4">Loading Portal...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        
        {/* Main Navigation Header */}
        <header className="glass-panel sticky top-0 z-50 border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 hover-scale">
              <Stethoscope className="text-brand-600 w-6 h-6" />
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-800 to-slate-950 bg-clip-text text-transparent">
                MedScheduler
              </span>
            </Link>
            
            <nav className="flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link to="/" className="hover:text-brand-600 transition-colors">
                Doctors
              </Link>
              <Link to="/wizard" className="hover:text-brand-600 transition-colors">
                Wizard
              </Link>
              <Link to="/dashboard" className="hover:text-brand-600 transition-colors">
                Dashboard
              </Link>
              
              <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
              
              {/* User badge and Logout button */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  {user.username}
                </span>
                <button
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/60 active:scale-[0.98] px-3 py-1.5 rounded-xl border border-rose-200/40 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wizard" element={<ScheduleWizard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-6 bg-slate-100/50 text-center text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} MedScheduler Portal. Built with React + Flask + PostgreSQL.</p>
        </footer>

      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

