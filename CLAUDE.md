# FitOS — Guía para Agentes

Este archivo contiene TODO lo necesario para continuar el desarrollo: reglas, credenciales, variables de entorno, árbol de archivos, estado y blockers, flujos de auth, gotchas documentados y cómo activar integraciones pendientes.

---

## Contexto rápido

**FitOS** es una plataforma SaaS para entrenadores personales. Dos roles: `trainer` y `client`. Monorepo con Next.js 15 (web) + Expo 55 (mobile) + Supabase (DB + Edge Functions).

- **Fase 0:** Completada — estructura base, auth, 19 tablas, tema visual
- **Fase 1:** En proceso de finalización (Ver `PENDIENTE_FASE_1.md`) — dashboards, IA base, Google Calendar (config. pendiente)
- **Rediseño UI:** Completado — estética premium en app completa (landing, paneles trainer/cliente con *glassmorphism*, app mobile brutalista)
- **Fase 2 (parcial, 23/03/2026):** Chat interno trainer↔cliente ✅ | Calendario de citas ✅ (migración 030 pendiente aplicar) | Google Calendar sync ⏳ (pendiente OAuth) | Emails Resend ⏳ (pendiente dominio)
- **Fase 3 (parcial, 23/03/2026):** Widget iOS y Android ✅ (ver entrenamiento del día sin abrir la app)
- **Fase 4 (parcial, 26/03/2026):** Sistema de lesiones/molestias ✅ — mapa anatómico SVG interactivo, reportes coach/client, Realtime sync
- **Fase 5 (parcial, 26/03/2026):** Plantillas de rutina ✅ — guardar/cargar configuraciones de ejercicios reutilizables por trainer
- **Fase 6 (parcial, 28/03/2026):** Rediseño planificador de menú ✅ — selección de días con fechas reales, semanas de mesociclo, % macros, panel flotante de info nutricional en tiempo real
- **Fase 6 ampliada (29/03/2026):** Menús guardados ✅ — guardar/cargar configuraciones de menú reutilizables (tabla `saved_menu_templates`, migración 033). Navegación semanal mejorada ✅ — botones semana anterior/siguiente en la parte inferior del planificador. DarkSelect ✅ — todos los `<select>` nativos reemplazados por componente custom dark.
- **Fase 7 (29/03/2026):** Comunidad Premium ✅ — Feed privado por trainer con posts (título+texto+imagen), comentarios, likes, posts fijados. Dos modos: OPEN (clientes publican) y READ_ONLY_CLIENTS (solo coach). Badge verificado violeta para el coach. Storage bucket para imágenes. Realtime. Badge de no leídos en sidebar. Web trainer + web cliente.
- **Fase 8 (01/04/2026):** Métricas de ejercicio ✅ — Stress Index (auto-calculado), Ratio Estímulo-Fatiga (SFR, input cliente 1-5), RPE por serie (condicional, solo si trainer configura `target_rpe`), gráficas de progresión por ejercicio para el trainer. Columnas RIR/RPE dinámicas. Migración 037. Web + mobile. `recharts` para charts.
- **Code Quality Review (30/03/2026):** Fragmentación completa ✅ — todas las páginas >300 líneas fragmentadas en `components/`. Error handling Patrón C aplicado ✅ — todas las queries con `error` destructurado. Performance ✅ — `select("*")` eliminados, `.limit()` en tablas crecientes, `Promise.all` para queries independientes. `React.memo` en componentes hoja.
- **Auditoría de Permisos (30/03/2026):** Arquitectura de permisos verificada y corregida ✅ — middleware sólido, RLS correcto en 19 tablas, 3 fixes de seguridad aplicados, `AuthContext` mobile preparado para rol Admin.
- **Auditoría de Seguridad OWASP Fase 1 (03/04/2026):** Pentesting completo ✅ — 16 vulnerabilidades identificadas y corregidas. Migración 040. RLS endurecido, anti role-escalation, CHECK constraints, Open redirect fix, Storage uploads restringidos. Next.js actualizado. xlsx→exceljs.
- **Seguridad Fase 2 — Enterprise Grade (03/04/2026):** 15 puntos implementados ✅ — Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) en `next.config.ts`. Rate limiting (`lib/rate-limit.ts`). Input sanitization (`lib/sanitize.ts`). CSRF protection (`lib/csrf.ts`). Structured logging (`lib/logger.ts`). Magic bytes validation (`lib/file-validation.ts`). PII eliminado de 5 queries (email ya no se envía al frontend innecesariamente). Storage SELECT policies restrictivas (ticket-images, knowledge-images validan ownership). Tabla `audit_logs` con función `log_audit_event()`. Ownership validation en import routes (service_role). Server Component layouts con verificación de rol. Toast error para session_id inválido. Migración 041.
- **Seguridad Fase 3 — Auditoría Profunda (03/04/2026):** 23 vulnerabilidades adicionales corregidas ✅ — `complete-registration` ahora verifica sesión del caller (anti-spoofing). Rate limiting en todas las API routes (7 nuevas). Error message leaks eliminados (5 rutas). Edge Functions: `sanitizeForPrompt` aplicado a 3 funciones, columnas DB corregidas (`weight`/`height`), tabla `exercises`→`trainer_exercise_library`, IDOR checks en `client_id`, CORS restringido (no más wildcard `*`), `String(error)` eliminado de catch blocks. `stripHtml` hardened con loop anti-bypass. `unsafe-eval` eliminado de CSP en producción. Logger con redacción automática de PII. Google OAuth callback con auth+role enforcement. Array cap en import/reconcile. Input sanitization en create-exercises. Migración 043: RLS trainer_clients hardening en 6 tablas (weight_log, user_routines, meal_plans, onboarding_responses, messages, support_tickets), log_audit_event con auth.uid() validation, storage buckets privados, promo code revoke. 24 nuevas reglas (180-203). 23 nuevos gotchas (96-118).
- **`@fitos/theme` (30/03/2026):** Paquete compartido creado ✅ — `packages/theme/src/index.ts` es la única fuente de verdad para colores, spacing y radius. Mobile re-exporta desde ahí. Script `npm run sync-theme` regenera el bloque `@theme` de `globals.css`. Metro `watchFolders` configurado.
- **Mapa anatómico con imágenes reales (31/03/2026):** Reemplazo del mapa SVG puro por imágenes anatómicas reales con overlay SVG interactivo ✅ — 4 imágenes (hombre/mujer × frontal/posterior), zonas definidas en `packages/shared/src/anatomy/zones.ts`, campo `gender` añadido a `profiles` (migración 036), toggle de género en UI cliente. Web + mobile.
- **Fase 9 (01/04/2026):** Sistema de Consultas/Tickets ✅ — Cliente envía dudas categorizadas (Nutrición, Rutina, Lesión, General) al trainer. Trainer gestiona inbox con filtros de estado/categoría/búsqueda, responde en hilo conversacional, y marca como resuelta. Realtime. Badges de no leídos en ambos sidebars. Migración 038. Web trainer + web cliente + mobile. Fix post-deploy (02/04): política RLS `trainer_replies_update_read` para permitir al trainer marcar replies de clientes como leídas; acciones de reducer `MARK_TICKET_READ` e `INCREMENT_UNREAD` para evitar stale closures; reset de badge en sidebar via `usePathname`.
- **Onboarding con secciones (01/04/2026):** Formulario de onboarding extendido con secciones opcionales ✅ — 5 secciones predefinidas (historial medico, deportivo, experiencias, estado actual, objetivos) que el trainer puede activar/desactivar. Cliente ve wizard multi-paso (1 seccion = 1 step). Plantilla cargable con un click. AI edge function actualizada para analisis por seccion. Sin migracion DB (todo en JSONB existente). Web + mobile.
- **Fase 10 (02/04/2026):** Base de Conocimiento / FAQ ✅ — Trainer escribe artículos FAQ categorizados (Nutrición, Rutina, Lesión, Técnica, Suplementación, General) con texto + video URL. Cliente busca/filtra artículos antes de preguntar. Integración bidireccional con Consultas: convertir ticket resuelto en artículo, sugerir artículos relevantes al crear ticket (debounced search). Vista contador incrementada via SECURITY DEFINER. Full-text search PostgreSQL (español). Migración 039. Web trainer + web cliente + mobile. Tipos compartidos en `@fitos/shared`.
- **Panel Admin (06/04/2026):** Panel de administración completo ✅ — AdminSidebar con 7 secciones. `verifyAdmin()` helper compartido (auth + role + rate limit + service_role). Dashboard con 9 KPIs via queries paralelas. Gestión de usuarios (CRUD trainer/client/admin con rollback, búsqueda, filtros, paginación, detalle con stats por rol, edición inline). Códigos promo (listado con enrichment, filtros, toggle activación con confirmación 2 pasos). Auditoría (log viewer con filtros acción/recurso, enrichment de nombres). Consultas (supervisión read-only de tickets cliente→trainer). Analíticas (17 queries paralelas: crecimiento 7d/30d, retención, tendencias sesiones, contenido, top trainers ranking). Configuración (info plataforma, integraciones, seguridad, límites).

---

## Stack

| Capa | Tecnología |
|---|---|
| Web | Next.js 15 App Router, React 19, TypeScript |
| Estilos | Tailwind CSS 4, shadcn/ui (`nova` style, `neutral` base) |
| DB | Supabase PostgreSQL — proyecto `fitos-prod` |
| Mobile | Expo SDK 55 + React Navigation (Bottom Tabs) + expo-linear-gradient + react-native-svg |
| Charts | recharts (web trainer analytics) |
| Edge Functions | Supabase Deno — 4 funciones IA (Claude API) |
| Monorepo | Turborepo 2.x + npm workspaces (npm@11.8.0) |

---

## Reglas críticas — leer siempre

1. **npm en raíz y en `apps/web`** — el root usa `npm@11.8.0` con npm workspaces. En `apps/web` siempre `--legacy-peer-deps`. El fichero `pnpm-workspace.yaml` existe pero NO está activo — `package.json` tiene `"packageManager": "npm@11.8.0"` que tiene precedencia. Nunca usar `pnpm install` en la raíz.
2. **`turbo.json` usa `"tasks"`** (no `"pipeline"`) — es Turbo 2.x.
3. **Dark mode permanente** — clase `dark` hardcodeada en `<html>`, no hay toggle.
4. **RLS activo en todas las tablas** — si una query no devuelve datos, revisar las políticas de la tabla.
5. **`food_log` usa `client_id`** — no `user_id`. Diferente al resto de tablas.
6. **Dos clientes Supabase** — `@/lib/supabase` (browser/client components) y `@/lib/supabase-server` (server components/API routes). No confundirlos.
7. **No hay FK directa entre `trainer_clients` y `profiles`** — ambas tablas referencian `auth.users` independientemente (`client_id` y `user_id`). Para joins, hacer dos queries separadas y mergear por ID.
8. **`service_role` key nunca en frontend** — solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` en cliente.
9. **Sonner toast** — nutrición y rutinas usan `toast` de `"sonner"`. El `<Toaster />` debe estar en el layout raíz.
10. **Edge Functions** — requieren `ANTHROPIC_API_KEY` en Supabase secrets. Sin ella devuelven respuesta mock.
11. **Paridad web ↔ mobile obligatoria** — cualquier desarrollo nuevo o bugfix debe aplicarse en AMBAS plataformas (web y mobile). No cerrar una tarea si solo está implementada en una. Revisar siempre el equivalente en la otra plataforma antes de dar algo por terminado.
12. **Columnas reales en `profiles`** — usa `height` y `weight` (NO `height_cm`/`weight_kg`). Columna `role` es NOT NULL, incluirla siempre en upserts.
13. **`trainer_clients` usa `joined_at`** — no `created_at`. La columna de fecha de unión es `joined_at`.
14. **`meal_plans` usa columna `days`** — no `content`. El JSONB con los días del plan se llama `days`.
15. **`onboarding_responses` tiene unique constraint** — `(form_id, client_id)`. Usar siempre `upsert` con `onConflict: "form_id,client_id"`, nunca `insert`.
16. **`SUPABASE_SERVICE_ROLE_KEY` en API routes** — necesaria en `apps/web/.env.local` para operaciones que bypaseen RLS (e.g. `/api/complete-registration`). Nunca exponer en frontend.
17. **Landing page en `page.tsx` raíz** — `apps/web/app/page.tsx` es ahora la landing page pública (hero, features, pricing). Ya no redirige a `/login`. Los links de CTA llevan a `/login` y `/register`.
18. **Theme mobile extendido** — `apps/mobile/src/theme.ts` re-exporta `colors`, `spacing`, `radius` y `fonts` desde `@fitos/theme` (fuente de verdad compartida). Define `shadows` localmente (usa APIs de React Native). Usar estos tokens en vez de valores hardcoded. `shadows.glow(color)` genera un glow effect. Para cambiar colores de marca: editar `packages/theme/src/index.ts` y ejecutar `npm run sync-theme`.
19. **SVG icons en mobile** — Usar `react-native-svg` (Svg, Path, Circle) para iconos. No usar emojis ni Text como iconos en la app mobile.
20. **expo-linear-gradient para gradientes** — En mobile usar `LinearGradient` de `expo-linear-gradient` para botones y fondos con gradiente. Ya está instalado.
21. **Three-layer exercise/food resolution** — Layer A: globales (`is_global=true`), Layer B: privados del trainer (`is_global=false`), Layer C: overrides (`trainer_exercise_overrides` / `trainer_food_overrides`). Usar resolvers en `lib/exercise-resolver.ts` y `lib/food-resolver.ts`.
22. **`workout_sessions` agrupa `weight_log`** — Cada sesión de entrenamiento se registra en `workout_sessions` (modo `registration` o `active`). `weight_log` tiene FK `session_id` a esta tabla.
23. **`user_routines` tiene bloques semanales** — Columnas `total_weeks`, `current_week`, `training_days` (TEXT[]). Usar para mesociclos.
24. **`pg_trgm` para búsqueda por similitud** — Funciones `search_similar_exercises()` y `search_similar_foods()` disponibles vía `supabase.rpc()`. Threshold por defecto 0.3.
25. **`trainer_exercise_library.aliases`** — Campo TEXT[] para nombres alternativos de ejercicios. Usado en reconciliación de Excel.
26. **No usar `moddatetime`** — No está disponible en Supabase. Usar la función custom `set_updated_at()` (creada en migración 021) para triggers de `updated_at`.
27. **Dos modos de entrenamiento del cliente** — "Registrar sesión" (async, tabla con todos los ejercicios) y "Entrenar en activo" (exercise-by-exercise con rest timer). Web: `/app/client/routine` y `/app/client/routine/active`. Mobile: ambos modos dentro de `RoutineScreen.tsx` via useState.
28. **ANTERIOR values** — Los valores de la sesión anterior se cargan de `weight_log` y se muestran como ghost/placeholder. Formato: `peso×reps`. Tanto en web como en mobile.
29. **Sesión activa resumible (web + mobile)** — `workout_sessions` con `status: "in_progress"` permite al cliente cerrar la app y retomar. Web: la rutina page busca sesiones `in_progress` y muestra botón "Completar rutina en curso" con `?session_id=`. Mobile: `RoutineScreen.tsx` muestra botón naranja con gradiente que llama a `resumeSession()`. Ambos restauran `weight_log` guardados y saltan al primer ejercicio no guardado. Al finalizar se marca `status: "completed"` y el botón desaparece.
30. **Navegación libre entre ejercicios en modo activo (web + mobile)** — Los botones "Anterior" y "Siguiente" están siempre visibles. El cliente puede saltar ejercicios si la máquina está ocupada. En el último ejercicio (con todas las series hechas) aparece "Finalizar rutina" (verde) en lugar de "Siguiente". En mobile, `saveExerciseLog()` guarda cada ejercicio individualmente al navegar.
31. **`weight_log.client_notes` (web + mobile)** — Columna TEXT opcional para notas del cliente por ejercicio. Web: se rellena durante la fase de descanso en entrenamiento activo. Mobile: `TextInput` en la pantalla de rest timer (`exerciseNotes` state). Visible para el entrenador en el tab Rutina del detalle de cliente.
32. **Trainer ve datos del cliente** — Tab Rutina muestra historial de `workout_sessions` con `weight_log` expandible (series, pesos, reps, RPE, notas). Tab Menú muestra `food_log` del cliente por día con selector de fecha y totales macro.
33. **Excel import usa Claude Haiku** — `POST /api/import/excel` envía las primeras 40 filas de cada hoja a Haiku para detectar estructura (headers, columnas, secciones). Reemplaza el parser basado en reglas.
34. **Clone-on-edit para ejercicios globales** — Cuando un entrenador edita un ejercicio global, se clona como privado (`is_global: false`) y el original se oculta via `trainer_exercise_overrides.hidden = true`. En import Excel, "enlazar" (link) crea un ejercicio privado con el nombre del trainer SI el nombre es diferente al global. Si el nombre es idéntico (match 100%), no se clona porque el global ya es visible.
35. **Ejercicios sin category/difficulty obligatorios** — `category` es TEXT nullable (sin CHECK constraint). No hay columna `difficulty` ni `equipment` en `trainer_exercise_library`.
36. **`weight_log` se guarda en cada check (set)** — Cada vez que el cliente marca una serie como completada en entrenamiento activo, se hace upsert inmediato a `weight_log` con `savePartialProgress()`. El campo `sets_data` incluye `completed: boolean` por set. Esto permite que al resumir una sesión se restauren incluso ejercicios parcialmente completados.
37. **No repetir sesión ya completada** — La página de rutina (web y mobile) carga todas las `workout_sessions` con `status: "completed"` para la rutina actual. Compara por `day_label::week_number` (no por fecha). Si la combinación día+semana ya fue completada, muestra badge "Sesión completada" en lugar de los botones de entrenamiento. Esto permite hacer dos sesiones distintas el mismo día (ej. Pierna + Espalda) pero impide repetir la misma.
38. **Import Excel: 100% match = auto-link sin opciones** — Si `confidence === 1`, el ejercicio se enlaza automáticamente sin mostrar botones "Crear nuevo" / "Omitir" ni matches alternativos. Solo muestra badge "Match 100%" y el nombre enlazado.
39. **No crear endpoints temporales** — Nunca crear API routes "temporales" para fixes de DB. El usuario ejecuta los SQLs directamente en Supabase.
40. **Clientes Supabase en API routes siempre dentro del handler** — Nunca inicializar `createClient()` a nivel de módulo en API routes (`const x = createClient(...)` fuera de funciones). Vercel evalúa los módulos durante el build y las env vars no están disponibles → crash `supabaseKey is required`. Siempre inicializar dentro de la función `POST`/`GET`/etc.
41. **`useSearchParams` en "use client" requiere `<Suspense>`** — En Next.js 15, cualquier componente que use `useSearchParams()` debe estar envuelto en `<Suspense>` en el `export default`. Patrón obligatorio: función interna con la lógica + export default wrapper con `<Suspense fallback={...}>`. `export const dynamic = "force-dynamic"` NO soluciona el error de prerender en client components.
42. **Tabla `messages` para chat** — `trainer_id` + `client_id` identifican la conversación (par único). `sender_id` indica quién envió. RLS doble: el trainer accede por `trainer_id`, el cliente por `client_id`. Realtime habilitado (`supabase_realtime`). Web trainer: tab "Chat" en `/app/trainer/clients/[id]`. Web cliente: `/app/client/chat`. Mobile: `ChatScreen.tsx` en tab "Chat". Marcar como leído actualizando `read_at` al entrar a la conversación.
43. **Tabla `appointments` para citas** — Migración 030. Campos clave: `trainer_id`, `client_id`, `session_type` (presencial/online/telefonica/evaluacion/seguimiento), `starts_at`, `ends_at`, `status` (pending/confirmed/cancelled/completed), `google_event_id` (NULL hasta OAuth), `email_sent_at` (NULL hasta Resend). RLS: trainer acceso total; cliente puede SELECT, INSERT (solo status='pending'), UPDATE (solo a 'cancelled'). Web trainer: `/app/trainer/appointments`. Web cliente: `/app/client/appointments`. Mobile: `AppointmentsScreen.tsx` en tab "Citas".
44. **Calendario de citas — PENDIENTE DE DESARROLLO** — `lib/google-calendar.ts` tiene la función `syncAppointmentToCalendar()` lista pero requiere OAuth 2.0 configurado (NEXT_PUBLIC_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET). `lib/email-notifications.ts` tiene `sendAppointmentEmail()` con template HTML lista pero requiere dominio verificado en Resend + RESEND_API_KEY. Cuando ambos estén configurados: (1) instalar `resend` en apps/web, (2) descomentar el bloque TODO en `sendAppointmentEmail()`, (3) añadir RESEND_API_KEY y RESEND_FROM_EMAIL a .env.local y Vercel, (4) configurar OAuth en Google Cloud Console, (5) guardar tokens en Supabase Vault.
45. **Widget Android — `react-native-android-widget`** — Paquete instalado en `apps/mobile`. Widget `TodayWorkout` configurado en `app.json` (plugin). Componente JSX en `src/widgets/TodayWorkoutWidget.tsx` usa primitivas `FlexWidget`, `TextWidget`, `ListWidget`. Task handler en `src/widgets/widget-task-handler.tsx`. Se registra en `index.ts` con `registerWidgetTaskHandler()`. Actualización cada 30 min (`updatePeriodMillis: 1800000`). Tamaño: 4×3 celdas, redimensionable.
46. **Widget iOS — WidgetKit (SwiftUI)** — Plugin `plugins/withIOSWidget.js` genera los archivos Swift en `ios/TodayWorkoutWidget/` durante `expo prebuild`. Lee datos de App Group `group.com.antigravity.fitos.widget` (UserDefaults). Para completar la integración iOS: (1) `expo prebuild`, (2) abrir Xcode, (3) añadir target Widget Extension manualmente, (4) copiar el Swift generado, (5) configurar App Group en ambos targets. Soporta `.systemSmall`, `.systemMedium`, `.systemLarge`.
47. **Widget data sync** — `src/lib/widget-data.ts` consulta `user_routines` + `workout_sessions` y escribe JSON a AsyncStorage (`@fitos/widget-today-workout`). `src/lib/widget-sync.ts` expone `updateWidget(userId)` que sincroniza datos y llama a `requestWidgetUpdate()` en Android. Se invoca en `DashboardScreen` (al cargar) y `RoutineScreen` (al completar sesión en ambos modos).
48. **Bundle identifiers configurados** — `app.json` tiene `ios.bundleIdentifier: "com.antigravity.fitos"` y `android.package: "com.antigravity.fitos"`. Necesarios para widgets y builds nativos.
49. **Widget no usa hooks** — Los componentes de widget Android (`TodayWorkoutWidget.tsx`) reciben datos vía props, NO pueden usar `useState`, `useEffect` ni ningún hook de React. Son funciones puras que retornan primitivas de `react-native-android-widget`.
50. **Fragmentar páginas complejas en componentes por responsabilidad** — Cualquier `page.tsx` que supere ~300 líneas o contenga múltiples secciones independientes (tabs, paneles, modales) debe fragmentarse. Patrón obligatorio:
    - Crear carpeta `components/` junto al `page.tsx`
    - `types.ts` — interfaces compartidas por todos los componentes del módulo
    - `shared.tsx` — utilidades, constantes y UI compartida (EmptyState, badges, helpers)
    - Un fichero por sección (`TabPerfil.tsx`, `TabChat.tsx`, etc.) con su propio estado local
    - El `page.tsx` padre: solo datos mínimos de cabecera + selector de vista + render del componente activo. **Target orientativo ~250 líneas — el número es una guía, no una regla rígida.** Un `page.tsx` de 350 líneas bien estructurado (solo orquestación) es correcto. Uno de 150 líneas que mezcla lógica de negocio con UI no lo es. La pregunta clave: ¿puede un agente nuevo entender qué hace la página en 30 segundos?
    - **Ejemplo de referencia:** `apps/web/app/(dashboard)/app/trainer/clients/[id]/` tiene 6 tabs extraídas a su carpeta `components/`.
51. **Páginas con lógica stateful compleja deben usar `useReducer` + custom hook** — Cuando una página tiene 8+ `useState` sueltos con estado interdependiente (ej: entrenamiento activo, wizards multi-paso), obligatorio:
    - Crear `useXxx.ts` junto al `page.tsx` con `useReducer` que centralice TODO el estado mutable.
    - El reducer define acciones tipadas (`NEXT_STEP`, `COMPLETE_SET`, `TICK_TIMER`, etc.) — nada de `setSomething` suelto.
    - Timers (`setInterval`/`setTimeout`) viven en el hook via `useRef` con cleanup en `useEffect` ligado a la fase/estado.
    - Operaciones de DB (`savePartialProgress`, `finalizeSession`) viven en el hook como `useCallback` que despachan acciones + hacen fetch.
    - `savePartialProgress()` siempre con 1 reintento automático + `toast.error` si falla ambas veces.
    - `finalizeSession()` retorna `boolean` — si falla, NO redirigir; el page muestra botón "Reintentar".
    - El `page.tsx` queda como orquestador: carga datos iniciales, llama al hook, renderiza subcomponente según fase. **Target orientativo ~200 líneas — mismo criterio que regla 50: lo que importa es responsabilidad única, no el conteo exacto.**
    - **Ejemplos de referencia:**
      - `apps/web/app/(dashboard)/app/client/routine/active/` — `useActiveTraining.ts` + 4 subcomponentes + `page.tsx` orquestador (196 líneas, antes 1390).
      - `apps/web/app/(dashboard)/app/trainer/nutrition/` — `useNutritionPage.ts` (28 campos de estado, 30 acciones tipadas) + `page.tsx` orquestador (~930 líneas, antes 1349). Consolidó 29 `useState` de 3 sub-componentes en un solo `useReducer`.
      - `apps/web/app/(dashboard)/app/trainer/routines/` — `useRoutinesPage.ts` (19 campos, 20 acciones) + 4 subcomponentes (`RoutineList`, `RoutineEditor`, `DaySchedule`, `ExerciseSelector`) + `page.tsx` orquestador (~55 líneas, antes 1516).

52. **Tests unitarios con Vitest** — Framework de tests instalado en `apps/web` (vitest 4.x + happy-dom). Ejecutar con `npm test` (una pasada) o `npm run test:watch` (modo watch). Config en `apps/web/vitest.config.ts` con alias `@/*` resuelto. Convenciones:
    - Archivos de test junto al archivo que testean: `lib/foo.test.ts` testea `lib/foo.ts`.
    - Mocks de Supabase: pasar cliente mock como parámetro (no `vi.mock` del módulo). Usar `createChain(result)` + `createMockSupabase(table → result)` — ver `exercise-resolver.test.ts` como referencia.
    - No instalar `@testing-library/react` para utils/libs puras — solo para componentes React si se necesita.
    - **Ejemplos de referencia:**
      - `apps/web/lib/exercise-resolver.test.ts` — 9 tests, 6 casos del resolver three-layer + 2 smoke tests de `resolveExercise`.
      - `apps/web/app/api/complete-registration/route.test.ts` — 7 tests: happy path, missing fields (400), DB errors (500), promo code resilience, invalid JSON.
      - `apps/web/app/api/client-trainer/route.test.ts` — 8 tests: happy path, unauthenticated (401), no trainer (404), DB errors, `business_name` vs `full_name` priority.

53. **Error handling obligatorio en TODA query Supabase (Patrón C)** — Toda query a Supabase DEBE destructurar `error`, loguearlo y dar feedback al usuario. No hay excepciones.
    - ❌ **Patrón A (prohibido siempre):** `const { data } = await supabase.from(...)` — sin destructurar error. El error se pierde completamente.
    - ❌ **Patrón B (prohibido en queries bloqueantes):** destructura error + solo `console.error` sin toast ni return — el usuario no sabe qué pasó. Solo válido en queries no bloqueantes (ver abajo).
    - ✅ **Patrón C bloqueante (obligatorio en saves/mutations/loads críticos) — Componentes cliente:**
      ```ts
      const { data, error } = await supabase.from("tabla").select("...");
      if (error) {
        toast.error("Mensaje descriptivo en español para el usuario");
        console.error("[NombreComponente] Contexto del error:", error);
        return; // o setSaving(false) + return según contexto
      }
      ```
    - ✅ **Patrón C bloqueante (obligatorio) — API routes:**
      ```ts
      const { data, error } = await supabase.from("tabla").select("...");
      if (error) {
        console.error("[nombre-route] Contexto:", error);
        return NextResponse.json({ error: "Mensaje descriptivo" }, { status: 500 });
      }
      ```
    - ✅ **Patrón C no bloqueante** (queries secundarias de display que no deben parar el flujo — ej: cargar perfil para mostrar nombre, leer adherencia del calendario): destructurar + `console.error` + comentario `// No bloqueante`. Sin `toast` ni `return`.
      ```ts
      const { data: profile, error: profileErr } = await supabase.from("profiles")...;
      if (profileErr) { console.error("[Context] Error cargando perfil:", profileErr); } // No bloqueante
      ```
    - **Cómo distinguir bloqueante vs no bloqueante:** si el error impide mostrar la funcionalidad principal de la página → bloqueante (toast + return). Si es un dato secundario de enriquecimiento → no bloqueante (solo log).
    - **Auditoría completada el 30/03/2026:** Patrón C aplicado a todas las queries del proyecto. Archivos corregidos: `trainer/settings`, `trainer/chat`, `trainer/clients`, `client/dashboard`, `client/meals`, `client/chat`, `client/appointments`, `BookAppointmentModal`.

54. **Usar `??` (no `||`) para merges de override** — `||` trata `""`, `0` y `false` como falsy, descartando overrides legítimos. Siempre usar nullish coalescing `??` al fusionar campos de override con valores originales. Ejemplo: `override?.custom_name ?? ex.name`.
55. **Toda API route de importación debe verificar rol trainer** — No basta con verificar autenticación. Endpoints de Excel import, reconciliation, etc. deben consultar `profiles.role` y retornar 403 si no es `trainer`.
56. **Nunca inicializar clientes de API externos a nivel de módulo en API routes** — Igual que la regla 40 para Supabase, `new Anthropic(...)`, `new Resend(...)`, etc. deben crearse dentro del handler, no fuera. Vercel evalúa módulos durante el build sin env vars.
57. **Fragmentar DURANTE la creación, no después** — La Regla 50 se aplica al momento de escribir código nuevo, no como refactor posterior. Si una página va a tener modal + calendario + lista + filtros, crear los componentes separados desde el inicio. Nunca generar un archivo de >300 líneas para "fragmentar después". Ejemplo: `appointments/page.tsx` se creó con 1187 líneas y tuvo que ser fragmentado después en 5 componentes.
58. **Tests obligatorios al crear módulos de lógica (`lib/*.ts`)** — Todo archivo en `lib/` que contenga lógica pura DEBE tener su `*.test.ts` creado en la misma sesión. No esperar a un code review. Mínimo: happy path + 1 edge case + 1 error case. Framework: Vitest (ver Regla 52). Archivos de referencia: `exercise-resolver.test.ts` (mocks Supabase), `excel-parser.test.ts` (buffers XLSX en memoria), `email-notifications.test.ts` (stub con vi.stubEnv).
59. **Verificar estado actual antes de reportar issues** — Antes de crear un ticket de fix o proponer un cambio, leer el archivo y verificar que el problema realmente existe en el código actual. Un code review que genera trabajo innecesario (3 fixes que ya estaban correctos) es peor que no hacer code review. Leer primero, opinar después.
60. **Appointments page fragmentada** — `apps/web/app/(dashboard)/app/trainer/appointments/` tiene `components/` con: `types.ts`, `shared.tsx`, `CreateAppointmentModal.tsx`, `AppointmentCalendar.tsx`, `AppointmentList.tsx`. El `page.tsx` es orquestador de 190 líneas. No volver a meter lógica de calendario o lista directamente en page.tsx.
61. **Progresión semanal por ejercicio (`weekly_config`)** — Cada `RoutineExercise` puede tener `weekly_config: Record<number, WeekConfig>` con valores distintos por semana (reps, RIR, carga, descanso, notas del entrenador). `WeekConfig` incluye `sets_detail?: SetConfig[]` para modo "different" y `coach_notes?: string` para notas semanales. Se configura desde la modal "Progresión semanal" en `DaySchedule.tsx`. Los datos se guardan en el JSONB de `user_routines.exercises` junto con `mode` y `sets_config`. Botón "Replicar para siguientes semanas" copia valores de una semana a todas las siguientes.
62. **`handleSave` debe incluir `mode`, `weekly_config` y `total_weeks`** — Al guardar una rutina desde el trainer, el `flatExercises` en `useRoutinesPage.ts` DEBE incluir `mode`, `sets_config` (si es "different") y `weekly_config` (si tiene entradas). El `routineData` debe incluir `total_weeks` y `training_days`. Sin estos campos, el cliente ve los mismos valores en todas las semanas. Error ocurrido: se añadió UI de progresión semanal pero `handleSave` no serializaba `weekly_config` → los datos se perdían.
63. **Valores del trainer como placeholders, no pre-rellenados (web + mobile)** — En entrenamiento activo, peso/reps/RIR configurados por el trainer se muestran como `placeholder` (gris tenue) para guiar al cliente, pero los inputs empiezan vacíos. El cliente introduce sus valores reales. Los placeholders son week-aware: resuelven `weekly_config[week]` → `sets_config` → valores base del ejercicio. Si hay sesión anterior, el placeholder muestra el valor anterior en su lugar.
64. **RIR y RPE editables por serie en entrenamiento activo (web + mobile)** — `SetEntry` incluye campos `rir: string` y `rpe: string`. Ambas columnas son **condicionales**: RIR se muestra solo si el trainer configuró `rir > 0` (en el ejercicio o en `sets_config`/`weekly_config`). RPE se muestra solo si `target_rpe != null && > 0`. Grid dinámico: Serie | Peso | Reps | [RIR] | [RPE] | ✓. Los valores se guardan en `weight_log.sets_data[].rir` y `sets_data[].rpe`. El campo `exercise_rpe` en `weight_log` es la media de los RPE por serie.
65. **Vista del cliente muestra todas las series configuradas** — En la vista de rutina del cliente (`/app/client/routine`), cada card de ejercicio muestra un desglose por serie (S1, S2, S3...) con reps, RIR, peso y descanso para cada una. Los valores son dinámicos según la semana activa (`activeWeek`), resolviendo `weekly_config[activeWeek]` → `sets_config` → valores base. El badge de esquema también se recalcula dinámicamente.

---

## Tema visual

```
Fondo:     #0A0A0F   (azul-negro)
Cards:     #12121A
Cyan:      #00E5FF   (acento principal)
Violet:    #7C3AED   (acento secundario)
Muted:     #8B8BA3   (texto secundario)
Error:     #FF1744
Success:   #00C853
Orange:    #FF9100   (acento terciario)
Dimmed:    #5A5A72   (texto muy secundario)
```

### Estilo "Brutalismo elegante"
- **Bento grids** para layouts asimétricos (flex ratios en mobile, CSS grid en web)
- **Uppercase tracking labels** (`text-xs font-bold uppercase tracking-[0.2em]`) para jerarquía
- **Font weight 900** en números/headings con negative letter-spacing
- **Glow effects** via box-shadow y gradient overlays (opacity 0.06)
- **Gradient accents** con `expo-linear-gradient` (mobile) y CSS gradients (web)
- **SVG icons** nativos (react-native-svg en mobile, inline SVG en web)

### Patrones de card
```
Patrón de card: rounded-2xl border border-white/[0.06] bg-[#12121A]
Botón primario: bg-[#00E5FF] text-[#0A0A0F] rounded-xl font-semibold
```

---

## Comandos frecuentes

```bash
# Web dev
cd apps/web && npm run dev

# Instalar paquete en web
cd apps/web && npm install [paquete] --legacy-peer-deps

# Mobile dev
cd apps/mobile && npm run dev

# Añadir componente shadcn
cd apps/web && npx shadcn@latest add [componente]

# Supabase migraciones
supabase db push

# Supabase Edge Function deploy
supabase functions deploy [nombre]

# Supabase secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
```

66. **Tabla `health_logs` para lesiones/molestias** — Migración 031. Campos clave: `client_id`, `trainer_id`, `reported_by` ('coach'|'client'), `muscle_id` (ej. 'quadriceps_left'), `pain_score` (1-10), `incident_type` ('puntual'|'diagnosticada'|'cronica'), `status` ('active'|'recovering'|'recovered'), `notes`. RLS: trainer acceso total, cliente SELECT + INSERT (reported_by='client') + UPDATE propios. Realtime habilitado.
67. **Mapa anatómico con imágenes reales + overlay SVG** — Componente `components/health/AnatomyMap.tsx` (web) usa 4 imágenes anatómicas (`/assets/anatomy/`) como fondo con SVG interactivo superpuesto. 18 zonas frontales + 16 posteriores definidas en `packages/shared/src/anatomy/zones.ts`. Soporta `gender` prop (`male`|`female`) para cambiar imagen. Mobile: `HealthScreen.tsx` con `Image` + `Svg` overlay. Colores: transparente=sin molestias, naranja=leve (1-5), rojo=grave (6-10), cyan=seleccionado. Web trainer: tab "Salud" en detalle de cliente (`TabSalud.tsx`). Web cliente: `/app/client/health` con toggle Hombre/Mujer. Mobile: tab "Salud" en bottom nav.
68. **`health_logs.muscle_id` es un texto libre** — No hay enum en DB. Los IDs válidos están definidos en las constantes `FRONT_MUSCLES` y `BACK_MUSCLES` de los componentes (ej: 'neck', 'chest_left', 'quadriceps_right', 'lower_back', 'traps', 'glute_left'). Al insertar, siempre usar uno de estos IDs.
69. **Tabla `routine_templates` para plantillas de rutina** — Migración 032. Campos clave: `trainer_id`, `name`, `training_days` (TEXT[]), `day_labels` (JSONB), `exercises` (JSONB — sin weight/RIR), `total_weeks`, `goal`. RLS: trainer full CRUD sobre sus propias plantillas. Los ejercicios de la plantilla usan tipos `TemplateExercise`, `TemplateSetConfig`, `TemplateWeekConfig` definidos en `types.ts` — NO reusar `SetConfig`/`WeekConfig` porque las plantillas excluyen `rir` y `target_weight`.
70. **Flujo plantillas en wizard de rutinas** — Step 1: dropdown "Cargar plantilla" (violeta) aplica goal, semanas, días y labels al estado. Step 2: si hay plantilla seleccionada, los labels se eligen por dropdown (labels de la plantilla) en vez de input libre. Step 3: `INIT_TRAINING_DAYS` carga ejercicios de la plantilla mapeando por `day_of_week` + `day_label`. El trainer puede modificar libremente y re-guardar como nueva plantilla con el botón "Guardar plantilla" (violeta, junto a "Enviar al cliente").
71. **Al mapear campos entre interfaces, mantener TODOS los campos requeridos del tipo destino** — Error ocurrido: `detectedColumns` en `excel/route.ts` mapeaba `col.type` a `inferred_type` pero eliminaba `type`, provocando error TS2322 porque el tipo de retorno esperaba `DetectedColumn & {...}` que incluye `type`. Regla: cuando se hace `.map()` sobre un tipo y se renombra un campo, incluir TAMBIÉN el campo original si el tipo destino lo requiere.
72. **Sistema de menús híbrido (Fase 6, COMPLETADO)** — Eliminado toggle Semanal/Mensual. `crSnacksPerDay` (0/1/2) reemplaza `crMealsPerDay` (3/4/5): 0=sin snacks (3 comidas), 1=Merienda (4), 2=Media Mañana+Merienda (5). `buildMealSlots(snacksPerDay)` genera slots con `isSnack` marcado. Snacks con borde naranja y badge. `MealSlot` extendido: `isSnack`, `notes` (textarea coach, persiste en JSONB), `supplements: Supplement[]` (no afectan macros). Botón "Copiar a..." en header de día clona meals a otro día (`CR_CLONE_DAY`). Panel flotante muestra deltas por macro: "Faltan Xg" / "Excedido Xg". Barras con `duration-500`. `meals_per_day` en DB = `3 + crSnacksPerDay`. Day headers con fecha real, validación % macros.
73. **`meal_plans.period` mantiene compatibilidad** — Al guardar menú, `period` se envía como `"weekly"` por defecto (ya no es configurable por el usuario). Los menús existentes con `period: "monthly"` siguen funcionándose.
74. **`DarkSelect` obligatorio — nunca usar `<select>` nativo** — Chrome/Windows ignora el `background-color` de `<option>` nativos, mostrando un dropdown blanco. Componente custom en `components/ui/DarkSelect.tsx`. Uso: `<DarkSelect value={val} onChange={(v) => ...} options={[{ value, label }]} placeholder="..." />`. Acepta `value: string`, `onChange: (value: string) => void`, `options: DarkSelectOption[]`, `placeholder?: string`, `className?: string`. Aplicado en toda la sección trainer y cliente.
75. **Tabla `saved_menu_templates` para menús guardados** — Migración 033. Campos: `trainer_id`, `name`, `config` (JSONB — contiene todos los campos del menú: días, semanas, macros, meals, suplementos, notas, snacks). RLS: trainer full CRUD sobre sus propias plantillas. Trigger `set_updated_at()`. El campo `config` incluye `crTitle`, `crSelectedDays`, `crMesocycleWeeks`, `crStartDate`, `crTargetKcal`, `crTargetProteinPct`, `crTargetCarbsPct`, `crTargetFatPct`, `crSnacksPerDay`, `crDays` (con meals + supplements + notes completos).
76. **Flujo menús guardados** — Botón "Guardar menú" (violeta) en la barra de acciones del planificador abre modal para poner nombre. Al guardar se serializa todo el estado `cr*` en `config` JSONB. Dropdown "Cargar menú guardado" en el formulario inicial de nuevo menú carga el `config` completo via acción `CR_LOAD_SAVED_TEMPLATE`. Al cargar, los suplementos se restauran con campo `id` generado via `crypto.randomUUID()` para compatibilidad con el UI.
77. **Botones de navegación semanal en la parte inferior** — Además del selector de semanas en la cabecera, los botones "Semana anterior" / "Semana siguiente" aparecen abajo del planificador (solo cuando `crMesocycleWeeks > 1`). La acción "Copiar menú al resto de semanas" copia el `crDays` de la semana actual a todas las demás semanas ajustando las fechas automáticamente via `getWeekDates(crStartDate, week)`.
78. **Botón "Generar con IA" posicionado en la cabecera del planificador** — Aparece a la derecha del título "Planificacion por dia", siempre visible, con estilo violeta. Actualmente muestra `toast.info("Generacion IA disponible proximamente")` — pendiente de integrar con Edge Function `generate-meal-plan`.
79. **Sistema de Comunidad Premium (Fase 7)** — Cada trainer tiene un "Feed de Alto Rendimiento" privado para sus clientes. Migración 034. Tablas: `communities` (1:1 con coach, campos: `coach_id`, `name`, `description`, `mode`, `is_active`), `community_posts` (texto + imagen), `community_comments`, `community_likes` (unique por post+user). Storage bucket `community-images` (5MB, jpeg/png/webp/gif). Realtime habilitado en posts, comments y likes.
80. **`communities.mode` controla permisos de publicación** — `OPEN`: clientes pueden publicar, comentar y dar likes. `READ_ONLY_CLIENTS`: solo el coach publica; clientes solo comentan y dan likes. La política RLS de INSERT en `community_posts` verifica `mode = 'OPEN'` para clientes. El UI oculta el formulario de publicación cuando `mode = 'READ_ONLY_CLIENTS'`, mostrando un banner naranja "Solo el Coach puede publicar en este canal".
81. **Comunidad se crea automáticamente** — La primera vez que el trainer visita `/app/trainer/community`, si no existe `communities` para su `coach_id`, se crea con nombre "Mi Comunidad" y `mode: 'OPEN'`. No requiere setup manual.
82. **Badge de verificado para el coach** — En posts y comentarios, el nombre del trainer aparece en color violeta (`#7C3AED`) con un badge "Coach" (checkmark SVG + texto uppercase) junto al nombre. Los clientes aparecen en blanco. Los avatares del coach usan fondo violeta; los de clientes, fondo cyan.
83. **Comunidad fragmentada en componentes** — `apps/web/app/(dashboard)/app/trainer/community/`: `useCommunityPage.ts` (hook con useReducer, 30 acciones), `components/types.ts`, `components/CommunityFeed.tsx` (feed-only: posts + comments), `components/CommunityPublish.tsx` (formulario de crear publicación), `components/CommunitySettings.tsx` (nombre, descripcion, toggle mode, toggle active), `page.tsx` orquestador (~160 líneas, 3 tabs: Feed/Publicar/Ajustes). Cliente: `apps/web/app/(dashboard)/app/client/community/page.tsx` (tabs Feed + Publicar condicional según mode).
84. **Publicaciones fijadas (pinned)** — El trainer puede fijar posts con el botón bookmark. Posts fijados aparecen primero (order by `is_pinned DESC, created_at DESC`) y tienen borde violeta con ring. Badge "Fijado" visible.
85. **Sidebar: "Comunidad" entre "Citas" y "Chat"** — Tanto en `TrainerSidebar` como en `ClientSidebar`. Icono: grupo de personas (users SVG). Badge de no leídos cuando hay posts nuevos. El cliente solo ve la comunidad si su trainer la tiene activa (`is_active = true`).
86. **Respuestas a comentarios (threading)** — `community_comments.parent_id` (FK self-referencial, nullable). Comentarios se renderizan como árbol con indentación (`ml-6 border-l`). Profundidad máxima: 2 niveles. Botón "Responder" abre input inline debajo del comentario. Enter envía la respuesta. El tree se construye en `handleLoadComments` agrupando por `parent_id`.
87. **Likes en comentarios + diferenciación coach** — Tabla `community_comment_likes` con `comment_id`, `user_id`, `is_coach` (BOOLEAN). El coach al dar like se marca `is_coach: true`. En el UI: like del coach muestra corazón violeta + badge "Coach" junto al contador. Likes de clientes son cyan estándar. RLS: mismas políticas que `community_likes` pero sobre comments. Realtime habilitado.
88. **`community_comment_likes` tiene unique constraint** — `(comment_id, user_id)`. Misma lógica que `community_likes`: toggle optimista, insert si no existe, delete si ya existe.
89. **Tab "Publicar" separado y condicional** — La creación de publicaciones está en su propio tab tanto en trainer como en cliente. En el trainer siempre se muestra (3 tabs: Feed, Publicar, Ajustes). En el cliente, el tab "Publicar" solo aparece si `community.mode === 'OPEN'`; si es `READ_ONLY_CLIENTS` solo se muestra el tab "Feed" (sin barra de tabs). `CommunityTab` type incluye `"publish"`.
90. **`community_posts.title` opcional** — Migración 035. Columna `TEXT` nullable. El formulario de publicación muestra input de título con placeholder "Titulo (opcional)". En el feed, si el post tiene título se muestra como `<h3>` bold blanco encima del contenido.
91. **Tabla `community_read_status` para tracking de lectura** — Migración 035. `(community_id, user_id)` unique. `last_seen_at` se actualiza con upsert al visitar la comunidad. Se usa para calcular posts no leídos en sidebar.
92. **Badge de no leídos en sidebar para Comunidad** — Mismo patrón que el badge de chat. `TrainerSidebar`: cuenta posts de clientes posteriores a `last_seen_at`. `ClientSidebar`: cuenta todos los posts posteriores a `last_seen_at`. Realtime: escucha INSERT en `community_posts` para incrementar el badge. Se resetea al visitar `/app/*/community`. Estilo: pill cyan con glow, igual que chat.

93. **Layout auth como Server Component async** — `apps/web/app/(dashboard)/layout.tsx` es un Server Component async. Usa `createClient()` de `@/lib/supabase-server`, llama a `supabase.auth.getUser()` y hace `redirect("/login")` si no hay sesión. NO usar middleware ni `getSession()` en layouts (no verifica JWT con el servidor). Las redirecciones basadas en rol usan `headers()` para obtener el pathname sin acceder a `window`.

94. **`supabaseAdmin` (service_role) siempre DESPUÉS de auth+role check** — En API routes, la inicialización del cliente admin (`createClient(url, serviceKey)`) debe hacerse DENTRO del handler y únicamente después de haber verificado que el usuario tiene el rol correcto. Si el check de rol falla con error de DB → retornar 403 (fail-closed), nunca 500 que podría dar pistas.

95. **Realtime cleanup en React Native — patrón obligatorio** — `useEffect` con suscripción Realtime DEBE retornar una función de cleanup síncrona (no async). Patrón correcto:
    ```ts
    useEffect(() => {
      let channel: ReturnType<typeof supabase.channel> | null = null;
      const setup = async () => { channel = supabase.channel("...").on(...).subscribe(); };
      setup();
      return () => { if (channel) supabase.removeChannel(channel); };
    }, []);
    ```
    Nunca `return setup()` (retorna Promise, no cleanup). Aplica a `ChatScreen.tsx`, `AppointmentsScreen.tsx` y cualquier Screen con Realtime.

96. **`useChat` hook compartido** — La lógica de chat (cargar mensajes, Realtime, marcar como leído, enviar) vive en `apps/web/hooks/useChat.ts`. Tanto `TabChat.tsx` (trainer) como `client/chat/page.tsx` (cliente) importan de ahí. No duplicar lógica de chat en componentes.

97. **`ClientOption` centralizado en `trainer/types.ts`** — La interfaz `ClientOption` ({client_id, full_name, email, food_preferences?}) vive en `apps/web/app/(dashboard)/app/trainer/types.ts`. Todos los módulos trainer (routines, nutrition, appointments) re-exportan desde ahí: `export type { ClientOption } from "@/app/(dashboard)/app/trainer/types"`. Nunca redefinir la interfaz localmente.

98. **Constantes nombradas en lugar de magic strings/numbers en `lib/`** — Archivos en `apps/web/lib/` deben declarar constantes exportadas para valores que se usan en múltiples lugares. Ejemplos: `INFERENCE_THRESHOLD_HIGH = 0.9` en `excel-parser.ts`, `CALENDAR_COLOR_*` en `google-calendar.ts`. Evitar literales repetidos que dificulten el mantenimiento.

99. **Confirmación en dos pasos para acciones destructivas en UI** — Botones de "Cancelar cita", "Eliminar", etc. no deben ejecutar la acción directamente. Usar estado `confirmXxxId: string | null` — primer click setea el ID, segundo click ejecuta la acción, cualquier otro click (o blur) resetea a null. Mostrar "¿Confirmar?" como texto del botón en el estado intermedio. Esto aplica en `AppointmentList.tsx` (cancelar cita) y cualquier acción irreversible en el UI.

100. **`loading.tsx` obligatorio en rutas de dashboard** — Toda ruta de Next.js App Router bajo `(dashboard)/` debe tener su `loading.tsx` correspondiente que muestre un spinner/skeleton inmediato. Archivos creados: `app/(dashboard)/loading.tsx`, `app/(dashboard)/app/trainer/loading.tsx`, `app/(dashboard)/app/client/loading.tsx`. Patrón: spinner cyan `animate-spin` + texto "Cargando..." en `#5A5A72`.

101. **`React.memo` en componentes hoja reutilizables** — Componentes que se renderizan en listas o grids y reciben props estables deben estar envueltos en `memo()`. Ejemplos: `ExerciseCard`, `AppointmentList`, `CommunityFeed`. Patrón: `export const Foo = memo(function Foo(props) { ... })` (función nombrada dentro de memo para mejor stack traces).

102. **`next/image` obligatorio para imágenes de contenido dinámico** — Las imágenes de posts de comunidad (`image_url` de Supabase Storage) deben usar `<Image fill sizes="..." />` de `next/image` en un contenedor `relative`. Configurar `remotePatterns` en `next.config.ts` para `**.supabase.co`. No usar `<img>` nativo para imágenes de contenido.

103. **Promise.all para queries independientes en useEffect/loaders** — Cuando una función de carga hace múltiples `await supabase.from(...)` sobre tablas que no dependen entre sí, SIEMPRE usar `Promise.all`. Nunca encadenar `await` secuenciales para queries independientes. Ahorra el tiempo de la query más lenta × (N-1) queries.

104. **`fetch("/api/...")` fire-and-forget para side effects no bloqueantes** — Llamadas a API routes que realizan efectos secundarios (activar cliente, marcar leído, etc.) y cuyo resultado no bloquea la UI deben hacerse sin `await`: `fetch("/api/activate-client", { method: "POST" }).catch(() => {})`. Añadir `.catch(() => {})` para silenciar errores no críticos.

105. **Filtro de rango de fechas obligatorio en queries de appointments** — Las queries a la tabla `appointments` deben incluir siempre un filtro de fechas (`.gte("starts_at", ...).lte("starts_at", ...)`) para evitar traer el historial completo. Rango recomendado: 1 mes atrás + 3 meses adelante. Sin filtro, el payload crece indefinidamente con el uso.

106. **`.limit()` en todas las queries paginables** — Tablas que crecen con el uso (`community_posts`, `appointments`, `messages`, `weight_log`, `body_metrics`, `food_log`) DEBEN tener `.limit()` explícito. Valores orientativos: posts=50, messages=100-500, metrics=100. Sin límite, una tabla con 1000+ filas degrada la carga inicial.

107. **Batch insert en lugar de bucles** — En API routes, nunca hacer INSERT individual dentro de un `for..of`. Recopilar todos los objetos en un array y hacer un único `supabase.from(...).insert(array)`. Para operaciones de lookup antes del insert, pre-cargar con `.in("id", idsArray)` y procesar en memoria. Ver `api/import/create-exercises/route.ts` como referencia del patrón correcto.

108. **Verificar que los archivos importados realmente existen** — Antes de referenciar un path en un import (`import { X } from "./utils"`, `export type { Y } from "@/app/trainer/types"`), verificar que el archivo destino existe físicamente. Un import a archivo inexistente compilará en local con errores de TS pero romperá el build de Vercel con TS2307. Si el archivo no existe: crearlo antes de hacer el import.

109. **Componentes `components/` deben ser importados en `page.tsx`** — Cuando existe una carpeta `components/` junto a un `page.tsx`, verificar que el `page.tsx` realmente importa desde ella. Si `page.tsx` tiene funciones de componente definidas inline y `components/` existe pero no se usa, el refactor está incompleto. Ejecutar `grep "from \"./components"` en el `page.tsx` para verificar.

129. **Tablas `support_tickets` + `ticket_replies` para consultas** — Migración 038. `support_tickets`: `trainer_id`, `client_id`, `category` (nutricion|rutina|lesion|general), `subject`, `description`, `image_url`, `status` (open|in_progress|resolved). `ticket_replies`: `ticket_id`, `sender_id`, `content`, `image_url`, `read_at`. RLS: trainer full CRUD sobre sus tickets; cliente SELECT + INSERT propios tickets + INSERT replies en sus tickets + UPDATE read_at. Realtime habilitado en ambas tablas. Storage bucket `ticket-images` (5MB, jpeg/png/webp).
130. **Consultas: trainer master-detail, cliente list/create/detail** — Web trainer: `/app/trainer/tickets` con layout master-detail (lista filtrable + hilo conversacional). `useTicketsPage.ts` con useReducer. Web cliente: `/app/client/tickets` con 3 vistas (list, create, detail). `useClientTicketsPage.ts` con useReducer. Mobile: `TicketsScreen.tsx` con 3 vistas locales. Tab "Consultas" entre Salud y Chat en bottom nav.
131. **Badges de consultas no leídas en sidebars** — `TrainerSidebar`: cuenta `support_tickets` con `trainer_read_at IS NULL` (tickets nuevos) + `ticket_replies` con `sender_id != trainerId AND read_at IS NULL` (respuestas no leídas). `ClientSidebar`: cuenta `ticket_replies` con `sender_id != clientId AND read_at IS NULL`. Realtime: escucha INSERT en `support_tickets` + `ticket_replies`. Reset al visitar `/app/*/tickets` via `usePathname`. La política RLS `trainer_replies_update_read` permite al trainer marcar como leídas replies de clientes (la política `trainer_replies_all` FOR ALL tiene `sender_id = auth.uid()` en WITH CHECK que bloqueaba estos UPDATEs).
132. **Tipos compartidos en `@fitos/shared`** — `SupportTicket`, `TicketReply`, `TicketCategory`, `TicketStatus`, `TICKET_CATEGORIES`, `TICKET_STATUSES` exportados desde `packages/shared/src/types/tickets.ts`.

---

## Arquitectura de permisos — estado auditado (30/03/2026)

### Capas de protección (web)

**Capa 1 — Middleware (`apps/web/middleware.ts`):**
- Redirige usuarios no autenticados desde `/app/*` y `/onboarding/*` → `/login`
- Redirige usuarios autenticados desde `/login`/`/register` → dashboard según rol + onboarding
- Bloquea cross-role: trainer → `/app/client/*` redirige a `/app/trainer/dashboard`; client → `/app/trainer/*` redirige a `/app/client/dashboard`
- Admin routing implementado: admin desde `/login`/`/register` → `/app/admin/dashboard`; admin en `/app/client/*` o `/app/trainer/*` → `/app/admin/dashboard`
- Usa `user.user_metadata?.role` (JWT, verificado por Supabase)

**Capa 2 — RLS (Supabase, todas las tablas):**
- Todas las tablas tienen RLS habilitado. Las políticas usan `auth.uid()` para scope por usuario.
- Tablas con políticas diferenciadas trainer/client: `appointments`, `messages`, `health_logs`, `community_posts`, `workout_sessions`, `weight_log`, `trainer_exercise_overrides`, `trainer_food_overrides`, `excel_imports`, `routine_templates`, `saved_menu_templates`, `support_tickets`, `ticket_replies`.
- Tablas solo-trainer: `user_routines` (INSERT/UPDATE), `meal_plans` (INSERT/UPDATE), `trainer_exercise_library`, `trainer_food_library`.
- Tablas solo-cliente: `food_log`, `body_metrics` (propias).

**Capa 3 — API Routes (verificación explícita):**
- Rutas de importación (`/api/import/excel`, `/api/import/reconcile`, `/api/import/create-exercises`): verifican `profiles.role === "trainer"` y retornan 403 si no.
- `/api/activate-client`: verifica `role === "client"` (solo clientes pueden activarse).
- `/api/client-trainer`: verifica `role === "client"`.
- `/api/complete-registration`: verifica auth + `client_id === user.id` (el body no puede suplantar otro usuario).
- Rutas admin (`/api/admin/*`): verifican `user_metadata.role === "admin"` via `verifyAdmin()` helper + rate limiting + service_role client. No modifican RLS existente — usan service_role para bypass total.

**Mobile:** La app mobile es SOLO para clientes. Los trainers usan la web. El `AuthContext` expone `role: UserRole` cargado desde `profiles.role` en DB. Tipo: `"client" | "trainer" | "admin" | null`.

### Dónde vive el rol

| Ubicación | Uso | Fuente de verdad |
|---|---|---|
| `auth.users.raw_user_meta_data.role` | Middleware web, redirects | Escrito en `signUp({ options: { data: { role } } })` |
| `profiles.role` (DB) | Verificación en API routes | Escrito en onboarding via upsert |
| `AuthContext.role` (mobile) | Navegación y lógica en mobile | Leído de `profiles.role` al iniciar sesión |

### Rol Admin — Implementado (06/04/2026)

**Estado actual:** Panel de administración completo implementado.

**Implementado:**
- ✅ Middleware: routing completo para admin (login/register → `/app/admin/dashboard`, bloquea `/app/client/*` y `/app/trainer/*`)
- ✅ `AdminSidebar` con 7 secciones: Dashboard, Usuarios, Códigos Promo, Consultas, Analíticas, Auditoría, Configuración
- ✅ `verifyAdmin()` helper compartido — verifica sesión + `user_metadata.role === "admin"` + rate limiting + retorna service_role client
- ✅ Dashboard con 9 KPIs via queries paralelas
- ✅ Gestión de usuarios: CRUD (crear trainer/client/admin con rollback), lista paginada con búsqueda y filtros, detalle con stats por rol, edición inline
- ✅ Códigos promo: lista con enrichment de trainers, filtros (activo/inactivo/expirado), toggle con confirmación
- ✅ Consultas: supervisión read-only de tickets cliente→trainer
- ✅ Analíticas: 17 queries paralelas, crecimiento 7d/30d, retención, tendencias, top trainers ranking
- ✅ Auditoría: visor de logs filtrable por acción y recurso
- ✅ Configuración: info plataforma, integraciones, seguridad, límites
- ✅ `AuthContext` mobile acepta `role: "admin"` (`UserRole = "client" | "trainer" | "admin" | null`)
- ✅ `profiles.role` es TEXT sin CHECK constraint — acepta "admin" sin migración

**Arquitectura:**
- Admin usa `service_role` (bypass total RLS) — NO se modifican políticas RLS existentes
- Todas las API routes admin en `/api/admin/*` usan `verifyAdmin()` helper
- Crear admin: desde el panel admin (`/app/admin/users/create`) o SQL directo en Supabase (ver `generar_admin.md`)

229. **`verifyAdmin()` patrón obligatorio para API routes admin** — Toda ruta en `/api/admin/*` DEBE usar `verifyAdmin(request)` de `lib/admin-auth.ts` como primera operación. Retorna `{ auth, errorResponse }`. Si `auth === null`, retornar `errorResponse!`. El `supabaseAdmin` retornado es un cliente service_role que bypasea RLS. Nunca crear un cliente service_role sin pasar por `verifyAdmin()` en rutas admin.

230. **Admin NO modifica RLS** — El panel admin accede a datos de todos los trainers y clientes via `service_role`. No añadir políticas RLS para admin en tablas existentes. Si una consulta admin no devuelve datos, verificar que se usa `supabaseAdmin` (service_role) y no el cliente anon.

231. **Creación de usuarios admin: rollback obligatorio** — `admin/users/create` crea auth user, luego profile, luego user_roles. Si la creación de profile falla, DEBE hacer rollback eliminando el auth user (`supabaseAdmin.auth.admin.deleteUser()`). Sin rollback, queda un auth user huérfano sin perfil.

232. **`verifyAdmin()` DEBE verificar `profiles.role` en DB — no solo JWT** — `user_metadata.role` del JWT es spoofable: un atacante puede llamar `supabase.auth.signUp({ data: { role: "admin" } })` para obtener un JWT con rol admin. El trigger `prevent_role_change()` (migración 040) solo bloquea UPDATE, no INSERT. La verificación DOBLE (JWT + `profiles.role` via service_role) es obligatoria. El layout admin también verifica `profiles.role` como defense-in-depth.

233. **Migración 044: protección anti-admin signup** — CHECK constraint `profiles.role IN ('trainer', 'client', 'admin')`. Políticas RLS RESTRICTIVE en `profiles`: bloquean INSERT con `role = 'admin'` y UPDATE a `role = 'admin'` (excepto si ya es admin). Combinado con `verifyAdmin()` que verifica `profiles.role`, un atacante que haga signUp con `role: admin` no puede crear un perfil admin (RLS lo bloquea) y por tanto `verifyAdmin()` lo rechaza.

---

## `@fitos/theme` — Paquete compartido de tokens de diseño

**Fuente de verdad única:** `packages/theme/src/index.ts` — contiene todos los colores, spacing, radius y fonts del proyecto.

### Reglas de uso

111. **`@fitos/theme` para todo código NUEVO** — Al escribir componentes nuevos (mobile o web), importar siempre los colores desde `@fitos/theme` en lugar de usar valores hardcoded. En mobile: `import { colors } from "@fitos/theme"`. En web JS/TSX (inline styles, charts): `import { colors } from "@fitos/theme"`. En web Tailwind: usar clases con nombre (`bg-neon-cyan`, `text-neon-violet`) en lugar de `bg-[#00E5FF]`.

112. **NO migrar los valores hardcodeados existentes** — Hay 1021+ instancias de `bg-[#00E5FF]` y similares en el web. No tocarlos. La política es "new code only": solo el código nuevo usa `@fitos/theme` o clases Tailwind con nombre.

113. **Cambio de marca en 1 comando** — Para actualizar un color de marca: (1) editar `packages/theme/src/index.ts`, (2) ejecutar `npm run sync-theme` desde la raíz. Esto regenera automáticamente el bloque CSS de Tailwind v4 en `globals.css` entre los marcadores `[fitos-theme-start]` y `[fitos-theme-end]`. Mobile recoge el cambio sin acción adicional (import JS directo).

114. **Tailwind v4 no usa `tailwind.config.js`** — Este proyecto usa Tailwind v4 CSS-first. Los tokens de color para Tailwind se definen en el bloque `@theme inline {}` de `apps/web/app/globals.css`, generado por `npm run sync-theme`. No crear `tailwind.config.js` — rompería el setup actual.

115. **`shadows` permanece en `apps/mobile/src/theme.ts`** — Las sombras (shadowColor, elevation) usan APIs de React Native y no se pueden compartir con web. `theme.ts` importa y re-exporta desde `@fitos/theme` pero define `shadows` localmente.

116. **Metro Bundler necesita `watchFolders`** — Expo/Metro no ve archivos fuera de `apps/mobile/` por defecto. `metro.config.js` ya tiene `watchFolders` configurado apuntando a `../../packages`. Si se añaden más paquetes compartidos, añadir al array.

117. **`rgba` strings en `@fitos/theme` son solo para web/CSS** — Valores como `border: "rgba(255,255,255,0.06)"` son correctos para web. En React Native, si se necesita opacidad dinámica sobre un color, usar `borderHex` (el hex puro `#FFFFFF`) junto con `StyleSheet opacity` o una librería como `tinycolor2`. Nunca manipular strings rgba dinámicamente en RN.

118. **Mapa anatómico basado en imágenes reales + overlay SVG** — El componente `AnatomyMap` (web: `components/health/AnatomyMap.tsx`, mobile: `HealthScreen.tsx`) usa 4 imágenes anatómicas como fondo (`apps/web/public/assets/anatomy/`, `apps/mobile/assets/anatomy/`) con un SVG interactivo superpuesto. Las zonas musculares se definen en `packages/shared/src/anatomy/zones.ts` (`MUSCLE_ZONES`, viewBox `0 0 400 720`). Los paths SVG son aproximaciones que pueden refinarse con un SVG Path Visualizer. No volver a usar el SVG puro antiguo (body outline + muscle shapes dibujadas a mano).

119. **`profiles.gender` para selección de imagen anatómica** — Migración 036. Columna TEXT nullable (`'male'` | `'female'`). Default `NULL` = se trata como `'male'` en el componente. El toggle Hombre/Mujer está en la página de salud del cliente (web + mobile). Al cambiar, se actualiza en DB de forma no bloqueante.

120. **Zonas anatómicas en `@fitos/shared` — fuente de verdad única** — Los IDs de zona (`neck`, `chest_left`, `quadriceps_right`, etc.) y labels (español) se definen SOLO en `packages/shared/src/anatomy/zones.ts`. Web importa via `AnatomyMap.tsx` → re-exporta `MUSCLE_LABELS` (alias de `ZONE_LABELS`). Mobile importa `ZONE_LABELS` directamente de `@fitos/shared`. No duplicar definiciones de zonas. El antiguo `apps/mobile/src/screens/health/muscleData.ts` está deprecado (no borrado).

121. **Métricas de ejercicio: stress_index + stimulus/fatigue en `weight_log`** — Migración 037. Tres columnas nuevas: `stress_index` NUMERIC (auto-calculado), `stimulus_rating` SMALLINT 1-5, `fatigue_rating` SMALLINT 1-5. El SFR (ratio) se calcula en frontend como `stimulus / fatigue`. Fórmula del stress index: `sum(weight × reps × rirFactor)` donde rirFactor va de 1.0 (RIR=0) a 0.75 (RIR≥5). Se captura una vez por ejercicio (no por serie) en la fase `"sfr"` del entrenamiento activo, justo después de completar todas las series.
122. **Fase `"sfr"` en entrenamiento activo (web + mobile)** — Cuando todas las series de un ejercicio se completan, el flujo pasa a fase `"sfr"` (no directamente a "training"). Se muestran 2 inputs (Estímulo 1-5 + Fatiga 1-5) con preview del SFR. Al confirmar, se guarda el progreso y vuelve a "training". Web: componente `SFRSelector.tsx` en `routine/active/components/`. Mobile: `SfrScreen.tsx` en `screens/routine/`. Estado en `exerciseStimulus` y `exerciseFatigue` (Record<number, number>).
123. **Gráficas de ejercicio con `recharts`** — Paquete `recharts` instalado en `apps/web`. Componente `ExerciseAnalytics.tsx` en `trainer/clients/[id]/components/`. Se accede desde TabRutina con toggle "Historial" / "Análisis". 4 gráficas: Volumen + Stress Index, SFR temporal, Peso Máximo, Estímulo vs Fatiga. Cards de tendencia con porcentaje de cambio últimas 3 sesiones vs anteriores. Necesita mínimo 2 sesiones con datos.
124. **`calculateStressIndex` exportada** — Función pura en `useActiveTraining.ts` (web). Recibe array de sets con weight_kg, reps_done, rir, completed. Devuelve número redondeado a 2 decimales. Mobile tiene la misma lógica inline en `calcStressIndex` dentro de `useRoutineScreen.ts`.
125. **RPE por serie, no por ejercicio (web + mobile)** — `SetEntry` incluye campo `rpe: string`. Se muestra como columna adicional en la tabla de series, solo si el trainer configuró `target_rpe > 0` para ese ejercicio. Grid dinámico: columnas Serie | Peso | Reps | [RIR si configurado] | [RPE si configurado] | ✓. El `exercise_rpe` guardado en `weight_log` se calcula como media de los RPE por serie completados. Eliminada la caja RPE por ejercicio que había antes. Web: `ExerciseCard.tsx` con `showRir`/`showRpe` booleanos. Mobile: `ActiveTraining.tsx` y `RegistrationMode.tsx` con la misma lógica.
126. **Columnas RIR y RPE condicionales en entrenamiento activo** — RIR se muestra solo si `exercise.rir > 0` o algún `sets_config`/`weekly_config` tiene rir > 0. RPE se muestra si `exercise.target_rpe > 0` O algún `sets_config[].target_rpe > 0` O algún `weekly_config[].target_rpe > 0` o `weekly_config[].sets_detail[].target_rpe > 0`. `SetConfig.target_rpe` permite configurar RPE por serie (tanto en "Series diferentes" como en "Progresión semanal"). `WeekConfig.target_rpe` es el RPE por serie en modo "Todas iguales" dentro de la progresión semanal. El placeholder RPE en el cliente resuelve: `cfg.target_rpe ?? exercise.target_rpe`. Si el trainer no configuró ninguno, el cliente solo ve Serie | Peso | Reps | ✓. Aplica en web (`ExerciseCard.tsx`) y mobile (`ActiveTraining.tsx`, `RegistrationMode.tsx`).
127. **Series derivadas: Rest-Pause y Drop Set (web + mobile)** — Tanto en modo "Series diferentes" como en "Todas iguales", cada serie normal tiene botones "RP" (naranja) y "DS" (violeta) que insertan una serie derivada justo después. `SetConfig.set_type` puede ser `"normal"` (defecto), `"rest_pause"` o `"drop_set"`. La serie derivada se inicializa con los mismos reps de la serie origen; RP con 15s de descanso, DS con 0s descanso y 80% de la carga. Se pueden eliminar con botón ✕. El trainer las configura en `DaySchedule.tsx` (editor de rutinas) tanto en la vista principal como en la modal "Progresión semanal" (`WeeklyConfigModal`). En la modal, ambos modos soportan RP/DS: "diferentes" muestra per-set view directamente; "iguales" muestra botones RP/DS que al pulsar expanden la semana a `sets_detail` (via `expandEqualAndAddDerivative`). Si se eliminan todas las derivadas, la semana vuelve a scalar. Acciones del reducer: `CR_ADD_DERIVATIVE_SET` y `CR_REMOVE_DERIVATIVE_SET` (vista principal). La modal semanal maneja RP/DS con estado local (`addWeekDerivativeSet` / `removeWeekDerivativeSet` / `expandEqualAndAddDerivative`). En el save, `rest_pause_sets` se calcula automáticamente como count de series con `set_type !== "normal"`. El `sets` del ejercicio incluye todas las series (normales + derivadas). El template save también preserva `set_type` en `sets_config` y `weekly_config.sets_detail`.
128. **Visualización de series derivadas para el cliente** — Series RP/DS se muestran con indentación (`ml-4` web, `marginLeft: 24` mobile), borde izquierdo coloreado (naranja para RP, violeta para DS), y badge "RP"/"DS" en lugar de número de serie. La numeración de series normales es independiente (S1, S2, S3) — las derivadas no afectan el conteo. Aplica en: vista previa del cliente (`routine/components/ExerciseCard.tsx`), entrenamiento activo web (`routine/active/components/ExerciseCard.tsx`), mobile (`ActiveTraining.tsx`, `RegistrationMode.tsx`). Historial del trainer (`TabRutina.tsx`) muestra "RP"/"DS" en los chips de series completadas.
133. **Secciones en formulario de onboarding (`type: "section"`)** — `FormField` ahora soporta `type: "section"` como tipo especial que actua como cabecera de grupo. Campos adicionales: `description?: string` (texto para el cliente), `enabled?: boolean` (default true, el trainer puede desactivar la seccion). Los campos que siguen a un section field pertenecen a esa seccion hasta el siguiente section field. Utility `groupFieldsBySection()` en `@fitos/shared` agrupa el array plano en `SectionGroup[]`. `getEnabledSections()` filtra las desactivadas. Backwards compatible: formularios sin sections se renderizan como antes (1 step plano).
134. **Plantilla de secciones de onboarding** — `apps/web/lib/onboarding-templates.ts` exporta `getOnboardingSectionsTemplate()` que genera 5 secciones con preguntas sugeridas (IDs unicos por llamada). Secciones: Historial Medico, Historial Deportivo, Experiencia en Entrenamiento, Estado Actual, Objetivos. El trainer carga la plantilla con un click ("Cargar plantilla de secciones") en la pagina de formularios o en el onboarding wizard. Las secciones son opcionales — el trainer puede activar/desactivar cada una.
135. **Cliente onboarding multi-paso por seccion (web + mobile)** — Si el formulario tiene section fields, el wizard del cliente muestra cada seccion habilitada como un step separado (con nombre de seccion en el indicador). El ultimo step siempre es "Datos fisicos y preferencias". Las respuestas se guardan via upsert despues de cada seccion. Si el formulario no tiene sections, se mantiene el comportamiento anterior (1 step formulario + 1 step datos fisicos).
136. **Edge Function `analyze-onboarding-form` — analisis por seccion** — La funcion agrupa las respuestas del cliente por seccion para dar contexto estructurado a Claude. Incluye `medical_flags` y `precautions` en el JSON de analisis. Columnas de perfil corregidas: usa `weight` y `height` (no `weight_kg`/`height_cm`). Preferencias alimenticias formateadas como texto legible.
137. **Tabla `knowledge_articles` para base de conocimiento** — Migración 039. Campos clave: `trainer_id`, `title`, `content`, `category` (CHECK: nutricion, rutina, lesion, tecnica, suplementacion, general), `image_url`, `video_url`, `is_published`, `view_count`, `source_ticket_id` (FK nullable a `support_tickets`). RLS: trainer full CRUD sobre sus artículos; cliente SELECT solo artículos publicados de su trainer (via `trainer_clients`). Función `search_knowledge_articles(p_trainer_id, p_query)` con full-text search (español) + ILIKE fallback. Función `increment_article_view(article_id)` SECURITY DEFINER para que el cliente pueda incrementar view_count en artículos del trainer sin UPDATE directo. Storage bucket `knowledge-images` (5MB, jpeg/png/webp). Realtime no habilitado (no necesario).
138. **Tipos compartidos de conocimiento en `@fitos/shared`** — `KnowledgeCategory` (6 valores), `KnowledgeArticle` interface, `KNOWLEDGE_CATEGORIES` array con labels e iconos. Exportados desde `packages/shared/src/types/knowledge.ts`.
139. **Integración Consultas ↔ Conocimiento** — Bidireccional: (1) Trainer puede convertir ticket resuelto en artículo via botón "Convertir en artículo" en `TicketDetail.tsx` → navega a `/app/trainer/knowledge?from_ticket=&title=&category=`. (2) Cliente ve artículos sugeridos al crear ticket: debounced search (400ms, 3+ chars) en `CreateTicketForm.tsx` busca por título con ILIKE. Click en sugerencia navega a `/app/client/knowledge?article=<id>`.
140. **Conocimiento: trainer CRUD, cliente browse** — Web trainer: `/app/trainer/knowledge` con `useKnowledgePage.ts` (useReducer, 12 acciones), `components/ArticleList.tsx` + `ArticleEditor.tsx`. Stats cards (total, publicados, vistas). Filtros por categoría, estado publicado, búsqueda. Web cliente: `/app/client/knowledge` con `useClientKnowledgePage.ts`, grid de artículos con filtro de categoría y búsqueda. `ArticleDetail.tsx` con embed YouTube + link video + imagen. Mobile: `KnowledgeScreen.tsx` con list/detail views. Tab "Conocimiento" entre Salud y Consultas en bottom nav (icono libro). Sidebar web: entre Consultas y Chat.
141. **RLS de trainer DEBE validar trainer_clients** — Toda política RLS que permite a un trainer acceder a datos de un cliente DEBE incluir `EXISTS (SELECT 1 FROM trainer_clients tc WHERE tc.trainer_id = auth.uid() AND tc.client_id = <tabla>.client_id)`. Sin esta validación, un trainer puede acceder a datos de clientes de otros trainers. Corregido en migración 040 para: `appointments`, `health_logs`, `workout_sessions`. Aplicar en cualquier tabla nueva con patrón trainer→client.
142. **Toda API route pública requiere autenticación** — Ningún endpoint debe ser accesible sin `supabase.auth.getUser()` verificado. Incluso endpoints de validación (ej: validate-promo) deben verificar sesión antes de cualquier acceso a DB. Un endpoint sin auth permite enumeración de datos y ataques de fuerza bruta.
143. **Validar propiedad de recursos en API routes** — No basta con verificar auth + role. Si un endpoint acepta `trainer_id` + `promo_code_id`, DEBE verificar que el promo code pertenece al trainer indicado. Si acepta `import_id`, verificar que el import pertenece al trainer autenticado. Patrón: query con `.eq("id", resourceId).eq("trainer_id", trainerId).single()` antes de usar el recurso.
144. **Incrementos atómicos via DB function** — Nunca hacer read-then-update para incrementar contadores. Usar funciones SECURITY DEFINER con `UPDATE ... SET x = x + 1 WHERE condicion RETURNING`. Función `increment_promo_code_usage(p_promo_code_id)` creada en migración 040. Para nuevos contadores, crear función similar.
145. **Open Redirect: whitelist de URLs de retorno** — Toda API route que redirige basándose en un parámetro del request (ej: `state`, `returnTo`, `redirect`) DEBE validar contra una whitelist de rutas internas. Nunca redirigir a URLs externas. Patrón: `const ALLOWED = ["/app/..."]; const returnTo = ALLOWED.includes(raw) ? raw : DEFAULT;`. Corregido en: `api/auth/google/route.ts`, `api/auth/google/callback/route.ts`.
146. **Protección anti role-escalation en auth.users** — Trigger `prevent_role_change()` en `auth.users` (migración 040) impide que un usuario cambie su propio `role` en `raw_user_meta_data` via `supabase.auth.updateUser()`. Si `role` ya estaba seteado, el trigger lo revierte al valor original. Esto protege el middleware que confía en `user.user_metadata.role` para routing.
147. **CHECK constraints en columnas numéricas de métricas** — `weight_log.stress_index` tiene CHECK `>= 0 AND <= 50000` (migración 040). `stimulus_rating` y `fatigue_rating` tienen CHECK `BETWEEN 1 AND 5`. Toda columna numérica que recibe input del usuario DEBE tener CHECK constraints en DB como última línea de defensa. Los límites deben ser realistas (ej: 50000 stress = 500kg × 20 reps × 5 sets al fallo).
148. **Validación de bounds en cliente ANTES del upsert** — `useActiveTraining.ts` valida: weight_kg ≤ 1000, reps ≤ 200, stress_index ≤ 50000, stimulus/fatigue 1-5. Usar `clampPositive()` para sanear valores. La validación de cliente es UX (feedback inmediato); la validación de DB (CHECK) es seguridad (última defensa). Ambas son necesarias.
149. **Storage buckets: uploads restringidos a carpeta del usuario** — Las políticas de INSERT en `storage.objects` para `community-images`, `ticket-images` y `knowledge-images` verifican `(storage.foldername(name))[1] = auth.uid()::text`. Impide que un usuario suba archivos a la carpeta de otro. Al subir imágenes desde el frontend, usar path `${userId}/filename.ext`.
150. **SECURITY DEFINER functions DEBEN incluir `SET search_path`** — Toda función SQL con `SECURITY DEFINER` debe incluir `SET search_path = public` para prevenir ataques de search_path hijacking. Corregido en `increment_article_view()` y `prevent_role_change()` (migración 040).
151. **`xlsx` (SheetJS) reemplazado por `exceljs`** — La community edition de SheetJS tenía Prototype Pollution y ReDoS sin parche. Migrado a `exceljs` (activamente mantenido, 0 vulnerabilidades). Archivos migrados: `lib/excel-parser.ts`, `app/api/import/excel/route.ts`, `lib/excel-parser.test.ts`. API equivalente: `new ExcelJS.Workbook()` + `workbook.xlsx.load(buffer)` + `worksheet.eachRow()`. `parseExcelBuffer()` ahora es `async` (retorna `Promise<ParseResult>`). Tests actualizados: `makeWorkbookBuffer()` usa `wb.xlsx.writeBuffer()` (async). La funcionalidad de import Excel para trainers no cambia.
152. **No interpolar variables de usuario en filtros PostgREST** — En vez de `.or(\`field.eq.${userInput}\`)` con template literal, usar concatenación con `encodeURIComponent`: `.or("field.eq." + encodeURIComponent(value))`. Aunque PostgREST parametriza internamente, la interpolación directa es un anti-patrón que facilita errores si se replica con inputs no controlados.
153. **Security headers obligatorios en `next.config.ts`** — CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), HSTS, Referrer-Policy, Permissions-Policy. Configurados en `async headers()`. CSP permite: self, unsafe-inline (Next.js lo necesita), Supabase domains, YouTube/Vimeo para embeds. `frame-ancestors 'none'` previene clickjacking. No modificar sin revisar impacto.
154. **Rate limiting obligatorio en API routes sensibles** — `lib/rate-limit.ts` exporta `apiLimiter` (60/min), `authLimiter` (10/min), `uploadLimiter` (10/min). Uso: `const { success } = limiter.check(getClientIdentifier(req, userId)); if (!success) return 429;`. Aplicado en: `validate-promo`, `import/excel`. Aplicar en cualquier endpoint nuevo que acepte input del usuario o haga writes a DB.
155. **Sanitizar TODOS los inputs de texto antes de guardar en DB** — `lib/sanitize.ts` exporta: `sanitizeText(input, maxLength)` para campos largos (notas, descripciones), `sanitizeName(input, maxLength)` para campos cortos (nombres, títulos), `sanitizeEmail(input)`. Strip HTML tags, null bytes, control characters. Aplicar en API routes y hooks de guardado. React auto-escapa en JSX, pero los datos podrían renderizarse fuera de React (emails, exports, webhooks).
156. **CSRF validation en API routes de mutación** — `lib/csrf.ts` exporta `validateCsrf(request)`. Verifica header `Origin` o `Referer` contra whitelist. Aplicar en todo endpoint POST/PUT/DELETE. `NEXT_PUBLIC_APP_URL` en .env para producción. GET/HEAD/OPTIONS son exempt.
157. **No enviar PII innecesario al frontend** — Los `.select()` de Supabase DEBEN incluir solo las columnas necesarias para la vista actual. `email` del cliente NO debe enviarse al frontend del trainer a menos que exista una sección de contacto explícita. `select("*")` está PROHIBIDO — usar columnas explícitas siempre. Corregido en: `trainer/clients`, `trainer/clients/[id]`, `trainer/nutrition`, `trainer/routines`, `api/client-trainer`.
158. **Verificar magic bytes en file uploads** — `lib/file-validation.ts` exporta `validateImageMagicBytes(buffer)` y `validateExcelMagicBytes(buffer)`. Verificar ANTES de procesar el archivo. Un `.exe` renombrado a `.jpg` no pasará la validación de magic bytes. Aplicado en `api/import/excel`. Aplicar en cualquier endpoint de upload nuevo.
159. **Structured logging con `lib/logger.ts`** — Exporta `logger.info()`, `logger.warn()`, `logger.error()`, `logger.security()`. Output JSON para parsing por log aggregators (Sentry, Datadog, Vercel Logs). Usar `logger.security()` para: intentos IDOR bloqueados, rate limits alcanzados, role escalation intentada, session_id inválido. Todos los `console.error` nuevos deben migrar a `logger.error()` progresivamente.
160. **Tabla `audit_logs` para auditoría de acciones críticas** — Migración 041. Campos: `user_id`, `action`, `resource_type`, `resource_id`, `target_user_id`, `metadata` (JSONB), `ip_address`. Función `log_audit_event()` SECURITY DEFINER para inserción desde API routes. Acciones a loguear: acceso a datos de salud, modificación de rutina/menú, lesión grave reportada, login, cambio de perfil, import Excel. RLS: usuario solo lee sus propios logs.
161. **Ownership validation obligatoria con service_role** — Toda API route que usa `supabaseAdmin` (service_role) y acepta un resource ID del request body DEBE verificar que el recurso pertenece al usuario autenticado ANTES de operar. `service_role` bypasea RLS — la validación explícita es la ÚNICA protección. Patrón: `const { data } = await supabaseAdmin.from("tabla").select("owner_field").eq("id", resourceId).single(); if (data?.owner !== user.id) return 403;`. Corregido en: `import/create-exercises`, `import/reconcile`.
162. **Layouts de trainer/client son async Server Components con auth check** — `app/(dashboard)/app/trainer/layout.tsx` y `client/layout.tsx` verifican `supabase.auth.getUser()` + `user.user_metadata.role` y redirigen si no coincide. Esto es defense-in-depth sobre el middleware. Si el middleware es bypaseado (cache poisoning, CDN bug), los layouts bloquean el acceso.
163. **Toast de error para resource IDs inválidos en URL params** — Si un `session_id`, `ticket_id`, `article_id` o similar viene de `searchParams` y la query devuelve vacío (RLS bloqueó o no existe), mostrar `toast.error("Recurso no encontrado")` en vez de fallar silenciosamente. El usuario debe saber que algo falló. Corregido en: `routine/active/page.tsx`.
164. **Realtime subscriptions DEBEN tener filtros scoped al usuario** — NUNCA suscribirse a una tabla sin filtro (`.on("postgres_changes", { table: "messages" }, ...)`). Siempre incluir `filter: \`campo=eq.${userId}\``. Los filtros de Realtime NO son un boundary de seguridad (pueden bypasearse), pero reducen el broadcast innecesario. La verdadera protección es RLS en la tabla. Si una tabla no tiene columna directa para filtrar (ej: `ticket_replies` no tiene `trainer_id`), usar `filter: \`sender_id=neq.${userId}\`` para minimizar exposición. Corregido en: `TrainerSidebar`, `ClientSidebar`, `trainer/chat`, `useTicketsPage`, `useClientTicketsPage`, mobile `TicketsScreen`.
165. **Edge Functions DEBEN verificar JWT con `getUser()`** — El header `authorization` solo demuestra que alguien envió un token. Hay que llamar `supabase.auth.getUser()` para verificar que es válido. Función compartida `_shared/auth.ts` con `authenticateRequest(req)` que retorna `{ user, supabase }` o lanza Response 401. Aplicar en TODAS las Edge Functions. `analyze-food-image` no tenía auth alguno — corregido.
166. **Edge Functions: body size limit obligatorio** — `validateBodySize(req, maxBytes)` en `_shared/auth.ts`. Default 1MB. `analyze-food-image` usa 7MB (base64 images). Previene JSONB bombs y DoS por payload gigante.
167. **Edge Functions: sanitizar inputs para prompts de IA** — `sanitizeForPrompt(input, maxLength)` strip HTML y control chars antes de interpolar en prompts de Claude. Previene prompt injection. No confiar en inputs del usuario como parte del prompt sin sanear.
168. **Video URLs: whitelist de dominios** — `lib/url-validation.ts` exporta `isAllowedVideoUrl(url)` y `sanitizeVideoUrl(url)`. Solo permite YouTube y Vimeo sobre HTTPS. Previene SSRF si el server alguna vez hace fetch de video URLs. Aplicar al guardar `video_url` en `knowledge_articles` y `trainer_exercise_library`.
169. **Nunca usar `export const revalidate` en páginas con datos de usuario** — Next.js cacheará la respuesta y la servirá a otros usuarios (cache poisoning). Las páginas de dashboard NUNCA deben tener `revalidate`. Solo es seguro en páginas públicas (landing, pricing). Si necesitas ISR, usar `revalidateTag()` con tags por usuario.
170. **Video URLs: validar antes de renderizar como `href` o `Linking.openURL`** — Un trainer puede guardar `javascript:alert(1)` en `video_url`. NUNCA renderizar URLs de DB directamente en `<a href>` o `Linking.openURL()`. Web: `isAllowedVideoUrl(url)` antes de mostrar el link. Mobile: regex inline `^https://(www\.)?(youtube|youtu\.be|vimeo)`. Si la URL no pasa, no mostrar el link. Corregido en: `ArticleDetail.tsx`, `KnowledgeScreen.tsx`.
171. **Registro de cliente REQUIERE promo code en backend** — Si `role === "client"`, el endpoint DEBE rechazar la petición si `trainer_id` o `promo_code_id` son null/undefined. No confiar en que el frontend valida — un atacante puede llamar a la API directamente. Corregido en: `complete-registration/route.ts`.
172. **Email en profiles viene de `authUser.user.email`, NUNCA del request body** — El body de la petición puede contener cualquier email. Usar siempre el email verificado de Supabase Auth (`authUser.user.email`). Previene email spoofing. Corregido en: `complete-registration/route.ts`.
173. **Image uploads: whitelist de extensiones obligatoria** — Solo permitir `jpg`, `jpeg`, `png`, `webp`, `gif`. Rechazar `svg` (puede contener JavaScript), `html`, `exe`, y cualquier otra extensión. Validar extensión ANTES de subir a storage. Aplicado en: `useCommunityPage.ts`, `useClientCommunityPage.ts`. Aplicar en cualquier nuevo upload.
174. **CSRF en TODAS las API routes POST/PUT/DELETE** — `validateCsrf(request)` debe llamarse al inicio de TODA API route que modifica datos. Sin excepción. Aplicado en: `validate-promo`, `complete-registration`, `activate-client`, `import/excel`, `import/create-exercises`, `import/reconcile`.
175. **CSRF usa `new URL().origin` para comparación estricta** — Nunca `startsWith()` para validar origins — permite bypass via subdominios maliciosos (`localhost:3000.evil.com`). Siempre parsear con `new URL()` y comparar `.origin`. Corregido en: `lib/csrf.ts`.
176. **`file.name` se sanitiza antes de guardar en DB** — `sanitizeName(file.name)` previene XSS almacenado si el nombre del archivo se muestra en UI. Aplicado en: `import/excel/route.ts`.
177. **Nunca loguear datos sensibles en `console.error`** — No incluir `error.message` de Supabase (puede contener nombres de tablas/columnas), ni `user_metadata`, ni emails, ni role mismatches con detalle. Loguear solo el contexto mínimo necesario: `console.error("[ruta] Error en operación")`. Para debugging detallado, usar `logger.error()` con nivel de detalle controlado.
178. **Rate limiter in-memory tiene limitación en serverless** — El `Map` se resetea en cada cold start de Vercel. Protege contra bursts rápidos dentro de una instancia, pero no contra ataques distribuidos. Para producción con 2000+ usuarios, migrar a `@upstash/ratelimit` (Redis distribuido). La implementación actual es suficiente para lanzamiento y tráfico moderado.
179. **Validación runtime de tipos en API routes** — No confiar en `as { ... }` de TypeScript — es compile-time only. Verificar `typeof`, `Array.isArray()`, y contenido del array antes de procesarlo. Aplicado en: `import/reconcile/route.ts`.
180. **`complete-registration` DEBE verificar sesión del caller** — No basta con `admin.getUserById(body.client_id)` — eso solo verifica que el user existe, no que el caller es ese user. Usar `createServerClient().auth.getUser()` para verificar sesión + `caller.id === client_id` para anti-spoofing. Corregido: ahora verifica sesión + identity match + rate limiting.
181. **Rate limiting obligatorio en TODAS las API routes** — No solo en las de upload/auth. Cualquier endpoint POST/GET que accede a DB debe tener rate limiter. Aplicado en: `complete-registration` (apiLimiter), `auth/google` (apiLimiter), `activate-client` (apiLimiter), `client-trainer` (apiLimiter), `import/create-exercises` (apiLimiter), `import/reconcile` (apiLimiter). Solo `validate-promo` e `import/excel` ya lo tenían.
182. **Nunca retornar `error.message` en responses de API** — `err.message` o `error.message` de Supabase/JS puede contener nombres de tablas, columnas o stack traces. Siempre retornar mensajes genéricos en español: `"Error inesperado"`, `"Error al crear ejercicio"`. Loguear el error internamente con `console.error("[ruta] contexto")` sin detalles. Corregido en: `activate-client`, `client-trainer`, `import/create-exercises`, `import/excel`, `import/reconcile`.
183. **Google OAuth callback DEBE verificar auth + role ANTES de exchangeCodeForTokens** — Sin verificación, un usuario no autenticado o un cliente puede completar el OAuth flow. El código de Google es single-use — si se consume sin verificar, el usuario legítimo no puede reintentarlo. Corregido: ahora verifica `getUser()` + `role === "trainer"` antes de intercambiar tokens.
184. **Arrays de input en API routes DEBEN tener longitud máxima** — `Promise.all` sobre un array de tamaño ilimitado es un vector DoS. Si el array viene del request body, capear: `if (arr.length > MAX) return 400`. `import/reconcile` capeado a 200 ejercicios.
185. **`sanitizeName()` obligatorio en nombres de ejercicios/alimentos insertados en DB** — `ex.name` del request body se inserta directo en `trainer_exercise_library`. Un `<script>` en el nombre es XSS almacenado si se renderiza fuera de React (emails, exports). Corregido en `import/create-exercises`.
186. **Edge Functions: `sanitizeForPrompt()` DEBE llamarse en TODOS los inputs interpolados en prompts** — Importar `sanitizeForPrompt` sin llamarlo es un error silencioso. Las 3 funciones (`analyze-onboarding-form`, `generate-gym-routine`, `generate-meal-plan`) lo importaban pero no lo usaban. Ahora todos los inputs de usuario pasan por `sanitizeForPrompt()` antes de interpolar. Incluye: `goal`, `level`, `equipment`, `food_preferences`, `restrictions`, `full_name`, `qaContext`, título del formulario.
187. **Edge Functions: columnas correctas en `profiles` son `weight` y `height`** — `generate-gym-routine` y `generate-meal-plan` usaban `weight_kg` y `height_cm` que no existen → devuelven NULL. Corregido a `weight` y `height` (Regla 12).
188. **Edge Functions: tabla de ejercicios es `trainer_exercise_library`** — `generate-gym-routine` consultaba `exercises` que no existe. Corregido.
189. **Edge Functions: no duplicar `getUser()` tras `authenticateRequest()`** — `authenticateRequest()` ya retorna `{ user, supabase }`. No volver a llamar `supabase.auth.getUser()` — es una llamada de red desperdiciada que además sombrea la variable `user`.
190. **Edge Functions: verificación IDOR obligatoria para `client_id`** — Cuando un trainer solicita datos/acciones sobre un `client_id`, verificar `trainer_clients.eq(trainer_id, user.id).eq(client_id, client_id)` ANTES de proceder. Sin esto, un trainer puede invocar funciones IA sobre clientes de otros trainers. Corregido en: `analyze-onboarding-form`, `generate-gym-routine`, `generate-meal-plan`.
191. **Edge Functions: CORS restringido a dominio real** — `Access-Control-Allow-Origin: *` permite a cualquier página web hacer requests autenticados si obtiene un token. Cambiado a `getCorsHeaders(req)` que verifica el `Origin` contra whitelist (`APP_URL` env var + localhost + `.vercel.app` previews). El OPTIONS preflight mantiene `*` por compatibilidad con CORS preflight spec.
192. **Edge Functions: nunca exponer `String(error)` en responses** — `details: String(error)` en catch blocks expone stack traces, nombres de tabla, y potencialmente fragmentos de tokens. Cambiado a mensajes genéricos. Si el error es un `Response` (de `authenticateRequest`), re-lanzar para que se sirva correctamente.
193. **`sanitizeForPrompt` debe cubrir delimitadores de prompt** — La versión original solo stripaba HTML y control chars. Ampliado para también eliminar: `Human:`, `Assistant:`, `System:` en líneas nuevas, tags `<system>/<user>/<assistant>`, caracteres RTL/bidi Unicode. Previene prompt injection sofisticado.
194. **`stripHtml` DEBE ejecutarse en loop hasta estabilizar** — Una sola pasada de `/<[^>]*>/g` no atrapa tags anidados como `<<b>script>alert(1)</script>`. El loop `while (prev !== result)` garantiza que no quedan tags parciales. Corregido en `sanitize.ts` y en `sanitizeForPrompt` de `_shared/auth.ts`.
195. **`unsafe-eval` PROHIBIDO en CSP de producción** — Next.js producción NO necesita `eval()`. Solo el dev server (HMR) lo requiere. CSP ahora usa `process.env.NODE_ENV === "development"` para incluirlo condicionalmente. `unsafe-eval` en producción permite ejecución de código arbitrario via XSS.
196. **Logger DEBE redactar campos PII automáticamente** — `lib/logger.ts` ahora tiene `redactSensitive()` que reemplaza valores de keys como `password`, `token`, `secret`, `authorization`, `cookie`, `access_token`, `refresh_token` con `[REDACTED]`. Redacta 1 nivel de profundidad. `JSON.stringify` envuelto en try/catch para manejar referencias circulares.
197. **Trainer RLS en weight_log, user_routines, meal_plans DEBE validar trainer_clients** — Migración 043 añade `EXISTS (SELECT 1 FROM trainer_clients tc WHERE tc.trainer_id = auth.uid() AND tc.client_id = <tabla>.client_id)` a las políticas trainer de estas tablas. Sin esto, `auth.uid() = trainer_id` permite acceso cruzado entre trainers.
198. **Trainer RLS en onboarding_responses DEBE validar trainer_clients** — La tabla no tiene `trainer_id` propio; la autorización se basa enteramente en `EXISTS (trainer_clients)`. Migración 043 reemplaza la política anterior.
199. **Trainer RLS en messages (3 políticas: select/insert/update) DEBE validar trainer_clients** — `trainer_messages_insert` además verifica `sender_id = auth.uid()`. `trainer_messages_update` WITH CHECK solo verifica `trainer_id` (permite actualizar `read_at`). Migración 043.
200. **Trainer RLS en support_tickets DEBE validar trainer_clients** — Misma lógica que weight_log. Migración 043.
201. **`log_audit_event()` DEBE validar `p_user_id = auth.uid()`** — Sin esta validación, cualquier usuario autenticado podía loguear eventos como otro usuario (audit log spoofing). Migración 043 añade `RAISE EXCEPTION` si no coinciden.
202. **Storage buckets `ticket-images` y `knowledge-images` DEBEN ser privados** — Con `public = true`, las URLs de descarga no necesitan token — cualquiera con el path puede descargar. Migración 043 los cambia a `public = false`.
203. **`increment_promo_code_usage` REVOCADO de public/authenticated** — Solo callable via `service_role` (desde API routes). Previene que un usuario autenticado invoque la función directamente vía `supabase.rpc()`. Migración 043.
204. **Deploy obligatorio tras modificar Edge Functions** — Las Edge Functions NO se despliegan con `git push`. Tras crear o modificar cualquier función en `supabase/functions/`, indicar SIEMPRE al usuario que ejecute `npx supabase functions deploy [nombre] --project-ref rgrtxlciqmexdkxagomo` para aplicar los cambios en producción. Si se modifica `_shared/auth.ts`, hay que redesplegar TODAS las funciones que lo importan.
205. **`getSession()` en client components, `getUser()` en server** — En componentes cliente ("use client"), hooks y páginas del dashboard, usar SIEMPRE `supabase.auth.getSession()` (parse local del JWT, ~0ms) en lugar de `supabase.auth.getUser()` (round-trip al servidor, ~1s). El middleware y los layouts ya verifican el JWT server-side como defense-in-depth. `getUser()` solo en: Server Components, API routes, layouts de seguridad, Edge Functions. Patrón: `const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;`.
206. **Optimización de carga aplicada (05/04/2026)** — 32 archivos optimizados: `getUser()` → `getSession()` en 12 páginas cliente web, 13 páginas trainer web, 6 screens mobile. `Promise.all()` para queries independientes en appointments, dashboard, meals, knowledge. `.limit()` añadido a health_logs, food_log. Resultado: ~1s menos por carga de página en toda la app.
225. **Lógica de rutina compartida en `@fitos/shared/routine-logic`** — Las funciones puras de entrenamiento activo (creación de sets, totales de sesión, RPE promedio, payload para DB) viven en `packages/shared/src/routine-logic/`. Archivos: `set-helpers.ts` (resolveSetEntryType, getSetTypeForIndex, createEmptySet, getTotalSetsCount, findPreviousSets), `session-helpers.ts` (buildSetsData, buildRegistrationSetsData, computeAverageRpe, computeSessionTotals, computeTotalVolume), `stress-index.ts`. Web y mobile importan desde `@fitos/shared` y mantienen solo wrappers platform-specific (calculateProgress con colores, buildSummaryData/computeSummaryData).
226. **`SetType` vs `SetEntryType` — dos type systems de sets** — `SetType` = `"normal" | "rest_pause" | "drop_set"` se usa en `SetConfig.set_type` (lo que el trainer configura). `SetEntryType` = `"main" | "rest_pause" | "drop_set"` se usa en `SetEntry.type` y `weight_log.sets_data[].type` (lo que se guarda en DB). `resolveSetEntryType()` mapea de config a runtime: `"normal"` → `"main"`. Nunca mezclar ambos.
227. **Mobile `SetEntry.type` es required, shared es optional** — En shared, `SetEntry.type?` es optional (web no lo usa durante entrenamiento). Mobile redefine `SetEntry` con `type: SetEntryType` required en `apps/mobile/src/screens/routine/types.ts`. Esto permite que el código mobile acceda a `.type` sin checks. No cambiar el shared `SetEntry` a required — rompería web.
228. **No duplicar tipos entre mobile y shared** — `MobileSetConfig`, `MobileWeekConfig`, `ExerciseData`, `DayData`, `RoutineRaw`, `PreviousSet`, `PreviousLog`, `SavedLogEntry`, `InProgressSession`, `ScreenMode` se re-exportan desde `@fitos/shared` en `apps/mobile/src/screens/routine/types.ts`. No redefinir localmente. Solo `SetEntry` tiene redefinición local (por `type` required).

---

## Regla de mantenimiento — obligatoria

**Al terminar cualquier desarrollo, bugfix o cambio significativo, actualiza `CLAUDE.md` antes de cerrar la sesión.**

Qué actualizar:
- **Reglas críticas:** añadir nuevas que hayan surgido, corregir las que ya no apliquen, actualizar estado de fases completadas.
- **Árbol de archivos:** reflejar archivos nuevos o modificados en la sección "Árbol de archivos clave".
- **Estado y blockers:** actualizar la tabla de la sección "Estado y blockers".
- **Gotchas:** documentar cualquier error nuevo en la tabla de la sección "Gotchas — errores documentados" con formato: `# | Área | Error cometido | Regla resultante`.

**Documentar errores no es opcional.** Un error no documentado es un error que se repetirá.

**Paridad web ↔ mobile es obligatoria.** Cualquier funcionalidad nueva o corrección de error debe aplicarse en web (`apps/web`) Y en mobile (`apps/mobile`).

**Especificaciones del producto:** `especificaciones.md` (especialmente Cap. 3 arquitectura y Cap. 4 base de datos).

---

## Credenciales Supabase

**Proyecto:** fitos-prod
**Project ID:** rgrtxlciqmexdkxagomo
**URL:** https://rgrtxlciqmexdkxagomo.supabase.co
**Region:** eu-west-1

---

## Variables de entorno

### Web — `apps/web/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://rgrtxlciqmexdkxagomo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar (configurar cuando esté listo)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback

# Resend (configurar cuando dominio verificado)
RESEND_API_KEY=
RESEND_FROM_EMAIL=citas@tu-dominio.com
```

### Mobile — `apps/mobile/.env`
```env
EXPO_PUBLIC_SUPABASE_URL=https://rgrtxlciqmexdkxagomo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Árbol de archivos clave

```
fitOS/
├── package.json (root, npm workspaces, npm@11.8.0)
├── turbo.json (tasks, no pipeline)
├── packages/
│   ├── theme/
│   │   ├── src/index.ts          ← fuente de verdad: colors, spacing, radius, fonts
│   │   ├── scripts/sync-css.ts
│   │   └── package.json          ← @fitos/theme
│   └── shared/
│       ├── src/
│       │   ├── index.ts          ← barrel export de tipos, zonas, utils, onboarding
│       │   ├── anatomy/zones.ts  ← MUSCLE_ZONES, ZONE_LABELS, ANATOMY_VIEWBOX
│       │   ├── onboarding/index.ts ← groupFieldsBySection, getEnabledSections
│       │   ├── routine-logic/
│       │   │   ├── index.ts          ← barrel de routine-logic
│       │   │   ├── stress-index.ts   ← calculateStressIndex
│       │   │   ├── set-helpers.ts    ← resolveSetEntryType, createEmptySet, getTotalSetsCount, findPreviousSets
│       │   │   └── session-helpers.ts ← buildSetsData, computeAverageRpe, computeSessionTotals
│       │   ├── types/            ← health, routine, appointments, community, messages, knowledge
│       │   ├── data/days.ts
│       │   └── utils/time.ts
│       └── package.json          ← @fitos/shared
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx                           ← dark mode hardcodeado
│   │   │   ├── globals.css                          ← @theme con marcadores fitos-theme-*
│   │   │   ├── page.tsx                             ← landing pública
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── onboarding/
│   │   │   │       ├── trainer/page.tsx             ← wizard 3 pasos
│   │   │   │       └── client/page.tsx              ← wizard 2 pasos
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx                       ← Server Component async, auth check
│   │   │   │   ├── loading.tsx
│   │   │   │   └── app/
│   │   │   │       ├── trainer/
│   │   │   │       │   ├── layout.tsx               ← TrainerSidebar
│   │   │   │       │   ├── loading.tsx
│   │   │   │       │   ├── dashboard/page.tsx
│   │   │   │       │   ├── clients/page.tsx
│   │   │   │       │   ├── clients/[id]/page.tsx    ← 7 tabs
│   │   │   │       │   ├── clients/[id]/components/ ← TabPerfil/Progreso/Rutina/Menu/Formulario/Chat/Salud/ExerciseAnalytics
│   │   │   │       │   ├── exercises/page.tsx
│   │   │   │       │   ├── routines/page.tsx        ← orquestador
│   │   │   │       │   ├── routines/useRoutinesPage.ts
│   │   │   │       │   ├── routines/components/
│   │   │   │       │   ├── nutrition/page.tsx       ← orquestador
│   │   │   │       │   ├── nutrition/useNutritionPage.ts
│   │   │   │       │   ├── import/page.tsx          ← wizard Excel 4 pasos
│   │   │   │       │   ├── forms/page.tsx
│   │   │   │       │   ├── appointments/page.tsx    ← orquestador
│   │   │   │       │   ├── appointments/components/ ← types/shared/CreateModal/Calendar/List
│   │   │   │       │   ├── community/page.tsx       ← orquestador
│   │   │   │       │   ├── community/useCommunityPage.ts
│   │   │   │       │   ├── community/components/
│   │   │   │       │   ├── tickets/page.tsx         ← orquestador master-detail
│   │   │   │       │   ├── tickets/useTicketsPage.ts
│   │   │   │       │   ├── tickets/components/      ← types/shared/TicketList/TicketDetail
│   │   │   │       │   ├── knowledge/page.tsx       ← orquestador CRUD artículos
│   │   │   │       │   ├── knowledge/useKnowledgePage.ts
│   │   │   │       │   ├── knowledge/components/    ← types/shared/ArticleList/ArticleEditor
│   │   │   │       │   └── settings/page.tsx
│   │   │   │       ├── client/
│   │   │   │       │   ├── layout.tsx               ← ClientSidebar con badges
│   │   │   │       │   ├── loading.tsx
│   │   │   │       │   ├── dashboard/page.tsx
│   │   │   │       │   ├── calories/page.tsx        ← AI Vision tracker
│   │   │   │       │   ├── routine/page.tsx
│   │   │   │       │   ├── routine/active/page.tsx  ← Suspense wrapper
│   │   │   │       │   ├── routine/active/useActiveTraining.ts
│   │   │   │       │   ├── routine/active/components/ ← ExerciseCard/RestTimer/RPESelector/SFRSelector/SummaryView
│   │   │   │       │   ├── meals/page.tsx
│   │   │   │       │   ├── calendar/page.tsx
│   │   │   │       │   ├── progress/page.tsx
│   │   │   │       │   ├── appointments/page.tsx
│   │   │   │       │   ├── health/page.tsx          ← mapa anatómico + logs
│   │   │   │       │   ├── community/page.tsx
│   │   │   │       │   ├── community/useClientCommunityPage.ts
│   │   │   │       │   ├── tickets/page.tsx         ← orquestador list/create/detail
│   │   │   │       │   ├── tickets/useClientTicketsPage.ts
│   │   │   │       │   ├── tickets/components/      ← types/shared/CreateTicketForm/TicketThread
│   │   │   │       │   ├── knowledge/page.tsx       ← browse artículos + deep link ?article=
│   │   │   │       │   ├── knowledge/useClientKnowledgePage.ts
│   │   │   │       │   ├── knowledge/components/    ← types/shared/ArticleDetail
│   │   │   │       │   └── chat/page.tsx            ← Realtime
│   │   │   │       └── admin/
│   │   │   │           ├── layout.tsx               ← Server Component, auth + role admin check
│   │   │   │           ├── dashboard/page.tsx       ← 9 KPIs + quick actions
│   │   │   │           ├── users/page.tsx           ← lista con búsqueda, filtros, paginación
│   │   │   │           ├── users/create/page.tsx    ← crear trainer/client/admin
│   │   │   │           ├── users/[id]/page.tsx      ← detalle + edición inline
│   │   │   │           ├── promo-codes/page.tsx     ← gestión códigos promo
│   │   │   │           ├── tickets/page.tsx         ← supervisión read-only
│   │   │   │           ├── analytics/page.tsx       ← métricas detalladas + top trainers
│   │   │   │           ├── audit/page.tsx           ← visor de logs
│   │   │   │           └── settings/page.tsx        ← config plataforma
│   │   │   ├── api/
│   │   │   │   ├── auth/google/route.ts
│   │   │   │   ├── auth/google/callback/route.ts
│   │   │   │   ├── import/excel/route.ts
│   │   │   │   ├── import/create-exercises/route.ts
│   │   │   │   ├── import/reconcile/route.ts
│   │   │   │   ├── complete-registration/route.ts
│   │   │   │   └── admin/                          ← todas con verifyAdmin() + service_role
│   │   │   │       ├── stats/route.ts              ← GET: 9 KPIs paralelos
│   │   │   │       ├── users/route.ts              ← GET: lista paginada + enrichment
│   │   │   │       ├── users/create/route.ts       ← POST: crear usuario con rollback
│   │   │   │       ├── users/[id]/route.ts         ← GET+PUT: detalle + edición
│   │   │   │       ├── promo-codes/route.ts        ← GET: lista códigos
│   │   │   │       ├── promo-codes/[id]/route.ts   ← PUT: toggle activo
│   │   │   │       ├── tickets/route.ts            ← GET: supervisión tickets
│   │   │   │       ├── analytics/route.ts          ← GET: 17 queries paralelas
│   │   │   │       └── audit/route.ts              ← GET: logs de auditoría
│   │   │   └── components/
│   │   │       ├── layout/TrainerSidebar.tsx + ClientSidebar.tsx + AdminSidebar.tsx
│   │   │       ├── ui/DarkSelect.tsx
│   │   │       └── health/AnatomyMap.tsx        ← imagen + overlay SVG, soporta gender
│   │   ├── public/assets/anatomy/              ← 4 imágenes anatómicas (front/back × male/female)
│   │   ├── lib/
│   │   │   ├── admin-auth.ts              ← verifyAdmin() helper para API routes admin
│   │   │   ├── supabase.ts + supabase-server.ts
│   │   │   ├── exercise-resolver.ts + .test.ts
│   │   │   ├── food-resolver.ts + .test.ts
│   │   │   ├── excel-parser.ts + .test.ts
│   │   │   ├── email-notifications.ts + .test.ts
│   │   │   ├── google-calendar.ts + .test.ts
│   │   │   ├── onboarding-templates.ts  ← plantilla 5 secciones onboarding
│   │   │   ├── sanitize.ts             ← stripHtml, sanitizeText, sanitizeName, sanitizeEmail
│   │   │   ├── rate-limit.ts           ← createRateLimiter, apiLimiter, authLimiter, uploadLimiter
│   │   │   ├── csrf.ts                 ← validateCsrf (Origin/Referer whitelist)
│   │   │   ├── logger.ts              ← structured JSON logging (info/warn/error/security)
│   │   │   ├── file-validation.ts      ← validateImageMagicBytes, validateExcelMagicBytes
│   │   │   └── url-validation.ts       ← isAllowedVideoUrl, sanitizeVideoUrl (SSRF prevention)
│   │   ├── hooks/useChat.ts
│   │   ├── middleware.ts
│   │   └── vitest.config.ts
│   └── mobile/
│       ├── App.tsx                              ← AuthProvider + NavigationContainer
│       ├── index.ts                             ← registerWidgetTaskHandler
│       ├── src/
│       │   ├── theme.ts                         ← re-exporta @fitos/theme + shadows local
│       │   ├── contexts/AuthContext.tsx
│       │   ├── lib/supabase.ts + widget-data.ts + widget-sync.ts
│       │   ├── screens/
│       │   │   ├── LoginScreen.tsx + OnboardingScreen.tsx
│       │   │   ├── DashboardScreen.tsx + CaloriesScreen.tsx
│       │   │   ├── RoutineScreen.tsx + MealsScreen.tsx
│       │   │   ├── ProgressScreen.tsx + ChatScreen.tsx
│       │   │   ├── HealthScreen.tsx + AppointmentsScreen.tsx + TicketsScreen.tsx + KnowledgeScreen.tsx
│       │   └── widgets/
│       │       ├── TodayWorkoutWidget.tsx       ← Android JSX (sin hooks)
│       │       └── widget-task-handler.tsx
│       ├── metro.config.js                      ← watchFolders apunta a ../../packages
│       └── tsconfig.json                        ← paths: @fitos/theme
└── supabase/
    ├── functions/
    │   ├── _shared/auth.ts             ← authenticateRequest, validateBodySize, sanitizeForPrompt
    │   ├── analyze-food-image/         ← Claude Vision: imagen → macros
    │   ├── analyze-onboarding-form/    ← Claude: respuestas → informe
    │   ├── generate-gym-routine/       ← Claude: objetivo → rutina
    │   └── generate-meal-plan/         ← Claude: datos → plan nutricional
    └── migrations/
        ├── 001–028 (schema base, auth, ejercicios, alimentos, Excel import)
        ├── 029_chat_messages.sql
        ├── 030_appointments.sql
        ├── 031_health_logs.sql
        ├── 032_routine_templates.sql
        ├── 033_saved_menu_templates.sql
        ├── 034_communities.sql
        ├── 035_community_read_status.sql
        ├── 036_add_gender_to_profiles.sql
        ├── 037_exercise_metrics.sql
        ├── 038_support_tickets.sql
        ├── 039_knowledge_articles.sql
        ├── 040_security_hardening.sql
        ├── 041_security_hardening_phase2.sql
        ├── 042_ticket_replies_trainer_client_ids.sql
        ├── 043_rls_trainer_clients_hardening.sql
        └── 044_prevent_admin_signup.sql
```

---

## Estado y blockers

| Feature | Estado | Notas |
|---------|--------|-------|
| Fase 0 — estructura base, auth, 19 tablas | ✅ Completo | |
| Fase 1 — dashboards, IA base | ✅ Casi completo | Google Calendar pendiente OAuth |
| Fase 2 — Chat + Citas | ✅ Web+mobile completo | Google Calendar + Resend pendiente config |
| Fase 3 — Widgets iOS/Android | ✅ Completo | iOS requiere Xcode manual |
| Fase 4 — Sistema lesiones | ✅ Completo | |
| Fase 5 — Plantillas rutina | ✅ Completo | |
| Fase 6 — Planificador menú | ✅ Completo | |
| Fase 7 — Comunidad Premium | ✅ Completo | |
| Code Quality + Permisos | ✅ Completo | Patrón C, fragmentación, RLS auditado |
| `@fitos/theme` | ✅ Completo | paquete compartido, Metro watchFolders |
| Mapa anatómico con imágenes reales | ✅ Completo | Migración 036 aplicada |
| Fase 8 — Métricas ejercicio (SFR + Stress Index + Charts) | ✅ Completo | Migración 037 aplicada |
| Fase 9 — Consultas/Tickets | ✅ Completo | Migración 038 aplicada + política `trainer_replies_update_read` |
| Fase 10 — Base de Conocimiento / FAQ | ✅ Completo | Migración 039 pendiente aplicar |
| Auditoría Seguridad OWASP (Fase 1+2) | ✅ Completo | Migraciones 040+041. 16+15 vulns corregidas. Enterprise security |
| Panel Admin | ✅ Completo | Dashboard, usuarios CRUD, promo codes, tickets, analytics, audit, settings |
| Gamificación | ❌ Sin UI | Tablas existen, falta interfaz |
| Stripe + suscripciones | ❌ Sin implementar | |
| Push notifications | ❌ Sin implementar | |

### Configuración pendiente para desbloquear features

| Config | Prioridad | Qué desbloquea |
|--------|-----------|----------------|
| Ejecutar migración 039_knowledge_articles.sql | 🔴 Alta | Base de Conocimiento / FAQ (tabla + funciones + RLS + storage) |
| ~~Ejecutar migración 040_security_hardening.sql~~ | ✅ Aplicada | RLS endurecido, CHECK constraints, trigger anti-escalation, storage policies, atomic promo increment |
| Ejecutar migración 041_security_hardening_phase2.sql | 🔴 Alta | Storage SELECT restrictivos, tabla audit_logs, función log_audit_event() |
| Ejecutar migración 042_ticket_replies_trainer_client_ids.sql | 🔴 Alta | Columnas trainer_id + client_id en ticket_replies para Realtime filters |
| Ejecutar migración 043_rls_trainer_clients_hardening.sql | 🔴 Alta | RLS trainer_clients en 6 tablas core, log_audit_event hardened, storage buckets private, promo revoke |
| Ejecutar migración 044_prevent_admin_signup.sql | 🔴 Alta | CHECK constraint profiles.role, RLS RESTRICTIVE anti-admin signup en profiles |
| Ejecutar política RLS `trainer_replies_update_read` | 🔴 Alta | Trainer pueda marcar replies de clientes como leídas |
| `ANTHROPIC_API_KEY` en Supabase secrets | 🟠 Alta | Edge Functions IA (ahora mock) |
| Verificar dominio en Resend + `RESEND_API_KEY` | 🟠 Alta | Emails confirmación citas |
| OAuth 2.0 Google Calendar | 🟠 Alta | Sync citas → Google Calendar |
| Seed ejercicios + alimentos globales | 🟡 Media | Biblioteca inicial |

---

## Flujos de autenticación

### Registro Trainer (wizard 3 pasos)
1. `/register` → seleccionar "Soy Entrenador"
2. Nombre, email, password → `supabase.auth.signUp({ options: { data: { role: "trainer" } } })`
3. Trigger DB crea `profiles` + `user_roles`
4. Redirect → `/onboarding/trainer`:
   - Step 1: nombre negocio, especialidad, bio → upsert `profiles`
   - Step 2: crear formulario onboarding → `onboarding_forms`
   - Step 3: generar código promo → `trainer_promo_codes`
5. Set `user_metadata.onboarding_completed = true`

### Registro Cliente (wizard 2 pasos + código promo)
1. `/register` → seleccionar "Soy Cliente"
2. Introducir código promo del trainer (validación en tiempo real)
3. Registro → crea `profiles`, `user_roles`, `trainer_clients`
4. Redirect → `/onboarding/client`:
   - Step 1: rellenar formulario del trainer (`onboarding_responses`)
   - Step 2: datos biométricos (weight, height, goal) → `body_metrics`
5. Set `user_metadata.onboarding_completed = true`

### Protección de rutas (middleware)
- Sin sesión → `/login`
- Sesión + onboarding incompleto → `/onboarding/[role]`
- Sesión + rol incorrecto → dashboard del rol correcto
- `onboarding_completed` se lee de `user_metadata` (sin query DB)

---

## Edge Functions

4 funciones Deno en `supabase/functions/`. Todas requieren `ANTHROPIC_API_KEY` en Supabase secrets. Sin la key devuelven respuesta mock.

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `analyze-food-image` | POST | Imagen base64 → Claude Vision → alimentos + macros estimados |
| `generate-meal-plan` | POST | Datos cliente → Claude genera plan semanal JSON |
| `generate-gym-routine` | POST | Objetivo/nivel/días → Claude genera rutina + progresión |
| `analyze-onboarding-form` | POST | `response_id` → Claude analiza respuestas → informe |

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
supabase functions deploy analyze-food-image
supabase functions deploy generate-meal-plan
supabase functions deploy generate-gym-routine
supabase functions deploy analyze-onboarding-form
```

---

## Activar integraciones pendientes

### Google Calendar OAuth

1. Crear credenciales en Google Cloud Console (tipo: Web application)
   - Authorized origins: `https://tu-dominio.com`, `http://localhost:3000`
   - Redirect URIs: `https://tu-dominio.com/api/auth/google/callback`, `http://localhost:3000/api/auth/google/callback`
2. Añadir a `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback
   ```
3. Todo el código está listo en `lib/google-calendar.ts` — funciones: `getGoogleAuthUrl`, `exchangeCodeForTokens`, `syncAppointmentToCalendar`, etc.
4. Tokens se guardan en `profiles.google_calendar_tokens` (JSONB)

### Resend Email

1. Verificar dominio en resend.com (añadir registros DNS)
2. `cd apps/web && npm install resend --legacy-peer-deps`
3. Añadir a `.env.local` y Vercel: `RESEND_API_KEY=re_xxx` + `RESEND_FROM_EMAIL=citas@tu-dominio.com`
4. Descomentar bloque `TODO` en `lib/email-notifications.ts` (función `sendAppointmentEmail`)

---

## Gotchas — errores documentados

| # | Área | Error cometido | Regla resultante |
|---|------|---------------|-----------------|
| 1 | DB | Asumir FK entre trainer_clients y profiles | Dos queries separadas — ambas referencian auth.users independientemente |
| 2 | DB | Query a tabla trainer_profiles inexistente | Verificar esquema en especificaciones.md antes de escribir |
| 3 | Web | react-beautiful-dnd con React 19 | Usar @dnd-kit/core — react-beautiful-dnd usa APIs internas eliminadas |
| 4 | DB | Asumir arrays DB nunca son null | Usar `?? []` al iterar, `?.length ?? 0` al comprobar longitud |
| 5 | DB | Nombres inventados en body_metrics | Columnas reales: body_weight_kg, hips_cm, right_arm_cm, right_thigh_cm |
| 6 | DB | Ordenar trainer_clients por created_at | Columna es `joined_at`, no `created_at` |
| 7 | DB | Guardar altura/peso como height_cm/weight_kg | Columnas en profiles son `height` y `weight` (sin sufijo) |
| 8 | DB | Upsert a profiles sin incluir role | `profiles.role` es NOT NULL — siempre incluir en upserts |
| 9 | DB | Insert en onboarding_responses | Usar `upsert` con `onConflict: "form_id,client_id"` |
| 10 | DB | Columna content de meal_plans | Los datos están en columna `days` (JSONB) |
| 11 | Web | Renderizar JSONB directamente en React | Usar `JSON.stringify()` o acceder a propiedades específicas |
| 12 | DB | Insert a meal_plans con user_id y name | Usar FK `client_id` y columna `title`; `target_kcal` es NOT NULL |
| 13 | API | Insertar en trainer_clients desde frontend | RLS bloquea — usar API route con service_role |
| 14 | DB | Múltiples nombres de columna incorrectos | Verificar especificaciones.md antes de escribir — nombres son específicos |
| 15 | Web | Duplicar editor de formulario | Editor solo en `/trainer/forms` — Settings es read-only |
| 16 | DB | Insert a body_metrics sin recorded_at | `recorded_at` es TIMESTAMPTZ NOT NULL — siempre `new Date().toISOString()` |
| 17 | DB | Goal con espacios/mayúsculas | Solo acepta: hipertrofia, fuerza, perdida_peso, mantenimiento |
| 18 | DB | Usar `.update()` en profiles en onboarding | Usar `upsert` con `onConflict: "user_id"` + incluir `role` |
| 19 | Auth | Onboarding no dispara tras login | Usar `user_metadata.onboarding_completed` en middleware |
| 20 | Mobile | Error cosmético de expo install | Error cosmético — verificar package.json directamente |
| 21 | DB | Usar moddatetime() en triggers | No disponible — usar función custom `set_updated_at()` |
| 22 | API | Registration view no crea workout_sessions | Crear sesión primero, pasar `session_id` a weight_log |
| 23 | Web | Rest timer múltiples intervals | Depender de valores estables (phase/mode), no expresiones ternarias |
| 24 | Mobile | Elapsed timer no limpia al desmontar | Añadir `clearInterval()` en return cleanup del useEffect |
| 25 | DB | Columna days de user_routines | No existe — ejercicios están en columna `exercises` (JSONB) |
| 26 | API | Import Excel no verifica rol trainer | Consultar `profiles.role`, no `user_roles` |
| 27 | DB | Insertar ejercicios desde frontend | RLS bloquea silenciosamente — usar API route con service_role |
| 28 | DB | CHECK constraint violation en category | `trainer_exercise_library.category` es TEXT libre (sin CHECK) |
| 29 | DB | Update ejercicio global se pierde | Clone-on-edit: clonar como privado + ocultar original via `hidden = true` |
| 30 | Web | Sets completados se pierden al salir | Llamar `savePartialProgress()` en cada check — no solo en estado local |
| 31 | Web | Botones "Registrar" visibles tras completar | Consultar workout_sessions completadas — bloquear por (rutina + día + semana) |
| 32 | API | Import Excel "link" oculta globales | Link con nombre diferente = privado; nombre igual = no hacer nada |
| 33 | API | `supabaseKey is required` en Vercel | Cliente Supabase a nivel módulo — mover dentro del handler POST |
| 34 | Web | Build crash con prerendering + useSearchParams | Envolver en `<Suspense>` — `export const dynamic = "force-dynamic"` no funciona |
| 35 | Web | Mensajes chat no aparecen tras enviar | Optimistic updates para propios mensajes — no depender de Realtime |
| 36 | Web | Optimistic desaparece si INSERT falla | Mantener con `id: err-{timestamp}` — nunca eliminar |
| 37 | Web | Cliente recarga para ver propios mensajes | No encadenar `.insert().select().single()` — dos pasos separados |
| 38 | Web | Tab bar rota con 6ª pestaña | Usar `flex-1 px-2` en tabs — no `shrink-0` |
| 39 | API | Resolver no filtra hidden=true | Comprobar `override?.hidden` antes de incluir ejercicio |
| 40 | API | Map<string, any> oculta campo hidden | Definir interface tipada — nunca `any` para datos DB |
| 41 | API | Endpoints temporales activos | Eliminar endpoints temporales — SQL directo en Supabase |
| 42 | API | complete-registration sin auth | Verificar auth con createClient de supabase-server (Patrón C) |
| 43 | API | `\|\|` en lugar de `??` en override merges | Usar `??` — permite cadenas vacías y valores falsy |
| 44 | API | food-resolver con any[] | Definir interfaces TrainerFoodOverride — nunca `any` |
| 45 | API | import/reconcile accesible por clientes | Verificar rol trainer — no solo autenticación |
| 46 | API | Cliente Anthropic a nivel módulo | Mover `new Anthropic(...)` dentro del handler POST |
| 47 | Web | appointments/page.tsx con 1187 líneas | Fragmentar durante creación — nunca crear >300 líneas monolíticas |
| 48 | Test | Tests no creados junto al código | Crear .test.ts en misma sesión — happy path + edge case + error |
| 49 | Review | Code review lista issues ya corregidos | Leer el código primero — verificar antes de crear tickets |
| 50 | API | handleSave no serializa weekly_config | Verificar que handleSave incluye mode/weekly_config/total_weeks |
| 51 | Web | Peso pre-rellenado como valor | Mostrar como placeholder (gris) — inputs siempre vacíos |
| 52 | API | detectedColumns pierde campo type | Incluir ambos: `type: col.type` e `inferred_type: col.type` |
| 53 | Web | buildEmptyDays() crashea | Actualizar TODAS las llamadas en reducer — no solo definiciones |
| 54 | Web | `<select>` nativo blanco en Chrome | Usar siempre el componente `DarkSelect` |
| 55 | Build | active/utils.ts no existía al importar | Crear archivos destino en mismo commit que imports |
| 56 | Build | trainer/types.ts no existía al re-exportar | Crear archivos centralizados ANTES de añadir re-exports |
| 57 | Web | pnpm install falla en raíz | packageManager activo es npm — usar `npm install` |
| 58 | Build | sync-css.ts genera doble indentación | No añadir espacios al prefijo — `before` ya incluye indentación |
| 59 | Web+Mobile | SFR data no se guardaba en DB | `confirmSfr` comprobaba `savedExercises.includes(exIdx)` que ya era true tras `completeSet`. Eliminar el guard — siempre re-guardar en `confirmSfr` |
| 60 | DB | Sesión huérfana `in_progress` tras completar | Si `finalizeSession` falla, la sesión queda en `in_progress` y el cliente ve "Completar rutina en curso" para siempre. Fix: marcar como `abandoned` vía SQL. Prevención: `finalizeSession` retorna boolean, botón "Reintentar" |
| 61 | Mobile | SetEntry sin campo `rpe` tras añadirlo al tipo | Al añadir un campo a `SetEntry`, actualizar TODAS las creaciones de objetos SetEntry (initSets, resumeSession map, resumeSession padding, resumeSession else). Hay 4+ puntos de creación |
| 62 | Web+Mobile | RPE per-exercise no coincidía con configuración per-set del trainer | El trainer configura RPE por serie (en `target_rpe`), pero el UI mostraba un solo input por ejercicio. Cambiado a columna RPE condicional por serie — `exercise_rpe` en DB es ahora la media de los RPE por serie |
| 63 | Web | `rest_pause_sets` campo legacy no sincronizado con `sets_config` | `rest_pause_sets` era un número independiente. Ahora se calcula automáticamente del count de `set_type !== "normal"` en `sets_config`. El campo `sets` ya incluye todas las series (normales + derivadas) |
| 64 | Web | `totalSets` sumaba `sets + rest_pause_sets` duplicando count | En modo "different", `sets` ya incluye derivadas tras `CR_ADD_DERIVATIVE_SET`. Cambiado a solo `sum(ex.sets)` |
| 65 | Web+Mobile | `weekly_config.sets_detail` ignorado en modo "equal" | El código cliente solo leía `sets_detail` cuando `mode === "different"`. Ahora verifica `wk?.sets_detail?.length > 0` independientemente del modo. Afecta: `initializeSets`, `resumeFromSession`, `getTrainerConfig`, `ExerciseCard` pre-training, mobile `initSets`/`resumeSession` |
| 66 | RLS | `trainer_replies_all` WITH CHECK bloquea UPDATE de `read_at` en replies de clientes | La política `FOR ALL` tenía `sender_id = auth.uid()` en WITH CHECK. Cuando el trainer actualiza `read_at` en una reply del cliente, `sender_id` ≠ trainer → UPDATE rechazado silenciosamente. Fix: política `trainer_replies_update_read` separada sin check de `sender_id`. Regla: en políticas FOR ALL, verificar que WITH CHECK no bloquee UPDATEs legítimos sobre filas de otros usuarios |
| 67 | RLS | Trainer policy sin validar trainer_clients — acceso cross-trainer | Políticas de `appointments`, `health_logs`, `workout_sessions` solo verificaban `trainer_id = auth.uid()` sin comprobar que el trainer gestione al cliente. Un trainer podía acceder a datos de clientes de otros trainers. Fix: migración 040 añade `EXISTS (SELECT 1 FROM trainer_clients ...)` a todas las políticas trainer. Regla 141 |
| 68 | API | `/api/validate-promo` sin autenticación — enumeración de códigos | Endpoint accesible sin sesión. Permitía brute-force de códigos promo y exposición de trainer_id/nombre. Fix: añadido `supabase.auth.getUser()` al inicio. Regla 142 |
| 69 | API | `complete-registration` no valida propiedad del promo code | Aceptaba cualquier combo trainer_id + promo_code_id sin verificar que el código pertenezca al trainer. Fix: query de validación `.eq("trainer_id", trainer_id)` antes de INSERT. Regla 143 |
| 70 | API | Race condition en incremento de current_uses del promo code | Read-then-update no atómico: 10 registros concurrentes podían leer current_uses=4 y todos incrementar a 5. Fix: función `increment_promo_code_usage()` SECURITY DEFINER con UPDATE atómico. Regla 144 |
| 71 | API | Open redirect en OAuth Google callback via parámetro `state` | `state` del URL se usaba directamente en `NextResponse.redirect()`. Un atacante podía redirigir a sitio externo tras OAuth. Fix: whitelist de URLs permitidas. Regla 145 |
| 72 | Auth | Role escalation via `supabase.auth.updateUser({ data: { role: "trainer" } })` | El middleware confiaba en `user_metadata.role` del JWT. Un cliente podía intentar cambiar su rol. Fix: trigger `prevent_role_change()` en `auth.users` que revierte cambios de rol. Regla 146 |
| 73 | DB | `weight_log.stress_index` sin CHECK constraint — valor 999999 aceptado | Columna NUMERIC sin límites permitía valores arbitrarios que corrompían gráficas del trainer. Fix: CHECK `>= 0 AND <= 50000` en migración 040 + validación client-side con `clampPositive()`. Regla 147/148 |
| 74 | Storage | Buckets de imágenes sin restricción de carpeta | Cualquier usuario autenticado podía subir a cualquier carpeta en community-images/ticket-images/knowledge-images. Fix: política `(storage.foldername(name))[1] = auth.uid()::text`. Regla 149 |
| 75 | DB | SECURITY DEFINER sin SET search_path | `increment_article_view()` corría con privilegios elevados sin fijar search_path. Vulnerable a search_path hijacking. Fix: añadido `SET search_path = public`. Regla 150 |
| 76 | Deps | `xlsx` (SheetJS) abandonado con 2 CVEs sin fix | Prototype Pollution + ReDoS. Migrado a `exceljs`. `parseExcelBuffer()` ahora es async. Tests usan `wb.xlsx.writeBuffer()` en vez de `XLSX.write()`. Regla 151 |
| 77 | Headers | Sin security headers en producción | `next.config.ts` estaba vacío. Sin CSP, X-Frame-Options, HSTS. Fix: security headers en `async headers()`. Regla 153 |
| 78 | API | Sin rate limiting — brute force posible | Cualquier endpoint bombardeable sin límite. Fix: `lib/rate-limit.ts` con limiters pre-configurados. Regla 154 |
| 79 | PII | Email del cliente enviado innecesariamente al frontend | 4 queries de trainer incluían `email` sin necesidad. Fix: eliminado de `.select()`. Regla 157 |
| 80 | API | `select("*")` en client-trainer route | Enviaba todas las columnas de `trainer_clients` al frontend. Fix: `select("trainer_id, client_id, status")`. Regla 157 |
| 81 | API | `import_id` no validado con service_role | `create-exercises` actualizaba `excel_imports` sin verificar ownership. service_role bypasea RLS. Fix: query de ownership antes de update. Regla 161 |
| 82 | UX | `session_id` inválido en URL falla silenciosamente | Si RLS bloquea la query, el usuario no ve error. Fix: toast.error() cuando session_id no resuelve. Regla 163 |
| 83 | Storage | SELECT policies de buckets demasiado permisivas | Cualquier usuario autenticado podía descargar cualquier imagen. Fix: validar ownership o trainer_clients relationship en SELECT. Migración 041 |
| 84 | Realtime | Subscriptions sin filtro — broadcast global | `TrainerSidebar` escuchaba TODOS los mensajes/tickets/posts sin filtro. `trainer/chat` escuchaba TODOS los mensajes. Cualquier usuario autenticado recibía datos de otros trainers/clientes en tiempo real. Fix: añadir `filter` a todas las suscripciones scoped al usuario. Regla 164 |
| 85 | Edge | `analyze-food-image` sin autenticación | CERO verificación JWT. Cualquiera con la URL consumía créditos de Anthropic sin autenticarse. Fix: `authenticateRequest(req)` con `_shared/auth.ts`. Regla 165 |
| 86 | Edge | Edge Functions sin body size limit | Payload de 50MB aceptado sin límite. Podía causar OOM en Deno. Fix: `validateBodySize(req, maxBytes)`. Regla 166 |
| 87 | Edge | Prompt injection via inputs del usuario | `meal_type`, `goal`, `equipment`, respuestas de onboarding interpoladas directamente en prompts de Claude. Fix: `sanitizeForPrompt()`. Regla 167 |
| 88 | XSS | Video URL XSS via `javascript:` protocol | `video_url` de knowledge_articles se renderizaba como `<a href>` sin validar. Un trainer podía guardar `javascript:alert(1)`. Fix: `isAllowedVideoUrl()` antes de renderizar. Regla 170 |
| 89 | API | Registro client sin promo code bypass | `complete-registration` aceptaba `role: "client"` con `trainer_id: null` y devolvía success. Fix: rechazar si falta trainer_id o promo_code_id. Regla 171 |
| 90 | API | Email spoofing via request body | `complete-registration` usaba `email` del body para actualizar profiles. Un atacante podía guardar el email de otra persona. Fix: usar `authUser.user.email`. Regla 172 |
| 91 | Upload | SVG XSS via extensión no validada | Uploads de comunidad aceptaban cualquier extensión. Un `.svg` con `onload="alert(1)"` es JavaScript ejecutable. Fix: whitelist `jpg,png,webp,gif`. Regla 173 |
| 92 | CSRF | `startsWith` permite subdomain bypass | `origin.startsWith("http://localhost:3000")` también acepta `http://localhost:3000.evil.com`. Fix: `new URL().origin` strict equality. Regla 175 |
| 93 | CSRF | CSRF faltaba en 5 API routes | `complete-registration`, `activate-client`, `import/excel`, `import/create-exercises`, `import/reconcile` no tenían CSRF check. Fix: `validateCsrf()` en todas. Regla 174 |
| 94 | API | `file.name` sin sanitizar en DB | Filename del Excel se guardaba directamente. XSS almacenado si se muestra en UI. Fix: `sanitizeName(file.name)`. Regla 176 |
| 95 | Logs | `console.error` con datos sensibles | Role mismatches, error.message de Supabase con nombres de tabla logueados en producción. Fix: loguear solo contexto mínimo. Regla 177 |
| 96 | API | `complete-registration` no verificaba sesión del caller | Usaba `admin.getUserById(body.client_id)` — cualquiera con un UUID válido podía completar un registro. Fix: verificar sesión via `createServerClient().auth.getUser()` + `caller.id === client_id`. Regla 180 |
| 97 | API | 7 API routes sin rate limiting | `auth/google`, `auth/google/callback`, `complete-registration`, `activate-client`, `client-trainer`, `import/create-exercises`, `import/reconcile` no tenían limiter. Fix: `apiLimiter` en todas. Regla 181 |
| 98 | API | `err.message` retornado en responses (5 rutas) | `activate-client`, `client-trainer`, `import/excel`, `import/create-exercises` retornaban `error.message` del catch o de Supabase. Expone nombres de tabla. Fix: mensajes genéricos. Regla 182 |
| 99 | OAuth | Google callback no verificaba auth ni role | `exchangeCodeForTokens()` se ejecutaba antes de verificar sesión. Un usuario no autenticado o un cliente podía completar el OAuth. Fix: verificar `getUser()` + `role === "trainer"` antes de exchange. Regla 183 |
| 100 | API | `exercise_names` sin límite en reconcile | `Promise.all` sobre array ilimitado → DoS con 10k RPCs. Fix: cap a 200. Regla 184 |
| 101 | API | Nombres de ejercicios sin sanitizar en DB | `ex.name` del request body insertado directo en `trainer_exercise_library`. XSS almacenado. Fix: `sanitizeName(ex.name)`. Regla 185 |
| 102 | Edge | `sanitizeForPrompt` importado pero nunca llamado | 3 de 4 Edge Functions importaban `sanitizeForPrompt` sin usarlo. Prompt injection abierto. Fix: aplicar a todos los inputs interpolados. Regla 186 |
| 103 | Edge | Columnas `weight_kg`/`height_cm` en Edge Functions | `generate-gym-routine` y `generate-meal-plan` usaban columnas inexistentes. Los valores de peso/altura siempre eran NULL en el prompt. Fix: `weight`/`height`. Regla 187 |
| 104 | Edge | Tabla `exercises` inexistente en generate-gym-routine | La tabla real es `trainer_exercise_library`. La query no devolvía ejercicios. Fix: nombre correcto + `encodeURIComponent`. Regla 188 |
| 105 | Edge | `getUser()` duplicado tras `authenticateRequest()` | 2 funciones hacían una segunda llamada de red innecesaria. Fix: usar `user` del resultado de `authenticateRequest`. Regla 189 |
| 106 | Edge | Sin verificación IDOR en `client_id` | Un trainer podía invocar funciones IA sobre clientes de otros trainers. Fix: verificar `trainer_clients` ownership. Regla 190 |
| 107 | Edge | CORS wildcard `*` en todas las funciones | Cualquier dominio podía hacer requests. Fix: `getCorsHeaders(req)` con whitelist de origins. Regla 191 |
| 108 | Edge | `String(error)` en catch blocks | 3 funciones exponían stack traces y detalles internos. Fix: mensajes genéricos. Regla 192 |
| 109 | Sanitize | `stripHtml` single-pass bypass | `<<b>script>alert(1)</script>` → primera pasada quita `<b>` → queda `<script>`. Fix: loop `while (prev !== result)`. Regla 194 |
| 110 | CSP | `unsafe-eval` en producción | CSP incluía `'unsafe-eval'` innecesariamente en prod (Next.js solo lo necesita en dev HMR). Permite `eval()` XSS. Fix: condicional por `NODE_ENV`. Regla 195 |
| 111 | Logger | Sin redacción de PII | `logger.ts` aceptaba cualquier campo sin filtrar. `password`, `token`, `secret` podían loguearse. Fix: `redactSensitive()` con Set de keys prohibidas. Regla 196 |
| 112 | RLS | weight_log trainer policy sin trainer_clients | `auth.uid() = trainer_id` sin verificar relación activa. Trainer A accede a weight_log de clientes de Trainer B. Fix: migración 043. Regla 197 |
| 113 | RLS | user_routines trainer policy sin trainer_clients | Mismo problema que weight_log. Trainer podía gestionar rutinas de clientes ajenos. Fix: migración 043. Regla 197 |
| 114 | RLS | meal_plans trainer policy sin trainer_clients | Mismo problema. Acceso cruzado a planes nutricionales. Fix: migración 043. Regla 197 |
| 115 | RLS | messages trainer policies sin trainer_clients | 3 políticas (select/insert/update) solo verificaban `trainer_id`. Fix: migración 043. Regla 199 |
| 116 | DB | `log_audit_event()` sin validar caller | Cualquier usuario autenticado podía insertar audit logs como otro user — audit log spoofing. Fix: `p_user_id != auth.uid()` → RAISE EXCEPTION. Regla 201 |
| 117 | Storage | `ticket-images` y `knowledge-images` con `public = true` | URLs de descarga accesibles sin token. Fix: `UPDATE storage.buckets SET public = false`. Regla 202 |
| 118 | DB | `increment_promo_code_usage` callable por authenticated | Cualquier usuario podía invocar via `supabase.rpc()`. Fix: REVOKE de public y authenticated. Regla 203 |
| 119 | Perf | `getUser()` en 32 client components — ~1s extra por página | Client components usaban `getUser()` (network) cuando middleware ya verifica JWT. Fix: `getSession()` (local parse). Regla 205 |
| 120 | Perf | Queries secuenciales independientes en appointments, dashboard, meals | 2-4 `await supabase.from(...)` secuenciales que no dependen entre sí. Fix: `Promise.all()`. Regla 103 |
| 121 | Auth | `verifyAdmin()` solo verificaba JWT `user_metadata.role` — admin spoofable | Un atacante puede hacer `signUp({ data: { role: "admin" } })` para obtener JWT con rol admin. El trigger `prevent_role_change()` solo bloquea UPDATE, no INSERT. Fix: verificación doble JWT + `profiles.role` en DB via service_role. Migración 044: RLS RESTRICTIVE bloquea INSERT/UPDATE de profiles con `role = 'admin'`. Regla 232 |
