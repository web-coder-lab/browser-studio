import { DomainConfig } from '../types/ide';

export async function verifyCustomDomainDns(domain: string): Promise<DomainConfig> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!cleanDomain) {
    throw new Error('Please enter a valid domain name (e.g. app.myproject.com).');
  }
  return {
    domain: cleanDomain,
    status: 'idle',
    cnameTarget: 'not-connected',
    txtToken: 'not-connected',
    isSslValid: false,
    dnsRecords: [],
    sslInfo: {
      issuer: 'Not connected',
      validUntil: 'n/a',
      protocol: 'This app does not attach custom domains.',
    },
  };
}
