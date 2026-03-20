# FitOS — Estado del Desarrollo

> Documento actualizado el 19/03/2026 (Rediseño UI completado). Léelo de arriba abajo antes de tocar cualquier archivo.
> Cualquier agente o desarrollador debe leer este archivo **primero** para entender el estado actual del proyecto.
>
> **IMPORTANTE:** Al terminar cualquier desarrollo, bugfix o cambio significativo, actualiza este archivo (`desarrollo.md`) **y** `CLAUDE.md` antes de cerrar la sesión. Refleja los archivos nuevos o modificados, añade notas para el siguiente agente/desarrollador y actualiza la sección de próximos pasos. El objetivo es que cualquier persona o agente pueda continuar el proyecto sin contexto previo.

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
| Mobile | Expo 55 (React Native) + React Navigation + Supabase |
| Edge Functions | Supabase Edge Functions (Deno) — 4 funciones IA |
| Gestor de paquetes | **pnpm** (raíz) / **npm** dentro de `apps/web` |

---

## 3. Fases Completadas

### Fase 0 (Completada)
- Estructura del monorepo
- Supabase: 18 tablas con RLS
- Auth: registro/login con roles (trainer/client)
- Editor de formularios de onboarding
- Tema visual FitOS (dark mode)

### Fase 1 (MVP Core — En proceso de finalización)
- [x] Onboarding wizard entrenador y cliente
- [x] Dashboard completo del entrenador (sidebar, KPIs, CRUD)
- [x] Dashboard completo del cliente (bottom nav, 6 módulos)
- [x] Biblioteca de ejercicios y alimentos
- [x] Constructor de rutinas y menús
- [x] Vision Calorie Tracker (cámara + IA - requiere API Key)
- [x] Calendario master y página de progreso con gráficos
- [x] 4 Edge Functions de IA (Mencionado en PENDIENTE_FASE_1.md)
- [x] Integración Google Calendar OAuth (Configuración pendiente)
- [x] App móvil con 5 pantallas del cliente
- [x] Middleware con routing por roles
> [!NOTE]
> Ver `PENDIENTE_FASE_1.md` en la raíz para las tareas de configuración y seeds faltantes para cerrar esta fase.

### Rediseño UI — "Brutalismo Elegante" (Completado — 19/03/2026)
- Rediseño integral de 7 pantallas mobile y 3 páginas web
- Nuevo design system en `theme.ts` con tokens extendidos (colors, spacing, radius, shadows)
- Landing page premium en `apps/web/app/page.tsx` (hero animado, bento features, pricing)
- Dependencias añadidas: `expo-linear-gradient ~55.0.9`, `react-native-svg 15.15.3`
- SVG icons nativos reemplazando emojis en mobile
- Bento grids, gradient accents, uppercase tracking labels, glow effects
- Paridad visual web ↔ mobile mantenida

---

## 4. Estructura del Monorepo

```
fitOS/
├── apps/
│   ├── web/                    ← Next.js 15 (App principal — ACTIVA)
│   ├── mobile/                 ← Expo 55 (App cliente — 5 pantallas)
│   ├── admin/                  ← Placeholder vacío
│   └── landing/                ← Placeholder vacío
├── packages/
│   ├── ui/                     ← Placeholder (componentes compartidos futuros)
│   ├── types/                  ← Placeholder (tipos TypeScript compartidos)
│   ├── validations/            ← Placeholder (esquemas zod compartidos)
│   └── config/                 ← Placeholder (configuración compartida)
├── services/
│   ├── ai/                     ← Placeholder
│   └── notifications/          ← Placeholder
├── supabase/
│   ├── migrations/
│   │   └── 018_create_food_log.sql   ← Tabla food_log (Vision Calorie Tracker)
│   └── functions/
│       ├── analyze-food-image/       ← Claude Vision: análisis foto → macros
│       ├── generate-meal-plan/       ← Claude: generar plan nutricional
│       ├── generate-gym-routine/     ← Claude: generar rutina de ejercicios
│       └── analyze-onboarding-form/  ← Claude: analizar respuestas onboarding
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── especificaciones.md
└── desarrollo.md               ← Este archivo
```

---

## 5. Supabase — Base de Datos

**Proyecto:** `fitos-prod`
**Project ID:** `rgrtxlciqmexdkxagomo`
**URL:** `https://rgrtxlciqmexdkxagomo.supabase.co`
**Región:** `eu-west-1`

### Tablas existentes (19 tablas, todas con RLS activado)

| Tabla | Descripción |
|---|---|
| `user_roles` | Rol del usuario: `trainer` o `client` |
| `trainer_promo_codes` | Códigos de invitación generados por entrenadores |
| `trainer_clients` | Relación entrenador ↔ cliente |
| `profiles` | Perfil extendido de cada usuario (incluye `google_calendar_tokens`) |
| `onboarding_forms` | Formularios personalizados de onboarding del entrenador |
| `onboarding_responses` | Respuestas de los clientes (incluye `ai_analysis`, `analyzed_at`) |
| `trainer_food_library` | Biblioteca de alimentos del entrenador |
| `meal_plans` | Planes de comida asignados a clientes |
| `exercises` | Biblioteca de ejercicios (globales + propios del entrenador) |
| `user_routines` | Rutinas asignadas a clientes |
| `food_log` | **NUEVA** — Registro de comidas (manual + AI Vision) |
| `workout_logs` | Registro de entrenamientos completados |
| `weight_log` | Registro de pesos levantados por ejercicio |
| `body_metrics` | Medidas corporales (peso, % grasa, perímetros...) |
| `user_calendar` | Calendario de actividades |
| `rpe_history` | RPE por sesión de entrenamiento |
| `biometric_data` | Datos de wearables |
| `leagues` | Ligas de gamificación |
| `league_members` | Miembros de cada liga |
| `trainer_subscriptions` | Suscripciones de pago (Stripe) |

### Funciones de base de datos
- **`handle_new_user()`** — Trigger en `auth.users` → crea `profiles`
- **`generate_promo_code(trainer_name TEXT)`** — Genera códigos tipo `CARLOS-X7K2`

### Tabla `food_log` (migración 018)
```sql
-- Campos: id, client_id, logged_at, meal_type, foods (JSONB), totales de macros, photo_url, source, ai_raw, notes
-- Índices: por client_id+fecha
-- RLS: cliente gestiona su propio log, entrenador lee logs de sus clientes
```

---

## 6. Web App — `apps/web`

### Comandos
```bash
cd apps/web
npm run dev    # Desarrollo en localhost:3000
npm run build  # Build de producción
```

### Variables de entorno — `apps/web/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://rgrtxlciqmexdkxagomo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar (añadir cuando se configure)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback
```

### Estructura de rutas completa

```
apps/web/app/
├── layout.tsx                          ← Layout raíz: Inter font, class="dark"
├── globals.css                         ← Tema FitOS completo
├── page.tsx                            ← ✅ Landing page pública (hero, features, pricing)
│
├── (auth)/                             ← Rutas públicas
│   ├── layout.tsx                      ← Centra contenido
│   ├── login/page.tsx                  ← Login + OAuth
│   ├── register/page.tsx               ← Registro con rol + código promo
│   ├── forgot-password/page.tsx        ← Recuperación de contraseña
│   ├── reset-password/page.tsx         ← Resetear contraseña
│   └── onboarding/
│       ├── trainer/page.tsx            ← ✅ Wizard 3 pasos: negocio, formulario, código promo
│       └── client/page.tsx             ← ✅ Wizard 2 pasos: formulario entrenador, datos biométricos
│
├── (dashboard)/                        ← Rutas protegidas
│   ├── layout.tsx                      ← Layout genérico
│   └── app/
│       ├── trainer/
│       │   ├── layout.tsx              ← ✅ TrainerSidebar (240px, colapsable a 72px)
│       │   ├── dashboard/page.tsx      ← ✅ KPIs + actividad reciente + acciones rápidas
│       │   ├── clients/page.tsx        ← ✅ Lista clientes con búsqueda + tabla
│       │   ├── clients/[id]/page.tsx   ← ✅ Detalle cliente con 5 tabs (Perfil, Progreso, Rutina, Menú, Formulario)
│       │   ├── exercises/page.tsx      ← ✅ Biblioteca de ejercicios (globales + propios, filtros, CRUD)
│       │   ├── routines/page.tsx       ← ✅ Constructor de rutinas (días de semana, ejercicios, sets/reps/RIR)
│       │   ├── nutrition/page.tsx      ← ✅ Menú creator + Biblioteca de alimentos (2 tabs)
│       │   ├── forms/page.tsx          ← Editor de formulario onboarding (drag & drop, 8 tipos)
│       │   └── settings/page.tsx       ← ✅ Código promo + perfil editable
│       │
│       └── client/
│           ├── layout.tsx              ← ✅ ClientBottomNav (5 tabs)
│           ├── dashboard/page.tsx      ← ✅ Resumen diario + stats + acciones rápidas
│           ├── calories/page.tsx       ← ✅ Vision Calorie Tracker (foto → IA → macros)
│           ├── routine/page.tsx        ← ✅ Rutina actual con tracker de sets
│           ├── meals/page.tsx          ← ✅ Plan de comidas asignado (por día)
│           ├── calendar/page.tsx       ← ✅ Calendario master (entrenos, comidas, métricas)
│           └── progress/page.tsx       ← ✅ Mediciones corporales + gráfico SVG + historial
│
├── api/
│   └── auth/google/
│       ├── route.ts                    ← ✅ Inicia OAuth de Google Calendar
│       └── callback/route.ts           ← ✅ Callback OAuth → guarda tokens en profiles
│
├── components/
│   ├── layout/
│   │   ├── TrainerSidebar.tsx          ← ✅ Sidebar colapsable con 7 nav items + logout
│   │   └── ClientBottomNav.tsx         ← ✅ Bottom nav con 5 tabs + indicador activo
│   ├── onboarding/
│   │   ├── FormFieldEditor.tsx         ← Editor de campos con drag & drop
│   │   └── FormPreview.tsx             ← Vista previa del formulario
│   └── ui/                             ← shadcn/ui components
│
├── lib/
│   ├── supabase.ts                     ← createClient() browser
│   ├── supabase-server.ts              ← createClient() server
│   └── google-calendar.ts             ← ✅ OAuth helpers + CRUD eventos + sync helpers
│
└── middleware.ts                        ← ✅ Protección por rol (trainer/client separation)
```

### Middleware — Routing por roles
El middleware protege rutas y separa los accesos:
- `/app/*` sin sesión → redirige a `/login`
- `/onboarding/*` sin sesión → redirige a `/login`
- `/login` o `/register` con sesión + onboarding completado → redirige al dashboard según rol
- `/login` o `/register` con sesión + onboarding NO completado → redirige a `/onboarding/[rol]`
- `/app/*` con sesión pero onboarding NO completado → redirige a `/onboarding/[rol]`
- `/app/client/*` para trainers → redirige a `/app/trainer/dashboard`
- `/app/trainer/*` para clients → redirige a `/app/client/dashboard`
- El flag `onboarding_completed` se lee de `user.user_metadata` (sin query a DB)

---

## 7. Edge Functions — `supabase/functions/`

4 funciones Deno que usan Claude API (Anthropic). Todas requieren `ANTHROPIC_API_KEY` en los secrets de Supabase. Sin la key, devuelven respuesta mock o error informativo.

| Función | Endpoint | Descripción |
|---|---|---|
| `analyze-food-image` | POST | Recibe `image_base64` → Claude Vision → devuelve alimentos estimados con macros |
| `generate-meal-plan` | POST | Recibe datos del cliente → Claude genera plan semanal completo en JSON |
| `generate-gym-routine` | POST | Recibe objetivo/nivel/días → Claude genera rutina con ejercicios y progresión |
| `analyze-onboarding-form` | POST | Recibe `response_id` → Claude analiza respuestas → devuelve informe + recomendaciones |

### Configurar Edge Functions
```bash
# Configurar API key de Anthropic
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx

# Desplegar todas las funciones
supabase functions deploy analyze-food-image
supabase functions deploy generate-meal-plan
supabase functions deploy generate-gym-routine
supabase functions deploy analyze-onboarding-form
```

---

## 8. Google Calendar Integration

### Flujo OAuth
1. Cliente hace click en "Conectar Google Calendar" → `GET /api/auth/google`
2. Redirige a Google OAuth consent screen
3. Google callback → `GET /api/auth/google/callback`
4. Se intercambian tokens y se guardan en `profiles.google_calendar_tokens`
5. El helper `google-calendar.ts` provee funciones para crear/listar/eliminar eventos

### Variables de entorno necesarias
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback
```

### Helpers disponibles (`lib/google-calendar.ts`)
- `getGoogleAuthUrl(state?)` — URL de autorización
- `exchangeCodeForTokens(code)` — Intercambio code → tokens
- `refreshAccessToken(refreshToken)` — Renovar token
- `createCalendarEvent(token, event)` — Crear evento
- `listCalendarEvents(token, timeMin, timeMax)` — Listar eventos
- `deleteCalendarEvent(token, eventId)` — Eliminar evento
- `syncWorkoutToCalendar(token, workout)` — Crear evento de entreno
- `syncMealToCalendar(token, meal)` — Crear evento de comida

---

## 9. Mobile App — `apps/mobile`

### Tecnología
- Expo SDK 55, React Native 0.83.2, React 19
- React Navigation (Bottom Tabs)
- Supabase client con AsyncStorage
- expo-linear-gradient ~55.0.9 (gradientes en botones/fondos)
- react-native-svg 15.15.3 (iconos SVG nativos)
- Sentry para monitoreo

### Comandos
```bash
cd apps/mobile
npm install    # Instalar dependencias (ejecutar tras cambios en package.json)
npm run dev    # Expo start
npm run ios    # iOS simulator
npm run android # Android emulator
```

### Variables de entorno — `apps/mobile/.env`
```env
EXPO_PUBLIC_SUPABASE_URL=https://rgrtxlciqmexdkxagomo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Estructura
```
apps/mobile/
├── App.tsx                             ← ✅ Entry: AuthProvider + NavigationContainer + Bottom Tabs
├── src/
│   ├── theme.ts                        ← ✅ Design system completo (colors, spacing, radius, shadows)
│   ├── lib/supabase.ts                 ← Cliente Supabase con AsyncStorage
│   ├── contexts/AuthContext.tsx         ← Auth state + listener de sesión
│   └── screens/
│       ├── LoginScreen.tsx             ← ✅ Login con email/password
│       ├── OnboardingScreen.tsx        ← ✅ Wizard 2 pasos: formulario entrenador + datos biométricos
│       ├── DashboardScreen.tsx         ← ✅ Resumen diario (kcal ring, stats, quick actions)
│       ├── CaloriesScreen.tsx          ← ✅ Vision Calorie Tracker (cámara/galería → IA)
│       ├── RoutineScreen.tsx           ← ✅ Rutina del día con set tracker interactivo
│       ├── MealsScreen.tsx             ← ✅ Plan de comidas por día con macros
│       └── ProgressScreen.tsx          ← ✅ Mediciones + historial + tendencias
├── app.json                            ← Config Expo + Sentry
└── package.json                        ← Dependencias actualizadas
```

### Dependencias a instalar (si no están)
```bash
cd apps/mobile
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage @supabase/supabase-js expo-image-picker
```

---

## 10. Sistema de Autenticación

### Flujo de registro (Entrenador)
1. `/register` → selecciona "Soy Entrenador"
2. Rellena nombre, email, contraseña
3. `supabase.auth.signUp()` → trigger crea `profiles`
4. Se inserta `user_roles`
5. Redirige a `/onboarding/trainer` → Wizard 3 pasos:
   - Paso 1: nombre negocio, especialidad, bio → guarda en `profiles`
   - Paso 2: crear formulario onboarding (reutiliza FormFieldEditor)
   - Paso 3: generar código promo → `trainer_promo_codes`

### Flujo de registro (Cliente)
1. `/register` → selecciona "Soy Cliente"
2. Introduce código del entrenador (validación real-time)
3. Registro → `profiles` + `user_roles` + `trainer_clients`
4. Redirige a `/onboarding/client` → Wizard 2 pasos:
   - Paso 1: rellenar formulario del entrenador
   - Paso 2: datos biométricos (peso, altura, objetivo)

### Middleware de protección
Protege rutas por autenticación Y por rol. Trainers no acceden a rutas de client y viceversa.

---

## 11. Tema Visual

### Colores (CSS custom properties en `globals.css`)

| Variable | Valor | Uso |
|---|---|---|
| `--background` | `#0A0A0F` | Fondo principal (azul-negro profundo) |
| `--card` | `#12121A` | Superficies de tarjetas |
| `--primary` | `#00E5FF` | Acento principal (cyan neón) |
| `--secondary` | `#7C3AED` | Acento secundario (violeta eléctrico) |
| `--muted` | `#1A1A2E` | Fondo hover |
| `--muted-foreground` | `#8B8BA3` | Texto secundario |
| `--border` | `rgba(255,255,255,0.08)` | Bordes sutiles |
| `--destructive` | `#FF1744` | Errores |

### Patrones de diseño — "Brutalismo Elegante"
- **Cards:** `rounded-2xl border border-white/[0.06] bg-[#12121A]`
- **Botón primario:** `bg-[#00E5FF] text-[#0A0A0F] rounded-xl`
- **Loading spinner:** `h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent`
- **Glow effects:** `shadow-[0_0_20px_rgba(0,229,255,0.15)]` y gradient overlays con opacity 0.06
- **Section labels:** `text-xs font-bold uppercase tracking-[0.2em] text-[#5A5A72]`
- **Headings:** `text-3xl font-black tracking-tight` (font-weight: 900)
- **Bento grids:** CSS Grid en web (`grid-cols-2 lg:grid-cols-4`), flex ratios en mobile
- **Gradient accents:** Blobs difusos con blur-2xl en cards, LinearGradient en botones mobile
- **Tipografía:** Inter (400, 500, 600, 700, 800, 900)

### Mobile theme tokens (`apps/mobile/src/theme.ts`)
- `colors`: 20+ tokens incluyendo `dimmed`, `cyanDim`, `cyanGlow`, `violetDim`, `orangeDim`, `greenDim`, `borderSubtle`, `borderActive`, `surfaceHover`
- `spacing`: `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 }`
- `radius`: `{ sm: 8, md: 12, lg: 16, xl: 20, pill: 100 }`
- `shadows`: `card`, `subtle`, `glow(color)` — usar `shadows.glow(colors.cyan)` para glow effects

---

## 12. Próximos Pasos Recomendados (Fase 2)

| Tarea | Prioridad | Descripción |
|---|---|---|
| Configurar Vercel | 🔴 Alta | Conectar repo GitHub, env vars, dominio |
| Aplicar migración food_log | 🔴 Alta | `supabase db push` o aplicar `018_create_food_log.sql` |
| Configurar ANTHROPIC_API_KEY | 🔴 Alta | `supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx` |
| Insertar datos seed | 🟡 Media | Ejercicios y alimentos globales en las tablas correspondientes |
| Configurar Google Calendar | 🟡 Media | Crear proyecto en Google Cloud Console, obtener OAuth credentials |
| Instalar deps mobile | 🟡 Media | `cd apps/mobile && npx expo install ...` (ver sección 9) |
| Stripe / suscripciones | 🟡 Media | Integrar pagos para entrenadores |
| Gamificación / Ligas | 🟢 Baja | Implementar el sistema de ligas (tablas ya existen) |
| Notificaciones push | 🟢 Baja | Expo Notifications para mobile |
| Wearables / biometric_data | 🟢 Baja | Integraciones con Apple Health, Google Fit, Garmin |

---

## 13. Comandos Útiles

```bash
# Web — desarrollo
cd apps/web && npm run dev

# Web — build producción
cd apps/web && npm run build

# Mobile — desarrollo
cd apps/mobile && npm run dev

# Monorepo completo
npm run dev

# Añadir componente shadcn
cd apps/web && npx shadcn@latest add [componente]

# Instalar en web (siempre con --legacy-peer-deps)
cd apps/web && npm install [paquete] --legacy-peer-deps

# Supabase — aplicar migraciones
supabase db push

# Supabase — desplegar Edge Functions
supabase functions deploy [nombre]
```

---

## 14. Notas Importantes para el Siguiente Agente/Desarrollador

### Convenciones del proyecto

1. **pnpm vs npm**: Raíz usa `pnpm`. Dentro de `apps/web` se usa `npm` (shadcn CLI lo requiere). No mezclar.

2. **legacy-peer-deps**: Al instalar en `apps/web`, siempre usar `--legacy-peer-deps`.

3. **Turbo 2.x**: El campo en `turbo.json` es `"tasks"` (no `"pipeline"`).

4. **Dark mode permanente**: Clase `dark` hardcodeada en `<html>`. No hay toggle light/dark.

5. **Variables de entorno**: El `.env.local` contiene la anon key (pública). La `service_role` key **nunca** va en frontend.

6. **Supabase RLS**: Todas las tablas tienen RLS activado. Si una query no devuelve datos, revisar las políticas antes de tocar el código.

7. **shadcn/ui**: `components.json` está en `apps/web/`. Estilo `nova`, base `neutral`.

8. **food_log.client_id**: La tabla `food_log` usa `client_id` como FK (no `user_id`). Diferente al resto de tablas que usan `user_id`.

9. **Edge Functions**: Requieren `ANTHROPIC_API_KEY` en Supabase secrets. Sin ella, devuelven respuestas mock/error informativo.

10. **Google Calendar**: Los tokens se guardan en `profiles.google_calendar_tokens` (JSONB). Si la columna no existe: `ALTER TABLE profiles ADD COLUMN google_calendar_tokens JSONB DEFAULT NULL`.

11. **Mobile**: La app necesita `npm install` después de cambios en `package.json`. Las dependencias de React Navigation se instalan con `npx expo install`.

12. **Sonner (toast)**: Nutrición y rutinas usan `import { toast } from "sonner"`. El `<Toaster />` debe estar en el layout raíz o dashboard.

---

### Errores conocidos y cómo evitarlos

> Esta sección documenta errores que ya ocurrieron. Leerla antes de tocar las áreas afectadas evita repetirlos.

---

**ERROR #1 — FK join inexistente entre `trainer_clients` y `profiles`**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/clients/page.tsx`
- **Qué pasó:** Se intentó hacer un join directo `profiles!trainer_clients_client_id_fkey(...)` en la query de Supabase. Crasheaba porque no existe FK entre `trainer_clients` y `profiles` — ambas tablas referencian `auth.users` de forma independiente (`trainer_clients.client_id → auth.users.id` y `profiles.user_id → auth.users.id`).
- **Solución aplicada:** Dos queries separadas: primero `trainer_clients`, luego `profiles` filtrando por los IDs obtenidos, y merge manual por `client_id === user_id`.
- **Regla:** Nunca asumir que existe una FK entre tablas sin verificarlo en el schema. En esta base de datos, `profiles` y `trainer_clients` NO están directamente relacionadas entre sí.

---

**ERROR #2 — Query a tabla inexistente `trainer_profiles`**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/settings/page.tsx`
- **Qué pasó:** La página consultaba `trainer_profiles` que no existe. Los datos de perfil del entrenador están en `profiles` (columnas `business_name`, `specialty`, `bio`) y el código promocional está en `trainer_promo_codes`.
- **Solución aplicada:** Reescritura completa de la página para usar las tablas correctas.
- **Regla:** Antes de escribir cualquier query, verificar que la tabla existe consultando la sección "Supabase — Base de Datos" de este documento o el schema real. Las 19 tablas están listadas en la sección 5.

---

**ERROR #3 — `react-beautiful-dnd` incompatible con React 19**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/components/onboarding/FormFieldEditor.tsx`
- **Qué pasó:** `react-beautiful-dnd` usa APIs internas de React que fueron eliminadas en React 19. Crasheaba en runtime al renderizar el editor de formularios (call stack de 58 frames en `Droppable`).
- **Solución aplicada:** Eliminada la dependencia por completo. Reordenado de campos implementado con botones ▲▼ nativos. No requiere ninguna librería externa.
- **Regla:** No instalar `react-beautiful-dnd` en este proyecto. Si se necesita DnD en el futuro, usar `@dnd-kit/core` que sí es compatible con React 19.

---

**ERROR #4 — Arrays de la DB llegan como `null` aunque el tipo TypeScript diga `string[]`**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/exercises/page.tsx`
- **Qué pasó:** Los campos `primary_muscles`, `secondary_muscles` y `equipment` del tipo `Exercise` están declarados como `string[]`, pero PostgreSQL puede devolver `null` si la columna no tiene valor. Crasheaba en `.length` y `.map()`.
- **Solución aplicada:** Usar siempre null-coalescing: `(exercise.primary_muscles ?? []).map(...)` y `(exercise.primary_muscles?.length ?? 0) > 0`.
- **Regla:** En este proyecto, los campos array de Supabase pueden ser `null` en runtime aunque el tipo TypeScript diga `string[]`. Usar siempre `?? []` al iterar y `?.length ?? 0` al comprobar longitud. Aplicar esta misma precaución en cualquier campo array de cualquier tabla.

---

**ERROR #5 — Columnas incorrectas en `body_metrics`**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/client/progress/page.tsx`
- **Qué pasó:** El código usaba nombres de columna inventados (`weight_kg`, `hip_cm`, `arm_cm`, `thigh_cm`, `user_id`) que no existen en la tabla real. Supabase devolvía `Could not find the 'arm_cm' column of 'body_metrics' in the schema cache`.
- **Solución aplicada:** Corregidos todos los nombres al schema real y la FK correcta.
- **Mapeo correcto:**
  - `weight_kg` → `body_weight_kg`
  - `hip_cm` → `hips_cm`
  - `arm_cm` → `right_arm_cm`
  - `thigh_cm` → `right_thigh_cm`
  - `user_id` → `client_id` (esta tabla usa `client_id`, no `user_id`)
- **Regla:** Antes de escribir queries a `body_metrics`, verificar el schema en `especificaciones.md` sección 4.12. La tabla usa `client_id` (no `user_id`) y los nombres de columna son más específicos de lo esperado.

---

**ERROR #6 — `trainer_clients.created_at` no existe**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/clients/page.tsx`
- **Qué pasó:** La query ordenaba por `created_at`, pero la columna en `trainer_clients` se llama `joined_at`.
- **Solución aplicada:** Cambiado `created_at` → `joined_at` en el `.order()`.
- **Regla:** En `trainer_clients`, la columna de fecha es `joined_at`, no `created_at`.

---

**ERROR #7 — `profiles` no tiene columnas `height_cm`/`weight_kg`**
- **Fecha:** 18/03/2026
- **Archivos afectados:** `apps/web/app/(auth)/onboarding/client/page.tsx`, `apps/mobile/src/screens/OnboardingScreen.tsx`
- **Qué pasó:** El onboarding intentaba guardar `height_cm` y `weight_kg` en `profiles`, pero las columnas reales son `height` y `weight`.
- **Solución aplicada:** Corregidos a `height` y `weight` en web y mobile.
- **Regla:** `profiles` usa `height` y `weight` (sin sufijo `_cm`/`_kg`).

---

**ERROR #8 — `profiles.role` es NOT NULL — upsert fallaba**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(auth)/onboarding/trainer/page.tsx`
- **Qué pasó:** El upsert del onboarding del entrenador no incluía el campo `role`, y como la columna es NOT NULL, Supabase devolvía `null value in column "role" of relation "profiles"`.
- **Solución aplicada:** Añadido `role: "trainer"` en el objeto del upsert.
- **Regla:** Cualquier upsert a `profiles` debe incluir `role` (valor: `"trainer"` o `"client"`).

---

**ERROR #9 — `onboarding_responses` viola unique constraint en reintento**
- **Fecha:** 18/03/2026
- **Archivos afectados:** `apps/web/app/(auth)/onboarding/client/page.tsx`, `apps/mobile/src/screens/OnboardingScreen.tsx`
- **Qué pasó:** El onboarding del cliente usaba `insert` al guardar respuestas. Si el usuario recargaba o reintentaba, fallaba con `duplicate key value violates unique constraint "onboarding_responses_form_id_client_id_key"`.
- **Solución aplicada:** Cambiado a `upsert` con `onConflict: "form_id,client_id"` en web y mobile.
- **Regla:** Siempre usar `upsert` (no `insert`) para `onboarding_responses`. La tabla tiene un unique constraint en `(form_id, client_id)`.

---

**ERROR #10 — `meal_plans` usa columna `days`, no `content`**
- **Fecha:** 18/03/2026
- **Archivos afectados:** `apps/mobile/src/screens/MealsScreen.tsx`
- **Qué pasó:** La pantalla móvil seleccionaba la columna `content` de `meal_plans`, que no existe. Los datos del plan semanal están en la columna `days` (JSONB).
- **Solución aplicada:** Cambiado `content` → `days` en el select y en la interfaz TypeScript.
- **Regla:** `meal_plans` almacena el array de días en la columna `days`. No existe columna `content`.

---

**ERROR #11 — JSONB (`food_preferences`) renderizado directamente como hijo React**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/clients/[id]/page.tsx`
- **Qué pasó:** El detalle de cliente renderizaba `profile.food_preferences` directamente en JSX. Al ser un objeto JSONB, React lanzaba "Objects are not valid as a React child".
- **Solución aplicada:** Usar `JSON.stringify()` o renderizar campos específicos del objeto con optional chaining.
- **Regla:** Nunca renderizar campos JSONB directamente como texto en React. Convertir con `JSON.stringify()` o acceder a propiedades específicas.

---

**ERROR #12 — `meal_plans` insert usaba `user_id` y columna `name` inexistentes**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/nutrition/page.tsx`
- **Qué pasó:** El creator de menús insertaba con `user_id` (no existe, es `client_id`) y `name` (no existe, es `title`). También `target_kcal` puede ser NOT NULL.
- **Solución aplicada:** Corregido a `client_id`, `title`, y añadido fallback `|| 2000` para `target_kcal`.
- **Regla:** En `meal_plans`: FK es `client_id`, nombre del plan es `title`, `target_kcal` es NOT NULL (usar fallback `|| 2000`).

---

**ERROR #13 — `trainer_clients` no se creaba en el registro por falta de `service_role` key**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/api/complete-registration/route.ts`
- **Qué pasó:** La API route de registro intentaba insertar en `trainer_clients` usando el cliente anon, pero RLS bloqueaba la inserción al no haber sesión activa en ese momento.
- **Solución aplicada:** Usar `createClient(url, SERVICE_ROLE_KEY)` en la API route. Añadir `SUPABASE_SERVICE_ROLE_KEY` a `.env.local`.
- **Regla:** Las API routes que necesitan bypasear RLS deben usar la `service_role` key. Nunca en frontend.

---

**ERROR #19 — Múltiples columnas incorrectas en detalle de cliente `[id]/page.tsx`**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/clients/[id]/page.tsx`
- **Qué pasó:** El componente tenía varios errores de nombres de columna acumulados:
  - `profiles`: `height_cm`/`weight_kg` (no existen) → columnas reales son `height`/`weight`
  - `body_metrics`: `user_id` → `client_id`, `weight_kg` → `body_weight_kg`, `measured_at` → `recorded_at`
  - `meal_plans`: `user_id` → `client_id`, `name` → `title`
  - `user_routines`: `user_id` → `client_id`, `name` → `title`
  - `onboarding_responses`: `user_id` → `client_id`, `answers` → `responses`
  - `food_preferences` se renderizaba como JSON crudo con `JSON.stringify()`
  - El tab Formulario mostraba IDs de campo como labels en vez de los labels reales
- **Solución aplicada:** Reescritura completa del archivo con todos los nombres de columna correctos. Se añadió `FoodPreferencesDisplay` que muestra restricciones como pills, alergias y alimentos no deseados como texto. El tab Formulario carga `fields` del form para mostrar labels legibles. Se añadió `GOAL_LABELS` para traducir los valores internos de goal a texto legible.
- **Regla:** Verificar siempre en especificaciones.md el nombre exacto de cada columna antes de escribir queries. Los nombres en la DB son específicos y no siempre coinciden con lo que parece intuitivo.

---

**ERROR #18 — Editor de formulario duplicado en Formularios y Ajustes (desincronizado)**
- **Fecha:** 18/03/2026
- **Archivos afectados:** `apps/web/app/(dashboard)/app/trainer/settings/page.tsx`
- **Qué pasó:** El editor de formulario de onboarding existía tanto en `/trainer/forms` como en `/trainer/settings`. La query en settings no filtraba por `is_active: true` ni ordenaba por fecha, por lo que podía cargar un form diferente al de la página de Formularios. Cambios en uno no se veían en el otro.
- **Solución aplicada:** Eliminado el editor duplicado de Ajustes. Settings ahora muestra solo el contador de campos y un botón "Editar formulario" que lleva a `/trainer/forms`, donde está el editor real.
- **Regla:** El formulario de onboarding se edita únicamente en `/app/trainer/forms`. Ajustes es de solo lectura para el formulario (muestra resumen + enlace).

---

**ERROR #17 — `body_metrics` insert falla por `recorded_at` NOT NULL faltante**
- **Fecha:** 18/03/2026
- **Archivos afectados:** `apps/web/app/(auth)/onboarding/client/page.tsx`, `apps/mobile/src/screens/OnboardingScreen.tsx`
- **Qué pasó:** El insert a `body_metrics` en el onboarding no incluía `recorded_at`, que es `TIMESTAMPTZ NOT NULL`. Supabase devolvía `{}` (objeto de error sin serializar) en consola. El onboarding completaba igual (error non-blocking) pero el peso inicial del cliente no se registraba.
- **Solución aplicada:** Añadido `recorded_at: new Date().toISOString()` al insert en web y mobile.
- **Regla:** `body_metrics` requiere siempre `client_id`, `recorded_at` (NOT NULL) y al menos un campo de medida. Ver schema completo en especificaciones.md sección 4.12.

---

**ERROR #16 — Check constraint `profiles_goal_check` viola por valores incorrectos**
- **Fecha:** 18/03/2026
- **Archivos afectados:** `apps/web/app/(auth)/onboarding/client/page.tsx`, `apps/mobile/src/screens/OnboardingScreen.tsx`
- **Qué pasó:** Los GOAL_OPTIONS usaban labels en español con mayúsculas y espacios ("Hipertrofia", "Perdida de peso") pero la columna `profiles.goal` tiene un check constraint que solo acepta valores en minúsculas con guion bajo: `('hipertrofia','fuerza','perdida_peso','mantenimiento')`.
- **Solución aplicada:** GOAL_OPTIONS cambiados a objetos `{ label, value }`. El label se muestra en UI, el value (en minúsculas con guion bajo) se guarda en DB. Aplicado en web y mobile.
- **Valores correctos:** `'hipertrofia'`, `'fuerza'`, `'perdida_peso'`, `'mantenimiento'`
- **Regla:** Siempre verificar check constraints en especificaciones.md antes de enviar texto a columnas con CHECK en DB. Los enums de `profiles.goal` están definidos en la sección 4.x de especificaciones.md.

---

**ERROR #15 — `profiles.update()` falla en onboarding cliente (message genérico)**
- **Fecha:** 18/03/2026
- **Archivo afectado:** `apps/web/app/(auth)/onboarding/client/page.tsx`
- **Qué pasó:** El paso 2 del onboarding mostraba "Error al guardar tu perfil. Intenta nuevamente." sin más detalle. Dos causas: (1) el error genérico ocultaba el mensaje real de Supabase, (2) se usaba `.update()` que falla si el trigger no creó la fila del profile, y (3) `body_metrics` se insertaba con `user_id` en vez de `client_id`.
- **Solución aplicada:** Cambiado `.update()` → `.upsert()` con `onConflict: "user_id"` e incluyendo `role` (NOT NULL). El mensaje de error ahora muestra `profileErr.message`. El `body_metrics` insert corregido a `client_id`.
- **Regla:** En onboarding de cliente, usar siempre `upsert` (no `update`) en profiles e incluir `role`. El error de Supabase debe mostrarse siempre con `.message`, nunca un texto genérico que oculte el problema real.

---

**ERROR #14 — Onboarding no se disparaba tras login de cliente**
- **Fecha:** 18/03/2026
- **Archivos afectados:** `apps/web/middleware.ts`, `apps/web/app/(auth)/onboarding/client/page.tsx`, `apps/web/app/(auth)/onboarding/trainer/page.tsx`, `apps/mobile/App.tsx`
- **Qué pasó:** Tras confirmar el email y hacer login, el usuario iba al dashboard sin pasar por el onboarding. El middleware no controlaba si el onboarding estaba completado.
- **Solución aplicada:** Usar `user_metadata.onboarding_completed` (flag en auth.users) para gate el acceso. Middleware redirige a `/onboarding/client` o `/onboarding/trainer` si el flag es false. Al completar el onboarding se llama `supabase.auth.updateUser({ data: { onboarding_completed: true } })`.
- **Regla:** El onboarding_completed se guarda en `user_metadata` (no en DB). Verificar este flag en middleware y en `App.tsx` mobile antes de mostrar dashboard.

---

**ERROR #20 — expo install muestra error de config plugins pero los paquetes se instalan correctamente**
- **Fecha:** 19/03/2026
- **Archivo afectado:** `apps/mobile/package.json`
- **Qué pasó:** Al ejecutar `npx expo install expo-linear-gradient react-native-svg`, el post-install mostraba "Cannot find module './utils/autoAddConfigPlugins.js'" pero los paquetes se añadieron correctamente a `package.json` y funcionan en runtime.
- **Solución aplicada:** Ignorar el error de config plugins. Verificar en `package.json` que los paquetes están listados.
- **Regla:** `expo install` puede fallar en el paso de auto-add config plugins sin que eso afecte la instalación real. Si aparece este error, verificar `package.json` antes de reintentar.

---

### Regla de mantenimiento

**Al terminar cualquier desarrollo, bugfix o cambio significativo:**

1. Actualizar la estructura de rutas de la sección 6 si se añadieron o modificaron archivos.
2. Actualizar la sección "Próximos Pasos" (sección 12) para reflejar el estado real.
3. Si ocurrió algún error durante el desarrollo, documentarlo en la sección "Errores conocidos" siguiendo el formato existente (archivo, qué pasó, solución, regla).
4. Actualizar también `CLAUDE.md` si la regla es lo suficientemente crítica para estar visible desde el primer momento.
5. **Verificar paridad web ↔ mobile**: cualquier cambio en web debe reflejarse en mobile y viceversa. No dar una tarea por terminada si solo está implementada en una plataforma.

El objetivo es que cualquier persona o agente que llegue al proyecto pueda continuar sin contexto previo y sin repetir los mismos errores.
