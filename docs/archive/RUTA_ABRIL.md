# Ruta Abril 2026 — Producto listo para trainer beta

> Objetivo: que tu trainer real pueda registrarse, crear rutinas/menus,
> invitar clientes, y que los clientes entrenen con la app en su movil.
> Fecha limite: 30 de abril de 2026.

---

## Regla de oro

**No construir NADA que el trainer beta no necesite.**
Si no esta en este documento, no se toca este mes.

---

## Semana 1 (2-8 abril) — Hacer que funcione de verdad

### Prioridad maxima: abrir la app mobile
- [ ] Ejecutar `npx expo start` y abrir en iPhone con Expo Go
- [ ] Abrir en Android con Expo Go
- [ ] Probar login en mobile (email + password)
- [ ] Probar navegacion basica: dashboard → rutina → meals → chat
- [ ] Anotar TODO lo que falle o se vea roto

### Bugfixes criticos (web)
- [ ] Fix race condition en promo codes (crear RPC PostgreSQL atomico)
- [ ] Fix URLs hardcodeadas (`fit-os-web` vs `fitos-web`) → env var `NEXT_PUBLIC_BASE_URL`
- [ ] Fix error handling silencioso en `complete-registration`
- [ ] Fix Sentry `sendDefaultPii: true` en mobile

### Conectar APIs (solo configuracion, no codigo)
- [ ] Configurar `ANTHROPIC_API_KEY` en Supabase secrets
- [ ] Verificar que las 4 Edge Functions IA responden (no mock)
- [ ] Configurar Resend: verificar dominio + API key + descomentar codigo
- [ ] Probar envio de email de cita real

### Verificar datos iniciales
- [ ] Confirmar que existe seed de ejercicios globales (800+)
- [ ] Confirmar que existe seed de alimentos globales (120+)
- [ ] Si no existen, crearlos o importarlos

### Probar flujo completo en web
- [ ] Registro trainer → onboarding → dashboard
- [ ] Crear formulario de onboarding personalizado
- [ ] Crear rutina y asignar a cliente (ficticio)
- [ ] Crear menu y asignar a cliente
- [ ] Chat trainer → cliente funciona en tiempo real

---

## Semana 2 (9-15 abril) — Mobile real en dispositivos

### Compilar y probar en dispositivos reales
- [ ] App abre sin crash en iPhone
- [ ] App abre sin crash en Android
- [ ] Login funciona en ambos dispositivos
- [ ] Dashboard carga datos correctamente

### Probar flujos del cliente en mobile
- [ ] Registro cliente con codigo promo
- [ ] Onboarding: rellenar formulario del trainer
- [ ] Ver rutina asignada (cards de ejercicios, series, reps)
- [ ] Modo "Registrar sesion" funciona (tabla con ejercicios)
- [ ] Modo "Entrenar en activo" funciona (exercise-by-exercise + timer)
- [ ] Ver menu asignado
- [ ] Chat con trainer en tiempo real
- [ ] Citas: ver y agendar

### Push notifications
- [ ] Configurar Expo Notifications (o OneSignal)
- [ ] Notificacion cuando trainer asigna rutina
- [ ] Notificacion cuando trainer envia mensaje
- [ ] Notificacion de recordatorio de cita

### Fix de bugs encontrados en dispositivo
- [ ] (Se llenara durante las pruebas)

---

## Semana 3 (16-22 abril) — Offline + pulido

### Modo offline (imprescindible)
- [ ] Instalar y configurar WatermelonDB
- [ ] Almacenar rutina activa en local al sincronizar
- [ ] Almacenar sesion en curso en local (sets, pesos, reps)
- [ ] Almacenar valores de sesion anterior (placeholders)
- [ ] Probar: modo avion → entrenar → completar sets → reconectar → datos suben
- [ ] Sync automatica cuando vuelve la conexion

### Pulido de experiencia
- [ ] Textos en español correctos (sin placeholders en ingles)
- [ ] Loading states en todas las pantallas (no pantallas en blanco)
- [ ] Mensajes de error claros para el usuario (no errores tecnicos)
- [ ] Iconos y navegacion coherentes en mobile
- [ ] Timer de descanso suena (con la app en background)

### Probar flujo completo end-to-end
- [ ] Trainer (web) crea rutina → cliente (mobile) la ve en <30 segundos
- [ ] Trainer envia mensaje → cliente recibe notificacion + ve mensaje
- [ ] Cliente completa sesion → trainer ve el historial en su panel
- [ ] Cliente sin wifi entrena → reconecta → datos aparecen para el trainer

---

## Semana 4 (23-29 abril) — Beta con trainer real

### Preparar para el trainer
- [ ] Crear cuenta de trainer real (no ficticia)
- [ ] Asegurar que el onboarding del trainer fluye sin errores
- [ ] Preparar codigo promo para sus clientes
- [ ] Verificar que la app esta disponible en Expo Go (o build)

### El trainer prueba
- [ ] Se registra solo (tu observas, no ayudas)
- [ ] Configura su formulario de onboarding
- [ ] Crea una rutina para un cliente
- [ ] Crea un menu para un cliente
- [ ] Invita a 2-3 clientes con codigo promo

### Los clientes prueban
- [ ] Se registran con codigo promo
- [ ] Rellenan onboarding en mobile
- [ ] Ven su rutina y entrenan (al menos 1 sesion real)
- [ ] Chatean con el trainer

### Tu trabajo
- [ ] Observar sin intervenir
- [ ] Anotar CADA punto de friccion, confusion o error
- [ ] Pedir feedback honesto al trainer: "¿Que necesitas cambiar para traer mas clientes?"
- [ ] Priorizar feedback para mayo

---

## Lo que NO se toca en abril

| Feature | Por que no |
|---------|-----------|
| Stripe | Tu trainer beta es gratis |
| Login Google/Apple | Email+password funciona |
| Marketplace | No hay contenido aun |
| CRM | El trainer tiene 2-3 clientes, no necesita pipeline |
| Blog publico | Primero que use la comunidad privada |
| Ligas | Necesita mas de 5 clientes para tener sentido |
| Contratos | El trainer usa su sistema actual |
| Foto nevera / video buffet | El tracker de calorias basico ya existe |
| Wearables | Nice-to-have, no bloqueante |
| Outlook / Apple Calendar | Google Calendar cubre |
| Rebrand a Kuvox | Dominios y branding despues |
| i18n | Todo en español, tu mercado |

---

## Metricas de exito de abril

```
✓ La app mobile abre sin crash en iPhone y Android
✓ Un trainer real ha creado al menos 1 rutina y 1 menu
✓ Al menos 2 clientes reales han completado 1 sesion de entrenamiento
✓ El chat funciona en tiempo real (web ↔ mobile)
✓ El modo offline funciona (entrenar sin wifi)
✓ Las Edge Functions IA responden con datos reales (no mocks)
✓ Tienes una lista concreta de feedback del trainer para mayo
```

---

## Contacto con el trainer

Antes de la semana 4, habla con tu trainer y preguntale:

1. "¿Que es lo MINIMO que necesitas para probar esto con 2-3 clientes?"
2. "¿Que usas hoy para gestionar a tus clientes?" (para saber que reemplazas)
3. "¿Que te frustra de lo que usas ahora?" (para saber que dolor resuelves)

Sus respuestas valen mas que cualquier documento de vision.

---

*Actualizar este documento cada domingo con el progreso real de la semana.*
