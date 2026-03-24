# FitOS — Estado del Desarrollo

> Documento actualizado el 23/03/2026 (Chat interno + Calendario de citas + Widget iOS/Android: ver entrenamiento del día sin abrir la app). Léelo de arriba abajo antes de tocar cualquier archivo.
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

### Fase 2 — Chat interno (23/03/2026)
- [x] Chat interno cifrado (RLS) entre entrenador y cliente — Migración 029
- [x] Web trainer: tab "Chat" en detalle de cliente (`clients/[id]/page.tsx`) con 6 tabs (requiere scroll horizontal)
- [x] Web cliente: nueva ruta `/app/client/chat/page.tsx` + badge de no leídos en `ClientSidebar`
- [x] Mobile: `ChatScreen.tsx` nuevo + tab "Chat" en `App.tsx` (6 tabs en bottom nav)
- [x] Actualización optimista de mensajes en ambos lados (aparecen al instante, no dependen de Realtime)
- [x] Badge con conteo de mensajes no leídos en sidebar del cliente: píldora cyan con glow; en sidebar colapsada: punto glowing sobre el icono; se resetea al entrar en `/app/client/chat`
- [x] `AppSidebar` soporta prop `badge?: number` en cualquier `SidebarNavItem`
- [x] `ClientSidebar` convertida en componente inteligente (fetch unread + Realtime subscription)
- Funcionalidades chat: Realtime para mensajes del otro usuario, agrupación por día, marcado de leído, scroll automático, tick de confirmación (gris=enviado, color=leído)

### Fase 2 — Calendario de citas (23/03/2026) — **PENDIENTE DE DESARROLLO PARCIAL**
- [x] Migración 030: tabla `appointments` con session_type, status, google_event_id, email_sent_at — **Aplicar en Supabase SQL Editor**
- [x] RLS: trainer acceso total; cliente SELECT + INSERT (solo pending) + UPDATE (solo a cancelled)
- [x] Realtime habilitado en tabla `appointments`
- [x] Web trainer: `/app/trainer/appointments/page.tsx` — CRUD completo (crear, confirmar, completar, cancelar)
- [x] Web cliente: `/app/client/appointments/page.tsx` — solicitar, ver y cancelar citas
- [x] TrainerSidebar: item "Citas" añadido
- [x] ClientSidebar: item "Citas" añadido (entre Progreso y Chat)
- [x] Mobile: `AppointmentsScreen.tsx` — ver citas, solicitar con picker de día/hora, cancelar
- [x] Mobile: tab "Citas" añadido en `App.tsx` (7 tabs en bottom nav)
- [x] `lib/google-calendar.ts`: función `syncAppointmentToCalendar()` preparada — **PENDIENTE OAuth 2.0**
- [x] `lib/email-notifications.ts`: `sendAppointmentEmail()` con template HTML preparada — **PENDIENTE Resend + dominio**

**Pendiente de completar (requiere configuración externa):**
- [ ] Sincronización Google Calendar: configurar OAuth 2.0 (NEXT_PUBLIC_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_GOOGLE_REDIRECT_URI), guardar tokens en Supabase Vault, llamar `syncAppointmentToCalendar()` desde API route tras confirmar cita
- [ ] Emails Resend: obtener dominio verificado, RESEND_API_KEY, instalar `resend` (`npm install resend --legacy-peer-deps`), descomentar bloque TODO en `sendAppointmentEmail()`, añadir RESEND_API_KEY y RESEND_FROM_EMAIL a .env.local y Vercel

### Fase 3 — Widget iOS y Android (23/03/2026)
- [x] `react-native-android-widget` instalado y configurado como plugin en `app.json`
- [x] `src/widgets/TodayWorkoutWidget.tsx` — componente JSX del widget Android (FlexWidget, TextWidget, ListWidget)
- [x] `src/widgets/widget-task-handler.tsx` — handler lifecycle (WIDGET_ADDED, UPDATE, RESIZED, CLICK, DELETED)
- [x] `src/lib/widget-data.ts` — consulta `user_routines` + `workout_sessions`, escribe JSON a AsyncStorage
- [x] `src/lib/widget-sync.ts` — `updateWidget(userId)` sincroniza datos y actualiza widget Android via `requestWidgetUpdate()`
- [x] `index.ts` actualizado con `registerWidgetTaskHandler()`
- [x] `app.json`: bundle IDs configurados (`com.antigravity.fitos`), splash bg actualizado, widget plugin Android
- [x] iOS WidgetKit: `plugins/withIOSWidget.js` genera archivos Swift en `ios/TodayWorkoutWidget/` durante `expo prebuild`
- [x] Integración en `DashboardScreen` (sync al montar) y `RoutineScreen` (sync al completar sesión en ambos modos)

**Funcionalidad del widget:**
- Muestra nombre del día, label del entrenamiento, lista de ejercicios con sets/reps
- Indica si es día de descanso
- Badge "COMPLETADO" si la sesión del día ya se hizo
- Tap abre la app
- Se refresca cada 30 min + al abrir la app + al completar sesión

**Pendiente iOS (requiere build nativo):**
- [ ] Ejecutar `expo prebuild` para generar proyecto nativo
- [ ] En Xcode: añadir target Widget Extension, copiar Swift generado, configurar App Group
- [ ] Implementar módulo nativo para escribir a App Group UserDefaults desde React Native

### Rediseño UI — "Brutalismo Elegante" y Dashboards Premium (Actualizado — 23/03/2026)
- Rediseño integral de 7 pantallas mobile y páginas web públicas / auth (19/03/2026)
- **Dashboards Premium (Entrenador y Cliente):** Implementación de *glassmorphism* intensivo, texturas `.dot-grid` globales, rediseño flotante en la `AppSidebar` y transparencias en tarjetas de contenido (`backdrop-blur-xl`). Se actualizaron masivamente todas las rutas internas y layouts base para unificar estética holográfica con la landing page (23/03/2026)
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
│   │   ├── 018_create_food_log.sql   ← Tabla food_log (Vision Calorie Tracker)
│   │   ├── 019_add_pending_status_trainer_clients.sql ← Status 'pending' en trainer_clients
│   │   ├── 020_trainer_clients_rls_client_select.sql  ← RLS select para clientes
│   │   ├── 021_trainer_exercise_overrides.sql ← Layer C: overrides de ejercicios + set_updated_at()
│   │   ├── 022_trainer_food_overrides.sql     ← Layer C: overrides de alimentos
│   │   ├── 023_excel_imports.sql              ← Tracking importaciones Excel
│   │   ├── 024_workout_sessions.sql           ← Sesiones de entrenamiento + weight_log.session_id
│   │   ├── 025_alter_user_routines_weeks.sql  ← Bloques semanales + aliases en exercises
│   │   ├── 026_enable_pg_trgm.sql             ← Extensión trigram + funciones de similitud
│   │   ├── 027_exercise_override_hidden.sql   ← hidden BOOLEAN en trainer_exercise_overrides
│   │   ├── 028_weight_log_client_notes.sql    ← client_notes TEXT en weight_log
│   │   ├── 029_chat_messages.sql              ← Tabla messages (chat trainer↔cliente) + RLS + Realtime
│   │   └── 030_appointments.sql              ← Tabla appointments (citas) + RLS + Realtime
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
| `trainer_exercise_overrides` | **NUEVA** — Layer C: personalizaciones + `hidden` BOOLEAN para ocultar globals por trainer |
| `trainer_food_overrides` | **NUEVA** — Layer C: personalizaciones de alimentos globales por trainer |
| `excel_imports` | **NUEVA** — Tracking de importaciones Excel (columnas detectadas, datos raw, decisiones) |
| `workout_sessions` | **NUEVA** — Agrupa weight_log por sesión (modo registration/active) |
| `messages` | **NUEVA** — Chat trainer↔cliente. Campos: `trainer_id`, `client_id`, `sender_id`, `content`, `read_at`. RLS doble. Realtime activo. |
| `appointments` | **NUEVA** — Citas entre trainer y cliente. `session_type` (presencial/online/telefonica/evaluacion/seguimiento), `status` (pending/confirmed/cancelled/completed), `google_event_id` (NULL hasta OAuth), `email_sent_at` (NULL hasta Resend). RLS: trainer total, cliente SELECT+INSERT+UPDATE limitado. Realtime activo. |

### Funciones de base de datos
- **`handle_new_user()`** — Trigger en `auth.users` → crea `profiles`
- **`generate_promo_code(trainer_name TEXT)`** — Genera códigos tipo `CARLOS-X7K2`
- **`set_updated_at()`** — Trigger genérico para actualizar `updated_at` en cualquier tabla
- **`search_similar_exercises(search_term, p_trainer_id, threshold, max)`** — Búsqueda por similitud trigram
- **`search_similar_foods(search_term, p_trainer_id, threshold, max)`** — Búsqueda por similitud trigram

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

# Google Calendar (añadir cuando se configure OAuth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback

# Resend (añadir cuando se tenga dominio verificado)
RESEND_API_KEY=
RESEND_FROM_EMAIL=citas@tu-dominio.com
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
│       │   ├── clients/[id]/page.tsx   ← ✅ Detalle cliente con 6 tabs (Perfil, Progreso, Rutina+sesiones, Menú+food_log, Formulario, Chat)
│       │   ├── exercises/page.tsx      ← ✅ Biblioteca de ejercicios (3 capas, clone-on-edit global, overrides hidden)
│       │   ├── routines/page.tsx       ← ✅ Constructor de rutinas (días de semana, ejercicios, sets/reps/RIR)
│       │   ├── nutrition/page.tsx      ← ✅ Menú creator + Biblioteca de alimentos (2 tabs)
│       │   ├── import/page.tsx          ← ✅ Importar Excel (4 pasos: upload, mapeo, reconciliación, review; Haiku detecta estructura, linked array para reconciliación, clone-on-edit global)
│       │
│       │   # Client routes:
│       │   # routine/page.tsx          ← ✅ Rutina con semanas, ANTERIOR, dos modos (registro + activo)
│       │   # routine/active/page.tsx   ← ✅ Entrenamiento activo (nav libre, resume, notas, finalizar rutina)
│       │   ├── forms/page.tsx          ← Editor de formulario onboarding (drag & drop, 8 tipos)
│       │   ├── appointments/page.tsx   ← ✅ Calendario de citas: crear, confirmar, completar, cancelar
│       │   └── settings/page.tsx       ← ✅ Código promo + perfil editable
│       │
│       └── client/
│           ├── layout.tsx              ← ✅ ClientSidebar (sidebar con badge de no leídos en Chat)
│           ├── dashboard/page.tsx      ← ✅ Resumen diario + stats + acciones rápidas
│           ├── calories/page.tsx       ← ✅ Vision Calorie Tracker (foto → IA → macros)
│           ├── routine/page.tsx        ← ✅ Rutina actual con tracker de sets
│           ├── meals/page.tsx          ← ✅ Plan de comidas asignado (por día)
│           ├── calendar/page.tsx       ← ✅ Calendario master (entrenos, comidas, métricas)
│           ├── progress/page.tsx       ← ✅ Mediciones corporales + gráfico SVG + historial
│           ├── appointments/page.tsx   ← ✅ Ver/solicitar/cancelar citas con el entrenador
│           └── chat/page.tsx           ← ✅ Chat con entrenador (Realtime, optimista, leído)
│
├── api/
│   ├── auth/google/
│   │   ├── route.ts                    ← ✅ Inicia OAuth de Google Calendar
│   │   └── callback/route.ts           ← ✅ Callback OAuth → guarda tokens en profiles
│   ├── import/
│   │   ├── excel/route.ts              ← ✅ Upload Excel → Claude Haiku analysis + save
│   │   ├── create-exercises/route.ts   ← ✅ Server-side exercise creation (service_role, bypasses RLS)
│   │   └── reconcile/route.ts          ← ✅ Entity reconciliation via pg_trgm similarity
│   ├── client-trainer/route.ts         ← ✅ API para relación cliente-trainer
│   └── fix-client-link/route.ts        ← ✅ Fix client link
│
├── components/
│   ├── layout/
│   │   ├── AppSidebar.tsx              ← ✅ Sidebar genérico — acepta badge?: number en SidebarNavItem
│   │   ├── TrainerSidebar.tsx          ← ✅ Wrapper de AppSidebar para el entrenador (8 nav items: Dashboard, Clientes, Rutinas, Nutrición, Personalización, Ejercicios, Formularios, Citas, Ajustes)
│   │   └── ClientSidebar.tsx           ← ✅ Wrapper inteligente: fetch unread + Realtime badge en Chat
│   ├── onboarding/
│   │   ├── FormFieldEditor.tsx         ← Editor de campos con drag & drop
│   │   └── FormPreview.tsx             ← Vista previa del formulario
│   └── ui/                             ← shadcn/ui components
│
├── lib/
│   ├── supabase.ts                     ← createClient() browser
│   ├── supabase-server.ts              ← createClient() server
│   ├── google-calendar.ts             ← ✅ OAuth helpers + CRUD eventos + sync helpers
│   ├── exercise-resolver.ts           ← ✅ Three-layer exercise resolver (A/B/C)
│   ├── food-resolver.ts              ← ✅ Three-layer food resolver (A/B/C)
│   └── excel-parser.ts               ← ✅ Column type definitions + header keywords (Haiku does inference)
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
- `syncAppointmentToCalendar(token, appointment)` — Crear evento de cita (**PENDIENTE OAuth**)

### Email notifications (`lib/email-notifications.ts`)
- `sendAppointmentEmail(data)` — Envía email de confirmación/cancelación de cita. **STUB** — no envía hasta configurar Resend.
- Template HTML con estilo FitOS ya incluido.
- **Para activar:** (1) dominio verificado en resend.com, (2) RESEND_API_KEY en .env.local y Vercel, (3) `npm install resend --legacy-peer-deps`, (4) descomentar bloque TODO en la función.

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
│   ├── lib/widget-data.ts              ← ✅ Widget: consulta rutina + sesiones, escribe JSON a AsyncStorage
│   ├── lib/widget-sync.ts              ← ✅ Widget: updateWidget() → syncData + requestWidgetUpdate (Android)
│   ├── contexts/AuthContext.tsx         ← Auth state + listener de sesión
│   ├── widgets/
│   │   ├── TodayWorkoutWidget.tsx      ← ✅ Widget Android: JSX con FlexWidget/TextWidget/ListWidget
│   │   └── widget-task-handler.tsx     ← ✅ Widget lifecycle handler (added/update/resize/click/delete)
│   └── screens/
│       ├── LoginScreen.tsx             ← ✅ Login con email/password
│       ├── OnboardingScreen.tsx        ← ✅ Wizard 2 pasos: formulario entrenador + datos biométricos
│       ├── DashboardScreen.tsx         ← ✅ Resumen diario (kcal ring, stats, quick actions) + widget sync
│       ├── CaloriesScreen.tsx          ← ✅ Vision Calorie Tracker (cámara/galería → IA)
│       ├── RoutineScreen.tsx           ← ✅ Rutina: 3 modos (overview + registro + activo) con ANTERIOR, semanas, rest timer + widget sync
│       ├── MealsScreen.tsx             ← ✅ Plan de comidas por día con macros
│       ├── ProgressScreen.tsx          ← ✅ Mediciones + historial + tendencias
│       ├── ChatScreen.tsx              ← ✅ Chat con entrenador (Realtime, FlatList, burbujas, agrupación por día)
│       └── AppointmentsScreen.tsx      ← ✅ Citas: ver próximas/historial, solicitar (picker día+hora), cancelar
├── plugins/
│   └── withIOSWidget.js                ← ✅ Expo config plugin: genera WidgetKit Swift files + App Group entitlement
├── app.json                            ← Config Expo + Sentry + react-native-android-widget plugin + iOS widget plugin
├── index.ts                            ← Entry point + registerWidgetTaskHandler()
└── package.json                        ← Dependencias actualizadas (+ react-native-android-widget)
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

## 12. Próximos Pasos Recomendados

### Estado Fase 2 — completado parcialmente (23/03/2026)

| Tarea | Estado | Notas |
|---|---|---|
| Chat interno trainer↔cliente | ✅ Completo | Web + Mobile. Migración 029 aplicada. |
| Calendario de citas (CRUD) | ✅ Completo | Web + Mobile. Migración 030 — **pendiente aplicar en Supabase** |
| Sincronización Google Calendar | ⏳ Pendiente configuración | Stub listo en `lib/google-calendar.ts`. Requiere OAuth 2.0 |
| Emails de confirmación (Resend) | ⏳ Pendiente configuración | Stub listo en `lib/email-notifications.ts`. Requiere dominio + RESEND_API_KEY |
| Panel de métricas negocio (MRR/churn) | ❌ Sin iniciar | Requiere Stripe |
| Área personal entrenador (código promo, suscripción) | ⏳ Parcial | Código promo en Settings. Stripe pendiente. |
| Supabase Realtime dashboard entrenador | ❌ Sin iniciar | body_metrics, weight_log en tiempo real |

### Paridad mobile pendiente (Fase 1)

| Tarea | Estado | Descripción |
|---|---|---|
| Notas del cliente en entrenamiento activo | ✅ Hecho | `exerciseNotes` en rest timer, se guarda en `weight_log.client_notes` |
| Sesión resumible ("Completar rutina en curso") | ✅ Hecho | Botón naranja en overview, carga `weight_log` de sesión `in_progress`, restaura sets/notas |
| Navegación libre entre ejercicios | ✅ Hecho | Botones Anterior/Siguiente siempre visibles, "Finalizar rutina" en último ejercicio |
| Trainer ve datos del cliente (Rutina + Menú tabs) | ❌ Solo web | Mobile no tiene vista de detalle de cliente aún |
| Import Excel | ❌ Solo web | No aplica a mobile (funcionalidad exclusiva de trainer en web) |

### Estado Fase 3 — parcial (23/03/2026)

| Tarea | Estado | Notas |
|---|---|---|
| Widget iOS y Android | ✅ Completo | Ver entrenamiento del día sin abrir la app. Android: `react-native-android-widget` con JSX. iOS: WidgetKit SwiftUI via Expo config plugin. |
| Motor de auto-regulación | ❌ Sin iniciar | Alertas sueño < 6h, HRV bajo |
| Comandos de voz v1.0 | ❌ Sin iniciar | Registrar series/pesos por voz |

### Configuración pendiente (bloquean features)

| Config | Prioridad | Qué desbloquea |
|---|---|---|
| Aplicar migración `030_appointments.sql` en Supabase | 🔴 Alta | Tabla citas — sin esto el módulo de citas no funciona |
| Dominio verificado en Resend + `RESEND_API_KEY` | 🟠 Alta | Emails de confirmación de citas |
| OAuth 2.0 Google Calendar (Google Cloud Console) | 🟠 Alta | Sync citas → Google Calendar |
| `ANTHROPIC_API_KEY` en Supabase secrets | 🟡 Media | Edge Functions IA (actualmente retornan mock) |
| Insertar datos seed | 🟡 Media | Ejercicios y alimentos globales |
| Stripe / suscripciones | 🟡 Media | Pagos para entrenadores |
| Notificaciones push (Expo Notifications) | 🟢 Baja | Avisos de nueva cita, mensaje, rutina |
| Wearables / biometric_data | 🟢 Baja | Apple Health, Google Fit, Garmin |
| Gamificación / Ligas | 🟢 Baja | Tablas ya existen, falta UI |

### Pasos para activar Resend (cuando tengas dominio)
```bash
# 1. Instalar resend
cd apps/web && npm install resend --legacy-peer-deps

# 2. Añadir a .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=citas@tu-dominio.com

# 3. Añadir las mismas vars en Vercel → Settings → Environment Variables

# 4. En lib/email-notifications.ts: descomentar el bloque TODO con resend.emails.send()
```

### Pasos para activar Google Calendar OAuth (cuando tengas credenciales)
```bash
# 1. Añadir a .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback

# 2. En lib/google-calendar.ts ya están todas las funciones listas
# 3. Guardar tokens en Supabase Vault (profiles.google_calendar_tokens o tabla dedicada)
# 4. Llamar syncAppointmentToCalendar() desde una API route tras confirmar cita
```

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

**ERROR #22 — Registration view no creaba `workout_sessions`**
- **Fecha:** 21/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/client/routine/page.tsx`
- **Qué pasó:** `handleSaveSession` insertaba directamente en `weight_log` sin crear un registro en `workout_sessions` primero. Los weight_log quedaban sin `session_id`, rompiendo la agrupación por sesión.
- **Solución aplicada:** Añadido `INSERT INTO workout_sessions` antes de los weight_log inserts. El `session_id` se pasa a cada weight_log. Se actualizan los aggregates (volume, sets, exercises) al final.
- **Regla:** Toda sesión de entrenamiento (registration o active) DEBE crear un `workout_sessions` primero y pasar el `session_id` a cada `weight_log`.

---

**ERROR #23 — Rest timer creaba múltiples intervals por dependencia incorrecta**
- **Fecha:** 21/03/2026
- **Archivos afectados:** `apps/web/.../active/page.tsx`, `apps/mobile/.../RoutineScreen.tsx`
- **Qué pasó:** El useEffect del rest timer tenía `restTime > 0 ? "ticking" : "stopped"` como dependencia, creando un string nuevo en cada render y potencialmente disparando múltiples intervals.
- **Solución aplicada:** Cambiado a depender solo de `phase`/`mode`. El interval se crea una vez cuando phase="rest" y se limpia en el cleanup.
- **Regla:** Nunca usar expresiones ternarias que generen strings como dependencias de useEffect. Usar valores estables (estado, refs).

---

**ERROR #24 — Elapsed timer mobile no limpiaba al desmontar**
- **Fecha:** 21/03/2026
- **Archivo afectado:** `apps/mobile/src/screens/RoutineScreen.tsx`
- **Qué pasó:** El cleanup del useEffect del elapsed timer era `return () => {}` (vacío). Si el usuario salía de la pantalla durante un entrenamiento activo, el interval seguía corriendo en background.
- **Solución aplicada:** Añadido clearInterval en la función de cleanup.
- **Regla:** Todo useEffect que cree un setInterval DEBE limpiarlo en su return cleanup.

---

**ERROR #21 — `moddatetime` no disponible en Supabase**
- **Fecha:** 20/03/2026
- **Archivos afectados:** Migraciones 021-024
- **Qué pasó:** Los triggers `updated_at` usaban `EXECUTE FUNCTION moddatetime(updated_at)` que requiere la extensión `moddatetime`, no habilitada en Supabase por defecto.
- **Solución aplicada:** Crear función custom `set_updated_at()` en migración 021 (`CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER...`) y usarla en todos los triggers.
- **Regla:** No usar `moddatetime()` en Supabase. Usar siempre `set_updated_at()` para triggers de `updated_at`.

---

**ERROR #25 — `column user_routines.days does not exist` en entrenamiento activo**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/client/routine/active/page.tsx`
- **Qué pasó:** La query selectaba `days` de `user_routines`, pero esa columna no existe. Los ejercicios están en la columna `exercises` (JSONB array).
- **Solución aplicada:** Eliminado `days` del select. Parsear ejercicios solo desde `routine.exercises`.
- **Regla:** `user_routines` NO tiene columna `days`. Los ejercicios están en `exercises` (JSONB). El campo `day_of_week` de cada ejercicio dentro del array determina a qué día pertenece.

---

**ERROR #26 — Excel import "Solo entrenadores" por query a tabla incorrecta**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/api/import/excel/route.ts`
- **Qué pasó:** La verificación de rol consultaba `user_roles` que no contiene el campo `role` correctamente. La tabla correcta es `profiles`.
- **Solución aplicada:** Cambiado a `profiles` con `.select("role").eq("user_id", user.id)`.
- **Regla:** El rol del usuario se obtiene de `profiles.role`, no de `user_roles`.

---

**ERROR #27 — Ejercicios insertados pero no aparecen en biblioteca (RLS silencioso)**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/import/page.tsx`
- **Qué pasó:** Los ejercicios se insertaban desde el frontend con el client Supabase (anon key). RLS bloqueaba silenciosamente el insert — no daba error pero los datos no se guardaban.
- **Solución aplicada:** Creada API route `/api/import/create-exercises` que usa `SUPABASE_SERVICE_ROLE_KEY` para bypassear RLS.
- **Regla:** Cualquier insert a `trainer_exercise_library` desde import debe ir via server-side API route con `service_role`. RLS puede bloquear silenciosamente desde el frontend.

---

**ERROR #28 — `category CHECK constraint violation` en trainer_exercise_library**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/api/import/create-exercises/route.ts`
- **Qué pasó:** La tabla tenía un CHECK constraint limitando `category` a valores específicos. Los ejercicios de Excel tenían categorías libres que no coincidían.
- **Solución aplicada:** Ejecutar `ALTER TABLE trainer_exercise_library DROP CONSTRAINT ...` para permitir texto libre. Category es ahora nullable sin restricción.
- **Regla:** `trainer_exercise_library.category` es TEXT libre (sin CHECK). No hay columna `difficulty` ni `equipment`.

---

**ERROR #29 — primary_muscles/secondary_muscles no se guardan al editar ejercicio global**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/exercises/page.tsx`
- **Qué pasó:** Al editar un ejercicio global, se hacía update directo. Pero el entrenador no tiene permiso de escritura en ejercicios globales. Los cambios parecían guardarse (no error) pero los datos no persistían.
- **Solución aplicada:** Implementado patrón clone-on-edit: al guardar cambios en un ejercicio global, se clona como privado (`is_global: false`) y se oculta el original via `trainer_exercise_overrides.hidden = true`.
- **Regla:** Nunca hacer update directo a ejercicios globales. Siempre clonar como privado + ocultar original. Usar tres capas (Layer A/B/C) para resolución.

---

**ERROR #30 — Sets completados no se persisten en DB hasta navegar al siguiente ejercicio**
- **Fecha:** 22/03/2026
- **Archivos afectados:** `apps/web/app/(dashboard)/app/client/routine/active/page.tsx`, `apps/mobile/src/screens/RoutineScreen.tsx`
- **Qué pasó:** Al marcar una serie como completada (check), solo se actualizaba el estado local. Si el cliente salía de la pantalla (o cerraba la app) a mitad de ejercicio, al volver con "Completar rutina en curso" todos los datos se perdían porque `weight_log` solo se escribía al navegar al siguiente ejercicio.
- **Solución aplicada:** Nueva función `savePartialProgress()` que hace upsert a `weight_log` inmediatamente en cada check de serie. El campo `sets_data` ahora incluye `completed: boolean` por set. La lógica de resume restaura sets parcialmente completados.
- **Regla:** Cada interacción del usuario que genera datos debe persistirse inmediatamente en DB, no solo en estado local. Usar upsert (check existencia + update/insert) para evitar duplicados.

---

**ERROR #31 — Botones de entrenamiento visibles después de completar la sesión del día**
- **Fecha:** 22/03/2026
- **Archivos afectados:** `apps/web/app/(dashboard)/app/client/routine/page.tsx`, `apps/mobile/src/screens/RoutineScreen.tsx`
- **Qué pasó:** Después de finalizar una sesión de entrenamiento, el cliente podía volver a la página de rutina y ver los botones "Registrar" / "Entrenar en activo", pudiendo iniciar una segunda sesión duplicada para el mismo día.
- **Solución aplicada:** Se cargan todas las `workout_sessions` completadas para la rutina y se compara por `day_label::week_number`. Si la combinación ya existe, se muestra badge "Sesión completada" en lugar de los botones. Permite múltiples sesiones distintas en el mismo día.
- **Regla:** Bloquear por identidad de sesión (rutina + día + semana), no por fecha. Consultar siempre el estado actual en DB, no asumir desde el frontend.

---

**ERROR #32 — Import Excel "link" oculta ejercicios globales en vez de mantenerlos visibles**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/api/import/create-exercises/route.ts`
- **Qué pasó:** Cuando un ejercicio del Excel se enlazaba (link) a un ejercicio global existente durante la reconciliación, el route creaba un `trainer_exercise_overrides` con `hidden: true`. Esto ocultaba el ejercicio global de la biblioteca del trainer. Al re-importar el mismo Excel, los ejercicios aparecían como "Match 100%" pero no se veían en la biblioteca porque estaban ocultos.
- **Solución aplicada:** "Link" en import ahora crea un ejercicio privado con el nombre del trainer si el nombre difiere del global. Si el nombre es idéntico (match 100%), el global ya es visible y no se clona. Nunca se ocultan globales desde import. El `hidden: true` solo se usa en clone-on-edit desde la página de ejercicios.
- **Regla:** Import "link" con nombre diferente = crear privado con nombre del Excel. Import "link" con nombre igual = no hacer nada, el global es visible. Nunca ocultar globales desde import.

---

**SQL de limpieza — Restaurar ejercicios ocultos por bug de import (ERROR #32)**

Ejecutar en Supabase SQL Editor para restaurar los ejercicios globales que fueron ocultados por imports anteriores:

```sql
-- Ver cuántos overrides hidden hay
SELECT * FROM trainer_exercise_overrides WHERE hidden = true;

-- Eliminarlos (restaura la visibilidad de los ejercicios globales)
DELETE FROM trainer_exercise_overrides WHERE hidden = true;
```

---

**ERROR #33 — `supabaseKey is required` en build de Vercel (cliente Supabase a nivel de módulo)**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/api/import/create-exercises/route.ts`
- **Qué pasó:** El cliente `supabaseAdmin` se inicializaba a nivel de módulo (fuera de cualquier función). Durante el build de Vercel, Next.js evalúa todos los módulos para recoger page data, y en ese momento las variables de entorno (`SUPABASE_SERVICE_ROLE_KEY`) no están disponibles → crash con `supabaseKey is required`.
- **Solución aplicada:** Mover la inicialización del cliente dentro de la función handler (`POST`), no a nivel de módulo.
- **Regla:** Nunca crear clientes Supabase (ni ningún cliente que dependa de env vars) a nivel de módulo en API routes. Siempre inicializarlos dentro de la función handler.

---

**ERROR #34 — `Error occurred prerendering page "/app/client/routine/active"` en build de Vercel**
- **Fecha:** 22/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/client/routine/active/page.tsx`
- **Qué pasó:** Next.js 15 intenta hacer prerender estático de todas las páginas durante el build. La página usaba `useSearchParams()` directamente en el componente exportado como `default`. Esto causa crash en build porque `useSearchParams` requiere contexto de request. `export const dynamic = "force-dynamic"` NO funciona en `"use client"` components para resolver este problema.
- **Solución aplicada:** Renombrar el componente principal a `ActiveTrainingPage` (sin export default), y crear un nuevo `export default function ActiveRoutinePage()` que envuelve el primero en `<Suspense fallback={...}>`.
- **Regla:** En Next.js 15, cualquier `"use client"` component que use `useSearchParams()` debe estar envuelto en `<Suspense>` en el `export default`. El patrón correcto es: función interna con la lógica + export default wrapper con Suspense. `export const dynamic = "force-dynamic"` solo funciona en server components.

---

**ERROR #35 — Mensajes del chat no aparecían tras enviar (dependencia exclusiva de Realtime)**
- **Fecha:** 23/03/2026
- **Archivos afectados:** `apps/web/app/(dashboard)/app/trainer/clients/[id]/page.tsx`, `apps/web/app/(dashboard)/app/client/chat/page.tsx`
- **Qué pasó:** `handleSend` solo hacía INSERT y esperaba que Supabase Realtime devolviera el mensaje de vuelta para mostrarlo. Realtime no es garantizado — puede tardar, fallar por RLS o timing de suscripción. El mensaje enviado nunca aparecía en la UI hasta recargar la página.
- **Solución aplicada:** Patrón optimistic updates: al enviar, añadir el mensaje inmediatamente al estado local con `id: opt-{timestamp}` y timestamp actual. Después del INSERT, hacer refetch completo de todos los mensajes para reemplazar el optimistic con el real. Realtime solo se usa para recibir mensajes del otro usuario.
- **Regla:** En chats con Supabase, no depender de Realtime para ver los propios mensajes. Usar optimistic updates + refetch post-INSERT. Realtime solo para mensajes entrantes del otro usuario.

---

**ERROR #36 — Mensajes optimistas desaparecían tras INSERT fallido (migración no aplicada)**
- **Fecha:** 23/03/2026
- **Archivos afectados:** `apps/web/app/(dashboard)/app/client/chat/page.tsx`, `supabase/migrations/029_chat_messages.sql`
- **Qué pasó:** El mensaje aparecía un momento (optimistic) y luego desaparecía. La causa raíz era que la migración `029_chat_messages.sql` no había sido aplicada en la base de datos — la tabla `messages` no existía. El INSERT fallaba, y el rollback eliminaba el mensaje optimista del estado.
- **Solución aplicada:** (1) La migración debe aplicarse en Supabase SQL Editor antes de usar el chat. (2) En vez de eliminar el mensaje optimista en caso de error, mantenerlo con `id: err-{timestamp}` para dar feedback visual al usuario.
- **Regla:** Cuando un mensaje optimista aparece y desaparece rápidamente, la causa es un INSERT que falla silenciosamente. Verificar primero que la migración de la tabla está aplicada. Nunca eliminar el optimistic en caso de error — cambiarlo a estado de error.

---

**ERROR #37 — Cliente tenía que recargar para ver sus propios mensajes enviados**
- **Fecha:** 23/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/client/chat/page.tsx`
- **Qué pasó:** Tras hacer INSERT, se intentaba `.select().single()` encadenado para obtener el mensaje confirmado. RLS o timing hacía que esta query devolviera null silenciosamente, por lo que el optimistic nunca se reemplazaba con el real. El mensaje real sí existía en DB y aparecía tras recargar.
- **Solución aplicada:** Reemplazado `.insert().select().single()` por un flujo de dos pasos: `await supabase.from("messages").insert({...})` seguido de un `SELECT *` completo de la conversación. El refetch siempre funciona porque RLS permite al usuario ver sus propios mensajes via `client_id`.
- **Regla:** No encadenar `.select().single()` al INSERT en contextos con RLS complejo. Hacer el INSERT por separado y luego un SELECT independiente — más robusto y más simple.

---

**ERROR #38 — Tab bar visual rota al añadir 6ª pestaña en chat del entrenador**
- **Fecha:** 23/03/2026
- **Archivo afectado:** `apps/web/app/(dashboard)/app/trainer/clients/[id]/page.tsx`
- **Qué pasó:** Al añadir el tab "Chat" (6ª pestaña), la barra de tabs quedaba mal distribuida. Intentar cambiar de `flex-1` a `shrink-0` para las tabs rompió el espaciado uniforme.
- **Solución aplicada:** Mantener `flex-1` en los tabs (para ocupar el espacio proporcionalmente) y reducir el padding horizontal de `px-4` a `px-2` para que quepan 6 tabs sin overflow.
- **Regla:** Con 6+ tabs, usar `flex-1` + `px-2`. No usar `shrink-0` en tab bars — hace que los tabs no se distribuyan uniformemente.

---

### Regla de mantenimiento

**Al terminar cualquier desarrollo, bugfix o cambio significativo:**

1. Actualizar la estructura de rutas de la sección 6 si se añadieron o modificaron archivos.
2. Actualizar la sección "Próximos Pasos" (sección 12) para reflejar el estado real.
3. Si ocurrió algún error durante el desarrollo, documentarlo en la sección "Errores conocidos" siguiendo el formato existente (archivo, qué pasó, solución, regla).
4. Actualizar también `CLAUDE.md` si la regla es lo suficientemente crítica para estar visible desde el primer momento.
5. **Verificar paridad web ↔ mobile**: cualquier cambio en web debe reflejarse en mobile y viceversa. No dar una tarea por terminada si solo está implementada en una plataforma.

El objetivo es que cualquier persona o agente que llegue al proyecto pueda continuar sin contexto previo y sin repetir los mismos errores.
