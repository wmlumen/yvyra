# Arquitectura

## Demo local

- `src/core.mjs`: estado, validación, enlaces, clasificados, atribución, subdominios y generador HTML.
- `src/public.mjs`: árbol, enlaces cortos y compartir por WhatsApp.
- `src/dashboard.mjs`: edición del árbol, campañas, métricas y vista previa de URLs por subdominio.
- `src/classifieds*.mjs`: listado y administración de anuncios.
- `src/miniweb*.mjs`: constructor, exportación y página pública.
- `localStorage`: persistencia del prototipo.

La demo no configura DNS. El panel genera una representación segura del espacio público usando `usuario.enlacehub.example` y abre los archivos locales equivalentes.

## Espacio público del usuario

Para el tenant `orlando`:

```text
orlando.enlacehub.com/                 árbol principal
orlando.enlacehub.com/clasificados     clasificados
orlando.enlacehub.com/web              miniweb
orlando.enlacehub.com/s/{slug}         enlaces cortos
```

Un subdominio identifica una cuenta; las rutas identifican los módulos. Esto evita subdominios anidados y simplifica DNS, TLS, SEO y soporte.

## Flujo WhatsApp

1. El panel genera la URL del árbol con `src`, `medium` y `campaign`.
2. `wa.me` abre un mensaje prellenado.
3. Compartir registra `whatsapp_share`, pero no una visita.
4. Cuando un destinatario abre la URL, la página registra `page_view` con atribución.
5. Los clics posteriores conservan la atribución.

## Arquitectura de producción

### Resolución multi-tenant por host

El proxy acepta únicamente el dominio raíz, el comodín autorizado y dominios propios verificados. La aplicación normaliza `Host`, consulta `DomainMapping` y obtiene el `workspace_id`. Un host desconocido recibe error sin consultar datos de otro tenant.

Cada tabla de dominio incluye `owner_id` o `workspace_id`. Las mutaciones privadas exigen sesión y autorización de propiedad. La selección del tenant por host no sustituye la autorización.

### Reserva de subdominios

`SubdomainReservation.label` tiene índice único. La reserva ocurre dentro de una transacción. Los cambios mantienen redirección temporal, auditoría y enfriamiento del nombre anterior. Consulta `docs/SUBDOMAINS.md`.

### Búsqueda

PostgreSQL full-text o un motor dedicado indexa anuncios públicos y aprobados. El índice incluye texto, categoría, etiquetas, ubicación, precio, fechas y propietario. La API aplica filtros permitidos y orden estable.

### Analítica

Los eventos ingresan por un endpoint con rate limiting, validación, detección de bots, deduplicación y retención. Los informes consultan agregados; no se confía en contadores enviados por el cliente.

### Miniweb y despliegue

Un generador produce archivos estáticos desde datos validados. Un contrato `DeploymentProvider` permite publicar en Cloudflare Pages, Netlify u otro proveedor. Los tokens viven en secretos de servidor. `Deployment` registra versión, estado, URL y errores.

### Seguridad

Validación de URL, protección SSRF, sanitización, CSP, políticas de contenido, carga segura de imágenes, límites de tasa, auditoría, aislamiento de cookies, validación del host, separación de borradores y moderación de clasificados.
