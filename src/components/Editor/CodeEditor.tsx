import React, { useState, useRef, useEffect } from 'react';
import { FileItem, EditorSettings } from '../../types/ide';
import { Search, Replace, Sparkles, Check, Copy, ArrowDownUp } from 'lucide-react';

interface CodeEditorProps {
  file: FileItem | null;
  settings: EditorSettings;
  onChangeContent: (content: string) => void;
  onFormatCode: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  settings,
  onChangeContent,
  onFormatCode,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const content = file?.content || '';
  const lines = content.split('\n');

  // Sync line numbers scroll with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = ' '.repeat(settings.tabSize || 2);

      const newContent = content.substring(0, start) + spaces + content.substring(end);
      onChangeContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }

    // Ctrl+F / Cmd+F Find
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowFind(true);
    }

    // Ctrl+S Auto Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Auto saved via state
    }
  };

  const insertSymbol = (symbol: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + symbol + content.substring(end);
    onChangeContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
    }, 0);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplaceCurrent = () => {
    if (!findText) return;
    const newContent = content.replace(findText, replaceText);
    onChangeContent(newContent);
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newContent = content.replace(regex, replaceText);
    onChangeContent(newContent);
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#141722] text-slate-500 p-6 select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">No File Selected</h3>
        <p className="text-xs text-slate-400 text-center max-w-sm">
          Select a file from the explorer sidebar or create a new one to start writing code.
        </p>
      </div>
    );
  }

  const mobileKeypad = ['{', '}', '(', ')', '[', ']', ';', '=>', '=', ':', '"', "'", '`', '<', '>', 'const', 'console.log'];

  return (
    <div className="h-full flex flex-col bg-[#141722] relative overflow-hidden select-text">
      {/* Editor Top Bar Actions */}
      <div className="h-8 bg-[#10131d] border-b border-slate-800/60 px-3 flex items-center justify-between text-xs text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-300 font-medium">{file.path}</span>
          <span className="text-[10px] uppercase bg-slate-800 px-1.5 py-0.2 rounded text-slate-400">
            {file.language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFind(!showFind)}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFormatCode}
            className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-[11px]"
            title="Format Document"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Format</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Find & Replace Popover Bar */}
      {showFind && (
        <div className="bg-slate-900 border-b border-indigo-500/40 p-2 flex flex-wrap items-center gap-2 text-xs select-none z-20 shadow-xl">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 flex-1 min-w-[140px]">
            <Search className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Find..."
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="bg-transparent text-white outline-none w-full text-xs font-mono"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 flex-1 min-w-[140px]">
            <Replace className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Replace..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="bg-transparent text-white outline-none w-full text-xs font-mono"
            />
          </div>

          <button
            onClick={handleReplaceCurrent}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs"
          >
            All
          </button>
          <button
            onClick={() => setShowFind(false)}
            className="px-1.5 py-1 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Textarea with Line Numbers */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Line Numbers Column */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-12 bg-[#0f1118] text-slate-600 font-mono text-xs select-none text-right pr-3 py-3 overflow-hidden border-r border-slate-800/60 shrink-0"
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.5rem' }}
          >
            {lines.map((_, i) => (
              <div key={i} className="hover:text-slate-400">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Text Area Code Editor */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 h-full bg-transparent text-slate-100 font-mono p-3 outline-none resize-none overflow-auto leading-6 whitespace-pre tab-4"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: '1.5rem',
            whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
          }}
        />
      </div>

      {/* Mobile Programming Quick Keypad */}
      <div className="md:hidden h-10 bg-[#0d0f17] border-t border-slate-800 flex items-center gap-1.5 px-2 overflow-x-auto no-scrollbar select-none shrink-0">
        {mobileKeypad.map((sym, idx) => (
          <button
            key={idx}
            onClick={() => insertSymbol(sym)}
            className="px-2.5 py-1 bg-slate-800 active:bg-indigo-600 text-slate-200 text-xs font-mono font-semibold rounded shrink-0 shadow-sm border border-slate-700/50"
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
};
