# FitOS — Guía para Agentes

## Contexto

**FitOS** es una plataforma SaaS para entrenadores personales. Dos roles: `trainer` y `client` (+ `admin`). Monorepo con Next.js 15 (web) + Expo 55 (mobile) + Supabase (DB + Edge Functions).

Para historial completo de fases: @docs/changelog.md
Para integraciones pendientes: @docs/integrations.md
Para errores documentados: @docs/gotchas.md

## Stack

| Capa | Tecnología |
|---|---|
| Web | Next.js 15 App Router, React 19, TypeScript |
| Estilos | Tailwind CSS 4 (CSS-first, sin tailwind.config.js), shadcn/ui |
| DB | Supabase PostgreSQL — proyecto `fitos-prod` (rgrtxlciqmexdkxagomo) |
| Mobile | Expo SDK 55 + React Navigation + expo-linear-gradient + react-native-svg |
| Charts | recharts (web trainer analytics) |
| Edge Functions | Supabase Deno — 4 funciones IA (Claude API) |
| Monorepo | Turborepo 2.x (`"tasks"` no `"pipeline"`) + npm workspaces (npm@11.8.0) |

## Reglas críticas — siempre activas

1. **npm, no pnpm** — `packageManager: "npm@11.8.0"`. En `apps/web` siempre `--legacy-peer-deps`.
2. **Dark mode permanente** — clase `dark` hardcodeada en `<html>`, no hay toggle.
3. **RLS activo en todas las tablas** — query sin datos → revisar políticas.
4. **Dos clientes Supabase** — `@/lib/supabase` (browser) y `@/lib/supabase-server` (server). No confundirlos.
5. **service_role nunca en frontend** — solo `NEXT_PUBLIC_SUPABASE_ANON_KEY` en cliente.
6. **Paridad web ↔ mobile obligatoria** — todo desarrollo/bugfix en AMBAS plataformas.
7. **Error handling Patrón C** — toda query Supabase destructura `error` + toast/return si bloqueante.
8. **`??` (no `||`) para merges** — permite cadenas vacías y `false`.
9. **`select("*")` prohibido** — columnas explícitas siempre.
10. **Fragmentar páginas >300 líneas** — durante la creación, no después.
11. **No crear endpoints temporales** — SQL directo en Supabase.
12. **`DarkSelect` obligatorio** — nunca `<select>` nativo.
13. **`useSearchParams` requiere `<Suspense>`** — en Next.js 15 client components.
14. **`getSession()` en client components, `getUser()` en server** — ~1s de diferencia.
15. **Promise.all para queries independientes** — nunca await secuenciales.
16. **Tests obligatorios en `lib/*.ts`** — happy path + edge case + error case.

## Tema visual

```
Fondo: #0A0A0F   Cards: #12121A   Cyan: #00E5FF   Violet: #7C3AED
Muted: #8B8BA3   Error: #FF1744   Success: #00C853  Orange: #FF9100
```

Card: `rounded-2xl border border-white/[0.06] bg-[#12121A]`
Botón primario: `bg-[#00E5FF] text-[#0A0A0F] rounded-xl font-semibold`

## Comandos frecuentes

```bash
cd apps/web && npm run dev                    # Web dev
cd apps/web && npm install [pkg] --legacy-peer-deps  # Instalar en web
cd apps/mobile && npm run dev                 # Mobile dev
cd apps/web && npm test                       # Tests
npm run sync-theme                            # Regenerar tema CSS
supabase functions deploy [nombre] --project-ref rgrtxlciqmexdkxagomo  # Deploy Edge Function
```

## Credenciales Supabase

- **URL:** https://rgrtxlciqmexdkxagomo.supabase.co
- **Region:** eu-west-1
- Variables de entorno en `apps/web/.env.local` y `apps/mobile/.env`

## Reglas de rules files

Las reglas detalladas están organizadas en `.claude/rules/`:

| Archivo | Contenido |
|---------|-----------|
| `database.md` | Columnas, tablas, constraints, patterns DB |
| `security.md` | RLS, OWASP, auth, sanitización, rate limiting |
| `mobile.md` | React Native, widgets, theme, Realtime cleanup |
| `architecture.md` | Fragmentación, useReducer, performance, patterns |
| `testing.md` | Vitest, mocks Supabase, convenciones |
| `api-routes.md` | Checklist API routes (path-scoped: `apps/web/app/api/**`) |
| `edge-functions.md` | Edge Functions rules (path-scoped: `supabase/functions/**`) |

## Mantenimiento obligatorio

Al terminar cualquier desarrollo, bugfix o cambio significativo:

1. **Regla nueva** → añadirla al rule file correspondiente en `.claude/rules/`
2. **Gotcha nuevo** → añadirlo a `docs/gotchas.md`
3. **Feature completada** → actualizar `docs/changelog.md`
4. **Config/integración** → actualizar `docs/integrations.md`

**Documentar errores no es opcional.** Un error no documentado es un error que se repetirá.
