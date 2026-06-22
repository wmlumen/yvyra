/**
 * Controlador de workspace (perfil público/privado).
 */

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../lib/utils');

// Obtener perfil público (visitantes) - Resuelve con tenantResolver
exports.getPublicProfile = asyncHandler(async (req, res) => {
  const workspaceId = req.tenantWorkspaceId;
  if (!workspaceId) throw new AppError('Workspace no identificado', 400);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      handle: true,
      bio: true,
      avatar: true,
      theme: true,
      miniSite: true,
      domainMappings: {
        where: { canonical: true },
        select: { hostname: true }
      }
    }
  });

  if (!workspace) throw new AppError('Espacio no encontrado', 404);
  res.json(parseMiniSite(workspace));
});

// Obtener perfil privado (dueño en dashboard)
exports.getPrivateProfile = asyncHandler(async (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) throw new AppError('No autenticado', 401);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      domainMappings: {
        where: { canonical: true },
        select: { hostname: true }
      }
    }
  });

  if (!workspace) throw new AppError('Espacio no encontrado', 404);
  res.json(parseMiniSite(workspace));
});

// Actualizar perfil (dueño en dashboard)
exports.updateProfile = asyncHandler(async (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) throw new AppError('No autenticado', 401);

  const { name, handle, bio, avatar, theme, miniSite } = req.body;

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name,
      handle,
      bio,
      avatar,
      theme,
      miniSite: typeof miniSite === 'object' ? JSON.stringify(miniSite) : miniSite
    }
  });

  res.json({ message: 'Perfil actualizado', workspace: parseMiniSite(workspace) });
});
