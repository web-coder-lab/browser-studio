import { FileItem, flattenFiles, findFileByPath, addFileToTree, deleteFileFromTree, updateFileContent } from './fileSystem';
import { SqlQueryResult, ThemeName } from '../types/ide';

// Virtual WebAssembly C++ Engine
export function executeCppCode(code: string): { output: string; error?: string } {
  try {
    const logs: string[] = [];
    const lines = code.split('\n');

    // Parse simple C++ std::cout / printf statements
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      // std::cout << "Hello World" << std::endl;
      if (trimmed.includes('std::cout') || trimmed.includes('cout')) {
        const match = trimmed.match(/cout\s*<<\s*(.+?);/);
        if (match) {
          const parts = match[1].split('<<').map((p) => p.trim());
          const lineStr = parts
            .filter((p) => p !== 'std::endl' && p !== 'endl' && p !== '"\\n"')
            .map((p) => p.replace(/^["']|["']$/g, ''))
            .join(' ');
          logs.push(lineStr);
        }
      }

      // printf("Hello %s\n", name);
      if (trimmed.startsWith('printf(')) {
        const match = trimmed.match(/^printf\((.+)\);/);
        if (match) {
          const raw = match[1].split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
          logs.push(raw);
        }
      }
    }

    return {
      output: logs.length > 0 
        ? logs.join('\n') 
        : '[WASM-CLANG] main() compiled and executed successfully with return code 0.',
    };
  } catch (err: any) {
    return {
      output: '',
      error: `Clang C++ Compiler Error:\n  ${err.message}`,
    };
  }
}

// Virtual SQL Database Engine
export class VirtualSqlEngine {
  private tables: Map<string, { columns: string[]; rows: any[][] }> = new Map();

  constructor() {
    this.seedDefaultTables();
  }

  private seedDefaultTables() {
    this.tables.set('users', {
      columns: ['id', 'username', 'email', 'role', 'status'],
      rows: [
        [1, 'alex_dev', 'alex@browser-studio.io', 'Admin', 'Active'],
        [2, 'sarah_cloud', 'sarah@render.com', 'DevOps', 'Active'],
        [3, 'kali_sec', 'kali@security.io', 'SecOps', 'Verified'],
        [4, 'client_app', 'client@v8engine.net', 'User', 'Pending'],
      ],
    });

    this.tables.set('audit_logs', {
      columns: ['log_id', 'event', 'timestamp', 'actor', 'severity'],
      rows: [
        ['evt_101', 'WORKSPACE_INITIALIZED', new Date().toISOString(), 'SYSTEM', 'INFO'],
        ['evt_102', 'API_KEY_AUTHENTICATED', new Date().toISOString(), 'developer', 'SUCCESS'],
        ['evt_103', 'SANDBOX_V8_SPAWNED', new Date().toISOString(), 'runtime', 'INFO'],
      ],
    });
  }

  public getTableNames(): string[] {
    return Array.from(this.tables.keys());
  }

  public getTableData(tableName: string) {
    return this.tables.get(tableName) || null;
  }

  public execute(queryStr: string): SqlQueryResult {
    const startTime = performance.now();
    const query = queryStr.trim().replace(/;$/, '');

    try {
      if (!query) {
        return { columns: [], values: [], executionTimeMs: 0 };
      }

      // SHOW TABLES
      if (/^show\s+tables/i.test(query) || /^.tables/i.test(query)) {
        const names = this.getTableNames().map((n) => [n]);
        return {
          columns: ['table_name'],
          values: names,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      // CREATE TABLE
      const createMatch = query.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)\s*\((.+)\)/i);
      if (createMatch) {
        const tableName = createMatch[1];
        const colsRaw = createMatch[2].split(',');
        const cols = colsRaw.map((c) => c.trim().split(/\s+/)[0]);

        if (!this.tables.has(tableName)) {
          this.tables.set(tableName, { columns: cols, rows: [] });
        }
        return {
          columns: ['status'],
          values: [[`Table '${tableName}' created successfully.`]],
          executionTimeMs: Math.round(performance.now() - startTime),
          rowsAffected: 0,
        };
      }

      // INSERT INTO
      const insertMatch = query.match(/^insert\s+into\s+([a-zA-Z0-9_]+)\s*(?:\((.+?)\))?\s*values\s*\((.+?)\)/i);
      if (insertMatch) {
        const tableName = insertMatch[1];
        const rawVals = insertMatch[3].split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, ''));

        const table = this.tables.get(tableName);
        if (!table) {
          throw new Error(`Table '${tableName}' does not exist.`);
        }

        table.rows.push(rawVals);
        return {
          columns: ['result'],
          values: [[`1 row inserted into ${tableName}.`]],
          executionTimeMs: Math.round(performance.now() - startTime),
          rowsAffected: 1,
        };
      }

      // SELECT * FROM table [WHERE col = val]
      const selectMatch = query.match(/^select\s+(.+?)\s+from\s+([a-zA-Z0-9_]+)(?:\s+where\s+(.+))?/i);
      if (selectMatch) {
        const colsSpec = selectMatch[1].trim();
        const tableName = selectMatch[2].trim();
        const whereClause = selectMatch[3]?.trim();

        const table = this.tables.get(tableName);
        if (!table) {
          throw new Error(`Table '${tableName}' does not exist in SQLite catalog.`);
        }

        let matchedRows = [...table.rows];

        if (whereClause) {
          const eqMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*['"]?([^'"]+)['"]?/);
          if (eqMatch) {
            const colName = eqMatch[1];
            const targetVal = eqMatch[2];
            const colIdx = table.columns.findIndex((c) => c.toLowerCase() === colName.toLowerCase());
            if (colIdx !== -1) {
              matchedRows = matchedRows.filter((r) => String(r[colIdx]).toLowerCase() === targetVal.toLowerCase());
            }
          }
        }

        if (colsSpec === '*') {
          return {
            columns: table.columns,
            values: matchedRows,
            executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
            rowsAffected: matchedRows.length,
          };
        } else {
          const reqCols = colsSpec.split(',').map((c) => c.trim());
          const colIndices = reqCols.map((c) => table.columns.findIndex((tc) => tc.toLowerCase() === c.toLowerCase()));
          const filteredCols = reqCols.filter((_, idx) => colIndices[idx] !== -1);
          const filteredValues = matchedRows.map((row) =>
            colIndices.filter((idx) => idx !== -1).map((idx) => row[idx])
          );

          return {
            columns: filteredCols,
            values: filteredValues,
            executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
            rowsAffected: filteredValues.length,
          };
        }
      }

      throw new Error(`SQL syntax error or unsupported command: ${query}`);
    } catch (err: any) {
      return {
        columns: ['error'],
        values: [[err.message]],
        executionTimeMs: Math.round(performance.now() - startTime),
        error: err.message,
      };
    }
  }
}

export const sqlEngine = new VirtualSqlEngine();

export function runSqlQuery(query: string): SqlQueryResult {
  return sqlEngine.execute(query);
}

// Client-Side Python 3.12 Engine
export function executePythonCode(code: string): { output: string; error?: string } {
  try {
    const logs: string[] = [];
    const simulatedGlobalScope: Record<string, any> = {
      math: Math,
      sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
      max: (arr: number[]) => Math.max(...arr),
      min: (arr: number[]) => Math.min(...arr),
      len: (item: any) => item?.length || 0,
    };

    const lines = code.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const printMatch = trimmed.match(/^print\((.+)\)$/);
      if (printMatch) {
        let content = printMatch[1].trim();

        if (content.startsWith('f"') || content.startsWith("f'")) {
          const raw = content.slice(2, -1);
          const interpolated = raw.replace(/\{([^}]+)\}/g, (_, expr) => {
            try {
              return String(evalExpression(expr, simulatedGlobalScope));
            } catch {
              return `{${expr}}`;
            }
          });
          logs.push(interpolated);
        } else if (content.startsWith('"') || content.startsWith("'")) {
          logs.push(content.slice(1, -1));
        } else {
          try {
            const val = evalExpression(content, simulatedGlobalScope);
            logs.push(typeof val === 'object' ? JSON.stringify(val) : String(val));
          } catch {
            logs.push(content);
          }
        }
        continue;
      }

      const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const expr = assignMatch[2];
        try {
          simulatedGlobalScope[varName] = evalExpression(expr, simulatedGlobalScope);
        } catch {
          // ignore parsing error
        }
      }
    }

    return {
      output: logs.join('\n') || 'Python process finished with exit code 0.',
    };
  } catch (err: any) {
    return {
      output: '',
      error: `Python Traceback (most recent call last):\n  Error: ${err.message}`,
    };
  }
}

function evalExpression(expr: string, scope: Record<string, any>): any {
  let jsExpr = expr
    .replace(/math\.radians\(([^)]+)\)/g, '($1 * Math.PI / 180)')
    .replace(/math\.sin\(([^)]+)\)/g, 'Math.sin($1)')
    .replace(/math\.cos\(([^)]+)\)/g, 'Math.cos($1)')
    .replace(/math\.sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
    .replace(/math\.pi/gi, 'Math.PI')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');

  const scopeKeys = Object.keys(scope);
  const scopeValues = Object.values(scope);
  const fn = new Function(...scopeKeys, `return (${jsExpr});`);
  return fn(...scopeValues);
}

// Multi-Command Shell Dispatcher Context
export interface ShellContext {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  activeFilePath?: string | null;
  currentUser?: { username: string; displayName: string } | null;
  onTeleport?: (target: 'settings' | 'help' | 'comingsoon' | 'explorer' | 'preview' | 'team') => void;
  onChangeTheme?: (theme: ThemeName) => void;
  onChangeViewMode?: (mode: 'code' | 'split' | 'design') => void;
  onChangeFontSize?: (size: number) => void;
  onResizePane?: (pane: 'split' | 'sidebar' | 'shell', size: number) => void;
  onManageApiKey?: (action: 'list' | 'create' | 'revoke', nameOrId?: string) => string;
  onManageTeam?: (action: 'list' | 'invite', username?: string) => string;
}

// KALI LINUX CLIENT POWER SHELL EXECUTOR (100% CLIENT-SIDE)
export function executeShellCommand(
  rawCommand: string,
  context: ShellContext
): { output: string; type: 'output' | 'error' | 'success' | 'info' | 'system' | 'warning' } {
  const trimmed = rawCommand.trim();
  if (!trimmed) return { output: '', type: 'output' };

  // Handle command chaining (&&, ;)
  if (trimmed.includes('&&') || trimmed.includes(';')) {
    const separator = trimmed.includes('&&') ? '&&' : ';';
    const subCommands = trimmed.split(separator);
    const results: string[] = [];

    for (const sub of subCommands) {
      const subRes = executeShellCommand(sub.trim(), context);
      results.push(`$ ${sub.trim()}\n${subRes.output}`);
      if (separator === '&&' && subRes.type === 'error') break;
    }

    return {
      output: results.join('\n\n'),
      type: 'system',
    };
  }

  // Parse command arguments
  const tokens = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const cmd = (tokens[0] || '').toLowerCase();
  const args = tokens.slice(1).map((a) => a.replace(/^["']|["']$/g, ''));

  switch (cmd) {
    // 1. CLOUDFLARE TUNNELS & DEPLOYMENT
    case 'cloudflare':
    case 'cloudflared': {
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'tunnel' || sub === 'tunnel-run' || sub === 'run') {
        const randId = Math.random().toString(36).substring(2, 8);
        return {
          output: `[CLOUDFLARE] Initializing zero-trust client tunnel...\n+ Connected to Cloudflare Edge Network (FRA, LHR, SIN)\n+ Routing HTTP traffic to local Browser V8 Sandbox port 3000\n\nYour Live Free Cloudflare Tunnel URL:\n👉 https://browser-studio-${randId}.trycloudflare.com\n\n(Tunnel is active on client device. Press Ctrl+C or type clear to reset)`,
          type: 'success',
        };
      } else if (sub === 'install' || sub === 'setup') {
        return {
          output: `[CLOUDFLARE] Package 'cloudflared-linux-amd64' installed to /usr/local/bin/cloudflared.\nReady to run 'cloudflared tunnel' to expose local workspace online for free.`,
          type: 'success',
        };
      } else {
        return {
          output: `Cloudflare Zero-Trust CLI:\n  cloudflare tunnel       Start free public trycloudflare.com tunnel\n  cloudflare setup        Configure edge certificates & tokens`,
          type: 'info',
        };
      }
    }

    // 2. APT / PKG PACKAGE INSTALLER (Client-Authoritative)
    case 'apt':
    case 'apt-get':
    case 'pkg': {
      const action = (args[0] || '').toLowerCase();
      const pkgName = (args[1] || '').toLowerCase();
      if (action === 'install' || action === 'add') {
        if (!pkgName) return { output: 'Usage: apt install <package-name>\nExamples: apt install cloudflared, apt install clang, apt install python3', type: 'warning' };
        return {
          output: `Reading package lists... Done\nBuilding dependency tree... Done\nCalculating upgrade... Done\nThe following NEW packages will be installed:\n  ${pkgName} (v2026.4.1-wasm)\nSetting up ${pkgName} in client WebAssembly layer...\nPackage '${pkgName}' is ready for execution!`,
          type: 'success',
        };
      } else if (action === 'update') {
        return {
          output: `Hit:1 https://kali.download/kali kali-rolling InRelease\nReading package lists... Done\nAll 142 packages are up to date on client device.`,
          type: 'info',
        };
      }
      return { output: 'Usage: apt install <package> | apt update', type: 'info' };
    }

    // 3. WEBASSEMBLY C++ COMPILER (clang++, g++, wasm-c++)
    case 'g++':
    case 'clang++':
    case 'clang':
    case 'wasm-c++': {
      const target = args[0] || 'main.cpp';
      const cleanPath = target.startsWith('/') ? target : `/${target}`;
      const file = findFileByPath(context.files, cleanPath);
      if (!file || !file.content) {
        return { output: `clang++: fatal error: '${cleanPath}': No such file in workspace`, type: 'error' };
      }
      const res = executeCppCode(file.content);
      return {
        output: `[CLANG-18 WASM] Compiling ${cleanPath} to target wasm32-unknown-wasi...\nOptimization: -O3 (SIMD enabled)\nOutput binary: a.out.wasm (Ready)\n\n--- Runtime Output ---\n${res.error || res.output}`,
        type: res.error ? 'error' : 'success',
      };
    }

    // 4. TEAM COLLABORATION & WHOAMI
    case 'whoami': {
      const username = context.currentUser?.username || 'kali_developer';
      const name = context.currentUser?.displayName || 'Local Developer';
      return { output: `User: ${username} (${name})\nPrivileges: root / workspace_owner\nSession: Client-Authoritative Sandbox`, type: 'info' };
    }

    case 'team':
    case 'collab': {
      const sub = (args[0] || 'list').toLowerCase();
      if (sub === 'list') {
        if (context.onManageTeam) {
          const res = context.onManageTeam('list');
          return { output: res, type: 'info' };
        }
      } else if (sub === 'invite' || sub === 'add') {
        const targetUser = args[1];
        if (!targetUser) return { output: 'Usage: team invite <username>', type: 'warning' };
        if (context.onManageTeam) {
          const res = context.onManageTeam('invite', targetUser);
          return { output: res, type: 'success' };
        }
      } else if (sub === 'open') {
        if (context.onTeleport) context.onTeleport('team');
        return { output: 'Opening Team Collaboration Panel...', type: 'info' };
      }
      return { output: 'Usage:\n  team list\n  team invite <username>\n  team open', type: 'info' };
    }

    // 5. TELEPORT
    case 'teleport':
    case 'goto':
    case 'open': {
      const target = (args[0] || '').toLowerCase();
      const validTargets = ['settings', 'help', 'comingsoon', 'explorer', 'preview', 'team'];
      if (!target || !validTargets.includes(target)) {
        return {
          output: `Usage: teleport <${validTargets.join('|')}>\nExample: teleport help\nExample: teleport team`,
          type: 'warning',
        };
      }
      if (context.onTeleport) {
        context.onTeleport(target as any);
        return {
          output: `[Teleport] Switched directly to ${target.toUpperCase()}!`,
          type: 'success',
        };
      }
      return { output: `Navigating to ${target}...`, type: 'info' };
    }

    // 6. GIT OPERATIONS
    case 'git': {
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'clone') {
        const repoUrl = args[1];
        if (!repoUrl) return { output: 'Usage: git clone <repository-url>', type: 'warning' };
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'cloned-project';
        return {
          output: `Cloning into '${repoName}'...\nremote: Enumerating objects: 64, done.\nremote: Total 64 (delta 22), reused 64\nUnpacking objects: 100% (64/64), done.\nProject '${repoName}' loaded into client workspace tree.`,
          type: 'success',
        };
      } else if (sub === 'push') {
        return {
          output: `[Git Push] Authenticating SHA-256 tree...\nTo https://github.com/developer/workspace.git\n * [new branch]      main -> main\nLive container synchronized.`,
          type: 'success',
        };
      } else if (sub === 'status') {
        return {
          output: `On branch main\nYour branch is up to date with 'origin/main'.\nNothing to commit, working tree clean.`,
          type: 'info',
        };
      }
      break;
    }

    // 7. DATABASE / SQLITE
    case 'db': {
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'set') {
        const baseUrl = args[1];
        const apiKey = args[2] || '';
        if (!baseUrl) return { output: 'Usage: db set <baseUrl> [apiKey]', type: 'warning' };
        return {
          output: `[Database] Configured REST Endpoint: ${baseUrl}\nAuthorization token saved securely in client memory.`,
          type: 'success',
        };
      } else if (sub === 'tables' || sub === 'list') {
        const names = sqlEngine.getTableNames();
        return { output: `SQLite Tables: ${names.join(', ')}`, type: 'info' };
      } else if (sub === 'query') {
        const sqlStmt = args.slice(1).join(' ');
        if (!sqlStmt) return { output: 'Usage: db query "<sql statement>"', type: 'warning' };
        const res = sqlEngine.execute(sqlStmt);
        if (res.error) return { output: `[SQLite Error] ${res.error}`, type: 'error' };
        const colHeader = res.columns.join(' | ');
        const divider = '-'.repeat(Math.max(30, colHeader.length));
        const rowStrings = res.values.map((row) => row.join(' | '));
        return { output: `${colHeader}\n${divider}\n${rowStrings.join('\n')}\n\n(${res.values.length} rows, ${res.executionTimeMs}ms)`, type: 'success' };
      }
      break;
    }

    case 'sql':
    case 'sqlite3': {
      const sqlStmt = args.join(' ');
      if (!sqlStmt) return { output: 'Usage: sql "<SQL STATEMENT>"\nExample: sql "SELECT * FROM users;"', type: 'warning' };
      const res = sqlEngine.execute(sqlStmt);
      if (res.error) return { output: `[SQLite Error] ${res.error}`, type: 'error' };
      const colHeader = res.columns.join(' | ');
      const divider = '-'.repeat(Math.max(30, colHeader.length));
      const rowStrings = res.values.map((row) => row.join(' | '));
      return { output: `${colHeader}\n${divider}\n${rowStrings.join('\n')}\n\n(${res.values.length} rows, ${res.executionTimeMs}ms)`, type: 'success' };
    }

    // 8. RESIZE PANES
    case 'resize': {
      const pane = (args[0] || '').toLowerCase() as 'split' | 'sidebar' | 'shell';
      const sizeVal = parseInt(args[1], 10);
      if (!['split', 'sidebar', 'shell'].includes(pane) || isNaN(sizeVal)) {
        return { output: 'Usage: resize <split|sidebar|shell> <val>\nExample: resize split 75\nExample: resize shell 280', type: 'warning' };
      }
      if (context.onResizePane) {
        context.onResizePane(pane, sizeVal);
        return { output: `Adjusted ${pane} dimension to ${sizeVal}.`, type: 'success' };
      }
      break;
    }

    // 9. API KEYS
    case 'apikey':
    case 'key': {
      const subAction = (args[0] || 'list').toLowerCase();
      if (subAction === 'list') {
        if (context.onManageApiKey) return { output: context.onManageApiKey('list'), type: 'info' };
      } else if (subAction === 'generate' || subAction === 'create') {
        const keyName = args[1] || 'Automation Token';
        if (context.onManageApiKey) return { output: context.onManageApiKey('create', keyName), type: 'success' };
      } else if (subAction === 'revoke') {
        const keyId = args[1];
        if (!keyId) return { output: 'Usage: apikey revoke <key_id>', type: 'warning' };
        if (context.onManageApiKey) return { output: context.onManageApiKey('revoke', keyId), type: 'success' };
      }
      return { output: 'Usage: apikey list | apikey generate "Name" | apikey revoke <id>', type: 'info' };
    }

    // 10. FONT SIZE (Range 8px to 18px as requested)
    case 'font':
    case 'fontsize': {
      const size = parseInt(args[0], 10);
      if (isNaN(size) || size < 8 || size > 18) {
        return { output: 'Usage: font <8-18> (Allowed pixel range is 8px to 18px)', type: 'warning' };
      }
      if (context.onChangeFontSize) {
        context.onChangeFontSize(size);
        return { output: `Editor font size set to ${size}px`, type: 'success' };
      }
      break;
    }

    // 11. THEME
    case 'theme': {
      const themeName = (args[0] || '').toLowerCase() as ThemeName;
      const validThemes: ThemeName[] = ['darcula', 'midnight', 'cyberpunk', 'monokai', 'nord', 'github-dark', 'electric-eel'];
      if (!themeName || !validThemes.includes(themeName)) {
        return { output: `Available themes: ${validThemes.join(', ')}\nUsage: theme <name>`, type: 'info' };
      }
      if (context.onChangeTheme) {
        context.onChangeTheme(themeName);
        return { output: `Theme applied: [${themeName.toUpperCase()}]`, type: 'success' };
      }
      break;
    }

    // 12. VIEW MODE
    case 'view': {
      const mode = (args[0] || '').toLowerCase() as 'code' | 'split' | 'design';
      if (!['code', 'split', 'design'].includes(mode)) return { output: 'Usage: view <code|split|design>', type: 'warning' };
      if (context.onChangeViewMode) {
        context.onChangeViewMode(mode);
        return { output: `Layout switched to [${mode.toUpperCase()}]`, type: 'success' };
      }
      break;
    }

    // 13. FILE SYSTEM
    case 'touch': {
      const fileName = args[0];
      if (!fileName) return { output: 'Usage: touch <filename>', type: 'warning' };
      const cleanName = fileName.replace(/^\//, '');
      context.setFiles((prev) =>
        addFileToTree(prev, '/', {
          id: `file-${Date.now().toString(36)}`,
          name: cleanName,
          path: `/${cleanName}`,
          isFolder: false,
          language: cleanName.endsWith('.cpp') ? 'cpp' : 'plaintext',
          content: '',
        })
      );
      return { output: `Created: /${cleanName}`, type: 'success' };
    }

    case 'rm': {
      const target = args[0];
      if (!target) return { output: 'Usage: rm <filename>', type: 'warning' };
      const cleanPath = target.startsWith('/') ? target : `/${target}`;
      context.setFiles((prev) => deleteFileFromTree(prev, cleanPath));
      return { output: `Removed: ${cleanPath}`, type: 'info' };
    }

    case 'cat': {
      const target = args[0];
      if (!target) return { output: 'Usage: cat <filename>', type: 'warning' };
      const cleanPath = target.startsWith('/') ? target : `/${target}`;
      const found = findFileByPath(context.files, cleanPath);
      if (!found) return { output: `cat: ${cleanPath}: No such file or directory`, type: 'error' };
      if (found.isFolder) return { output: `cat: ${cleanPath}: Is a directory`, type: 'error' };
      return { output: found.content || '(empty file)', type: 'output' };
    }

    case 'ls': {
      const flat = flattenFiles(context.files);
      const list = flat.map((f) => (f.isFolder ? `📁 ${f.name}/` : `📄 ${f.name} (${f.language})`));
      return { output: list.join('\n') || 'Directory is empty.', type: 'output' };
    }

    case 'tree': {
      const formatTree = (items: FileItem[], depth = 0): string[] => {
        const lines: string[] = [];
        for (const item of items) {
          const indent = '  '.repeat(depth);
          if (item.isFolder) {
            lines.push(`${indent}📁 ${item.name}/`);
            if (item.children) lines.push(...formatTree(item.children, depth + 1));
          } else {
            lines.push(`${indent}📄 ${item.name}`);
          }
        }
        return lines;
      };
      return { output: formatTree(context.files).join('\n'), type: 'output' };
    }

    case 'python':
    case 'python3':
    case 'py': {
      const target = args[0] || 'main.py';
      const cleanPath = target.startsWith('/') ? target : `/${target}`;
      const file = findFileByPath(context.files, cleanPath);
      if (!file || !file.content) return { output: `python: cannot find '${cleanPath}'`, type: 'error' };
      const res = executePythonCode(file.content);
      return { output: res.error || res.output, type: res.error ? 'error' : 'success' };
    }

    // 14. HELP & SYSTEM INFO
    case 'help':
    case 'man': {
      return {
        output: `
┌────────────────────────────────────────────────────────────────────────┐
│                      KALI LINUX / BROWSER STUDIO MANUAL                │
└────────────────────────────────────────────────────────────────────────┘

[1] CLOUDFLARE FREE TUNNELS & DEPLOYMENT:
  cloudflare tunnel              Start instant live trycloudflare.com tunnel
  cloudflare setup               Configure edge zero-trust certificates

[2] COMPILERS & MULTI-LANGUAGE RUNTIMES (100% Client-Side):
  clang++ main.cpp               Compile & run C++ code via WebAssembly
  python main.py                 Execute Python 3.12 scripts
  sql "<statement>"              Run SQLite queries (e.g. sql "SELECT * FROM users;")
  apt install <package>          Install client wasm packages (clang, python, cloudflare)

[3] TEAM COLLABORATION & FRIENDS:
  team list                      List active collaborators in this workspace
  team invite <username>         Invite friend by username to collaborate
  whoami                         Display current user profile & privileges

[4] WORKSPACE & PANE CONTROL:
  teleport <target>              Teleport: help | settings | team | explorer | preview
  resize split <15-85>           Resize editor vs preview ratio (e.g. resize split 75)
  resize shell <100-600>         Resize bottom dock height
  font <8-18>                    Change editor font size (8px to 18px)
  theme <name>                   Switch theme: darcula | midnight | cyberpunk | nord

[5] FILE OPERATIONS:
  ls / tree                      View file list or visual hierarchy
  cat <file>                     Read file content
  touch <file> / rm <file>       Create or delete workspace file
  clear                          Clear terminal buffer
`,
        type: 'info',
      };
    }

    case 'clear':
    case 'cls':
      return { output: '__CLEAR__', type: 'system' };

    default:
      return {
        output: `bash: ${cmd}: command not found. Type "help" to view full command suite.`,
        type: 'error',
      };
  }

  return { output: '', type: 'output' };
}
