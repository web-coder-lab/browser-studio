import React from 'react';
import { Terminal, HardDrive, Cpu, ShieldCheck } from 'lucide-react';
import { ToastNotification } from '../../types/ide';

interface StatusBarProps {
  activeFilePath: string | null;
  notifications: ToastNotification[];
  isBottomDockOpen: boolean;
  onToggleBottomDock: () => void;
  onClearMemory: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeFilePath,
  isBottomDockOpen,
  onToggleBottomDock,
  onClearMemory,
}) => {
  return (
    <footer className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[11px] select-none z-30 shrink-0 font-sans font-medium">
      {/* Left items */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleBottomDock}
          className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
          title="Toggle Kali Linux Shell / Output Dock"
        >
          <Terminal className="w-3 h-3" />
          <span>Tool Window</span>
        </button>

        <span className="opacity-60 hidden sm:inline">|</span>

        <span className="hidden sm:inline opacity-90 font-mono text-[10.5px]">
          {activeFilePath || 'No file selected'}
        </span>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3 font-mono text-[10.5px]">
        <span className="hidden md:inline">UTF-8</span>
        <span className="opacity-60 hidden md:inline">|</span>
        <span className="hidden md:inline">Spaces: 2</span>
        <span className="opacity-60 hidden md:inline">|</span>

        {/* Memory & GC */}
        <button
          onClick={onClearMemory}
          className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          title="Client Garbage Collection"
        >
          <HardDrive className="w-3 h-3" />
          <span>38MB</span>
        </button>

        <span className="opacity-60">|</span>

        <div className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-emerald-300" />
          <span>Client WASM</span>
        </div>
      </div>
    </footer>
  );
};
