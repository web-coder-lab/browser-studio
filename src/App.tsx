/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileItem, 
  TabItem, 
  TerminalLine, 
  ConsoleMessage, 
  NetworkRequestItem,
  EditorSettings, 
  WorkspaceApiKey,
  ThemeName,
  UserAccount,
  CollaboratorMember
} from './types/ide';
import { 
  loadFileSystemFromStorage, 
  saveFileSystemToStorage, 
  findFileByPath, 
  updateFileContent, 
  addFileToTree, 
  deleteFileFromTree, 
  renameFileInTree, 
  exportProjectToZip, 
  importProjectFromZip,
  INITIAL_PROJECT_FILES,
  getLanguageFromFilename
} from './services/fileSystem';
import { executePythonCode, runSqlQuery, executeCppCode } from './services/languageEngine';
import { runRealLinuxCommand, getInstalledPackages, initPyodideRuntime } from './services/realLinuxEngine';
import { getCurrentSession, restoreSession, logoutUser } from './services/authService';
import { api } from './services/apiClient';
import { validateProjectSafety } from './services/safetyGuard';
import { MainToolbar } from './components/Toolbar/MainToolbar';
import { ActivityBar, ActiveSidebarView } from './components/Navigation/ActivityBar';
import { FileExplorer } from './components/Sidebar/FileExplorer';
import { StructureOutline } from './components/Sidebar/StructureOutline';
import { GlobalSearch } from './components/Sidebar/GlobalSearch';
import { TabsBar } from './components/Editor/TabsBar';
import { StudioEditor } from './components/Editor/AndroidStudioEditor';
import { LivePreview } from './components/Preview/LivePreview';
import { BottomToolWindows } from './components/BottomDock/BottomToolWindows';
import { SearchEverywhereModal } from './components/Search/SearchEverywhereModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AuthModal } from './components/Auth/AuthModal';
import { AuthGate } from './components/Auth/AuthGate';
import { StatusBar } from './components/StatusBar/StatusBar';

export default function App() {

  // Virtual File System State
  const [files, setFiles] = useState<FileItem[]>(() => loadFileSystemFromStorage());
  const [activeFilePath, setActiveFilePath] = useState<string | null>('/index.html');
  
  // User Authentication & Team State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentSession());
  const [collaborators] = useState<CollaboratorMember[]>([]);

  // Open Tabs
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'tab-index', path: '/index.html', name: 'index.html', language: 'html' },
    { id: 'tab-app', path: '/app.js', name: 'app.js', language: 'javascript' },
    { id: 'tab-cpp', path: '/main.cpp', name: 'main.cpp', language: 'cpp' },
    { id: 'tab-py', path: '/main.py', name: 'main.py', language: 'python' },
    { id: 'tab-sh', path: '/start.sh', name: 'start.sh', language: 'shell' },
    { id: 'tab-sql', path: '/database.sql', name: 'database.sql', language: 'sql' },
  ]);

  // Layout & Resizing States
  const [activeSidebarView, setActiveSidebarView] = useState<ActiveSidebarView | null>('explorer');
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);
  const [editorSplitPercent, setEditorSplitPercent] = useState<number>(55);
  const [bottomDockHeight, setBottomDockHeight] = useState<number>(240);
  const [isBottomDockOpen, setIsBottomDockOpen] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Modals
  const [isSearchEverywhereOpen, setIsSearchEverywhereOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'keys' | 'help' | 'comingsoon'>('keys');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Unified Run & Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'darcula',
    fontFamily: 'Fira Code',
    fontSize: 13,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
    autoSave: true,
    autoPreview: true,
    editorViewMode: 'split',
    terminalPrompt: 'studio@local',
    silentMode: true,
    apiKeys: [],
  });

  // Apply Theme Attribute to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Diagnostics & Streams
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'Browser Studio terminal. HTML/CSS/JS run in preview. There is no remote Linux machine.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequestItem[]>([]);

  useEffect(() => {
    restoreSession().then((user) => setCurrentUser(user));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    api('/api/workspace').then((data: any) => {
      if (data?.files) setFiles(data.files);
    }).catch(() => undefined);
  }, [currentUser]);

  useEffect(() => {
    saveFileSystemToStorage(files);
    if (!currentUser) return;
    const timer = setTimeout(() => {
      api('/api/workspace', { method: 'POST', bodyObj: { files } }).catch(() => undefined);
    }, 900);
    return () => clearTimeout(timer);
  }, [files, currentUser]);

  // Keyboard shortcut: Shift+Shift for Search Everywhere
  useEffect(() => {
    let lastShiftTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        const now = Date.now();
        if (now - lastShiftTime < 350) {
          setIsSearchEverywhereOpen(true);
        }
        lastShiftTime = now;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // PostMessage Listener from Preview Sandbox
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'BROWSER_STUDIO_LOGCAT') {
        const newMsg: ConsoleMessage = {
          id: 'log-' + Date.now() + Math.random().toString(36).substring(2, 6),
          level: e.data.level || 'log',
          args: e.data.args || [],
          timestamp: e.data.timestamp || new Date().toLocaleTimeString(),
          tag: e.data.tag || 'Sandbox',
        };
        setConsoleLogs((prev) => [...prev.slice(-200), newMsg]);
      }

      if (e.data && e.data.type === 'BROWSER_STUDIO_NETWORK') {
        setNetworkRequests((prev) => [...prev.slice(-50), e.data.request]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Active File Reference
  const activeFile = activeFilePath ? findFileByPath(files, activeFilePath) : null;

  // File selection
  const handleSelectFile = (file: FileItem) => {
    if (file.isFolder) return;
    setActiveFilePath(file.path);

    if (!tabs.some((t) => t.path === file.path)) {
      setTabs((prev) => [
        ...prev,
        {
          id: `tab-${file.path}`,
          path: file.path,
          name: file.name,
          language: file.language,
        },
      ]);
    }
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tabs.filter((t) => t.path !== path);
    setTabs(updated);

    if (activeFilePath === path) {
      if (updated.length > 0) {
        setActiveFilePath(updated[updated.length - 1].path);
      } else {
        setActiveFilePath(null);
      }
    }
  };

  // File mutations
  const handleCreateFile = (parentPath: string, name: string, isFolder: boolean) => {
    const safety = validateProjectSafety(name);
    if (!safety.safe) return;

    const cleanPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
    const newItem: FileItem = {
      id: `file-${Date.now().toString(36)}`,
      name,
      path: cleanPath,
      isFolder,
      language: isFolder ? 'plaintext' : getLanguageFromFilename(name),
      content: isFolder ? undefined : '',
      children: isFolder ? [] : undefined,
    };

    setFiles((prev) => addFileToTree(prev, parentPath, newItem));
    if (!isFolder) {
      handleSelectFile(newItem);
    }
  };

  const handleDeleteFile = (path: string) => {
    setFiles((prev) => deleteFileFromTree(prev, path));
    setTabs((prev) => prev.filter((t) => !t.path.startsWith(path)));
    if (activeFilePath && activeFilePath.startsWith(path)) {
      setActiveFilePath(null);
    }
  };

  const handleRenameFile = (oldPath: string, newName: string) => {
    const safety = validateProjectSafety(newName);
    if (!safety.safe) return;

    setFiles((prev) => renameFileInTree(prev, oldPath, newName));
    const parts = oldPath.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/') || `/${newName}`;

    setTabs((prev) =>
      prev.map((t) =>
        t.path === oldPath
          ? { ...t, path: newPath, name: newName, language: getLanguageFromFilename(newName) }
          : t
      )
    );

    if (activeFilePath === oldPath) {
      setActiveFilePath(newPath);
    }
  };

  const handleUpdateContent = (newContent: string) => {
    if (!activeFilePath) return;
    const safety = validateProjectSafety(activeFilePath, newContent);
    if (!safety.safe) return;
    setFiles((prev) => updateFileContent(prev, activeFilePath, newContent));
  };

  // Format Code
  const handleFormatCode = () => {
    if (!activeFile || !activeFile.content) return;
    try {
      let formatted = activeFile.content;
      if (activeFile.language === 'json') {
        formatted = JSON.stringify(JSON.parse(activeFile.content), null, settings.tabSize || 2);
      } else {
        formatted = activeFile.content
          .split('\n')
          .map((l) => l.trimEnd())
          .join('\n');
      }
      handleUpdateContent(formatted);
    } catch {
      // ignore
    }
  };

  // UNIFIED 1 SINGLE RUN / SYNC TRIGGER (Handles C++, Python, SQLite, JS/HTML)
  const handleRunAndSync = async () => {
    setIsRunning(true);
    const installed = getInstalledPackages();

    if (activeFilePath?.endsWith('.py')) {
      const pyFile = findFileByPath(files, activeFilePath);
      if (pyFile && pyFile.content) {
        setIsBottomDockOpen(true);
        if (!installed.has('python')) {
          setTerminalLines((prev) => [
            ...prev,
            { id: 'py-err-' + Date.now(), type: 'input', text: `python ${pyFile.name}`, timestamp: new Date().toLocaleTimeString() },
            { id: 'py-out-' + Date.now(), type: 'error', text: `bash: python: command not found\nTo execute Python code in WebAssembly, install it via:\n  pkg install python`, timestamp: new Date().toLocaleTimeString() },
          ]);
        } else {
          setTerminalLines((prev) => [
            ...prev,
            { id: 'py-in-' + Date.now(), type: 'input', text: `python ${pyFile.name}`, timestamp: new Date().toLocaleTimeString() },
          ]);
          try {
            const pyodide = await initPyodideRuntime();
            const logs: string[] = [];
            pyodide.setStdout({ batched: (t: string) => logs.push(t) });
            pyodide.setStderr({ batched: (t: string) => logs.push(`[stderr] ${t}`) });
            const res = await pyodide.runPythonAsync(pyFile.content);
            const out = logs.join('\n') || (res !== undefined ? String(res) : 'Process finished with exit code 0');
            setTerminalLines((prev) => [
              ...prev,
              { id: 'py-res-' + Date.now(), type: 'success', text: out, timestamp: new Date().toLocaleTimeString() },
            ]);
          } catch (err: any) {
            setTerminalLines((prev) => [
              ...prev,
              { id: 'py-err-' + Date.now(), type: 'error', text: `Python Exception: ${err.message}`, timestamp: new Date().toLocaleTimeString() },
            ]);
          }
        }
      }
    } else if (activeFilePath?.endsWith('.cpp')) {
      const cppFile = findFileByPath(files, activeFilePath);
      if (cppFile && cppFile.content) {
        setIsBottomDockOpen(true);
        if (!installed.has('clang')) {
          setTerminalLines((prev) => [
            ...prev,
            { id: 'cpp-in-' + Date.now(), type: 'input', text: `clang++ ${cppFile.name}`, timestamp: new Date().toLocaleTimeString() },
            { id: 'cpp-out-' + Date.now(), type: 'error', text: `bash: clang++: command not found\nTo compile C++ WebAssembly, install the compiler via:\n  pkg install clang`, timestamp: new Date().toLocaleTimeString() },
          ]);
        } else {
          const cppResult = executeCppCode(cppFile.content);
          setTerminalLines((prev) => [
            ...prev,
            { id: 'cpp-in-' + Date.now(), type: 'input', text: `clang++ ${cppFile.name} -o a.out.wasm && ./a.out.wasm`, timestamp: new Date().toLocaleTimeString() },
            { id: 'cpp-out-' + Date.now(), type: cppResult.error ? 'error' : 'success', text: cppResult.error || cppResult.output, timestamp: new Date().toLocaleTimeString() },
          ]);
        }
      }
    } else if (activeFilePath?.endsWith('.sql')) {
      const sqlFile = findFileByPath(files, activeFilePath);
      if (sqlFile && sqlFile.content) {
        setIsBottomDockOpen(true);
        if (!installed.has('sqlite3')) {
          setTerminalLines((prev) => [
            ...prev,
            { id: 'sql-in-' + Date.now(), type: 'input', text: `sqlite3 "${sqlFile.name}"`, timestamp: new Date().toLocaleTimeString() },
            { id: 'sql-out-' + Date.now(), type: 'error', text: `bash: sqlite3: command not found\nInstall SQLite via:\n  pkg install sqlite3`, timestamp: new Date().toLocaleTimeString() },
          ]);
        } else {
          const sqlRes = runSqlQuery(sqlFile.content);
          setTerminalLines((prev) => [
            ...prev,
            { id: 'sql-in-' + Date.now(), type: 'input', text: `sqlite3 "${sqlFile.name}"`, timestamp: new Date().toLocaleTimeString() },
            { id: 'sql-out-' + Date.now(), type: sqlRes.error ? 'error' : 'success', text: sqlRes.error || `Returned ${sqlRes.values.length} rows in ${sqlRes.executionTimeMs}ms`, timestamp: new Date().toLocaleTimeString() },
          ]);
        }
      }
    } else {
      setSettings((prev) => ({ ...prev, editorViewMode: 'split' }));
    }

    setTimeout(() => setIsRunning(false), 200);
  };

  const handleAddTerminalLine = (line: Omit<TerminalLine, 'id' | 'timestamp'>) => {
    setTerminalLines((prev) => [
      ...prev,
      { ...line, id: 'term-' + Date.now() + Math.random().toString(36).substring(2, 5), timestamp: new Date().toLocaleTimeString() }
    ]);
  };

  // TELEPORT HANDLER
  const handleTeleport = (target: 'settings' | 'help' | 'comingsoon' | 'explorer' | 'preview' | 'team') => {
    if (target === 'settings') {
      setSettingsTab('keys');
      setIsSettingsOpen(true);
    } else if (target === 'help') {
      setSettingsTab('help');
      setIsSettingsOpen(true);
    } else if (target === 'comingsoon') {
      setSettingsTab('comingsoon');
      setIsSettingsOpen(true);
    } else if (target === 'explorer') {
      setActiveSidebarView('explorer');
    } else if (target === 'preview') {
      setSettings((prev) => ({ ...prev, editorViewMode: 'design' }));
    }
  };

  // RESIZE PANE HANDLER (via Shell)
  const handleResizePane = (pane: 'split' | 'sidebar' | 'shell', val: number) => {
    if (pane === 'split') {
      setEditorSplitPercent(Math.min(85, Math.max(15, val)));
    } else if (pane === 'sidebar') {
      setSidebarWidth(Math.min(500, Math.max(160, val)));
    } else if (pane === 'shell') {
      setBottomDockHeight(Math.min(600, Math.max(100, val)));
    }
  };

  // API Key Management Handler for Shell
  const handleManageApiKeyFromShell = (action: 'list' | 'create' | 'revoke', nameOrId?: string): string => {
    if (action === 'list') {
      if (settings.apiKeys.length === 0) return 'No active workspace tokens registered.';
      return settings.apiKeys.map((k) => `• [${k.keyId}] ${k.name} (Rate: ${k.rateLimitPerMinute}/min)`).join('\n');
    } else if (action === 'create') {
      const rawKey = 'bs_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');
      const newKey: WorkspaceApiKey = {
        keyId: 'key_' + Date.now().toString(36),
        apiKey: rawKey,
        name: nameOrId || 'Shell Generated Token',
        createdAt: new Date().toLocaleDateString(),
        permissions: ['read', 'write', 'execute', 'deploy'],
        rateLimitPerMinute: 120,
      };
      setSettings((prev) => ({ ...prev, apiKeys: [...prev.apiKeys, newKey] }));
      return `✨ Generated new token: ${newKey.apiKey} (ID: ${newKey.keyId})`;
    } else if (action === 'revoke') {
      setSettings((prev) => ({ ...prev, apiKeys: prev.apiKeys.filter((k) => k.keyId !== nameOrId) }));
      return `Revoked token ID: ${nameOrId}`;
    }
    return '';
  };

  // Team Management Handler for Shell
  const handleManageTeamFromShell = (_action: 'list' | 'invite', _username?: string): string => {
    return 'Team invites are not live. This studio is one account and one workspace.';
  };

  // DRAG RESIZING HANDLERS
  const startResizingSidebar = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(500, Math.max(160, e.clientX - 44));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startResizingSplit = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);
    const container = mouseDownEvent.currentTarget.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const handleMouseMove = (e: MouseEvent) => {
      const offset = e.clientX - rect.left;
      const pct = Math.min(85, Math.max(15, (offset / rect.width) * 100));
      setEditorSplitPercent(pct);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startResizingBottomDock = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = Math.min(600, Math.max(100, window.innerHeight - e.clientY - 24));
      setBottomDockHeight(newHeight);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 1. AUTHENTICATION GATE: If user is not logged in, show AuthGate only!
  if (!currentUser) {
    return <AuthGate onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className={`h-screen w-screen flex flex-col bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden font-sans select-none ${isDragging ? 'pointer-events-none select-none cursor-col-resize' : ''}`}>
      
      {/* 1. Master Toolbar */}
      <MainToolbar
        onRun={handleRunAndSync}
        isRunning={isRunning}
        onOpenSearchEverywhere={() => setIsSearchEverywhereOpen(true)}
        settings={settings}
        onToggleViewMode={(mode) => setSettings((prev) => ({ ...prev, editorViewMode: mode }))}
        onOpenSettingsModal={(tab) => {
          setSettingsTab(tab || 'keys');
          setIsSettingsOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        collaborators={collaborators}
      />

      {/* 2. Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Activity Bar */}
        <ActivityBar
          activeView={activeSidebarView}
          onSelectView={(view) => setActiveSidebarView((prev) => (prev === view ? null : view))}
        />

        {/* Resizable Left Tool Window Drawer */}
        {activeSidebarView && (
          <aside
            style={{ width: `${sidebarWidth}px` }}
            className="h-full flex flex-col shrink-0 z-10 relative bg-[#181818] border-r border-[#282828]"
          >
            {activeSidebarView === 'explorer' && (
              <FileExplorer
                files={files}
                activeFilePath={activeFilePath}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onExportZip={async () => {
                  const blob = await exportProjectToZip(files);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `browser-studio-${Date.now().toString(36)}.zip`;
                  a.click();
                }}
                onImportZip={async (file) => {
                  const imported = await importProjectFromZip(file);
                  setFiles(imported);
                  setTabs([]);
                  const first = imported.find((f) => !f.isFolder);
                  if (first) handleSelectFile(first);
                }}
                onResetWorkspace={() => {
                  if (window.confirm('Reset workspace to clean project template?')) {
                    setFiles(INITIAL_PROJECT_FILES);
                    setActiveFilePath('/index.html');
                  }
                }}
              />
            )}

            {activeSidebarView === 'structure' && (
              <StructureOutline
                file={activeFile}
                onSelectLine={() => {}}
              />
            )}

            {activeSidebarView === 'search' && (
              <GlobalSearch
                files={files}
                onSelectFile={handleSelectFile}
                onUpdateFileContent={(path, content) => {
                  setFiles((prev) => updateFileContent(prev, path, content));
                }}
              />
            )}

            {/* Draggable Sidebar Resizer Handle */}
            <div
              onMouseDown={startResizingSidebar}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007acc] transition-colors z-20 pointer-events-auto"
              title="Drag to resize Project Explorer"
            />
          </aside>
        )}

        {/* Center Workspace */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Main Code vs Design Split Area */}
          <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
            
            {/* Editor Sub-pane */}
            {settings.editorViewMode !== 'design' && (
              <div
                style={{
                  width: settings.editorViewMode === 'code' ? '100%' : `${editorSplitPercent}%`,
                }}
                className="flex flex-col min-w-0 h-full overflow-hidden pointer-events-auto"
              >
                <TabsBar
                  tabs={tabs}
                  activeTabPath={activeFilePath}
                  onSelectTab={(path) => {
                    const found = findFileByPath(files, path);
                    if (found) handleSelectFile(found);
                  }}
                  onCloseTab={handleCloseTab}
                />

                <div className="flex-1 min-h-0 relative">
                  <StudioEditor
                    file={activeFile}
                    settings={settings}
                    onChangeContent={handleUpdateContent}
                    onFormatCode={handleFormatCode}
                  />
                </div>
              </div>
            )}

            {/* Draggable Splitter Handle between Code and Preview */}
            {settings.editorViewMode === 'split' && (
              <div
                onMouseDown={startResizingSplit}
                className="w-1.5 bg-[#181818] hover:bg-[#007acc] cursor-col-resize flex items-center justify-center transition-colors z-20 shrink-0 border-x border-[#282828] pointer-events-auto"
                title="Drag to adjust Code / Preview ratio"
              >
                <div className="h-6 w-0.5 bg-slate-600 rounded-full" />
              </div>
            )}

            {/* Design / Preview Sub-pane */}
            {settings.editorViewMode !== 'code' && (
              <div
                style={{
                  width: settings.editorViewMode === 'design' ? '100%' : `${100 - editorSplitPercent}%`,
                }}
                className={`h-full overflow-hidden bg-[#141414] ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}
              >
                <LivePreview
                  files={files}
                  onClose={() => setSettings((prev) => ({ ...prev, editorViewMode: 'code' }))}
                />
              </div>
            )}
          </div>

          {/* Draggable Dock Resizer Handle for Bottom Tool Windows */}
          {isBottomDockOpen && (
            <div
              onMouseDown={startResizingBottomDock}
              className="h-1.5 bg-[#181818] hover:bg-[#007acc] cursor-row-resize flex items-center justify-center transition-colors z-20 shrink-0 border-y border-[#282828] pointer-events-auto"
              title="Drag to resize Kali Linux Shell dock height"
            >
              <div className="w-8 h-0.5 bg-slate-600 rounded-full" />
            </div>
          )}

          {/* Resizable Kali Linux Bottom Dock */}
          <div style={{ height: isBottomDockOpen ? `${bottomDockHeight}px` : '0px' }} className="overflow-hidden">
            <BottomToolWindows
              files={files}
              setFiles={setFiles}
              terminalLines={terminalLines}
              onAddTerminalLine={handleAddTerminalLine}
              onClearTerminal={() => setTerminalLines([])}
              consoleLogs={consoleLogs}
              onClearConsole={() => setConsoleLogs([])}
              networkRequests={networkRequests}
              onClearNetwork={() => setNetworkRequests([])}
              isOpen={isBottomDockOpen}
              onClose={() => setIsBottomDockOpen(false)}
              terminalPrompt={`${currentUser?.username || 'kali'}@browser-studio`}
              currentUser={currentUser}
              onTeleport={handleTeleport}
              onChangeTheme={(th) => setSettings((prev) => ({ ...prev, theme: th }))}
              onChangeViewMode={(mode) => setSettings((prev) => ({ ...prev, editorViewMode: mode }))}
              onChangeFontSize={(size) => setSettings((prev) => ({ ...prev, fontSize: size }))}
              onResizePane={handleResizePane}
              onManageApiKey={handleManageApiKeyFromShell}
              onManageTeam={handleManageTeamFromShell}
            />
          </div>
        </div>
      </div>

      {/* 3. Search Everywhere Spotlight Modal */}
      <SearchEverywhereModal
        isOpen={isSearchEverywhereOpen}
        onClose={() => setIsSearchEverywhereOpen(false)}
        files={files}
        onSelectFile={handleSelectFile}
        onTriggerAction={(actionId) => {
          if (actionId === 'run_web') {
            handleRunAndSync();
          } else if (actionId === 'open_terminal') {
            setIsBottomDockOpen((prev) => !prev);
          }
        }}
      />

      {/* 4. Unified Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        initialTab={settingsTab}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setIsSettingsOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* 5. Authentication & User Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Status Bar */}
      <StatusBar
        activeFilePath={activeFilePath}
        notifications={[]}
        isBottomDockOpen={isBottomDockOpen}
        onToggleBottomDock={() => setIsBottomDockOpen(!isBottomDockOpen)}
        onClearMemory={() => {
          setConsoleLogs([]);
          setNetworkRequests([]);
        }}
      />
    </div>
  );
}
