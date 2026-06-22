/**
 * Planificador de Agentes.
 * Toma una tarea en lenguaje natural y la descompone en
 * pasos ejecutables (create, update, delete, audit, notify).
 */

const { AppError } = require('../middleware/errorHandler');

// Tipos de paso soportados
const STEP_TYPES = [
  'create_block',
  'update_block',
  'delete_block',
  'create_classified',
  'update_classified',
  'delete_classified',
  'update_profile',
  'update_minisite',
  'create_shortlink',
  'bulk_schedule',
  'audit_check',
  'notify'
];

/**
 * Analiza la tarea y devuelve un plan estructurado.
 * @param {string} task Descripción en lenguaje natural
 * @param {object} context { workspaceId, existingData }
 * @returns {Array<{step: number, type: string, params: object}>}
 */
function plan(task, context = {}) {
  if (!task || typeof task !== 'string' || !task.trim()) {
    throw new AppError('La tarea es requerida para generar un plan', 400, 'PLANNER_ERROR');
  }

  const taskTrimmed = task.trim();
  const normalized = taskTrimmed.toLowerCase();
  const steps = [];

  // --- Reglas heurísticas para parsear la intención ---
  // NOTA: Usamos 'normalized' para detectar la intención,
  // pero extraemos texto del original 'taskTrimmed' para preservar mayúsculas.

  // 1. Crear bloque de enlace
  if (/(crea|agrega|añade|nuevo)\s.*(enlace|link|bloque)/i.test(normalized)) {
    const titleMatch = taskTrimmed.match(/(?:titulado?|llamado?|nombre)\s*["""]?([^""".\n]+)["""]?/i);
    const urlMatch = taskTrimmed.match(/https?:\/\/[^\s,]+/i);
    steps.push({
      step: steps.length + 1,
      type: 'create_block',
      params: {
        type: 'link',
        title: titleMatch ? titleMatch[1].trim() : 'Nuevo enlace',
        payload: JSON.stringify({ url: urlMatch ? urlMatch[0] : 'https://example.com' })
      }
    });
  }

  // 2. Actualizar perfil
  if (/(actualiza|cambia|modifica|edita)\s.*(perfil|bio|nombre|avatar)/i.test(normalized)) {
    const nameMatch = taskTrimmed.match(/(?:nombre\s*(?:a\s*)?["""]?([^""".\n]{2,})["""]?)/i);
    const bioMatch = taskTrimmed.match(/(?:bio|descripción)\s*(?:a\s*)?["""]?([^""".\n]{2,})["""]?/i);
    const profileUpdate = {};
    if (nameMatch) profileUpdate.name = nameMatch[1].trim();
    if (bioMatch) profileUpdate.bio = bioMatch[1].trim();
    if (Object.keys(profileUpdate).length > 0) {
      steps.push({
        step: steps.length + 1,
        type: 'update_profile',
        params: profileUpdate
      });
    }
  }

  // 3. Crear clasificado
  if (/(crea|publica|agrega)\s.*(clasificado|anuncio|aviso)/i.test(normalized)) {
    const titleMatch = taskTrimmed.match(/(?:titulado?|llamado?)\s*["""]?([^""".\n]+)["""]?/i);
    const priceMatch = taskTrimmed.match(/(\d+)\s*(usd|dólares|dolares)?/i);
    steps.push({
      step: steps.length + 1,
      type: 'create_classified',
      params: {
        title: titleMatch ? titleMatch[1].trim() : 'Nuevo clasificado',
        description: extractDescription(taskTrimmed) || 'Descripción del clasificado',
        category: extractCategory(normalized),
        price: priceMatch ? parseFloat(priceMatch[1]) : null,
        contactUrl: 'https://example.com/contacto'
      }
    });
  }

  // 4. Programación masiva (bulk schedule)
  if (/(programa|agenda|schedule)\s.*(enlaces?|links?)/i.test(normalized)) {
    const dateMatch = taskTrimmed.match(/(\d{4}-\d{2}-\d{2})/);
    steps.push({
      step: steps.length + 1,
      type: 'bulk_schedule',
      params: {
        startAt: dateMatch ? `${dateMatch[1]}T00:00:00.000Z` : new Date(Date.now() + 86400000).toISOString(),
        endAt: dateMatch ? `${dateMatch[1]}T23:59:59.000Z` : new Date(Date.now() + 7 * 86400000).toISOString()
      }
    });
  }

  // 5. Auditoría / health check
  if (/(revisa|audita|verifica|health|check|diagnóstico)/i.test(normalized)) {
    steps.push({
      step: steps.length + 1,
      type: 'audit_check',
      params: { scope: 'full' }
    });
  }

  // 6. Notificación / recordatorio
  if (/(notifica|avisa|recuerda|recordatorio)/i.test(normalized)) {
    steps.push({
      step: steps.length + 1,
      type: 'notify',
      params: { message: taskTrimmed }
    });
  }

  // 7. Actualizar miniweb / minisite
  if (/(actualiza|cambia|modifica)\s.*(miniweb|minisite|sitio)/i.test(normalized)) {
    const headlineMatch = taskTrimmed.match(/(?:titulo|headline)\s*(?:a\s*)?["""]?([^""".\n]+)["""]?/i);
    const descMatch = taskTrimmed.match(/(?:descripción|description)\s*(?:a\s*)?["""]?([^""".\n]+)["""]?/i);
    const miniUpdate = {};
    if (headlineMatch) miniUpdate.headline = headlineMatch[1].trim();
    if (descMatch) miniUpdate.description = descMatch[1].trim();
    if (Object.keys(miniUpdate).length > 0) {
      steps.push({
        step: steps.length + 1,
        type: 'update_minisite',
        params: miniUpdate
      });
    }
  }

  // 8. Eliminar bloque
  if (/(elimina|borra|quita|remueve)\s.*(enlace|link|bloque)/i.test(normalized)) {
    const titleMatch = taskTrimmed.match(/(?:titulado?|llamado?)\s*["""]?([^""".\n]+)["""]?/i);
    steps.push({
      step: steps.length + 1,
      type: 'delete_block',
      params: {
        titleFilter: titleMatch ? titleMatch[1].trim() : undefined
      }
    });
  }

  // Si no se pudo interpretar, devolver un paso de auditoría como fallback
  if (steps.length === 0) {
    steps.push({
      step: 1,
      type: 'audit_check',
      params: { scope: 'full', note: 'Tarea no reconocida, se ejecutó auditoría por defecto' }
    });
  }

  return steps;
}

/**
 * Extrae una descripción del texto de la tarea.
 */
function extractDescription(text) {
  const descMatch = text.match(/(?:descripción|description|detalle)\s*(?:a\s*)?["""]?([^""".\n]{10,})["""]?/i);
  return descMatch ? descMatch[1].trim() : null;
}

/**
 * Extrae categoría del texto.
 */
function extractCategory(text) {
  const validCategories = ['servicios', 'empleo', 'hogar', 'tecnología', 'vehículos', 'otros'];
  for (const cat of validCategories) {
    if (text.includes(cat)) return cat.charAt(0).toUpperCase() + cat.slice(1);
  }
  return 'Servicios';
}

module.exports = { plan, STEP_TYPES };
