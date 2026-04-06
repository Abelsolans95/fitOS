# Integraciones Pendientes

## Google Calendar OAuth

1. Crear credenciales en Google Cloud Console (tipo: Web application)
   - Authorized origins: `https://tu-dominio.com`, `http://localhost:3000`
   - Redirect URIs: `https://tu-dominio.com/api/auth/google/callback`, `http://localhost:3000/api/auth/google/callback`
2. Añadir a `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback
   ```
3. Código listo en `lib/google-calendar.ts` — `getGoogleAuthUrl`, `exchangeCodeForTokens`, `syncAppointmentToCalendar`.
4. Tokens se guardan en `profiles.google_calendar_tokens` (JSONB).

## Resend Email

1. Verificar dominio en resend.com (añadir registros DNS)
2. `cd apps/web && npm install resend --legacy-peer-deps`
3. Añadir a `.env.local` y Vercel: `RESEND_API_KEY=re_xxx` + `RESEND_FROM_EMAIL=citas@tu-dominio.com`
4. Descomentar bloque TODO en `lib/email-notifications.ts`

## Edge Functions IA

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
supabase functions deploy analyze-food-image --project-ref rgrtxlciqmexdkxagomo
supabase functions deploy generate-meal-plan --project-ref rgrtxlciqmexdkxagomo
supabase functions deploy generate-gym-routine --project-ref rgrtxlciqmexdkxagomo
supabase functions deploy analyze-onboarding-form --project-ref rgrtxlciqmexdkxagomo
```

## Migraciones pendientes de aplicar

| Migración | Qué desbloquea |
|-----------|----------------|
| 039_knowledge_articles.sql | Base de Conocimiento / FAQ |
| 041_security_hardening_phase2.sql | Storage SELECT restrictivos, audit_logs |
| 042_ticket_replies_trainer_client_ids.sql | Realtime filters en ticket_replies |
| 043_rls_trainer_clients_hardening.sql | RLS en 6 tablas core |
| 044_prevent_admin_signup.sql | Anti-admin signup via RLS RESTRICTIVE |

## Features sin implementar

| Feature | Estado |
|---------|--------|
| Gamificación | Tablas existen, falta UI |
| Stripe + suscripciones | Sin implementar |
| Push notifications | Sin implementar |
