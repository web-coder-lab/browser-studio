import React, { useState, useRef, useEffect } from 'react';
import { TerminalLine, FileItem, ThemeName } from '../../types/ide';
import { runRealLinuxCommand, ShellExecutionContext } from '../../services/realLinuxEngine';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  CornerDownLeft, 
  Cpu,
  Loader2,
  Boxes
} from 'lucide-react';

interface TerminalProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  lines: TerminalLine[];
  onAddLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  onClear: () => void;
  currentUser?: { username: string; displayName: string } | null;
  onTeleport?: (target: 'settings' | 'help' | 'comingsoon' | 'explorer' | 'preview' | 'team') => void;
  onChangeTheme?: (theme: ThemeName) => void;
  onChangeViewMode?: (mode: 'code' | 'split' | 'design') => void;
  onChangeFontSize?: (size: number) => void;
  onResizePane?: (pane: 'split' | 'sidebar' | 'shell', val: number) => void;
  onManageApiKey?: (action: 'list' | 'create' | 'revoke', nameOrId?: string) => string;
  onManageTeam?: (action: 'list' | 'invite', username?: string) => string;
}

export const Terminal: React.FC<TerminalProps> = ({
  files,
  setFiles,
  lines,
  onAddLine,
  onClear,
  currentUser,
  onTeleport,
  onChangeTheme,
  onChangeViewMode,
  onChangeFontSize,
  onResizePane,
  onManageApiKey,
  onManageTeam,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const username = currentUser?.username || 'kali';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, isExecuting]);

  const handleExecute = async (cmdToRun?: string) => {
    const command = (cmdToRun !== undefined ? cmdToRun : inputVal).trim();
    if (!command || isExecuting) return;

    // Add to command history
    setHistory((prev) => [...prev, command]);
    setHistoryIdx(-1);
    setInputVal('');

    // Add input prompt line to terminal
    onAddLine({
      type: 'input',
      text: command,
    });

    const context: ShellExecutionContext = {
      files,
      setFiles,
      currentUser,
      onTeleport,
      onChangeTheme,
      onChangeViewMode,
      onChangeFontSize,
      onResizePane,
      onManageApiKey,
      onManageTeam,
    };

    setIsExecuting(true);

    try {
      const result = await runRealLinuxCommand(command, context, (streamMsg) => {
        onAddLine({
          type: 'system',
          text: streamMsg,
        });
      });

      if (result.output === '__CLEAR__') {
        onClear();
      } else if (result.output) {
        onAddLine({
          type: result.type,
          text: result.output,
        });
      }
    } catch (err: any) {
      onAddLine({
        type: 'error',
        text: `Runtime Exception: ${err.message}`,
      });
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-[#05070c] font-mono text-xs select-text overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Kali / Termux Terminal Window Header */}
      <div className="h-7 bg-[#090c14] border-b border-slate-800 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          {/* Linux window dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          
          <span className="text-cyan-400 font-bold text-[11px] font-mono">
            {username}@browser-studio: ~/workspace
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <Cpu className="w-3 h-3 text-emerald-500" />
            <span>WebAssembly Kernel Active</span>
          </div>

          <button
            onClick={onClear}
            className="p-1 hover:text-rose-400 text-slate-500 rounded transition-colors"
            title="Clear Terminal (clear)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Stream Buffer */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 leading-relaxed">
        
        {/* Welcome Linux Banner */}
        <div className="text-slate-300 font-mono text-[11px] select-none pb-2 border-b border-slate-800/60">
          <pre className="text-cyan-400 font-bold leading-tight">
{`┌─────────────────────────────────────────────────────────────┐
│             [ Kali Linux / Termux Real Shell ]              │
│       Kernel v6.12.0-cloud-wasm | x86_64 Browser OS         │
│  Zero-Trust Local Sandbox • Real WebAssembly Runtimes       │
└─────────────────────────────────────────────────────────────┘`}
          </pre>
          <div className="mt-2 text-slate-400 text-[11px] space-y-1">
            <p>• Shell is fresh and minimal. Install tools with <span className="text-emerald-400 font-bold">pkg install &lt;package&gt;</span> (e.g. <span className="text-cyan-300">pkg install python</span>, <span className="text-cyan-300">pkg install clang</span>, <span className="text-cyan-300">pkg install nodejs</span>).</p>
            <p>• Type <span className="text-indigo-400 font-bold">pkg list-all</span> to view available repository packages.</p>
            <p>• Install Python packages with <span className="text-yellow-400 font-bold">pip install numpy</span> (Pyodide WebAssembly).</p>
            <p>• Type <span className="text-cyan-400 font-bold">help</span> to view full manual.</p>
          </div>
        </div>

        {/* Dynamic Log Lines */}
        {lines.map((line) => (
          <div key={line.id} className="space-y-0.5">
            {line.type === 'input' ? (
              <div>
                <div className="text-cyan-400 font-bold text-[11px]">
                  ┌──({username}㉿browser-studio)-[~/workspace]
                </div>
                <div className="flex items-center gap-2 text-slate-100 font-bold">
                  <span className="text-cyan-400">└─$</span>
                  <span>{line.text}</span>
                </div>
              </div>
            ) : line.type === 'error' ? (
              <div className="text-rose-400 whitespace-pre-wrap pl-2 border-l-2 border-rose-500/40">{line.text}</div>
            ) : line.type === 'success' ? (
              <div className="text-emerald-300 whitespace-pre-wrap pl-2 border-l-2 border-emerald-500/40">{line.text}</div>
            ) : line.type === 'warning' ? (
              <div className="text-amber-300 whitespace-pre-wrap pl-2 border-l-2 border-amber-500/40">{line.text}</div>
            ) : line.type === 'system' ? (
              <div className="text-cyan-300 whitespace-pre-wrap pl-2 border-l-2 border-cyan-500/40">{line.text}</div>
            ) : (
              <div className="text-slate-300 whitespace-pre-wrap pl-2">{line.text}</div>
            )}
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Executing in WebAssembly engine...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Kali Command Input Box */}
      <div className="bg-[#07090f] border-t border-slate-800/80 px-3 py-1.5 flex flex-col shrink-0">
        <div className="text-cyan-400 font-bold text-[10.5px]">
          ┌──({username}㉿browser-studio)-[~/workspace]
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-xs select-none">└─$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder={isExecuting ? 'Processing command...' : 'Type command (e.g. "pkg install python", "neofetch", "help")...'}
            className="flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-600 font-mono text-xs disabled:opacity-50"
            autoFocus
          />
          <button
            onClick={() => handleExecute()}
            disabled={isExecuting}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-50"
          >
            <CornerDownLeft className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
