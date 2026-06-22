const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener perfil público (visitantes) - Resuelve con tenantResolver
exports.getPublicProfile = async (req, res) => {
  const workspaceId = req.tenantWorkspaceId;

  try {
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

    if (!workspace) return res.status(404).json({ error: 'Espacio no encontrado' });

    if (workspace.miniSite && typeof workspace.miniSite === 'string') {
      try { workspace.miniSite = JSON.parse(workspace.miniSite); } catch(e){}
    }

    res.json(workspace);
  } catch (error) {
    console.error('Error public profile:', error);
    res.status(500).json({ error: 'Error obteniendo perfil público' });
  }
};

// Obtener perfil privado (dueño en dashboard) - Resuelve con authMiddleware
exports.getPrivateProfile = async (req, res) => {
  const workspaceId = req.user.workspaceId;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        domainMappings: {
          where: { canonical: true },
          select: { hostname: true }
        }
      }
    });

    if (!workspace) return res.status(404).json({ error: 'Espacio no encontrado' });
    
    if (workspace.miniSite && typeof workspace.miniSite === 'string') {
      try { workspace.miniSite = JSON.parse(workspace.miniSite); } catch(e){}
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo tu perfil' });
  }
};

// Actualizar perfil (dueño en dashboard)
exports.updateProfile = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const { name, handle, bio, avatar, theme, miniSite } = req.body;

  try {
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

    res.json({ message: 'Perfil actualizado', workspace });
  } catch (error) {
    console.error('Error update profile:', error);
    res.status(500).json({ error: 'Error actualizando tu perfil' });
  }
};
