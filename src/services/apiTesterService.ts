import { ApiTestRequest } from '../types/ide';

export async function executeApiRequest(req: ApiTestRequest): Promise<ApiTestRequest['response']> {
  const start = performance.now();

  try {
    let targetUrl = req.url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    // Append enabled query params
    const activeParams = req.queryParams.filter((p) => p.enabled && p.key.trim());
    if (activeParams.length > 0) {
      const urlObj = new URL(targetUrl);
      activeParams.forEach((p) => urlObj.searchParams.append(p.key.trim(), p.value.trim()));
      targetUrl = urlObj.toString();
    }

    // Build headers
    const headers: Record<string, string> = {};
    req.headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
      headers[h.key.trim()] = h.value.trim();
    });

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = req.body;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(targetUrl, options);
    const timeMs = Math.round(performance.now() - start);

    // Extract response headers
    const resHeaders: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      resHeaders[key] = val;
    });

    let data: any;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      status: res.status,
      statusText: res.statusText || 'OK',
      timeMs,
      headers: resHeaders,
      data,
    };
  } catch (err: any) {
    const timeMs = Math.round(performance.now() - start);
    return {
      status: 0,
      statusText: 'Network / CORS Error',
      timeMs,
      headers: {},
      data: {
        error: err.message || 'Failed to fetch resource',
        note: 'Note: If the external server blocks CORS, ensure the target server has Access-Control-Allow-Origin: * headers.',
      },
    };
  }
}
