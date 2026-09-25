import JSZip from 'jszip';
import { FileItem, FileLanguage, StructureSymbol } from '../types/ide';
import { validateProjectSafety } from './safetyGuard';

export type { FileItem, FileLanguage };

const STORAGE_KEY = 'browser_studio_vfs_v3';

export function getLanguageFromFilename(filename: string): FileLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'json':
      return 'json';
    case 'py':
    case 'python':
      return 'python';
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'sql':
      return 'sql';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'sh':
    case 'bash':
      return 'shell';
    default:
      return 'plaintext';
  }
}

export const INITIAL_PROJECT_FILES: FileItem[] = [
  {
    id: 'root-index-html',
    name: 'index.html',
    path: '/index.html',
    isFolder: false,
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Browser Studio App</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0f111a] text-slate-100 min-h-screen flex flex-col items-center justify-center p-6">
  <div class="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg">
          BS
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">Browser Studio Runtime</h1>
          <p class="text-xs text-emerald-400 font-mono flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live & Interactive
          </p>
        </div>
      </div>
      <span class="text-[11px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full">v2.5.0</span>
    </div>

    <!-- Interactive Counter -->
    <div class="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">State Management</span>
        <span id="counter-badge" class="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">Count: 0</span>
      </div>
      <div class="flex gap-2">
        <button id="btn-dec" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95 border border-slate-700">
          - 1
        </button>
        <button id="btn-inc" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95 shadow-md shadow-indigo-600/30">
          + 1
        </button>
      </div>
    </div>

    <!-- Live Canvas -->
    <div class="rounded-xl overflow-hidden border border-slate-800 bg-black/50 mb-4">
      <canvas id="live-canvas" width="440" height="130" class="w-full block"></canvas>
    </div>

    <div class="flex items-center justify-between text-xs text-slate-400">
      <span>Console logs stream to Bottom Logcat</span>
      <button id="btn-log" class="text-cyan-400 hover:underline">Emit Log Event</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`
  },
  {
    id: 'root-app-js',
    name: 'app.js',
    path: '/app.js',
    isFolder: false,
    language: 'javascript',
    content: `// Interactive Application Script (JavaScript Engine)
let count = 0;
const counterBadge = document.getElementById('counter-badge');
const btnInc = document.getElementById('btn-inc');
const btnDec = document.getElementById('btn-dec');
const btnLog = document.getElementById('btn-log');

function updateUI() {
  if (counterBadge) {
    counterBadge.textContent = \`Count: \${count}\`;
    counterBadge.className = count >= 0 
      ? 'text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono'
      : 'text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono';
  }
}

if (btnInc) {
  btnInc.addEventListener('click', () => {
    count++;
    updateUI();
    console.log(\`[State] Incremented counter to: \${count}\`);
  });
}

if (btnDec) {
  btnDec.addEventListener('click', () => {
    count--;
    updateUI();
    console.log(\`[State] Decremented counter to: \${count}\`);
  });
}

if (btnLog) {
  btnLog.addEventListener('click', () => {
    console.log('[BrowserStudio] Client event fired at', new Date().toISOString(), { count });
  });
}

// Particle Wave Canvas Rendering
const canvas = document.getElementById('live-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let step = 0;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#38bdf8';
    
    for (let x = 0; x < canvas.width; x += 2) {
      const y = (canvas.height / 2) + Math.sin((x + step) * 0.04) * 25 * Math.cos(step * 0.02);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    step += 1.5;
    requestAnimationFrame(render);
  }
  render();
}

console.log('[Engine] JS Runtime initialized.');
`
  },
  {
    id: 'root-style-css',
    name: 'style.css',
    path: '/style.css',
    isFolder: false,
    language: 'css',
    content: `/* Custom Studio Stylesheet */
:root {
  --primary-accent: #6366f1;
  --cyan-glow: #38bdf8;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  margin: 0;
  overflow-x: hidden;
}

#live-canvas {
  touch-action: none;
}
`
  },
  {
    id: 'root-main-cpp',
    name: 'main.cpp',
    path: '/main.cpp',
    isFolder: false,
    language: 'cpp',
    content: `// WebAssembly C++ Clang Runtime
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "=== WebAssembly Clang++ Engine ===" << std::endl;
    std::cout << "Hello from Client-Side C++ inside Browser Studio!" << std::endl;
    
    std::vector<int> scores = {98, 85, 92, 100, 78};
    std::cout << "Engine status: OK (WASM SIMD Enabled)" << std::endl;
    
    return 0;
}
`
  },
  {
    id: 'root-main-py',
    name: 'main.py',
    path: '/main.py',
    isFolder: false,
    language: 'python',
    content: `# Python 3.12 Analytics Script
import math

print("=== Browser Studio Python Runtime ===")

# Sample Calculation
numbers = [12, 45, 78, 23, 56, 89, 90]
avg = sum(numbers) / len(numbers)

print(f"Data Set: {numbers}")
print(f"Average: {avg}")
print(f"Max: {max(numbers)}")
print(f"Min: {min(numbers)}")

# Trigonometric Calculation
angle = 45
radians = math.radians(angle)
print(f"Sin({angle} deg) = {math.sin(radians)}")

print("Python execution completed successfully!")
`
  },
  {
    id: 'root-database-sql',
    name: 'database.sql',
    path: '/database.sql',
    isFolder: false,
    language: 'sql',
    content: `-- SQLite Database Schema & Queries
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT,
  created_at DATETIME
);

-- Select all users
SELECT * FROM users;

-- Query specific role
SELECT * FROM users WHERE role = 'Admin';
`
  },
  {
    id: 'root-app-tsx',
    name: 'App.tsx',
    path: '/App.tsx',
    isFolder: false,
    language: 'tsx',
    content: `// React.js TSX Component
import React, { useState } from 'react';

export function ReactWidget() {
  const [likes, setLikes] = useState(0);

  return (
    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white">
      <h2 className="text-sm font-bold text-cyan-400 mb-2">React Component Live</h2>
      <p className="text-xs text-slate-300 mb-3">TSX component ready for integration.</p>
      <button 
        onClick={() => setLikes(likes + 1)}
        className="px-3 py-1.5 bg-indigo-600 rounded-lg text-xs font-semibold"
      >
        Likes: {likes}
      </button>
    </div>
  );
}
`
  },
  {
    id: 'root-start-sh',
    name: 'start.sh',
    path: '/start.sh',
    isFolder: false,
    language: 'shell',
    content: `#!/bin/bash
# Browser Studio Automated Startup Shell Script
echo "=== Starting Workspace Services ==="
echo "Node Environment: development"
python main.py
sqlite3 "SELECT * FROM users;"
echo "All local client engines running OK."
`
  },
  {
    id: 'root-readme-md',
    name: 'README.md',
    path: '/README.md',
    isFolder: false,
    language: 'markdown',
    content: `# Browser Studio (Next-Gen Cloud IDE)

Welcome to **Browser Studio** — a high-performance, Android Studio-inspired browser development environment.

## 🚀 Supported Multi-Language Execution
- **JavaScript & TypeScript**: Node runtime execution & syntax intelligence.
- **HTML5 & CSS3 / SCSS**: Live responsive rendering & DOM manipulation.
- **JSX / TSX**: React component development.
- **Python**: In-browser Python analytics and script execution.
- **SQL (SQLite)**: Real relational database queries & table grid explorer.
- **Shell / Bash**: Interactive terminal shell with standard commands.
- **JSON**: Configuration schemas and API payload inspection.

## 🗄️ Database & Domain Connectors
- **Personal Database API Token**: Connect via Base URL + Secret Token with live ping.
- **Custom Domain & DNS**: Real Cloudflare DoH record check & SSL verification.
- **API Request Playground**: Postman-style REST/JSON requester.
`
  },
  {
    id: 'root-package-json',
    name: 'package.json',
    path: '/package.json',
    isFolder: false,
    language: 'json',
    content: `{
  "name": "browser-studio-project",
  "version": "2.5.0",
  "description": "Multi-Language Cloud Workspace",
  "scripts": {
    "start": "node app.js",
    "test:sql": "sqlite3 database.sql",
    "test:py": "python main.py"
  },
  "dependencies": {
    "tailwindcss": "^3.4.0",
    "react": "^19.0.0",
    "sqlite": "^5.0.0"
  }
}`
  },
  {
    id: 'root-users-database-json',
    name: 'users_database.json',
    path: '/users_database.json',
    isFolder: false,
    language: 'json',
    content: `{
  "schemaVersion": "3.2.0",
  "databaseEngine": "Zero-Trust JSON State Ledger",
  "users": [
    {
      "userId": "usr_alex_dev_9910",
      "email": "alex@browser-studio.io",
      "username": "alex_dev",
      "displayName": "Alex Rivers",
      "role": "administrator",
      "createdAt": "2026-01-15T08:30:00.000Z",
      "lastLoginAt": "2026-03-24T05:22:10.000Z",
      "settings": {
        "theme": "darcula",
        "fontSize": 13,
        "tabSize": 2,
        "autoSave": true,
        "editorViewMode": "split"
      },
      "apiKeys": [
        {
          "keyId": "key_master_alex_01",
          "apiKey": "bs_live_99a812f94c03b1e77d88e001a4f",
          "name": "Production Master API Token",
          "createdAt": "2026-01-16T10:00:00.000Z",
          "permissions": ["read", "write", "execute", "deploy"],
          "rateLimitPerMinute": 120
        }
      ],
      "installedPackages": ["python", "nodejs", "clang", "sqlite3"]
    }
  ]
}`
  }
];

export function loadFileSystemFromStorage(): FileItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_PROJECT_FILES;
}

export function saveFileSystemToStorage(files: FileItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (err) {
    console.error('Failed to save virtual file system to storage', err);
  }
}

export function findFileByPath(files: FileItem[], path: string): FileItem | null {
  for (const item of files) {
    if (item.path === path) return item;
    if (item.children && item.children.length > 0) {
      const found = findFileByPath(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function updateFileContent(files: FileItem[], path: string, content: string): FileItem[] {
  return files.map((item) => {
    if (item.path === path) {
      return { ...item, content };
    }
    if (item.children) {
      return {
        ...item,
        children: updateFileContent(item.children, path, content)
      };
    }
    return item;
  });
}

export function addFileToTree(files: FileItem[], parentPath: string, newItem: FileItem): FileItem[] {
  if (parentPath === '/' || parentPath === '') {
    return [...files, newItem];
  }

  return files.map((item) => {
    if (item.path === parentPath && item.isFolder) {
      const children = item.children ? [...item.children, newItem] : [newItem];
      return { ...item, children, isOpen: true };
    }
    if (item.children) {
      return {
        ...item,
        children: addFileToTree(item.children, parentPath, newItem)
      };
    }
    return item;
  });
}

export function deleteFileFromTree(files: FileItem[], path: string): FileItem[] {
  return files
    .filter((item) => item.path !== path)
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: deleteFileFromTree(item.children, path)
        };
      }
      return item;
    });
}

export function renameFileInTree(files: FileItem[], oldPath: string, newName: string): FileItem[] {
  const parts = oldPath.split('/');
  parts[parts.length - 1] = newName;
  const newPath = parts.join('/') || `/${newName}`;

  return files.map((item) => {
    if (item.path === oldPath) {
      return {
        ...item,
        name: newName,
        path: newPath,
        language: item.isFolder ? item.language : getLanguageFromFilename(newName)
      };
    }
    if (item.children) {
      return {
        ...item,
        children: renameFileInTree(item.children, oldPath, newName)
      };
    }
    return item;
  });
}

export function flattenFiles(files: FileItem[]): FileItem[] {
  let result: FileItem[] = [];
  for (const f of files) {
    result.push(f);
    if (f.children && f.children.length > 0) {
      result = result.concat(flattenFiles(f.children));
    }
  }
  return result;
}

export async function exportProjectToZip(files: FileItem[], projectName: string = 'browser-studio-project'): Promise<Blob> {
  const zip = new JSZip();

  function addFolderToZip(folderZip: JSZip, items: FileItem[]) {
    for (const item of items) {
      if (item.isFolder) {
        const sub = folderZip.folder(item.name);
        if (sub && item.children) {
          addFolderToZip(sub, item.children);
        }
      } else {
        folderZip.file(item.name, item.content || '');
      }
    }
  }

  addFolderToZip(zip, files);
  return await zip.generateAsync({ type: 'blob' });
}

export async function importProjectFromZip(file: File): Promise<FileItem[]> {
  const zip = new JSZip();
  const unzipped = await zip.loadAsync(file);
  const resultFiles: FileItem[] = [];

  for (const [relativePath, zipEntry] of Object.entries(unzipped.files)) {
    if (zipEntry.dir) continue;

    const content = await zipEntry.async('text');
    const safety = validateProjectSafety(zipEntry.name, content);
    if (!safety.safe) {
      throw new Error(`Security Violation: File '${zipEntry.name}' failed safety check (${safety.reason})`);
    }

    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    const name = cleanPath.split('/').pop() || 'unnamed';
    
    resultFiles.push({
      id: `imported-${Math.random().toString(36).substring(2, 9)}`,
      name,
      path: cleanPath,
      isFolder: false,
      language: getLanguageFromFilename(name),
      content
    });
  }

  return resultFiles.length > 0 ? resultFiles : INITIAL_PROJECT_FILES;
}

export function extractStructureOutline(file: FileItem | null): StructureSymbol[] {
  if (!file || !file.content) return [];
  const lines = file.content.split('\n');
  const symbols: StructureSymbol[] = [];

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (!trimmed) return;

    // JavaScript / TypeScript Function
    const fnMatch = trimmed.match(/(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/);
    if (fnMatch) {
      symbols.push({ id: `fn-${idx}`, name: `${fnMatch[1]}()`, kind: 'function', line: idx + 1 });
      return;
    }

    // Arrow Function const foo = () =>
    const arrowMatch = trimmed.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/);
    if (arrowMatch) {
      symbols.push({ id: `arrow-${idx}`, name: `${arrowMatch[1]} =>`, kind: 'function', line: idx + 1 });
      return;
    }

    // Class
    const classMatch = trimmed.match(/class\s+([a-zA-Z0-9_]+)/);
    if (classMatch) {
      symbols.push({ id: `cls-${idx}`, name: `class ${classMatch[1]}`, kind: 'class', line: idx + 1 });
      return;
    }

    // Interface
    const interfaceMatch = trimmed.match(/interface\s+([a-zA-Z0-9_]+)/);
    if (interfaceMatch) {
      symbols.push({ id: `int-${idx}`, name: `interface ${interfaceMatch[1]}`, kind: 'interface', line: idx + 1 });
      return;
    }

    // Python Def
    const pyDef = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (pyDef) {
      symbols.push({ id: `py-${idx}`, name: `def ${pyDef[1]}()`, kind: 'function', line: idx + 1 });
      return;
    }

    // SQL Table or Select
    const sqlTable = trimmed.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
    if (sqlTable) {
      symbols.push({ id: `sqlt-${idx}`, name: `Table: ${sqlTable[1]}`, kind: 'query', line: idx + 1 });
      return;
    }

    // HTML Headings / Tags
    const tagMatch = trimmed.match(/^<([a-zA-Z0-9]+)(?:\s+id=["']([^"']+)["'])?/);
    if (tagMatch && ['h1', 'h2', 'div', 'section', 'canvas', 'button', 'form'].includes(tagMatch[1].toLowerCase())) {
      const label = tagMatch[2] ? `<${tagMatch[1]} id="${tagMatch[2]}">` : `<${tagMatch[1]}>`;
      symbols.push({ id: `tag-${idx}`, name: label, kind: 'tag', line: idx + 1 });
    }
  });

  return symbols;
}

export function createSandboxedHTML(files: FileItem[]): string {
  const indexHtml = findFileByPath(files, '/index.html')?.content || '<html><body>No index.html found</body></html>';
  const styleCss = findFileByPath(files, '/style.css')?.content || '';
  const appJs = findFileByPath(files, '/app.js')?.content || '';

  const interceptor = `
    <script>
      (function() {
        function emitLog(level, args) {
          try {
            const formatted = Array.from(args).map(arg => {
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
              }
              return String(arg);
            });
            window.parent.postMessage({
              type: 'BROWSER_STUDIO_LOGCAT',
              level: level,
              args: formatted,
              timestamp: new Date().toLocaleTimeString(),
              tag: 'WebSandbox'
            }, '*');
          } catch(e) {}
        }

        const _log = console.log, _warn = console.warn, _err = console.error, _info = console.info, _debug = console.debug;
        console.log = function(...a) { _log.apply(console, a); emitLog('log', a); };
        console.warn = function(...a) { _warn.apply(console, a); emitLog('warn', a); };
        console.error = function(...a) { _err.apply(console, a); emitLog('error', a); };
        console.info = function(...a) { _info.apply(console, a); emitLog('info', a); };
        console.debug = function(...a) { _debug.apply(console, a); emitLog('debug', a); };

        window.onerror = function(msg, url, line) {
          emitLog('error', [msg + ' (line ' + line + ')']);
          return false;
        };

        // Intercept fetch for network monitor
        const _origFetch = window.fetch;
        window.fetch = async function(...args) {
          const start = performance.now();
          const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || 'unknown';
          const method = (args[1] && args[1].method) || 'GET';
          try {
            const res = await _origFetch.apply(window, args);
            const durationMs = Math.round(performance.now() - start);
            window.parent.postMessage({
              type: 'BROWSER_STUDIO_NETWORK',
              request: {
                id: 'req-' + Date.now() + Math.random().toString(36).substring(2,5),
                method: method,
                url: url,
                status: res.status,
                statusText: res.statusText,
                durationMs: durationMs,
                timestamp: new Date().toLocaleTimeString()
              }
            }, '*');
            return res;
          } catch(err) {
            const durationMs = Math.round(performance.now() - start);
            window.parent.postMessage({
              type: 'BROWSER_STUDIO_NETWORK',
              request: {
                id: 'req-' + Date.now() + Math.random().toString(36).substring(2,5),
                method: method,
                url: url,
                status: 0,
                statusText: 'Failed',
                durationMs: durationMs,
                timestamp: new Date().toLocaleTimeString()
              }
            }, '*');
            throw err;
          }
        };
      })();
    </script>
  `;

  let processed = indexHtml;
  if (styleCss) {
    if (processed.includes('</head>')) {
      processed = processed.replace('</head>', `<style>${styleCss}</style></head>`);
    } else {
      processed = `<style>${styleCss}</style>` + processed;
    }
  }

  if (processed.includes('<head>')) {
    processed = processed.replace('<head>', `<head>${interceptor}`);
  } else {
    processed = `${interceptor}${processed}`;
  }

  if (appJs) {
    if (processed.includes('</body>')) {
      processed = processed.replace('</body>', `<script>${appJs}</script></body>`);
    } else {
      processed = processed + `<script>${appJs}</script>`;
    }
  }

  return processed;
}
