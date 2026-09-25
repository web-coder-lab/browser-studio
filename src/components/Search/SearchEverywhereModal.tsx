import React, { useState, useEffect, useRef } from 'react';
import { FileItem, flattenFiles } from '../../services/fileSystem';
import { Search, FileCode, Play, Terminal, Database, Globe, X } from 'lucide-react';

interface SearchEverywhereModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  onTriggerAction: (action: string) => void;
}

export const SearchEverywhereModal: React.FC<SearchEverywhereModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onTriggerAction,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const flatList = flattenFiles(files).filter((f) => !f.isFolder);
  const matchedFiles = flatList.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  const actions = [
    { id: 'run_web', title: 'Run Live Web Sandbox', icon: <Play className="w-4 h-4 text-emerald-400" /> },
    { id: 'run_py', title: 'Execute Python Analytics', icon: <Play className="w-4 h-4 text-amber-400" /> },
    { id: 'run_sql', title: 'Run SQLite Database Queries', icon: <Database className="w-4 h-4 text-indigo-400" /> },
    { id: 'open_domain', title: 'Open Domain DNS Manager', icon: <Globe className="w-4 h-4 text-cyan-400" /> },
    { id: 'open_terminal', title: 'Toggle Interactive Shell', icon: <Terminal className="w-4 h-4 text-slate-400" /> },
  ].filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-[#12151e] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files, actions, symbols (e.g. index.html, run, db)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none font-sans"
          />
          <kbd className="bg-slate-950 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Matched Files */}
          {matchedFiles.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 mb-1 tracking-wider">
                Files
              </div>
              <div className="space-y-0.5">
                {matchedFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => {
                      onSelectFile(file);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-600/20 text-xs text-slate-200 cursor-pointer font-mono group"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300">{file.path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 mb-1 tracking-wider">
                Studio Actions
              </div>
              <div className="space-y-0.5">
                {actions.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => {
                      onTriggerAction(act.id);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-indigo-600/20 text-xs text-slate-200 cursor-pointer"
                  >
                    {act.icon}
                    <span>{act.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedFiles.length === 0 && actions.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching files or actions for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
