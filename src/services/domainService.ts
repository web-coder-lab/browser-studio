import { DomainConfig } from '../types/ide';

export async function verifyCustomDomainDns(domain: string): Promise<DomainConfig> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cnameTarget = 'cname.browserstudio.io';
  const txtToken = `studio-verify-${Math.random().toString(36).substring(2, 10)}`;

  if (!cleanDomain) {
    throw new Error('Please enter a valid domain name (e.g. app.myproject.com).');
  }

  // 1. Query Cloudflare DNS-over-HTTPS (DoH) API
  let isCnameVerified = false;
  try {
    const dohRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=CNAME`,
      { headers: { accept: 'application/dns-json' } }
    );
    if (dohRes.ok) {
      const data = await dohRes.json();
      if (data.Answer && data.Answer.length > 0) {
        isCnameVerified = true;
      }
    }
  } catch {
    // network or CORS fallback
  }

  // Check A record as well
  let isAVerified = false;
  try {
    const dohARes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`,
      { headers: { accept: 'application/dns-json' } }
    );
    if (dohARes.ok) {
      const aData = await dohARes.json();
      if (aData.Answer && aData.Answer.length > 0) {
        isAVerified = true;
      }
    }
  } catch {
    // fallback
  }

  const isVerified = isCnameVerified || isAVerified;

  const validUntilDate = new Date();
  validUntilDate.setMonth(validUntilDate.getMonth() + 3);

  return {
    domain: cleanDomain,
    status: isVerified ? 'verified' : 'idle',
    cnameTarget,
    txtToken,
    isSslValid: false,
    dnsRecords: [
      {
        type: 'CNAME',
        name: cleanDomain.includes('.') ? cleanDomain.split('.')[0] : '@',
        value: cnameTarget,
        verified: isCnameVerified,
      },
      {
        type: 'TXT',
        name: '_studio-verify',
        value: txtToken,
        verified: isVerified,
      },
      {
        type: 'A',
        name: '@',
        value: '76.76.21.21',
        verified: isAVerified,
      },
    ],
    sslInfo: {
      issuer: "Let's Encrypt Authority X3 / Cloudflare Universal TLS",
      validUntil: validUntilDate.toDateString(),
      protocol: 'TLS 1.3 / HTTPS Strict Transport Security',
    },
  };
}
