export type FileLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'jsx'
  | 'tsx'
  | 'html' 
  | 'css' 
  | 'scss' 
  | 'json' 
  | 'python' 
  | 'sql' 
  | 'cpp'
  | 'markdown' 
  | 'shell'
  | 'plaintext';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  content?: string;
  language: FileLanguage;
  children?: FileItem[];
  isOpen?: boolean;
}

export interface TabItem {
  id: string;
  path: string;
  name: string;
  language: FileLanguage;
  isDirty?: boolean;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system' | 'warning';
  text: string;
  timestamp: string;
}

export interface ConsoleMessage {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: string[];
  timestamp: string;
  tag?: string;
}

export interface NetworkRequestItem {
  id: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  durationMs: number;
  timestamp: string;
  requestHeaders?: Record<string, string>;
  responseType?: string;
}

export interface StructureSymbol {
  id: string;
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface' | 'tag' | 'query';
  line: number;
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
  avatarColor?: string;
}

export interface CollaboratorMember {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  status: 'online' | 'editing' | 'idle';
  activeFile?: string;
  avatarColor: string;
  joinedAt: string;
}

export interface WorkspaceApiKey {
  keyId: string;
  apiKey: string;
  name: string;
  createdAt: string;
  permissions: ('read' | 'write' | 'execute' | 'deploy')[];
  rateLimitPerMinute: number;
  lastUsed?: string;
}

export interface DatabaseApiConfig {
  baseUrl: string;
  apiKey: string;
  isConnected: boolean;
  pingMs?: number;
  lastChecked?: string;
  tables: string[];
  activeTable?: string;
  tableData?: { columns: string[]; rows: Record<string, any>[] };
}

export interface DomainConfig {
  domain: string;
  status: 'idle' | 'checking' | 'verified' | 'failed';
  cnameTarget: string;
  txtToken: string;
  isSslValid: boolean;
  dnsRecords: { type: string; name: string; value: string; verified: boolean }[];
  sslInfo?: { issuer: string; validUntil: string; protocol: string };
}

export interface ApiTestRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  queryParams: { key: string; value: string; enabled: boolean }[];
  body: string;
  response?: {
    status: number;
    statusText: string;
    timeMs: number;
    headers: Record<string, string>;
    data: any;
  };
  isLoading?: boolean;
}

export type ThemeName = 
  | 'darcula'
  | 'midnight' 
  | 'cyberpunk' 
  | 'monokai'
  | 'nord'
  | 'github-dark'
  | 'electric-eel';

export interface EditorSettings {
  theme: ThemeName;
  fontFamily: 'Fira Code' | 'JetBrains Mono' | 'monospace';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoPreview: boolean;
  editorViewMode: 'split' | 'code' | 'design';
  terminalPrompt: string;
  silentMode: boolean;
  apiKeys: WorkspaceApiKey[];
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
  executionTimeMs: number;
  rowsAffected?: number;
  error?: string;
}

export interface LockedFeature {
  id: string;
  name: string;
  urduTitle?: string;
  title?: string;
  category: 'compiler' | 'mobile_sdk' | 'desktop' | 'ai_builder';
  description: string;
  technicalRequirement: string;
  whyLocked: string;
  roadmapStatus: 'In R&D' | 'Planned' | 'Native Only' | 'Locked';
  icon?: string;
}
