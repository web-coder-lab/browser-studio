import { DomainConfig } from '../types/ide';

export const STUDIO_HOST = 'browser-studio.onrender.com';

async function dnsLookup(name: string, type: 'CNAME' | 'A') {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { accept: 'application/dns-json' } }
  );
  if (!res.ok) return [] as string[];
  const data = await res.json();
  return (data.Answer || []).map((row: { data?: string }) =>
    String(row.data || '').replace(/\.$/, '').toLowerCase()
  );
}

export async function verifyCustomDomainDns(domain: string): Promise<DomainConfig> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!cleanDomain || !cleanDomain.includes('.')) {
    throw new Error('Enter a domain like studio.yourname.com');
  }

  const cnameRecords = await dnsLookup(cleanDomain, 'CNAME');
  const aRecords = await dnsLookup(cleanDomain, 'A');
  const pointsToStudio = cnameRecords.some((v) => v === STUDIO_HOST);

  return {
    domain: cleanDomain,
    status: pointsToStudio ? 'verified' : 'failed',
    cnameTarget: STUDIO_HOST,
    txtToken: 'not-used',
    isSslValid: pointsToStudio,
    dnsRecords: [
      {
        type: 'CNAME',
        name: cleanDomain,
        value: cnameRecords[0] || '(none)',
        verified: pointsToStudio,
      },
      {
        type: 'A',
        name: cleanDomain,
        value: aRecords[0] || '(none)',
        verified: false,
      },
    ],
    sslInfo: {
      issuer: pointsToStudio ? 'Render issues HTTPS after you add the name in Custom Domains' : 'Not issued yet',
      validUntil: 'after Render custom-domain add',
      protocol: pointsToStudio
        ? `CNAME matches ${STUDIO_HOST}. Add the same hostname in Render → Custom Domains.`
        : `Create a CNAME from ${cleanDomain} to ${STUDIO_HOST}, wait for DNS, then add it in Render.`,
    },
  };
}
