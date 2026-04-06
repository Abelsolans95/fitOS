---
paths:
  - "apps/web/app/api/**/*.ts"
---

# API Routes Rules

## Checklist obligatorio para TODA API route

1. `validateCsrf(request)` en POST/PUT/DELETE
2. Rate limiting (`apiLimiter`, `authLimiter`, o `uploadLimiter`)
3. Auth: `supabase.auth.getUser()` verificado
4. Role check: `profiles.role` si es trainer-only
5. Ownership validation si acepta resource IDs
6. `sanitizeName()`/`sanitizeText()` en inputs de texto antes de DB
7. Nunca retornar `error.message` — mensajes genéricos en español
8. Clientes Supabase DENTRO del handler — nunca a nivel de módulo

## Patrones

- `supabaseAdmin` (service_role) solo DESPUÉS de auth+role check.
- Batch insert en lugar de bucles — un único `.insert(array)`.
- Arrays de input con longitud máxima (ej: 200 ejercicios en reconcile).
- Validar runtime de tipos — `typeof`, `Array.isArray()`, no solo `as {...}`.
- `file.name` sanitizar con `sanitizeName()` antes de guardar en DB.
- Magic bytes validation en uploads ANTES de procesar.

## Admin routes (`/api/admin/*`)

- `verifyAdmin(request)` de `lib/admin-auth.ts` como primera operación.
- Retorna `{ auth, errorResponse }` — si null, retornar errorResponse.
- `supabaseAdmin` retornado es service_role (bypasea RLS).
- Creación usuarios: rollback obligatorio si profile falla.

## Import routes

- Verificar `profiles.role === "trainer"` — no solo auth.
- `import_id` verificar ownership antes de update (service_role bypasea RLS).
- Excel: `exceljs` (no xlsx/SheetJS). `parseExcelBuffer()` es async.
- Excel import usa Claude Haiku para detectar estructura.
