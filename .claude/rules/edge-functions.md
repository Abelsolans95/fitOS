---
paths:
  - "supabase/functions/**/*.ts"
---

# Edge Functions Rules — Supabase Deno

## Auth obligatorio

- `authenticateRequest(req)` de `_shared/auth.ts` — retorna `{ user, supabase }` o lanza 401.
- No duplicar `getUser()` tras `authenticateRequest()` — ya retorna `user`.
- Verificación IDOR para `client_id`: comprobar `trainer_clients` ownership ANTES de proceder.

## Body validation

- `validateBodySize(req, maxBytes)` — default 1MB, `analyze-food-image` usa 7MB.

## Prompt safety

- `sanitizeForPrompt(input, maxLength)` en TODOS los inputs interpolados en prompts.
- Cubre: HTML, control chars, `Human:`/`Assistant:`/`System:` delimiters, `<system>/<user>/<assistant>` tags, RTL/bidi Unicode.
- `stripHtml` en loop hasta estabilizar (anti-bypass `<<b>script>`).

## CORS

- `getCorsHeaders(req)` con whitelist de origins (`APP_URL` env + localhost + `.vercel.app`).
- No wildcard `*` — permite requests desde cualquier dominio.

## Error handling

- Nunca `String(error)` en responses — mensajes genéricos.
- Si el error es un `Response` (de `authenticateRequest`), re-lanzar.

## DB columns correctas

- `profiles` → `weight` y `height` (NO `weight_kg`/`height_cm`).
- Tabla de ejercicios → `trainer_exercise_library` (NO `exercises`).

## Deploy

- Edge Functions NO se despliegan con `git push`.
- Tras modificar: `npx supabase functions deploy [nombre] --project-ref rgrtxlciqmexdkxagomo`.
- Si se modifica `_shared/auth.ts`, redesplegar TODAS las funciones.

## 4 funciones disponibles

| Función | Descripción |
|---------|-------------|
| `analyze-food-image` | Imagen base64 → Claude Vision → macros |
| `generate-meal-plan` | Datos cliente → plan semanal JSON |
| `generate-gym-routine` | Objetivo/nivel/días → rutina + progresión |
| `analyze-onboarding-form` | Respuestas → informe por sección |

Requieren `ANTHROPIC_API_KEY` en Supabase secrets. Sin ella → respuesta mock.
