import React from 'react';
import { TabItem, FileLanguage } from '../../types/ide';
import { X, FileJson, FileText, FileCode } from 'lucide-react';

interface TabsBarProps {
  tabs: TabItem[];
  activeTabPath: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string, e: React.MouseEvent) => void;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  tabs,
  activeTabPath,
  onSelectTab,
  onCloseTab,
}) => {
  const getTabIcon = (lang: FileLanguage) => {
    switch (lang) {
      case 'html':
        return <span className="text-orange-400 font-mono text-[11px] font-bold">&lt;/&gt;</span>;
      case 'css':
        return <span className="text-blue-400 font-mono text-[11px] font-bold">#</span>;
      case 'javascript':
        return <span className="text-yellow-400 font-mono text-[11px] font-bold">JS</span>;
      case 'typescript':
        return <span className="text-cyan-400 font-mono text-[11px] font-bold">TS</span>;
      case 'cpp':
        return <span className="text-pink-400 font-mono text-[11px] font-bold">C++</span>;
      case 'python':
        return <span className="text-emerald-400 font-mono text-[11px] font-bold">PY</span>;
      case 'sql':
        return <span className="text-teal-400 font-mono text-[11px] font-bold">SQL</span>;
      case 'shell':
        return <span className="text-green-400 font-mono text-[11px] font-bold">SH</span>;
      case 'json':
        return <FileJson className="w-3.5 h-3.5 text-emerald-400" />;
      case 'markdown':
        return <FileText className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="h-10 bg-[#0f1117] border-b border-slate-800/80 flex items-center justify-between px-2 select-none overflow-x-auto no-scrollbar shrink-0">
      {/* Tabs list */}
      <div className="flex items-center gap-1 min-w-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.path === activeTabPath;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.path)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer border-t-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-[#181b26] text-white border-indigo-500 font-medium'
                  : 'bg-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-transparent'
              }`}
            >
              {getTabIcon(tab.language)}
              <span className="font-mono text-xs truncate max-w-[140px]">{tab.name}</span>

              {tab.isDirty && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 group-hover:hidden" />
              )}

              <button
                type="button"
                onClick={(e) => onCloseTab(tab.path, e)}
                className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-700/60 transition-colors"
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
