# Pendientes para COMPLETAR la Fase 1: MVP Core

Este documento detalla las tareas y configuraciones que faltan para dar por finalizada la **Fase 1** de FitOS, basándose en la discrepancia entre las `especificaciones.md` y el estado actual del repositorio.

---

## 1. Infraestructura y Configuración (Bloqueantes)
- [ ] **Secretos de IA en Supabase:** Configurar `ANTHROPIC_API_KEY` mediante el CLI de Supabase para que las Edge Functions (`analyze-food-image`, `generate-meal-plan`, etc.) funcionen.
- [ ] **Credenciales de Google Calendar:** Configurar `NEXT_PUBLIC_GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env.local` y Vercel para habilitar la sincronización del Master Calendar.
- [ ] **Conexión con Vercel:** Vincular el repositorio a un proyecto de Vercel y configurar todas las variables de entorno necesarias (Supabase URL, Anon Key, Service Role Key, etc.).

## 2. Base de Datos y Reproducibilidad
- [ ] **Restauración de Migraciones 001-017:** Las tablas existen en la documentación pero los archivos `.sql` no están en `supabase/migrations/`. Se deben extraer los fragmentos SQL de `especificaciones.md` a archivos físicos para asegurar la reproducibilidad del entorno.
- [ ] **Carga de Datos Semilla (Seeds):**
    - [ ] Insertar los **120+ alimentos globales** detallados en la sección 13 de las especificaciones.
    - [ ] Insertar los **800+ ejercicios globales** para que la biblioteca del entrenador no aparezca vacía por defecto.

## 3. Aplicación Móvil (React Native + Expo)
- [ ] **Notificaciones Push:** Falta instalar e integrar `expo-notifications`. Es un entregable crítico de la Fase 1 para avisar al cliente de nuevos planes o mensajes.
- [ ] **Configuración de Despliegue (EAS):** Preparar el archivo `eas.json` y configurar los workflows de compilación para la eventual publicación en App Store y Google Play Store.
- [ ] **Sincronización Biométrica Básica:** Implementar la lectura inicial de pasos o sueño desde Apple Health / Google Fit (mencionado como entregable de Fase 1).

## 4. Funcionalidades Core a Validar
- [ ] **Vision Calorie Tracker:** Asegurar que el flujo completo (Cámara -> IA -> Tarjeta de resultado -> Guardar) está operativo y persiste los datos en la tabla `food_log`.
- [ ] **Exportación .ics:** Validar que el endpoint `/api/calendar/export.ics` genera correctamente el archivo RFC 5545.
- [ ] **Eliminación de redundancias:** Limpiar `package.json` de `apps/web` (eliminar `react-beautiful-dnd` si ya no se usa, según Errores Conocidos #3 en `desarrollo.md`).

---

> [!IMPORTANT]
> Aunque `desarrollo.md` marca la Fase 1 como completada, sin las semillas de datos y las claves de IA, el sistema es un "cascarón vacío" que no permite realizar flujos completos de negocio.
