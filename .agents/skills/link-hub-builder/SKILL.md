---
name: link-hub-builder
description: Diseña, implementa, prueba y audita plataformas multiusuario cuyo núcleo es un árbol de enlaces con subdominio propio, clasificados, miniweb HTML, WhatsApp y analíticas reales.
version: 2.1.0
language: es
---

# Link Hub Builder

## Cuándo usar este skill

Úsalo cuando la tarea implique crear o ampliar un árbol “link in bio”, subdominios por usuario, un sistema de clasificados, un constructor de miniweb, enlaces para WhatsApp, acortadores, buscadores o analíticas de conversión.

## Principio del producto

El árbol es la identidad y el generador principal de rutas. Cada cuenta puede publicar, como recursos separados pero conectados:

- árbol público;
- clasificados propios;
- miniweb HTML básica;
- enlaces cortos y campañas de WhatsApp;
- un subdominio estable que agrupa todos esos recursos.

## Resultado esperado

Entregar una solución original, multi-tenant, accesible, segura y verificable. No reproducir marcas, textos, activos ni diseño distintivo de terceros. No generar ni simular tráfico falso.

## Flujo de trabajo

### 1. Descubrimiento

- Inspeccionar la carpeta objetivo y preservar el trabajo existente.
- Identificar stack, convenciones, scripts, despliegue y restricciones.
- Registrar supuestos y decisiones.
- Definir qué contenido es privado, borrador, público, archivado o moderado.

### 2. Modelo multiusuario

Todo recurso debe tener propietario y ámbito:

- `User` y, si corresponde, `Workspace`.
- `Profile`, `BioBlock`, `Classified`, `MiniSite`, `ShortLink`, `Deployment` y eventos.
- Índices compuestos por propietario y slug.
- Autorización en servidor para cada lectura o escritura privada.
- Directorios globales solo con contenido explícitamente público y aprobado.

### 3. Subdominios y rutas recomendadas

Para un dominio base `plataforma.com`:

- `https://{subdomain}.plataforma.com/`: árbol.
- `https://{subdomain}.plataforma.com/clasificados`: clasificados del usuario.
- `https://{subdomain}.plataforma.com/web`: miniweb.
- `https://{subdomain}.plataforma.com/s/{shortSlug}`: redirección corta.
- `https://plataforma.com/clasificados`: buscador global opcional.

Resolver el tenant desde un mapa validado de `Host` a `Workspace`. Rechazar hosts desconocidos. Usar reserva atómica y restricción única para impedir duplicados. Reservar nombres del sistema, preferir cookies host-only y documentar DNS/TLS comodín. Las rutas `/u/{slug}` pueden mantenerse temporalmente como alias canónicos durante una migración.

### 4. Gestión del subdominio

- Proponer un nombre normalizado durante el alta.
- Validar una sola etiqueta DNS de 3 a 48 caracteres.
- Rechazar palabras reservadas, prefijos `xn--`, guiones iniciales/finales y nombres confusos de infraestructura.
- Comprobar disponibilidad en servidor dentro de una transacción.
- Registrar asignación, cambios, liberación, redirecciones y auditoría.
- Aplicar enfriamiento a nombres liberados para reducir suplantación.
- Proteger contra `Host` injection, takeover y cookies compartidas accidentalmente.
- Preparar `DomainMapping` para dominios propios verificados, sin confundirlos con el subdominio gratuito.

### 5. Clasificados

Implementar publicación, edición, pausa, renovación, vencimiento y archivo. Indexar título, descripción, categoría, etiquetas y ubicación. Permitir filtros y orden por relevancia, fecha y precio. La relevancia debe basarse en texto y señales legítimas, nunca en clics fabricados. Añadir moderación, denuncias, categorías prohibidas y auditoría.

### 6. WhatsApp y campañas

- Generar un enlace al árbol con origen, medio y campaña.
- Crear un mensaje prellenado mediante URL oficial `wa.me`.
- Registrar `share`, `page_view`, `click` y `contact` como eventos distintos.
- Contar una visita solo al recibir una petición o carga válida.
- Aplicar deduplicación, rate limiting, filtrado de bots y exclusión del entorno de desarrollo.
- No automatizar spam, no enviar mensajes sin consentimiento y no inflar métricas.

### 7. Miniweb HTML

- Editor sin código con identidad, descripción, servicios, contacto y CTA.
- Renderizado seguro: escapar contenido y prohibir scripts suministrados por usuarios.
- Publicación bajo la plataforma y exportación estática.
- Adaptador `DeploymentProvider` para publicar en un proveedor externo.
- Mantener tokens únicamente en servidor; nunca en JavaScript público o `localStorage`.
- Registrar despliegues, versiones, errores y URL resultante.

### 8. Analíticas

Separar eventos append-only de agregados. Evitar IP completa; usar agregación temprana o identificadores rotatorios. Incluir origen, medio y campaña validados. Mostrar visitas, clics, contactos y conversiones. Marcar claramente datos semilla o demostrativos.

### 9. Seguridad

- Aceptar únicamente protocolos permitidos.
- Normalizar slugs y rechazar palabras reservadas.
- Verificar propiedad de recursos en servidor.
- Sanitizar o evitar HTML enriquecido.
- Proteger carga de imágenes, redirecciones y despliegues frente a SSRF y abuso.
- Rate limiting en publicación, búsqueda, eventos, contacto y despliegue.
- Secretos solo mediante entorno o almacén cifrado.

### 10. Accesibilidad y rendimiento

Navegación por teclado, foco lógico, etiquetas, contraste WCAG 2.2 AA, objetivos táctiles, movimiento reducido, HTML semántico, carga diferida de imágenes y páginas estáticas rápidas.

### 11. Verificación

Ejecutar instalación, lint, formato, tipos, pruebas unitarias, integración, E2E, compilación y auditoría de dependencias según el stack. Casos mínimos:

- aislamiento entre dos usuarios;
- reserva concurrente del mismo subdominio;
- rechazo de hosts desconocidos y nombres reservados;
- resolución correcta de árbol, clasificados y miniweb por `Host`;
- búsqueda y ordenamiento de anuncios;
- caducidad y moderación;
- generación de enlace WhatsApp con campaña;
- atribución de una visita real a WhatsApp;
- rechazo de métricas o eventos abusivos;
- creación, vista previa y exportación de miniweb;
- despliegue simulado con proveedor intercambiable;
- redirección corta y URL peligrosa rechazada.

## Documentación obligatoria

`README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/SECURITY.md`, `docs/SEARCH.md`, `docs/DEPLOYMENT.md`, `docs/SUBDOMAINS.md` y `docs/DECISIONS.md`.

## Definición de terminado

Una función está terminada solo cuando el flujo se ejecutó, la autorización y validaciones funcionan, las pruebas relevantes pasan, las métricas no pueden inflarse trivialmente y la documentación fue actualizada.
