import React, { useState } from 'react';
import { TerminalLine, ConsoleMessage, NetworkRequestItem, FileItem, ThemeName, UserAccount } from '../../types/ide';
import { Terminal } from '../Terminal/Terminal';
import { 
  Terminal as TerminalIcon, 
  ScrollText, 
  Database, 
  Wifi, 
  X, 
  Trash2 
} from 'lucide-react';
import { sqlEngine } from '../../services/languageEngine';

interface BottomToolWindowsProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  terminalLines: TerminalLine[];
  onAddTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  onClearTerminal: () => void;
  consoleLogs: ConsoleMessage[];
  onClearConsole: () => void;
  networkRequests: NetworkRequestItem[];
  onClearNetwork: () => void;
  isOpen: boolean;
  onClose: () => void;
  terminalPrompt?: string;
  currentUser?: UserAccount | null;
  onTeleport?: (target: 'settings' | 'help' | 'comingsoon' | 'explorer' | 'preview' | 'team') => void;
  onChangeTheme?: (theme: ThemeName) => void;
  onChangeViewMode?: (mode: 'code' | 'split' | 'design') => void;
  onChangeFontSize?: (size: number) => void;
  onResizePane?: (pane: 'split' | 'sidebar' | 'shell', val: number) => void;
  onManageApiKey?: (action: 'list' | 'create' | 'revoke', nameOrId?: string) => string;
  onManageTeam?: (action: 'list' | 'invite', username?: string) => string;
}

export const BottomToolWindows: React.FC<BottomToolWindowsProps> = ({
  files,
  setFiles,
  terminalLines,
  onAddTerminalLine,
  onClearTerminal,
  consoleLogs,
  onClearConsole,
  networkRequests,
  onClearNetwork,
  isOpen,
  onClose,
  currentUser,
  onTeleport,
  onChangeTheme,
  onChangeViewMode,
  onChangeFontSize,
  onResizePane,
  onManageApiKey,
  onManageTeam,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'logcat' | 'sqlite' | 'network'>('terminal');
  const [logFilter, setLogFilter] = useState<'all' | 'log' | 'info' | 'warn' | 'error'>('all');
  const [logSearch, setLogSearch] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('users');

  if (!isOpen) return null;

  const filteredLogs = consoleLogs.filter((log) => {
    if (logFilter !== 'all' && log.level !== logFilter) return false;
    if (logSearch) {
      const text = log.args.join(' ') + ' ' + (log.tag || '');
      return text.toLowerCase().includes(logSearch.toLowerCase());
    }
    return true;
  });

  const tableData = sqlEngine.getTableData(selectedTable);

  return (
    <div className="h-full bg-[#090b12] border-t border-slate-800 flex flex-col select-none shrink-0 z-20 font-sans">
      {/* Tab Header */}
      <div className="h-8 bg-[#07090e] border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          {/* Terminal Tab */}
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'terminal'
                ? 'bg-[#090b12] text-indigo-400 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Kali Linux Shell</span>
          </button>

          {/* Logcat Tab */}
          <button
            onClick={() => setActiveTab('logcat')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'logcat'
                ? 'bg-[#090b12] text-indigo-400 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Console / Logcat</span>
            {consoleLogs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {consoleLogs.length}
              </span>
            )}
          </button>

          {/* SQLite DB Tab */}
          <button
            onClick={() => setActiveTab('sqlite')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'sqlite'
                ? 'bg-[#090b12] text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQLite Tables</span>
          </button>

          {/* Network Tab */}
          <button
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'network'
                ? 'bg-[#090b12] text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Network Traffic</span>
            {networkRequests.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {networkRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Close Button */}
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Hide Dock"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[#07090e]">
        {/* 1. Terminal */}
        {activeTab === 'terminal' && (
          <Terminal
            files={files}
            setFiles={setFiles}
            lines={terminalLines}
            onAddLine={onAddTerminalLine}
            onClear={onClearTerminal}
            currentUser={currentUser}
            onTeleport={onTeleport}
            onChangeTheme={onChangeTheme}
            onChangeViewMode={onChangeViewMode}
            onChangeFontSize={onChangeFontSize}
            onResizePane={onResizePane}
            onManageApiKey={onManageApiKey}
            onManageTeam={onManageTeam}
          />
        )}

        {/* 2. Logcat */}
        {activeTab === 'logcat' && (
          <div className="h-full flex flex-col font-mono text-xs">
            <div className="h-8 bg-[#090b12] border-b border-slate-800 px-3 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value as any)}
                  className="bg-[#080a11] border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-xs outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="log">Log</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                </select>

                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="bg-[#080a11] border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs outline-none w-36"
                />
              </div>

              <button
                onClick={onClearConsole}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-500 italic p-2">No console messages recorded.</div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 py-0.5 px-1.5 rounded ${
                      log.level === 'error'
                        ? 'bg-rose-950/30 text-rose-300'
                        : log.level === 'warn'
                        ? 'bg-amber-950/30 text-amber-300'
                        : 'text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
                    {log.tag && (
                      <span className="text-indigo-400 shrink-0 text-[10px] bg-indigo-950/40 px-1 rounded">
                        [{log.tag}]
                      </span>
                    )}
                    <span className="flex-1 whitespace-pre-wrap">{log.args.join(' ')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. SQLite Database Viewer */}
        {activeTab === 'sqlite' && (
          <div className="h-full flex flex-col font-mono text-xs">
            <div className="h-8 bg-[#090b12] border-b border-slate-800 px-3 flex items-center gap-2 shrink-0">
              <span className="text-slate-400 text-xs">Table:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-[#080a11] border border-slate-700 text-cyan-300 font-bold rounded px-2 py-0.5 text-xs outline-none"
              >
                {sqlEngine.getTableNames().map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {tableData ? (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
                      {tableData.columns.map((c) => (
                        <th key={c} className="p-2 border-r border-slate-800 last:border-r-0">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 text-slate-300">
                        {row.map((val, j) => (
                          <td key={j} className="p-2 border-r border-slate-800/60 last:border-r-0">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-slate-500 italic p-2">Select a table to view rows.</div>
              )}
            </div>
          </div>
        )}

        {/* 4. Network Inspector */}
        {activeTab === 'network' && (
          <div className="h-full flex flex-col font-mono text-xs">
            <div className="h-8 bg-[#090b12] border-b border-slate-800 px-3 flex items-center justify-between shrink-0">
              <span className="text-slate-400 text-xs">Sandbox Outgoing Requests</span>
              <button
                onClick={onClearNetwork}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                title="Clear Network Activity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-2 space-y-1">
              {networkRequests.length === 0 ? (
                <div className="text-slate-500 italic p-2">No fetch/xhr requests captured yet.</div>
              ) : (
                networkRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300">
                        {req.method}
                      </span>
                      <span className="text-slate-300 truncate">{req.url}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                      <span className={req.status >= 400 ? 'text-rose-400' : 'text-emerald-400'}>
                        {req.status} {req.statusText}
                      </span>
                      <span>{req.durationMs}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
