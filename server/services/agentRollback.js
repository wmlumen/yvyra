/**
 * Rollback de Agentes.
 * Revierte los cambios aplicados por el ejecutor cuando un paso falla.
 */

const prisma = require('../lib/prisma');

/**
 * Revierte una lista de snapshots en orden inverso.
 * @param {Array<{success: boolean, result: any, snapshot: object|null}>} stepResults
 * @returns {Promise<Array<{step: number, reverted: boolean, error?: string}>>}
 */
async function rollback(stepResults) {
  const results = [];

  // Recorrer en orden inverso
  for (let i = stepResults.length - 1; i >= 0; i--) {
    const step = stepResults[i];
    if (!step.success || !step.snapshot) {
      results.push({ step: i + 1, reverted: false, reason: 'Sin snapshot para revertir' });
      continue;
    }

    const snap = step.snapshot;
    try {
      switch (snap.action) {
        case 'create':
          await rollbackCreate(snap);
          break;
        case 'update':
          await rollbackUpdate(snap);
          break;
        case 'delete':
          await rollbackDelete(snap);
          break;
        case 'bulk_schedule':
          // bulk_schedule no se puede revertir automáticamente, se marca
          break;
        default:
          // no-op
          break;
      }
      results.push({ step: i + 1, reverted: true });
    } catch (err) {
      results.push({ step: i + 1, reverted: false, error: err.message });
    }
  }

  return results;
}

async function rollbackCreate(snapshot) {
  const { entity, entityId } = snapshot;
  switch (entity) {
    case 'block':
      await prisma.treeBlock.delete({ where: { id: entityId } }).catch(() => {});
      break;
    case 'classified':
      await prisma.classified.delete({ where: { id: entityId } }).catch(() => {});
      break;
    case 'shortlink':
      await prisma.shortLink.delete({ where: { id: entityId } }).catch(() => {});
      break;
  }
}

async function rollbackUpdate(snapshot) {
  const { entity, entityId, before } = snapshot;
  if (!before) return;

  switch (entity) {
    case 'block':
      await prisma.treeBlock.update({
        where: { id: entityId },
        data: {
          title: before.title,
          payload: before.payload,
          isActive: before.isActive
        }
      }).catch(() => {});
      break;
    case 'classified':
      await prisma.classified.update({
        where: { id: entityId },
        data: {
          category: before.category,
          price: before.price,
          description: before.description,
          location: before.location
        }
      }).catch(() => {});
      break;
    case 'workspace':
      await prisma.workspace.update({
        where: { id: entityId },
        data: {
          name: before.name,
          bio: before.bio,
          avatar: before.avatar
        }
      }).catch(() => {});
      break;
    case 'minisite':
      // Restore miniSite JSON
      await prisma.workspace.update({
        where: { id: entityId },
        data: { miniSite: JSON.stringify(before) }
      }).catch(() => {});
      break;
  }
}

async function rollbackDelete(snapshot) {
  const { entity, entityId, data } = snapshot;
  if (!data) return;

  switch (entity) {
    case 'block':
      await prisma.treeBlock.create({ data }).catch(() => {});
      break;
    case 'classified': {
      // data tiene { classified, block }
      if (data.block) {
        await prisma.treeBlock.create({ data: data.block }).catch(() => {});
      }
      break;
    }
  }
}

module.exports = { rollback };
