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

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para permitir las demos frontend; habilitar en producción
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

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

// Middleware de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en el puerto ${PORT}`);
});
