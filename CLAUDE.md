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
- **Fase 4 (parcial, 26/03/2026):** Sistema de lesiones/molestias ✅ — mapa anatómico SVG interactivo, reportes coach/client, Realtime sync
- **Fase 5 (parcial, 26/03/2026):** Plantillas de rutina ✅ — guardar/cargar configuraciones de ejercicios reutilizables por trainer
- **Fase 6 (parcial, 28/03/2026):** Rediseño planificador de menú ✅ — selección de días con fechas reales, semanas de mesociclo, % macros, panel flotante de info nutricional en tiempo real
- **Fase 6 ampliada (29/03/2026):** Menús guardados ✅ — guardar/cargar configuraciones de menú reutilizables (tabla `saved_menu_templates`, migración 033). Navegación semanal mejorada ✅ — botones semana anterior/siguiente en la parte inferior del planificador. DarkSelect ✅ — todos los `<select>` nativos reemplazados por componente custom dark.
- **Fase 7 (29/03/2026):** Comunidad Premium ✅ — Feed privado por trainer con posts (título+texto+imagen), comentarios, likes, posts fijados. Dos modos: OPEN (clientes publican) y READ_ONLY_CLIENTS (solo coach). Badge verificado violeta para el coach. Storage bucket para imágenes. Realtime. Badge de no leídos en sidebar. Web trainer + web cliente.

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

53. **Error handling obligatorio en TODA query Supabase (Patrón C)** — Toda query a Supabase DEBE destructurar `error`, loguearlo y dar feedback al usuario. No hay excepciones. Los tres patrones están prohibidos excepto el C:
    - ❌ **Patrón A (prohibido):** `const { data } = await supabase.from(...)` — sin destructurar error.
    - ❌ **Patrón B (prohibido):** destructura error + solo `console.error` — el usuario no sabe qué pasó.
    - ✅ **Patrón C (obligatorio) — Componentes cliente:**
      ```ts
      const { data, error } = await supabase.from("tabla").select("...");
      if (error) {
        toast.error("Mensaje descriptivo en español para el usuario");
        console.error("[NombreComponente] Contexto del error:", error);
        return; // o setSaving(false) + return según contexto
      }
      ```
    - ✅ **Patrón C (obligatorio) — API routes:**
      ```ts
      const { data, error } = await supabase.from("tabla").select("...");
      if (error) {
        console.error("[nombre-route] Contexto:", error);
        return NextResponse.json({ error: "Mensaje descriptivo" }, { status: 500 });
      }
      ```
    - **Queries no bloqueantes** (ej: desactivar rutinas anteriores, cargar perfiles para display): si el error no debe detener el flujo, igualmente destructurar y loguear con `console.error`, pero no hacer `return` — añadir comentario `// No bloqueante`.

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
64. **RIR editable por serie en entrenamiento activo (web + mobile)** — `SetEntry` incluye campo `rir: string`. Se muestra como columna adicional en la tabla de series (entre Reps y el botón ✓). El valor se guarda en `weight_log.sets_data[].rir`. Grid de 5 columnas: Serie | Peso | Reps | RIR | ✓. Se eliminó la visualización estática de RIR del header del ejercicio.
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

66. **Tabla `health_logs` para lesiones/molestias** — Migración 031. Campos clave: `client_id`, `trainer_id`, `reported_by` ('coach'|'client'), `muscle_id` (ej. 'quadriceps_left'), `pain_score` (1-10), `incident_type` ('puntual'|'diagnosticada'|'cronica'), `status` ('active'|'recovering'|'recovered'), `notes`. RLS: trainer acceso total, cliente SELECT + INSERT (reported_by='client') + UPDATE propios. Realtime habilitado.
67. **Mapa anatómico SVG interactivo** — Componente compartido `components/health/AnatomyMap.tsx` (web) con vista frontal (17 regiones) y posterior (15 regiones). Código de colores: gris=sin molestias, naranja=leve (1-5), rojo=grave (6-10). Mobile: SVG equivalente con `react-native-svg` en `HealthScreen.tsx`. Web trainer: tab "Salud" en detalle de cliente (`TabSalud.tsx`). Web cliente: `/app/client/health`. Mobile: tab "Salud" en bottom nav (8 tabs).
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
89. **Tab "Publicar" separado y condicional** — La creación de publicaciones está en su propio tab tanto en trainer como en cliente. En el trainer siempre se muestra (3 tabs: Feed, Publicar, Ajustes). En el cliente, el tab "Publicar" solo aparece si `community.mode === 'OPEN'`; si es `READ_ONLY_CLIENTS` solo se muestra el tab "Feed" (sin barra de tabs). `CommunityTab` type incluye `"publish"`.
90. **`community_posts.title` opcional** — Migración 035. Columna `TEXT` nullable. El formulario de publicación muestra input de título con placeholder "Titulo (opcional)". En el feed, si el post tiene título se muestra como `<h3>` bold blanco encima del contenido.
91. **Tabla `community_read_status` para tracking de lectura** — Migración 035. `(community_id, user_id)` unique. `last_seen_at` se actualiza con upsert al visitar la comunidad. Se usa para calcular posts no leídos en sidebar.
92. **Badge de no leídos en sidebar para Comunidad** — Mismo patrón que el badge de chat. `TrainerSidebar`: cuenta posts de clientes posteriores a `last_seen_at`. `ClientSidebar`: cuenta todos los posts posteriores a `last_seen_at`. Realtime: escucha INSERT en `community_posts` para incrementar el badge. Se resetea al visitar `/app/*/community`. Estilo: pill cyan con glow, igual que chat.
84. **Publicaciones fijadas (pinned)** — El trainer puede fijar posts con el botón bookmark. Posts fijados aparecen primero (order by `is_pinned DESC, created_at DESC`) y tienen borde violeta con ring. Badge "Fijado" visible.
85. **Sidebar: "Comunidad" entre "Citas" y "Chat"** — Tanto en `TrainerSidebar` como en `ClientSidebar`. Icono: grupo de personas (users SVG). Badge de no leídos cuando hay posts nuevos. El cliente solo ve la comunidad si su trainer la tiene activa (`is_active = true`).
86. **Respuestas a comentarios (threading)** — `community_comments.parent_id` (FK self-referencial, nullable). Comentarios se renderizan como árbol con indentación (`ml-6 border-l`). Profundidad máxima: 2 niveles. Botón "Responder" abre input inline debajo del comentario. Enter envía la respuesta. El tree se construye en `handleLoadComments` agrupando por `parent_id`.
87. **Likes en comentarios + diferenciación coach** — Tabla `community_comment_likes` con `comment_id`, `user_id`, `is_coach` (BOOLEAN). El coach al dar like se marca `is_coach: true`. En el UI: like del coach muestra corazón violeta + badge "Coach" junto al contador. Likes de clientes son cyan estándar. RLS: mismas políticas que `community_likes` pero sobre comments. Realtime habilitado.
88. **`community_comment_likes` tiene unique constraint** — `(comment_id, user_id)`. Misma lógica que `community_likes`: toggle optimista, insert si no existe, delete si ya existe.

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
