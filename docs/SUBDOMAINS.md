# Subdominios por usuario

## Objetivo

Cada cuenta recibe un espacio público estable bajo el dominio de la plataforma. Para una cuenta con el nombre `orlando` y el dominio base `enlacehub.com`, las URLs son:

- Árbol: `https://orlando.enlacehub.com/`
- Clasificados: `https://orlando.enlacehub.com/clasificados`
- Miniweb: `https://orlando.enlacehub.com/web`
- Enlace corto: `https://orlando.enlacehub.com/s/oferta`

El subdominio identifica al `Workspace`; las rutas identifican el producto dentro de ese espacio.

## Alta y reserva

1. Proponer un nombre a partir del nombre, negocio o identificador del usuario.
2. Normalizar a minúsculas ASCII, números y guiones.
3. Exigir entre 3 y 48 caracteres, sin guion inicial o final.
4. Rechazar nombres reservados, prefijos `xn--` y términos de infraestructura.
5. Reservar en el servidor mediante una transacción y una restricción `UNIQUE`.
6. Guardar un evento de auditoría.
7. Crear las URLs del árbol, clasificados y miniweb.

La comprobación visual de “disponible” nunca sustituye la reserva atómica. Dos solicitudes simultáneas deben producir un solo ganador.

## Modelo sugerido

```text
Workspace
  id
  owner_id
  primary_subdomain_id

SubdomainReservation
  id
  workspace_id
  label UNIQUE
  status: active | redirect | cooling_down | blocked
  previous_label
  redirect_until
  released_at
  created_at
  updated_at

DomainMapping
  id
  workspace_id
  hostname UNIQUE
  type: platform_subdomain | custom_domain
  verification_status
  certificate_status
  canonical
```

## Resolución del tenant

1. Leer el host normalizado de la petición.
2. Eliminar el puerto y convertirlo a minúsculas.
3. Validar que pertenezca al dominio base o a un dominio propio verificado.
4. Consultar `DomainMapping` o una caché derivada.
5. Resolver el `workspace_id`.
6. Rechazar hosts desconocidos antes de ejecutar consultas de dominio.
7. Aplicar autorización adicional en operaciones privadas.

Nunca se debe confiar en un `workspaceId`, `ownerId` o subdominio enviado libremente por el navegador para autorizar datos.

## DNS y TLS

En producción se requiere:

- Registro DNS comodín `*.enlacehub.com` dirigido al frontend o proxy.
- Certificado TLS comodín `*.enlacehub.com` o certificados administrados por el proveedor.
- Registro separado para el dominio raíz `enlacehub.com`.
- Protección y validación del encabezado `Host` en el proxy y la aplicación.

El comodín cubre `usuario.enlacehub.com`, pero no subdominios anidados como `tienda.usuario.enlacehub.com`. Por eso el diseño usa rutas internas.

## Cookies y seguridad

- Preferir cookies de sesión host-only, sin atributo `Domain`, para evitar que un subdominio lea sesiones de otro.
- No permitir JavaScript aportado por usuarios.
- Aplicar CSP, X-Content-Type-Options, Referrer-Policy y límites de carga.
- Bloquear nombres que puedan confundirse con soporte, pagos, administración o infraestructura.
- Detectar abuso, phishing y contenido prohibido.
- Mantener nombres liberados en enfriamiento para reducir suplantaciones.
- Evitar que un dominio propio eliminado quede apuntando a recursos reclamables por terceros.

## Cambio de subdominio

- Comprobar y reservar primero el nombre nuevo.
- Cambiar la URL canónica dentro de una transacción.
- Mantener el nombre anterior como redirección temporal.
- Establecer un límite y periodo de enfriamiento para cambios.
- Actualizar sitemap, enlaces de WhatsApp y códigos QR.
- Registrar el cambio en auditoría.

## Desarrollo local

La demo muestra URLs de producción con el dominio reservado `enlacehub.example`. Para probar resolución real por host pueden utilizarse nombres como `orlando.localhost` cuando el entorno lo soporte, o entradas en el archivo hosts apuntando a `127.0.0.1`.

## Dominio propio futuro

Un plan superior puede permitir `micomercio.com`, pero requiere:

- verificación DNS;
- emisión de certificado;
- comprobación periódica de propiedad;
- URL canónica única;
- proceso seguro de desconexión.

El dominio propio no debe describirse como gratuito cuando el usuario necesita comprarlo a un registrador.
