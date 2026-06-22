const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

// Registrar un usuario y crearle un Workspace por defecto
exports.register = async (req, res) => {
  const { email, password, name, subdomain } = req.body;

  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso' });
    }

    // Verificar si el subdominio está libre
    const existingDomain = await prisma.domainMapping.findUnique({ where: { hostname: subdomain } });
    if (existingDomain) {
      return res.status(400).json({ error: 'El subdominio ya está ocupado' });
    }

    // Crear usuario, workspace y mapeo de dominio (Todo en una transacción)
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

    // Crear token
    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspaces[0].id, role: user.role || 'USER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Guardar token en cookie segura (HttpOnly)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Permite redirecciones
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', user: { id: user.id, email: user.email, name: user.name } });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { workspaces: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspaces[0].id, role: user.role || 'USER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Login exitoso', user: { id: user.id, email: user.email, name: user.name } });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada' });
};

// Verificar sesión actual
exports.me = async (req, res) => {
  // req.user viene del authMiddleware
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    res.json({ user, workspaceId: req.user.workspaceId, role: req.user.role });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};
