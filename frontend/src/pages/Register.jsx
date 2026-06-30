import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../api/apiClient';
import { Stethoscope, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const registerMutation = useRegister();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    
    registerMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          navigate('/');
        },
        onError: (err) => {
          setErrorMsg(err.response?.data?.error || 'Registration failed. Username might be taken.');
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden">
      
      {/* Dynamic Background Blur Shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md z-10">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 bg-gradient-to-b from-brand-500 to-brand-600 rounded-2xl shadow-xl shadow-brand-500/20 mb-3 border border-brand-400/30">
            <Stethoscope className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Sign up to generate customized doctor rotas
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          
          {/* Welcome Info Box */}
          <div className="flex items-start gap-3 p-3.5 mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">Quick Onboarding Included!</p>
              <p className="text-slate-400 font-medium">We will automatically seed your account with 20 default sample doctors so you can test scheduling right away.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-sm font-medium animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            
            {/* Username field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Confirm Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
            >
              {registerMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account & Get Started'
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="text-center mt-6 pt-6 border-t border-slate-800/80">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-brand-400 hover:text-brand-300 hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
