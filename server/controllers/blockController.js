const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los bloques públicos de un árbol dado un workspaceId (se inyecta por el tenantResolver)
exports.getPublicBlocks = async (req, res) => {
  const workspaceId = req.tenantWorkspaceId;

  try {
    const blocks = await prisma.treeBlock.findMany({
      where: { workspaceId, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        classified: true // Incluir datos extra si es de tipo clasificado
      }
    });
    const normalizedBlocks = blocks.map(b => {
      if (typeof b.payload === 'string') {
        try { b.payload = JSON.parse(b.payload); } catch(e){}
      }
      if (b.classified && typeof b.classified.tags === 'string') {
        try { b.classified.tags = JSON.parse(b.classified.tags); } catch(e){}
      }
      return b;
    });
    res.json(normalizedBlocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Error obteniendo los bloques' });
  }
};

// Obtener todos los bloques privados (para el dashboard del dueño)
exports.getPrivateBlocks = async (req, res) => {
  const workspaceId = req.user.workspaceId;

  try {
    const blocks = await prisma.treeBlock.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
      include: {
        classified: true
      }
    });
    const normalizedBlocks = blocks.map(b => {
      if (typeof b.payload === 'string') {
        try { b.payload = JSON.parse(b.payload); } catch(e){}
      }
      if (b.classified && typeof b.classified.tags === 'string') {
        try { b.classified.tags = JSON.parse(b.classified.tags); } catch(e){}
      }
      return b;
    });
    res.json(normalizedBlocks);
  } catch (error) {
    console.error('Error fetching private blocks:', error);
    res.status(500).json({ error: 'Error obteniendo tus bloques' });
  }
};

// Crear un nuevo bloque (Requiere Autenticación)
exports.createBlock = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const { type, title, order, payload, classifiedData } = req.body;

  try {
    // Si el bloque es de tipo 'classified', usamos una transacción para crear el bloque y el anuncio
    if (type === 'classified') {
      if (!classifiedData) {
        return res.status(400).json({ error: 'Faltan los datos del anuncio clasificado' });
      }

      const newBlock = await prisma.treeBlock.create({
        data: {
          workspaceId,
          type,
          title,
          order: order || 0,
          payload: typeof payload === 'object' ? JSON.stringify(payload) : (payload || "{}"),
          classified: {
            create: {
              category: classifiedData.category,
              description: classifiedData.description,
              price: classifiedData.price,
              currency: classifiedData.currency,
              location: classifiedData.location,
              tags: classifiedData.tags ? JSON.stringify(classifiedData.tags) : "[]",
              isFeatured: classifiedData.isFeatured || false
            }
          }
        },
        include: { classified: true }
      });
      return res.status(201).json(newBlock);
    }

    // Para cualquier otro tipo de bloque (link, event, product, form, etc.), se guardan las 
    // propiedades específicas dentro del JSON dinámico 'payload'
    const newBlock = await prisma.treeBlock.create({
      data: {
        workspaceId,
        type,
        title,
        order: order || 0,
        payload: typeof payload === 'object' ? JSON.stringify(payload) : (payload || "{}")
      }
    });

    res.status(201).json(newBlock);
  } catch (error) {
    console.error('Error creating block:', error);
    res.status(500).json({ error: 'Error interno guardando el bloque' });
  }
};

// Eliminar un bloque
exports.deleteBlock = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const blockId = req.params.id;

  try {
    // Verificamos que el bloque pertenezca al usuario
    const block = await prisma.treeBlock.findFirst({ where: { id: blockId, workspaceId } });
    if (!block) return res.status(404).json({ error: 'Bloque no encontrado o sin permisos' });

    await prisma.treeBlock.delete({ where: { id: blockId } });
    res.json({ message: 'Bloque eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting block:', error);
    res.status(500).json({ error: 'Error interno eliminando el bloque' });
  }
};

// Actualizar un bloque
exports.updateBlock = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const blockId = req.params.id;
  const { title, isActive, payload, classifiedData } = req.body;

  try {
    const block = await prisma.treeBlock.findFirst({ where: { id: blockId, workspaceId } });
    if (!block) return res.status(404).json({ error: 'Bloque no encontrado' });

    let updatedBlock;
    if (block.type === 'classified' && classifiedData) {
      updatedBlock = await prisma.treeBlock.update({
        where: { id: blockId },
        data: {
          title,
          isActive,
          payload: typeof payload === 'object' ? JSON.stringify(payload) : (payload || "{}"),
          classified: {
            update: {
              category: classifiedData.category,
              description: classifiedData.description,
              price: classifiedData.price ? parseFloat(classifiedData.price) : null,
              currency: classifiedData.currency,
              location: classifiedData.location,
              isFeatured: classifiedData.isFeatured || false
            }
          }
        },
        include: { classified: true }
      });
    } else {
      updatedBlock = await prisma.treeBlock.update({
        where: { id: blockId },
        data: { title, isActive, payload: typeof payload === 'object' ? JSON.stringify(payload) : (payload || "{}") }
      });
    }
    
    if (typeof updatedBlock.payload === 'string') {
      try { updatedBlock.payload = JSON.parse(updatedBlock.payload); } catch(e){}
    }
    if (updatedBlock.classified && typeof updatedBlock.classified.tags === 'string') {
      try { updatedBlock.classified.tags = JSON.parse(updatedBlock.classified.tags); } catch(e){}
    }
    
    res.json(updatedBlock);
  } catch (error) {
    console.error('Error updating block:', error);
    res.status(500).json({ error: 'Error interno actualizando el bloque' });
  }
};

// Reordenar bloques (recibe un array de { id, order })
exports.reorderBlocks = async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const { items } = req.body; // [{ id: "blockId", order: 0 }, ...]

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de items con id y order' });
  }

  try {
    // Verificar que todos los bloques pertenecen al workspace
    const blockIds = items.map(item => item.id);
    const existingBlocks = await prisma.treeBlock.findMany({
      where: { id: { in: blockIds }, workspaceId }
    });

    if (existingBlocks.length !== blockIds.length) {
      return res.status(403).json({ error: 'Uno o más bloques no pertenecen a este espacio' });
    }

    // Actualizar órdenes en transacción
    await prisma.$transaction(
      items.map(item =>
        prisma.treeBlock.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    // Devolver los bloques reordenados
    const blocks = await prisma.treeBlock.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
      include: { classified: true }
    });

    res.json(blocks);
  } catch (error) {
    console.error('Error reordering blocks:', error);
    res.status(500).json({ error: 'Error interno reordenando bloques' });
  }
};
