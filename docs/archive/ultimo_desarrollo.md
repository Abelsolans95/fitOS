# Último Desarrollo — Sesión 08/04/2026

## Resumen

Se completaron 6 tareas pendientes de Fase 1 + reestructuración del CLAUDE.md + 7 features de KUVOX_VISION.md.

---

## Parte 1: Reestructuración CLAUDE.md

El CLAUDE.md pasó de **973 líneas** (siempre cargadas) a **92 líneas** core + reglas modulares en `.claude/rules/`.

| Archivo | Líneas | Carga |
|---------|--------|-------|
| `CLAUDE.md` | 92 | Siempre |
| `.claude/rules/database.md` | 120+ | Automática |
| `.claude/rules/security.md` | 99 | Automática |
| `.claude/rules/architecture.md` | 90 | Automática |
| `.claude/rules/mobile.md` | 65 | Automática |
| `.claude/rules/testing.md` | 27 | Automática |
| `.claude/rules/gotchas.md` | 137 | Automática |
| `.claude/rules/api-routes.md` | 40 | Solo al editar `apps/web/app/api/**` |
| `.claude/rules/edge-functions.md` | 54 | Solo al editar `supabase/functions/**` |
| `docs/changelog.md` | 137 | Bajo demanda |
| `docs/integrations.md` | 53 | Bajo demanda |
| `CLAUDE.local.md` | 18 | Siempre (gitignored, personal) |

---

## Parte 2: 6 Tareas de Fase 1

### 1. Push Notifications (Mobile)
- `expo-notifications`, `expo-device`, `expo-constants`
- `src/lib/notifications.ts` — registro, token, scheduling local
- `src/contexts/NotificationContext.tsx` — provider con listeners + deep linking
- `App.tsx` + `app.json` actualizados

### 2. EAS Config
- `apps/mobile/eas.json` con 3 perfiles: development, preview, production

### 3. Biometric Sync (Apple Health / Google Health Connect)
- `src/lib/health-sync.ts` — pasos, sueño, peso, FC con imports dinámicos
- `src/hooks/useHealthData.ts` — hook con cache 15 min
- `DashboardScreen.tsx` — tarjeta de salud + botón "Conectar Salud"

### 4. Fix Vision Calorie Tracker (Web)
- `handleAnalyze()` pasó de mock con setTimeout a llamada real a Edge Function
- Base64 + `supabase.functions.invoke("analyze-food-image")`

### 5. ICS Calendar Export
- `/api/calendar/export/route.ts` — genera .ics RFC 5545 con `ical-generator`
- Filtro por rol + range (week/month/all)

### 6. Cleanup react-beautiful-dnd
- Eliminado de `package.json` — incompatible con React 19, 0 imports

---

## Parte 3: 7 Features de KUVOX_VISION.md

### Punto 1 — Rebrand FitOS → Kuvox (parcial: solo nombre)
**20 archivos modificados:**
- Web: landing (Hero, CTA, Footer, NavBar, Testimonials), auth (login, register, forgot-password, reset-password, onboarding), admin dashboard, layout, sidebar, email-notifications, constants
- Mobile: App.tsx, OnboardingScreen, LoginScreen, widget
- **NO cambiado:** nombres de paquetes (@kuvox/*), bundle IDs, import paths, env vars

### Punto 7 — Gestión de Contratos
**Archivos creados:**
- `supabase/migrations/045_contracts.sql` — contract_templates + contracts con RLS
- `packages/shared/src/types/contracts.ts`
- `apps/web/app/api/contracts/route.ts` — CRUD
- `apps/web/app/api/contracts/sign/route.ts` — firma con IP + timestamp
- `apps/web/app/(dashboard)/app/trainer/contracts/` — 7 archivos (page, hook, 5 components)
- `apps/web/app/(dashboard)/app/client/contracts/` — 6 archivos (page, hook, 4 components)
- Sidebars actualizados

### Punto 8 — IA de Comida Avanzada (Foto Nevera + Video Buffet)
**Archivos creados:**
- `supabase/functions/suggest-meal-from-image/index.ts` — Claude Vision, 2-3 sugerencias
- `apps/web/app/(dashboard)/app/client/calories/components/` — FridgeAnalysis, BuffetAnalysis, MealSuggestionCard
- Mobile: CaloriesScreen actualizado con 3 modos
- Macros restantes = target_kcal - food_log del día
- Video: extracción de frames client-side (canvas + pixel variance)

### Punto 9 — Marketplace de Rutinas
**Archivos creados:**
- `supabase/migrations/046_marketplace.sql` — marketplace_products + marketplace_purchases
- `apps/web/app/marketplace/page.tsx` — catálogo público (sin auth)
- `apps/web/app/marketplace/[id]/page.tsx` — detalle con descarga .kuvox
- `apps/web/app/(dashboard)/app/trainer/marketplace/` — publicación de rutinas
- `apps/web/app/api/marketplace/route.ts` + `publish/route.ts`
- `apps/web/lib/kuvox-format.ts` — generación de archivos .kuvox

### Punto 12 — Modo Offline (WatermelonDB)
**Archivos creados:**
- `apps/mobile/src/lib/offline/schema.ts` — 6 tablas WatermelonDB
- `apps/mobile/src/lib/offline/models/` — Routine, WorkoutSession, WeightLog
- `apps/mobile/src/lib/offline/database.ts` — SQLite adapter singleton
- `apps/mobile/src/lib/offline/sync.ts` — sync bidireccional
- `apps/mobile/src/hooks/useOffline.ts`
- `apps/mobile/src/contexts/OfflineContext.tsx` — provider con banners
- App.tsx envuelto con OfflineProvider
- Todos los imports dinámicos — safe en Expo Go

### Punto 14 + 15 — Perfil Público + Blog
**Archivos creados:**
- `supabase/migrations/047_public_profiles_blog_crm.sql` — slug, accent_color, is_public, leads
- `apps/web/app/t/[slug]/page.tsx` — landing pública del trainer con SEO
- `apps/web/app/t/[slug]/[post_slug]/page.tsx` — artículo público con schema markup
- `apps/web/app/sitemap.ts` — sitemap dinámico
- Toggle "Publicar en perfil público" en formulario de comunidad
- Settings: editor de slug + color picker
- CTA "Entrenar con [Trainer]" en artículos → lead al CRM

### Punto 16 — CRM (solo Fase 1: Link en Bio)
**Archivos creados:**
- Tabla `leads` (en migración 047) — source, status, pipeline
- `apps/web/app/(dashboard)/app/trainer/leads/` — 6 archivos: Kanban pipeline visual
- `apps/web/app/api/leads/route.ts` — POST público con service_role
- Formularios en landing + artículos → leads automáticos
- **Pendiente:** Puntos 2-6 (Instagram DM, Meta Lead Ads, TikTok, follow-up email, WhatsApp)

### Punto 17 — Ligas y Gamificación
**Archivos creados:**
- `supabase/migrations/048_leagues_gamification.sql` — leagues, participants, badges, user_badges
- 8 badges seeded (rachas, ligas, sesiones, PR)
- `communities.gamification_enabled` — toggle trainer
- `apps/web/app/(dashboard)/app/trainer/leagues/` — crear/gestionar ligas
- `apps/web/app/(dashboard)/app/client/leagues/` — ver/unirse ligas + badges
- `apps/mobile/src/screens/LeaguesScreen.tsx` — tabs ligas + badges
- `apps/web/app/api/leagues/` — CRUD + join + leaderboard
- `packages/shared/src/types/leagues.ts`
- Sidebars + tab mobile actualizados

---

## Documentación Actualizada

| Archivo | Cambios |
|---------|---------|
| `CLAUDE.md` | Actualizado con nuevas tablas y reglas |
| `.claude/rules/database.md` | +contracts, marketplace, leads, public profiles, leagues |
| `.claude/rules/gotchas.md` | +gotchas 131-137 |
| `.claude/rules/mobile.md` | +offline mode section |
| `docs/changelog.md` | +7 features nuevas |
| `docs/integrations.md` | +features pendientes actualizadas |
| `KUVOX_VISION.md` | Puntos marcados con "realizado" + subtítulos pendientes |

---

## Migraciones Nuevas (pendientes de aplicar)

| Migración | Qué desbloquea |
|-----------|----------------|
| 045_contracts.sql | Gestión de contratos |
| 046_marketplace.sql | Marketplace de rutinas |
| 047_public_profiles_blog_crm.sql | Landing pública, blog, CRM |
| 048_leagues_gamification.sql | Ligas y gamificación |

---

## Pendiente por ti (configuración manual)

| # | Tarea | Comando / Acción | Prioridad |
|---|-------|-----------------|-----------|
| 1 | **Aplicar migraciones 045-048** | SQL en Supabase Dashboard (en orden) | **Crítica** |
| 2 | **ANTHROPIC_API_KEY** | `supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx` | Alta |
| 3 | **Deploy Edge Functions** | `supabase functions deploy suggest-meal-from-image --project-ref rgrtxlciqmexdkxagomo` + las 4 existentes | Alta |
| 4 | **Columna push token** | SQL: `ALTER TABLE profiles ADD COLUMN expo_push_token TEXT;` | Alta |
| 5 | **EAS projectId** | `eas init` en apps/mobile + reemplazar UUID placeholder en app.json | Media |
| 6 | **Notification icon** | `assets/notification-icon.png` (96x96, blanco/transparente) para Android | Media |
| 7 | **Google Calendar OAuth** | Credenciales en Google Cloud Console + `.env.local` | Media |
| 8 | **Resend Email** | Verificar dominio + `RESEND_API_KEY` | Media |
| 9 | **Stripe** | Implementar pagos (Punto 4 de KUVOX_VISION) | Media |
| 10 | **expo prebuild** | Para que SQLite (offline) y módulos de salud funcionen en device | Baja |

---

## Branch

Todos los cambios están en: `claude/refactor-claude-md-KzCdz`
