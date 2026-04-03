# Chat 2: Auditoria de seguridad

Lee CLAUDE.md completo antes de empezar.

Auditoria de seguridad completa del proyecto. Revisa y corrige:

## 1. TODAS las API routes en apps/web/app/api/

Para cada una verifica:
- Verifican auth con supabase.auth.getUser()?
- Verifican rol (trainer/client) donde corresponde?
- Validan el body del request (tipos, campos requeridos)?
- Usan supabaseAdmin SOLO despues de verificar auth+rol?
- Devuelven status codes correctos (401, 403, 400, 500)?

## 2. Busca en TODO el codebase

- console.log que expongan datos sensibles (tokens, keys, passwords)
- Claves hardcodeadas que no sean env vars
- Supabase service_role key expuesta en componentes cliente
- Cualquier fetch a URL externa sin validacion

## 3. Revisa middleware.ts

- Cubre todas las rutas protegidas?
- Un client puede acceder a /app/trainer/* ?
- Un trainer puede acceder a /app/client/* ?
- Que pasa con /app/admin/* ?

## 4. Revisa RLS policies

- Lee TODAS las migraciones en supabase/migrations/
- Hay alguna tabla sin RLS habilitado?
- Hay policies con USING (true) que permitan acceso total?
- Las policies de UPDATE tienen WITH CHECK correcto?

## Reglas

Si encuentras un problema de seguridad, corrigelo inmediatamente.
Commitea y pushea cada fix con mensaje descriptivo.

---

## Resumen de ejecucion (02/04/2026)

### API Routes auditadas
| Route | Auth | Rol | Body validation | Status codes | Resultado |
|-------|------|-----|-----------------|-------------|-----------|
| complete-registration | ✅ admin.getUserById | ✅ role match | ✅ client_id + role | ✅ 400/403/500 | Sanitizado error message (no leak DB) |
| activate-client | ✅ getUser | ✅ role=client | N/A | ✅ 401/403/500 | OK |
| client-trainer | ✅ getUser | ✅ role=client | N/A | ✅ 401/403/404/500 | OK |
| validate-promo | ❌ público (intencional) | N/A | ✅ code | ⚠️ Corregido: status 400 | Añadido status 400 a errores |
| import/excel | ✅ getUser | ✅ role=trainer | ✅ | ✅ | OK |
| import/reconcile | ✅ getUser | ✅ role=trainer | ✅ | ✅ | OK |
| import/create-exercises | ✅ getUser | ✅ role=trainer | ✅ | ✅ | OK |
| auth/google | ✅ getUser | ✅ role=trainer | N/A | ✅ | OK |
| auth/google/callback | ✅ getUser | ⚠️ Corregido | N/A | ✅ | Añadido role check trainer |

### Fixes aplicados
1. **validate-promo/route.ts** — Añadido `{ status: 400 }` a 3 respuestas de error que retornaban 200
2. **auth/google/callback/route.ts** — Añadido verificacion de rol trainer (403 si no es trainer)
3. **complete-registration/route.ts** — Sanitizado `tcError.message` → mensaje generico

### Busqueda en codebase
- ✅ No hay console.log que expongan tokens/keys/passwords
- ✅ No hay claves hardcodeadas (todo via process.env)
- ✅ service_role key solo en API routes, nunca en componentes cliente
- ✅ Middleware cubre correctamente cross-role access (trainer↔client↔admin)

### RLS
- ✅ Todas las tablas tienen RLS habilitado
- ✅ No hay policies con USING(true)
- ✅ WITH CHECK correctos en UPDATE policies
- ℹ️ Storage `community_images_select` permite lectura publica (intencional para imagenes de comunidad)
