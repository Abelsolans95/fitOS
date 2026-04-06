# Security Rules — Enterprise Grade

## RLS (Row Level Security)

- RLS activo en TODAS las tablas. Si una query no devuelve datos, revisar políticas.
- Trainer RLS DEBE validar `trainer_clients`: `EXISTS (SELECT 1 FROM trainer_clients tc WHERE tc.trainer_id = auth.uid() AND tc.client_id = <tabla>.client_id)`. Sin esto → acceso cross-trainer.
- Admin NO modifica RLS — usa `service_role` (bypass total).
- SECURITY DEFINER functions DEBEN incluir `SET search_path = public`.

## Dos clientes Supabase

- `@/lib/supabase` — browser/client components.
- `@/lib/supabase-server` — server components/API routes.
- `service_role` key NUNCA en frontend — solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` en cliente.
- `supabaseAdmin` (service_role) siempre DESPUÉS de auth+role check.

## Auth patterns

- `getSession()` en client components ("use client") — parse local del JWT, ~0ms.
- `getUser()` solo en Server Components, API routes, layouts, Edge Functions — round-trip ~1s.
- Layout auth (`(dashboard)/layout.tsx`) es Server Component async con `getUser()` + redirect.
- `verifyAdmin()` DEBE verificar `profiles.role` en DB (no solo JWT) — JWT `user_metadata.role` es spoofable.

## API Routes — obligatorio en TODAS

- Rate limiting: `lib/rate-limit.ts` — `apiLimiter` (60/min), `authLimiter` (10/min), `uploadLimiter` (10/min).
- CSRF: `validateCsrf(request)` en todo POST/PUT/DELETE. Usa `new URL().origin` (nunca `startsWith`).
- Input sanitization: `sanitizeText()` para campos largos, `sanitizeName()` para cortos, `sanitizeEmail()`.
- Ownership validation obligatoria con service_role — verificar recurso pertenece al usuario ANTES de operar.
- Verificar auth + role + ownership — no basta con auth sola.
- Nunca retornar `error.message` en responses — mensajes genéricos en español.
- Arrays de input DEBEN tener longitud máxima (ej: 200 ejercicios).
- Validar runtime de tipos — no confiar en `as { ... }` de TypeScript.

## API Routes admin

- `verifyAdmin(request)` de `lib/admin-auth.ts` como primera operación.
- Verificación doble: JWT + `profiles.role` via service_role.
- Creación usuarios: rollback obligatorio si profile falla (`admin.deleteUser()`).

## File uploads

- Magic bytes validation ANTES de procesar — `lib/file-validation.ts`.
- Extensiones whitelist: `jpg`, `jpeg`, `png`, `webp`, `gif`. Rechazar `svg`, `html`, `exe`.
- Storage buckets: uploads restringidos a carpeta del usuario `${userId}/filename.ext`.
- `ticket-images` y `knowledge-images` son privados (`public = false`).

## Security headers (next.config.ts)

- CSP, X-Frame-Options (DENY), HSTS, X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy.
- `unsafe-eval` solo en development (HMR) — PROHIBIDO en producción.
- `frame-ancestors 'none'` previene clickjacking.

## Data protection

- `select("*")` PROHIBIDO — columnas explícitas siempre.
- No enviar PII innecesario al frontend (ej: email del cliente al trainer sin sección de contacto).
- Logger con redacción automática de PII (`password`, `token`, `secret`, `authorization`).
- Nunca loguear `error.message` de Supabase (contiene nombres de tabla/columnas).

## Anti role-escalation

- Trigger `prevent_role_change()` en `auth.users` revierte cambios de rol.
- Migración 044: RLS RESTRICTIVE bloquea INSERT/UPDATE de profiles con `role = 'admin'`.
- Registro client REQUIERE promo code en backend — rechazar si falta `trainer_id` o `promo_code_id`.
- Email en profiles viene de `authUser.user.email`, NUNCA del request body.

## Open Redirect prevention

- Whitelist de URLs de retorno: `const ALLOWED = ["/app/..."]; const returnTo = ALLOWED.includes(raw) ? raw : DEFAULT;`.

## Video URLs

- Whitelist de dominios — `lib/url-validation.ts`. Solo YouTube y Vimeo sobre HTTPS.
- Validar ANTES de renderizar como `href` o `Linking.openURL`. Nunca `javascript:` protocol.

## Realtime subscriptions

- SIEMPRE incluir `filter` scoped al usuario. Nunca suscribirse sin filtro.
- Filtros NO son boundary de seguridad — RLS es la protección real.

## Structured logging

- `lib/logger.ts` — `logger.info()`, `logger.warn()`, `logger.error()`, `logger.security()`.
- `logger.security()` para: intentos IDOR, rate limits, role escalation, session_id inválido.
- Tabla `audit_logs` para acciones críticas: acceso datos salud, import Excel, cambio perfil.

## Supabase clients en API routes

- SIEMPRE inicializar `createClient()` DENTRO del handler — nunca a nivel de módulo. Vercel evalúa módulos durante build sin env vars.
- Igual para `new Anthropic(...)`, `new Resend(...)`, etc.

## No interpolar variables de usuario en filtros PostgREST

- Usar concatenación con `encodeURIComponent`, no template literals.

## Nunca usar `export const revalidate` en páginas con datos de usuario

- Cache poisoning: Next.js serviría datos de un usuario a otros. Solo seguro en páginas públicas.
