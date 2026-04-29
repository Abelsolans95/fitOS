# Kuvox — Vision completa del producto

> Documento generado el 2 de abril de 2026
> Resumen de todas las decisiones de producto y negocio definidas.

---

## 1. Rebrand - realizado (parcial: solo nombre)

| Actual | Nuevo |
|--------|-------|
| FitOS | **Kuvox** |
| — | kuvox.io → B2B (entrenadores personales) |
| — | kuvox.app → B2C (usuarios sin entrenador, futuro) |
| — | Intentar comprar kuvox.com (no urgente, el .io y .app son suficientes) |
| — | Asegurar @kuvox en Instagram, Twitter/X, TikTok |
| — | Registrar marca en OEPM / EUIPO cuando haya revenue |

### ✅ Realizado
- Renombrado "FitOS" → "Kuvox" en 20 archivos de UI (web landing, auth, dashboard, mobile)

### 📋 Pendiente por ti
- Comprar dominios kuvox.io y kuvox.app
- Asegurar @kuvox en redes sociales
- Registrar marca cuando haya revenue
- NO se cambiaron: nombres de paquetes (@kuvox/*), bundle IDs, import paths, env vars — esto se hace cuando los dominios estén listos

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

## 7. Gestion de contratos - realizado

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

### ✅ Realizado
- Migración 045: tablas `contract_templates` + `contracts` con RLS
- API routes: `/api/contracts` (CRUD) + `/api/contracts/sign` (firma con IP + timestamp)
- Web trainer: crear/editar contratos, plantillas reutilizables, ver firma
- Web client: ver contrato, firmar con canvas signature
- Tipos compartidos en `@kuvox/shared`
- Sidebar entries en trainer y client

### 📋 Pendiente por ti
- Aplicar migración `045_contracts.sql` en Supabase
- (Opcional) Generación de PDF server-side con firma embebida — actualmente se guarda signature_data en base64
- (Opcional) Crear bucket `contracts` en Supabase Storage para PDFs

---

## 8. IA de comida avanzada - realizado

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

### ✅ Realizado
- Edge Function `suggest-meal-from-image` creada (Claude Vision, 2-3 sugerencias con macros restantes)
- Web: sistema 3 tabs en página de calorías (Analizar / Foto nevera / Video buffet)
  - Fridge: drag-drop imagen, ingredientes identificados, sugerencias macro-aware con guardar en log
  - Buffet: upload de video, extracción de frames client-side (canvas + pixel variance), análisis
- Mobile: toggle 3 modos en CaloriesScreen (Analizar / Mi nevera / Buffet)
  - Fridge: cámara/galería via expo-image-picker, tarjetas de sugerencia con guardar
  - Buffet: foto de buffet, análisis y recomendaciones
- Macros restantes calculados de `meal_plans.target_kcal` - totales de `food_log` del día
- Sugerencias guardadas con `source: "ai_suggestion"` para diferenciación

### 📋 Pendiente por ti
- Configurar ANTHROPIC_API_KEY en Supabase: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx`
- Deploy de la nueva Edge Function: `supabase functions deploy suggest-meal-from-image --project-ref rgrtxlciqmexdkxagomo`
- Sin la API key la función retorna 503 con mensaje explicativo

---

## 9. Marketplace de rutinas - realizado

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

### ✅ Realizado
- Migración 046: tablas `marketplace_products` + `marketplace_purchases` con RLS
- Catálogo público en `/marketplace` (sin auth requerida)
- Detalle de producto con descarga en formato `.kuvox`
- Web trainer: publicar rutinas como productos, gestión de productos
- API routes: `/api/marketplace` (catálogo público) + `/api/marketplace/publish` (trainer)
- `lib/kuvox-format.ts`: generación de archivos .kuvox
- Sidebar entry "Marketplace" en trainer

### 📋 Pendiente por ti
- Aplicar migración `046_marketplace.sql` en Supabase
- Integrar Stripe para pagos reales (actualmente el flujo de compra es placeholder)
- Comisión Kuvox 15-20% pendiente de implementar con Stripe Connect
- Aprobación manual de productos (actualmente status draft→published sin review)

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

## 12. Modo offline (imprescindible) - realizado

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

### ✅ Realizado
- Schema WatermelonDB: 6 tablas (routines, workout_sessions, weight_log, meal_plans, profiles_cache, sync_metadata)
- Models: Routine, WorkoutSession, WeightLog con decorators via dynamic import
- Database: SQLite adapter singleton con graceful degradation si módulo nativo ausente
- Sync bidireccional: pull rutinas/planes de Supabase, push workout data. Client wins on conflict
- Hook `useOffline`: isOnline, isSyncing, lastSyncAt, pendingChanges, syncNow
- `OfflineContext` + `OfflineProvider`: auto-sync en app focus y reconnect de red, banners offline/syncing
- App.tsx envuelto con OfflineProvider
- Todos los imports WatermelonDB/NetInfo usan `import()` dinámico en try/catch — safe en Expo Go

### 📋 Pendiente por ti
- Ejecutar `expo prebuild` + compilación nativa para que SQLite funcione de verdad
- Integrar en pantallas: RoutineScreen y ActiveTraining deben leer de DB local cuando offline
- Crear visor de meal plan offline
- Instalar paquetes: `npm install @nozbe/watermelondb @nozbe/with-observables @react-native-community/netinfo` en apps/mobile (si no están)

---

## 13. Flywheel del negocio

### Flywheel 1: Marketplace
```
Trainer sube rutina al marketplace (gratis)
  → Usuario compra rutina (PDF) → Kuvox cobra comision 15-20%
    → Email post-compra: "Descarga kuvox.app"
      → Usuario prueba la app gratis 14 dias
        → "¿Quieres trainer personalizado?"
          → Contrata trainer → trainer paga suscripcion
            → Repeat
```

### Flywheel 2: Contenido + SEO (NUEVO)
```
Trainer escribe post en su comunidad
  → Activa toggle "publicar al mundo"
    → Se genera pagina publica SEO-optimizada
      → Google indexa → alguien busca "rutina hipertrofia"
        → Encuentra el post en kuvox.io/t/carlosfit/...
          → Ve CTA "Entrenar con Carlos" → rellena formulario
            → Lead en CRM → trainer lo convierte en cliente
              → Trainer paga por cliente → Kuvox crece
                → Mas trainers publican → mas SEO → Repeat
```

### Flywheel 3: CRM + RRSS (NUEVO)
```
Trainer comparte link de su post/landing en Instagram/TikTok
  → Seguidor hace click → llega a kuvox.io/t/trainer
    → Rellena formulario → lead en CRM automaticamente
      → Follow-up email automatico a las 24h/3d/7d
        → Lead se convierte en cliente
          → Trainer publica caso de exito → mas seguidores → Repeat
```

### Los 3 flywheels se alimentan entre si
```
Marketplace genera compradores → algunos quieren trainer
Blog genera trafico SEO → CRM captura leads → se convierten en clientes
Clientes satisfechos → trainer publica resultados → mas leads
```

---

## 14. Perfil publico del trainer (landing auto-generada) - realizado

### Concepto
Cada trainer que se registra en Kuvox tiene automaticamente una landing publica. No la diseña nadie — se genera sola con los datos del onboarding.

### URL
```
kuvox.io/t/carlosfit       ← slug auto-generado, editable una vez
kuvox.io/t/saracoach
kuvox.io/t/javientrenador
```

### Contenido auto-generado
| Campo | De donde sale |
|-------|--------------|
| Nombre y foto | Perfil del trainer (onboarding) |
| Bio/descripcion | Campo editable en Settings |
| Especialidad | Seleccionada en el onboarding |
| Ubicacion | Perfil |
| Slug | Auto-generado del nombre, editable una vez |
| Color de acento (opcional) | Selector en Settings |

### Que incluye la landing
- Foto y datos del trainer
- Bio y especialidad
- Lista de servicios ("Rutina personalizada, Plan nutricional, Chat directo...")
- Formulario de contacto (nombre, email, objetivo) → lead cae en CRM
- Listado de articulos publicos (si tiene)
- Link a rutinas en el marketplace (si tiene)
- Badge "Powered by Kuvox"

### Fases de evolucion
```
Fase 1 (beta):      Landing auto-generada con datos del perfil. Sin personalizacion.
                     Todos tienen el mismo diseno, solo cambian los datos.
                     Incluye formulario → lead cae en CRM.

Fase 2 (post-beta):  El trainer puede editar textos, subir fotos extra,
                      elegir entre 3-4 plantillas de diseno.

Fase 3 (premium):    Landing Page Builder completo (drag & drop, bloques,
                      dominio propio carloscoach.com → proxy a kuvox.io/t/carlos).
```

### Ventaja SEO
Cada landing es una pagina indexada por Google. Con 100 trainers = 100 paginas posicionando por diferentes ciudades y especialidades. Los trainers generan SEO para Kuvox sin saberlo.

### ✅ Realizado
- Migración 047: `profiles.slug` (UNIQUE), `profiles.accent_color` (DEFAULT '#00E5FF')
- Ruta pública `/t/[slug]`: landing auto-generada con SEO (meta tags, og:image)
- Formulario de contacto → lead directo al CRM del trainer
- Listado de artículos públicos del trainer
- Settings del trainer: editor de slug (una vez) + color picker de acento
- Sitemap dinámico en `/sitemap.ts`

### 📋 Pendiente por ti
- Aplicar migración `047_public_profiles_blog_crm.sql` en Supabase
- Los trainers deben rellenar bio/especialidad en Settings para que la landing tenga contenido
- Fase 2 (plantillas de diseño) y Fase 3 (builder drag & drop) pendientes

---

## 15. Blog publico del trainer (posts de comunidad al mundo) - realizado

### Concepto
El trainer ya escribe posts para su Comunidad privada. Con un toggle, puede publicar cualquier post al mundo. Se genera una pagina publica SEO-optimizada automaticamente.

### Flujo
```
1. Trainer escribe post en su Comunidad (lo que ya hace hoy)
   "5 errores que cometes en press banca"

2. Ve un toggle: "Publicar tambien en mi perfil publico"
   [  ] Solo mi comunidad (privado, solo mis clientes)
   [✓] Tambien en mi perfil publico (visible para todos)

3. Al activarlo, se genera automaticamente:
   kuvox.io/t/carlosfit/5-errores-press-banca
```

### La pagina publica incluye
- Titulo y contenido del post (con imagen si tiene)
- Nombre, foto y badge del trainer
- Fecha de publicacion
- Listado "Mas articulos de [Trainer]"
- CTA: "¿Quieres entrenar con [Trainer]?" → formulario de contacto
- Meta tags SEO auto-generados (title, description, og:image)
- Schema markup (Article, Person)

### Estructura de URLs
```
kuvox.io/t/carlosfit                          ← landing del trainer
kuvox.io/t/carlosfit/5-errores-press-banca    ← articulo
kuvox.io/t/carlosfit/protocolo-nutricion      ← articulo
kuvox.io/t/carlosfit/mi-rutina-ppl-favorita   ← articulo (puede linkear al marketplace)
```

### Implementacion tecnica
```
Tabla: community_posts (ya existe)
  + campo: is_public (BOOLEAN, default false)
  + campo: slug (TEXT, auto-generado del titulo)
  + campo: meta_description (TEXT, primeros 160 chars del contenido)

Ruta nueva: /t/[trainer_slug]/[post_slug]
  → Server component (sin auth, pagina publica)
  → Lee community_posts WHERE is_public = true AND slug = post_slug
  → Renderiza con meta tags SEO

Sitemap: /sitemap.xml
  → Genera automaticamente con todos los posts publicos
  → Se actualiza diariamente
```

### Vinculacion con marketplace
Un post publico puede linkear a una rutina del marketplace:
```
Post: "Mi rutina PPL favorita para hipertrofia"
      → Al final: boton "Comprar esta rutina — 19€"
      → Link a la rutina en el marketplace
```
El contenido vende el producto. Funnel: articulo → confianza → compra.

### Impacto SEO
```
50 trainers × 2 posts/mes = 100 paginas nuevas/mes
En 1 año: 1200 paginas indexadas en Google
Cada pagina posiciona por keywords de fitness en espanol
Todo el trafico llega a Kuvox organicamente
```

### Fases
```
Fase 1:  Toggle "publicar al mundo" + pagina publica basica + SEO auto  ← REALIZADO
Fase 2:  Listado de articulos en landing del trainer  ← REALIZADO
Fase 3:  Vincular posts con rutinas del marketplace
Fase 4:  Analytics por post (visitas, clicks en CTA, leads generados)
```

### ✅ Realizado
- Migración 047: `community_posts.is_public`, `community_posts.slug`, `community_posts.meta_description`
- Toggle "Publicar en perfil público" en formulario de publicación de comunidad
- Ruta pública `/t/[slug]/[post_slug]` con SEO (meta tags, schema markup Article + Person)
- CTA "¿Quieres entrenar con [Trainer]?" en cada artículo público
- Listado de artículos en la landing del trainer
- Sitemap incluye artículos públicos

### 📋 Pendiente por ti
- Aplicar migración `047_public_profiles_blog_crm.sql` en Supabase (misma que punto 14)
- Fase 3: vincular posts con rutinas del marketplace
- Fase 4: analytics por post

---

## 16. CRM con captacion automatica desde RRSS - realizado (parcial: solo Fase 1)

### Concepto
El trainer gestiona potenciales clientes en un pipeline visual (Kanban). Los leads entran automaticamente desde redes sociales, formularios, y la landing publica. No hay que crear leads manualmente.

### Pipeline Kanban
```
NUEVO LEAD          CONTACTADO       INTERESADO       PRUEBA        CLIENTE
─────────────────────────────────────────────────────────────────────────────
Maria G.            Carlos R.        Ana P.           Javi M.       Lucia F.
📸 Instagram        📱 TikTok        💬 WhatsApp      🔗 Link bio
hace 2h             hace 1d          hace 3d          hace 5d
```

### Fuentes de leads (de mas facil a mas compleja)

**1. Link en bio + formulario (gratis, sin API externa)**
```
Instagram bio: "¿Quieres empezar? → kuvox.io/t/carlosfit"
  → Usuario rellena formulario
  → Lead en CRM, origen: "Landing"
```

**2. Post publico con CTA (gratis, sin API externa)**
```
Trainer comparte en Instagram: "Nuevo articulo → kuvox.io/t/carlosfit/mi-rutina-ppl"
  → Lector llega al post, ve CTA "Entrenar con Carlos"
  → Rellena formulario
  → Lead en CRM, origen: "Blog"
```

**3. Instagram DM Automation (Meta API, gratis)**
```
Alguien comenta "INFO" en un reel del trainer
  → Instagram envia DM automatico con link al formulario
  → Lead en CRM, origen: "Instagram DM"
```
El trainer configura: palabra clave trigger + mensaje automatico.

**4. Meta Lead Ads (Meta Ads API, gratis — trainer paga sus ads)**
```
Trainer pone anuncio en Instagram con formulario nativo
  → Meta pre-rellena nombre/email del usuario (alta conversion)
  → Webhook de Meta → API de Kuvox → lead en CRM
  → Origen: "Instagram Ads"
```

**5. TikTok Lead Generation (TikTok Marketing API)**
```
Mismo concepto que Meta Lead Ads pero en TikTok.
  → Origen: "TikTok Ads"
```

**6. WhatsApp Business API (futuro, ~0.05€/conversacion)**
```
Cliente potencial escribe al WhatsApp del trainer
  → Auto-respuesta con link al formulario
  → Lead en CRM, origen: "WhatsApp"
```

### Follow-up automatico
- Email automatico a las 24h: "Hola [nombre], gracias por tu interes..."
- Email a los 3 dias si no responde: "¿Tienes alguna duda?"
- Email a los 7 dias: "Ultima oportunidad para tu sesion de prueba gratis"
- El trainer puede personalizar los textos de cada email

### Metricas del CRM
- Tasa de conversion por etapa
- Origen de los leads (cual red social convierte mejor)
- Tiempo medio de conversion (lead → cliente)
- Revenue estimado por lead

### Fases de implementacion
```
Fase 1 (CRM basico):    Pipeline Kanban + formulario en landing + leads manuales  ← REALIZADO
Fase 2 (Automacion):    Instagram DM automation (Meta API) + Meta Lead Ads  ← PENDIENTE
Fase 3 (Expansion):     TikTok Lead Gen + follow-up email automatico  ← PENDIENTE
Fase 4 (Avanzado):      WhatsApp Business + analytics por fuente  ← PENDIENTE
```

### ✅ Realizado (Fase 1)
- Migración 047: tabla `leads` con source CHECK y status CHECK
- Pipeline Kanban visual con 6 columnas (nuevo, contactado, interesado, prueba, cliente, descartado)
- Formulario público en landing del trainer → lead automático con source "landing"
- CTA en artículos públicos → lead con source "blog"
- API route `/api/leads` con service_role para INSERT desde formularios públicos
- Sidebar entry "Leads" en trainer
- Creación manual de leads desde el panel

### 📋 Pendiente por ti
- Aplicar migración `047_public_profiles_blog_crm.sql` en Supabase
- **Punto 2**: Instagram DM automation (Meta API) — requiere app de Meta for Developers
- **Punto 3**: TikTok Lead Gen — requiere TikTok Marketing API
- **Punto 4**: Meta Lead Ads webhook
- **Punto 5**: Follow-up email automático — requiere Resend configurado
- **Punto 6**: WhatsApp Business API + analytics por fuente

---

## 17. Ligas y gamificacion - realizado

### Concepto
El trainer crea competiciones entre sus clientes para motivarlos. Rankings en tiempo real, badges de logros, y wall de actividad.

### Tipos de ligas
| Liga | Metrica | Ejemplo |
|------|---------|---------|
| Consistencia | % sesiones completadas | "Quien mas entrena en enero" |
| Volumen | Tonelaje total (peso × reps) | "Quien mas kilos mueve en 4 semanas" |
| Pasos | Pasos diarios (de wearables) | "Reto 10.000 pasos" |
| Sesiones | Numero total de sesiones | "Quien mas veces va al gym" |
| Personalizada | Cualquier metrica numerica | "Mejor marca en sentadilla" |

### Elementos
- **Ranking en tiempo real** — leaderboard visible para todos los participantes
- **Badges/logros** — "Racha de 7 dias", "Primera liga ganada", "Top 3 tres veces"
- **Wall de actividad** — feed con "Maria completo sesion de pierna", "Carlos nuevo PR"
- **Premios opcionales** — el trainer define el premio (sesion gratis, descuento, etc.)

### Por que funciona
- Competicion sana: los clientes se motivan entre ellos sin que el trainer persiga
- Retencion: un cliente en una liga tiene motivo para no dejar el gym esta semana
- Comunidad: los clientes sienten que forman parte de algo
- Contenido: "El ganador de la liga de enero es..." es un post para RRSS

### Estado actual
Las tablas de gamificacion ya existen en la DB. Falta la interfaz.

### ✅ Realizado
- Migración 048: tablas `leagues`, `league_participants`, `badges`, `user_badges` con RLS
- 8 badges seeded (racha_7, racha_30, first_league, top_3, champion, sessions_50, sessions_100, personal_record)
- Toggle `communities.gamification_enabled` para activar/desactivar
- Web trainer: crear/gestionar ligas, toggle gamificación, leaderboard, enroll masivo, gestión de estados (upcoming/active/completed)
- Web client: ver ligas, unirse, leaderboard, colección de badges. Oculto si gamificación desactivada
- Mobile: `LeaguesScreen.tsx` con tabs de ligas y badges, leaderboard, join. Condicional a gamification_enabled
- API routes: `/api/leagues` (CRUD), `/api/leagues/[id]/join`, `/api/leagues/[id]/leaderboard`
- Tipos compartidos en `@kuvox/shared`
- Sidebar entries en trainer y client + tab "Ligas" en mobile

### 📋 Pendiente por ti
- Aplicar migración `048_leagues_gamification.sql` en Supabase
- Scoring automático via Edge Function (actualmente manual)
- Otorgamiento automático de badges (actualmente hay que implementar la lógica de detección)
- Wall de actividad (feed con actividad de clientes)

---

## 18. Orden de ejecucion

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
| 9 | Perfil publico del trainer (landing auto-generada) | Media | Media |
| 10 | Blog publico (toggle en posts de comunidad) | Media | Media |
| 11 | CRM basico (pipeline + formulario en landing) | Media | Media-alta |
| 12 | Marketplace de rutinas + formato .kuvox | Media | Alta |
| 13 | Ligas y gamificacion (UI sobre tablas existentes) | Baja | Media |
| 14 | CRM avanzado (Meta API, TikTok, WhatsApp) | Baja | Alta |
| 15 | Outlook Calendar + Apple Calendar | Baja | Media-alta |
| 16 | Rebrand FitOS → Kuvox | Cuando dominios listos | Media |

---

## 19. Decisiones de negocio clave

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
| Landing del trainer | Auto-generada con datos del onboarding. Sin trabajo manual |
| Blog publico | Toggle en posts de comunidad. SEO automatico. No es un blog separado |
| CRM | Pipeline Kanban + captacion automatica desde RRSS. Leads no se crean manualmente |
| Ligas | Competiciones entre clientes del mismo trainer. Tablas existen, falta UI |

---

## 20. Competencia y diferenciacion

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
8. **Landing + blog auto-generado** — cada trainer tiene web propia sin saber codigo. SEO gratis para Kuvox
9. **CRM con captacion desde RRSS** — leads entran solos desde Instagram, TikTok, WhatsApp
10. **Ligas de gamificacion** — motivacion y retencion de clientes sin esfuerzo del trainer

---

*Este documento es la fuente de verdad de la vision de producto de Kuvox. Actualizar conforme se tomen nuevas decisiones.*
