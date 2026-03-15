# FitOS — Estado del Desarrollo

> Documento generado el 15/03/2026. Léelo de arriba abajo antes de tocar cualquier archivo.
> Cualquier agente o desarrollador debe leer este archivo **primero** para entender el estado actual del proyecto.

---

## 1. Visión General del Proyecto

**FitOS** es una plataforma SaaS para entrenadores personales y sus clientes. Permite a los entrenadores gestionar clientes, crear rutinas, planes de comida, formularios de onboarding personalizados y ligas de gamificación. Los clientes acceden con un código de invitación de su entrenador.

**Especificaciones completas:** `/especificaciones.md` en la raíz del proyecto. Lee el Capítulo 3 (arquitectura) y Capítulo 4 (base de datos) especialmente.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Monorepo | Turborepo 2.x + pnpm workspaces |
| Web app | Next.js 15 (App Router), React 19, TypeScript |
| Estilos | Tailwind CSS 4, shadcn/ui, CSS custom properties |
| Componentes UI | shadcn/ui + componentes propios estilo Aceternity |
| Base de datos | Supabase (PostgreSQL) — proyecto `fitos-prod` |
| Auth | Supabase Auth (email/password + OAuth preparado) |
| Mobile | Expo (React Native + TypeScript) — en construcción |
| Gestor de paquetes | **pnpm** (raíz) / **npm** dentro de `apps/web` |

---

## 3. Estructura del Monorepo

```
fitOS/
├── apps/
│   ├── web/          ← Next.js 15 (App principal — ACTIVA)
│   ├── mobile/       ← Expo (esqueleto básico, sin desarrollar)
│   ├── admin/        ← Placeholder vacío
│   └── landing/      ← Placeholder vacío
├── packages/
│   ├── ui/           ← Placeholder (componentes compartidos futuros)
│   ├── types/        ← Placeholder (tipos TypeScript compartidos)
│   ├── validations/  ← Placeholder (esquemas zod compartidos)
│   └── config/       ← Placeholder (configuración compartida)
├── services/
│   ├── ai/           ← Placeholder (Edge Functions de IA)
│   └── notifications/← Placeholder
├── supabase/
│   └── migrations/   ← Archivos SQL de migración (vacíos localmente, aplicados en Supabase)
├── turbo.json        ← Configuración Turborepo (usa "tasks", NO "pipeline")
├── pnpm-workspace.yaml
├── package.json      ← Scripts raíz: dev, build
├── especificaciones.md ← PRD Maestro completo
└── desarrollo.md     ← Este archivo
```

---

## 4. Supabase — Base de Datos

**Proyecto:** `fitos-prod`
**Project ID:** `rgrtxlciqmexdkxagomo`
**URL:** `https://rgrtxlciqmexdkxagomo.supabase.co`
**Región:** `eu-west-1`

### Tablas existentes (18 tablas, todas con RLS activado)

| Tabla | Descripción |
|---|---|
| `user_roles` | Rol del usuario: `trainer` o `client` |
| `trainer_promo_codes` | Códigos de invitación generados por entrenadores |
| `trainer_clients` | Relación entrenador ↔ cliente |
| `profiles` | Perfil extendido de cada usuario |
| `onboarding_forms` | Formularios personalizados de onboarding del entrenador |
| `onboarding_responses` | Respuestas de los clientes a los formularios |
| `trainer_food_library` | Biblioteca de alimentos del entrenador |
| `meal_plans` | Planes de comida asignados a clientes |
| `trainer_exercise_library` | Biblioteca de ejercicios del entrenador |
| `user_routines` | Rutinas asignadas a clientes |
| `weight_log` | Registro de pesos levantados por ejercicio |
| `body_metrics` | Medidas corporales (peso, % grasa, perímetros...) |
| `user_calendar` | Calendario de actividades (entreno, comida, descanso) |
| `rpe_history` | RPE por sesión de entrenamiento |
| `biometric_data` | Datos de wearables (HRV, sueño, pasos...) |
| `leagues` | Ligas de gamificación creadas por entrenadores |
| `league_members` | Miembros de cada liga con puntuación y ranking |
| `trainer_subscriptions` | Suscripciones de pago de entrenadores (Stripe) |

### Funciones de base de datos

- **`handle_new_user()`** — Trigger que se dispara en `auth.users` AFTER INSERT. Crea automáticamente una fila en `profiles` con `role` y `full_name` tomados de `raw_user_meta_data`.
- **`generate_promo_code(trainer_name TEXT)`** — Genera códigos únicos del tipo `CARLOS-X7K2`.

### Cómo ejecutar migraciones

Las migraciones ya están aplicadas en Supabase. Si necesitas aplicar nuevas:
```
supabase db push
```
O bien usa el MCP de Supabase con `apply_migration`.

---

## 5. Web App — `apps/web`

### Comandos
```bash
cd apps/web
npm run dev    # Desarrollo en localhost:3000
npm run build  # Build de producción (debe pasar sin errores)
```

### Variables de entorno — `apps/web/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://rgrtxlciqmexdkxagomo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
> ⚠️ Este archivo existe localmente. Para producción (Vercel), configura las mismas variables en el dashboard de Vercel.

### Estructura de `apps/web`

```
apps/web/
├── app/
│   ├── layout.tsx              ← Layout raíz: Inter font, class="dark", metadata FitOS
│   ├── globals.css             ← Tema FitOS: #0A0A0F fondo, #00E5FF cyan, #7C3AED violet
│   ├── page.tsx                ← Redirige a /login
│   ├── (auth)/                 ← Grupo de rutas públicas (sin dashboard shell)
│   │   ├── layout.tsx          ← Centra contenido en pantalla negra
│   │   ├── login/
│   │   │   └── page.tsx        ← Login con Spotlight + OAuth buttons
│   │   └── register/
│   │       └── page.tsx        ← Registro con selector rol + código promo
│   └── (dashboard)/            ← Grupo de rutas protegidas (con navbar)
│       ├── layout.tsx          ← Navbar con logo FitOS + backdrop blur
│       └── app/
│           └── trainer/
│               └── forms/
│                   └── page.tsx ← Editor de formulario de onboarding
├── components/
│   ├── ui/
│   │   ├── spotlight.tsx       ← Efecto Spotlight (Aceternity UI style)
│   │   ├── input.tsx           ← shadcn
│   │   ├── label.tsx           ← shadcn
│   │   ├── card.tsx            ← shadcn
│   │   ├── select.tsx          ← shadcn
│   │   ├── switch.tsx          ← shadcn
│   │   ├── badge.tsx           ← shadcn
│   │   ├── separator.tsx       ← shadcn
│   │   ├── tabs.tsx            ← shadcn
│   │   └── sonner.tsx          ← shadcn (toasts)
│   └── onboarding/
│       ├── FormFieldEditor.tsx  ← Editor de campos con drag & drop (8 tipos)
│       └── FormPreview.tsx      ← Vista previa del formulario
├── lib/
│   ├── supabase.ts             ← createClient() para componentes cliente
│   └── supabase-server.ts      ← createClient() para Server Components
├── middleware.ts                ← Protege /app/* → redirige a /login si no autenticado
└── .env.local                   ← Variables de entorno (no subir a Git)
```

---

## 6. Sistema de Autenticación

### Flujo de registro (Entrenador)
1. Usuario va a `/register`
2. Selecciona "Soy Entrenador"
3. Rellena nombre, email, contraseña
4. `supabase.auth.signUp()` → `raw_user_meta_data: { role: "trainer", full_name: "..." }`
5. Trigger `handle_new_user()` crea fila en `profiles`
6. Se inserta fila en `user_roles`
7. Redirige a `/onboarding/trainer` ← **Esta ruta aún no existe (TODO)**

### Flujo de registro (Cliente)
1. Usuario va a `/register`
2. Selecciona "Soy Cliente" → aparece campo "Código de tu entrenador"
3. El código se valida en tiempo real contra `trainer_promo_codes` (debounce 500ms)
4. Si válido, muestra el nombre del entrenador en verde
5. Al registrarse: Supabase Auth → `profiles` (trigger) → `user_roles` → `trainer_clients`
6. Redirige a `/onboarding/client` ← **Esta ruta aún no existe (TODO)**

### Middleware de protección
`middleware.ts` intercepta todas las rutas:
- Si ruta empieza por `/app` y no hay sesión → redirige a `/login`
- Si hay sesión y está en `/login` o `/register` → redirige a `/app/trainer/dashboard` (aún no existe)

---

## 7. Tema Visual

### Colores (CSS custom properties en `globals.css`)

| Variable | Valor | Uso |
|---|---|---|
| `--background` | `#0A0A0F` | Fondo principal (azul-negro profundo) |
| `--card` | `#12121A` | Superficies de tarjetas |
| `--primary` | `#00E5FF` | Acento principal (cyan neón) |
| `--secondary` | `#7C3AED` | Acento secundario (violeta eléctrico) |
| `--muted` | `#1A1A2E` | Fondo de hover y elementos secundarios |
| `--muted-foreground` | `#8B8BA3` | Texto secundario / placeholders |
| `--border` | `rgba(255,255,255,0.08)` | Bordes sutiles |
| `--destructive` | `#FF1744` | Errores y alertas |
| `--ring` | `#00E5FF` | Outline de focus |

### Clases de utilidad
- `.glow-cyan` — Sombra difusa cyan
- `.glow-cyan-hover:hover` — Glow al hacer hover
- `.glow-violet` — Sombra difusa violeta

### Tipografía
- **Inter** — Única fuente (400, 500, 600, 700)
- Cargada con `next/font/google`, variable CSS `--font-sans`

---

## 8. Editor de Formularios de Onboarding

**Ruta:** `/app/trainer/forms`

El editor permite al entrenador crear el formulario que rellenarán sus nuevos clientes al registrarse. Los formularios se guardan en la tabla `onboarding_forms` como JSONB.

### 8 tipos de campo disponibles

| Tipo | Descripción | Color |
|---|---|---|
| `text` | Texto libre corto | Cyan |
| `textarea` | Texto largo, varias líneas | Cyan |
| `number` | Valor numérico | Violeta |
| `select` | Selección única con opciones | Violeta |
| `multiselect` | Selección múltiple con opciones | Naranja |
| `boolean` | Toggle Sí / No | Verde |
| `scale` | Escala del 1 al 10 | Naranja |
| `date` | Selector de fecha | Rojo |

### Estructura JSONB de un campo

```json
{
  "id": "abc123",
  "type": "select",
  "label": "¿Cuál es tu objetivo principal?",
  "placeholder": "",
  "required": true,
  "options": ["Perder peso", "Ganar músculo", "Mejorar resistencia"]
}
```

---

## 9. Rutas Pendientes de Implementar (TODO)

Estas rutas están referenciadas en el código pero **aún no existen**:

| Ruta | Descripción | Prioridad |
|---|---|---|
| `/onboarding/trainer` | Wizard de onboarding del entrenador: nombre empresa, especialidad, generar código promo | 🔴 Alta |
| `/onboarding/client` | Wizard de onboarding del cliente: rellenar formulario del entrenador, datos biométricos | 🔴 Alta |
| `/app/trainer/dashboard` | Panel principal del entrenador: lista de clientes, métricas | 🔴 Alta |
| `/app/client/dashboard` | Panel principal del cliente: rutina hoy, comidas, progreso | 🔴 Alta |
| `/app/trainer/clients` | Lista detallada de clientes del entrenador | 🟡 Media |
| `/app/trainer/clients/[id]` | Perfil individual de cliente | 🟡 Media |
| `/app/trainer/routines` | Creación y asignación de rutinas | 🟡 Media |
| `/app/trainer/nutrition` | Creación y asignación de planes de comida | 🟡 Media |
| `/forgot-password` | Recuperación de contraseña | 🟡 Media |

---

## 10. Próximos Pasos Recomendados (Fase 1)

### Paso 1: Onboarding del Entrenador (`/onboarding/trainer`)
Wizard de 3 pasos:
1. **Paso 1** — Nombre de negocio, especialidad, bio (guarda en `profiles`)
2. **Paso 2** — Crear formulario de onboarding (reusar `FormFieldEditor`)
3. **Paso 3** — Generar código promo (llama a `generate_promo_code()` o crea uno personalizado en `trainer_promo_codes`)

### Paso 2: Dashboard del Entrenador (`/app/trainer/dashboard`)
- Sidebar de navegación
- Cards de estadísticas: clientes activos, formularios pendientes
- Lista de clientes recientes

### Paso 3: Onboarding del Cliente (`/onboarding/client`)
Wizard de 2 pasos:
1. **Paso 1** — Rellenar formulario del entrenador (datos dinámicos de `onboarding_forms`)
2. **Paso 2** — Datos biométricos básicos (peso, altura, objetivo → `profiles` + `body_metrics`)

### Paso 4: Configurar Vercel
- Conectar repositorio GitHub
- Añadir variables de entorno de producción
- Configurar dominio

---

## 11. Comandos Útiles

```bash
# Arrancar la web en desarrollo
cd apps/web && npm run dev

# Arrancar todo el monorepo (desde la raíz)
npm run dev    # Turborepo ejecuta dev en todos los workspaces

# Build de producción de la web
cd apps/web && npm run build

# Añadir componente shadcn
cd apps/web && npx shadcn@latest add [componente]

# Instalar dependencias en apps/web con legacy-peer-deps (necesario por conflictos)
cd apps/web && npm install [paquete] --legacy-peer-deps
```

---

## 12. Notas Importantes para el Siguiente Agente/Desarrollador

1. **pnpm vs npm**: La raíz del monorepo usa `pnpm`. PERO dentro de `apps/web` se usa `npm` directamente (porque shadcn CLI lo requiere). No mezclar.

2. **legacy-peer-deps**: Al instalar paquetes en `apps/web`, usar siempre `--legacy-peer-deps` porque hay conflictos de versión entre paquetes. Esto ya está configurado como default (`npm config set legacy-peer-deps true`).

3. **Turbo 2.x**: El campo en `turbo.json` es `"tasks"` (no `"pipeline"`). Cambios anteriores a v2 usan `"pipeline"` y darán error.

4. **Dark mode permanente**: El modo oscuro está siempre activo. NO hay toggle de light/dark. La clase `dark` está hardcodeada en `<html>`.

5. **Variables de entorno**: El `.env.local` de `apps/web` contiene la anon key de Supabase. Esta key es pública (anon key), no es secreta. La `service_role` key **nunca** debe ir en el frontend.

6. **Supabase RLS**: Todas las tablas tienen RLS activado. Las queries desde el frontend solo devuelven lo que las políticas permiten. Si algo no devuelve datos, revisa las políticas.

7. **`shadcn/ui` config**: El `components.json` está en `apps/web/` (no en la raíz). El style es `nova` con base en `neutral`.

8. **React Beautiful DnD**: Instalado en `apps/web` para el drag & drop del editor de formularios. Es una librería legacy (no mantenida activamente), pero funciona bien con React 18/19 en modo `StrictMode` desactivado. Si da problemas de renderizado, considera migrar a `@dnd-kit/core`.
