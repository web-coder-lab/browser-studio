import React from 'react';
import { 
  Files, 
  Search, 
  ListTree
} from 'lucide-react';

export type ActiveSidebarView = 'explorer' | 'search' | 'structure';

interface ActivityBarProps {
  activeView: ActiveSidebarView | null;
  onSelectView: (view: ActiveSidebarView) => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onSelectView,
}) => {
  return (
    <div className="w-11 bg-[#080a10] border-r border-slate-800/80 flex flex-col items-center py-2.5 select-none z-30 shrink-0">
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Project Files Explorer */}
        <button
          onClick={() => onSelectView('explorer')}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative ${
            activeView === 'explorer'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Project Explorer"
        >
          <Files className="w-4 h-4" />
        </button>

        {/* Structure AST Outline */}
        <button
          onClick={() => onSelectView('structure')}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative ${
            activeView === 'structure'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Structure Outline"
        >
          <ListTree className="w-4 h-4" />
        </button>

        {/* Find in Files */}
        <button
          onClick={() => onSelectView('search')}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative ${
            activeView === 'search'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Find in Files"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
