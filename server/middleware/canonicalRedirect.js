function parseBaseUrl(rawValue) {
  try {
    return new URL(String(rawValue || '').trim());
  } catch {
    return null;
  }
}

function buildCanonicalRedirectUrl(req, baseUrl) {
  if (!baseUrl) return null;

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const requestProtocol = forwardedProto || (req.secure ? 'https' : 'http');
  const requestHost = String(req.headers.host || '').trim().toLowerCase();
  if (!requestHost) return null;

  const canonicalHost = baseUrl.host.toLowerCase();
  const canonicalHostname = baseUrl.hostname.toLowerCase();
  const requestHostname = requestHost.split(':')[0];
  const search = req.originalUrl.includes('?') ? '' : '';

  if (requestHostname === canonicalHostname || requestHost === canonicalHost) {
    if (requestProtocol !== baseUrl.protocol.replace(':', '')) {
      return `${baseUrl.protocol}//${canonicalHost}${req.originalUrl}`;
    }
    return null;
  }

  const baseHostWithoutWww = canonicalHostname.replace(/^www\./, '');
  const requestHostWithoutWww = requestHostname.replace(/^www\./, '');
  if (requestHostWithoutWww === baseHostWithoutWww) {
    return `${baseUrl.protocol}//${canonicalHost}${req.originalUrl}`;
  }

  if (requestHostname.endsWith(`.${baseHostWithoutWww}`) && requestProtocol !== 'https') {
    return `https://${requestHost}${req.originalUrl}`;
  }

  return null;
}

function canonicalRedirect(req, res, next) {
  if (!['GET', 'HEAD'].includes(req.method)) return next();

  const baseUrl = parseBaseUrl(process.env.BASE_URL || process.env.PUBLIC_APP_URL);
  const target = buildCanonicalRedirectUrl(req, baseUrl);
  if (target) return res.redirect(301, target);

  return next();
}

module.exports = canonicalRedirect;
module.exports.buildCanonicalRedirectUrl = buildCanonicalRedirectUrl;
