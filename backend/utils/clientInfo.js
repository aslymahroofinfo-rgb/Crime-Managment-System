/**
 * Client Information & Technical Security Metadata Utility
 * Extracts server-observed network and device metadata securely without invasive client fingerprinting.
 */

function normalizeIp(ipStr) {
  if (!ipStr) return '127.0.0.1';
  let clean = String(ipStr).trim();

  // Strip IPv4-mapped IPv6 prefix (e.g. ::ffff:192.0.2.1 -> 192.0.2.1)
  if (clean.startsWith('::ffff:')) {
    clean = clean.substring(7);
  }

  // Normalize localhost IPv6
  if (clean === '::1') {
    clean = '127.0.0.1';
  }

  return clean;
}

function getClientIp(req) {
  // Only trust X-Forwarded-For if explicitly configured via TRUST_PROXY env variable
  // This prevents attackers from spoofing their IP via fake request headers
  const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

  if (trustProxy && req.headers['x-forwarded-for']) {
    const list = String(req.headers['x-forwarded-for']).split(',').map(s => s.trim());
    if (list.length > 0 && list[0]) {
      return normalizeIp(list[0]);
    }
  }

  // Server-observed physical connection address (cannot be spoofed in HTTP headers)
  const rawIp = req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip || '127.0.0.1';
  return normalizeIp(rawIp);
}

function maskIp(ip) {
  if (!ip) return 'Not Available';
  const clean = normalizeIp(ip);

  // IPv4 masking: 192.168.1.10 -> 192.168.***.***
  const parts = clean.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }

  // IPv6 masking: 2001:db8:85a3:: -> 2001:db8:****:****
  const colons = clean.split(':');
  if (colons.length >= 2) {
    return `${colons[0]}:${colons[1]}:****:****`;
  }

  return '***.***.***.***';
}

function parseUserAgent(uaString) {
  if (!uaString || typeof uaString !== 'string') {
    return {
      deviceType: 'Unknown',
      browser: 'Unknown',
      operatingSystem: 'Unknown'
    };
  }

  const ua = uaString;

  // 1. Operating System
  let operatingSystem = 'Unknown';
  if (/windows phone/i.test(ua)) operatingSystem = 'Windows Phone';
  else if (/win(dows|98|nt|95)/i.test(ua)) operatingSystem = 'Windows';
  else if (/android/i.test(ua)) operatingSystem = 'Android';
  else if (/ipad|iphone|ipod/i.test(ua)) operatingSystem = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) operatingSystem = 'macOS';
  else if (/cros/i.test(ua)) operatingSystem = 'Chrome OS';
  else if (/linux/i.test(ua)) operatingSystem = 'Linux';

  // 2. Device Type
  let deviceType = 'Desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobi|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // 3. Browser
  let browser = 'Other';
  if (/edg([ea]|ios)?\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';

  return {
    deviceType,
    browser,
    operatingSystem
  };
}

module.exports = {
  getClientIp,
  normalizeIp,
  maskIp,
  parseUserAgent
};

