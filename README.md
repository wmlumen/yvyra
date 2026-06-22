# EnlaceHub SaaS

EnlaceHub es una **Plataforma Full-Stack (SaaS)** para crear un ecosistema digital completo: árbol de enlaces, anuncios clasificados, miniweb para negocios, enlaces cortos, campañas de WhatsApp y analíticas.

## Stack Tecnológico

- **Frontend**: Vanilla JavaScript (ES Modules), CSS Moderno.
- **Backend**: Node.js, Express.js, Helmet (seguridad).
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción).
- **ORM**: Prisma.
- **Seguridad**: JWT en cookies `HttpOnly`, CORS, rate limiting, validación de entrada.
- **Sistema de Agentes**: `.opencode/agent/` con Planificador, Orquestador, Ejecutor y Calidad.

## Características Principales

1. **Arquitectura Multi-Tenant**: Resolución dinámica por subdominio con validación anti-host-injection.
2. **Árbol de Enlaces**: Enlaces con programación, activación/desactivación y reordenación.
3. **Clasificados**: CRUD completo, búsqueda global con filtros, categorías, precios y ubicación.
4. **Miniweb HTML**: Generación de sitio estático desde datos del perfil, con exportación.
5. **Enlaces Cortos**: Slugs personalizados, resolución, clics y analíticas.
6. **Campañas WhatsApp**: Generación de URLs `wa.me` con tracking y atribución.
7. **Analíticas**: Vistas, clics, visitantes únicos, atribución por fuente/campaña, exportación CSV.
8. **Panel de Administración**: Gestión de usuarios, estadísticas globales, auditoría.
9. **Sistema de Agentes**: Flujo `/auto` con planificación, ejecución, auditoría y rollback.

---

## Cómo ejecutar el proyecto localmente

### 1. Backend (API)

```bash
cd server
npm install
npx prisma db push
node index.js
# Backend en http://localhost:3000
```

### 1.1. Cargar datos de demostración y administrador

```bash
cd server
set SHOWCASE_PASSWORD=TuClaveDemoSegura
node scripts/seed-showcase.js
node scripts/seed-admin.js <email> <password> [name]
```

Notas:

- `seed-showcase.js` crea 3 perfiles tipo tiktoker y 2 perfiles tipo empresa.
- `seed-showcase.js` usa `SHOWCASE_PASSWORD` si quieres asignar una clave común a esos perfiles; si no existe, genera credenciales aleatorias y no las deja escritas en el código.
- `seed-admin.js` crea o asciende un usuario administrador en base de datos.
- Las credenciales del administrador deben generarse y cargarse en la base de datos; no deben quedar escritas en el código fuente.

### 2. Frontend (Cliente)

```bash
# En la raíz del proyecto
python -m http.server 8081
# Frontend en http://localhost:8081
```

### 3. Inicio rápido

```bash
npm run dev:all  # Inicia frontend y backend simultáneamente
```

### 4. Modo prueba en GitHub

- El repositorio incluye CI en [`.github/workflows/ci.yml`](/C:/Users/HP%20250%20G10/Documents/GITHUT/Arbol-Clasificado/.github/workflows/ci.yml).
- Cada `push` o `pull request` ejecuta pruebas de frontend y backend automáticamente.
- La misma workflow publica GitHub Pages en `main` o `master` con el frontend estático.
- Usa `github-pages.html` como punto de entrada para conectar la demo a un backend real pasando `?api=https://tu-backend/api` o definiendo `window.ENLACEHUB_API_URL`.
- Esto deja el proyecto operativo en modo de prueba para validación continua y demo pública del frontend, aunque el backend productivo deba desplegarse aparte.

---

## APIs disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/workspace/public` | Perfil público (por subdominio) |
| GET | `/api/blocks` | Bloques públicos del árbol |
| GET/POST | `/api/blocks/me` | CRUD de bloques (autenticado) |
| GET/POST | `/api/links` | CRUD de enlaces cortos |
| GET | `/api/links/:slug` | Resolver enlace corto (público) |
| POST | `/api/analytics/event` | Registrar evento analítico |
| GET | `/api/analytics` | Obtener analytics agregados |
| GET | `/api/analytics/csv` | Exportar analytics a CSV |
| POST | `/api/whatsapp/campaign` | Generar URL de campaña WhatsApp |
| POST | `/api/whatsapp/contact` | Registrar contacto WhatsApp |
| GET | `/api/whatsapp/stats` | Estadísticas de campañas |
| GET | `/api/classifieds/search` | Buscador global de clasificados |
| GET | `/api/admin/stats` | Estadísticas de administración |
| GET | `/api/health` | Health check del servidor |
| GET | `/api/agent/health` | Health check del sistema de agentes |

## Sistema de Agentes

El proyecto incluye un sistema de agentes en `.opencode/agent/`:

- **Planificador**: Analiza requisitos y genera planes de implementación.
- **Orquestador**: Coordina el flujo automático (`/auto`, `/status`, `/rollback`).
- **Ejecutor**: Implementa cambios siguiendo el plan con prechecks y snapshots.
- **Calidad**: Audita código, pruebas, seguridad y documentación con scoring.

Ver `.opencode/agent/Orquestador-agent.md` para la documentación del comando `/auto`.

## Trabajo paralelo entre IAs

Para coordinación entre dos IAs sin solaparse, usar obligatoriamente:

- [docs/AI_PARALLEL_WORKFLOW.md](/C:/Users/HP%20250%20G10/Documents/GITHUT/Arbol-Clasificado/docs/AI_PARALLEL_WORKFLOW.md)

Ese documento define:

- separación exacta entre `IA A` y `IA B`;
- reglas de toma de tareas;
- ayuda cruzada empezando desde abajo de la lista;
- prohibición de tocar tareas ya tomadas por la otra IA;
- revisión final con reparación inmediata si algo no responde como se esperaba.

## Pruebas

```bash
npm test          # Tests del frontend (24 tests)
npm run test:server  # Tests del backend
```

## Panel de administración

- UI: `superadmin.html`
- API: rutas `/api/admin/*`
- Requiere usuario con `role=ADMIN` emitido dentro del JWT al iniciar sesión.

## Seguridad

- Validación de host contra lista blanca de dominios.
- Rate limiting en memoria.
- Sanitización de entrada (eliminación de XSS).
- Helmet para cabeceras HTTP seguras.
- Cookies HttpOnly y SameSite.
- Auditoría de acciones críticas.
- Sin secretos en el código.

---

*Desarrollado según `PROMPT_MAESTRO.md`.*
