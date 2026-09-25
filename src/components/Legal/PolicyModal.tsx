import React from 'react';
import { ShieldCheck, Lock, HeartHandshake, FileCheck2, AlertCircle } from 'lucide-react';

export const PolicyModal: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#10131d] text-slate-200 overflow-y-auto p-5 select-text">
      {/* Header */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 shadow-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Privacy & Child Safety Policies
            </h2>
            <p className="text-xs text-emerald-400 font-mono">
              Strict Under-18 Minor Protection • Zero Data Selling
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Browser IDE enforces comprehensive safety guidelines for developers of all ages with zero tolerance for adult, harmful, or exploitative content.
        </p>
      </div>

      <div className="space-y-4 max-w-4xl text-xs text-slate-300">
        {/* Section 1: Child Safety & Under-18 Protection */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <h3>1. Child Safety & Minor Protection Policy</h3>
          </div>
          <p className="leading-relaxed text-slate-400">
            This platform is dedicated to safe coding education and productivity. The following categories are strictly prohibited on Browser IDE:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li><strong className="text-slate-200">NSFW & Adult Material:</strong> Pornographic, sexually explicit, or obscene projects.</li>
            <li><strong className="text-slate-200">Dating & Hookup Applications:</strong> Unmoderated social/dating apps targeting minors.</li>
            <li><strong className="text-slate-200">Harassment & Bullying:</strong> Content designed to threaten, intimidate, or demean individuals.</li>
            <li><strong className="text-slate-200">Malware & Exploits:</strong> Keyloggers, phishing templates, skimmers, or destructive code.</li>
          </ul>
        </div>

        {/* Section 2: Privacy & Data Ownership */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h3>2. Local Storage & Zero-Log Architecture</h3>
          </div>
          <p className="leading-relaxed text-slate-400">
            Browser IDE operates on a <strong>client-first model</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li>Your code and workspace files are stored locally in your browser's IndexedDB / localStorage.</li>
            <li>We do not record, sell, or monetize your source code.</li>
            <li>Deployment credentials (GitHub / Render / Railway tokens) communicate directly with third-party providers via secure HTTPS API calls only when you trigger a deployment.</li>
          </ul>
        </div>

        {/* Section 3: Terms of Service */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
            <h3>3. Developer Terms of Service</h3>
          </div>
          <p className="leading-relaxed text-slate-400">
            By using Browser IDE, developers agree:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li>You hold responsibility for applications and dependencies created inside your workspace.</li>
            <li>You will not use the cloud deployment pipelines for malicious DDoS, spamming, or crypto-mining.</li>
            <li>You may export or delete your workspace anytime without restriction.</li>
          </ul>
        </div>

        {/* Security Rule Compliance */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-500 space-y-1">
          <div className="font-semibold text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> 93 Security Principles Verification
          </div>
          <p>
            Complies with Zero Trust, Input Validation, Sandboxed Execution, and Least Privilege access protocols.
          </p>
        </div>
      </div>
    </div>
  );
};
