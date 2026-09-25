import React, { useState, useRef } from 'react';
import { FileItem, FileLanguage } from '../../types/ide';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Upload, 
  RotateCcw,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Binary
} from 'lucide-react';
import { getLanguageFromFilename } from '../../services/fileSystem';

interface FileExplorerProps {
  files: FileItem[];
  activeFilePath: string | null;
  onSelectFile: (file: FileItem) => void;
  onCreateFile: (parentPath: string, name: string, isFolder: boolean) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  onExportZip: () => void;
  onImportZip: (file: File) => void;
  onResetWorkspace: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onExportZip,
  onImportZip,
  onResetWorkspace,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '/': true });
  const [isCreating, setIsCreating] = useState<{ isFolder: boolean; parentPath: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !isCreating) return;
    onCreateFile(isCreating.parentPath, newItemName.trim(), isCreating.isFolder);
    setNewItemName('');
    setIsCreating(null);
  };

  const handleRenameSubmit = (e: React.FormEvent, oldPath: string) => {
    e.preventDefault();
    if (!renameValue.trim() || renameValue.trim() === oldPath.split('/').pop()) {
      setRenamingPath(null);
      return;
    }
    onRenameFile(oldPath, renameValue.trim());
    setRenamingPath(null);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isFolder) {
      return expandedFolders[file.path] ? (
        <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
      );
    }

    if (file.name.endsWith('.cpp') || file.name.endsWith('.h') || file.name.endsWith('.hpp')) {
      return <Binary className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (file.name.endsWith('.py')) {
      return <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />;
    }
    if (file.name.endsWith('.sql')) {
      return <FileCode className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (file.name.endsWith('.json')) {
      return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (file.name.endsWith('.html')) {
      return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    }
    if (file.name.endsWith('.css') || file.name.endsWith('.scss')) {
      return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    if (file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      return <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />;
    }

    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const renderTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders[item.path] ?? false;
      const isActive = activeFilePath === item.path;
      const isRenaming = renamingPath === item.path;

      return (
        <div key={item.id} className="select-none font-sans">
          <div
            onClick={() => {
              if (item.isFolder) {
                toggleFolder(item.path);
              } else {
                onSelectFile(item);
              }
            }}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className={`group flex items-center justify-between py-1.5 pr-2.5 cursor-pointer text-xs transition-colors ${
              isActive
                ? 'bg-[#37373d] text-white font-medium'
                : 'text-slate-300 hover:bg-[#2a2d2e] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              {item.isFolder && (
                <span className="text-slate-500 hover:text-slate-300 shrink-0">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              )}
              
              {getFileIcon(item)}

              {isRenaming ? (
                <form
                  onSubmit={(e) => handleRenameSubmit(e, item.path)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0"
                >
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={(e) => handleRenameSubmit(e, item.path)}
                    autoFocus
                    className="w-full bg-[#1e1e1e] border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white outline-none font-mono"
                  />
                </form>
              ) : (
                <span className="truncate text-[12px]">{item.name}</span>
              )}
            </div>

            {/* Quick Action Buttons on Hover */}
            <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
              {item.isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating({ isFolder: false, parentPath: item.path });
                    setExpandedFolders((p) => ({ ...p, [item.path]: true }));
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                  title="New File inside"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingPath(item.path);
                  setRenameValue(item.name);
                }}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete ${item.name}?`)) {
                    onDeleteFile(item.path);
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Child Items */}
          {item.isFolder && isExpanded && item.children && item.children.length > 0 && (
            <div>{renderTree(item.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#181818] border-r border-[#282828] select-none overflow-hidden font-sans">
      
      {/* Header Toolbar */}
      <div className="h-9 bg-[#181818] border-b border-[#282828] px-3 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <span className="font-bold uppercase tracking-wider text-[10.5px] text-[#cccccc]">Explorer</span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating({ isFolder: false, parentPath: '/' })}
            className="p-1 hover:bg-[#2a2d2e] text-[#858585] hover:text-[#cccccc] rounded transition-colors"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setIsCreating({ isFolder: true, parentPath: '/' })}
            className="p-1 hover:bg-[#2a2d2e] text-[#858585] hover:text-[#cccccc] rounded transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onExportZip}
            className="p-1 hover:bg-[#2a2d2e] text-[#858585] hover:text-[#cccccc] rounded transition-colors"
            title="Export ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-[#2a2d2e] text-[#858585] hover:text-[#cccccc] rounded transition-colors"
            title="Import ZIP"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetWorkspace}
            className="p-1 hover:bg-[#2a2d2e] text-[#858585] hover:text-rose-400 rounded transition-colors"
            title="Reset Workspace"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportZip(file);
              e.target.value = '';
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Inline Create Input */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 bg-[#252526] border-b border-[#3c3c3c]">
          <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-indigo-500 rounded px-2 py-1">
            {isCreating.isFolder ? (
              <Folder className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={isCreating.isFolder ? 'Folder name...' : 'File name (e.g. main.cpp)...'}
              autoFocus
              className="flex-1 bg-transparent text-white outline-none text-xs font-mono"
            />
          </div>
          <div className="flex justify-end gap-1.5 mt-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setIsCreating(null)}
              className="px-2 py-0.5 rounded text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Files Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {renderTree(files)}
      </div>
    </div>
  );
};
