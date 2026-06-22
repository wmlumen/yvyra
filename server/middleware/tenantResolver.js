const prisma = require('../lib/prisma');

// Dominio base permitido (configurable vía entorno)
const ALLOWED_BASE_DOMAINS = (process.env.ALLOWED_DOMAINS || 'localhost,enlacehub.example,enlacehub.com').split(',').map(d => d.trim().toLowerCase());

// Patrón para subdominio válido: solo letras, números y guiones
const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

// Palabras reservadas que no pueden ser subdominios
const RESERVED_NAMES = new Set([
  'www', 'api', 'admin', 'app', 'mail', 'email', 'ftp', 'cdn', 'static',
  'status', 'billing', 'docs', 'blog', 'store', 'shop', 'marketplace',
  'root', 'system', 'security', 'dashboard', 'login', 'register', 'auth',
  'support', 'help', 'web', 'mail', 'smtp', 'pop3', 'imap', 'dns',
  'ns1', 'ns2', 'mx', 'server', 'db', 'database', 'redis', 'cdn',
  'assets', 'files', 'upload', 'download', 'media', 'img', 'css', 'js',
  'test', 'dev', 'stage', 'prod', 'production', 'staging', 'develop'
]);

/**
 * Valida que un hostname sea seguro y devuelve el subdominio si aplica.
 * Previene host header injection, homógrafos y nombres reservados.
 */
function validateAndExtractSubdomain(hostname) {
  // Rechazar IPs directas
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  
  // Rechazar localhost directo (sin subdominio)
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;

  // Verificar si es un dominio permitido
  for (const base of ALLOWED_BASE_DOMAINS) {
    if (hostname === base) return null; // Dominio raíz, no subdominio
    
    if (hostname.endsWith(`.${base}`)) {
      const subdomain = hostname.slice(0, -(base.length + 1));
      
      // Validar formato del subdominio
      if (!SUBDOMAIN_PATTERN.test(subdomain)) return null;
      
      // Rechazar palabras reservadas
      if (RESERVED_NAMES.has(subdomain)) return null;
      
      // Rechazar subdominios xn-- (homógrafos IDN)
      if (subdomain.startsWith('xn--')) return null;
      
      return subdomain;
    }
  }

  return null;
}

function normalizeExplicitTenant(value) {
  const candidate = String(value ?? '').trim().toLowerCase();
  if (!candidate) return null;
  if (!SUBDOMAIN_PATTERN.test(candidate)) return null;
  if (RESERVED_NAMES.has(candidate)) return null;
  if (candidate.startsWith('xn--')) return null;
  return candidate;
}

/**
 * Middleware que intercepta el header 'Host', normaliza el dominio
 * y busca en la base de datos a qué Workspace (Tenant) pertenece.
 * Agrega `req.tenantWorkspaceId` para que los controladores sepan qué datos servir.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = async (req, res, next) => {
  try {
    const explicitTenant = normalizeExplicitTenant(
      req.headers['x-tenant-subdomain']
      || req.query?.tenant
      || req.query?.profile
      || req.query?.subdomain
    );

    if (explicitTenant) {
      const mapping = await prisma.domainMapping.findUnique({
        where: { hostname: explicitTenant }
      });

      if (!mapping) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      req.tenantWorkspaceId = mapping.workspaceId;
      req.tenantHostname = explicitTenant;
      return next();
    }

    let host = req.headers.host;
    if (!host) {
      return res.status(400).json({ error: 'Falta el encabezado Host' });
    }

    // Normalizar: remover puerto y a minúsculas
    let hostname = host.split(':')[0].toLowerCase();

    // Ignorar rutas globales que no requieren tenant
    if (req.path.startsWith('/api/auth') || 
        req.path.startsWith('/api/admin') || 
        req.path.startsWith('/api/health') ||
        req.path.startsWith('/api/classifieds/search')) {
      return next();
    }

    // Validar y extraer subdominio
    const subdomain = validateAndExtractSubdomain(hostname);
    if (!subdomain) {
      // Si no hay subdominio, continuar sin tenant (para rutas que no lo requieran)
      req.tenantWorkspaceId = null;
      req.tenantHostname = hostname;
      return next();
    }

    // Buscar el mapeo en base de datos
    const mapping = await prisma.domainMapping.findUnique({
      where: { hostname: subdomain }
    });

    if (!mapping) {
      // No revelar si el subdominio existe o no - respuesta genérica
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Inyectar el ID del espacio de trabajo en la request
    req.tenantWorkspaceId = mapping.workspaceId;
    req.tenantHostname = subdomain;
    
    next();
  } catch (error) {
    console.error('Error resolviendo tenant:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
