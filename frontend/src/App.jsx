import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import ScheduleWizard from './pages/ScheduleWizard';
import Dashboard from './pages/Dashboard';
import { Stethoscope } from 'lucide-react';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              </nav>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/wizard" element={<ScheduleWizard />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 py-6 bg-slate-100/50 text-center text-xs text-slate-500 font-medium">
            <p>© {new Date().getFullYear()} MedScheduler Portal. Built with React + Flask + SQLAlchemy.</p>
          </footer>

        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
