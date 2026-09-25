import React from 'react';
import { StructureSymbol, FileItem } from '../../types/ide';
import { extractStructureOutline } from '../../services/fileSystem';
import { Code2, FunctionSquare, Layers, Tag, Database } from 'lucide-react';

interface StructureOutlineProps {
  file: FileItem | null;
  onSelectLine: (line: number) => void;
}

export const StructureOutline: React.FC<StructureOutlineProps> = ({ file, onSelectLine }) => {
  const symbols = extractStructureOutline(file);

  const getSymbolIcon = (kind: StructureSymbol['kind']) => {
    switch (kind) {
      case 'function':
        return <FunctionSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'class':
        return <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'interface':
        return <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'query':
        return <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'tag':
        return <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return <Code2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#12151e] border-r border-slate-800 text-slate-200 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Structure (AST Outline)</span>
        <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
          {symbols.length} symbols
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
        {symbols.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No symbols found in current document.
          </div>
        ) : (
          symbols.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectLine(s.line)}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800/80 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2 truncate">
                {getSymbolIcon(s.kind)}
                <span className="truncate text-slate-300 group-hover:text-white">{s.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-indigo-400">:{s.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
