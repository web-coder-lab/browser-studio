/**
 * Safety & Content Filtering Guard
 * Enforces Under-18 child safety, blocks NSFW/adult keywords, dating themes, and harmful payload patterns.
 */

const RESTRICTED_PATTERNS = [
  /porn/i,
  /nsfw/i,
  /xxx/i,
  /adult-content/i,
  /escort/i,
  /dating-app-hookup/i,
  /phishing-target/i,
  /malware-injector/i,
  /keylogger-payload/i,
  /credit-card-skimmer/i,
  /ransomware/i,
];

export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  matchedTerm?: string;
}

export function validateProjectSafety(fileName: string, content?: string): SafetyCheckResult {
  // Check filename
  for (const pattern of RESTRICTED_PATTERNS) {
    if (pattern.test(fileName)) {
      return {
        safe: false,
        reason: 'Filename violates child safety and appropriate content guidelines (NSFW/Harmful prohibited).',
        matchedTerm: fileName
      };
    }
  }

  // Check content if available
  if (content) {
    for (const pattern of RESTRICTED_PATTERNS) {
      if (pattern.test(content)) {
        return {
          safe: false,
          reason: 'File content violates child safety & ethics guidelines (Prohibited adult / malicious keywords).',
          matchedTerm: pattern.source
        };
      }
    }
  }

  return { safe: true };
}

export function getSafeDefaultWorkspaceName(): string {
  return `workspace-project-${Date.now().toString(36)}`;
}
