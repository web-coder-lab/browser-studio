import React, { useState } from 'react';
import { FileItem, flattenFiles } from '../../services/fileSystem';
import { GitBranch, GitCommit, CloudUpload, CheckCircle, RefreshCw, Layers } from 'lucide-react';

interface GitPanelProps {
  files: FileItem[];
  onOpenDeploy: () => void;
  onCommit: (message: string) => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  files,
  onOpenDeploy,
  onCommit,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [lastCommit, setLastCommit] = useState<string | null>('Initial project commit');

  const flatList = flattenFiles(files).filter((f) => !f.isFolder);

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    onCommit(commitMessage.trim());
    setLastCommit(commitMessage.trim());
    setCommitMessage('');
  };

  return (
    <div className="h-full flex flex-col bg-[#12151e] border-r border-slate-800/80 text-slate-200 select-none">
      <div className="p-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Source Control</span>
          <span className="flex items-center gap-1 text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">
            <GitBranch className="w-3 h-3" /> main
          </span>
        </div>

        {/* Commit Form */}
        <form onSubmit={handleCommitSubmit} className="space-y-2">
          <textarea
            placeholder="Message (e.g. Update UI components & endpoints)"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none font-mono"
          />
          <button
            type="submit"
            disabled={!commitMessage.trim()}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <GitCommit className="w-3.5 h-3.5" /> Commit Changes
          </button>
        </form>
      </div>

      <div className="p-3 border-b border-slate-800/80 shrink-0">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Files save to your signed-in Firebase workspace. One-click GitHub / Render deploy from this panel is not connected.
        </p>
      </div>

      {/* Staged / Working Tree Files */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Staged Files ({flatList.length})</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Clean
          </span>
        </div>

        <div className="space-y-1">
          {flatList.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800/80"
            >
              <span className="truncate">{file.path}</span>
              <span className="text-[10px] text-emerald-400">TRACKED</span>
            </div>
          ))}
        </div>

        {lastCommit && (
          <div className="mt-4 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Latest Head Commit
            </div>
            <div className="text-xs text-indigo-300 font-mono flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{lastCommit}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
