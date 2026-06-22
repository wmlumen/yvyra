/**
 * Auditor de Agentes.
 * Evalúa los resultados de la ejecución y asigna una puntuación de calidad.
 */

/**
 * Evalúa el resultado completo de una ejecución multi-paso.
 * @param {Array<{step: number, type: string, result: {success: boolean, result: any, snapshot: object|null}}>} steps
 * @returns {{score: number, verdict: string, details: Array<{step: number, status: string, note: string}>}}
 */
function audit(steps) {
  const details = steps.map((s) => {
    const stepResult = s.result || {};
    const status = stepResult.success ? 'passed' : 'failed';
    let note = '';

    if (stepResult.success) {
      switch (s.type) {
        case 'create_block':
          note = `Bloque "${stepResult.result?.title}" creado (ID: ${stepResult.result?.id})`;
          break;
        case 'update_block':
          note = `Bloque "${stepResult.result?.title}" actualizado`;
          break;
        case 'delete_block':
          note = `Bloque "${stepResult.result?.title}" eliminado`;
          break;
        case 'create_classified':
          note = `Clasificado "${stepResult.result?.title}" creado`;
          break;
        case 'audit_check':
          const health = stepResult.result?.health;
          const issues = stepResult.result?.issues || [];
          note = `Auditoría: ${health === 'ok' ? '✅ Sin problemas' : `⚠️ ${issues.join(', ')}`}`;
          break;
        case 'update_profile':
          note = 'Perfil actualizado correctamente';
          break;
        case 'update_minisite':
          note = 'Miniweb actualizada correctamente';
          break;
        case 'bulk_schedule':
          note = `Programación aplicada a ${stepResult.result?.scheduled || 0} bloque(s)`;
          break;
        case 'create_shortlink':
          note = `Shortlink "${stepResult.result?.slug}" creado`;
          break;
        default:
          note = 'Paso completado';
      }
    } else {
      note = stepResult.result || 'Error desconocido';
    }

    return { step: s.step, status, note };
  });

  const total = details.length;
  const passed = details.filter((d) => d.status === 'passed').length;
  const score = total > 0 ? Math.round((passed / total) * 100) : 100;

  let verdict;
  if (score === 100) verdict = 'EXCELLENT';
  else if (score >= 80) verdict = 'GOOD';
  else if (score >= 50) verdict = 'FAIR';
  else verdict = 'POOR';

  return { score, verdict, details };
}

module.exports = { audit };
