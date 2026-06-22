/**
 * Controlador de autenticación.
 */

const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../lib/utils');
const { loginSchema, registerSchema } = require('../middleware/validate');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

/** Helper: crear token y setear cookie */
function setTokenCookie(res, user, workspaceId) {
  const token = jwt.sign(
    { userId: user.id, workspaceId, role: user.role || 'USER' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return token;
}

// Registrar un usuario y crearle un Workspace por defecto
exports.register = asyncHandler(async (req, res) => {
  const { email, password, name, subdomain } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AppError('El correo ya está en uso', 400);

  // Verificar si el subdominio está libre
  const existingDomain = await prisma.domainMapping.findUnique({
    where: { hostname: subdomain }
  });
  if (existingDomain) throw new AppError('El subdominio ya está ocupado', 400);

  // Crear usuario, workspace y mapeo de dominio en transacción
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        workspaces: {
          create: {
            name: name || `Cuenta de ${email.split('@')[0]}`,
            bio: '¡Hola! Bienvenido a mi espacio en EnlaceHub.',
            avatar: '✨',
            theme: 'dark',
            domainMappings: {
              create: {
                hostname: subdomain,
                type: 'platform_subdomain',
                canonical: true
              }
            },
            blocks: {
              create: [
                { type: 'link', title: 'Mi primer enlace', payload: JSON.stringify({ url: 'https://google.com' }), order: 0 },
                { type: 'link', title: 'Sígueme en Instagram', payload: JSON.stringify({ url: 'https://instagram.com' }), order: 1 }
              ]
            }
          }
        }
      },
      include: { workspaces: true }
    });
    return newUser;
  });

  setTokenCookie(res, user, user.workspaces[0].id);

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: { id: user.id, email: user.email, name: user.name }
  });
});

// Iniciar sesión
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspaces: true }
  });

  if (!user) throw new AppError('Credenciales inválidas', 401);

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) throw new AppError('Credenciales inválidas', 401);

  setTokenCookie(res, user, user.workspaces[0].id);

  res.json({
    message: 'Login exitoso',
    user: { id: user.id, email: user.email, name: user.name }
  });
});

// Cerrar sesión
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada' });
};

// Verificar sesión actual
exports.me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user) throw new AppError('Usuario no encontrado', 401);

  res.json({ user, workspaceId: req.user.workspaceId, role: req.user.role });
});
