import React, { useState, useRef } from 'react';
import { FileItem } from '../../types/ide';
import { createSandboxedHTML } from '../../services/fileSystem';
import { 
  RotateCw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  X 
} from 'lucide-react';

interface LivePreviewProps {
  files: FileItem[];
  onClose: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ files, onClose }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoom, setZoom] = useState<number>(100);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sandboxedHTML = createSandboxedHTML(files);

  const handleOpenInNewTab = () => {
    const blob = new Blob([sandboxedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(150, prev + 10));
  const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 10));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] relative overflow-hidden select-none">
      {/* Top Preview Bar */}
      <div className="h-8 bg-[#080a10] border-b border-slate-800 px-3 flex items-center justify-between shrink-0 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-400">Design / Output</span>
          <span className="text-slate-600">|</span>

          {/* Device Switcher */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 text-slate-400 border border-slate-800">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1 rounded transition-colors ${device === 'desktop' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
              title="Desktop View (Auto Width)"
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1 rounded transition-colors ${device === 'tablet' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
              title="Tablet View (768px Responsive)"
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1 rounded transition-colors ${device === 'mobile' ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
              title="Mobile View (375px Responsive)"
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          {/* Zoom Level Indicator & Controls */}
          <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10.5px]">
            <button
              onClick={handleZoomOut}
              className="p-0.5 hover:text-white text-slate-400"
              title="Zoom Out (-10%)"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span 
              onClick={handleZoomReset}
              className="cursor-pointer font-mono px-1 hover:text-indigo-300" 
              title="Click to Reset Zoom (100%)"
            >
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-0.5 hover:text-white text-slate-400"
              title="Zoom In (+10%)"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Preview Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            title="Reload Sandbox Preview"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            title="Pop out in new tab"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            title="Close Preview Pane"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Responsive Preview Viewport (No sticking, clean bounds) */}
      <div className="flex-1 bg-[#06070a] flex items-center justify-center overflow-auto p-3 relative">
        <div
          className={`transition-all duration-150 bg-white overflow-hidden flex flex-col shadow-2xl relative ${
            device === 'mobile'
              ? 'w-[375px] max-w-full h-[667px] max-h-full rounded-2xl border-4 border-slate-700 mx-auto my-auto shrink-0'
              : device === 'tablet'
              ? 'w-[768px] max-w-full h-[1024px] max-h-full rounded-xl border-2 border-slate-700 mx-auto my-auto shrink-0'
              : 'w-full h-full border border-slate-800 rounded-sm'
          }`}
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: 'center center',
          }}
        >
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={sandboxedHTML}
            title="Live Sandbox Application"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="w-full h-full border-0 bg-white block flex-1 pointer-events-auto"
          />
        </div>
      </div>
    </div>
  );
};
