/**
 * Controlador del Sistema de Agentes (/api/auto).
 * Flujo: Plan → Execute → Audit → (Rollback si falla)
 */

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { plan } = require('../services/agentPlanner');
const { executeStep } = require('../services/agentExecutor');
const { audit } = require('../services/agentAuditor');
const { rollback } = require('../services/agentRollback');

/**
 * POST /api/auto
 * Ejecuta una tarea autónoma.
 * Body: { task: string, context?: object, dryRun?: boolean }
 */
exports.run = async (req, res, next) => {
  try {
    const { task, context = {}, dryRun = false } = req.body;
    const workspaceId = req.user?.workspaceId || context.workspaceId;

    if (!task || typeof task !== 'string' || !task.trim()) {
      throw new AppError('La propiedad "task" es requerida (string no vacío)', 400, 'TASK_REQUIRED');
    }

    // 1. PLANIFICAR
    const steps = plan(task, { workspaceId, ...context });
    const planSummary = steps.map((s) => ({ step: s.step, type: s.type }));

    // Si es dry-run, devolver solo el plan
    if (dryRun) {
      return res.json({
        status: 'dry_run',
        message: 'Plan generado (dry-run, no se ejecutó nada)',
        plan: planSummary
      });
    }

    // 2. CREAR registro de ejecución
    const execution = await prisma.agentExecution.create({
      data: {
        workspaceId,
        task: task.trim(),
        plan: JSON.stringify(planSummary),
        status: 'running'
      }
    });

    // 3. EJECUTAR cada paso
    const stepResults = [];
    let allSuccessful = true;

    for (const step of steps) {
      const result = await executeStep(step, workspaceId);
      stepResults.push({ ...step, result });
      if (!result.success) {
        allSuccessful = false;
        break; // Detener en el primer fallo
      }
    }

    // 4. AUDITAR
    const auditResult = audit(stepResults);

    // 5. ROLLBACK si hubo fallos
    let rollbackResult = null;
    if (!allSuccessful) {
      rollbackResult = await rollback(stepResults);
    }

    // 6. ACTUALIZAR estado de la ejecución
    const finalStatus = allSuccessful ? 'completed' : 'rolled_back';
    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: {
        status: finalStatus,
        result: JSON.stringify({
          steps: stepResults.map((s) => ({
            step: s.step,
            type: s.type,
            success: s.result.success,
            summary: s.result.result
          })),
          audit: auditResult,
          rollback: rollbackResult
        }),
        score: auditResult.score,
        completedAt: new Date()
      }
    });

    // 7. Registrar en audit log
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user?.userId,
        action: 'agent_execution',
        entity: 'agent',
        entityId: execution.id,
        details: JSON.stringify({
          task: task.trim(),
          status: finalStatus,
          steps: steps.length,
          score: auditResult.score,
          verdict: auditResult.verdict
        })
      }
    });

    // 8. RESPONDER
    res.json({
      status: finalStatus,
      executionId: execution.id,
      plan: planSummary,
      steps: stepResults.map((s) => ({
        step: s.step,
        type: s.type,
        success: s.result.success,
        summary: s.result.result
      })),
      audit: auditResult,
      rollback: rollbackResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auto/history
 * Obtiene el historial de ejecuciones del workspace.
 */
exports.history = async (req, res, next) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      throw new AppError('Workspace no identificado', 401, 'NO_WORKSPACE');
    }

    const executions = await prisma.agentExecution.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        task: true,
        status: true,
        score: true,
        createdAt: true,
        completedAt: true
      }
    });

    res.json({ executions });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auto/:id
 * Obtiene detalle de una ejecución específica.
 */
exports.detail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspaceId = req.user?.workspaceId;

    const execution = await prisma.agentExecution.findUnique({ where: { id } });
    if (!execution) {
      throw new AppError('Ejecución no encontrada', 404, 'NOT_FOUND');
    }

    // Verificar propiedad
    if (execution.workspaceId !== workspaceId && req.user?.role !== 'ADMIN') {
      throw new AppError('Acceso denegado', 403, 'FORBIDDEN');
    }

    res.json({
      id: execution.id,
      task: execution.task,
      status: execution.status,
      plan: safeJsonParse(execution.plan),
      result: safeJsonParse(execution.result),
      score: execution.score,
      createdAt: execution.createdAt,
      completedAt: execution.completedAt
    });
  } catch (err) {
    next(err);
  }
};

function safeJsonParse(str, fallback = null) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}
