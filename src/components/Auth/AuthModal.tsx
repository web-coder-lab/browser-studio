import React, { useState } from 'react';
import { UserAccount } from '../../types/ide';
import { registerUser, loginUser } from '../../services/authService';
import { 
  User, 
  Mail, 
  Lock, 
  UserCheck, 
  ArrowRight, 
  X, 
  Terminal,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onAuthSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  
  // Registration Form
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = registerUser(regEmail, regUsername, regDisplayName, regPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
      return;
    }

    if (res.user) {
      onAuthSuccess(res.user);
      onClose();
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = loginUser(loginIdentifier, loginPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed.');
      return;
    }

    if (res.user) {
      onAuthSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-[#0c0f17] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="h-14 bg-[#080a11] border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">Browser Studio Identity</h2>
              <p className="text-[10.5px] text-slate-400">Zero-Trust Client Workspace Authentication</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-[#07090e]">
          <button
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors text-center border-b-2 ${
              mode === 'register'
                ? 'border-indigo-500 text-indigo-400 bg-[#0c0f17]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Create New Account
          </button>
          <button
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors text-center border-b-2 ${
              mode === 'login'
                ? 'border-indigo-500 text-indigo-400 bg-[#0c0f17]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2 bg-[#080a11] border border-slate-700/80 rounded-xl px-3 py-2 focus-within:border-indigo-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="developer@studio.io"
                    className="flex-1 bg-transparent text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Username (Unique Handle)
                </label>
                <div className="flex items-center gap-2 bg-[#080a11] border border-slate-700/80 rounded-xl px-3 py-2 focus-within:border-indigo-500">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. alex_dev"
                    className="flex-1 bg-transparent text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Display Name
                </label>
                <div className="flex items-center gap-2 bg-[#080a11] border border-slate-700/80 rounded-xl px-3 py-2 focus-within:border-indigo-500">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivers"
                    className="flex-1 bg-transparent text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="flex items-center gap-2 bg-[#080a11] border border-slate-700/80 rounded-xl px-3 py-2 focus-within:border-indigo-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="flex-1 bg-transparent text-xs text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
              >
                <span>Register & Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Username or Email
                </label>
                <div className="flex items-center gap-2 bg-[#080a11] border border-slate-700/80 rounded-xl px-3 py-2.5 focus-within:border-indigo-500">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="alex_dev or alex@studio.io"
                    className="flex-1 bg-transparent text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="flex items-center gap-2 bg-[#080a11] border border-slate-700/80 rounded-xl px-3 py-2.5 focus-within:border-indigo-500">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="flex-1 bg-transparent text-xs text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
              >
                <span>Sign In to Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="h-10 bg-[#080a11] border-t border-slate-800 px-6 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local Device Storage (Client Security)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
