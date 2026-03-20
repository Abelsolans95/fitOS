# FitOS — Guía para Agentes

**Lee `desarrollo.md` antes de cualquier tarea.** Contiene el estado completo del proyecto, estructura de archivos, tablas de base de datos, convenciones y próximos pasos. Está escrito para ser leído de arriba abajo.

---

## Contexto rápido

**FitOS** es una plataforma SaaS para entrenadores personales. Dos roles: `trainer` y `client`. Monorepo con Next.js 15 (web) + Expo 55 (mobile) + Supabase (DB + Edge Functions).

- **Fase 0:** Completada — estructura base, auth, 19 tablas, tema visual
- **Fase 1:** Completada — dashboards completos (web + mobile), IA, Google Calendar
- **Rediseño UI:** Completado — "brutalismo elegante" en web y mobile, landing page premium

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
