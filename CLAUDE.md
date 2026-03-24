# FitOS — Guía para Agentes

**Lee `desarrollo.md` antes de cualquier tarea.** Contiene el estado completo del proyecto, estructura de archivos, tablas de base de datos, convenciones y próximos pasos. Está escrito para ser leído de arriba abajo.

---

## Contexto rápido

**FitOS** es una plataforma SaaS para entrenadores personales. Dos roles: `trainer` y `client`. Monorepo con Next.js 15 (web) + Expo 55 (mobile) + Supabase (DB + Edge Functions).

- **Fase 0:** Completada — estructura base, auth, 19 tablas, tema visual
- **Fase 1:** En proceso de finalización (Ver `PENDIENTE_FASE_1.md`) — dashboards, IA base, Google Calendar (config. pendiente)
- **Rediseño UI:** Completado — estética premium en app completa (landing, paneles trainer/cliente con *glassmorphism*, app mobile brutalista)
- **Fase 2 (parcial, 23/03/2026):** Chat interno trainer↔cliente ✅ | Calendario de citas ✅ (migración 030 pendiente aplicar) | Google Calendar sync ⏳ (pendiente OAuth) | Emails Resend ⏳ (pendiente dominio)
- **Fase 3 (parcial, 23/03/2026):** Widget iOS y Android ✅ (ver entrenamiento del día sin abrir la app)

---

## Stack

| Capa | Tecnología |
|---|---|
| Web | Next.js 15 App Router, React 19, TypeScript |
| Estilos | Tailwind CSS 4, shadcn/ui (`nova` style, `neutral` base) |
| DB | Supabase PostgreSQL — proyecto `fitos-prod` |
| Mobile | Expo SDK 55 + React Navigation (Bottom Tabs) + expo-linear-gradient + react-native-svg |
| Edge Functions | Supabase Deno — 4 funciones IA (Claude API) |
| Monorepo | Turborepo 2.x + pnpm (raíz) / npm (apps/web) |

---

## Reglas críticas — leer siempre

1. **pnpm en raíz, npm en `apps/web`** — no mezclar. En `apps/web` siempre `--legacy-peer-deps`.
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
18. **Theme mobile extendido** — `apps/mobile/src/theme.ts` exporta `colors`, `spacing`, `radius` y `shadows`. Usar estos tokens en vez de valores hardcoded. `shadows.glow(color)` genera un glow effect.
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
38. **Import Excel: 100% match = auto-link sin opciones** — Si `confidence === 1`, el ejercicio se enlaza automáticamente sin mostrar botones "Crear nuevo" / "Omitir" ni matches alternativos. Solo muestra badge "Match 100%" y el nombre enlazado.
39. **No crear endpoints temporales** — Nunca crear API routes "temporales" para fixes de DB. El usuario ejecuta los SQLs directamente en Supabase.
40. **Clientes Supabase en API routes siempre dentro del handler** — Nunca inicializar `createClient()` a nivel de módulo en API routes (`const x = createClient(...)` fuera de funciones). Vercel evalúa los módulos durante el build y las env vars no están disponibles → crash `supabaseKey is required`. Siempre inicializar dentro de la función `POST`/`GET`/etc.
41. **`useSearchParams` en "use client" requiere `<Suspense>`** — En Next.js 15, cualquier componente que use `useSearchParams()` debe estar envuelto en `<Suspense>` en el `export default`. Patrón obligatorio: función interna con la lógica + export default wrapper con `<Suspense fallback={...}>`. `export const dynamic = "force-dynamic"` NO soluciona el error de prerender en client components.
35. **Ejercicios sin category/difficulty obligatorios** — `category` es TEXT nullable (sin CHECK constraint). No hay columna `difficulty` ni `equipment` en `trainer_exercise_library`.
36. **`weight_log` se guarda en cada check (set)** — Cada vez que el cliente marca una serie como completada en entrenamiento activo, se hace upsert inmediato a `weight_log` con `savePartialProgress()`. El campo `sets_data` incluye `completed: boolean` por set. Esto permite que al resumir una sesión se restauren incluso ejercicios parcialmente completados.
37. **No repetir sesión ya completada** — La página de rutina (web y mobile) carga todas las `workout_sessions` con `status: "completed"` para la rutina actual. Compara por `day_label::week_number` (no por fecha). Si la combinación día+semana ya fue completada, muestra badge "Sesión completada" en lugar de los botones de entrenamiento. Esto permite hacer dos sesiones distintas el mismo día (ej. Pierna + Espalda) pero impide repetir la misma.
42. **Tabla `messages` para chat** — `trainer_id` + `client_id` identifican la conversación (par único). `sender_id` indica quién envió. RLS doble: el trainer accede por `trainer_id`, el cliente por `client_id`. Realtime habilitado (`supabase_realtime`). Web trainer: tab "Chat" en `/app/trainer/clients/[id]`. Web cliente: `/app/client/chat`. Mobile: `ChatScreen.tsx` en tab "Chat". Marcar como leído actualizando `read_at` al entrar a la conversación.
43. **Tabla `appointments` para citas** — Migración 030. Campos clave: `trainer_id`, `client_id`, `session_type` (presencial/online/telefonica/evaluacion/seguimiento), `starts_at`, `ends_at`, `status` (pending/confirmed/cancelled/completed), `google_event_id` (NULL hasta OAuth), `email_sent_at` (NULL hasta Resend). RLS: trainer acceso total; cliente puede SELECT, INSERT (solo status='pending'), UPDATE (solo a 'cancelled'). Web trainer: `/app/trainer/appointments`. Web cliente: `/app/client/appointments`. Mobile: `AppointmentsScreen.tsx` en tab "Citas".
44. **Calendario de citas — PENDIENTE DE DESARROLLO** — `lib/google-calendar.ts` tiene la función `syncAppointmentToCalendar()` lista pero requiere OAuth 2.0 configurado (NEXT_PUBLIC_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET). `lib/email-notifications.ts` tiene `sendAppointmentEmail()` con template HTML lista pero requiere dominio verificado en Resend + RESEND_API_KEY. Cuando ambos estén configurados: (1) instalar `resend` en apps/web, (2) descomentar el bloque TODO en `sendAppointmentEmail()`, (3) añadir RESEND_API_KEY y RESEND_FROM_EMAIL a .env.local y Vercel, (4) configurar OAuth en Google Cloud Console, (5) guardar tokens en Supabase Vault.
45. **Widget Android — `react-native-android-widget`** — Paquete instalado en `apps/mobile`. Widget `TodayWorkout` configurado en `app.json` (plugin). Componente JSX en `src/widgets/TodayWorkoutWidget.tsx` usa primitivas `FlexWidget`, `TextWidget`, `ListWidget`. Task handler en `src/widgets/widget-task-handler.tsx`. Se registra en `index.ts` con `registerWidgetTaskHandler()`. Actualización cada 30 min (`updatePeriodMillis: 1800000`). Tamaño: 4×3 celdas, redimensionable.
46. **Widget iOS — WidgetKit (SwiftUI)** — Plugin `plugins/withIOSWidget.js` genera los archivos Swift en `ios/TodayWorkoutWidget/` durante `expo prebuild`. Lee datos de App Group `group.com.antigravity.fitos.widget` (UserDefaults). Para completar la integración iOS: (1) `expo prebuild`, (2) abrir Xcode, (3) añadir target Widget Extension manualmente, (4) copiar el Swift generado, (5) configurar App Group en ambos targets. Soporta `.systemSmall`, `.systemMedium`, `.systemLarge`.
47. **Widget data sync** — `src/lib/widget-data.ts` consulta `user_routines` + `workout_sessions` y escribe JSON a AsyncStorage (`@fitos/widget-today-workout`). `src/lib/widget-sync.ts` expone `updateWidget(userId)` que sincroniza datos y llama a `requestWidgetUpdate()` en Android. Se invoca en `DashboardScreen` (al cargar) y `RoutineScreen` (al completar sesión en ambos modos).
48. **Bundle identifiers configurados** — `app.json` tiene `ios.bundleIdentifier: "com.antigravity.fitos"` y `android.package: "com.antigravity.fitos"`. Necesarios para widgets y builds nativos.
49. **Widget no usa hooks** — Los componentes de widget Android (`TodayWorkoutWidget.tsx`) reciben datos vía props, NO pueden usar `useState`, `useEffect` ni ningún hook de React. Son funciones puras que retornan primitivas de `react-native-android-widget`.

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
```

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
Patrón de card: `rounded-2xl border border-white/[0.06] bg-[#12121A]`
Botón primario: `bg-[#00E5FF] text-[#0A0A0F] rounded-xl font-semibold`

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

---

## Regla de mantenimiento — obligatoria

**Al terminar cualquier desarrollo, bugfix o cambio significativo, actualiza `CLAUDE.md` y `desarrollo.md` antes de cerrar la sesión.**

Qué actualizar en cada archivo:
- **`CLAUDE.md`**: añadir nuevas reglas críticas que hayan surgido, corregir las que ya no apliquen, actualizar el estado de fases completadas.
- **`desarrollo.md`**: reflejar los archivos nuevos o modificados en la estructura de rutas, actualizar próximos pasos, y — **obligatorio** — documentar cualquier error que haya ocurrido en la sección "Errores conocidos y cómo evitarlos" con el formato: archivo afectado, qué pasó, solución aplicada, regla a seguir.

**Documentar errores no es opcional.** Un error no documentado es un error que se repetirá. Cualquier crash, query incorrecta, incompatibilidad de librería o comportamiento inesperado de la DB debe quedar registrado para que no vuelva a ocurrir.

**Paridad web ↔ mobile es obligatoria.** Cualquier funcionalidad nueva o corrección de error debe aplicarse en web (`apps/web`) Y en mobile (`apps/mobile`). Al recibir un bug report o una petición de feature, revisar si aplica a ambas plataformas y actuar en consecuencia.

El objetivo es que cualquier persona o agente que llegue al proyecto pueda continuar desde cero sin preguntar nada y sin repetir los mismos errores.

---

## Para más detalle

- **Estado completo y notas:** `desarrollo.md`
- **Especificaciones del producto:** `especificaciones.md` (especialmente Cap. 3 arquitectura y Cap. 4 base de datos)
