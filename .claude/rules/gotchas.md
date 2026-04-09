# Gotchas — Errores documentados

Tabla de errores cometidos durante el desarrollo. Consultar antes de trabajar en un área.

| # | Área | Error cometido | Fix / Regla |
|---|------|---------------|-------------|
| 1 | DB | Asumir FK entre trainer_clients y profiles | Dos queries separadas — ambas referencian auth.users |
| 2 | DB | Query a tabla trainer_profiles inexistente | Verificar esquema en especificaciones.md |
| 3 | Web | react-beautiful-dnd con React 19 | Usar @dnd-kit/core |
| 4 | DB | Asumir arrays DB nunca son null | `?? []` al iterar |
| 5 | DB | Nombres inventados en body_metrics | Columnas: body_weight_kg, hips_cm, right_arm_cm, right_thigh_cm |
| 6 | DB | Ordenar trainer_clients por created_at | Columna es `joined_at` |
| 7 | DB | height_cm/weight_kg en profiles | Columnas son `height` y `weight` |
| 8 | DB | Upsert profiles sin role | `role` es NOT NULL |
| 9 | DB | Insert en onboarding_responses | Usar `upsert` con `onConflict: "form_id,client_id"` |
| 10 | DB | Columna content de meal_plans | Es `days` (JSONB) |
| 11 | Web | Renderizar JSONB en React | `JSON.stringify()` o propiedades específicas |
| 12 | DB | meal_plans con user_id y name | FK `client_id`, columna `title`, `target_kcal` NOT NULL |
| 13 | API | Insert trainer_clients desde frontend | RLS bloquea — API route con service_role |
| 14 | DB | Nombres de columna incorrectos | Verificar especificaciones.md |
| 15 | Web | Duplicar editor formulario | Editor solo en `/trainer/forms` |
| 16 | DB | body_metrics sin recorded_at | `recorded_at` TIMESTAMPTZ NOT NULL |
| 17 | DB | Goal con espacios/mayúsculas | Solo: hipertrofia, fuerza, perdida_peso, mantenimiento |
| 18 | DB | `.update()` profiles en onboarding | `upsert` con `onConflict: "user_id"` + `role` |
| 19 | Auth | Onboarding no dispara tras login | `user_metadata.onboarding_completed` en middleware |
| 20 | Mobile | Error cosmético expo install | Verificar package.json directamente |
| 21 | DB | moddatetime() en triggers | Función custom `set_updated_at()` |
| 22 | API | Registration view sin workout_sessions | Crear sesión primero, pasar session_id |
| 23 | Web | Rest timer múltiples intervals | Valores estables, no ternarias |
| 24 | Mobile | Elapsed timer no limpia | `clearInterval()` en cleanup |
| 25 | DB | Columna days de user_routines | Es `exercises` (JSONB) |
| 26 | API | Import Excel sin verificar rol | Consultar `profiles.role` |
| 27 | DB | Insertar ejercicios desde frontend | API route con service_role |
| 28 | DB | CHECK constraint en category | `category` es TEXT libre |
| 29 | DB | Update ejercicio global se pierde | Clone-on-edit + hidden=true |
| 30 | Web | Sets completados se pierden | `savePartialProgress()` en cada check |
| 31 | Web | Botones visibles tras completar | Consultar workout_sessions completadas |
| 32 | API | Import Excel "link" oculta globales | Nombre diferente=privado; igual=no hacer nada |
| 33 | API | `supabaseKey is required` Vercel | Cliente dentro del handler, no módulo |
| 34 | Web | useSearchParams prerender crash | `<Suspense>` wrapper |
| 35 | Web | Mensajes chat no aparecen | Optimistic updates |
| 36 | Web | Optimistic desaparece si INSERT falla | Mantener con `id: err-{ts}` |
| 37 | Web | Cliente recarga para ver mensajes | Dos pasos separados (no .insert().select().single()) |
| 38 | Web | Tab bar rota 6ª pestaña | `flex-1 px-2` |
| 39 | API | Resolver no filtra hidden=true | Comprobar `override?.hidden` |
| 40 | API | Map<string, any> oculta hidden | Interface tipada, nunca `any` |
| 41 | API | Endpoints temporales activos | SQL directo en Supabase |
| 42 | API | complete-registration sin auth | createClient de supabase-server |
| 43 | API | `\|\|` en override merges | Usar `??` |
| 44 | API | food-resolver con any[] | Interfaces tipadas |
| 45 | API | import/reconcile sin verificar rol | Verificar rol trainer |
| 46 | API | Anthropic a nivel módulo | Dentro del handler |
| 47 | Web | appointments/page.tsx 1187 líneas | Fragmentar durante creación |
| 48 | Test | Tests no creados junto al código | .test.ts en misma sesión |
| 49 | Review | Issues ya corregidos | Leer código primero |
| 50 | API | handleSave sin weekly_config | Incluir mode/weekly_config/total_weeks |
| 51 | Web | Peso pre-rellenado como valor | Mostrar como placeholder |
| 52 | API | detectedColumns pierde campo type | Incluir ambos campos |
| 53 | Web | buildEmptyDays() crashea | Actualizar TODAS las llamadas |
| 54 | Web | `<select>` nativo blanco | DarkSelect siempre |
| 55 | Build | utils.ts no existía al importar | Crear en mismo commit |
| 56 | Build | types.ts no existía al re-exportar | Crear ANTES de imports |
| 57 | Web | pnpm install falla | npm es el packageManager |
| 58 | Build | sync-css.ts doble indentación | `before` ya incluye indentación |
| 59 | Web+Mobile | SFR no se guardaba en DB | Eliminar guard en confirmSfr |
| 60 | DB | Sesión huérfana in_progress | finalizeSession retorna boolean + "Reintentar" |
| 61 | Mobile | SetEntry sin campo rpe | Actualizar TODOS los puntos de creación |
| 62 | Web+Mobile | RPE per-exercise vs per-set | Columna RPE condicional por serie |
| 63 | Web | rest_pause_sets legacy | Se calcula auto del count de set_type |
| 64 | Web | totalSets duplicando count | Solo `sum(ex.sets)` |
| 65 | Web+Mobile | weekly_config.sets_detail ignorado | Verificar sets_detail independiente del modo |
| 66 | RLS | trainer_replies_all bloquea UPDATE read_at | Política separada trainer_replies_update_read |
| 67 | RLS | Trainer sin validar trainer_clients | EXISTS en todas las políticas trainer |
| 68 | API | validate-promo sin auth | getUser() al inicio |
| 69 | API | complete-registration sin validar promo | Query con .eq("trainer_id") |
| 70 | API | Race condition promo uses | increment_promo_code_usage() atómico |
| 71 | API | Open redirect OAuth callback | Whitelist URLs |
| 72 | Auth | Role escalation via updateUser | Trigger prevent_role_change() |
| 73 | DB | stress_index sin CHECK | CHECK >= 0 AND <= 50000 |
| 74 | Storage | Sin restricción de carpeta | foldername()[1] = auth.uid() |
| 75 | DB | SECURITY DEFINER sin search_path | SET search_path = public |
| 76 | Deps | xlsx con 2 CVEs | Migrado a exceljs |
| 77 | Headers | Sin security headers | next.config.ts headers() |
| 78 | API | Sin rate limiting | lib/rate-limit.ts |
| 79 | PII | Email innecesario al frontend | Eliminado de select() |
| 80 | API | select("*") en client-trainer | Columnas explícitas |
| 81 | API | import_id sin validar ownership | Query de ownership antes |
| 82 | UX | session_id inválido silencioso | toast.error() |
| 83 | Storage | SELECT policies permisivas | Validar ownership en SELECT |
| 84 | Realtime | Subscriptions sin filtro | filter scoped al usuario |
| 85 | Edge | analyze-food-image sin auth | authenticateRequest() |
| 86 | Edge | Sin body size limit | validateBodySize() |
| 87 | Edge | Prompt injection | sanitizeForPrompt() |
| 88 | XSS | Video URL javascript: | isAllowedVideoUrl() |
| 89 | API | Client sin promo code bypass | Rechazar si falta trainer_id |
| 90 | API | Email spoofing via body | authUser.user.email |
| 91 | Upload | SVG XSS | Whitelist extensiones |
| 92 | CSRF | startsWith subdomain bypass | new URL().origin |
| 93 | CSRF | CSRF faltaba en 5 routes | validateCsrf() en todas |
| 94 | API | file.name sin sanitizar | sanitizeName() |
| 95 | Logs | console.error con datos sensibles | Contexto mínimo |
| 96 | API | complete-registration sin sesión caller | getUser() + caller.id === client_id |
| 97 | API | 7 routes sin rate limiting | apiLimiter en todas |
| 98 | API | err.message en responses | Mensajes genéricos |
| 99 | OAuth | Google callback sin auth/role | Verificar antes de exchange |
| 100 | API | exercise_names sin límite | Cap a 200 |
| 101 | API | Nombres ejercicios sin sanitizar | sanitizeName() |
| 102 | Edge | sanitizeForPrompt importado no llamado | Aplicar a todos los inputs |
| 103 | Edge | weight_kg/height_cm inexistentes | weight/height |
| 104 | Edge | Tabla exercises inexistente | trainer_exercise_library |
| 105 | Edge | getUser() duplicado | Usar user de authenticateRequest |
| 106 | Edge | Sin IDOR check client_id | Verificar trainer_clients |
| 107 | Edge | CORS wildcard * | getCorsHeaders(req) |
| 108 | Edge | String(error) expone internals | Mensajes genéricos |
| 109 | Sanitize | stripHtml single-pass bypass | Loop while |
| 110 | CSP | unsafe-eval en producción | Condicional NODE_ENV |
| 111 | Logger | Sin redacción PII | redactSensitive() |
| 112-115 | RLS | 4 tablas trainer sin trainer_clients | Migración 043 |
| 116 | DB | log_audit_event sin validar caller | p_user_id = auth.uid() |
| 117 | Storage | Buckets public=true | SET public = false |
| 118 | DB | increment_promo callable por authenticated | REVOKE |
| 119 | Perf | getUser() en 32 client components | getSession() |
| 120 | Perf | Queries secuenciales independientes | Promise.all() |
| 121 | Auth | verifyAdmin solo JWT — spoofable | Doble check JWT + profiles.role |
| 122 | Mobile | Import directo de módulos nativos de salud crashea en Expo Go | Usar `import()` dinámico en try/catch |
| 123 | Mobile | Permisos de salud no tienen API booleana directa | Usar data no-null como proxy de permisos |
| 124 | Mobile | Sync peso duplica registros por decimales | Tolerancia de dedup 0.1 kg |
| 125 | Mobile | Módulos nativos de salud no funcionan sin prebuild | Requiere `expo prebuild` + compilación nativa |
| 126 | Offline | WatermelonDB SQLiteAdapter es default export | `module.default ?? (module as any).SQLiteAdapter` |
| 127 | Offline | WatermelonDB schema helpers importados a nivel de módulo crashean | Definir schema como plain objects, construir con appSchema/tableSchema en runtime |
| 128 | Offline | WatermelonDB decorators requieren import dinámico | Crear Model classes dentro de funciones async con dynamic import |
| 129 | Offline | Push weight_log antes de tener session server ID falla | Siempre push sessions primero, luego weight_log |
| 130 | Offline | Dedup sessions offline: insertar duplicadas por retry | Verificar existencia por day_label + week_number + routine antes de INSERT |
| 131 | Leagues | league_participants unique constraint error 23505 en join duplicado | Manejar 23505 como "ya inscrito", no como error |
| 132 | Leagues | gamification_enabled default false en communities | Verificar flag antes de mostrar UI de ligas al cliente |
| 133 | Leagues | leagues no tiene FK a trainer_clients | Verificar manualmente que client_id pertenece al trainer antes de enroll |
| 134 | API | ILIKE con input de usuario permite wildcard injection | Escapar `%` y `_` antes de interpolación: `search.replace(/%/g, "\\%").replace(/_/g, "\\_")` |
| 135 | Security | JSON-LD con dangerouslySetInnerHTML permite XSS via `</script>` | `.replace(/</g, "\\u003c")` en JSON.stringify output |
| 136 | Web | `<img>` con data URL de preview local | Usar `next/image` con `unoptimized` para data URLs |
| 137 | RLS | lp_client_insert sin verificar trainer_clients | JOIN leagues + trainer_clients para que solo clientes del trainer puedan unirse |
| 138 | API | /api/leads POST sin CSRF | validateCsrf() incluso en endpoints con service_role (formulario misma origin) |
| 139 | Web | Patrón C omitido en operaciones "fire-and-forget" | Toda mutación Supabase DEBE destructurar error y manejar — no existe "fire-and-forget" |
