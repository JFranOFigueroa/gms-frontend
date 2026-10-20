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
- Check-ins, intentos de acceso y tokens QR en `useCheckinStore`.
- Productos y ventas POS en `usePosStore`.
- Staff (admin, owner, trainer) en `useUserStore`.
- Miembros y pagos en `useMemberStore`.
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
- Check-in con QR, credencial de miembro y auditoría de accesos.
- Inventario y ventas.
- Gestión de staff y miembros.
- Pagos de miembros y vencimientos.
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
- `owner`
- `trainer`
- `member`
- `guest`

Permisos sugeridos:

- Admin: staff de GMS. Gestión completa de la plataforma, gimnasios, módulos, staff y cualquier gimnasio. Los usuarios `admin` son de solo lectura desde el frontend.
- Owner: propietario del gimnasio. Gestión completa de los gimnasios asignados: dashboard, POS, calendario, rutinas, miembros, pagos, staff (entrenadores), check-in, Landing Builder y multimedia. No puede gestionar gimnasios ni activar/desactivar módulos.
- Trainer: gestión de clases, plantillas, rutinas, POS operativo, miembros en solo lectura y check-in, limitado a los gimnasios asignados.
- Member: consulta de rutinas, reservas y check-in dentro de su gimnasio.
- Guest: acceso limitado y check-in temporal en el gimnasio correspondiente.

Reglas adicionales:

- Solo `admin` puede crear/editar/eliminar gimnasios.
- Solo `admin` puede modificar la configuración de módulos.
- `owner` y `admin` acceden a Landing Builder y Multimedia.
- `owner` solo puede crear/editar entrenadores; `admin` puede crear/editar `owner` y `trainer`.
- `trainer` no puede mutar miembros ni pagos.

## 4. Módulos configurables

Cada gimnasio debe tener una configuración de módulos:

- `calendar`
- `routines`
- `checkin`
- `pos`

Los módulos `users`, `members` y `gyms` no son configurables y permanecen siempre activos:

- `users`: administración del staff (solo `admin` y `owner`).
- `members`: altas, bajas, pagos, información adicional y expediente de miembros.
- `gyms`: administración multi-gimnasio (solo `admin`).

Solo `admin` puede activar/desactivar los módulos configurables. El backend debe validar si un módulo está activo antes de permitir operaciones asociadas y exponer esa configuración al frontend.

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

### Usuarios (staff)

- `GET /users` (staff: admin, owner, trainer; excluye miembros)
- `POST /users` (crear `owner` o `trainer`)
- `GET /users/:id`
- `PATCH /users/:id`
- `PATCH /users/:id/status`
- `DELETE /users/:id`
- `GET /users/:id/gyms`
- `PUT /users/:id/gyms` (asignar gimnasios y gimnasio por defecto de un `owner` o `trainer`)

Reglas:

- `admin` no puede ser creado, editado, desactivado ni eliminado desde el frontend.
- `owner` solo puede crear/editar/eliminar `trainer`.
- `admin` puede crear/editar/eliminar `owner` y `trainer`.

### Miembros

- `GET /members`
- `POST /members`
- `GET /members/:id`
- `PATCH /members/:id`
- `PATCH /members/:id/status` (alta/baja lógica)
- `DELETE /members/:id`
- `GET /members/:id/payments`
- `POST /members/:id/payments`
- `GET /members/by-code/:code` (kiosco/credencial)
- `GET /members/:id/qr` (credencial QR)

Validaciones:

- correo único global (compartido entre `users` y `members`, porque el login resuelve por correo);
- código de miembro único;
- fecha de inscripción obligatoria;
- modalidad `monthly` o `yearly`;
- al registrar pago, calcular el nuevo `next_payment_date`;
- `trainer` solo lectura.

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

- `POST /checkin/tokens` (kiosco/dispositivo)
- `GET /checkin/tokens/current`
- `POST /checkin/scan` (QR de credencial o token rotativo)
- `POST /checkin/manual` (código/correo del miembro)
- `GET /checkins`
- `GET /checkins/:userId`
- `GET /checkin/access-attempts` (concedidos y denegados)
- `POST /checkin/access-attempts`

Validaciones:

- token vigente;
- membresía activa;
- pago vigente (`next_payment_date >= today`);
- miembro perteneciente al gimnasio del kiosco;
- un acceso concedido por usuario por día (los intentos denegados sí se registran);
- registrar método, resultado, motivo y timestamp.

El kiosco standalone debe autenticarse como dispositivo del gimnasio (device token), no como un usuario humano. El backend debe emitir un token de dispositivo con alcance únicamente a `POST /checkin/scan` y `POST /checkin/manual`.

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
  - `owner` y `trainer`: solo gimnasios presentes en `user_gyms`.
  - `member` / `guest`: solo su gimnasio (`members.gym_id` / `users.gym_id`).
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

Usuarios internos (staff). Los miembros viven en `members`.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id, nullable para `admin` |
| name | varchar(120) | |
| email | varchar(255) | unique |
| phone | varchar(40) | nullable |
| password_hash | text | |
| role | varchar(20) | admin, owner, trainer |
| active | boolean | |
| default_gym_id | uuid | FK → gyms.id, nullable (`owner` / `trainer`) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `user_gyms`

Tabla puente para el acceso de `owner` y `trainer` a uno o varios gimnasios.

| Columna | Tipo | Notas |
|---|---|---|
| user_id | uuid | FK → users.id |
| gym_id | uuid | FK → gyms.id |
| created_at | timestamptz | |

Restricción: PK compuesta `(user_id, gym_id)`.

### `members`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| code | varchar(20) | unique global, ej. M-1001 |
| name | varchar(120) | |
| email | varchar(255) | unique global (compartido con users para el login) |
| password_hash | text | |
| birth_date | date | nullable |
| phone | varchar(40) | nullable |
| address | text | nullable |
| emergency_contact_name | varchar(120) | nullable |
| emergency_contact_phone | varchar(40) | nullable |
| photo_url | text | nullable |
| start_date | date | fecha de inscripción |
| payment_modality | varchar(20) | monthly o yearly |
| last_payment_date | date | nullable |
| next_payment_date | date | nullable |
| active | boolean | alta/baja lógica |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `member_payments`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| member_id | uuid | FK → members.id |
| amount | decimal(12,2) | |
| method | varchar(20) | cash, card, transfer |
| concept | varchar(30) | membership, enrollment, other |
| periodicity | varchar(20) | monthly, yearly |
| periods | integer | default 1 |
| paid_at | date | |
| period_start | date | base usada para el cálculo |
| next_payment_date | date | vencimiento resultante |
| notes | text | nullable |
| created_by | uuid | FK → users.id |
| created_at | timestamptz | |

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

### `checkin_devices`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| gym_id | uuid | FK → gyms.id |
| name | varchar(120) | ej. Tablet entrada |
| device_token_hash | text | token de dispositivo |
| active | boolean | |
| last_seen_at | timestamptz | nullable |
| created_at | timestamptz | |

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
| member_id | uuid | FK → members.id, nullable |
| guest_name | varchar(120) | nullable |
| role | varchar(20) | member, guest |
| method | varchar(30) | member-code, qr, credentials, rotating-qr |
| allowed | boolean | resultado del control de acceso |
| reason | varchar(255) | motivo del rechazo o confirmación |
| device_id | uuid | FK → checkin_devices.id, nullable |
| token_id | uuid | FK → checkin_tokens.id, nullable |
| created_at | timestamptz | |

Reglas:

- Solo se permite un acceso concedido (`allowed = true`) por miembro por día.
- Los intentos denegados se registran para auditoría y no bloquean un intento posterior válido.
- El backend debe validar `members.active = true` y `members.next_payment_date >= current_date` antes de conceder.

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
- La plataforma es multi-gimnasio: cada recurso operativo (clases, rutinas, POS, check-ins, staff, miembros, pagos, landing) pertenece a un `gym_id`.
- El backend debe validar que `owner` y `trainer` solo operen sobre los gimnasios asignados en `user_gyms`; el `admin` tiene acceso global.
- El gimnasio activo del frontend debe reflejarse en el contexto de cada request (por ejemplo, header `X-Gym-Id` o parámetro de ruta) y validarse contra los permisos del usuario.
- Las validaciones de reservas y check-ins deben ejecutarse en backend.
- El control de acceso del kiosco debe validar membresía activa, pago vigente y pertenencia al gimnasio antes de responder.
- La configuración de módulos debe venir desde backend y reflejarse en frontend; solo `admin` puede modificarla.
- Las cargas de media y fotos de miembros deben retornar URLs públicas o firmadas.
- Los conteos y métricas del dashboard deben calcularse en backend para evitar inconsistencias.
- El QR rotativo debe generarse y validarse en servidor. En la demo se comparte entre pestañas del mismo navegador mediante `localStorage` (`gms-kiosk-token`); no entre dispositivos distintos.
- Los reportes de POS deben filtrarse por fecha, usuario y gimnasio.
- Registrar un pago debe extender `next_payment_date` de forma transaccional y dejar auditoría.

## 8. Migración sugerida por fases

1. Autenticación real y staff (`admin`, `owner`, `trainer`).
2. Gimnasios (`gyms`) y asignación de staff (`user_gyms`).
3. Configuración de gimnasio, contexto activo y módulos.
4. Miembros, altas/bajas, pagos e información adicional.
5. Plantillas y agenda de clases.
6. Rutinas.
7. Check-in, kiosco y control de acceso.
8. POS e inventario.
9. Landing blocks y media.
10. Auditoría y notificaciones.

## 9. Observaciones importantes

- El rol `admin` no debe ser editable, desactivable ni eliminable desde el frontend; backend debe aplicar esta regla definitivamente.
- `owner` solo puede gestionar entrenadores; `admin` gestiona propietarios y entrenadores.
- Solo `admin` puede crear/editar/eliminar gimnasios y modificar módulos.
- No se debe permitir eliminar el último gimnasio restante de la plataforma.
- Al eliminar un gimnasio debe definirse una política de borrado (cascada) o de archivado de sus datos operativos.
- Los datos operativos (clases, rutinas, POS, check-ins, staff, miembros, pagos, landing y media) se aíslan por `gym_id`.
- Las cancelaciones y cambios de estado deben generar audit log.
- Los pagos de miembros deben registrarse con monto, método, periodicidad y nuevo vencimiento; idealmente con una tabla de suscripciones si se controlan cobros recurrentes.
- Las notificaciones pueden derivarse de `audit_logs` o generarse como eventos separados según la estrategia elegida.