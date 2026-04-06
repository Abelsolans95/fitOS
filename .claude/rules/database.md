# Database Rules — Supabase PostgreSQL

## Columnas y nombres reales (errores frecuentes)

- `profiles` usa `height` y `weight` (NO `height_cm`/`weight_kg`). Columna `role` es NOT NULL — incluirla siempre en upserts.
- `profiles.gender` — TEXT nullable (`'male'` | `'female'`). Default NULL = male en componentes.
- `trainer_clients` usa `joined_at` — no `created_at`.
- `meal_plans` usa columna `days` — no `content`. JSONB con los días del plan.
- `food_log` usa `client_id` — no `user_id`. Diferente al resto de tablas.
- `user_routines.exercises` — JSONB. No existe columna `days`.
- `body_metrics.recorded_at` — TIMESTAMPTZ NOT NULL. Siempre `new Date().toISOString()`.
- `body_metrics` columnas reales: `body_weight_kg`, `hips_cm`, `right_arm_cm`, `right_thigh_cm`.
- `meal_plans` — FK `client_id` y columna `title`; `target_kcal` es NOT NULL.
- `meal_plans.period` — enviar como `"weekly"` por defecto.
- `profiles.goal` — solo acepta: `hipertrofia`, `fuerza`, `perdida_peso`, `mantenimiento`.

## Constraints y patrones obligatorios

- `onboarding_responses` tiene unique constraint `(form_id, client_id)` — usar siempre `upsert` con `onConflict: "form_id,client_id"`.
- `profiles` — usar `upsert` con `onConflict: "user_id"` + incluir `role`.
- No hay FK directa entre `trainer_clients` y `profiles` — ambas referencian `auth.users` independientemente. Para joins: dos queries separadas y mergear por ID.
- `health_logs.muscle_id` — texto libre. IDs válidos en `FRONT_MUSCLES` y `BACK_MUSCLES` (ej: `neck`, `chest_left`, `quadriceps_right`).
- `weight_log.stress_index` — CHECK `>= 0 AND <= 50000`. `stimulus_rating`/`fatigue_rating` CHECK `BETWEEN 1 AND 5`.
- Toda columna numérica con input de usuario DEBE tener CHECK constraints en DB.
- No usar `moddatetime` — no disponible en Supabase. Usar función custom `set_updated_at()`.
- Arrays DB pueden ser null — usar `?? []` al iterar, `?.length ?? 0` al comprobar.

## Three-layer exercise/food resolution

- Layer A: globales (`is_global=true`), Layer B: privados del trainer (`is_global=false`), Layer C: overrides.
- Resolvers en `lib/exercise-resolver.ts` y `lib/food-resolver.ts`.
- Clone-on-edit: editar global → clonar como privado + ocultar original via `hidden = true`.
- `trainer_exercise_library.category` es TEXT nullable (sin CHECK). No hay columna `difficulty` ni `equipment`.
- `trainer_exercise_library.aliases` — TEXT[] para nombres alternativos (reconciliación Excel).

## Workout sessions y weight_log

- `workout_sessions` agrupa `weight_log` — FK `session_id`. Modos: `registration` o `active`.
- `weight_log` se guarda en cada check (set) con `savePartialProgress()`. Campo `sets_data` incluye `completed: boolean` por set.
- `weight_log.client_notes` — TEXT opcional por ejercicio.
- `exercise_rpe` en `weight_log` = media de RPE por serie completados.
- Sesión activa resumible: `status: "in_progress"` permite retomar.
- No repetir sesión completada — comparar por `day_label::week_number`.

## Routine structure

- `user_routines` tiene `total_weeks`, `current_week`, `training_days` (TEXT[]) para mesociclos.
- `weekly_config: Record<number, WeekConfig>` — valores distintos por semana.
- `SetConfig.set_type`: `"normal"` | `"rest_pause"` | `"drop_set"`.
- `SetType` (config del trainer) vs `SetEntryType` (runtime/DB): `"normal"` → `"main"`.
- `rest_pause_sets` se calcula automáticamente del count de `set_type !== "normal"`.

## Nutrition structure

- `crSnacksPerDay` (0/1/2) — 0=3 comidas, 1=4, 2=5. `meals_per_day` en DB = `3 + crSnacksPerDay`.
- `saved_menu_templates.config` — JSONB con todo el estado del menú.

## Community tables

- `communities` — 1:1 con coach. `mode`: `OPEN` | `READ_ONLY_CLIENTS`.
- `community_comment_likes` — unique constraint `(comment_id, user_id)`.
- `community_read_status` — `(community_id, user_id)` unique. `last_seen_at` para badges.
- `community_posts.title` — nullable.

## Tickets tables

- `support_tickets` — `category`: nutricion|rutina|lesion|general. `status`: open|in_progress|resolved.
- `ticket_replies` — `read_at` para tracking. RLS policy `trainer_replies_update_read` separada.

## Knowledge table

- `knowledge_articles` — `category` CHECK: nutricion, rutina, lesion, tecnica, suplementacion, general.
- `search_knowledge_articles()` — full-text search español + ILIKE fallback.
- `increment_article_view()` — SECURITY DEFINER para cliente sin UPDATE directo.

## Audit table

- `audit_logs` — `log_audit_event()` SECURITY DEFINER. Valida `p_user_id = auth.uid()`.

## Incrementos atómicos

- Nunca read-then-update para contadores. Usar funciones SECURITY DEFINER con `UPDATE ... SET x = x + 1`.
- `increment_promo_code_usage()` — solo callable via service_role.

## Full-text search

- `pg_trgm` habilitado — funciones `search_similar_exercises()` y `search_similar_foods()` via `supabase.rpc()`. Threshold 0.3.
