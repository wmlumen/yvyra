# PRD — EnlaceHub

## Visión

Una cuenta empieza con un árbol de enlaces y recibe un subdominio propio. Desde ese espacio genera su presencia digital: clasificados y una miniweb HTML básica. El árbol es la URL principal para compartir por WhatsApp y otros canales.

## Usuarios

Creadores, profesionales, pequeños negocios y organizaciones que necesitan publicar enlaces, servicios, anuncios y una web sencilla sin programar.

## Espacio del usuario

Ejemplo para `orlando.enlacehub.com`:

1. `/`: árbol principal, identidad y acceso a los demás recursos.
2. `/clasificados`: catálogo público, buscable y ordenable.
3. `/web`: presentación, servicios, contacto y anuncios destacados.
4. `/s/{slug}`: enlaces cortos medibles.

## Alcance de la demo

- Gestión local del árbol.
- Selección y validación local de un subdominio.
- Vista previa de las URLs que se crearían en producción.
- Clasificados locales con búsqueda, filtros y orden.
- Miniweb editable y exportable como HTML.
- Enlace compartible por WhatsApp con atribución de campaña.
- Analíticas locales de vistas y clics.
- Acortador demostrativo.

## Requisitos de producción prioritarios

- Autenticación y aislamiento multi-tenant.
- DNS y TLS comodín.
- Reserva atómica de subdominios y resolución por host.
- Búsqueda indexada y paginada.
- Moderación y denuncia de anuncios.
- Almacenamiento de imágenes.
- Eventos analíticos con controles antiabuso.
- Despliegue estático mediante proveedor seguro.

## No objetivos

- Generar visitas falsas, bots o clics automáticos.
- Envío masivo no autorizado por WhatsApp.
- Procesar pagos en el MVP.
- Ofrecer dominios de pago como si fueran gratuitos.
- Permitir subdominios que suplanten soporte, administración o infraestructura.

## Criterios de aceptación de la demo

- Se puede editar y abrir el árbol.
- Se puede definir un subdominio válido y ver las tres URLs resultantes.
- Se rechazan nombres reservados o inválidos.
- Se puede crear, buscar, ordenar y contactar desde un clasificado.
- Se puede editar la miniweb y descargar `index.html`.
- Se puede generar un enlace con `src=whatsapp` y campaña.
- Solo una carga real de página incrementa las visitas atribuidas.
- Las pruebas automatizadas pasan.
