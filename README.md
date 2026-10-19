# GMS Frontend

Sistema frontend adaptable para la gestión y presencia digital de gimnasios. El proyecto está construido con **Vue 3 + Vite + Pinia + Tailwind CSS** y actualmente funciona como una aplicación completa de frontend con persistencia local.

## Idea general

GMS Frontend está pensado para cubrir dos enfoques de gimnasio dentro de una misma base:

- **Gimnasios por rutinas** para gimnasios tradicionales.
- **Gimnasios por horarios y clases** para modelos tipo CrossFit o clases grupales.

La propuesta principal es que la misma plataforma pueda cambiar su comportamiento mediante módulos activables y configurables, sin necesidad de forks del código. Un administrador puede activar o desactivar funcionalidades como calendario, rutinas, check-in, POS o gestión de usuarios desde el Landing Builder.

Además, la plataforma es **multi-gimnasio**: un mismo administrador puede gestionar varios gimnasios y alternar entre ellos; la información operativa (clases, rutinas, POS, check-in, usuarios y landing) se muestra según el gimnasio activo seleccionado.

## Enfoque

- **Frontend-first**: toda la aplicación corre actualmente en el navegador usando stores de Pinia y `localStorage`.
- **Modular**: funcionalidades clave se registran mediante módulos configurables.
- **Multi-rol**: la interfaz se adapta a `admin`, `trainer`, `member` y `guest`.
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
- **Check-in**: registro de llegada mediante QR efímero y auditoría.
- **POS**: punto de venta, inventario y reportes.
- **Usuarios**: administración de miembros, entrenadores y administradores.
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

- `LoginPage.vue` determina el rol por el contenido del correo.
- Además, resuelve el usuario real desde `useUserStore` por correo para tomar su identidad y, si es `trainer`, sus gimnasios con acceso y su gimnasio por defecto.
- `GuestAccessPage.vue` permite acceso temporal por teléfono.
- `useAuthStore` persiste usuario y token en `localStorage`.
- El router protege rutas con `requiresAuth` y `roles`.

Roles:

- `admin`
- `trainer`
- `member`
- `guest`

### Módulos

`useModuleStore` permite activar o desactivar:

- `calendar`
- `routines`
- `checkin`
- `pos`

Los módulos `users` y `gyms` permanecen siempre activos y no son configurables:

- `users`: disponible solo para `admin`.
- `gyms`: gestión multi-gimnasio, disponible solo para `admin`.

El store de módulos define presets:

- Tradicional: rutinas activas, calendario desactivado
- CrossFit / Clases: calendario activo, rutinas desactivadas
- Mixto: ambos activos

### Navegación por rol

`sidebarNavigation.js` define las rutas visibles según rol. Los items con campo `module` solo se muestran si el módulo está activo. El item `Gimnasios` se incluye únicamente para el rol `admin`.

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
- Admin y trainer pueden crear, editar y eliminar.
- Member solo consulta.
- Cada rutina contiene días y ejercicios.
- El miembro ve las rutinas colapsadas y puede buscar por keywords.

### Check-in

- QR efímero con actualización cada 10 segundos.
- Check-in manual mediante token.
- Escaneo con `BarcodeDetector` cuando está disponible.
- Auditoría para admin y trainer.
- Métricas de ocupación en vivo y por hora.

### POS

- Venta de productos con carrito.
- Inventario editable.
- Reportes de ventas, ingresos y stock bajo.
- Roles:
  - Trainer: solo ventas.
  - Admin: ventas, inventario y reportes.

### Usuarios

- CRUD de usuarios por admin.
- Roles: admin, trainer, member.
- El rol `admin` no es editable, desactivable ni eliminable.
- El registro de miembro incluye fecha de ingreso y modalidad de pago.
- Se calcula automáticamente la próxima fecha de pago.
- Al registrar un `trainer` se seleccionan los gimnasios a los que tiene acceso y su gimnasio por defecto.

### Multi-gimnasio

- El módulo `Gimnasios` está disponible solo para el rol `admin` y no es configurable (siempre activo).
- El header muestra un selector de gimnasio activo únicamente para `admin` y `trainer`.
- El `admin` puede seleccionar cualquier gimnasio; el `trainer` solo los que tenga asignados.
- El gimnasio seleccionado define el contexto de los datos mostrados en los módulos específicos:
  - Dashboard, Calendario, Plantillas, Rutinas, POS, Check-in y Landing Builder.
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
| `useUserStore` | Usuarios, roles y acceso a gimnasios de trainers |
| `useClassTemplateStore` | Plantillas de clase por gimnasio |
| `useClassScheduleStore` | Agenda de clases por gimnasio |
| `useBookingStore` | Reservas |
| `useRoutineStore` | Rutinas por gimnasio |
| `useCheckinStore` | Check-ins y tokens QR por gimnasio |
| `usePosStore` | Productos, ventas y carrito por gimnasio |
| `useLandingStore` | Bloques de landing por gimnasio |
| `useMediaStore` | Biblioteca de multimedia |
| `useNotificationStore` | Notificaciones derivadas de check-ins y ventas |

### Aislamiento por gimnasio

Los stores con datos operativos guardan los registros con un campo `gymId` y exponen getters filtrados por el gimnasio activo. Al cambiar el gimnasio en el header, los dashboards y módulos se recalculan automáticamente sin recargar la página.

### Notas de datos locales

Con la llegada del modelo multi-gimnasio, los stores operativos usan claves de persistencia `*-v2`. La primera vez que se abre esta versión, los datos mock se reinician con el seed definido en cada store y el gimnasio activo vuelve al primer gimnasio.

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
- módulos configurables
- builder de landing por gimnasio
- calendario propio
- rutinas
- check-in con QR
- POS e inventario
- usuarios y acceso de trainers a gimnasios
- dashboards por rol
- temas dinámicos

## Pendiente para producción

- Integración real con backend y base de datos.
- Autenticación segura basada en servidor.
- Validación de permisos por gimnasio en servidor.
- Migración del estado actual en `localStorage` a persistencia centralizada.
- Tests unitarios y de integración.
- Manejo centralizado de errores y loading.
- Sustitución de uploads locales por almacenamiento persistente.

## Hacia dónde va el proyecto

El siguiente paso natural es convertir GMS en una plataforma multi-tenant conectada a backend, con:

- API REST para todos los módulos
- base de datos relacional
- autenticación real con roles
- contexto de gimnasio activo validado en servidor
- asignación de gimnasios a entrenadores y roles
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
