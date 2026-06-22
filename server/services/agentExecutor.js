/**
 * Ejecutor de Agentes.
 * Ejecuta cada paso del plan contra la base de datos / servicios.
 * Cada paso retorna { success, result, snapshot } para permitir rollback.
 */

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Ejecuta un paso individual.
 * @param {object} step  { step, type, params }
 * @param {string} workspaceId
 * @returns {Promise<{success: boolean, result: any, snapshot: object|null}>}
 */
async function executeStep(step, workspaceId) {
  switch (step.type) {
    case 'create_block':
      return executeCreateBlock(step.params, workspaceId);
    case 'update_block':
      return executeUpdateBlock(step.params, workspaceId);
    case 'delete_block':
      return executeDeleteBlock(step.params, workspaceId);
    case 'create_classified':
      return executeCreateClassified(step.params, workspaceId);
    case 'update_classified':
      return executeUpdateClassified(step.params, workspaceId);
    case 'delete_classified':
      return executeDeleteClassified(step.params, workspaceId);
    case 'update_profile':
      return executeUpdateProfile(step.params, workspaceId);
    case 'update_minisite':
      return executeUpdateMinisite(step.params, workspaceId);
    case 'create_shortlink':
      return executeCreateShortlink(step.params, workspaceId);
    case 'bulk_schedule':
      return executeBulkSchedule(step.params, workspaceId);
    case 'audit_check':
      return executeAuditCheck(step.params, workspaceId);
    case 'notify':
      return executeNotify(step.params, workspaceId);
    default:
      return { success: false, result: `Tipo de paso desconocido: ${step.type}`, snapshot: null };
  }
}

async function executeCreateBlock(params, workspaceId) {
  const block = await prisma.treeBlock.create({
    data: {
      workspaceId,
      type: params.type || 'link',
      title: params.title || 'Nuevo bloque',
      payload: params.payload || '{}',
      order: await nextBlockOrder(workspaceId),
      isActive: true
    }
  });
  return {
    success: true,
    result: { id: block.id, title: block.title, type: block.type },
    snapshot: { action: 'create', entity: 'block', entityId: block.id, data: block }
  };
}

async function executeUpdateBlock(params, workspaceId) {
  const { blockId, title, payload, isActive } = params;
  const where = blockId
    ? { id: blockId, workspaceId }
    : (params.titleFilter
        ? { workspaceId, title: { contains: params.titleFilter } }
        : null);

  if (!where) {
    return { success: false, result: 'Falta blockId o titleFilter', snapshot: null };
  }

  const existing = await prisma.treeBlock.findFirst({ where });
  if (!existing) {
    return { success: false, result: 'Bloque no encontrado', snapshot: null };
  }

  const updated = await prisma.treeBlock.update({
    where: { id: existing.id },
    data: {
      ...(title !== undefined && { title }),
      ...(payload !== undefined && { payload }),
      ...(isActive !== undefined && { isActive })
    }
  });

  return {
    success: true,
    result: { id: updated.id, title: updated.title },
    snapshot: { action: 'update', entity: 'block', entityId: existing.id, before: existing, after: updated }
  };
}

async function executeDeleteBlock(params, workspaceId) {
  const where = params.blockId
    ? { id: params.blockId, workspaceId }
    : (params.titleFilter
        ? { workspaceId, title: { contains: params.titleFilter } }
        : null);

  if (!where) {
    return { success: false, result: 'Falta blockId o titleFilter', snapshot: null };
  }

  const existing = await prisma.treeBlock.findFirst({ where });
  if (!existing) {
    return { success: false, result: 'Bloque no encontrado', snapshot: null };
  }

  await prisma.treeBlock.delete({ where: { id: existing.id } });

  return {
    success: true,
    result: { deleted: existing.id, title: existing.title },
    snapshot: { action: 'delete', entity: 'block', entityId: existing.id, data: existing }
  };
}

async function executeCreateClassified(params, workspaceId) {
  // Crear un TreeBlock primero, luego el Classified asociado
  const block = await prisma.treeBlock.create({
    data: {
      workspaceId,
      type: 'classified',
      title: params.title || 'Clasificado automático',
      payload: JSON.stringify({ price: params.price, category: params.category }),
      order: await nextBlockOrder(workspaceId),
      isActive: true,
      classified: {
        create: {
          category: params.category || 'Servicios',
          price: params.price || null,
          currency: params.currency || 'USD',
          location: params.location || 'Remoto',
          description: params.description || '',
          tags: params.tags || 'auto'
        }
      }
    },
    include: { classified: true }
  });

  return {
    success: true,
    result: { blockId: block.id, classifiedId: block.classified.id, title: block.title },
    snapshot: { action: 'create', entity: 'classified', entityId: block.classified.id, data: block }
  };
}

async function executeUpdateClassified(params, workspaceId) {
  // Buscar por blockId o classifiedId
  const classified = params.classifiedId
    ? await prisma.classified.findUnique({
        where: { id: params.classifiedId },
        include: { block: true }
      })
    : null;

  if (!classified || classified.block.workspaceId !== workspaceId) {
    return { success: false, result: 'Clasificado no encontrado', snapshot: null };
  }

  const before = { ...classified };
  const updated = await prisma.classified.update({
    where: { id: classified.id },
    data: {
      ...(params.category !== undefined && { category: params.category }),
      ...(params.price !== undefined && { price: params.price }),
      ...(params.description !== undefined && { description: params.description }),
      ...(params.location !== undefined && { location: params.location })
    }
  });

  return {
    success: true,
    result: { classifiedId: updated.id },
    snapshot: { action: 'update', entity: 'classified', entityId: updated.id, before, after: updated }
  };
}

async function executeDeleteClassified(params, workspaceId) {
  const classified = params.classifiedId
    ? await prisma.classified.findUnique({
        where: { id: params.classifiedId },
        include: { block: true }
      })
    : null;

  if (!classified || classified.block.workspaceId !== workspaceId) {
    return { success: false, result: 'Clasificado no encontrado', snapshot: null };
  }

  // Eliminar en cascada: primero el classified, luego el block
  await prisma.classified.delete({ where: { id: classified.id } });
  await prisma.treeBlock.delete({ where: { id: classified.blockId } });

  return {
    success: true,
    result: { deleted: classified.id },
    snapshot: { action: 'delete', entity: 'classified', entityId: classified.id, data: { classified, block: classified.block } }
  };
}

async function executeUpdateProfile(params, workspaceId) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return { success: false, result: 'Workspace no encontrado', snapshot: null };
  }

  const before = { name: workspace.name, handle: workspace.handle, bio: workspace.bio, avatar: workspace.avatar };
  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(params.name !== undefined && { name: params.name }),
      ...(params.bio !== undefined && { bio: params.bio }),
      ...(params.avatar !== undefined && { avatar: params.avatar }),
      ...(params.handle !== undefined && { handle: params.handle })
    }
  });

  return {
    success: true,
    result: { name: updated.name, bio: updated.bio },
    snapshot: { action: 'update', entity: 'workspace', entityId: workspaceId, before, after: { name: updated.name, bio: updated.bio } }
  };
}

async function executeUpdateMinisite(params, workspaceId) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return { success: false, result: 'Workspace no encontrado', snapshot: null };
  }

  let miniSite = {};
  try { miniSite = JSON.parse(workspace.miniSite || '{}'); } catch { miniSite = {}; }

  const before = { ...miniSite };
  Object.assign(miniSite, params);

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { miniSite: JSON.stringify(miniSite) }
  });

  return {
    success: true,
    result: miniSite,
    snapshot: { action: 'update', entity: 'minisite', entityId: workspaceId, before, after: miniSite }
  };
}

async function executeCreateShortlink(params, workspaceId) {
  const slug = params.slug || Math.random().toString(36).slice(2, 9);
  const existing = await prisma.shortLink.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, result: `El slug '${slug}' ya existe`, snapshot: null };
  }

  const link = await prisma.shortLink.create({
    data: {
      workspaceId,
      slug,
      url: params.url || 'https://example.com',
      isActive: true
    }
  });

  return {
    success: true,
    result: { id: link.id, slug: link.slug, url: link.url },
    snapshot: { action: 'create', entity: 'shortlink', entityId: link.id, data: link }
  };
}

async function executeBulkSchedule(params, workspaceId) {
  const blocks = await prisma.treeBlock.findMany({
    where: { workspaceId, type: 'link' },
    orderBy: { order: 'asc' }
  });

  // Actualizar todos los bloques con las fechas de programación
  const updated = [];
  for (const block of blocks) {
    let payload = {};
    try { payload = JSON.parse(block.payload || '{}'); } catch { payload = {}; }
    payload.startAt = params.startAt || payload.startAt;
    payload.endAt = params.endAt || payload.endAt;
    const updatedBlock = await prisma.treeBlock.update({
      where: { id: block.id },
      data: { payload: JSON.stringify(payload) }
    });
    updated.push({ id: updatedBlock.id, title: updatedBlock.title });
  }

  return {
    success: true,
    result: { scheduled: updated.length, blocks: updated },
    snapshot: { action: 'bulk_schedule', entity: 'blocks', entityId: workspaceId, data: { scheduled: updated.length } }
  };
}

async function executeAuditCheck(params, workspaceId) {
  const blocks = await prisma.treeBlock.count({ where: { workspaceId } });
  const classifieds = await prisma.classified.count({
    where: { block: { workspaceId } }
  });
  const shortLinks = await prisma.shortLink.count({ where: { workspaceId } });
  const events = await prisma.analyticsEvent.count({ where: { workspaceId } });

  const issues = [];

  if (blocks === 0) issues.push('No hay bloques/enlaces creados');
  const inactiveBlocks = await prisma.treeBlock.count({ where: { workspaceId, isActive: false } });
  if (inactiveBlocks > 0) issues.push(`${inactiveBlocks} bloque(s) inactivo(s)`);

  return {
    success: true,
    result: {
      workspaceId,
      stats: { blocks, classifieds, shortLinks, events },
      health: issues.length === 0 ? 'ok' : 'warning',
      issues
    },
    snapshot: null
  };
}

async function executeNotify(params, _workspaceId) {
  // En una implementación real, enviaría email/notificación al usuario
  return {
    success: true,
    result: { notified: true, message: params.message || 'Notificación enviada' },
    snapshot: null
  };
}

async function nextBlockOrder(workspaceId) {
  const last = await prisma.treeBlock.findFirst({
    where: { workspaceId },
    orderBy: { order: 'desc' }
  });
  return (last?.order ?? -1) + 1;
}

module.exports = { executeStep };
