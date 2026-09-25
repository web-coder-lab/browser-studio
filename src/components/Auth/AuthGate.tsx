import React, { useState } from 'react';
import { UserAccount } from '../../types/ide';
import { loginUser, registerUser, requestOtp, verifyOtp, recoverPassword } from '../../services/authService';
import { Terminal, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthGateProps {
  onAuthSuccess: (user: UserAccount) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [step, setStep] = useState<'email' | 'otp' | 'profile' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await fn(); } catch (e: any) { setError(e.message || 'Request failed'); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen w-screen bg-[#07090e] text-slate-100 font-sans flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold">Browser Studio</h1>
            <p className="text-xs text-slate-400">Editor, preview, and your files. Accounts live in Firebase.</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm max-w-md leading-6">
          One place for project files, the code panel, live preview, and Run.
          Custom domains, fake Linux installs, and demo logins were removed because they were not real.
        </p>
        <a className="text-cyan-400 text-sm mt-6" href="/help.html">Open the full help guide</a>
      </div>
      <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center">
        <form className="w-full max-w-sm space-y-4" onSubmit={(e) => e.preventDefault()}>
          <h2 className="text-xl font-semibold">
            {mode === 'login' ? 'Log in' : mode === 'forgot' ? 'Reset password' : 'Create account'}
          </h2>
          {mode === 'register' && step === 'email' && (
            <>
              <label className="block text-xs text-slate-400">Gmail / email
                <input className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <button className="w-full bg-indigo-600 rounded-lg py-2 font-medium flex items-center justify-center gap-2" disabled={busy} onClick={() => run(async () => {
                const r = await requestOtp(email, 'signup');
                setStep('otp');
                setInfo(r.devCode ? `Dev code: ${r.devCode}` : 'Check your email for the 6-digit code.');
              })}>Send code <Mail className="w-4 h-4" /></button>
            </>
          )}
          {mode === 'register' && step === 'otp' && (
            <>
              <label className="block text-xs text-slate-400">Code sent to {email}
                <input className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} />
              </label>
              <button className="w-full bg-indigo-600 rounded-lg py-2" disabled={busy} onClick={() => run(async () => {
                await verifyOtp(email, code, 'signup');
                setStep('profile');
                setInfo('Email verified. Set your name and password.');
              })}>Verify code</button>
            </>
          )}
          {mode === 'register' && step === 'profile' && (
            <>
              <label className="block text-xs text-slate-400">Display name
                <input className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </label>
              <label className="block text-xs text-slate-400">Username
                <input className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
              </label>
              <label className="block text-xs text-slate-400">Password
                <input type="password" className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button className="w-full bg-indigo-600 rounded-lg py-2" disabled={busy} onClick={() => run(async () => {
                await registerUser(email, username, displayName, password);
                setMode('login');
                setStep('email');
                setInfo('Account created. Log in to confirm.');
                setPassword('');
              })}>Create account</button>
            </>
          )}
          {mode === 'login' && (
            <>
              <label className="block text-xs text-slate-400">Email
                <input className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block text-xs text-slate-400">Password
                <input type="password" className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button className="w-full bg-indigo-600 rounded-lg py-2 flex items-center justify-center gap-2" disabled={busy} onClick={() => run(async () => {
                const r = await loginUser(email, password);
                if (r.user) onAuthSuccess(r.user);
              })}>Log in <ArrowRight className="w-4 h-4" /></button>
            </>
          )}
          {mode === 'forgot' && (
            <>
              <label className="block text-xs text-slate-400">Email
                <input className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <button className="w-full bg-slate-800 rounded-lg py-2" disabled={busy} onClick={() => run(async () => {
                const r = await requestOtp(email, 'recovery');
                setInfo(r.devCode ? `Dev code: ${r.devCode}` : 'If this inbox can be used, a code is on the way.');
                setStep('otp');
              })}>Send reset code</button>
              <label className="block text-xs text-slate-400">Code
                <input className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} />
              </label>
              <label className="block text-xs text-slate-400">New password
                <input type="password" className="mt-1 w-full bg-[#12141c] border border-slate-700 rounded-lg px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button className="w-full bg-indigo-600 rounded-lg py-2" disabled={busy} onClick={() => run(async () => {
                await verifyOtp(email, code, 'recovery');
                await recoverPassword(email, password);
                setMode('login');
                setInfo('Password updated. Log in.');
              })}>Reset and go to login</button>
            </>
          )}
          {error && <p className="text-sm text-rose-400 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
          {info && <p className="text-sm text-emerald-400">{info}</p>}
          <div className="text-xs text-slate-500 flex gap-3">
            <button type="button" onClick={() => { setMode('login'); setStep('email'); setError(''); }}>Log in</button>
            <button type="button" onClick={() => { setMode('register'); setStep('email'); setError(''); }}>Create account</button>
            <button type="button" onClick={() => { setMode('forgot'); setStep('email'); setError(''); }}>Forgot password</button>
          </div>
        </form>
      </div>
    </div>
  );
};
