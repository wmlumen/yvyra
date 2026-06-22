# Flujo de Trabajo Paralelo para IAs

Este documento define cómo dos IAs pueden trabajar en paralelo sobre este proyecto sin solaparse, con control de toma de tareas, ayuda cruzada y revisión final.

## Estado actual confirmado

- [x] Backend Node + Express + Prisma operativo en desarrollo.
- [x] Base de datos SQLite en `server/prisma/dev.db`.
- [x] Panel de usuario existente.
- [x] Perfil público con soporte para personalización visual, redes sociales y hojas extra.
- [x] Panel de superadministración disponible en `superadmin.html`.
- [x] Datos de muestra requeridos: 3 perfiles tipo tiktoker y 2 perfiles tipo empresa sembrados en base de datos.
- [x] Usuario administrador creado en base de datos.

## Regla principal

Cada IA trabaja solo en su columna asignada. No puede tocar tareas marcadas como tomadas por la otra IA.

## Marcadores obligatorios

Usar únicamente estos estados en las listas:

- `[ ]` pendiente.
- `[~ IA A]` tomada por IA A.
- `[~ IA B]` tomada por IA B.
- `[x]` terminada y verificada.
- `[!]` bloqueada con nota corta al lado.

## Protocolo de toma de tareas

1. Antes de empezar una tarea, la IA debe cambiarla de `[ ]` a `[~ IA A]` o `[~ IA B]`.
2. Si una tarea ya tiene `[~ IA A]`, IA B no la toca.
3. Si una tarea ya tiene `[~ IA B]`, IA A no la toca.
4. Cuando la tarea esté terminada y revisada, se cambia a `[x]`.
5. Si una tarea queda bloqueada, se marca `[!]` y se agrega una nota breve con el motivo.

## Regla de ayuda cruzada

Si una IA termina toda su columna antes que la otra:

1. Debe ayudar en la columna contraria.
2. Debe empezar desde abajo de la lista de la otra IA.
3. No puede tomar una tarea si ya está marcada como `[~ IA A]` o `[~ IA B]`.
4. Si la última tarea ya está tomada por la otra IA, no debe tocarla; debe subir una posición y buscar la siguiente libre.
5. Si todas las tareas pendientes ya están tomadas, debe pasar a revisión, pruebas y reparación de fallos.

## Regla de revisión final

Cuando una IA termine sus tareas:

1. Debe recorrer todas las casillas del proyecto de arriba hacia abajo.
2. Debe comprobar si el resultado real responde a lo esperado.
3. Si una casilla no cumple, debe repararla antes de seguir.
4. Solo después de corregir, puede continuar con la siguiente casilla.
5. La revisión final no termina hasta que todo lo marcado como `[x]` funcione realmente.

## Separación del trabajo

### IA A: frontend, experiencia pública y paneles

- [x] Revisar y mantener `profile.html`, `dashboard.html`, `superadmin.html` y `assets/styles.css`.
- [x] Mejorar la plantilla visual del perfil.
- [x] Mostrar iconos o accesos directos de redes sociales en la parte superior del perfil.
- [x] Permitir navegación por hojas extra laterales o por scroll vertical.
- [x] Mantener el dashboard de usuario alineado con la personalización visible del perfil.
- [x] Mantener visible y usable el panel de administración de plataforma.
- [x] Verificar que el frontend use datos persistidos desde la base de datos y no dependa de credenciales embebidas.

### IA B: backend, datos, seguridad y persistencia

- [x] Revisar autenticación, JWT y rol de administrador.
- [x] Asegurar que el panel admin use permisos reales desde la base de datos.
- [x] Crear o ajustar semillas para poblar la base de datos.
- [x] Cargar 3 perfiles tipo tiktoker completos.
- [x] Cargar 2 perfiles tipo empresa completos.
- [x] Crear el usuario administrador en la base de datos, sin dejar la contraseña escrita en el código fuente.
- [x] Verificar que todos los perfiles y el admin persistan en la base de datos.
- [x] Reparar cualquier endpoint que impida mostrar bloques, perfiles o paneles.

## Lista de comprobación final del proyecto

- [x] Registro funcional.
- [x] Login funcional.
- [x] Perfil editable.
- [x] Enlaces persistidos.
- [x] Redes sociales visibles arriba del perfil.
- [x] Navegación por hojas extra del perfil.
- [x] Página pública usable.
- [x] Panel de administración disponible.
- [x] Usuario administrador creado en base de datos.
- [x] 3 perfiles de tiktokers cargados.
- [x] 2 perfiles de empresas cargados.
- [x] Datos persistidos en base de datos.
- [x] Pruebas automatizadas ejecutadas.

## Archivos clave para cualquier IA

- `README.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `server/prisma/schema.prisma`
- `server/index.js`
- `server/controllers/`
- `server/routes/`
- `src/`
- `assets/styles.css`

## Ensamblaje

El ensamblaje final consiste en:

1. Confirmar que no hay tareas tomadas por ambas IAs.
2. Confirmar que todas las tareas marcadas como hechas pasan validación real.
3. Ejecutar pruebas frontend y backend.
4. Validar que los datos de demo y el admin existan en la base de datos.
5. Actualizar este documento y `README.md` si cambia el estado real del sistema.
