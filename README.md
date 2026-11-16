# GMS Frontend

SPA de gestión para gimnasios construida con **Vue 3 + Vite + Pinia + Tailwind CSS**. El frontend consume la API de **Gym Back** (Spring Boot + PostgreSQL) y ya no funciona con persistencia local ni autenticación simulada.

## Modelo del producto

GMS separa dos conceptos que antes estaban mezclados:

- **Sitio / marca**: identidad global, tema, landing pública y biblioteca de imágenes. No pertenece a ninguna sucursal.
- **Sucursal**: ubicación operativa. Agrupa miembros, staff, clases, rutinas, POS, check-in y configuración operativa.

Consecuencias:

- Existe **una sola landing pública** en `/`.
- No existen landings por sucursal ni rutas `/g/:slug`.
- El Landing Builder, el tema y la multimedia son globales.
- Los módulos operativos se consultan siempre con la sucursal activa.

## Stack

| Área | Tecnología |
|---|---|
| Framework | Vue 3 (`<script setup>`) |
| Routing | Vue Router 5 |
| Estado | Pinia 3 |
| Build | Vite 8 |
| Estilos | Tailwind CSS 3 + variables CSS de tema |
| Calendario | Vista propia basada en grid nativo |
| Drag & drop | `vue-draggable-plus` |
| Carrusel | Swiper |
| Iconos | `lucide-vue-next` |
| QR | `qrcode`, `jsqr` |

## Landing pública

`src/pages/public/HomePage.vue` consume exclusivamente:

```http
GET /api/v1/public/site
```

Respuesta:

```json
{
  "site": {
    "name": "GMS Fitness",
    "shortName": "GMS",
    "logoUrl": "/api/v1/public/media/...",
    "contactEmail": "hola@gms.local",
    "contactPhone": "+52 55 0000 0000",
    "address": "Av. Principal 100",
    "timezone": "America/Mexico_City",
    "currency": "MXN"
  },
  "theme": { "preset": "crossfit-dark", "overrides": {} },
  "blocks": [
    { "id": "...", "type": "hero", "order": 0, "enabled": true, "data": {} }
  ],
  "mediaAssets": [
    { "id": "...", "name": "Hero", "url": "/api/v1/public/media/..." }
  ],
  "branches": [
    { "id": "...", "name": "Sucursal Demo", "code": "sucursal-demo" }
  ]
}
```

Las imágenes locales del sitio se sirven desde `GET /api/v1/public/media/{id}`. Las imágenes externas usan su URL HTTPS directamente. `branches` alimenta el selector de Check-in de la landing; el kiosco sigue recibiendo `?branch=<code>`.

## Dashboard

| Módulo | Alcance | Roles |
|---|---|---|
| Landing del sitio | Global | `admin`, `owner` |
| Multimedia del sitio | Global | `admin`, `owner` |
| Sucursales | Global | `admin` |
| Miembros | Sucursal | `admin`, `owner` |
| Usuarios / staff | Sucursal | `admin`, `owner` |
| Calendario y plantillas | Sucursal | `admin`, `owner`, `member` |
| Rutinas | Sucursal | `admin`, `owner`, `trainer`, `member` |
| POS | Sucursal | `admin`, `owner`, `trainer` |
| Check-in y auditoría | Sucursal | `admin`, `owner`, `member` |

El administrador global puede iniciar sesión **sin sucursales** y crear la primera desde `/dashboard/branches`.

## Autenticación y sesión

- Login: `POST /api/v1/auth/login`.
- Restauración: `GET /api/v1/auth/me`.
- Renovación: `POST /api/v1/auth/refresh` con refresh token en memoria.
- El access token se guarda en `sessionStorage`; el refresh token nunca se persiste.
- La sucursal activa se guarda en `sessionStorage` (`gymback:selected-branch`).
- `src/main.js` hidrata la sesión autenticada aunque todavía no exista una sucursal activa.

Roles:

- `admin`: administrador global de la plataforma.
- `owner`: propietario de una o más sucursales.
- `trainer`: entrenador con acceso operativo a sus sucursales.
- `member`: miembro; consulta rutinas y su check-in.
- `guest`: acceso temporal a clase muestra.

## Check-in y kiosco

El kiosco público vive en:

```text
/checkin?branch=<código-de-sucursal>
```

- `GET /api/v1/public/branches/{code}/checkin-config`
- `POST /api/v1/kiosk/activate` con `{ code, activationCode }`
- La sesión del dispositivo se mantiene con cookie HttpOnly.
- No requiere ni usa una landing por sucursal.

Las fotos de miembros son privadas:

- `GET /api/v1/branches/{branchId}/members/{memberId}/photo` con `Authorization: Bearer`.
- No se exponen como URLs públicas ni se mezclan con `site_media_assets`.

## Configuración

Copia `.env.example` y ajusta la URL del backend:

```sh
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Para WildFly con context root `/gms`:

```sh
VITE_API_BASE_URL=http://localhost:8080/gms/api/v1
```

Para producción con proxy inverso:

```sh
VITE_API_BASE_URL=/api/v1
```

## Scripts

```sh
npm install
npm run dev
npm run build
npm run lint
npm run format
```

Validación esperada antes de cerrar cambios:

```sh
npm run lint
npm run build
```

## Rutas principales

| Ruta | Descripción |
|---|---|
| `/` | Landing única del sitio |
| `/auth/login` | Inicio de sesión |
| `/guest-access` | Acceso temporal de invitado |
| `/checkin?branch=<code>` | Kiosco de check-in |
| `/dashboard` | Panel según rol |
| `/dashboard/branches` | Administración de sucursales (`admin`) |
| `/dashboard/landing-builder` | Landing, tema e identidad del sitio |
| `/dashboard/media` | Biblioteca de imágenes del sitio |
| `/dashboard/members` | Miembros de la sucursal activa |
| `/dashboard/users` | Staff de la sucursal activa |
| `/dashboard/calendar` | Calendario y reservas |
| `/dashboard/routines` | Rutinas de la sucursal |
| `/dashboard/pos` | Punto de venta |
| `/dashboard/checkin-audit` | Auditoría de accesos |

## Estructura

```text
src/
├── api/            # Cliente HTTP, endpoints y mappers
├── bootstrap/      # Hidratación de sesión y sucursal
├── components/     # UI, landing, dashboard, miembros, calendario
├── composables/    # Lógica reutilizable
├── config/         # Permisos, navegación, temas, categorías
├── layouts/        # Layouts público, auth y dashboard
├── pages/          # Vistas por dominio
├── router/         # Rutas y guardas
├── stores/         # Pinia por dominio
└── themes/         # Variables y presets de tema
```

## Validación y pendientes

Validado en este repositorio:

- `npm run lint` sin errores.
- `npm run build` correcto.

Pendiente de una revisión funcional con navegador real:

- Flujo completo login admin sin sucursal → alta de sucursal → landing → multimedia → publicación pública.
- Sustitución de `alert()` / `confirm()` nativos por componentes de UI.
- Revisión de contraste y tokens de tema en todos los presets.
- Pruebas E2E del kiosco con un dispositivo real.
