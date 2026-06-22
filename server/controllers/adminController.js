const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStats = async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    const workspacesCount = await prisma.workspace.count();
    const blocksCount = await prisma.treeBlock.count();
    const classifiedsCount = await prisma.classified.count();

    res.json({
      users: usersCount,
      workspaces: workspacesCount,
      blocks: blocksCount,
      classifieds: classifiedsCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo métricas' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        workspaces: {
          select: { name: true, handle: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  try {
    // Si intentamos borrar a otro admin (o a sí mismo) podríamos prevenirlo aquí
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (targetUser.role === 'ADMIN') {
      return res.status(403).json({ error: 'No se puede eliminar a otro Súper Administrador' });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Usuario y todos sus datos eliminados' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando usuario. Asegúrese de que la eliminación en cascada esté bien configurada en la BD.' });
  }
};
