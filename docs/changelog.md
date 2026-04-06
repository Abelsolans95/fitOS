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
