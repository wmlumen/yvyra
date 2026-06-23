require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const tenantResolver = require('./middleware/tenantResolver');
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspace');
const blockRoutes = require('./routes/blocks');
const classifiedsRoutes = require('./routes/classifieds');
const adminRoutes = require('./routes/admin');
const shortLinkRoutes = require('./routes/shortLinks');
const analyticsRoutes = require('./routes/analytics');
const whatsappRoutes = require('./routes/whatsapp');
const auditRoutes = require('./routes/audit');
const miniSiteRoutes = require('./routes/miniSite');
const agentRoutes = require('./routes/agent');
const seoRoutes = require('./routes/seo');
const canonicalRedirect = require('./middleware/canonicalRedirect');

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const SSL_ENABLED = process.env.SSL_ENABLED === 'true';
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

// Seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para permitir las demos frontend; habilitar en producción
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(canonicalRedirect);
app.use(seoRoutes);

// En producción, servir archivos estáticos del frontend desde la raíz del proyecto
if (isProduction) {
  const frontendPath = path.resolve(__dirname, '..');
  console.log(`📁 Sirviendo frontend desde: ${frontendPath}`);

  // Middleware para crawlers (redes sociales, bots): servir SSR con OG tags
  const botPattern = /facebookexternalhit|twitterbot|whatsapp|telegrambot|slack|discord|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|ia_archiver|pinterest|linkedin|slack|viber|line|skypeuri preview/i;
  app.get(['/profile.html', '/miniweb.html'], (req, res, next) => {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const tenant = req.query.tenant || req.query.profile || req.query.subdomain || '';
    if (botPattern.test(ua) && tenant) {
      // Redirigir al crawler a la versión SSR con meta tags completas
      return res.redirect(301, `/api/minisite/render?tenant=${encodeURIComponent(tenant)}`);
    }
    next();
  });

  app.use(express.static(frontendPath));
  
  // Fallback SPA: cualquier ruta no-API redirige a index.html
  app.get('{*path}', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Health check público
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EnlaceHub API funcionando', uptime: process.uptime() });
});

// Rutas Globales
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classifieds', classifiedsRoutes);
app.use('/api/audit', auditRoutes);

// Middleware para resolución de subdominio en el resto de la API
app.use(tenantResolver);

// Rutas Específicas del Workspace
app.use('/api/workspace', workspaceRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/links', shortLinkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/minisite', miniSiteRoutes);
app.use('/api/auto', agentRoutes);

// Middleware de errores global (debe ir al final)
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Soporte HTTPS local (desarrollo)
if (SSL_ENABLED) {
  const keyPath = process.env.SSL_KEY_PATH || 'ssl/localhost.key';
  const certPath = process.env.SSL_CERT_PATH || 'ssl/localhost.crt';

  try {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`🔒 Servidor HTTPS corriendo en https://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(`⚠️  Error cargando SSL desde ${keyPath} y ${certPath}:`, err.message);
    console.error('   Para generar certificados: node scripts/setup-ssl.js');
    console.error('   Iniciando servidor HTTP como fallback.');
    http.createServer(app).listen(PORT, () => {
      console.log(`⚠️  Servidor HTTP (fallback) en http://localhost:${PORT}`);
    });
  }
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`Servidor Backend HTTP en http://localhost:${PORT}`);
    console.log('💡 Para habilitar HTTPS: SSL_ENABLED=true node index.js');
  });
}
