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

### Modelo: precio por cliente, todo incluido

**Filosofia: "4,90€ por cliente. Todo incluido. Sin sorpresas."**

No hay tiers, no hay add-ons, no hay features bloqueadas. Cada trainer paga por el numero de clientes activos que tenga. El precio baja a medida que crece.

### Tabla de precios (escalonado)
```
Primeros 2 clientes:    GRATIS (sin limite de tiempo)
3 - 25 clientes:        4,90€/cliente/mes
26 - 75 clientes:       3,90€/cliente/mes
76 - 150 clientes:      2,90€/cliente/mes
150+:                   Contactar (precio custom)
```

### Ejemplos reales
| Clientes activos | Coste mensual | % de facturacion (si cobra 150€/cliente) |
|-----------------|---------------|------------------------------------------|
| 2 | 0€ | 0% |
| 10 | 39,20€ | 2.6% |
| 25 | 112,70€ | 3% |
| 50 | 210,20€ | 2.8% |
| 100 | 356,70€ | 2.4% |

### Que incluye (TODO, sin excepciones)
- Gestion de clientes
- Rutinas con progresion semanal y mesociclos
- Planificacion nutricional
- Chat en tiempo real
- Citas y calendario
- Comunidad privada
- IA: generacion de rutinas, analisis de comida, foto de nevera, video buffet
- Wearables (sueno, pasos, FC)
- Contratos digitales
- Consultas/tickets
- App mobile para los clientes
- Modo offline para clientes

### Marketplace (unica excepcion)
- Comision Kuvox: 15-20% por venta de rutinas
- No es suscripcion, es porcentaje de lo que el trainer gana
- Natural y esperado (modelo Amazon/Gumroad)

### Por que NO add-ons
- Add-ons generan desconfianza ("¿cuanto voy a acabar pagando?")
- Los trainers comparan precio base y ignoran el coste real con add-ons
- Todo incluido = transparencia = confianza = menos churn = mas recomendaciones

### Implementacion tecnica (Stripe)
- Stripe metered billing con graduated pricing (tiers escalonados)
- Backend cuenta clientes activos por trainer mensualmente
- Reporta usage a Stripe via API → Stripe calcula y cobra automaticamente
- Checkout session para alta
- Portal de facturacion (Stripe Customer Portal)
- Webhooks para eventos (pago exitoso, fallo, cancelacion)
- UI en settings del trainer: clientes activos, coste actual, historial

### API Routes necesarias
- `/api/stripe/checkout` — crear sesion de pago
- `/api/stripe/webhook` — recibir eventos de Stripe
- `/api/stripe/portal` — redirigir al portal de facturacion
- `/api/stripe/usage` — reportar clientes activos

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

## 12. Modo offline (imprescindible)

### El problema
Los gimnasios tienen mala cobertura movil (sotanos, estructuras metalicas). Un cliente que no puede entrenar porque la app necesita internet = desinstala la app.

### La solucion: local-first con WatermelonDB

La app SIEMPRE lee de la base de datos local (SQLite via WatermelonDB). Nunca directamente de Supabase. La sincronizacion ocurre en background cuando hay conexion.

### Flujo
```
CON INTERNET (wifi, casa, vestuario):
  App sincroniza → descarga rutina del dia/semana → guarda en local

SIN INTERNET (gimnasio, sotano, zona sin cobertura):
  App lee de local → cliente entrena normal → guarda sets en local

CUANDO VUELVE INTERNET (automatico):
  App detecta conexion → sube todo a Supabase → trainer lo ve
```

### Que se almacena en local
```
Prioridad alta (imprescindible para entrenar offline):
├── Rutina activa completa (ejercicios, series, config semanal)
├── Sesion en curso (sets completados, pesos, reps, RPE, RIR)
├── Valores de la sesion anterior (para placeholders)
└── Timer de descanso

Prioridad media (mejora la experiencia offline):
├── Menu del dia (para consultar entre series)
├── Historial reciente (ultimas 2-3 sesiones)
└── Perfil del cliente (macros objetivo, preferencias)

NO se almacena (requiere internet):
├── Chat con trainer
├── Comunidad
├── IA (analisis de fotos, generacion)
└── Citas y calendario
```

### Tecnologia: WatermelonDB
- SQLite por debajo (rendimiento nativo)
- API en JavaScript (no escribes SQL)
- Sync engine built-in que resuelve conflictos automaticamente
- Observables reactivos (UI se actualiza sola cuando cambian datos locales)
- Lazy loading (no carga todo en memoria)

### Resolucion de conflictos
```
Regla simple: la sesion en curso del cliente SIEMPRE gana.

- Cliente empieza sesion offline con rutina v1
- Trainer modifica rutina a v2
- Cliente termina y sincroniza
- Resultado: la sesion se guarda con los datos de v1
- La PROXIMA sesion usara v2
```

### Impacto en la experiencia
| Situacion | Sin offline | Con offline |
|-----------|-------------|-------------|
| Gym sin cobertura | App no carga, frustracion | Entrena normal |
| Metro/avion | No puede ni consultar rutina | Ve su rutina, puede entrenar |
| Wifi lento del gym | Spinners, timeouts | Instantaneo |

---

## 13. Flywheel del negocio

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

## 14. Orden de ejecucion

| Fase | Que | Prioridad | Complejidad |
|------|-----|-----------|-------------|
| 1 | Bugfixes y estabilizacion | Critica | Baja-media |
| 2 | Conectar APIs existentes (Anthropic, Google Calendar, Resend) | Critica | Baja (solo config) |
| 3 | Login con Google + Apple | Alta | Media |
| 4 | Stripe (pagos por cliente, metered billing) | Alta | Alta |
| 5 | Modo offline (WatermelonDB + sync) | Alta | Alta |
| 6 | Wearables (HealthKit + Health Connect) | Media | Media |
| 7 | IA comida avanzada (foto nevera + video buffet) | Media | Media |
| 8 | Gestion de contratos | Media | Media-alta |
| 9 | Marketplace de rutinas + formato .kuvox | Media | Alta |
| 10 | Outlook Calendar + Apple Calendar | Baja | Media-alta |
| 11 | Rebrand FitOS → Kuvox | Cuando dominios listos | Media |

---

## 15. Decisiones de negocio clave

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
| Pricing | Por cliente activo, todo incluido. 4,90€ (3-25), 3,90€ (26-75), 2,90€ (76-150). 2 gratis |
| Add-ons | NO. Todo incluido en el precio. Unica excepcion: comision marketplace 15-20% |
| Offline | Imprescindible. WatermelonDB (SQLite) local-first. Sync automatica |

---

## 16. Competencia y diferenciacion

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
6. **Modo offline** — entrena sin internet, sincroniza despues. Ningun competidor en español lo tiene bien resuelto
7. **Precio por cliente** — sin tiers confusos, paga por lo que usa, todo incluido

---

*Este documento es la fuente de verdad de la vision de producto de Kuvox. Actualizar conforme se tomen nuevas decisiones.*
