# Prompt maestro: árbol de enlaces, clasificados, miniweb y subdominios multiusuario

Copia este prompt en tu agente de desarrollo. Sustituye las variables entre `{{...}}` antes de ejecutarlo.

---

## Rol

Actúa como un equipo senior compuesto por Product Manager, UX/UI Designer, arquitecto full-stack, especialista en seguridad, buscadores, analítica, QA y DevOps. Debes diseñar e implementar una plataforma multiusuario original cuyo producto central sea un árbol de enlaces y que genere, para cada cuenta, un sitio de clasificados y una miniweb HTML sencilla. Usa únicamente patrones funcionales generales de los siguientes materiales de referencia:

- Artículo sobre cómo crear y usar un árbol de enlaces: `https://blog.teaming.net/es/como-crear-y-usar-un-arbol-de-enlaces/`
- Producto de referencia funcional: `https://linkayi.com/`

No copies marca, textos, código, recursos gráficos, estructura exacta, estilos distintivos ni identidad visual de terceros. El resultado debe ser una solución propia, con nombre, diseño, componentes y redacción originales.

## Variables de entrada

- Carpeta objetivo: `{{TARGET_DIR}}`
- Nombre del proyecto: `{{PROJECT_NAME}}`
- Nombre comercial provisional: `{{BRAND_NAME}}`
- Idioma principal: `{{LANGUAGE=es}}`
- Mercado o público: `{{TARGET_AUDIENCE=creadores, profesionales, pequeños negocios y ONG}}`
- Stack preferido: `{{STACK=elige una opción moderna y estable; justifica la decisión}}`
- Base de datos: `{{DATABASE=PostgreSQL o equivalente}}`
- Proveedor de despliegue: `{{DEPLOY_TARGET=Vercel, Cloudflare, Render u otro}}`
- Dominio base de la plataforma: `{{BASE_DOMAIN=tuplataforma.com}}`
- Autenticación: `{{AUTH_PROVIDER=credenciales + OAuth opcional}}`

## Objetivo

Construye en `{{TARGET_DIR}}` un MVP funcional, seguro, responsive y documentado que permita:

1. Crear para cada usuario un árbol de enlaces que funcione como identidad y generador principal de URLs.
2. Reservar un subdominio único por usuario, por ejemplo `orlando.{{BASE_DOMAIN}}`.
3. Generar dos sitios públicos separados pero conectados a la misma cuenta: el árbol y los clasificados del usuario.
4. Crear adicionalmente una miniweb HTML básica y gratuita desde los datos del árbol.
5. Administrar enlaces, anuncios, contenido web y llamadas a la acción desde un panel privado.
6. Compartir el árbol por WhatsApp mediante enlaces de campaña que midan únicamente tráfico real.
7. Crear URLs cortas con slug automático o personalizado.
8. Medir visitas y clics con analíticas respetuosas de la privacidad y atribución por origen.
9. Personalizar la apariencia sin necesidad de programar.
10. Publicar una versión lista para pruebas y despliegue.

## Arquitectura conceptual obligatoria

El árbol es el recurso principal de cada cuenta. Cada cuenta recibe un subdominio único y estable. Usa URLs equivalentes a:

- `https://{subdomain}.{{BASE_DOMAIN}}/`: árbol principal.
- `https://{subdomain}.{{BASE_DOMAIN}}/clasificados`: clasificados creados por ese usuario.
- `https://{subdomain}.{{BASE_DOMAIN}}/web`: miniweb básica generada desde su perfil.
- `https://{subdomain}.{{BASE_DOMAIN}}/s/{shortSlug}`: enlace corto y medible del usuario.
- `https://{{BASE_DOMAIN}}/clasificados`: directorio global opcional.

La aplicación debe resolver el tenant por el encabezado `Host`, no por datos enviados libremente por el cliente. Todos los recursos deben pertenecer a un `User` o `Workspace`. Ningún usuario puede leer borradores, editar anuncios ni consultar analíticas privadas de otra cuenta. Mantén rutas antiguas como alias con redirección canónica durante una migración.

## Antes de escribir código

1. Inspecciona la carpeta objetivo y conserva cualquier trabajo existente.
2. Si hay archivos incompatibles, no los elimines sin respaldo; documenta el conflicto.
3. Crea un archivo `docs/DECISIONS.md` con las decisiones técnicas y sus motivos.
4. Crea un skill reutilizable en `.agents/skills/link-hub-builder/SKILL.md` que describa cómo construir, ampliar, probar y auditar este tipo de producto.
5. Define el alcance del MVP y separa claramente las funciones futuras.
6. Genera un plan de implementación por fases y ejecútalo sin detenerte a pedir confirmación, salvo que una acción pueda destruir datos.

## Requisitos funcionales obligatorios

### A. Página pública de bio

- URL pública mediante subdominio único, por ejemplo `orlando.{{BASE_DOMAIN}}`.
- Foto o avatar, nombre, identificador, descripción breve y etiqueta opcional.
- Lista ilimitada a nivel de modelo, con límites configurables si el producto lo requiere.
- Tipos de bloque: enlace, encabezado, texto, separador, redes sociales y llamada a la acción.
- Reordenación por arrastrar y soltar o controles accesibles equivalentes.
- Activar, desactivar, archivar y programar fecha de inicio/fin de cada enlace.
- Imagen o icono opcional por enlace.
- Vista previa en tiempo real.
- Botón para compartir y copiar la URL pública.
- Estados vacíos, errores y carga correctamente diseñados.
- SEO básico, Open Graph, favicon y metadatos configurables.

### B. Personalización

- Temas claros, oscuros y de gradiente creados desde cero.
- Variables de marca: colores, tipografía, fondo, radio, sombras y estilo de botones.
- Comprobación automática de contraste WCAG.
- Vista responsive móvil, tableta y escritorio.
- Posibilidad de restablecer el tema.
- Nunca dependas solo del color para comunicar estados.

### C. Panel de control

- Registro, inicio de sesión, recuperación de contraseña y cierre de sesión.
- Perfil y configuración de cuenta.
- CRUD de enlaces y bloques.
- Edición del destino sin cambiar el enlace público.
- Buscador, filtros por estado y ordenamiento.
- Duplicar enlaces.
- Confirmación antes de operaciones destructivas.
- Historial básico o auditoría de cambios relevantes.

### D. Acortador de URLs

- Crear enlace corto desde una URL larga.
- Slug automático seguro y slug personalizado con validación de disponibilidad.
- Redirección rápida y fiable.
- Activar/desactivar y editar destino.
- Fecha de expiración opcional.
- Protección frente a URLs peligrosas, esquemas no permitidos, open redirect y abuso.
- Página de error para slug inexistente, desactivado o expirado.
- Código QR opcional como mejora, sin bloquear el MVP.

### E. Analíticas

- Visitas de página, clics totales y clics por enlace.
- Visitantes únicos mediante método respetuoso de privacidad y documentado.
- Series por día para 7, 30 y 90 días.
- Enlaces de mejor rendimiento.
- Referrer y país solo si se puede hacer legal y proporcionalmente.
- No almacenar datos personales innecesarios.
- Opción para excluir tráfico propio o de desarrollo.
- Exportación CSV como función deseable.

### F. Buenas prácticas de contenido

El producto debe ayudar al usuario a:

- Explicar en pocos segundos quién es y qué ofrece.
- Mantener visibles sus acciones prioritarias.
- Incluir web, donaciones, redes, newsletter, campañas, contacto, blog o tienda según su caso.
- Revisar periódicamente enlaces rotos y contenido obsoleto.
- Identificar mediante analíticas qué enlaces funcionan mejor.


### G. Clasificados multiusuario y buscables

- Cada usuario crea, edita, pausa, renueva, archiva y elimina sus propios anuncios.
- Cada anuncio pertenece al usuario autenticado mediante `ownerId`; la autorización se comprueba siempre en servidor.
- Campos mínimos: título, descripción, categoría, subcategoría, etiquetas, precio, moneda, ubicación, condición, imágenes, contacto, estado, fecha de publicación y vencimiento.
- Página pública separada para los clasificados de cada usuario.
- Directorio global opcional que indexa únicamente anuncios públicos y aprobados.
- Búsqueda por texto completo sobre título, descripción, categorías y etiquetas.
- Filtros por categoría, ubicación, precio, condición, fecha, disponibilidad y usuario.
- Orden por relevancia, recientes, precio ascendente/descendente y popularidad legítima.
- Paginación estable, URLs indexables y metadatos estructurados cuando corresponda.
- Moderación: denuncia, revisión, bloqueo, caducidad, lista de categorías prohibidas y registro de acciones.
- No permitir que la posición de un anuncio se manipule con clics automatizados. Los destacados deben proceder de reglas transparentes, pago legítimo o curación editorial.

### H. WhatsApp y atribución de tráfico real

- Generar enlaces de campaña para el árbol con parámetros equivalentes a `src=whatsapp`, `medium=messaging` y `campaign={slug}`.
- Crear mensajes prellenados y enlaces `wa.me` sin exponer tokens ni usar automatización no autorizada.
- Registrar la visita cuando el navegador carga realmente la página, no cuando se genera o copia el enlace.
- Separar eventos de compartir, visitar, hacer clic y contactar.
- Implementar deduplicación razonable, exclusión de desarrollo y controles contra bots.
- Mostrar visitas provenientes de WhatsApp y conversiones posteriores.
- Respetar consentimiento, privacidad y políticas de Meta/WhatsApp.
- Prohibido generar tráfico falso, bots, auto-recargas, clics sintéticos, compra encubierta de visitas o alteración de métricas.

### I. Constructor de miniweb HTML

- Generar una miniweb sencilla por usuario a partir de su perfil, enlaces, servicios y anuncios destacados.
- Editor sin código para nombre, encabezado, descripción, servicios, contacto, WhatsApp, correo, ubicación y botón principal.
- Vista previa responsive y publicación/despublicación.
- Exportación de un paquete estático con `index.html`, CSS y activos optimizados.
- HTML semántico, accesible, sin scripts de terceros obligatorios y sin contenido ejecutable aportado por el usuario.
- En producción, permitir publicación bajo el subdominio del usuario (`https://{subdomain}.{{BASE_DOMAIN}}/web`) y un conector opcional de despliegue estático.
- Diseñar un `DeploymentProvider` intercambiable. Implementar primero Cloudflare Pages Direct Upload o un proveedor equivalente.
- Las credenciales de despliegue permanecen en servidor, cifradas o como secretos de entorno. Nunca se entregan al navegador.
- Guardar estado, URL, proveedor, fecha, versión, errores y posibilidad de volver a desplegar.
- El dominio personalizado es opcional y nunca debe presentarse como gratuito si el dominio requiere compra.

### J. Subdominio propio por usuario

- Durante el alta, proponer un subdominio basado en el nombre o identificador del usuario.
- Normalizarlo a una sola etiqueta DNS: minúsculas, números y guiones; entre 3 y 48 caracteres; sin guion inicial o final.
- Comprobar disponibilidad en servidor mediante una operación atómica y una restricción única en base de datos.
- Reservar nombres de sistema como `www`, `api`, `admin`, `app`, `mail`, `cdn`, `status`, `support`, `dashboard`, `login` y equivalentes.
- Resolver el `Workspace` exclusivamente desde un mapa validado de host a tenant. Nunca aceptar un `ownerId` del navegador como autorización.
- Configurar DNS comodín `*.{{BASE_DOMAIN}}` y certificado TLS comodín o certificados administrados equivalentes.
- Generar automáticamente las URLs del árbol, clasificados, miniweb y enlaces cortos del usuario.
- Definir URL canónica, Open Graph, sitemap y robots por subdominio. Los borradores no deben indexarse.
- Aislar cookies: preferir cookies host-only para sesión. No compartir cookies sensibles entre todos los subdominios salvo necesidad justificada.
- Proteger contra host-header injection, dominios no reconocidos, takeover, homógrafos, abuso, phishing y contenido prohibido.
- Al cambiar un subdominio, aplicar disponibilidad atómica, periodo de enfriamiento y redirección temporal desde el nombre anterior. No permitir cambios ilimitados.
- Mantener un historial de reservas para evitar suplantaciones después de liberar un nombre.
- Preparar `DomainMapping` para conectar dominio propio en planes futuros mediante verificación DNS; no presentarlo como gratuito cuando requiere comprar un dominio.
- En desarrollo, admitir `usuario.localhost` o un mecanismo equivalente documentado.

## Requisitos no funcionales

- TypeScript estricto si el stack lo soporta.
- Arquitectura modular y nombres claros.
- Validación en cliente y servidor.
- Protección CSRF cuando corresponda, cookies seguras, rate limiting y cabeceras de seguridad.
- Sanitización de contenido y prevención de XSS, SSRF, inyección y abuso del acortador.
- Accesibilidad WCAG 2.2 AA como objetivo.
- Rendimiento móvil: carga rápida, imágenes optimizadas y JavaScript contenido.
- Registro de errores sin filtrar secretos.
- Variables sensibles solo mediante entorno.
- Migraciones de base de datos reproducibles.
- Pruebas unitarias, integración y al menos un flujo E2E crítico.
- Lint, formateo y comprobación de tipos automatizados.

## Modelo de datos mínimo

Diseña entidades equivalentes a:

- `User`
- `Workspace` o equivalente multi-tenant
- `Profile`
- `Theme`
- `BioBlock`
- `ShortLink`
- `ClickEvent`
- `PageViewEvent`
- `Classified`
- `ClassifiedImage`
- `MiniSite`
- `Deployment`
- `SavedSearch` como evolución
- `Report` o denuncia
- `AuditEvent`
- `SubdomainReservation`
- `DomainMapping`

Incluye índices, restricciones únicas, borrado lógico cuando convenga y política de retención para eventos analíticos.

## API o acciones del servidor

Define contratos para:

- autenticación y sesión;
- lectura y edición del perfil;
- CRUD y reordenación de bloques;
- creación y gestión de enlaces cortos;
- resolución de slugs;
- registro de vistas y clics;
- consulta de analíticas agregadas;
- comprobación de disponibilidad de slug;
- comprobación y reserva atómica de subdominio;
- resolución interna del tenant por host;
- cambio de subdominio con redirección y auditoría.

Documenta códigos de respuesta, validaciones y manejo de errores.

## Diseño UX

Crea una identidad visual original. El panel debe priorizar:

1. “Mi árbol”.
2. “Mis clasificados”.
3. “Mi miniweb”.
4. “Compartir por WhatsApp”.
5. “Enlaces cortos”.
6. “Analíticas”.
7. “Apariencia”.
8. “Configuración”.

La interfaz debe usar lenguaje claro en español, controles táctiles adecuados, navegación por teclado y mensajes de error accionables. Evita patrones oscuros, métricas falsas y afirmaciones no verificables.

## Estructura de entregables

Dentro de `{{TARGET_DIR}}`, crea como mínimo:

```text
README.md
.env.example
package.json o equivalente
src/
tests/
docs/
  PRD.md
  ARCHITECTURE.md
  API.md
  SECURITY.md
  DECISIONS.md
  SUBDOMAINS.md
.agents/skills/link-hub-builder/
  SKILL.md
  references/
```

Incluye datos semilla y una cuenta de demostración solo para entorno local, claramente marcada y sin secretos reales.

## Criterios de aceptación

El trabajo no se considera terminado hasta que:

- El proyecto instala y arranca con los comandos documentados.
- Un usuario puede crear y editar su página pública.
- Los enlaces pueden reordenarse, desactivarse y programarse.
- Un clic válido queda reflejado en analíticas.
- Una visita real con `src=whatsapp` queda atribuida a WhatsApp sin inflar métricas.
- Cada usuario puede crear anuncios, buscarlos, filtrarlos y ordenarlos sin acceder a datos de otra cuenta.
- Se genera una miniweb visible y un archivo HTML exportable.
- Cada cuenta obtiene un subdominio único que sirve el árbol, `/clasificados` y `/web`.
- Dos altas simultáneas no pueden reservar el mismo subdominio.
- Un host desconocido no puede resolver datos de otro usuario.
- Se puede crear y resolver un enlace corto.
- Los slugs duplicados y URLs inválidas se rechazan.
- La página pública funciona con teclado y lector de pantalla en sus flujos básicos.
- No hay secretos incluidos en el repositorio.
- Las pruebas principales pasan.
- El README contiene instalación, ejecución, pruebas, arquitectura y despliegue.

## Forma de trabajo obligatoria

1. Presenta un inventario inicial de la carpeta.
2. Escribe el plan en `docs/IMPLEMENTATION_PLAN.md`.
3. Implementa por fases pequeñas y verificables.
4. Después de cada fase, ejecuta pruebas, lint y typecheck disponibles.
5. Corrige los fallos antes de continuar.
6. No dejes pseudocódigo en funciones críticas.
7. No declares una función terminada si no fue ejecutada o verificada.
8. Al finalizar, entrega un resumen con:
   - archivos creados y modificados;
   - decisiones importantes;
   - comandos ejecutados;
   - resultados de pruebas;
   - limitaciones conocidas;
   - siguientes pasos priorizados.

## Restricciones legales y éticas

- No hagas scraping de cuentas privadas ni recopiles datos sin base legal.
- No copies la apariencia exacta, textos comerciales, logotipos ni activos de los sitios de referencia.
- Implementa mecanismos de denuncia y desactivación para enlaces abusivos como evolución prioritaria.
- Documenta privacidad, retención de datos y eliminación de cuenta.
- Evita presentar el producto como afiliado a las marcas de referencia.
- No implementes tráfico falso, granjas de clics, bots de visitas ni manipulación de posiciones o analíticas.
- Las métricas de demostración deben estar marcadas como datos semilla, nunca como actividad real.
- No automatices mensajes masivos de WhatsApp ni eludas consentimiento o límites de la plataforma.

Comienza ahora en `{{TARGET_DIR}}`. Si no se especificó una variable, elige una opción razonable, regístrala en `docs/DECISIONS.md` y continúa.
