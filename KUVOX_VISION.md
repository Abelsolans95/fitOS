# Kuvox — Vision completa del producto

> Documento generado el 2 de abril de 2026
> Resumen de todas las decisiones de producto y negocio definidas.

---

## 1. Rebrand

| Actual | Nuevo |
|--------|-------|
| FitOS | **Kuvox** |
| — | kuvox.io → B2B (entrenadores personales) |
| — | kuvox.app → B2C (usuarios sin entrenador, futuro) |
| — | Intentar comprar kuvox.com (no urgente, el .io y .app son suficientes) |
| — | Asegurar @kuvox en Instagram, Twitter/X, TikTok |
| — | Registrar marca en OEPM / EUIPO cuando haya revenue |

---

## 2. Estabilizacion del producto actual

### Bugs criticos
- Race condition en incremento de promo codes (read-then-write no atomico) → crear RPC PostgreSQL atomico
- URLs hardcodeadas e inconsistentes en web (`fit-os-web` vs `fitos-web`) → mover a env var `NEXT_PUBLIC_BASE_URL`
- Error handling silencioso en `complete-registration` (devuelve 200 aunque falle el promo code)
- Sentry con `sendDefaultPii: true` en mobile → desactivar o documentar implicaciones GDPR
- Error handling faltante en pantallas mobile (citas, calorias, progreso)

### Bugs medios
- Eliminar debug overlays en AnatomyMap
- Reducir uso excesivo de `any` types en mobile
- Crear `.env.example` documentando todas las variables requeridas
- Estandarizar manejo de errores en todas las pantallas mobile

---

## 3. Autenticacion social

| Proveedor | Web | Mobile | Notas |
|-----------|-----|--------|-------|
| Google Sign-In | Supabase Auth + boton en login/register | Expo AuthSession + Google provider | Reutilizar Google OAuth ya configurado para Calendar |
| Apple Sign-In | Supabase Auth + boton en login/register | `expo-apple-authentication` | Obligatorio para App Store si ofreces login social |

- Linking de cuentas: si el email ya existe, mergear automaticamente
- Mantener email/password como opcion (no eliminar)

---

## 4. Pagos con Stripe

### Planes
| Plan | Precio (orientativo) | Limite clientes | Features |
|------|---------------------|-----------------|----------|
| Starter | 19€/mes | 15 clientes | Core features |
| Pro | 49€/mes | 75 clientes | + IA avanzada, community, analytics |
| Elite | 99€/mes | Ilimitado | + marketplace, white-label, prioridad soporte |

### Implementacion
- Checkout session para suscripcion
- Portal de facturacion (Stripe Customer Portal)
- Webhooks para eventos (pago exitoso, fallo, cancelacion)
- Enforcement real del trial de 14 dias (bloqueo UI si no paga)
- UI en settings del trainer: plan actual, boton upgrade, historial de facturas
- Comision sobre ventas del marketplace: 15-20%

### API Routes necesarias
- `/api/stripe/checkout` — crear sesion de pago
- `/api/stripe/webhook` — recibir eventos de Stripe
- `/api/stripe/portal` — redirigir al portal de facturacion

---

## 5. Conectar APIs existentes (ya codificadas, solo falta config)

| Integracion | Estado del codigo | Que falta para activar |
|-------------|-------------------|----------------------|
| Anthropic (4 Edge Functions IA) | 100% implementado | Configurar `ANTHROPIC_API_KEY` en Supabase secrets |
| Google Calendar | 100% implementado (OAuth + sync) | Crear credenciales en Google Cloud Console, configurar env vars |
| Resend (emails de citas) | Templates HTML listos, envio stubbed | Verificar dominio en Resend, configurar API key, descomentar ~10 lineas |

### Edge Functions IA disponibles
1. `analyze-food-image` — foto de comida → calorias + macros estimados
2. `generate-meal-plan` — datos cliente → plan nutricional semanal
3. `generate-gym-routine` — objetivo + nivel → rutina periodizada
4. `analyze-onboarding-form` — respuestas onboarding → informe para el trainer

---

## 6. Nuevas integraciones de calendario

| Calendario | API | Complejidad |
|------------|-----|-------------|
| Google Calendar | Ya implementado (OAuth 2.0) | Solo config |
| Outlook Calendar | Microsoft Graph API | Media (3-4 dias) |
| Apple Calendar (iCloud) | CalDAV server-side | Alta (requiere server proxy) |

- Sincronizacion bidireccional de citas trainer-cliente
- El trainer elige que calendarios sincronizar desde Settings

---

## 7. Gestion de contratos

### Modelo de datos
```
Tabla: contracts
- trainer_id (FK)
- client_id (FK)
- title (TEXT)
- content (TEXT o rich text)
- template_id (FK nullable, para plantillas)
- status: draft | sent | viewed | signed | expired
- signed_at (TIMESTAMPTZ)
- signature_data (TEXT, base64 del canvas)
- signer_ip (TEXT)
- pdf_url (TEXT, link al PDF generado)
```

### Flujo
1. Trainer crea contrato (desde plantilla o desde cero)
2. Trainer envia al cliente
3. Cliente recibe notificacion (in-app + email)
4. Cliente lee y firma digitalmente (canvas signature)
5. Se genera PDF con firma, timestamp e IP
6. Ambas partes pueden descargar el PDF firmado

### Almacenamiento
- Bucket `contracts` en Supabase Storage
- PDFs generados server-side con la firma embebida

---

## 8. IA de comida avanzada

### Feature 1: Foto de nevera
- Cliente fotografía su nevera
- Claude Vision identifica todos los ingredientes visibles
- Contexto enviado: macros objetivo del dia, lo ya comido hoy, preferencias alimentarias, restricciones
- Respuesta: 2-3 opciones de receta/menu que cumplan los macros pendientes con esos ingredientes
- UI: pantalla dedicada en la seccion de nutricion del cliente

### Feature 2: Video de buffet
- Cliente graba un buffet (restaurante, hotel, evento)
- Se extraen frames clave del video (1 frame/segundo aprox)
- Claude Vision identifica las opciones de comida disponibles
- Contexto: mismos datos que foto nevera
- Respuesta: recomendacion del plato optimo + cantidades aproximadas
- UI: misma pantalla, toggle foto/video

### Edge Function nueva
- `suggest-meal-from-image` — recibe imagen(es) + macros restantes → devuelve sugerencia personalizada
- Reutiliza la infraestructura de `analyze-food-image` pero con prompt diferente (sugerir vs analizar)

---

## 9. Marketplace de rutinas

### Modelo
- Trainers publican rutinas como productos digitales
- Cualquier trainer puede publicar (con o sin clientes activos en Kuvox)
- Usuarios sin registro pueden ver el catalogo y comprar
- Comision Kuvox: 15-20% por venta

### Producto entregado
- **PDF** — rutina maquetada con branding Kuvox (marca de agua sutil)
- **Archivo .kuvox** — JSON con la estructura de la rutina, importable en la app

### Importante
- La compra es SOLO el producto digital (PDF/Excel)
- NO incluye servicio de seguimiento ni acceso a features premium
- Si el comprador quiere tracking interactivo en la app → paga suscripcion aparte
- Upsell natural: email post-compra invita a usar kuvox.app

### Catalogo
- URL publica: `kuvox.io/marketplace`
- Categorias: hipertrofia, fuerza, perdida de peso, funcional, calistenia, etc.
- Cada rutina es una landing page SEO-indexable
- Futuro: packs (rutina + menu), planes de 12 semanas, programas completos

### Control de calidad (opciones)
- Fase 1: curated (aprobacion manual antes de publicar)
- Fase 2: review system (compradores valoran, las mejores suben)
- Badge "Trainer verificado" para trainers con clientes activos

---

## 10. Formato .kuvox

### Que es
Un archivo JSON renombrado con extension `.kuvox` que contiene la estructura completa de una rutina compatible con Kuvox.

### Estructura
```json
{
  "kuvox_version": "1.0",
  "type": "routine",
  "license": "KVX-a8f3-b2c1-d4e5",
  "buyer_id": "user_uuid",
  "metadata": {
    "title": "PPL Hipertrofia 12 Semanas",
    "author": "Carlos Martinez",
    "author_id": "trainer_uuid",
    "goal": "hipertrofia",
    "total_weeks": 12,
    "training_days": ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
  },
  "exercises": [
    {
      "day_of_week": 0,
      "day_label": "Push",
      "name": "Press Banca",
      "sets": 4,
      "reps": 8,
      "rir": 2,
      "rest_seconds": 120,
      "sets_config": [],
      "weekly_config": {}
    }
  ]
}
```

### Metodos de importacion (por prioridad)
1. **Deep link** (MVP) — `https://kuvox.io/import?file=ENCRYPTED_ID` → abre app → rutina importada automaticamente
2. **File association** (fase 2) — extension `.kuvox` registrada en iOS/Android, tocar archivo abre Kuvox
3. **Upload manual** (fallback) — boton "Importar rutina" en la app → seleccionar archivo

### Proteccion anti-pirateria
- Campo `license_key` validado por backend al importar
- Limite de activaciones por licencia
- No es infalible pero disuade al 95%

---

## 11. Wearables y datos de salud (gratis)

### Arquitectura
```
Garmin/Fitbit/Oura/Whoop/Samsung → sus apps → Health Connect (Android)
Apple Watch/Oura (iOS) → automatico → HealthKit (iOS)
Kuvox app → lee de HealthKit / Health Connect → Supabase
```

### Librerias (open source, coste 0)
| Plataforma | Libreria |
|------------|----------|
| iOS | `react-native-health` (HealthKit) |
| Android | `react-native-health-connect` |

### Datos capturados
- Horas de sueno (inicio, fin, fases ligero/profundo/REM)
- Pasos diarios
- Frecuencia cardiaca (reposo, media, maxima)
- Calorias quemadas activas
- SpO2 (saturacion oxigeno)
- Distancia recorrida
- Entrenamientos registrados externamente

### Dispositivos cubiertos (via HealthKit / Health Connect)
Apple Watch, Garmin (todos), Oura Ring, Samsung Galaxy Watch, Fitbit, Whoop, Polar, Coros, Suunto, Xiaomi Band, Huawei Band, Amazfit, Google Pixel Watch

### Uso inteligente de los datos
- Sueno < 6h → sugerir al cliente bajar intensidad, notificar al trainer
- Pasos diarios → ajustar TDEE real (no estimado con formula)
- FC reposo elevada → indicador de fatiga, recomendar dia de descarga
- Correlacion sueno-rendimiento → graficas para el trainer
- Tendencias semanales → alertas automaticas al trainer si algo cambia

### Sincronizacion
- MVP: al abrir la app (suficiente para sueno + pasos diarios)
- Fase 2: background fetch (iOS cada ~15 min, Android via WorkManager)

---

## 12. Flywheel del negocio

```
                    ┌─────────────────────────────┐
                    │  Trainer sube rutinas al     │
                    │  marketplace (gratis)        │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  Usuario compra rutina       │
                    │  (PDF/Excel) → Kuvox cobra   │
                    │  comision 15-20%             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  Email post-compra:          │
                    │  "Descarga kuvox.app para    │
                    │  seguimiento interactivo"    │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  Usuario prueba la app       │
                    │  gratis 14 dias              │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  En la app: "¿Quieres un     │
                    │  trainer personalizado?"     │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  Usuario contrata trainer    │
                    │  → trainer paga suscripcion  │
                    │  Kuvox Pro                   │
                    └──────────────┬──────────────┘
                                   │
                                   └──────► Repeat
```

---

## 13. Orden de ejecucion

| Fase | Que | Prioridad | Complejidad |
|------|-----|-----------|-------------|
| 1 | Bugfixes y estabilizacion | Critica | Baja-media |
| 2 | Conectar APIs existentes (Anthropic, Google Calendar, Resend) | Critica | Baja (solo config) |
| 3 | Login con Google + Apple | Alta | Media |
| 4 | Stripe (pagos y suscripciones) | Alta | Alta |
| 5 | Wearables (HealthKit + Health Connect) | Media | Media |
| 6 | IA comida avanzada (foto nevera + video buffet) | Media | Media |
| 7 | Gestion de contratos | Media | Media-alta |
| 8 | Marketplace de rutinas + formato .kuvox | Media | Alta |
| 9 | Outlook Calendar + Apple Calendar | Baja | Media-alta |
| 10 | Rebrand FitOS → Kuvox | Cuando dominios listos | Media |

---

## 14. Decisiones de negocio clave

| Decision | Resolucion |
|----------|-----------|
| Nombre | Kuvox |
| Dominios | kuvox.io (B2B) + kuvox.app (B2C) |
| kuvox.com no disponible | No es bloqueante. Intentar compra, avanzar sin el |
| Marketplace: que se vende? | Producto digital (PDF/Excel), NO servicio |
| Marketplace: upsell a app? | Si, pero como compra separada. Sin presion |
| Wearables: build vs buy? | Build (HealthKit + Health Connect). Gratis, cubre 95%+ |
| IA comida: alcance | Foto nevera + video buffet → sugerencia contextualizada con macros |
| Contratos: firma digital | Canvas signature + timestamp + IP. No firma electronica avanzada (fase futura) |

---

## 15. Competencia y diferenciacion

| Competidor | Que hace | Que NO hace (y Kuvox si) |
|------------|----------|--------------------------|
| Trainerize | Gestion de clientes | Sin IA, sin marketplace, sin wearables integrados, solo ingles |
| TrueCoach | Rutinas + comunicacion | Sin nutricion IA, sin marketplace, solo ingles |
| Hevy | Tracking de entrenamientos | Solo B2C, sin gestion trainer, sin IA |
| MyFitnessPal | Tracking nutricional | Sin trainers, sin rutinas, sin marketplace |

### Diferenciadores unicos de Kuvox
1. **IA real** — vision calorica, rutinas generadas, analisis de nevera/buffet
2. **Mercado hispano** — producto completo en espanol (competidores serios son en ingles)
3. **Marketplace de rutinas** — trainers venden sin necesidad de gestionar clientes
4. **Wearables integrados** — datos de sueno/pasos/FC que afectan las recomendaciones de entrenamiento
5. **Formato .kuvox** — rutinas portables e importables con 1 click

---

*Este documento es la fuente de verdad de la vision de producto de Kuvox. Actualizar conforme se tomen nuevas decisiones.*
