# Changelog — FitOS Development History

## Fase 0 — Estructura base ✅
- Estructura monorepo, auth, 19 tablas, tema visual.

## Fase 1 — Dashboards, IA base ✅ (casi completo)
- Dashboards trainer/client, Edge Functions IA. Google Calendar pendiente OAuth.

## Fase 2 — Chat + Citas ✅
- Chat interno trainer↔cliente (tabla `messages`, Realtime).
- Calendario de citas (tabla `appointments`, migración 030).
- Google Calendar sync y Resend emails pendientes de config.

## Fase 3 — Widgets iOS y Android ✅
- Widget `TodayWorkout` para Android (react-native-android-widget).
- Widget iOS (WidgetKit/SwiftUI, requiere Xcode manual).

## Fase 4 — Sistema de lesiones ✅
- Mapa anatómico SVG interactivo, reportes coach/client, Realtime.
- Migración 031.

## Fase 5 — Plantillas de rutina ✅
- Guardar/cargar configuraciones de ejercicios reutilizables.
- Migración 032.

## Fase 6 — Planificador de menú ✅
- Selección de días con fechas reales, semanas de mesociclo, % macros, panel flotante.
- Menús guardados (tabla `saved_menu_templates`, migración 033).
- DarkSelect, navegación semanal mejorada.

## Fase 7 — Comunidad Premium ✅
- Feed privado por trainer con posts, comentarios, likes, posts fijados.
- Dos modos: OPEN y READ_ONLY_CLIENTS. Badge coach verificado.
- Migraciones 034, 035.

## Fase 8 — Métricas de ejercicio ✅
- Stress Index auto-calculado, SFR (input cliente 1-5), RPE por serie.
- Gráficas de progresión con recharts. Migración 037.

## Fase 9 — Consultas/Tickets ✅
- Cliente envía dudas categorizadas al trainer. Hilo conversacional.
- Badges de no leídos. Migración 038.

## Fase 10 — Base de Conocimiento / FAQ ✅
- Artículos FAQ categorizados por trainer. Full-text search español.
- Integración bidireccional con Consultas. Migración 039.

## Rediseño UI ✅
- Estética premium con glassmorphism (web) y brutalismo elegante (mobile).

## Code Quality Review (30/03/2026) ✅
- Fragmentación completa, Patrón C aplicado, performance optimizado, React.memo.

## Auditoría de Permisos (30/03/2026) ✅
- Middleware, RLS correcto en 19 tablas, 3 fixes de seguridad.

## Seguridad OWASP Fase 1 (03/04/2026) ✅
- 16 vulnerabilidades corregidas. Migración 040.

## Seguridad Fase 2 — Enterprise (03/04/2026) ✅
- 15 puntos: security headers, rate limiting, CSRF, sanitization, audit logs. Migración 041.

## Seguridad Fase 3 — Auditoría Profunda (03/04/2026) ✅
- 23 vulnerabilidades adicionales. Migraciones 042, 043.

## `@fitos/theme` (30/03/2026) ✅
- Paquete compartido de tokens de diseño. Metro watchFolders configurado.

## Mapa anatómico con imágenes reales (31/03/2026) ✅
- 4 imágenes hombre/mujer × frontal/posterior con overlay SVG.
- Campo `gender` en profiles (migración 036).

## Onboarding con secciones (01/04/2026) ✅
- Formulario extendido con 5 secciones opcionales. Wizard multi-paso.

## Panel Admin (06/04/2026) ✅
- 7 secciones: Dashboard (9 KPIs), Usuarios CRUD, Códigos Promo, Consultas, Analíticas, Auditoría, Configuración.
- Migración 044 (anti-admin signup).

## Optimización de carga (05/04/2026) ✅
- 32 archivos optimizados: getUser() → getSession(), Promise.all(), .limit().

## Push Notifications — Mobile (06/04/2026) ✅
- `expo-notifications` integration for Expo SDK 55.
- `src/lib/notifications.ts`: registration, token persistence, local scheduling.
- `src/contexts/NotificationContext.tsx`: provider with foreground/tap listeners, deep linking to tabs.
- Token saved to `profiles.expo_push_token` via upsert.
- Android notification channel with FitOS cyan accent (#00E5FF).
- Graceful fallback on simulators and permission denial.
- Placeholder EAS projectId in app.json (update before first EAS build).

## Apple Health / Google Health Connect — Biometric Sync (06/04/2026) ✅
- `src/lib/health-sync.ts`: platform-agnostic health data layer (iOS HealthKit via `@kingstinct/react-native-healthkit`, Android via `react-native-health-connect`).
- Reads steps, sleep, weight, heart rate with 15-min AsyncStorage cache.
- `syncWeightToSupabase()` auto-inserts to `body_metrics` when weight changes (0.1 kg tolerance).
- `src/hooks/useHealthData.ts`: hook with `connectHealth()`, `refresh()`, availability/permission state.
- `DashboardScreen.tsx` updated: "Conectar Salud" CTA when unconnected, 4-metric health card when connected.
- `app.json`: HealthKit entitlements, NSHealthShareUsageDescription, react-native-health-connect plugin.
- All reads wrapped in try/catch — graceful fallback on simulators and denied permissions.
- Dynamic imports prevent crashes on platforms where native modules are absent.

## Offline Mode Infrastructure — WatermelonDB (08/04/2026) ✅
- `src/lib/offline/schema.ts`: WatermelonDB schema for routines, workout_sessions, weight_log, meal_plans, profiles_cache, sync_metadata.
- `src/lib/offline/models/`: Routine, WorkoutSession, WeightLog model classes with dynamic imports.
- `src/lib/offline/database.ts`: SQLite adapter initialization with graceful degradation if native module absent.
- `src/lib/offline/sync.ts`: bidirectional sync — pull routines/plans from Supabase, push workout data back. Client session data always wins on conflict.
- `src/hooks/useOffline.ts`: hook providing isOnline, isSyncing, lastSyncAt, pendingChanges, syncNow.
- `src/contexts/OfflineContext.tsx`: provider with auto-sync on app focus and network reconnect. Offline/syncing banners.
- `App.tsx` wrapped with OfflineProvider.
- All WatermelonDB and NetInfo imports use dynamic `import()` in try/catch — safe in Expo Go.
- Packages: `@nozbe/watermelondb`, `@nozbe/with-observables`, `@react-native-community/netinfo`.

## IA Comida Avanzada — Foto Nevera + Video Buffet (08/04/2026) ✅
- Edge Function `suggest-meal-from-image`: Claude Vision analyzes fridge/buffet photos, returns 2-3 meal suggestions fitted to remaining daily macros.
- Web: 3-tab system in calories page (Analizar / Foto nevera / Video buffet).
  - Fridge: drag-drop image upload, identified ingredients display, macro-aware meal suggestions with save-to-log.
  - Buffet: video upload with client-side frame extraction (canvas + pixel variance), best-frame analysis.
- Mobile: 3-mode toggle in CaloriesScreen (Analizar / Mi nevera / Buffet).
  - Fridge: camera/gallery via expo-image-picker, suggestion cards with save.
  - Buffet: camera photo of buffet, analysis and recommendations.
- Remaining macros calculated from active `meal_plans.target_kcal` minus today's `food_log` totals.
- `MealSuggestionCard` component (web) reused across fridge/buffet tabs.
- Saved suggestions use `source: "ai_suggestion"` in food_log for differentiation.
- Requires `ANTHROPIC_API_KEY` in Supabase secrets; returns 503 with helpful message if missing.

## Ligas y Gamificacion (08/04/2026) ✅
- Migration 048: leagues, league_participants, badges, user_badges tables with RLS.
- `communities.gamification_enabled` toggle for trainers to activate/deactivate.
- 8 default badges seeded (streaks, league placement, session milestones).
- Web trainer: `/app/trainer/leagues` — create/manage leagues, toggle gamification, leaderboard, enroll all clients, status management (upcoming/active/completed).
- Web client: `/app/client/leagues` — view leagues, join, leaderboard, badge collection. Hidden if gamification disabled.
- Mobile: `LeaguesScreen.tsx` with leagues tab, badges tab, leaderboard, join. Conditional on gamification_enabled.
- API routes: `/api/leagues` (CRUD), `/api/leagues/[id]/join`, `/api/leagues/[id]/leaderboard`.
- Shared types: `packages/shared/src/types/leagues.ts`.
- Sidebar entries added to TrainerSidebar and ClientSidebar.
- Mobile tab "Ligas" added to bottom navigation.

## Gestion de Menus — Admin (12/04/2026) ✅
- Migration 049: `profiles.menus_enabled` BOOLEAN DEFAULT true.
- Admin page `/app/admin/menus` — table with toggle switches per user, role filter, search, pagination.
- API route `/api/admin/menus` — GET (paginated list) + PUT (toggle per user). Full security: verifyAdmin, CSRF, rate limiting.
- TrainerSidebar: hides "Nutricion" when `menus_enabled = false`.
- ClientSidebar: hides "Comidas" and "Calorias" when `menus_enabled = false`.
- Hook `useMenusEnabled` — fetches profile flag, used by both sidebars.
- Admin sidebar updated with "Gestion de menus" nav item.
- Tests: 7 tests for admin menus API (GET filtering, PUT toggle, validation, role guard).

## Defense-in-depth refactor + repo hygiene (17/04/2026) ✅
- **Security fixes**:
  - CORS whitelist en Edge Functions (`supabase/functions/_shared/auth.ts`) — reemplazada heurística permisiva `origin.endsWith(".vercel.app") && origin.includes("fitos")` por regex exacta via `VERCEL_PROJECT_PREVIEW_REGEX` env var. Sin la env, solo se permiten los orígenes estáticos del whitelist.
  - UUID regex case-insensitive en `/api/leads` sustituida por `uuidSchema` Zod (lowercase estricto, forma canónica de Postgres).
  - 55 ocurrencias de `console.error` en API routes migradas a `logger.error` — ahora PII-redacted por defecto.
- **Defense-by-construction**:
  - `lib/api-handler.ts` — wrapper declarativo que aplica CSRF → rate-limit → auth → role → body-parse+validate de un plumazo. Previene la clase entera de gotchas #68, #93, #94, #97, #138. 16 tests.
  - `lib/validation.ts` — schemas Zod compartidos (`uuidSchema`, `emailSchema`, `roleSchema`, etc.) + `escapeLike()` para prevenir wildcard injection ILIKE (gotcha #134). 14 tests.
- **Test coverage** (+88 tests):
  - `admin-auth` (6 — gotcha #121), `csrf` (8), `rate-limit` (8), `sanitize` (10), `file-validation` (10), `url-validation` (10), `logger` (6), `validation` (14), `api-handler` (16).
- **Repo hygiene**:
  - `pnpm-workspace.yaml` eliminado (proyecto usa npm).
  - `commit_diff.txt`, `push_error.txt`, `staged_diff.txt` eliminados + blindado `.gitignore`.
  - Planning markdown (`PROMPT_CHAT*.md`, `RUTA_ABRIL.md`, `KUVOX_VISION.md`, etc.) movidos a `docs/archive/`.
  - Scripts dev (`script_*.js`, `replace_dashboard_colors.js`, etc.) movidos a `scripts/dev/`.
- **Shared code**:
  - `exercise-resolver`, `food-resolver`, `query-cache` extraídos a `@fitos/shared/resolvers`. `apps/web/lib/*` son ahora shims de re-export (backward compat). Listos para consumir desde mobile.
- **Docs**:
  - Path de migración a Upstash Redis documentado en `lib/rate-limit.ts` (mantiene la misma API de `check()` al migrar).

## Panel "Hoy" del trainer + Pantalla "Mi día" del cliente (18/04/2026) ✅

Traducción directa del positioning ("ves en un panel quién necesita atención hoy" + "reporte en 30 segundos"):

- **Migration 050** — nueva tabla `daily_checkins` (sleep/stress/energy/pain 1-5, notes).
  UNIQUE(client_id, checkin_date) → una fila por día. RLS: client CRUD propio; trainer SELECT
  sólo para clientes activos (EXISTS en trainer_clients).
- **@fitos/shared**: tipos `DailyCheckin`, `TodayAlert`, `TodayPanel` y sus variantes por tipo.
- **Trainer**:
  - `/api/trainer/today` — agrega en paralelo 6 señales: `no_workout` (3+ días), `no_checkin`
    (48h), `new_injury` (7 días), `pending_ticket` (open/in_progress), `high_stress` (≥4/5),
    `high_pain` (≥4/5). Usa el `handler` wrapper + rol=trainer + RLS del caller. 7 tests.
  - `/app/trainer/today` — página client-side con secciones por tipo de alerta, contador,
    botón refresh y estado vacío "todo en orden".
  - TrainerSidebar: "Hoy" como primer item. Default href del sidebar movido a `/app/trainer/today`.
- **Cliente**:
  - `/api/client/daily-checkin` — POST upsert (onConflict client_id+checkin_date) + GET fetch
    del día. `handler({ auth, role: 'client', body: zod schema })`.
  - `MyDayScreen.tsx` (mobile): secciones Entreno (toggle), Comidas (link a tab Calorías),
    Peso (input decimal), Cómo me siento (4 sliders 1-5), Notas, CTA "Guardar check-in".
  - Hook `useMyDay` carga en paralelo: daily_checkins de hoy, workout_sessions completadas hoy,
    último body_metrics del día — pre-rellena formulario.
  - Tab "Mi día" añadida como primera en el bottom nav.

Tests: 362/362 verdes.
