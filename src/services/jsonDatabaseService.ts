/**
 * Real JSON Database Engine & Ledger Service
 * Provides stateful, zero-trust JSON database storage for users, authentication records,
 * API keys, settings, package catalogs, and security audit logs.
 */

import { UserAccount, WorkspaceApiKey, EditorSettings } from '../types/ide';
import initialDatabaseRaw from '../db/users_database.json';

export const JSON_DB_STORAGE_KEY = 'browser_studio_master_json_database_v3';

export interface UserDatabaseRecord {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  status: 'active' | 'suspended';
  role: 'administrator' | 'developer' | 'security_auditor';
  createdAt: string;
  lastLoginAt: string;
  ipAddress: string;
  sessionTokens: string[];
  settings: {
    theme: string;
    fontSize: number;
    tabSize: number;
    autoSave: boolean;
    wordWrap: boolean;
    minimap: boolean;
    editorViewMode: string;
    terminalPrompt: string;
  };
  apiKeys: {
    keyId: string;
    apiKey: string;
    name: string;
    createdAt: string;
    permissions: string[];
    rateLimitPerMinute: number;
    lastUsedAt?: string;
  }[];
  installedPackages: string[];
  pipPackages: string[];
  workspaceStats: {
    filesCount: number;
    totalExecutions: number;
    diskUsageKb: number;
  };
}

export interface SystemDatabaseSchema {
  schemaVersion: string;
  databaseEngine: string;
  updatedAt: string;
  totalRegisteredUsers: number;
  users: UserDatabaseRecord[];
  auditLogs: {
    id: string;
    timestamp: string;
    event: 'USER_REGISTERED' | 'USER_LOGIN' | 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'SETTINGS_UPDATED' | 'PACKAGE_INSTALLED';
    userId: string;
    details: string;
  }[];
}

// Simple cryptographic hash simulation for client database (Zero-Trust)
export function hashPassword(password: string, salt: string): string {
  let hash = 0;
  const combined = password + salt + '__sec_2026';
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0') + '_hashed';
}

export function getJsonDatabase(): SystemDatabaseSchema {
  try {
    const raw = localStorage.getItem(JSON_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read JSON DB from localStorage, initializing default state.', e);
  }

  const initial = initialDatabaseRaw as unknown as SystemDatabaseSchema;
  saveJsonDatabase(initial);
  return initial;
}

export function saveJsonDatabase(db: SystemDatabaseSchema): void {
  try {
    db.updatedAt = new Date().toISOString();
    db.totalRegisteredUsers = db.users.length;
    localStorage.setItem(JSON_DB_STORAGE_KEY, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to persist JSON database', err);
  }
}

export function logDatabaseAudit(
  event: 'USER_REGISTERED' | 'USER_LOGIN' | 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'SETTINGS_UPDATED' | 'PACKAGE_INSTALLED',
  userId: string,
  details: string
): void {
  const db = getJsonDatabase();
  const newAudit = {
    id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    event,
    userId,
    details,
  };
  db.auditLogs.unshift(newAudit);
  if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);
  saveJsonDatabase(db);
}

// Sync user registration to JSON database
export function registerUserInJsonDatabase(
  email: string,
  username: string,
  displayName: string,
  passwordPlain: string
): { success: boolean; userRecord?: UserDatabaseRecord; error?: string } {
  const db = getJsonDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'Username is already registered in database.' };
  }

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Email address already exists in database records.' };
  }

  const salt = `slt_${Math.random().toString(36).substring(2, 10)}`;
  const passwordHash = hashPassword(passwordPlain, salt);
  const userId = `usr_${cleanUsername}_${Date.now().toString(36)}`;
  const apiKeyRaw = 'bs_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');

  const newRecord: UserDatabaseRecord = {
    userId,
    email: cleanEmail,
    username: cleanUsername,
    displayName: displayName.trim(),
    passwordHash,
    salt,
    status: 'active',
    role: db.users.length === 0 ? 'administrator' : 'developer',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ipAddress: '127.0.0.1',
    sessionTokens: [`sess_${Date.now().toString(36)}`],
    settings: {
      theme: 'darcula',
      fontSize: 13,
      tabSize: 2,
      autoSave: true,
      wordWrap: true,
      minimap: false,
      editorViewMode: 'split',
      terminalPrompt: `${cleanUsername}@browser-studio`,
    },
    apiKeys: [
      {
        keyId: `key_${Date.now().toString(36)}`,
        apiKey: apiKeyRaw,
        name: 'Default Workspace Token',
        createdAt: new Date().toISOString(),
        permissions: ['read', 'write', 'execute', 'deploy'],
        rateLimitPerMinute: 120,
        lastUsedAt: new Date().toISOString(),
      },
    ],
    installedPackages: [],
    pipPackages: ['pip', 'setuptools', 'wheel'],
    workspaceStats: {
      filesCount: 8,
      totalExecutions: 1,
      diskUsageKb: 45,
    },
  };

  db.users.push(newRecord);
  saveJsonDatabase(db);
  logDatabaseAudit('USER_REGISTERED', userId, `New account registered: @${cleanUsername} (${cleanEmail})`);

  return { success: true, userRecord: newRecord };
}

// Sync user login to JSON DB
export function authenticateUserInJsonDatabase(
  identifier: string,
  passwordPlain: string
): { success: boolean; userRecord?: UserDatabaseRecord; error?: string } {
  const db = getJsonDatabase();
  const clean = identifier.trim().toLowerCase();

  const user = db.users.find(
    (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
  );

  if (!user) {
    return { success: false, error: 'User record not found in database.' };
  }

  const expectedHash = hashPassword(passwordPlain, user.salt);
  // Also check legacy or raw matches for backward compatibility
  if (user.passwordHash !== expectedHash && user.passwordHash !== passwordPlain) {
    return { success: false, error: 'Invalid password. Authentication rejected.' };
  }

  user.lastLoginAt = new Date().toISOString();
  saveJsonDatabase(db);
  logDatabaseAudit('USER_LOGIN', user.userId, `User @${user.username} authenticated successfully.`);

  return { success: true, userRecord: user };
}

// Record API key creation in JSON database
export function addApiKeyToJsonDatabase(
  userId: string,
  apiKey: WorkspaceApiKey
): void {
  const db = getJsonDatabase();
  const user = db.users.find((u) => u.userId === userId || u.username === userId);
  if (user) {
    user.apiKeys.push({
      keyId: apiKey.keyId,
      apiKey: apiKey.apiKey,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      permissions: apiKey.permissions,
      rateLimitPerMinute: apiKey.rateLimitPerMinute,
      lastUsedAt: new Date().toISOString(),
    });
    saveJsonDatabase(db);
    logDatabaseAudit('API_KEY_CREATED', user.userId, `Generated API Key: ${apiKey.name} (${apiKey.keyId})`);
  }
}

// Revoke API key in JSON database
export function revokeApiKeyInJsonDatabase(userId: string, keyId: string): void {
  const db = getJsonDatabase();
  const user = db.users.find((u) => u.userId === userId || u.username === userId);
  if (user) {
    user.apiKeys = user.apiKeys.filter((k) => k.keyId !== keyId);
    saveJsonDatabase(db);
    logDatabaseAudit('API_KEY_REVOKED', user.userId, `Revoked API Key with ID: ${keyId}`);
  }
}

// Sync user settings updates in JSON database
export function updateUserSettingsInJsonDatabase(
  userId: string,
  settings: Partial<EditorSettings>
): void {
  const db = getJsonDatabase();
  const user = db.users.find((u) => u.userId === userId || u.username === userId);
  if (user) {
    user.settings = {
      ...user.settings,
      theme: settings.theme || user.settings.theme,
      fontSize: settings.fontSize || user.settings.fontSize,
      tabSize: settings.tabSize || user.settings.tabSize,
      autoSave: settings.autoSave !== undefined ? settings.autoSave : user.settings.autoSave,
      wordWrap: settings.wordWrap !== undefined ? settings.wordWrap : user.settings.wordWrap,
      minimap: settings.minimap !== undefined ? settings.minimap : user.settings.minimap,
      editorViewMode: settings.editorViewMode || user.settings.editorViewMode,
      terminalPrompt: settings.terminalPrompt || user.settings.terminalPrompt,
    };
    saveJsonDatabase(db);
    logDatabaseAudit('SETTINGS_UPDATED', user.userId, `Updated workspace configuration.`);
  }
}

// Export raw JSON string
export function exportDatabaseAsJson(): string {
  const db = getJsonDatabase();
  return JSON.stringify(db, null, 2);
}
