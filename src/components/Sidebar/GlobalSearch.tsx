import React, { useState } from 'react';
import { FileItem, flattenFiles } from '../../services/fileSystem';
import { Search, Replace, ArrowRight, FileCode } from 'lucide-react';

interface GlobalSearchProps {
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  onUpdateFileContent: (path: string, content: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  files,
  onSelectFile,
  onUpdateFileContent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const flatList = flattenFiles(files).filter((f) => !f.isFolder);

  interface SearchMatch {
    file: FileItem;
    line: number;
    text: string;
    index: number;
  }

  const matches: SearchMatch[] = [];

  if (searchTerm.trim().length > 0) {
    for (const file of flatList) {
      if (!file.content) continue;
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        const lineToTest = caseSensitive ? lineText : lineText.toLowerCase();
        const queryToTest = caseSensitive ? searchTerm : searchTerm.toLowerCase();

        if (lineToTest.includes(queryToTest)) {
          matches.push({
            file,
            line: idx + 1,
            text: lineText.trim(),
            index: idx,
          });
        }
      });
    }
  }

  const handleReplaceAll = () => {
    if (!searchTerm) return;
    for (const file of flatList) {
      if (!file.content) continue;
      if (file.content.includes(searchTerm)) {
        const regex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
        const updated = file.content.replace(regex, replaceTerm);
        onUpdateFileContent(file.path, updated);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#12151e] border-r border-slate-800/80 text-slate-200 select-none">
      <div className="p-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Search Workspace</span>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={`p-1 rounded text-xs flex items-center gap-1 ${
              showReplace ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Replace"
          >
            <Replace className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search text (e.g. function, counter)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
          />
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`absolute right-2 top-1.5 px-1 rounded text-[10px] font-bold ${
              caseSensitive ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Match Case"
          >
            Aa
          </button>
        </div>

        {/* Replace Input */}
        {showReplace && (
          <div className="space-y-2 mt-2">
            <div className="relative">
              <Replace className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              onClick={handleReplaceAll}
              disabled={!searchTerm || matches.length === 0}
              className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-xs font-medium transition-colors"
            >
              Replace All ({matches.length})
            </button>
          </div>
        )}
      </div>

      {/* Matches Results */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {searchTerm.trim().length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Type something to search all project files.
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No matches found for "{searchTerm}".
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-slate-400 px-1 mb-2">
              Found {matches.length} result{matches.length > 1 ? 's' : ''}
            </div>
            {matches.map((m, idx) => (
              <div
                key={idx}
                onClick={() => onSelectFile(m.file)}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1">
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="truncate">{m.file.name}</span>
                  <span className="text-[10px] text-slate-500">:{m.line}</span>
                </div>
                <div className="text-xs font-mono text-slate-300 truncate bg-slate-950/60 px-1.5 py-0.5 rounded">
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
