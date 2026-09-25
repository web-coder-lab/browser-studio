import React from 'react';
import { 
  Play, 
  Search, 
  Code2, 
  Columns, 
  LayoutTemplate, 
  Settings as SettingsIcon,
  Users,
  User
} from 'lucide-react';
import { EditorSettings, UserAccount, CollaboratorMember } from '../../types/ide';

interface MainToolbarProps {
  onRun: () => void;
  isRunning: boolean;
  onOpenSearchEverywhere: () => void;
  settings: EditorSettings;
  onToggleViewMode: (mode: 'code' | 'split' | 'design') => void;
  onOpenSettingsModal: (tab?: 'keys' | 'help' | 'comingsoon') => void;
  onOpenTeamModal: () => void;
  onOpenAuthModal: () => void;
  currentUser: UserAccount | null;
  collaborators: CollaboratorMember[];
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  onRun,
  isRunning,
  onOpenSearchEverywhere,
  settings,
  onToggleViewMode,
  onOpenSettingsModal,
  onOpenTeamModal,
  onOpenAuthModal,
  currentUser,
  collaborators,
}) => {
  return (
    <header className="h-11 bg-[#181818] border-b border-[#282828] px-3.5 flex items-center justify-between text-[#cccccc] select-none z-30 shrink-0 font-sans">
      
      {/* 1. Left: Browser Studio Brand & Search Everywhere */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-sm font-black text-[11px]">
            BS
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs tracking-wide text-white">Browser Studio</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              WASM
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSearchEverywhere}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#252526] hover:bg-[#2a2d2e] border border-[#3c3c3c] text-[11.5px] text-[#858585] hover:text-[#cccccc] transition-colors"
          title="Search Everywhere (Double Shift)"
        >
          <Search className="w-3 h-3 text-[#858585]" />
          <span className="hidden md:inline">Search files & symbols...</span>
          <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-[#1e1e1e] border border-[#3c3c3c] rounded text-[#858585]">
            Shift Shift
          </kbd>
        </button>
      </div>

      {/* 2. Right: Team Collab, Run & Sync, View Modes, User Profile, Settings */}
      <div className="flex items-center gap-2">
        
        {/* 1 Single Unified Run Action Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="px-3 py-1 rounded-md bg-[#0e639c] hover:bg-[#1177bb] active:bg-[#007acc] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          title="Run / Live Sync (Client Execution)"
        >
          <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run & Sync'}</span>
        </button>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#252526] rounded-md p-0.5 border border-[#3c3c3c] text-[#858585]">
          <button
            onClick={() => onToggleViewMode('code')}
            className={`p-1.5 rounded transition-colors ${
              settings.editorViewMode === 'code' ? 'bg-[#007acc] text-white shadow-sm' : 'hover:text-white'
            }`}
            title="Code Editor Only"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleViewMode('split')}
            className={`p-1.5 rounded transition-colors ${
              settings.editorViewMode === 'split' ? 'bg-[#007acc] text-white shadow-sm' : 'hover:text-white'
            }`}
            title="Split (Code + Design Canvas)"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleViewMode('design')}
            className={`p-1.5 rounded transition-colors ${
              settings.editorViewMode === 'design' ? 'bg-[#007acc] text-white shadow-sm' : 'hover:text-white'
            }`}
            title="Design Canvas Only"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Account / Profile */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#252526] hover:bg-[#2a2d2e] border border-[#3c3c3c] text-xs transition-colors"
          title={currentUser ? `Logged in as @${currentUser.username}` : 'Sign In / Register'}
        >
          {currentUser ? (
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] text-white"
              style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
            >
              {currentUser.username.slice(0, 1).toUpperCase()}
            </div>
          ) : (
            <User className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden lg:inline text-[#cccccc]">
            {currentUser ? currentUser.displayName : 'Account'}
          </span>
        </button>

        {/* ONLY 1 Single Settings / Hub Icon */}
        <button
          onClick={() => onOpenSettingsModal('keys')}
          className="p-1.5 rounded-md bg-[#252526] hover:bg-[#2a2d2e] border border-[#3c3c3c] text-[#cccccc] hover:text-white transition-colors"
          title="Studio Settings & Documentation"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
