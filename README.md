# GMS Frontend

Sistema frontend adaptable para la gestión y presencia digital de gimnasios. El proyecto está construido con **Vue 3 + Vite + Pinia + Tailwind CSS** y actualmente funciona como una aplicación completa de frontend con persistencia local.

## Idea general

GMS Frontend está pensado para cubrir dos enfoques de gimnasio dentro de una misma base:

- **Gimnasios por rutinas** para gimnasios tradicionales.
- **Gimnasios por horarios y clases** para modelos tipo CrossFit o clases grupales.

La propuesta principal es que la misma plataforma pueda cambiar su comportamiento mediante módulos activables y configurables, sin necesidad de forks del código. Un administrador de GMS puede activar o desactivar funcionalidades como calendario, rutinas, check-in, POS o gestión de usuarios desde el Landing Builder.

Además, la plataforma es **multi-gimnasio**: un administrador de GMS puede gestionar varios gimnasios y alternar entre ellos; un propietario (`owner`) administra los gimnasios que tenga asignados; la información operativa (clases, rutinas, POS, check-in, usuarios, miembros y landing) se muestra según el gimnasio activo seleccionado.

## Enfoque

- **Frontend-first**: toda la aplicación corre actualmente en el navegador usando stores de Pinia y `localStorage`.
- **Modular**: funcionalidades clave se registran mediante módulos configurables.
- **Multi-rol**: la interfaz se adapta a `admin`, `owner`, `trainer`, `member` y `guest`.
- **Multi-gimnasio**: los recursos operativos se aíslan por gimnasio y el contexto se controla con un selector de gimnasio activo.
- **Configurable**: el gimnasio puede personalizar identidad, tema visual, landing y módulos activos.
- **Escalable a backend**: las pantallas y stores están organizadas por dominio para facilitar una futura integración con API y base de datos.

## Stack

| Área | Tecnología |
|---|---|
| Framework | Vue 3 (`<script setup>`) |
| Routing | Vue Router 5 |
| State | Pinia 3 + `pinia-plugin-persistedstate` |
| Build | Vite 8 |
| Estilos | Tailwind CSS 3 + variables CSS de tema |
| Calendario | Vista propia basada en grid nativo |
| Drag & drop | `vue-draggable-plus` |
| Carrusel | Swiper |
| Iconos | `lucide-vue-next` |
| QR | `qrcode` |

## Módulos principales

- **Landing Builder**: editor visual de bloques para la página pública.
- **Calendario**: agenda de clases por día, plantillas y reservas.
- **Rutinas**: biblioteca de rutinas generales consultable por miembros.
- **Check-in**: registro de llegada mediante QR efímero, credencial de miembro y auditoría con validación de estado y pago.
- **POS**: punto de venta, inventario y reportes.
- **Miembros**: altas en 2 pasos, bajas, pagos, expediente e información adicional.
- **Usuarios**: administración de staff (propietarios y entrenadores).
- **Gimnasios**: administración multi-gimnasio y selector de gimnasio activo (solo admin).
- **Tema visual**: presets de color aplicados mediante variables CSS.
- **Multimedia**: biblioteca local de recursos visuales.

## Constitución de estilos

El proyecto sigue una convención visual basada en tokens CSS y Tailwind.

### Reglas

- Usar siempre variables de tema:
  - `--color-primary`
  - `--color-background`
  - `--color-surface`
  - `--color-surface-hover`
  - `--color-border`
  - `--color-text`
  - `--color-text-secondary`
- Evitar colores hardcodeados como `zinc-*`, `white` o `black` salvo casos semánticos como errores, estados o overlays.
- Usar Tailwind como sistema de utilidades.
- Mantener componentes reutilizables en `src/components/ui`.
- Preferir `BaseCard`, `BaseButton`, `BaseInput`, `BaseModal`, etc. para consistencia.
- Mantener soporte responsive en layouts, cards, grids, sidebars y preview.
- Los temas se aplican dinámicamente en `App.vue` mediante `--color-*`.

### Temas actuales

- CrossFit Dark
- Athletic Blue
- Power Orange
- Luxury Gold

El preset seleccionado se persiste en el store de tema y se aplica automáticamente.

## Lógica funcional

### Autenticación

Actualmente es simulada:

- `LoginPage.vue` resuelve primero el staff desde `useUserStore` y los miembros desde `useMemberStore` por correo, usando su rol real. Si el correo no existe, cae a un heurístico por contenido (`admin`, `owner`, `trainer`; resto `member`).
- Resuelve identidad, gimnasios asignados y gimnasio por defecto.
- `GuestAccessPage.vue` permite acceso temporal por teléfono.
- `useAuthStore` persiste usuario y token en `localStorage`.
- El router protege rutas con `requiresAuth`, `roles` y `module`.

Roles:

- `admin`: staff de GMS. Único rol que gestiona gimnasios y activa/desactiva módulos. Los usuarios `admin` son de solo lectura.
- `owner`: propietario del gimnasio. Acceso completo a su gimnasio salvo los componentes exclusivos de `admin`. Puede usar Landing Builder y Multimedia.
- `trainer`: entrenador. Acceso operativo a sus gimnasios asignados.
- `member`: miembro del gimnasio. Solo consulta rutinas y registra su check-in.
- `guest`: acceso temporal.

La matriz de permisos vive en `src/config/permissions.js` para evitar condicionales de rol dispersos.

### Cuentas demo

| Correo | Rol | Notas |
|---|---|---|
| `admin@gym.com` | admin | Staff GMS; cualquier contraseña |
| `owner@gym.com` | owner | Propietario del gimnasio 1; cualquier contraseña |
| `trainer@gym.com` | trainer | Entrenador con acceso a gimnasios 1 y 2; cualquier contraseña |
| `member@gym.com` | member | `member123`; membresía anual activa |
| `expired@gym.com` | member | `member123`; pago vencido para probar el rechazo de acceso |
| `inactive@gym.com` | member | `member123`; cuenta desactivada para probar el rechazo de acceso |

Los miembros sí validan contraseña en el login; el staff usa cualquier contraseña en esta demo.

### Módulos

`useModuleStore` permite activar o desactivar:

- `calendar`
- `routines`
- `checkin`
- `pos`

Los módulos `users`, `members` y `gyms` permanecen siempre activos y no son configurables:

- `users`: administración del staff (propietarios y entrenadores).
- `members`: altas, bajas, pagos, información adicional y expediente de miembros.
- `gyms`: gestión multi-gimnasio, disponible solo para `admin`.

La activación/desactivación de módulos es exclusiva de `admin`. El `owner` puede entrar al Landing Builder, pero no ve la tarjeta de gestión de módulos.

El store de módulos define presets:

- Tradicional: rutinas activas, calendario desactivado
- CrossFit / Clases: calendario activo, rutinas desactivadas
- Mixto: ambos activos

### Navegación por rol

`sidebarNavigation.js` define las rutas visibles según rol. Los items con campo `module` solo se muestran si el módulo está activo. El item `Gimnasios` se incluye únicamente para el rol `admin`. `owner` y `admin` ven Landing Builder y Multimedia; `trainer` no.

### Calendario

- Vista mensual propia, sin depender de librerías externas.
- Las clases se agrupan por día.
- `DayScheduleModal` lista y gestiona las clases del día.
- `CreateClassModal` valida fecha, hora y capacidad.
- `useBookingValidation` aplica reglas:
  - capacidad
  - límite para invitados
  - una clase normal por día
  - overlaps por categoría

### Rutinas

- Las rutinas son generales para todos los miembros.
- Admin, owner y trainer pueden crear, editar y eliminar.
- Member solo consulta.
- Cada rutina contiene días y ejercicios.
- El miembro ve las rutinas colapsadas y puede buscar por keywords.

### Check-in

- **Kiosco standalone** en `/checkin`, sin login, pensado para una tablet en la entrada.
- El kiosco usa el gimnasio activo persistido en el navegador. En la demo, selecciona el gimnasio desde el dashboard antes de abrirlo; en producción, el dispositivo debe estar vinculado a un gimnasio.
- El kiosco respeta la activación del módulo `checkin`; si el admin lo desactiva, la ruta vuelve al inicio.
- Dos métodos en la misma pantalla:
  - Credencial del miembro: código (`M-1001`), correo o QR `GMS-MEMBER:<código>` escaneado con la cámara.
  - QR rotativo cada 10 segundos para que el miembro lo escanee desde su cuenta.
- El token rotativo se publica en `localStorage` (`gms-kiosk-token`) para validarlo entre pestañas del mismo navegador. Entre dispositivos distintos requiere validación de servidor.
- Reglas de acceso centralizadas en `useMemberStore.getAccessStatus`:
  - concede si la cuenta está activa y `nextPaymentDate` no está vencido;
  - deniega si el miembro no existe, está desactivado, pertenece a otro gimnasio o su pago caducó;
  - evita un segundo acceso concedido el mismo día.
- Cada intento (concedido o denegado) se registra con método, motivo y timestamp.
- El kiosco muestra un historial reciente anonimizado; el detalle con nombres y motivos queda en la auditoría para staff.
- Auditoría en `/dashboard/checkin-audit` con contadores de concedidos/denegados.
- Escaneo con `BarcodeDetector` cuando está disponible y entrada manual como fallback.
- Métricas de ocupación en vivo y por hora.

### POS

- Venta de productos con carrito.
- Inventario editable.
- Reportes de ventas, ingresos y stock bajo.
- Roles:
  - Trainer: solo ventas.
  - Admin y owner: ventas, inventario y reportes.

### Miembros

- Módulo separado de Usuarios, con submódulos:
  - **Miembros**: listado, búsqueda, estado de cuenta y acceso al expediente.
  - **Altas**: registro en 2 pasos.
  - **Bajas**: miembros desactivados y reactivación.
  - **Pagos**: historial y registro de pagos con cálculo del próximo vencimiento.
  - **Info adicional**: notas, dirección, fecha de nacimiento, contacto de emergencia y acceso al expediente completo.
- Registro en 2 pasos:
  1. Datos personales: nombre, correo, contraseña, fecha de nacimiento, teléfono, dirección, contacto de emergencia y notas.
  2. Foto, fecha de inscripción y modalidad de pago (mensual/anual).
- Cada miembro recibe un código único (`M-####`) y un QR de credencial.
- La foto se comprime y guarda como data URL en `localStorage` (demo).
- Estados: activo, pago vencido e inactivo.
- `admin` y `owner` gestionan miembros y pagos; `trainer` solo lectura.
- Registrar un pago extiende `nextPaymentDate` desde el vencimiento actual si aún es futuro, o desde la fecha de pago si está vencido.

### Usuarios (staff)

- CRUD de staff: propietarios (`owner`) y entrenadores (`trainer`).
- `admin` puede gestionar propietarios y entrenadores; no puede crear ni modificar otros `admin`.
- `owner` solo puede gestionar entrenadores de sus gimnasios.
- El usuario `admin` es informativo y de solo lectura.
- Al registrar un `owner` o `trainer` se seleccionan los gimnasios a los que tiene acceso y su gimnasio por defecto.
- Los miembros ya no se crean desde Usuarios: viven en el módulo Miembros.

### Multi-gimnasio

- El módulo `Gimnasios` está disponible solo para el rol `admin` y no es configurable (siempre activo).
- El header muestra un selector de gimnasio activo para `admin`, `owner` y `trainer`.
- El `admin` puede seleccionar cualquier gimnasio; `owner` y `trainer` solo los que tengan asignados.
- El gimnasio seleccionado define el contexto de los datos mostrados en los módulos específicos:
  - Dashboard, Calendario, Plantillas, Rutinas, POS, Check-in, Miembros y Landing Builder.
- Los gimnasios se gestionan desde el módulo `Gimnasios` (crear, editar, eliminar y seleccionar).
- No se permite eliminar el último gimnasio restante.
- `useGymsStore` centraliza los gimnasios y el `activeGymId`; `useTenantStore` resuelve la identidad del gimnasio activo para sidebar, header, login y landing.

## Estructura

```text
src/
├── components/
│   ├── calendar/
│   ├── dashboard/
│   ├── landing/
│   ├── layout/
│   └── ui/
├── composables/
├── config/
├── layouts/
├── pages/
├── router/
├── stores/
└── themes/
```

### Stores principales

| Store | Responsabilidad |
|---|---|
| `useAuthStore` | Sesión y rol del usuario |
| `useGymsStore` | Gimnasios y gimnasio activo (`activeGymId`) |
| `useTenantStore` | Identidad del gimnasio activo (delegada desde `useGymsStore`) |
| `useModuleStore` | Módulos activos y presets |
| `useThemeStore` | Tema visual |
| `useUserStore` | Staff (admin/owner/trainer), roles y acceso a gimnasios |
| `useMemberStore` | Miembros, pagos, códigos/QR y validación de acceso |
| `useClassTemplateStore` | Plantillas de clase por gimnasio |
| `useClassScheduleStore` | Agenda de clases por gimnasio |
| `useBookingStore` | Reservas |
| `useRoutineStore` | Rutinas por gimnasio |
| `useCheckinStore` | Accesos concedidos/denegados y tokens QR por gimnasio |
| `usePosStore` | Productos, ventas y carrito por gimnasio |
| `useLandingStore` | Bloques de landing por gimnasio |
| `useMediaStore` | Biblioteca de multimedia |
| `useNotificationStore` | Notificaciones derivadas de check-ins y ventas |

### Aislamiento por gimnasio

Los stores con datos operativos guardan los registros con un campo `gymId` y exponen getters filtrados por el gimnasio activo. Al cambiar el gimnasio en el header, los dashboards y módulos se recalculan automáticamente sin recargar la página.

### Notas de datos locales

Con la llegada del modelo multi-gimnasio, los stores operativos usan claves de persistencia versionadas. La primera vez que se abre esta versión, los datos mock se reinician con el seed definido en cada store y el gimnasio activo vuelve al primer gimnasio.

Claves relevantes:

- `gms-users-v3`: staff (admin, owner, trainer).
- `gms-members-v1`: miembros y pagos.
- `gms-checkin-v3`: accesos y tokens.

## Instalación y desarrollo

```sh
npm install
npm run dev
npm run build
npm run lint
npm run format
```

## Estado actual

Actualmente el proyecto es una SPA frontend funcional con:

- persistencia local
- autenticación simulada
- **multi-gimnasio** con selector de gimnasio activo
- módulos configurables (activación exclusiva de `admin`)
- roles `admin`, `owner`, `trainer`, `member` y `guest`
- builder de landing por gimnasio
- calendario propio
- rutinas
- check-in con QR rotativo y kiosco standalone con validación de estado/pago
- POS e inventario
- módulo de miembros con altas en 2 pasos, bajas y pagos
- gestión de staff y acceso a gimnasios
- dashboards por rol
- temas dinámicos

## Pendiente para producción

- Integración real con backend y base de datos.
- Autenticación segura basada en servidor.
- Validación de permisos por gimnasio en servidor.
- Migración del estado actual en `localStorage` a persistencia centralizada.
- Autenticación de dispositivo para el kiosco `/checkin` y tokens QR compartidos entre dispositivos (hoy solo entre pestañas del mismo navegador).
- Compresión/almacenamiento remoto de fotos de miembros.
- Tests unitarios y de integración.
- Manejo centralizado de errores y loading.
- Sustitución de uploads locales por almacenamiento persistente.

## Hacia dónde va el proyecto

El siguiente paso natural es convertir GMS en una plataforma multi-tenant conectada a backend, con:

- API REST para todos los módulos
- base de datos relacional
- autenticación real con roles
- contexto de gimnasio activo validado en servidor
- asignación de gimnasios a propietarios y entrenadores
- persistencia centralizada
- reportes productivos
- soporte de pagos y suscripciones de gimnasios
- auditoría real y notificaciones
- despliegue continuo

## Convenciones de desarrollo

- Usar `<script setup>` y componentes Vue 3.
- Preferir composables para lógica reusable.
- Stores por dominio en Pinia.
- Componentes UI reutilizables en `components/ui`.
- Evitar cambios hardcodeados que rompan la respuesta a tema.
- Ejecutar build y lint antes de cerrar cambios.
