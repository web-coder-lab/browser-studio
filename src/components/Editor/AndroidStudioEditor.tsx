import React, { useState, useRef } from 'react';
import { FileItem, EditorSettings } from '../../types/ide';
import { 
  ChevronRight, 
  Search, 
  Replace, 
  Copy, 
  Check, 
  Code2, 
  FileCode,
  Sliders
} from 'lucide-react';

interface StudioEditorProps {
  file: FileItem | null;
  settings: EditorSettings;
  onChangeContent: (content: string) => void;
  onFormatCode: () => void;
  onSelectLine?: (line: number) => void;
}

export const StudioEditor: React.FC<StudioEditorProps> = ({
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
  const [activeLine, setActiveLine] = useState(1);

  const content = file?.content || '';
  const lines = content.split('\n');

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowFind((prev) => !prev);
    }
  };

  const handleCursorMove = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const textUpToCursor = textarea.value.substring(0, textarea.selectionStart);
    const lineNum = textUpToCursor.split('\n').length;
    setActiveLine(lineNum);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const newContent = content.split(findText).join(replaceText);
    onChangeContent(newContent);
  };

  if (!file) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#1e1e1e] text-[#858585] font-sans p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#252526] border border-[#333333] flex items-center justify-center mb-4 text-[#007acc]">
          <FileCode className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-[#cccccc] mb-1">No File Open</h3>
        <p className="text-xs text-[#858585] max-w-sm">
          Select a file from the sidebar or press <kbd className="px-1.5 py-0.5 rounded bg-[#2d2d2d] border border-[#3c3c3c] font-mono text-[10px] text-[#cccccc]">Shift Shift</kbd> to search files.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden font-mono select-none">
      
      {/* 1. VS Code Breadcrumbs Bar */}
      <div className="h-7 bg-[#181818] border-b border-[#282828] px-3 flex items-center justify-between text-xs text-[#969696] shrink-0 select-none">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[#6e7681] font-bold text-[11px]">workspace</span>
          {file.path.split('/').filter(Boolean).map((part, idx, arr) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-[#555555] shrink-0" />
              <span className={`truncate text-[11.5px] ${idx === arr.length - 1 ? 'text-[#ffffff] font-medium' : 'text-[#969696]'}`}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowFind((prev) => !prev)}
            className={`p-1 rounded hover:bg-[#2a2d2e] transition-colors ${showFind ? 'text-[#007acc] bg-[#2a2d2e]' : 'text-[#858585] hover:text-[#cccccc]'}`}
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="w-3 h-3" />
          </button>
          
          <button
            onClick={onFormatCode}
            className="p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-[#cccccc] transition-colors"
            title="Format Document"
          >
            <Code2 className="w-3 h-3" />
          </button>

          <button
            onClick={handleCopyCode}
            className="p-1 rounded hover:bg-[#2a2d2e] text-[#858585] hover:text-[#cccccc] transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 2. VS Code Inline Find and Replace Widget */}
      {showFind && (
        <div className="bg-[#252526] border-b border-[#3c3c3c] px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs shrink-0 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-1 bg-[#3c3c3c] border border-[#555555] rounded px-2 py-0.5">
            <Search className="w-3 h-3 text-[#858585]" />
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Find..."
              className="bg-transparent text-white outline-none w-36 text-xs font-mono"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1 bg-[#3c3c3c] border border-[#555555] rounded px-2 py-0.5">
            <Replace className="w-3 h-3 text-[#858585]" />
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace..."
              className="bg-transparent text-white outline-none w-36 text-xs font-mono"
            />
          </div>

          <button
            onClick={handleReplaceAll}
            className="px-2 py-0.5 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white font-medium text-xs"
          >
            Replace All
          </button>

          <button
            onClick={() => setShowFind(false)}
            className="text-[#858585] hover:text-white text-xs ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Text Area with VS Code Line Numbers Gutter */}
      <div className="flex-1 flex min-h-0 relative select-text">
        {/* Line Numbers Gutter */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-12 py-3 bg-[#1e1e1e] border-r border-[#282828] text-right pr-3 select-none overflow-hidden shrink-0 font-mono text-[#858585]"
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6' }}
          >
            {lines.map((_, i) => (
              <div
                key={i}
                className={`${i + 1 === activeLine ? 'text-[#c6c6c6] font-bold bg-[#282828] -mr-3 pr-3' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Main Code Editor Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          spellCheck={false}
          className="flex-1 h-full w-full bg-[#1e1e1e] p-3 text-[#d4d4d4] outline-none resize-none font-mono selection:bg-[#264f78]"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: '1.6',
            whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
            tabSize: settings.tabSize || 2,
          }}
          placeholder="Write code here..."
        />
      </div>
    </div>
  );
};
