# Contrato del backend para GMS Frontend

Este documento describe la API que consume el frontend. La fuente de verdad es el backend **Gym Back** (`/home/workspace/gms-backend`).

## 1. Arquitectura

- **Sitio**: marca global. Configuración, tema, landing y multimedia no tienen `branch_id`.
- **Sucursal**: ubicación operativa. Todos los recursos de negocio usan `branchId`.
- **Una sola landing pública**: `GET /api/v1/public/site`. No hay `/g/:slug`.
- **Autenticación**: JWT de acceso + refresh token rotativo.
- **Kiosco**: se identifica por el código de sucursal, no por una landing.

## 2. Autenticación

### `POST /api/v1/auth/login`

```json
{ "email": "admin@gms.local", "password": "..." }
```

Respuesta:

```json
{
  "token": "...",
  "tokenType": "Bearer",
  "user": {
    "id": "...",
    "name": "Administrador",
    "email": "admin@gms.local",
    "platformAdmin": true,
    "defaultBranchId": "..."
  },
  "branches": [
    { "id": "...", "name": "Sucursal Demo", "code": "sucursal-demo", "roles": ["owner"] }
  ],
  "refreshToken": "...",
  "expiresIn": 3600
}
```

- Un `platformAdmin` puede autenticarse sin sucursales.
- Un usuario no administrador sin sucursales recibe un error de negocio.

### `GET /api/v1/auth/me`

Devuelve `{ user, branches }` sin token.

### `POST /api/v1/auth/refresh`

```json
{ "refreshToken": "..." }
```

Devuelve un nuevo par de tokens y la sesión actualizada.

### `POST /api/v1/auth/logout`

```json
{ "refreshToken": "..." }
```

Invalida el refresh token.

## 3. Sitio (global)

### `GET /api/v1/public/site`

Anónimo. Devuelve `{ site, theme, blocks, mediaAssets, branches }`. `branches` contiene las sucursales activas con check-in habilitado (`id`, `name`, `code`) para el selector de la landing; ver `README.md`.

### `GET /api/v1/site/settings`

Requiere `admin` global u `owner` de alguna sucursal activa.

### `PATCH /api/v1/site/settings`

Campos admitidos:

```json
{
  "siteName": "GMS Fitness",
  "shortName": "GMS",
  "logoAssetId": "uuid",
  "contactEmail": "hola@gms.local",
  "contactPhone": "+52...",
  "address": "...",
  "timezone": "America/Mexico_City",
  "currency": "MXN",
  "themePreset": "crossfit-dark",
  "themeOverrides": {},
  "modulesGlobal": false,
  "globalModules": {
    "calendar": false,
    "routines": true,
    "checkin": true,
    "pos": true
  }
}
```

`modulesGlobal` y `globalModules` solo pueden modificarse con un `admin` global (`platformAdmin`). Cuando `modulesGlobal` es `true`, `GET /api/v1/branches/{branchId}/modules` devuelve los módulos globales para todas las sucursales y los toggles por sucursal se rechazan.

### Landing

- `GET /api/v1/site/landing-blocks?offset=0&limit=100`
- `POST /api/v1/site/landing-blocks`
- `GET /api/v1/site/landing-blocks/{id}`
- `PATCH /api/v1/site/landing-blocks/{id}`
- `DELETE /api/v1/site/landing-blocks/{id}`

Payload:

```json
{
  "blockType": "hero",
  "sortOrder": 0,
  "enabled": true,
  "blockData": {}
}
```

Tipos válidos: `hero`, `text`, `membership`, `carousel`.

### Multimedia del sitio

- `GET /api/v1/site/media` (catálogo completo, sin paginación)
- `POST /api/v1/site/media` con `{ name, mediaType, externalUrl, mimeType, byteSize }`
- `POST /api/v1/site/media/upload` multipart `file` y `name`
- `PATCH /api/v1/site/media/{id}`
- `DELETE /api/v1/site/media/{id}`
- `GET /api/v1/public/media/{id}` anónimo; redirige si el asset es externo.

Solo se aceptan imágenes PNG, JPG o WebP de hasta 8 MB. Las URLs externas deben ser HTTPS.

## 4. Sucursales

- `GET /api/v1/branches?offset=0&limit=50` (solo `admin`)
- `GET /api/v1/branches/{id}` (solo `admin`)
- `POST /api/v1/branches` (solo `admin`)
- `PATCH /api/v1/branches/{id}` (solo `admin`)
- `DELETE /api/v1/branches/{id}` (solo `admin`; archiva la sucursal)

Payload de creación/edición:

```json
{
  "name": "Sucursal Demo",
  "shortName": "Demo",
  "code": "sucursal-demo",
  "address": "Av. Principal 100",
  "phone": "+52 55 0000 0000",
  "timezone": "America/Mexico_City",
  "currency": "MXN",
  "status": "active"
}
```

Si no se envía `code`, el backend lo genera desde el nombre y resuelve colisiones.

## 5. Recursos operativos

Todos usan `/api/v1/branches/{branchId}/...` y validan permisos por sucursal:

| Recurso | Ruta base |
|---|---|
| Staff | `/staff` |
| Miembros | `/members` |
| Planes | `/plans` |
| Pagos | `/payments` |
| Clases | `/classes` |
| Plantillas | `/class-templates` |
| Reservas | `/reservations` |
| Rutinas | `/routines` |
| Productos | `/products` |
| Ventas | `/sales` |
| Check-ins | `/checkins` |
| Configuración | `/settings` |
| Módulos | `/modules` |
| Dispositivos de check-in | `/checkin-devices` |
| Resumen del dashboard | `/dashboard/summary` |

### Fotos privadas de miembros

- `GET /api/v1/branches/{branchId}/members/{memberId}/photo`
- `POST /api/v1/branches/{branchId}/members/{memberId}/photo` multipart `file`
- `DELETE /api/v1/branches/{branchId}/members/{memberId}/photo`

Requieren Bearer. No son URLs públicas.

## 6. Check-in y kiosco

### Configuración pública por código

```http
GET /api/v1/public/branches/{code}/checkin-config
```

### Activación del kiosco

```http
POST /api/v1/kiosk/activate
Content-Type: application/json

{ "code": "sucursal-demo", "activationCode": "..." }
```

El backend responde con una cookie HttpOnly de dispositivo. El frontend abre el kiosco con:

```text
/checkin?branch=sucursal-demo
```

### Sesión y operaciones del kiosco

- `GET /api/v1/kiosk/session`
- `POST /api/v1/kiosk/logout`
- `POST /api/v1/kiosk/qr/issue`
- `POST /api/v1/kiosk/checkins/scan-member-qr`
- `POST /api/v1/kiosk/checkins/validate-code`

## 7. Convenciones de error

El frontend espera errores JSON con `message` legible. Códigos relevantes:

- `400`: datos inválidos.
- `401`: sesión inválida o expirada.
- `403`: sin permisos para la sucursal o el sitio.
- `404`: recurso inexistente.
- `409`: conflicto de código, correo o idempotencia.
- `413`: archivo demasiado grande.

## 8. Base de datos

- Esquema gestionado externamente con **Liquibase**.
- Baseline: `src/main/resources/db/schema/schema.sql`.
- Módulos globales: `src/main/resources/db/schema/site_modules.sql`.
- Seed idempotente: `src/main/resources/db/seed/seed.sql`.
- Administrador inicial: `src/main/resources/db/seed/seed_platform_admin.sql`.
- La aplicación usa `spring.jpa.hibernate.ddl-auto=validate`.
- Flyway está deshabilitado por defecto; el test de integración asume un esquema preparado externamente.

Tablas globales del sitio:

- `site_settings`
- `site_landing_blocks`
- `site_media_assets`

Tablas operativas por sucursal:

- `branch`, `branch_settings`, `branch_modules`
- `branch_members`, `branch_staff_roles`, `branch_classes`
- `member_photos` (privada)

## 9. Variables relevantes del backend

```sh
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gymback
DB_USER=gymback
DB_PASSWORD=...
schema_db=test
JWT_SECRET=...                 # >= 32 bytes
FRONTEND_ORIGIN=http://localhost:5173
GMS_FILES_ROOT=/var/lib/gms/files
BOOTSTRAP_ADMIN_EMAIL=admin@gms.local
BOOTSTRAP_ADMIN_PASSWORD=...   # >= 12 caracteres
```

`AdminBootstrap` solo crea la cuenta administradora si `BOOTSTRAP_ADMIN_PASSWORD` está definido y la cuenta no existe. Si el seed ya creó `admin@gms.local`, no sobrescribe su contraseña. También la vincula como `owner` de “Sucursal Demo” si existe. La cuenta platform admin se oculta de `/users` y `/staff` y no se administra desde la UI.
