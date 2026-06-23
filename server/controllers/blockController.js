/**
 * Controlador de bloques (árbol de enlaces).
 * Usa asyncHandler para eliminar try/catch repetitivo.
 */

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler, parseBlockPayload, stringifyPayload } = require('../lib/utils');
const { isClassifiedBlockType, normalizeKind } = require('../lib/classifiedKinds');

function resolveBlockType(type, fallback = '') {
  const rawType = String(type ?? fallback).trim();
  if (!rawType) return '';
  return isClassifiedBlockType(rawType) ? normalizeKind(rawType) : rawType;
}

// Obtener todos los bloques públicos de un árbol dado un workspaceId
exports.getPublicBlocks = asyncHandler(async (req, res) => {
  const workspaceId = req.tenantWorkspaceId;
  if (!workspaceId) throw new AppError('Workspace no identificado', 400);

  const blocks = await prisma.treeBlock.findMany({
    where: { workspaceId, isActive: true },
    orderBy: { order: 'asc' },
    include: { classified: true }
  });

  res.json(blocks.map(parseBlockPayload));
});

// Obtener todos los bloques privados (para el dashboard del dueño)
exports.getPrivateBlocks = asyncHandler(async (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) throw new AppError('No autenticado', 401);

  const blocks = await prisma.treeBlock.findMany({
    where: { workspaceId },
    orderBy: { order: 'asc' },
    include: { classified: true }
  });

  res.json(blocks.map(parseBlockPayload));
});

// Crear un nuevo bloque
exports.createBlock = asyncHandler(async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const { type, title, order, payload, classifiedData } = req.body;

  if (!type || !title) {
    throw new AppError('Los campos "type" y "title" son requeridos', 400);
  }

  const normalizedType = resolveBlockType(type);

  // Si el bloque representa una ficha publicable, creamos su clasificado asociado
  if (isClassifiedBlockType(normalizedType)) {
    if (!classifiedData) {
      throw new AppError('Faltan los datos del anuncio clasificado', 400);
    }

    const newBlock = await prisma.treeBlock.create({
      data: {
        workspaceId,
        type: normalizedType,
        title,
        order: order ?? 0,
        payload: stringifyPayload(payload),
        classified: {
          create: {
            category: classifiedData.category || 'Otros',
            description: classifiedData.description || '',
            price: classifiedData.price || null,
            currency: classifiedData.currency || 'USD',
            location: classifiedData.location || '',
            tags: JSON.stringify(Array.isArray(classifiedData.tags) ? classifiedData.tags : [normalizedType]),
            isFeatured: classifiedData.isFeatured || false
          }
        }
      },
      include: { classified: true }
    });

    return res.status(201).json(parseBlockPayload(newBlock));
  }

  // Cualquier otro tipo de bloque
  const newBlock = await prisma.treeBlock.create({
      data: {
        workspaceId,
        type: normalizedType,
        title,
        order: order ?? 0,
        payload: stringifyPayload(payload)
      }
  });

  res.status(201).json(parseBlockPayload(newBlock));
});

// Actualizar un bloque
exports.updateBlock = asyncHandler(async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const blockId = req.params.id;
  const { title, type, isActive, payload, classifiedData } = req.body;

  const block = await prisma.treeBlock.findFirst({
    where: { id: blockId, workspaceId }
  });
  if (!block) throw new AppError('Bloque no encontrado', 404);

  let updatedBlock;

  const normalizedType = resolveBlockType(type, block.type);

  if (isClassifiedBlockType(block.type) && classifiedData) {
    updatedBlock = await prisma.treeBlock.update({
      where: { id: blockId },
      data: {
        type: normalizedType,
        title,
        isActive,
        payload: stringifyPayload(payload),
        classified: {
          update: {
            category: classifiedData.category,
            description: classifiedData.description,
            price: classifiedData.price ? parseFloat(classifiedData.price) : null,
            currency: classifiedData.currency,
            location: classifiedData.location,
            tags: JSON.stringify(Array.isArray(classifiedData.tags) ? classifiedData.tags : [normalizedType]),
            isFeatured: classifiedData.isFeatured || false
          }
        }
      },
      include: { classified: true }
    });
  } else {
    updatedBlock = await prisma.treeBlock.update({
      where: { id: blockId },
      data: { title, type: normalizedType, isActive, payload: stringifyPayload(payload) }
    });
  }

  res.json(parseBlockPayload(updatedBlock));
});

// Eliminar un bloque
exports.deleteBlock = asyncHandler(async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const blockId = req.params.id;

  const block = await prisma.treeBlock.findFirst({
    where: { id: blockId, workspaceId }
  });
  if (!block) throw new AppError('Bloque no encontrado o sin permisos', 404);

  await prisma.treeBlock.delete({ where: { id: blockId } });
  res.json({ message: 'Bloque eliminado correctamente' });
});

// Reordenar bloques (recibe un array de { id, order })
exports.reorderBlocks = asyncHandler(async (req, res) => {
  const workspaceId = req.user.workspaceId;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Se requiere un array de items con id y order', 400);
  }

  // Validar que todos los bloques pertenecen al workspace
  const blockIds = items.map(item => item.id);
  const existingBlocks = await prisma.treeBlock.findMany({
    where: { id: { in: blockIds }, workspaceId }
  });

  if (existingBlocks.length !== blockIds.length) {
    throw new AppError('Uno o más bloques no pertenecen a este espacio', 403);
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

  // Devolver bloques reordenados
  const blocks = await prisma.treeBlock.findMany({
    where: { workspaceId },
    orderBy: { order: 'asc' },
    include: { classified: true }
  });

  res.json(blocks.map(parseBlockPayload));
});
