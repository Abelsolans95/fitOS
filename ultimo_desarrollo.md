# Último Desarrollo — Sesión 08/04/2026

## Resumen

Se completaron 6 tareas pendientes de Fase 1 + reestructuración del CLAUDE.md.

---

## Reestructuración CLAUDE.md

El CLAUDE.md pasó de **973 líneas** (siempre cargadas) a **92 líneas** core + reglas modulares en `.claude/rules/`.

| Archivo | Líneas | Carga |
|---------|--------|-------|
| `CLAUDE.md` | 92 | Siempre |
| `.claude/rules/database.md` | 87 | Automática |
| `.claude/rules/security.md` | 99 | Automática |
| `.claude/rules/architecture.md` | 90 | Automática |
| `.claude/rules/mobile.md` | 51 | Automática |
| `.claude/rules/testing.md` | 27 | Automática |
| `.claude/rules/gotchas.md` | 128 | Automática |
| `.claude/rules/api-routes.md` | 40 | Solo al editar `apps/web/app/api/**` |
| `.claude/rules/edge-functions.md` | 54 | Solo al editar `supabase/functions/**` |
| `docs/changelog.md` | 100 | Bajo demanda |
| `docs/integrations.md` | 50 | Bajo demanda |
| `CLAUDE.local.md` | 18 | Siempre (gitignored, personal) |

---

## 6 Tareas Completadas

### 1. Push Notifications (Mobile)
- Instalado `expo-notifications`, `expo-device`, `expo-constants`
- `src/lib/notifications.ts` — registro, token, scheduling local
- `src/contexts/NotificationContext.tsx` — provider con listeners + deep linking a tabs
- `App.tsx` actualizado con `NotificationProvider`
- `app.json` actualizado con plugin de notificaciones + projectId placeholder

### 2. EAS Config
- Creado `apps/mobile/eas.json` con 3 perfiles:
  - `development` — dev client, distribución interna, soporte simulador iOS
  - `preview` — distribución ad-hoc para testing
  - `production` — submission a App Store / Google Play

### 3. Biometric Sync (Apple Health / Google Health Connect)
- `src/lib/health-sync.ts` — capa de datos de salud (pasos, sueño, peso, FC)
- `src/hooks/useHealthData.ts` — hook React con cache 15 min
- `DashboardScreen.tsx` — tarjeta de salud con 4 métricas + botón "Conectar Salud"
- `app.json` — permisos HealthKit + Health Connect configurados
- Imports dinámicos para no crashear en Expo Go/simuladores

### 4. Fix Vision Calorie Tracker (Web)
- `useCaloriesPage.ts` — `handleAnalyze()` pasó de **mock con setTimeout** a llamada real a Edge Function `analyze-food-image`
- Conversión de imagen a base64 + `supabase.functions.invoke()`
- `handleSave()` ahora persiste `ai_raw` en la DB
- El mobile ya funcionaba; ahora web también

### 5. ICS Calendar Export
- Creado `/api/calendar/export/route.ts` — genera archivo .ics RFC 5545
- Usa `ical-generator` (ya estaba instalado pero sin usar)
- Auth + rate limiting + filtro por rol (trainer/client)
- Query param `?range=week|month|all`
- Botón "Exportar" añadido en appointments de trainer y client

### 6. Cleanup react-beautiful-dnd
- Eliminado `react-beautiful-dnd` y `@types/react-beautiful-dnd` de `package.json`
- 0 imports en el código, incompatible con React 19
- El único DnD usa HTML5 nativo (drag events en calories page)

---

## Pendiente por ti (configuración manual)

| # | Tarea | Comando / Acción | Prioridad |
|---|-------|-----------------|-----------|
| 1 | **ANTHROPIC_API_KEY** | `supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx` | Alta — desbloquea IA (calorie tracker, meal plans, routines) |
| 2 | **Deploy Edge Functions** | `supabase functions deploy analyze-food-image --project-ref rgrtxlciqmexdkxagomo` (repetir para las 4 funciones) | Alta — sin deploy, la web llama a funciones inexistentes |
| 3 | **Columna push token** | SQL en Supabase: `ALTER TABLE profiles ADD COLUMN expo_push_token TEXT;` | Alta — sin ella, el token de push no se guarda |
| 4 | **EAS projectId** | Ejecutar `eas init` en `apps/mobile/` y reemplazar el placeholder UUID en `app.json` | Media — necesario antes del primer build EAS |
| 5 | **Notification icon** | Crear `assets/notification-icon.png` (96x96, blanco sobre transparente) para Android | Media |
| 6 | **Backend push sender** | Crear Edge Function que envíe notificaciones via Expo Push API cuando hay nuevos mensajes/citas/rutinas | Media |
| 7 | **Google Calendar OAuth** | Crear credenciales en Google Cloud Console + añadir a `.env.local` | Media |
| 8 | **Resend Email** | Verificar dominio en resend.com + `RESEND_API_KEY` | Media |
| 9 | **Vincular Vercel** | Conectar repo + configurar env vars | Media |
| 10 | **expo prebuild** | Ejecutar `expo prebuild` para que los módulos nativos de salud funcionen en dispositivo real | Baja — solo necesario para testing en device |

---

## Branch

Todos los cambios están en: `claude/refactor-claude-md-KzCdz`
