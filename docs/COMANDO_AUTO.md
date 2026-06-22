# Comando `/auto` — Flujo de Ejecución Automática

## Descripción

El comando `/auto` es la interfaz principal del **Orquestador** para ejecutar el ciclo completo de desarrollo asistido: planificar, ejecutar, auditar y decidir.

## Sintaxis

```
/auto [--fase <nombre>] [--skip-plan] [--skip-audit]
```

### Parámetros

| Parámetro | Descripción |
|-----------|-------------|
| `--fase <nombre>` | Ejecuta solo una fase específica del plan. |
| `--skip-plan` | Omite la fase de planificación y usa el plan existente. |
| `--skip-audit` | Omite la auditoría (útil para iteraciones rápidas). |

## Flujo

```
[Usuario] ──(/auto)──> [Orquestador]
                          │
                          ├── 1. Planificar
                          │      └── Planificador genera/actualiza IMPLEMENTATION_PLAN.md
                          │
                          ├── 2. Ejecutar
                          │      ├── Prechecks (git status, deps, DB, tests)
                          │      ├── Snapshot (DB dump + git diff)
                          │      └── Implementar tareas del plan
                          │
                          ├── 3. Auditar (si no se saltó)
                          │      ├── Calidad revisa: tests, código, seguridad, docs
                          │      └── Genera score 0.0 - 1.0
                          │
                          └── 4. Decidir
                                 ├── Score >= 0.75 → Confirmar cambios
                                 └── Score < 0.75  → Rollback automático
```

## Fases disponibles

Las fases se definen en `docs/IMPLEMENTATION_PLAN.md`. Cada fase es un conjunto de tareas verificables.

### Fase 1: Fundación
- Modelo de datos completo (User, Workspace, DomainMapping, TreeBlock, Classified, ShortLink, AnalyticsEvent, AuditLog)
- API REST básica (auth, workspace, blocks, classifieds)
- Frontend HTML con los módulos principales

### Fase 2: Enlaces cortos y analytics
- API de enlaces cortos (CRUD + resolución pública)
- API de analytics (registro de eventos + consultas agregadas)
- Almacenamiento de atribución (src, medium, campaign)

### Fase 3: Campañas WhatsApp
- Generación de URLs `wa.me` con tracking
- Registro de eventos de WhatsApp (share, contact, visita)
- Estadísticas de campañas

### Fase 4: Miniweb y despliegue
- Constructor de miniweb HTML desde perfil
- Exportación de paquete estático
- API de despliegue (Cloudflare Pages, etc.)

### Fase 5: Seguridad y calidad
- Rate limiting
- Validación de entrada (sanitización, XSS prevention)
- Helmet (cabeceras HTTP seguras)
- Validación de host (anti host-injection)
- Tests unitarios y de integración

### Fase 6: Sistema de agentes
- Agentes Planificador, Orquestador, Ejecutor, Calidad
- Health checks (`/api/agent/health`)
- Protocolo de rollback
- Scoring de auditoría

## Estados

```
state.json
{
  "currentPhase": "ejecutar",      // idle | planificar | ejecutar | auditar | decidir | rollback
  "lastTask": "implementar-api-enlaces-cortos",
  "auditScore": 0.92,
  "timestamp": "2026-06-21T19:00:00Z",
  "lastRollback": null,
  "phasesCompleted": ["Fase 1", "Fase 2"],
  "tasksCompleted": [
    "modelo-de-datos",
    "api-auth",
    "api-enlaces-cortos"
  ]
}
```

## Health Check

```bash
curl http://localhost:3000/api/agent/health
# Respuesta:
# {
#   "status": "healthy",
#   "checks": {
#     "database": true,
#     "server": true,
#     "timestamp": "2026-06-21T19:00:00Z"
#   },
#   "version": "1.1.0"
# }
```

## Protocolo de Rollback

1. El Ejecutor guarda snapshot antes de cada cambio crítico:
   - Dump DB: `.opencode/agent/patches/{task-id}/db.sql`
   - Diff: `.opencode/agent/patches/{task-id}/diff.patch`
2. Si la auditoría falla (score < 0.75):
   - Restaurar DB desde dump
   - Revertir cambios con `git apply -R`
   - Registrar en `.opencode/agent/logs/rollback.log`
3. El Orquestador actualiza `state.json` con `lastRollback`.

## Logs

```
.opencode/agent/logs/
├── execution.log     # Registro de cada tarea ejecutada
└── rollback.log      # Registro de rollbacks ejecutados

.opencode/agent/reports/
└── audit-{timestamp}.json   # Informe de auditoría de Calidad
```
