# Backend Integration Requirements for GMS Frontend

Este documento describe el estado actual del frontend GMS y las necesidades del backend para integrarlo correctamente. Debe usarse como guía de implementación de API, validaciones, seguridad y esquema de base de datos.

## 1. Estado actual del frontend

GMS Frontend es una SPA construida con Vue 3 + Vite. Actualmente la persistencia ocurre en el navegador mediante Pinia y `localStorage`. No existe integración real con backend, base de datos, autenticación segura ni almacenamiento persistente de archivos.

### Datos actuales en frontend

- Sesión de usuario en `useAuthStore`.
- Gimnasios de la plataforma y gimnasio activo en `useGymsStore`.
- Identidad del gimnasio activo en `useTenantStore` (delegada desde `useGymsStore`).
- Tema visual en `useThemeStore`.
- Módulos activos en `useModuleStore`.
- Plantillas de clase en `useClassTemplateStore`.
- Agenda y clases en `useClassScheduleStore`.
- Rutinas en `useRoutineStore`.
- Check-ins y tokens QR en `useCheckinStore`.
- Productos y ventas POS en `usePosStore`.
- Usuarios en `useUserStore`.
- Bloques de landing en `useLandingStore`.
- Multimedia en `useMediaStore`.
- Notificaciones en `useNotificationStore`.

### Características que deben migrar a backend

- Autenticación real y roles.
- Gestión multi-gimnasio y asignación de staff a gimnasios.
- Contexto de gimnasio activo por usuario.
- Persistencia por gimnasio.
- Historial de clases y reservas.
- Rutinas compartidas.
- Check-in con QR y auditoría.
- Inventario y ventas.
- Gestión de usuarios.
- Configuración de landing y media.
- Métricas de dashboard.

## 2. Arquitectura recomendada

- Backend REST o GraphQL con autenticación JWT.
- Base de datos relacional PostgreSQL.
- Storage de archivos en S3-compatible o equivalente.
- Soporte multi-tenant por `gym_id`.
- RBAC por rol.
- Validaciones de negocio en servidor, no solo en frontend.

## 3. Roles y permisos

Roles esperados:

- `admin`
- `trainer`
- `member`
- `guest`

Permisos sugeridos:

- Admin: gestión completa de todos los gimnasios de la plataforma.
- Trainer: gestión de clases, plantillas, rutinas, POS operativo y check-in, limitado a los gimnasios asignados.
- Member: consulta, reserva y check-in dentro de su gimnasio.
- Guest: acceso limitado y check-in temporal en el gimnasio correspondiente.

## 4. Módulos configurables

Cada gimnasio debe tener una configuración de módulos:

- `calendar`
- `routines`
- `checkin`
- `pos`

Los módulos `users` y `gyms` no son configurables y permanecen siempre activos:

- `users`: administración de usuarios (solo `admin`).
- `gyms`: administración multi-gimnasio (solo `admin`).

El backend debe validar si un módulo está activo antes de permitir operaciones asociadas y exponer esa configuración al frontend.

## 5. API sugerida por dominio

### Autenticación

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Gimnasio / tenant

- `GET /gyms`
- `POST /gyms`
- `GET /gyms/:gymId`
- `PATCH /gyms/:gymId`
- `DELETE /gyms/:gymId`
- `GET /gyms/:gymId/modules`
- `PATCH /gyms/:gymId/modules`
- `GET /gyms/:gymId/theme`
- `PATCH /gyms/:gymId/theme`

### Usuarios

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `PATCH /users/:id/status`
- `DELETE /users/:id`
- `GET /users/:id/gyms`
- `PUT /users/:id/gyms` (asignar gimnasios y gimnasio por defecto de un `trainer`)

### Plantillas de clase

- `GET /class-templates`
- `POST /class-templates`
- `GET /class-templates/:id`
- `PATCH /class-templates/:id`
- `DELETE /class-templates/:id`

### Agenda / clases

- `GET /class-sessions?date=&from=&to=`
- `POST /class-sessions`
- `GET /class-sessions/:id`
- `PATCH /class-sessions/:id`
- `DELETE /class-sessions/:id`

### Reservas

- `GET /class-sessions/:id/bookings`
- `POST /class-sessions/:id/bookings`
- `DELETE /bookings/:id`

Validaciones obligatorias:

- capacidad
- solape de horario por categoría
- límite para invitados
- límite de una clase normal por día
- no reservar clases pasadas

### Rutinas

- `GET /routines`
- `POST /routines`
- `GET /routines/:id`
- `PATCH /routines/:id`
- `DELETE /routines/:id`

### Check-in

- `POST /checkin/tokens`
- `GET /checkin/tokens/current`
- `POST /checkin/scan`
- `POST /checkin/manual`
- `GET /checkins`
- `GET /checkins/:userId`

Validaciones:

- token vigente
- un check-in por usuario por día
- registro de método y timestamp

### POS / inventario

- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `POST /sales`
- `GET /sales`
- `GET /sales/:id`
- `GET /reports/pos/summary`
- `GET /reports/pos/products`

### Multimedia

- `GET /media`
- `POST /media/upload`
- `GET /media/:id`
- `DELETE /media/:id`

### Landing

- `GET /landing/blocks`
- `POST /landing/blocks`
- `PATCH /landing/blocks/:id`
- `PATCH /landing/blocks/reorder`
- `DELETE /landing/blocks/:id`

### Auditoría

- `GET /audit-logs`
- `POST /audit-logs`

### Contexto de gimnasio (multi-tenant)

Todas las peticiones a recursos operativos deben viajar con el gimnasio activo:

- Mediante header `X-Gym-Id` o parámetro de ruta, según la estrategia elegida.
- El backend debe validar el acceso antes de responder:
  - `admin`: acceso global a todos los gimnasios.
  - `trainer`: solo gimnasios presentes en `user_gyms`.
  - `member` / `guest`: solo su gimnasio (`users.gym_id`).
- Las respuestas deben venir ya filtradas por `gym_id`.
- `GET /auth/me` debe devolver los gimnasios accesibles y el `default_gym_id` para que el frontend construya el selector.
- Si el gimnasio solicitado no está permitido, el backend debe responder `403`.

## 6. Propuesta de schema de base de datos

A continuación se propone un esquema relacional orientado a PostgreSQL.

### `gyms`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| name | varchar(120) | |
| short_name | varchar(40) | |
| logo_url | text | nullable |
| address | text | nullable |
| phone | varchar(40) | nullable |
| active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `gym_settings`

| Columna | Tipo | Notas |
|---|---|---|
| gym_id | uuid | FK → gyms.id, PK |
| modules_json | jsonb | configuración de módulos |
| theme_preset | varchar(40) | |
| theme_colors_json | jsonb | colores personalizados |
| updated_at | timestamptz | |

### `users`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id (gimnasio principal / miembros) |
| name | varchar(120) | |
| email | varchar(255) | unique por gimnasio |
| phone | varchar(40) | nullable |
| password_hash | text | |
| role | varchar(20) | admin, trainer, member, guest |
| active | boolean | |
| default_gym_id | uuid | FK → gyms.id, nullable (entrenadores) |
| start_date | date | nullable, para miembros |
| payment_modality | varchar(20) | monthly o yearly |
| next_payment_date | date | nullable |
| created_at | timestamptz | |

### `user_gyms`

Tabla puente para el acceso de entrenadores a uno o varios gimnasios.

| Columna | Tipo | Notas |
|---|---|---|
| user_id | uuid | FK → users.id |
| gym_id | uuid | FK → gyms.id |
| created_at | timestamptz | |

Restricción: PK compuesta `(user_id, gym_id)`.

### `class_templates`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| name | varchar(120) | |
| color | varchar(20) | |
| duration_minutes | integer | |
| capacity | integer | |
| category | varchar(30) | normal, special, flexible, event |
| created_at | timestamptz | |

### `class_sessions`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| template_id | uuid | FK → class_templates.id, nullable |
| name | varchar(120) | |
| color | varchar(20) | |
| capacity | integer | |
| date | date | |
| start_time | time | |
| end_time | time | |
| category | varchar(30) | |
| created_by | uuid | FK → users.id |
| created_at | timestamptz | |

### `class_bookings`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| session_id | uuid | FK → class_sessions.id |
| user_id | uuid | FK → users.id |
| status | varchar(20) | booked, cancelled, attended |
| created_at | timestamptz | |

Restricción recomendada: un usuario no debe tener reservas duplicadas en la misma sesión.

### `routines`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| name | varchar(120) | |
| description | text | |
| level | varchar(20) | beginner, intermediate, advanced |
| goal | varchar(120) | |
| published | boolean | |
| created_by | uuid | FK → users.id |
| created_at | timestamptz | |

### `routine_days`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| routine_id | uuid | FK → routines.id |
| day_name | varchar(40) | |
| sort_order | integer | |

### `routine_exercises`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| routine_day_id | uuid | FK → routine_days.id |
| name | varchar(120) | |
| sets | varchar(20) | |
| reps | varchar(20) | |
| rest | varchar(20) | |
| notes | text | nullable |
| sort_order | integer | |

### `checkin_tokens`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| token | text | unique |
| expires_at | timestamptz | |
| created_at | timestamptz | |

### `checkins`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| user_id | uuid | FK → users.id |
| method | varchar(20) | qr, credentials, manual-button (a retirar si aplica) |
| token_id | uuid | FK → checkin_tokens.id, nullable |
| created_at | timestamptz | |

Regla: un usuario solo puede tener un check-in por día.

### `products`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| name | varchar(120) | |
| category | varchar(60) | |
| sku | varchar(60) | unique por gimnasio recomendado |
| barcode | varchar(60) | nullable |
| price | decimal(12,2) | |
| stock | integer | |
| created_at | timestamptz | |

### `sales`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| created_by | uuid | FK → users.id |
| total | decimal(12,2) | |
| created_at | timestamptz | |

### `sale_items`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| sale_id | uuid | FK → sales.id |
| product_id | uuid | FK → products.id |
| product_name | varchar(120) | snapshot |
| unit_price | decimal(12,2) | snapshot |
| quantity | integer | |
| subtotal | decimal(12,2) | |

### `media_assets`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id, nullable (null = recurso compartido) |
| name | varchar(120) | |
| type | varchar(30) | image, video, etc. |
| url | text | |
| created_at | timestamptz | |

### `landing_blocks`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| type | varchar(40) | hero, text, membership, carousel, etc. |
| enabled | boolean | |
| sort_order | integer | |
| data | jsonb | configuración del bloque |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `audit_logs`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| actor_id | uuid | FK → users.id, nullable |
| action | varchar(80) | |
| entity_type | varchar(60) | |
| entity_id | uuid | nullable |
| details_json | jsonb | |
| created_at | timestamptz | |

## 7. Consideraciones de integración

- El frontend actual usa `localStorage`, por lo que la migración debe reemplazar progresivamente cada store.
- La plataforma es multi-gimnasio: cada recurso operativo (clases, rutinas, POS, check-ins, usuarios, landing) pertenece a un `gym_id`.
- El backend debe validar que un `trainer` solo opere sobre los gimnasios asignados en `user_gyms`; el `admin` tiene acceso global.
- El gimnasio activo del frontend debe reflejarse en el contexto de cada request (por ejemplo, header `X-Gym-Id` o parámetro de ruta) y validarse contra los permisos del usuario.
- Las validaciones de reservas y check-ins deben ejecutarse en backend.
- La configuración de módulos debe venir desde backend y reflejarse en frontend.
- Las cargas de media deben retornar URLs públicas o firmadas.
- Los conteos y métricas del dashboard deben calcularse en backend para evitar inconsistencias.
- El QR debe generarse y validarse en servidor; el token actual es simulado en frontend.
- Los reportes de POS deben filtrarse por fecha, usuario y gimnasio.

## 8. Migración sugerida por fases

1. Autenticación real y usuarios.
2. Gimnasios (`gyms`) y asignación de staff (`user_gyms`).
3. Configuración de gimnasio, contexto activo y módulos.
4. Plantillas y agenda de clases.
5. Rutinas.
6. Check-in.
7. POS e inventario.
8. Landing blocks y media.
9. Auditoría y notificaciones.

## 9. Observaciones importantes

- El rol `admin` no debe ser editable, desactivable ni eliminable desde el frontend; backend debe aplicar esta regla definitivamente.
- No se debe permitir eliminar el último gimnasio restante de la plataforma.
- Al eliminar un gimnasio debe definirse una política de borrado (cascada) o de archivado de sus datos operativos.
- Los datos operativos (clases, rutinas, POS, check-ins, usuarios, landing y media) se aíslan por `gym_id`.
- Las cancelaciones y cambios de estado deben generar audit log.
- Los pagos de miembros pueden requerir una tabla adicional de suscripciones si se desea controlar cobros dentro del sistema.
- Las notificaciones pueden derivarse de `audit_logs` o generarse como eventos separados según la estrategia elegida.