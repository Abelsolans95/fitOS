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
