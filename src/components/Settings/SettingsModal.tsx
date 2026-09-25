import React, { useState } from 'react';
import { EditorSettings, WorkspaceApiKey, UserAccount } from '../../types/ide';
import { 
  Settings as SettingsIcon, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  HelpCircle, 
  X, 
  Lock, 
  BookOpen, 
  Terminal as TerminalIcon, 
  Sliders,
  Rocket,
  ShieldCheck,
  Cloud,
  Code2,
  Users,
  Cpu,
  Globe
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: Partial<EditorSettings>) => void;
  initialTab?: 'keys' | 'help' | 'comingsoon';
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  initialTab = 'keys',
  currentUser,
  onOpenAuthModal,
}) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'help' | 'comingsoon'>(initialTab);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerateKey = () => {
    const rawKey = 'bs_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const newKey: WorkspaceApiKey = {
      keyId: 'key_' + Date.now().toString(36),
      apiKey: rawKey,
      name: newKeyName.trim() || 'Automation Token',
      createdAt: new Date().toLocaleDateString(),
      permissions: ['read', 'write', 'execute', 'deploy'],
      rateLimitPerMinute: 120,
    };

    onUpdateSettings({
      apiKeys: [...settings.apiKeys, newKey],
    });
    setNewKeyName('');
  };

  const handleRevokeKey = (keyId: string) => {
    onUpdateSettings({
      apiKeys: settings.apiKeys.filter((k) => k.keyId !== keyId),
    });
  };

  const handleCopyKey = (key: WorkspaceApiKey) => {
    navigator.clipboard.writeText(key.apiKey);
    setCopiedKeyId(key.keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn font-sans">
      <div className="w-full max-w-4xl h-[88vh] bg-[#0c0f17] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="h-14 bg-[#090b12] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Studio Control Center</h2>
              <p className="text-[11px] text-slate-400">Manage authorization keys, developer manual & roadmap</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-white font-bold">{currentUser.displayName}</span>
                <span className="text-indigo-400 font-mono text-[11px]">(@{currentUser.username})</span>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Sign In / Register
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Main Navigation Tabs */}
        <div className="h-12 bg-[#080a10] border-b border-slate-800/80 px-6 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'keys'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1. API Keys & Authorization</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'help'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>2. Comprehensive Documentation & Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('comingsoon')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'comingsoon'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>3. Coming Soon</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0c0f17]">
          
          {/* TAB 1: API KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3">
                <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-300">Client-Authoritative Token Security</h4>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    Tokens are cryptographically generated and stored only on your local device. Use them to authorize automated tasks and cURL endpoints.
                  </p>
                </div>
              </div>

              {/* Generate New Key */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Optional Token Label (e.g. CLI Automation, Webhook Bot)..."
                  className="flex-1 bg-[#080a11] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500 font-sans"
                />
                <button
                  onClick={handleGenerateKey}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>

              {/* Active Tokens List */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300">Active Workspace Tokens ({settings.apiKeys.length})</label>
                {settings.apiKeys.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">No active tokens. Generate one above or type `apikey generate` in the shell.</div>
                ) : (
                  settings.apiKeys.map((key) => {
                    const isVisible = visibleKeyId === key.keyId;
                    const maskedToken = key.apiKey.slice(0, 8) + '•'.repeat(16) + key.apiKey.slice(-4);

                    return (
                      <div
                        key={key.keyId}
                        className="p-3.5 rounded-xl bg-[#090c13] border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-300 font-bold break-all">
                              {isVisible ? key.apiKey : maskedToken}
                            </span>
                            <button
                              onClick={() => setVisibleKeyId(isVisible ? null : key.keyId)}
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                              title={isVisible ? 'Hide token' : 'Reveal token'}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-[10.5px] text-slate-500 flex items-center gap-3">
                            <span>ID: {key.keyId}</span>
                            <span>Created: {key.createdAt}</span>
                            <span className="text-emerald-400 font-medium">Rate: {key.rateLimitPerMinute} req/min</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCopyKey(key)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Copy Token"
                          >
                            {copiedKeyId === key.keyId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleRevokeKey(key.keyId)}
                            className="p-2 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Revoke Token"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Editor Font Size Slider (8px to 18px Range) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Editor Font Size: {settings.fontSize}px (Range: 8px – 18px)
                  </span>
                  <span className="font-mono text-xs text-indigo-400 font-bold">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="18"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>8px (Ultra Compact)</span>
                  <span>13px (Default)</span>
                  <span>18px (Maximum)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPREHENSIVE MEGA DOCUMENTATION */}
          {activeTab === 'help' && (
            <div className="space-y-6 text-slate-200">
              
              {/* Introduction Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-slate-900 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <BookOpen className="w-4 h-4" />
                  <span>Browser Studio Complete Developer Reference</span>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  Browser Studio is a 100% client-authoritative development suite. All compiles, scripts, SQLite databases, Python routines, and WebAssembly binaries run directly on your browser device with zero server reliance.
                </p>
              </div>

              {/* Section 1: Cloudflare Free Tunnels & Installation */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-amber-400" />
                  <span>1. Cloudflare Zero-Trust Free Tunnels</span>
                </h4>
                <div className="space-y-2 text-[11.5px] text-slate-300 leading-relaxed">
                  <p>
                    You can expose your local sandbox to the entire world for free using Cloudflare Quick Tunnels:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                    <li><strong className="text-white">Command:</strong> <code className="text-amber-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">cloudflare tunnel</code> or <code className="text-amber-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">cloudflared tunnel run</code></li>
                    <li><strong className="text-white">Package Setup:</strong> <code className="text-amber-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">apt install cloudflared</code></li>
                    <li><strong className="text-white">Result:</strong> An instant, public <code className="text-emerald-400 font-mono">https://*.trycloudflare.com</code> URL is generated that securely forwards external requests to your browser runtime.</li>
                  </ul>
                </div>
              </div>

              {/* Section 2: WebAssembly C++ Compiler (Clang++ / WASM) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>2. WebAssembly C++ Engine (Clang++ / g++)</span>
                </h4>
                <div className="space-y-2 text-[11.5px] text-slate-300 leading-relaxed">
                  <p>
                    Write standard modern C++ in any <code className="text-cyan-300 font-mono">.cpp</code> file (e.g. <code className="text-cyan-300 font-mono">/main.cpp</code>) and compile it directly inside the browser using WebAssembly:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-800">
{`// /main.cpp
#include <iostream>

int main() {
  std::cout << "Hello from WebAssembly Clang++ inside Browser Studio!" << std::endl;
  return 0;
}`}
                  </pre>
                  <p>
                    Compile and execute in the shell with: <code className="text-cyan-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">clang++ main.cpp</code> or <code className="text-cyan-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">g++ main.cpp</code>.
                  </p>
                </div>
              </div>

              {/* Section 3: Team & Multi-User Collaboration */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>3. Multi-User Team Collaboration & Friends</span>
                </h4>
                <div className="space-y-2 text-[11.5px] text-slate-300 leading-relaxed">
                  <p>
                    Multiple developers or entire teams can collaborate simultaneously on the same workspace:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                    <li><strong className="text-white">Invite by Username:</strong> Run <code className="text-purple-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">team invite &lt;username&gt;</code> or open the Team Panel.</li>
                    <li><strong className="text-white">Peer-to-Peer State Sync:</strong> Files, tabs, and active files are synchronized live across all joined collaborators.</li>
                    <li><strong className="text-white">Access Control:</strong> Roles include <em>Owner (Host)</em>, <em>Editor</em>, and <em>Viewer</em>.</li>
                  </ul>
                </div>
              </div>

              {/* Section 4: Shell Command Encyclopedia */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-emerald-400" />
                  <span>4. Complete Shell Command Reference</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse font-mono text-[11px] text-slate-300">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-left">Command</th>
                        <th className="p-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr>
                        <td className="p-2 text-amber-400 font-bold">Tunnels</td>
                        <td className="p-2 text-indigo-300">cloudflare tunnel</td>
                        <td className="p-2">Start free live Cloudflare trycloudflare.com tunnel</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-amber-400 font-bold">Packages</td>
                        <td className="p-2 text-indigo-300">apt install &lt;pkg&gt;</td>
                        <td className="p-2">Install client-side WebAssembly package (e.g. clang, python)</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-cyan-400 font-bold">C++ WASM</td>
                        <td className="p-2 text-indigo-300">clang++ main.cpp</td>
                        <td className="p-2">Compile and execute C++ file via WebAssembly</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-cyan-400 font-bold">Python</td>
                        <td className="p-2 text-indigo-300">python main.py</td>
                        <td className="p-2">Execute Python 3.12 script client-side</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-emerald-400 font-bold">Database</td>
                        <td className="p-2 text-indigo-300">sql "&lt;query&gt;"</td>
                        <td className="p-2">Execute SQLite query against in-memory catalog</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-purple-400 font-bold">Team</td>
                        <td className="p-2 text-indigo-300">team invite &lt;user&gt;</td>
                        <td className="p-2">Invite friend by username to workspace</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-indigo-400 font-bold">Layout</td>
                        <td className="p-2 text-indigo-300">resize split &lt;pct&gt;</td>
                        <td className="p-2">Resize editor / preview ratio (e.g. resize split 75)</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-indigo-400 font-bold">Font</td>
                        <td className="p-2 text-indigo-300">font &lt;8-18&gt;</td>
                        <td className="p-2">Set editor typography size (8px to 18px)</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-400 font-bold">Nav</td>
                        <td className="p-2 text-indigo-300">teleport &lt;target&gt;</td>
                        <td className="p-2">Teleport to: help | settings | team | explorer | preview</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Client-Authoritative Security */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Cpu className="w-4 h-4" />
                  <span>5. Zero-Trust Local Device Execution</span>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  Your code, files, SQLite databases, and security tokens are processed entirely inside your local browser instance. No user source code or raw secrets are ever transmitted to external hosting servers.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: COMING SOON */}
          {activeTab === 'comingsoon' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Rocket className="w-4 h-4" />
                  <span>Browser Studio Engineering Roadmap</span>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  High-performance native toolchains requiring local native OS daemons:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Native Mobile APK / AAB Packager',
                    status: 'Native Toolchain',
                    desc: 'Direct package generator for mobile devices requiring native JDK and Gradle toolchains.',
                  },
                  {
                    title: 'Desktop App Builder (Tauri / Electron)',
                    status: 'Planned',
                    desc: 'Cross-platform native executable builder targeting Windows .exe, macOS .dmg, and Linux AppImage.',
                  },
                  {
                    title: 'Visual Drag-and-Drop Canvas',
                    status: 'In R&D',
                    desc: 'Interactive UI layout builder with real-time bi-directional AST synchronization.',
                  },
                  {
                    title: 'Clang WebAssembly C++ / Rust JIT',
                    status: 'Active Beta',
                    desc: 'High-speed browser compilation for native systems programming languages.',
                  },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#090b12] border-t border-slate-800 px-6 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Browser Studio v2.5.0 • Client-Authoritative</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
