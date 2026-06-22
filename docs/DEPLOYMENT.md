# Despliegue

## Dominio y subdominios

Configura un dominio base, por ejemplo `enlacehub.com`, y dirige tanto el dominio raíz como `*.enlacehub.com` al frontend o proxy. Habilita TLS para ambos.

Variables sugeridas:

```env
PUBLIC_APP_URL=https://enlacehub.com
BASE_DOMAIN=enlacehub.com
TRUSTED_HOSTS=enlacehub.com,*.enlacehub.com
SESSION_COOKIE_SECURE=true
```

El proxy debe rechazar encabezados `Host` fuera de la lista autorizada. La aplicación resuelve el tenant mediante `DomainMapping`; nunca concatena el host sin validación.

## Publicación de miniwebs

### Modos

1. **Alojamiento interno:** servir `https://{usuario}.enlacehub.com/web` desde la aplicación.
2. **Exportación:** descargar un paquete HTML estático.
3. **Proveedor externo:** desplegar desde el backend mediante un adaptador.

### Adaptador recomendado

```ts
interface DeploymentProvider {
  deploy(input: { siteId: string; files: StaticFile[]; version: string }): Promise<DeploymentResult>;
  getStatus(deploymentId: string): Promise<DeploymentStatus>;
  remove(deploymentId: string): Promise<void>;
}
```

La implementación debe usar credenciales del servidor, idempotencia, límites por usuario, colas de trabajo y registro de auditoría.

## Reglas

- Nunca aceptar ni guardar tokens en `localStorage`.
- No permitir nombres de archivos arbitrarios o rutas `../`.
- Escapar todo contenido aportado por usuarios.
- Limitar tamaño y cantidad de activos.
- Mantener versiones para volver a desplegar.
- Preferir cookies host-only para aislar subdominios.
- No prometer dominio personalizado gratuito: el subdominio puede incluirse, pero comprar un dominio normalmente no es gratis.
