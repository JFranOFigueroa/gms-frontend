# GMS Frontend

Sistema frontend adaptable para la gestión y presencia digital de gimnasios. El proyecto está construido con **Vue 3 + Vite + Pinia + Tailwind CSS** y actualmente funciona como una aplicación completa de frontend con persistencia local.

## Idea general

GMS Frontend está pensado para cubrir dos enfoques de gimnasio dentro de una misma base:

- **Gimnasios por rutinas** para gimnasios tradicionales.
- **Gimnasios por horarios y clases** para modelos tipo CrossFit o clases grupales.

La propuesta principal es que la misma plataforma pueda cambiar su comportamiento mediante módulos activables y configurables, sin necesidad de forks del código. Un administrador puede activar o desactivar funcionalidades como calendario, rutinas, check-in, POS o gestión de usuarios desde el Landing Builder.

## Enfoque

- **Frontend-first**: toda la aplicación corre actualmente en el navegador usando stores de Pinia y `localStorage`.
- **Modular**: funcionalidades clave se registran mediante módulos configurables.
- **Multi-rol**: la interfaz se adapta a `admin`, `trainer`, `member` y `guest`.
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
- `GuestAccessPage.vue` permite acceso temporal por teléfono.
- `useAuthStore` persiste usuario y token en `localStorage`.
- El router protege rutas con `requiresAuth`.

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

El módulo `users` permanece siempre activo para administradores.

El store de módulos define presets:

- Tradicional: rutinas activas, calendario desactivado
- CrossFit / Clases: calendario activo, rutinas desactivadas
- Mixto: ambos activos

### Navegación por rol

`sidebarNavigation.js` define las rutas visibles según rol. Los items con campo `module` solo se muestran si el módulo está activo.

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
- módulos configurables
- builder de landing
- calendario propio
- rutinas
- check-in con QR
- POS e inventario
- usuarios
- dashboards por rol
- temas dinámicos

## Pendiente para producción

- Integración real con backend y base de datos.
- Autenticación segura basada en servidor.
- Tests unitarios y de integración.
- Manejo centralizado de errores y loading.
- Sustitución de uploads locales por almacenamiento persistente.

## Hacia dónde va el proyecto

El siguiente paso natural es convertir GMS en una plataforma multi-tenant conectada a backend, con:

- API REST para todos los módulos
- base de datos relacional
- autenticación real con roles
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
