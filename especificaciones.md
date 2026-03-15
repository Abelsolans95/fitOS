FitOS
La Plataforma SaaS Definitiva para Entrenadores y Clientes de Fitness
Product Requirements Document — Versión 5.0 · DEFINITIVO · Full-Stack + IA
Stack Web	Next.js 15 + TypeScript
App Móvil	React Native + Expo
IA Core	Gemini 2.0 Flash + GPT-4o
Base de Datos	Supabase PostgreSQL
Infraestructura	Vercel + AWS

2 Roles	Entrenador + Cliente con código promo
7 Fases	Setup → Escala global
19+ MCPs	Con urgencia y fase de activación
17+ Tablas Supabase	Con RLS y SQL completo
 
1. Visión del Producto
FitOS es una plataforma SaaS de nueva generación que unifica la gestión profesional del entrenador personal con la experiencia inmersiva del cliente. El entrenador dispone de herramientas completas para gestionar su negocio, crear contenido personalizado (menús, rutinas, formularios), realizar seguimiento avanzado de cada cliente y hacer crecer su marca. El cliente accede a toda la experiencia desde una app fluida con IA, modo offline, comandos de voz y sincronización biométrica.

Propuesta de valor dual
Para el ENTRENADOR: gestor de negocio completo + creación de menús y rutinas personalizadas con su propia biblioteca de alimentos y ejercicios + seguimiento de progreso con datos biométricos + herramientas de marketing y gamificación.
Para el CLIENTE: experiencia inmersiva guiada por el entrenador + IA visual para calorías + análisis biomecánico + calendario maestro + sección de progreso con fotos, medidas y peso + formulario de onboarding personalizado.

▌ 1.1. Sistema de Roles
Rol	Cómo accede	Qué ve al registrarse	Plan de precios
Entrenador (Trainer)	Registro estándar + selección de rol	Onboarding: nombre comercial, especialidad, foto, configuración del formulario de bienvenida para sus clientes, generación del código promo	Starter / Pro / Elite / Clínica
Cliente (Client)	Registro + rol + código promo obligatorio	Onboarding: rellenar el formulario personalizado del entrenador + datos físicos + preferencias alimentarias + conexión de wearable (opcional)	Incluido en el plan del entrenador

▌ 1.2. Flujo del Código Promocional
•	Al completar el onboarding, el entrenador recibe un código único de 8 caracteres alfanuméricos (ej: CARLOS-X7K2) generado automáticamente y visible en su área personal.
•	El cliente introduce el código como campo obligatorio al registrarse. El sistema valida el código en tiempo real (debounce 500ms).
•	Si es válido: el cliente queda vinculado al entrenador, se crea la fila en trainer_clients, se incrementa current_uses y se le presenta el formulario de onboarding configurado por el entrenador.
•	Si no es válido o está inactivo: error descriptivo, no se permite continuar el registro.
•	El entrenador puede ver, regenerar, desactivar o limitar el uso del código desde su área personal.
•	Límite de clientes por plan: 15 (Starter), 75 (Pro), ilimitado (Elite/Clínica).

 
2. Stack Tecnológico Completo
▌ 2.1. Frontend Web — Next.js 15
Tecnología	Versión	Propósito en FitOS
Next.js	15.x (App Router)	Framework principal: RSC para SEO, SSR para dashboards, Edge Functions para APIs
React	19.x	Server + Client Components; streaming SSR para la carga inicial
TypeScript	5.x	Tipado end-to-end con tRPC; tipos compartidos entre front y back
Tailwind CSS	4.x	Utility-first CSS con design tokens del sistema FitOS
shadcn/ui	Latest	Componentes accesibles (Radix UI); Combobox alimentos, formularios dinámicos
Aceternity UI	Latest	Spotlight (login), Vortex (dashboard), Bento Grid (calendario), Floating Navbar
Framer Motion	11.x	Transiciones, stagger de tarjetas, spring en checkboxes, skeletons
Zustand	4.x	Estado global: sesión, modo offline, configuración del entrenador
TanStack Query	5.x	Caché, sync background, optimistic updates para user_calendar.completed
tRPC	11.x	API type-safe end-to-end; procedimientos para cada módulo
Recharts	2.x	Gráficas de progreso, adherencia, histórico de pesos, macros nutricionales
cmdk	Latest	Command palette para combobox de alimentos y ejercicios
react-beautiful-dnd	Latest	Drag & drop para constructor de rutinas y ordenación de ejercicios
react-hook-form + zod	Latest	Formularios dinámicos configurables del entrenador con validación tipada
ical-generator	Latest	Generación de archivos .ics para Apple Calendar / Outlook
googleapis	Latest	Google Calendar API v3 para sincronización bidireccional

▌ 2.2. App Móvil — React Native + Expo
Tecnología	Versión	Propósito en FitOS
React Native + Expo	0.74+ / SDK 51	App nativa iOS + Android; comparte ~70% del código de lógica con la web
NativeWind	4.x	Tailwind CSS en React Native; mismo design system dark (#0A0A0F + #00E5FF)
React Native Reanimated	3.x	Animaciones nativas a 60fps; gestos de deslizamiento en el calendario
WatermelonDB	Latest	Base de datos local SQLite; modo offline completo
Expo Camera	Latest	Fotos para Calorie Tracker, Gym Scan y subida de fotos de progreso del cliente
Expo Speech + Whisper	Latest	Comandos de voz hands-free para registrar series y pesos
Expo Health	Latest	Integración con Apple HealthKit (iOS) y Google Fit (Android)
Expo Video	Latest	Reproducción de vídeos de ejercicios de la biblioteca del entrenador
MediaPipe Tasks Vision	0.10+	Computer Vision on-device para análisis biomecánico
Expo Notifications	Latest	Push notifications para recordatorios, ligas, alertas biométricas

▌ 2.3. Backend — Supabase + API Node.js
Tecnología	Versión	Propósito en FitOS
Supabase	Latest	Backend principal: PostgreSQL, Auth, Edge Functions, Realtime, Storage, Vault
Supabase Auth	Latest	Email+contraseña, OAuth Google+Apple, MFA TOTP; trigger handle_new_user()
Supabase Edge Functions	Latest	Deno runtime; Gemini 2.0 Flash + GPT-4o; lógica sin exponer API keys
Supabase Realtime	Latest	Subscripciones en tiempo real: historial de pesos, progreso del cliente, calendario
Supabase Storage	Latest	Vídeos de ejercicios del entrenador, fotos de progreso del cliente, logo del entrenador
Supabase Vault	Latest	Tokens OAuth cifrados de Google Calendar y wearables
Supabase RLS	Built-in	Row Level Security en todas las tablas
Node.js + Fastify	20 LTS / 4.x	API complementaria: RPE Engine, webhooks Stripe, wearables
BullMQ + Upstash Redis	5.x	Cola de trabajos asíncronos: análisis vídeo, sync wearables, Content Creator AI
Stripe SDK	Latest	Pagos, suscripciones, facturación automática
Prisma ORM	5.x	ORM para la API Node.js complementaria

▌ 2.4. Modelos IA Utilizados
Módulo	Modelo	Propósito
Vision Calorie Tracker	Gemini 2.0 Flash Vision	Identificar alimentos en foto y estimar porciones en gramos
Gym Scan & Routine Generator	Gemini 2.0 Flash Multimodal	Detectar equipamiento en hasta 6 fotos y generar rutina
Smart Meal Planner	Gemini 2.0 Flash	Generar plan nutricional con preferencias del cliente y biblioteca del entrenador
Análisis de Formulario de Onboarding	GPT-4o	Analizar las respuestas del cliente y generar informe estructurado para el entrenador
Coach Co-pilot (RPE Engine)	TensorFlow LSTM + GPT-4o	Predicción de ajuste de carga basado en RPE e historial
Computer Vision Biomecánica	MediaPipe + GPT-4o	Análisis de postura; feedback técnico escrito con vídeos del entrenador como referencia
AI Inbox	GPT-4o (LangChain)	Respuestas contextuales a preguntas del cliente con su plan actual
Weekly AI Summary	GPT-4o	Resumen semanal inteligente del entrenador por cliente
Content Creator AI	GPT-4o + DALL-E 3	Gráficas de progreso + captions para Instagram/TikTok/LinkedIn
Comandos de Voz	Web Speech API + Whisper	Registro hands-free de series, pesos y RPE

 
3. Arquitectura del Monorepo
fitos/
├── apps/
│   ├── web/          → Next.js 15 (dashboard entrenador + portal cliente)
│   ├── mobile/       → React Native + Expo (iOS y Android)
│   ├── landing/      → Next.js (marketing + SEO)
│   └── admin/        → Panel interno FitOS
│
├── packages/
│   ├── ui/            → Design system: shadcn + Aceternity + tokens
│   ├── db/            → Prisma schema + tipos Supabase generados
│   ├── ai/            → Módulos IA: RPE client, LLM wrappers, CV helpers
│   ├── auth/          → Lógica de autenticación + gestión de roles
│   ├── validations/   → Schemas Zod compartidos cliente + servidor
│   └── config/        → ESLint, TypeScript, Tailwind configs base
│
├── services/
│   ├── api/           → Fastify + tRPC: API Node.js complementaria
│   ├── ai-service/    → FastAPI Python: RPE Engine, Computer Vision, LLM
│   └── worker/        → BullMQ workers: sync wearables, Content Creator AI
│
├── supabase/
│   ├── functions/     → Edge Functions: analyze-food-image, generate-gym-routine, generate-meal-plan, analyze-onboarding-form, rpe-suggestion, cv-analyze, weekly-summary, content-creator, validate-promo-code
│   ├── migrations/    → SQL versionado: 17 tablas + RLS + índices + seeds
│   └── config.toml
│
└── infra/
    ├── terraform/    → IaC: AWS (ECS, S3, CloudFront, Route53)
    └── docker/       → Dockerfiles para servicios Python y Node.js

 
4. Esquema Completo de Base de Datos — Supabase PostgreSQL (17 Tablas)
Todas las tablas se crean mediante migraciones SQL versionadas en supabase/migrations/. RLS habilitado en todas las tablas. NUNCA se insertan datos de negocio desde el cliente; toda la información proviene de Supabase.

Principio de Arquitectura Inmutable
Sin datos estáticos. Toda la información mostrada en la aplicación debe provenir de Supabase. Queda prohibido el uso de arrays, objetos o constantes hardcodeadas como fuente de datos de negocio.

▌ 4.1. Tabla: user_roles
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
user_id	UUID FK → auth.users UNIQUE	Un rol por usuario
role	TEXT NOT NULL	'trainer' | 'client'
created_at	TIMESTAMPTZ	DEFAULT now()

-- 001_create_user_roles.sql
CREATE TABLE user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('trainer', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own role" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

▌ 4.2. Tabla: trainer_promo_codes
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
trainer_id	UUID FK → auth.users	Entrenador propietario
code	TEXT NOT NULL UNIQUE	8 chars alfanuméricos (ej: CARLOS-X7K2) generado con función PL/pgSQL
is_active	BOOLEAN DEFAULT true	El entrenador puede desactivarlo
max_uses	INTEGER DEFAULT NULL	NULL = ilimitado; según el plan del entrenador
current_uses	INTEGER DEFAULT 0	Contador atómico de usos
expires_at	TIMESTAMPTZ DEFAULT NULL	Expiración opcional
created_at	TIMESTAMPTZ	DEFAULT now()
updated_at	TIMESTAMPTZ	Trigger ON UPDATE

-- 002_create_trainer_promo_codes.sql
CREATE TABLE trainer_promo_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  max_uses     INTEGER DEFAULT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ DEFAULT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE OR REPLACE FUNCTION generate_promo_code(trainer_name TEXT) RETURNS TEXT AS $$
DECLARE base TEXT; suffix TEXT; candidate TEXT;
BEGIN
  base := UPPER(SUBSTRING(REGEXP_REPLACE(trainer_name,'[^A-Za-z]','','g'),1,6));
  LOOP
    suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT),1,4));
    candidate := base || '-' || suffix;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM trainer_promo_codes WHERE code = candidate);
  END LOOP; RETURN candidate;
END; $$ LANGUAGE plpgsql;
ALTER TABLE trainer_promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer manages own codes" ON trainer_promo_codes FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Client validates code" ON trainer_promo_codes FOR SELECT USING (is_active = true);

▌ 4.3. Tabla: trainer_clients
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
trainer_id	UUID FK → auth.users	El entrenador
client_id	UUID FK → auth.users	El cliente vinculado
promo_code_id	UUID FK → trainer_promo_codes	Código usado en el registro
status	TEXT DEFAULT 'active'	'active' | 'paused' | 'cancelled'
joined_at	TIMESTAMPTZ	DEFAULT now()
notes	TEXT DEFAULT NULL	Notas privadas del entrenador
UNIQUE	(trainer_id, client_id)	Un cliente no puede estar duplicado

-- 003_create_trainer_clients.sql
CREATE TABLE trainer_clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES trainer_promo_codes(id),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes         TEXT DEFAULT NULL,
  UNIQUE (trainer_id, client_id)
  );
ALTER TABLE trainer_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer sees own clients" ON trainer_clients FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Client sees own record" ON trainer_clients FOR SELECT USING (auth.uid() = client_id);

▌ 4.4. Tabla: profiles
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
user_id	UUID FK → auth.users UNIQUE	Un perfil por usuario
role	TEXT NOT NULL	'trainer' | 'client'
full_name	TEXT	Nombre completo
avatar_url	TEXT DEFAULT NULL	URL en Supabase Storage
bio	TEXT DEFAULT NULL	Descripción profesional (entrenador) o personal (cliente)
height	NUMERIC(5,2) DEFAULT NULL	Altura en cm (cliente)
weight	NUMERIC(5,2) DEFAULT NULL	Peso en kg (cliente)
goal	TEXT DEFAULT NULL	'hipertrofia' | 'fuerza' | 'perdida_peso' | 'mantenimiento'
food_preferences	JSONB DEFAULT '{}'	Preferencias alimentarias del cliente: {liked_food_ids[], disliked_foods[], allergies[], dietary_restrictions[]}
business_name	TEXT DEFAULT NULL	Nombre comercial del entrenador
specialty	TEXT DEFAULT NULL	Especialidad del entrenador
stripe_customer_id	TEXT DEFAULT NULL	ID cliente Stripe
stripe_subscription_id	TEXT DEFAULT NULL	ID suscripción Stripe activa
plan	TEXT DEFAULT 'starter'	'starter' | 'pro' | 'elite' | 'clinica'
created_at	TIMESTAMPTZ	DEFAULT now()
updated_at	TIMESTAMPTZ	Trigger ON UPDATE

-- 004_create_profiles.sql
CREATE TABLE profiles (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role                   TEXT NOT NULL CHECK (role IN ('trainer','client')),
  full_name              TEXT,
  avatar_url             TEXT,
  bio                    TEXT,
  height                 NUMERIC(5,2),
  weight                 NUMERIC(5,2),
  goal                   TEXT CHECK (goal IN ('hipertrofia','fuerza','perdida_peso','mantenimiento')),
  food_preferences       JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_name          TEXT,
  specialty              TEXT,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  plan                   TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','elite','clinica')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, role, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Trainer views client profile" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = profiles.user_id));

▌ 4.5. Tabla: onboarding_forms (Formularios del Entrenador)
El entrenador configura un formulario personalizado que todos sus clientes deben rellenar al registrarse con su código. El entrenador puede tener un formulario por defecto que se aplica a todos sus nuevos clientes.
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
trainer_id	UUID FK → auth.users UNIQUE	Un formulario activo por entrenador (puede versionarse)
title	TEXT NOT NULL	Título del formulario (ej: "Cuestionario inicial de Juan García PT")
description	TEXT DEFAULT NULL	Descripción o instrucciones para el cliente
fields	JSONB NOT NULL	Array de campos: [{id, type, label, required, options[], placeholder}]
is_active	BOOLEAN DEFAULT true	Solo el formulario activo se presenta a los nuevos clientes
version	INTEGER DEFAULT 1	Versión del formulario; se incrementa al modificar
created_at	TIMESTAMPTZ	DEFAULT now()
updated_at	TIMESTAMPTZ	Trigger ON UPDATE

Tipos de campo soportados en el formulario
text — Campo de texto libre (ej: "Describe tu historial de lesiones")
textarea — Texto largo (ej: "¿Cuál es tu motivación principal?")
number — Número (ej: "¿Cuántas horas duermes de media?")
select — Selección única de opciones (ej: "Nivel de experiencia: Principiante / Intermedio / Avanzado")
multiselect — Selección múltiple (ej: "¿Qué equipamiento tienes en casa?")
boolean — Sí / No (ej: "¿Tienes alguna lesión activa?")
scale — Escala numérica 1-10 (ej: "Del 1 al 10, ¿cómo valoras tu alimentación actual?")
date — Fecha (ej: "Fecha de tu último chequeo médico")

-- 005_create_onboarding_forms.sql
CREATE TABLE onboarding_forms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  fields      JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
ALTER TABLE onboarding_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer manages own forms" ON onboarding_forms FOR ALL USING (auth.uid() = trainer_id);
-- Clientes pueden leer el formulario de su entrenador para rellenarlo
CREATE POLICY "Client reads trainer form" ON onboarding_forms FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = onboarding_forms.trainer_id AND client_id = auth.uid()));

▌ 4.6. Tabla: onboarding_responses (Respuestas del Cliente)
Almacena las respuestas del cliente al formulario del entrenador, el análisis generado por GPT-4o y los datos crudos para que el entrenador pueda verlos literalmente.
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
form_id	UUID FK → onboarding_forms	El formulario respondido
client_id	UUID FK → auth.users	El cliente que respondió
trainer_id	UUID FK → auth.users	El entrenador destinatario
responses	JSONB NOT NULL	Respuestas literales del cliente: {field_id: value} — visible al entrenador tal cual
ai_analysis	TEXT DEFAULT NULL	Análisis de GPT-4o: resumen estructurado de las respuestas con insights para el entrenador
ai_alerts	JSONB DEFAULT '[]'	Array de alertas detectadas por la IA: [{severity, message}] (ej: lesión activa, patología cardíaca)
ai_generated_at	TIMESTAMPTZ DEFAULT NULL	Cuándo se generó el análisis de IA
trainer_notes	TEXT DEFAULT NULL	Notas del entrenador sobre las respuestas del cliente
created_at	TIMESTAMPTZ	DEFAULT now()

-- 006_create_onboarding_responses.sql
CREATE TABLE onboarding_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id          UUID NOT NULL REFERENCES onboarding_forms(id),
  client_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responses        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_analysis      TEXT,
  ai_alerts        JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_generated_at  TIMESTAMPTZ,
  trainer_notes    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (form_id, client_id)
  );
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer sees client responses" ON onboarding_responses
  FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Client manages own responses" ON onboarding_responses
  FOR ALL USING (auth.uid() = client_id);

▌ 4.7. Tabla: trainer_food_library (Biblioteca de Alimentos del Entrenador)
Cada entrenador tiene su propia biblioteca de alimentos que se combina con la biblioteca global de FitOS (food_library) al crear menús. El entrenador puede añadir alimentos personalizados que no existen en la biblioteca global.
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
trainer_id	UUID FK → auth.users	El entrenador propietario (NULL = alimento global de FitOS)
name	TEXT NOT NULL	Nombre del alimento
kcal	NUMERIC(6,1) NOT NULL	Kilocalorías por 100g
protein	NUMERIC(5,2) NOT NULL	Proteínas (g) por 100g
carbs	NUMERIC(5,2) NOT NULL	Hidratos de carbono (g) por 100g
fat	NUMERIC(5,2) NOT NULL	Grasas (g) por 100g
fiber	NUMERIC(5,2) DEFAULT 0	Fibra (g) por 100g
category	TEXT NOT NULL	'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena'
is_global	BOOLEAN DEFAULT false	true = alimento de FitOS (seed); false = añadido por el entrenador
is_verified	BOOLEAN DEFAULT true	Verificado por el entrenador o por FitOS
created_at	TIMESTAMPTZ	DEFAULT now()

Cómo funciona la biblioteca unificada de alimentos
Al crear un menú, el entrenador ve: (1) los alimentos globales de FitOS (120+ alimentos seed) + (2) los alimentos que él mismo ha añadido. Al generar el menú para un cliente, la IA solo usa alimentos de esta biblioteca combinada que coincidan con las preferencias del cliente (food_preferences en profiles). El cliente ve el nombre del alimento y sus macros, nunca si es global o personalizado del entrenador.

-- 007_create_trainer_food_library.sql
CREATE TABLE trainer_food_library (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  kcal        NUMERIC(6,1) NOT NULL,
  protein     NUMERIC(5,2) NOT NULL,
  carbs       NUMERIC(5,2) NOT NULL,
  fat         NUMERIC(5,2) NOT NULL,
  fiber       NUMERIC(5,2) NOT NULL DEFAULT 0,
  category    TEXT NOT NULL CHECK (category IN ('desayuno','almuerzo','comida','merienda','cena')),
  is_global   BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE INDEX idx_food_lib_name ON trainer_food_library USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_food_lib_trainer ON trainer_food_library(trainer_id);
ALTER TABLE trainer_food_library ENABLE ROW LEVEL SECURITY;
-- Alimentos globales visibles para todos los entrenadores autenticados
CREATE POLICY "Auth users read global foods" ON trainer_food_library
  FOR SELECT USING (is_global = true AND auth.role() = 'authenticated');
-- Entrenador gestiona sus propios alimentos
CREATE POLICY "Trainer manages own foods" ON trainer_food_library
  FOR ALL USING (auth.uid() = trainer_id);
-- Clientes pueden ver los alimentos de su entrenador
CREATE POLICY "Client reads trainer foods" ON trainer_food_library FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = trainer_food_library.trainer_id AND client_id = auth.uid()));

▌ 4.8. Tabla: meal_plans (Menús del Entrenador)
Almacena los planes nutricionales creados por el entrenador (manualmente o con IA) y asignados al cliente. El cliente puede ver su menú activo en su sección correspondiente.
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
trainer_id	UUID FK → auth.users NOT NULL	El entrenador que creó el menú
client_id	UUID FK → auth.users NOT NULL	El cliente al que está asignado
title	TEXT NOT NULL	Nombre del menú (ej: "Plan de definición semana 4")
period	TEXT NOT NULL	'weekly' | 'monthly'
meals_per_day	SMALLINT NOT NULL	3 | 4 | 5
days	JSONB NOT NULL	Array de días: [{date, meals: [{type, foods: [{food_id, name, portion_g, kcal, protein, carbs, fat}], total_kcal, macros}], daily_total_kcal, daily_macros}]
target_kcal	NUMERIC(7,1) NOT NULL	Calorías objetivo diarias
is_active	BOOLEAN DEFAULT true	Solo un plan activo por cliente a la vez
source	TEXT DEFAULT 'trainer'	'trainer' (creado manualmente) | 'ai' (generado por IA y revisado por el entrenador)
sent_at	TIMESTAMPTZ DEFAULT NULL	Cuándo el entrenador envió el menú al cliente
created_at	TIMESTAMPTZ	DEFAULT now()

-- 008_create_meal_plans.sql
CREATE TABLE meal_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  period       TEXT NOT NULL CHECK (period IN ('weekly','monthly')),
  meals_per_day SMALLINT NOT NULL CHECK (meals_per_day IN (3,4,5)),
  days         JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_kcal  NUMERIC(7,1) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  source       TEXT NOT NULL DEFAULT 'trainer' CHECK (source IN ('trainer','ai')),
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE INDEX idx_meal_plans_client ON meal_plans(client_id);
CREATE INDEX idx_meal_plans_trainer ON meal_plans(trainer_id);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer manages meal plans" ON meal_plans FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Client views own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = client_id);

▌ 4.9. Tabla: trainer_exercise_library (Biblioteca de Ejercicios del Entrenador)
Cada entrenador tiene su propia biblioteca de ejercicios. Al crear una cuenta recibe los ejercicios globales de FitOS por defecto, y puede añadir los suyos propios con vídeo incluido. Cuando asigna una rutina, el cliente ve el vídeo del ejercicio correspondiente.
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
trainer_id	UUID FK → auth.users	NULL = ejercicio global de FitOS
name	TEXT NOT NULL	Nombre del ejercicio
description	TEXT DEFAULT NULL	Descripción técnica del movimiento
video_url	TEXT DEFAULT NULL	URL del vídeo en Supabase Storage (subido por el entrenador) o URL externa (YouTube embed)
video_thumbnail_url	TEXT DEFAULT NULL	Miniatura del vídeo para la previsualización
muscle_groups	TEXT[]	Músculos primarios trabajados
secondary_muscles	TEXT[]	Músculos secundarios
equipment_needed	TEXT[]	Equipamiento requerido (ej: ['barra_olimpica', 'banco'])
category	TEXT NOT NULL	'fuerza' | 'hipertrofia' | 'cardio' | 'movilidad' | 'core'
difficulty	TEXT NOT NULL	'principiante' | 'intermedio' | 'avanzado'
is_global	BOOLEAN DEFAULT false	true = ejercicio de FitOS (800+ por defecto); false = añadido por el entrenador
created_at	TIMESTAMPTZ	DEFAULT now()

-- 009_create_trainer_exercise_library.sql
CREATE TABLE trainer_exercise_library (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  video_url           TEXT,
  video_thumbnail_url TEXT,
  muscle_groups       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  secondary_muscles   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  equipment_needed    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  category            TEXT NOT NULL CHECK (category IN ('fuerza','hipertrofia','cardio','movilidad','core')),
  difficulty          TEXT NOT NULL CHECK (difficulty IN ('principiante','intermedio','avanzado')),
  is_global           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE INDEX idx_exercise_lib_trainer ON trainer_exercise_library(trainer_id);
CREATE INDEX idx_exercise_lib_name ON trainer_exercise_library USING gin(to_tsvector('spanish', name));
ALTER TABLE trainer_exercise_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read global exercises" ON trainer_exercise_library
  FOR SELECT USING (is_global = true AND auth.role() = 'authenticated');
CREATE POLICY "Trainer manages own exercises" ON trainer_exercise_library
  FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Client reads trainer exercises" ON trainer_exercise_library FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = trainer_exercise_library.trainer_id AND client_id = auth.uid()));

▌ 4.10. Tabla: user_routines (Rutinas Asignadas al Cliente)
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
client_id	UUID FK → auth.users	El cliente
trainer_id	UUID FK → auth.users	El entrenador que creó y asignó la rutina
title	TEXT NOT NULL	Nombre de la rutina (ej: "Mesociclo 2 — Hipertrofia")
duration_months	INTEGER NOT NULL	Duración en meses (1-12)
goal	TEXT NOT NULL	'fuerza' | 'hipertrofia'
exercises	JSONB NOT NULL	Array de ejercicios: {exercise_id, name, video_url, sets, reps_min, reps_max, rir, rir_progression_weekly, weight_kg, rest_s, day_of_week, week_of_month, trainer_notes, technique_notes}
equipment_detected	TEXT[]	Equipamiento detectado (si se generó desde Gym Scan)
is_active	BOOLEAN DEFAULT true	Solo una rutina activa por cliente
source	TEXT DEFAULT 'trainer'	'trainer' | 'ai'
sent_at	TIMESTAMPTZ DEFAULT NULL	Cuándo el entrenador envió la rutina al cliente
created_at	TIMESTAMPTZ	DEFAULT now()

Estructura del JSONB exercises — campo completo por ejercicio
{
  "exercise_id": "uuid-del-ejercicio-en-trainer_exercise_library",
  "name": "Sentadilla con barra",
  "video_url": "https://storage.supabase.co/trainer-videos/squats.mp4",
  "sets": 4,
  "reps_min": 6,
  "reps_max": 8,
  "rir": 2,
  "rir_progression_weekly": [-1, -1, 0, 1],  /* RIR por semana: sem1=2, sem2=1, sem3=0, sem4=deload */
  "weight_kg": 80.0,  /* Peso inicial sugerido; se actualiza con historial real */
  "rest_s": 180,
  "day_of_week": "lunes",
  "week_of_month": 1,
  "trainer_notes": "Foco en profundidad y control excéntrico",
  "technique_notes": "Mantener el pecho arriba y las rodillas hacia afuera"
}

-- 010_create_user_routines.sql
CREATE TABLE user_routines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  duration_months   INTEGER NOT NULL CHECK (duration_months BETWEEN 1 AND 12),
  goal              TEXT NOT NULL CHECK (goal IN ('fuerza','hipertrofia')),
  exercises         JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipment_detected TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active         BOOLEAN NOT NULL DEFAULT true,
  source            TEXT NOT NULL DEFAULT 'trainer' CHECK (source IN ('trainer','ai')),
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
  );
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer manages client routines" ON user_routines FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Client views own routines" ON user_routines FOR SELECT USING (auth.uid() = client_id);

▌ 4.11. Tabla: weight_log (Histórico de Pesos Levantados)
Registra el peso levantado por el cliente en cada ejercicio y cada sesión. El entrenador puede ver el histórico completo y modificarlo si es necesario (el cambio se refleja automáticamente en la vista del cliente). Se actualiza automáticamente al registrar una sesión.
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
client_id	UUID FK → auth.users	El cliente
trainer_id	UUID FK → auth.users DEFAULT NULL	El entrenador (para validar que puede modificarlo)
exercise_id	UUID FK → trainer_exercise_library	El ejercicio
exercise_name	TEXT NOT NULL	Nombre del ejercicio (desnormalizado para queries rápidas)
session_date	DATE NOT NULL	Fecha de la sesión
sets_data	JSONB NOT NULL	Array de series: [{set_number, weight_kg, reps_done, rir_actual, rpe}]
total_volume_kg	NUMERIC(12,2) NOT NULL	Volumen total de la sesión para este ejercicio (sets × reps × kg)
one_rm_estimated	NUMERIC(8,2) DEFAULT NULL	1RM estimado (fórmula Epley: peso × (1 + reps/30))
modified_by_trainer	BOOLEAN DEFAULT false	true si el entrenador modificó este registro manualmente
trainer_modification_note	TEXT DEFAULT NULL	Nota del entrenador explicando la modificación
created_at	TIMESTAMPTZ	DEFAULT now()
updated_at	TIMESTAMPTZ	Trigger ON UPDATE

-- 011_create_weight_log.sql
CREATE TABLE weight_log (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exercise_id              UUID REFERENCES trainer_exercise_library(id) ON DELETE SET NULL,
  exercise_name            TEXT NOT NULL,
  session_date             DATE NOT NULL,
  sets_data                JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_volume_kg          NUMERIC(12,2) NOT NULL,
  one_rm_estimated         NUMERIC(8,2),
  modified_by_trainer      BOOLEAN NOT NULL DEFAULT false,
  trainer_modification_note TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE INDEX idx_weight_log_client_exercise ON weight_log(client_id, exercise_id, session_date DESC);
CREATE INDEX idx_weight_log_trainer ON weight_log(trainer_id, session_date DESC);
ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client manages own weight log" ON weight_log FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Trainer views and edits client weight log" ON weight_log
  FOR ALL USING (auth.uid() = trainer_id);

▌ 4.12. Tabla: body_metrics (Progreso Corporal del Cliente)
Almacena el peso corporal, medidas corporales y fotos de progreso del cliente. Tanto el cliente como el entrenador pueden ver el histórico. El entrenador lo ve en la ficha del cliente; el cliente lo ve en su sección de progreso.
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
client_id	UUID FK → auth.users	El cliente
recorded_at	TIMESTAMPTZ NOT NULL	Fecha y hora del registro
body_weight_kg	NUMERIC(5,2) DEFAULT NULL	Peso corporal en kg
body_fat_pct	NUMERIC(4,1) DEFAULT NULL	% de grasa corporal (si el cliente lo mide)
muscle_mass_kg	NUMERIC(5,2) DEFAULT NULL	Masa muscular en kg (si el cliente lo mide)
chest_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro pecho (cm)
waist_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro cintura (cm)
hips_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro cadera (cm)
right_arm_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro bíceps derecho (cm)
left_arm_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro bíceps izquierdo (cm)
right_thigh_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro muslo derecho (cm)
left_thigh_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro muslo izquierdo (cm)
right_calf_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro pantorrilla derecha (cm)
left_calf_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro pantorrilla izquierda (cm)
neck_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro cuello (cm)
shoulders_cm	NUMERIC(5,1) DEFAULT NULL	Perímetro hombros (cm)
progress_photos	TEXT[]	Array de URLs en Supabase Storage de las fotos de progreso subidas ese día
notes	TEXT DEFAULT NULL	Notas del cliente sobre ese registro
created_at	TIMESTAMPTZ	DEFAULT now()

-- 012_create_body_metrics.sql
CREATE TABLE body_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at     TIMESTAMPTZ NOT NULL,
  body_weight_kg  NUMERIC(5,2),
  body_fat_pct    NUMERIC(4,1),
  muscle_mass_kg  NUMERIC(5,2),
  chest_cm        NUMERIC(5,1),
  waist_cm        NUMERIC(5,1),
  hips_cm         NUMERIC(5,1),
  right_arm_cm    NUMERIC(5,1),
  left_arm_cm     NUMERIC(5,1),
  right_thigh_cm  NUMERIC(5,1),
  left_thigh_cm   NUMERIC(5,1),
  right_calf_cm   NUMERIC(5,1),
  left_calf_cm    NUMERIC(5,1),
  neck_cm         NUMERIC(5,1),
  shoulders_cm    NUMERIC(5,1),
  progress_photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE INDEX idx_body_metrics_client ON body_metrics(client_id, recorded_at DESC);
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client manages own metrics" ON body_metrics FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Trainer views client metrics" ON body_metrics FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = body_metrics.client_id));

▌ 4.13. Tabla: user_calendar
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
user_id	UUID FK → auth.users	Propietario
date	DATE NOT NULL	Fecha de la actividad
activity_type	TEXT NOT NULL	'workout' | 'meal' | 'rest'
activity_details	JSONB NOT NULL	Detalles: {nombre, ejercicios[], comidas[], notas}
completed	BOOLEAN DEFAULT false	Marcado como completado por el cliente
external_id	TEXT DEFAULT NULL	ID del evento en Google Calendar
rpe	SMALLINT DEFAULT NULL	RPE post-actividad (1-10)
created_at / updated_at	TIMESTAMPTZ	DEFAULT now() / Trigger

-- 013_create_user_calendar.sql
CREATE TABLE user_calendar (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  activity_type    TEXT NOT NULL CHECK (activity_type IN ('workout','meal','rest')),
  activity_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed        BOOLEAN NOT NULL DEFAULT false,
  external_id      TEXT,
  rpe              SMALLINT CHECK (rpe BETWEEN 1 AND 10),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE INDEX idx_user_calendar_user_date ON user_calendar(user_id, date);
ALTER TABLE user_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own calendar" ON user_calendar FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Trainer views client calendar" ON user_calendar FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = user_calendar.user_id));

▌ 4.14. Tabla: rpe_history
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
client_id	UUID FK → auth.users	El cliente
calendar_id	UUID FK → user_calendar	La sesión asociada
rpe_global	SMALLINT NOT NULL	RPE global de la sesión (1-10)
rpe_by_exercise	JSONB DEFAULT '{}'	{exercise_name: rpe_value}
total_volume_kg	NUMERIC(10,2) DEFAULT NULL	Volumen total de la sesión
session_duration_min	INTEGER DEFAULT NULL	Duración en minutos
notes	TEXT DEFAULT NULL	Notas del cliente
created_at	TIMESTAMPTZ	DEFAULT now()

-- 014_create_rpe_history.sql
CREATE TABLE rpe_history (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id          UUID NOT NULL REFERENCES user_calendar(id) ON DELETE CASCADE,
  rpe_global           SMALLINT NOT NULL CHECK (rpe_global BETWEEN 1 AND 10),
  rpe_by_exercise      JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_volume_kg      NUMERIC(10,2),
  session_duration_min INTEGER,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
  );
ALTER TABLE rpe_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client manages own RPE" ON rpe_history FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Trainer views client RPE" ON rpe_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = rpe_history.client_id));

▌ 4.15. Tabla: biometric_data
Campo	Tipo	Descripción
id	UUID PK	gen_random_uuid()
client_id	UUID FK → auth.users	El cliente
recorded_at	TIMESTAMPTZ NOT NULL	Timestamp del dato
source	TEXT NOT NULL	'apple_health' | 'google_fit' | 'garmin' | 'whoop' | 'oura' | 'polar' | 'fitbit'
hrv_ms	NUMERIC(6,2) DEFAULT NULL	HRV nocturno (ms)
sleep_hours	NUMERIC(4,2) DEFAULT NULL	Horas de sueño
sleep_quality	NUMERIC(5,2) DEFAULT NULL	Calidad del sueño 0-100
resting_hr	SMALLINT DEFAULT NULL	FC reposo (bpm)
body_battery	SMALLINT DEFAULT NULL	Body Battery Garmin (0-100)
steps	INTEGER DEFAULT NULL	Pasos del día
raw_data	JSONB DEFAULT '{}'	Datos crudos del wearable
created_at	TIMESTAMPTZ	DEFAULT now()

-- 015_create_biometric_data.sql
CREATE TABLE biometric_data (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at   TIMESTAMPTZ NOT NULL,
  source        TEXT NOT NULL,
  hrv_ms        NUMERIC(6,2),
  sleep_hours   NUMERIC(4,2),
  sleep_quality NUMERIC(5,2) CHECK (sleep_quality BETWEEN 0 AND 100),
  resting_hr    SMALLINT,
  body_battery  SMALLINT CHECK (body_battery BETWEEN 0 AND 100),
  steps         INTEGER,
  raw_data      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client manages own biometrics" ON biometric_data FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Trainer views client biometrics" ON biometric_data FOR SELECT
  USING (EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = auth.uid() AND client_id = biometric_data.client_id));

▌ 4.16. Tabla: leagues + league_members (Gamificación)
-- 016_create_leagues.sql
CREATE TABLE leagues (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  metric     TEXT NOT NULL CHECK (metric IN ('adherence','steps','volume','sessions')),
  anonymous  BOOLEAN NOT NULL DEFAULT false,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
CREATE TABLE league_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score     NUMERIC(10,2) NOT NULL DEFAULT 0,
  rank      INTEGER DEFAULT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, client_id)
  );
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

▌ 4.17. Tabla: trainer_subscriptions
-- 017_create_trainer_subscriptions.sql
CREATE TABLE trainer_subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  plan                   TEXT NOT NULL CHECK (plan IN ('starter','pro','elite','clinica')),
  status                 TEXT NOT NULL CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
  );
ALTER TABLE trainer_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer sees own subscription" ON trainer_subscriptions FOR SELECT USING (auth.uid() = trainer_id);

 
5. Autenticación, Roles y Estructura de Rutas
▌ 5.1. Flujo de Registro — Entrenador
1.	El usuario abre /register y selecciona "Soy entrenador personal".
2.	Completa: nombre completo, email, contraseña (mínimo 8 chars, 1 mayúscula, 1 número), confirmación.
3.	Supabase Auth crea el usuario con raw_user_meta_data: { role: "trainer", full_name: "..." }.
4.	El trigger handle_new_user() crea automáticamente la fila en profiles y user_roles.
5.	Redirección a /onboarding/trainer: nombre comercial, especialidad, foto de perfil, descripción.
6.	El entrenador configura su formulario de onboarding por defecto para los nuevos clientes (campos, tipos, preguntas).
7.	Al completar, se genera automáticamente el código promocional y se guarda en trainer_promo_codes.
8.	Redirección a /app/trainer/dashboard.

▌ 5.2. Flujo de Registro — Cliente
9.	El usuario abre /register y selecciona "Soy cliente de un entrenador".
10.	Aparece el campo obligatorio "Código de tu entrenador" con validación en tiempo real (debounce 500ms contra trainer_promo_codes).
11.	Completa el formulario: nombre completo, email, contraseña, confirmación.
12.	Supabase Auth crea el usuario, el trigger crea profile + user_roles.
13.	Se crea la fila en trainer_clients vinculando cliente con entrenador.
14.	Se incrementa trainer_promo_codes.current_uses de forma atómica.
15.	Redirección a /onboarding/client: se presenta el formulario personalizado configurado por el entrenador.
16.	El cliente rellena el formulario; al enviarlo, se guarda en onboarding_responses y se dispara la Edge Function analyze-onboarding-form.
17.	GPT-4o analiza las respuestas y genera el informe + alertas; se guarda en onboarding_responses.ai_analysis.
18.	El entrenador recibe una notificación push: "Nuevo cliente registrado — formulario completado y listo para revisar".
19.	El cliente completa el resto del onboarding: datos físicos, preferencias alimentarias (food_preferences en profiles), conexión de wearable (opcional).
20.	Redirección a /app/client/dashboard.

▌ 5.3. Estructura de Rutas Completa
Ruta	Acceso	Descripción
/ (landing)	Público	Página de marketing + SEO
/login	Público	Login con Spotlight Aceternity
/register	Público	Registro con selector de rol (Entrenador / Cliente)
/onboarding/trainer	Trainer	Setup: datos comerciales + formulario de onboarding + código promo
/onboarding/client	Client	Setup: formulario del entrenador + datos físicos + preferencias + wearable
/app/trainer/dashboard	Trainer	KPIs, feed de actividad, Weekly Summary, alertas
/app/trainer/clients	Trainer	Listado y gestión de clientes vinculados
/app/trainer/clients/[id]	Trainer	Ficha completa del cliente: formulario, progreso, pesos, biométrica, rutina, menú
/app/trainer/nutrition	Trainer	Creador de menús + biblioteca de alimentos del entrenador + gestión de alimentos propios
/app/trainer/exercises	Trainer	Biblioteca de ejercicios del entrenador + añadir ejercicios propios + subir vídeos
/app/trainer/routines	Trainer	Constructor de rutinas con configuración de RIR, peso, progresión + asignación al cliente
/app/trainer/marketing	Trainer	Landing Page Builder + Content Creator AI + Funnel CRM
/app/trainer/leagues	Trainer	Gestión de ligas de consistencia y retos grupales
/app/trainer/forms	Trainer	Configuración del formulario de onboarding
/app/trainer/settings	Trainer	Código promo, suscripción, marca blanca, notificaciones
/app/client/dashboard	Client	Plan del día + métricas personales
/app/client/calories	Client	Menú 1: Vision Calorie Tracker
/app/client/routine	Client	Menú 2: Gym Scan & Routine Generator
/app/client/meals	Client	Menú 3: Ver menú asignado por el entrenador + Meal Planner propio
/app/client/calendar	Client	Menú 4: Master Calendar
/app/client/progress	Client	Sección de progreso: fotos, medidas, peso corporal, gráficas, histórico de pesos levantados
/api/calendar/export.ics	Client auth	Exportar eventos en formato iCalendar RFC 5545
/api/webhooks/stripe	Sistema	Webhook Stripe: actualiza trainer_subscriptions
/api/webhooks/wearables	Sistema	Webhooks Garmin/Whoop/Oura: inserta en biometric_data

 
6. Módulos del Entrenador — Especificación Técnica Completa
▌ 6.1. Dashboard del Entrenador
•	KPIs en tiempo real via Supabase Realtime: clientes activos, MRR del mes, adherencia media de la semana, alertas biométricas pendientes, clientes con formulario sin revisar.
•	Feed de actividad reciente: sesiones completadas, nuevos registros de progreso, RPE alto, alertas de sueño.
•	Resumen semanal IA (Weekly Summary): generado cada lunes por GPT-4o; incluye patrones de sobreentrenamiento, baja adherencia y cambios biométricos relevantes.
•	Acceso rápido a: crear rutina, crear menú, enviar mensaje grupal, ver ligas, Content Creator AI.

▌ 6.2. Gestión del Formulario de Onboarding
● Configuración del formulario
•	El entrenador accede a /app/trainer/forms y construye su formulario de onboarding con un editor visual drag & drop.
•	Puede añadir, reordenar y eliminar campos de 8 tipos distintos: text, textarea, number, select, multiselect, boolean, scale, date.
•	Puede marcar cada campo como obligatorio u opcional.
•	Puede configurar un campo como "Historial de lesiones" (tipo textarea, obligatorio) que la IA trata con prioridad especial.
•	El formulario se guarda en onboarding_forms con versión incremental. Los clientes ya registrados no ven el nuevo formulario automáticamente (solo nuevos registros).
•	El entrenador puede previsualizar el formulario tal como lo verá el cliente antes de activarlo.

● Vista del entrenador — Ficha del cliente
•	En la ficha de cada cliente (/app/trainer/clients/[id]), el entrenador ve dos tabs dentro de la sección "Formulario inicial":
◦	"Respuestas literales": muestra exactamente lo que escribió el cliente campo por campo, sin procesar.
◦	"Análisis de IA": el informe estructurado generado por GPT-4o con resumen de perfil, puntos clave, alertas (lesiones, patologías, factores de riesgo) y recomendaciones iniciales.
•	El entrenador puede añadir sus propias notas sobre el formulario en el campo trainer_notes.
•	Si la IA detectó alertas (severity: 'high'), se muestran en rojo en la parte superior de la ficha del cliente con un badge visible.

● Edge Function: analyze-onboarding-form
Parámetro	Detalle
Ruta	POST /functions/v1/analyze-onboarding-form
Input	{form_id, client_id, trainer_id, responses: {field_id: value}}
Modelo IA	GPT-4o (más preciso para análisis de texto clínico/deportivo)
Output	{ai_analysis: string, ai_alerts: [{severity: 'low'|'medium'|'high', message: string}]}
Guardado	Se actualiza onboarding_responses con ai_analysis y ai_alerts
Notificación	Push al entrenador via OneSignal: "Nuevo cliente: [nombre] — formulario analizado"

// Prompt de sistema para GPT-4o — analyze-onboarding-form
const SYSTEM_PROMPT = `
Eres un experto en evaluación inicial de clientes de fitness y nutrición.
Recibes las respuestas de un cuestionario de onboarding de un nuevo cliente.
Tu tarea es:
1. Generar un resumen estructurado del perfil del cliente (2-3 párrafos).
2. Identificar puntos clave relevantes para el entrenador (historial, motivación, disponibilidad).
3. Detectar ALERTAS que el entrenador debe conocer antes de diseñar el plan:
   - ALTA: lesiones activas, patologías cardíacas, contraindicaciones médicas.
   - MEDIA: lesiones pasadas, limitaciones de movilidad, factores de estrés altos.
   - BAJA: preferencias, horarios, nivel de experiencia.
4. Ofrecer 3 recomendaciones iniciales concretas para el entrenador.
Responde ÚNICAMENTE con JSON: {ai_analysis: "texto...", ai_alerts: [{severity, message}]}`;

▌ 6.3. Biblioteca de Ejercicios del Entrenador
● Gestión de la biblioteca
•	El entrenador accede a /app/trainer/exercises y ve su biblioteca completa: los ejercicios globales de FitOS (800+ por defecto) y los que ha añadido él.
•	Puede filtrar por: músculo, categoría, dificultad, equipamiento, y si tiene vídeo propio o no.
•	Puede buscar por nombre con el combobox (búsqueda de texto completo, < 300ms).

● Añadir ejercicio personalizado
21.	El entrenador hace clic en "Añadir ejercicio".
22.	Rellena: nombre, descripción técnica, músculos primarios (multiselect), músculos secundarios, equipamiento necesario, categoría, dificultad.
23.	Sube el vídeo del ejercicio: puede subir un archivo de vídeo (mp4/webm, máximo 500 MB, almacenado en Supabase Storage) o pegar una URL de YouTube/Vimeo para embed.
24.	El sistema genera automáticamente una miniatura del vídeo (primer frame si es un archivo, thumbnail de YouTube si es URL externa).
25.	El ejercicio se guarda en trainer_exercise_library con is_global = false.

● Editar ejercicio existente
•	El entrenador puede editar la descripción, notas técnicas, vídeo y miniaturas de cualquier ejercicio de su biblioteca (los globales crean una copia personalizada en su biblioteca con is_global = false).
•	Los cambios en el vídeo de un ejercicio se reflejan automáticamente para todos los clientes que tienen ese ejercicio en su rutina activa.

▌ 6.4. Constructor de Rutinas
● Crear y configurar una rutina
26.	El entrenador accede a /app/trainer/routines y hace clic en "Nueva rutina".
27.	Define: nombre de la rutina, cliente destinatario, objetivo (fuerza/hipertrofia), duración en meses, número de días por semana.
28.	El constructor organiza los días de la semana en columnas (drag & drop). El entrenador arrastra ejercicios desde su biblioteca a cada día.
29.	Por cada ejercicio en la rutina, el entrenador configura:
▪	Series
▪	Rango de repeticiones mínimo y máximo
▪	RIR (Repeticiones en Reserva) personalizado para ese cliente
▪	Progresión de RIR semana a semana (array por semana, ej: [2, 1, 0, 1] para 4 semanas: semana 1 con RIR 2, semana 2 con RIR 1, semana 3 al fallo, semana 4 descarga con RIR 1)
▪	Peso inicial sugerido en kg (referencia para el cliente; se actualiza automáticamente con el historial real)
▪	Tiempo de descanso en segundos
▪	Notas del entrenador para ese ejercicio (visible para el cliente)
▪	Notas técnicas de ejecución (visible para el cliente durante la sesión)
30.	El cliente verá el vídeo del ejercicio almacenado en la biblioteca del entrenador directamente en su app al realizar la sesión.
31.	Una vez finalizada, el entrenador hace clic en "Enviar al cliente". La rutina se guarda en user_routines con sent_at = now() y se crean las entradas en user_calendar para cada día de entrenamiento.
32.	El cliente recibe una notificación push: "Tu entrenador te ha asignado una nueva rutina: [nombre]".

● Visualización de la rutina por el cliente
•	El cliente ve la rutina en /app/client/routine organizada por semanas (tabs) y días (acordeones).
•	Al expandir un día, ve los ejercicios con: nombre, series×reps, RIR del día, peso sugerido, descanso, notas del entrenador.
•	Al hacer clic en el vídeo de un ejercicio, se reproduce directamente en la app (player nativo en móvil, reproductor inline en web).
•	Durante la sesión, el cliente registra el peso real y las repeticiones reales por serie. Cada registro actualiza automáticamente weight_log.
•	Al finalizar la sesión, puede registrar el RPE global y el RPE por ejercicio.

▌ 6.5. Creador de Menús Nutricionales
● Crear un menú manualmente o con IA
33.	El entrenador accede a /app/trainer/nutrition y hace clic en "Nuevo menú".
34.	Selecciona el cliente destinatario. El sistema muestra las preferencias alimentarias del cliente (food_preferences del perfil) de forma visible para el entrenador: qué alimentos le gustan, restricciones dietéticas, alergias.
35.	El entrenador elige el período (semanal/mensual), el número de comidas (3/4/5) y el objetivo calórico (calculado automáticamente por TDEE o editable manualmente).
36.	Puede crear el menú de dos formas:
▪	Manual: para cada día y cada comida, añade alimentos desde el combobox (búsqueda en su biblioteca combinada: alimentos globales + alimentos propios). Configura la porción en gramos de cada alimento. Los macros se calculan en tiempo real.
▪	Con IA: hace clic en "Generar con IA". La Edge Function generate-meal-plan usa la biblioteca del entrenador y las preferencias del cliente para generar el menú completo. El entrenador puede editarlo antes de enviarlo.
37.	Una vez satisfecho con el menú, hace clic en "Enviar al cliente". La rutina se guarda en meal_plans con sent_at = now() y se crean las entradas en user_calendar.
38.	El cliente recibe una notificación push: "Tu entrenador te ha enviado un nuevo menú nutricional".

● Añadir alimentos propios a la biblioteca
•	Desde /app/trainer/nutrition → "Mi biblioteca de alimentos" → "Añadir alimento".
•	Campos: nombre, kcal/100g, proteínas/100g, HC/100g, grasas/100g, fibra/100g (opcional), categoría.
•	El alimento se guarda en trainer_food_library con trainer_id = auth.uid() y is_global = false.
•	Aparece inmediatamente en el combobox de búsqueda al crear menús, diferenciado visualmente de los alimentos globales (badge "Mi biblioteca").
•	El entrenador puede editar o eliminar sus propios alimentos; los alimentos globales de FitOS no se pueden eliminar.

▌ 6.6. Ficha Completa del Cliente
La ficha del cliente (/app/trainer/clients/[id]) centraliza toda la información del cliente en tabs:
● Tab "Perfil"
•	Datos personales, foto, contacto, objetivo, historial médico del onboarding, estado de suscripción.
•	Formulario de onboarding: tab "Respuestas literales" + tab "Análisis IA" + notas del entrenador.
•	Alertas IA del formulario en rojo si hay issues de alta prioridad.

● Tab "Progreso"
•	Gráfica de peso corporal con todos los registros del cliente (actualizada en tiempo real via Supabase Realtime).
•	Medidas corporales: gráfica de evolución de cada medida (cintura, cadera, bíceps, muslos, etc.) con selector de medida activa.
•	Fotos de progreso: galería cronológica de las fotos subidas por el cliente, con comparativa antes/después deslizando.
•	El entrenador puede añadir notas sobre el progreso de cada semana.

● Tab "Histórico de Pesos"
•	Tabla y gráfica de la evolución del peso levantado por ejercicio: el entrenador selecciona un ejercicio de la lista y ve el histórico completo de peso, reps y volumen.
•	El histórico se actualiza automáticamente cada vez que el cliente registra una sesión.
•	El entrenador puede editar cualquier entrada del histórico (por error del cliente o corrección necesaria). Al guardar, el cambio se refleja en la vista del cliente en tiempo real con un indicador de "Modificado por tu entrenador" y la nota explicativa.
•	1RM estimado por ejercicio calculado automáticamente con la fórmula de Epley.

● Tab "Rutina activa"
•	Vista de la rutina activa del cliente con posibilidad de editarla directamente desde aquí.
•	Historial de rutinas anteriores.

● Tab "Menú activo"
•	Vista del plan nutricional activo del cliente.
•	Adherencia nutricional de la semana actual.

● Tab "Biométrica"
•	Datos sincronizados del wearable del cliente: HRV, sueño, FC reposo, Body Battery, pasos.
•	Alertas activas de auto-regulación del plan.

● Tab "Comunicación"
•	Chat directo con el cliente.
•	Historial de mensajes y notas internas del entrenador.

▌ 6.7. Histórico de Pesos — Sincronización Bidireccional
Flujo de actualización automática del histórico de pesos
1. El cliente registra una sesión de entrenamiento: anota peso (kg) y repeticiones por serie.
2. FitOS calcula automáticamente: volumen total del ejercicio (sets × reps × kg) y 1RM estimado (Epley).
3. Se inserta una nueva fila en weight_log con modified_by_trainer = false.
4. Supabase Realtime notifica al dashboard del entrenador: el histórico del cliente se actualiza en tiempo real sin recargar.
5. Si el entrenador detecta un error o quiere corregir un dato: edita la fila en weight_log, añade una nota en trainer_modification_note, se establece modified_by_trainer = true.
6. Supabase Realtime notifica a la app del cliente: el histórico del cliente se actualiza mostrando el dato corregido con el indicador "Modificado por tu entrenador — [nota]".

▌ 6.8. Coach Co-pilot — RPE Engine
•	El entrenador ve las sugerencias de ajuste de carga generadas por el RPE Engine para cada cliente activo.
•	Puede aprobar (1 tap), modificar manualmente o ignorar cada sugerencia.
•	El RPE Engine analiza: RPE registrado, peso y reps reales (de weight_log), días de descanso, volumen acumulado semanal, biométrica (HRV y sueño si hay wearable).
•	Weekly AI Summary: enviado cada lunes con alertas de sobreentrenamiento, baja adherencia y patrones preocupantes.

▌ 6.9. Computer Vision — Revisión del Entrenador
•	El entrenador recibe notificación cuando un cliente sube un vídeo para análisis biomecánico.
•	Ve el vídeo con las anotaciones de MediaPipe superpuestas y el reporte de GPT-4o.
•	Puede añadir su propio feedback de texto o audio antes de enviarlo al cliente.

▌ 6.10. Gamificación: Ligas y Retos
•	El entrenador crea ligas con 5-50 clientes: nombre, métrica (adherencia/pasos/volumen/sesiones), fechas, privacidad.
•	Rankings automáticos con tiempo real. Badges personalizables. Muro de actividad con reacciones.
•	Retos grupales temporales con métricas objetivo.

▌ 6.11. Business & Marketing Suite
● Landing Page Builder
•	Editor drag & drop con 12 bloques vinculados a productos de Stripe. Dominio personalizado. A/B testing. Analytics de conversión. Cookie banner RGPD.

● Content Creator AI
•	GPT-4o + DALL-E 3 generan gráfica de progreso (peso corporal, medidas, 1RM) + caption + hashtags para RRSS. Exportación en 1:1, 9:16, 16:9. Consentimiento del cliente requerido.

● Funnel CRM
•	Pipeline Kanban de leads. Formulario embebible. Secuencias de follow-up automáticas (24h, 72h, 7 días). Templates de email personalizables.

▌ 6.12. Gestión de Negocio y Pagos
•	Productos y precios directamente desde FitOS (Stripe). Suscripciones, pagos únicos, packs de sesiones.
•	Portal del cliente Stripe. Alta/baja automáticas. Facturación automática. Gestión de impagos.
•	Panel MRR, ARR, churn, LTV, forecast 30/60/90 días. Exportación a CSV.

▌ 6.13. Área Personal del Entrenador
•	Código promocional: ver código, regenerar, desactivar, historial de usos (quién lo usó y cuándo).
•	Suscripción: plan actual, límite de clientes usado/disponible, fecha de renovación, cambiar plan.
•	Marca blanca: logo, colores corporativos, nombre de la app en stores.
•	Formularios: gestión del formulario de onboarding activo.
•	Notificaciones: configurar qué alertas recibir (biométricas, RPE alto, inactividad, nuevos registros de progreso).

 
7. Módulos del Cliente — Especificación Técnica Completa
▌ 7.1. Dashboard del Cliente
•	Plan del día: entrenamiento + comidas del menú activo asignado por el entrenador.
•	Resumen de la semana: % de adherencia, racha actual, próximo entrenamiento.
•	Notificaciones del entrenador: nuevas rutinas, nuevos menús, mensajes.

▌ 7.2. Sección de Preferencias Alimentarias
El cliente configura sus preferencias alimentarias en el onboarding y puede actualizarlas después desde su perfil. Esta información es usada por el entrenador al crear menús.
•	Sección "Mis preferencias de comida" en /app/client/settings:
◦	Combobox de alimentos que le GUSTAN: búsqueda en la biblioteca combinada del entrenador (< 300ms). Los seleccionados se guardan en profiles.food_preferences.liked_food_ids.
◦	Campo de texto para alimentos que NO le gustan o le sientan mal: se guarda en profiles.food_preferences.disliked_foods.
◦	Multiselect de restricciones dietéticas: vegetariano, vegano, sin gluten, sin lactosa, sin frutos secos, halal, kosher.
◦	Campo de alergias alimentarias (texto libre, marcado como prioritario para el entrenador).
•	Cuando el entrenador crea un menú con IA, la Edge Function recibe food_preferences del cliente y el motor de generación solo usa alimentos compatibles con esas preferencias.
•	Cuando el entrenador crea un menú manualmente, el combobox de alimentos muestra un badge verde en los alimentos que le gustan al cliente y un badge rojo en los que no le gustan o tiene restricciones.

▌ 7.3. Sección de Progreso del Cliente
El cliente dispone de su propia sección de progreso en /app/client/progress donde puede subir fotos, registrar medidas y ver la evolución de sus datos.
● Registrar progreso
39.	El cliente hace clic en "Nuevo registro" y puede anotar:
▪	Peso corporal (kg)
▪	% grasa corporal (opcional)
▪	Medidas corporales: pecho, cintura, cadera, bíceps derecho/izquierdo, muslos derecho/izquierdo, pantorrillas, cuello, hombros
▪	Fotos de progreso: puede subir hasta 4 fotos por registro (frente, espalda, perfil izquierdo, perfil derecho). Se almacenan en Supabase Storage.
▪	Notas libres sobre el registro.
40.	Al guardar, se inserta una nueva fila en body_metrics y Supabase Realtime notifica al entrenador.

● Visualización del progreso (cliente)
•	Gráfica interactiva de peso corporal con todos los registros históricos.
•	Gráfica de medidas: selector de medida activa + evolución temporal.
•	Galería de fotos: vista cronológica con comparativa antes/después (deslizando entre dos fechas seleccionadas).
•	Histórico de pesos levantados: el cliente selecciona un ejercicio y ve la evolución de su peso máximo, 1RM estimado y volumen total. Si el entrenador modificó algún dato, se muestra con el indicador "Revisado por tu entrenador" y su nota.

▌ 7.4. Menú 1 — Vision Calorie Tracker
•	El cliente fotografía un plato con la cámara del móvil o sube una imagen.
•	Gemini 2.0 Flash Vision identifica los alimentos, estima porciones en gramos.
•	Cruce con la biblioteca de alimentos (global + del entrenador) para macros exactos.
•	Slider de ajuste de porción por alimento con recalculo en tiempo real.
•	Guardar en food_log y user_calendar. Latencia < 8s para imágenes hasta 4 MB.

▌ 7.5. Menú 2 — Gym Scan & Routine Generator
•	Sube 1-6 fotos del gimnasio. Selecciona objetivo (fuerza/hipertrofia) y duración (1-12 meses).
•	Gemini analiza TODAS las fotos en una sola llamada multimodal.
•	Solo incluye ejercicios de la biblioteca del entrenador que son realizables con el equipo detectado.
•	La rutina se guarda en user_routines y sincroniza en user_calendar. Latencia < 15s.

▌ 7.6. Menú 3 — Ver Menú del Entrenador + Meal Planner Propio
● Ver el menú asignado por el entrenador
•	Si el entrenador ha enviado un menú, el cliente lo ve en /app/client/meals con todos los días y comidas detalladas.
•	Ve: nombre de cada alimento, porción, kcal, proteínas, HC, grasas. Totales diarios y de cada comida.
•	Puede marcar cada comida como completada (Optimistic Update en user_calendar).
•	Puede registrar comentarios o incidencias en cada comida (ej: "Sustituí el pollo por atún").

● Meal Planner propio (si el entrenador no ha asignado menú)
•	Si el entrenador no ha enviado un menú activo, el cliente puede generar uno propio con la IA.
•	Usa sus preferencias alimentarias configuradas y la biblioteca de alimentos del entrenador.
•	El menú generado es provisional y visible para el entrenador en su ficha.

▌ 7.7. Menú 4 — Master Calendar
•	Dashboard Bento Grid: vista mensual/semanal coloreada + detalle del día + estadísticas de cumplimiento.
•	Checkbox de cumplimiento con Optimistic Update (actualización local inmediata, reversión si falla).
•	Animación Vortex de Aceternity en el fondo.
•	Sincronización con Google Calendar (OAuth 2.0, bidireccional), Apple Calendar (.ics) y Outlook (.ics / webcal://).

▌ 7.8. Comandos de Voz y Modo Offline
•	Comandos de voz: "Anotar 80 kilos en sentadilla", "Serie completada", "Siguiente ejercicio", "Anotar RPE 7", notas por dictado.
•	Wake word "Oye FitOS" (desactivado por defecto). Confirmación por audio tras cada comando.
•	Modo offline: ver plan 7 días, registrar series/pesos/RPE, ver historial 20 sesiones, ver menú del día, registrar comidas, ver mensajes 72h.
•	Sincronización automática y transparente al recuperar conexión.

▌ 7.9. AI Inbox y Computer Vision
•	AI Inbox: preguntas frecuentes con contexto del plan actual. Respuestas marcadas como "Sugerencia IA". El entrenador puede corregir o ampliar.
•	Computer Vision: grabación de ejercicio → análisis on-device con MediaPipe (el vídeo no sale del dispositivo) → reporte GPT-4o con anotaciones visuales → revisión y feedback del entrenador.

▌ 7.10. Biométrica y Wearables
•	Apple HealthKit (iOS), Google Fit (Android), Garmin Connect, Whoop, Oura Ring, Polar Flow, Fitbit.
•	Motor de auto-regulación: 5 reglas configurables basadas en HRV, sueño, Body Battery, Recovery Score, temperatura. 4 niveles de automatización.
•	Notificaciones proactivas al cliente y alertas al entrenador.

▌ 7.11. Gamificación — Vista del Cliente
•	Ligas de Consistencia: ver ranking, posición, variación semanal, badges.
•	Retos Grupales: muro de actividad, reacciones, progreso del reto.

 
8. Edge Functions de Supabase — Especificación Completa
Función	Ruta	Modelo IA	Input clave	Output clave
analyze-food-image	POST /functions/v1/analyze-food-image	Gemini 2.0 Flash Vision	{image_base64, mime_type, user_id}	{foods[], total_kcal, total_macros}
generate-gym-routine	POST /functions/v1/generate-gym-routine	Gemini 2.0 Flash Multimodal	{images[], goal, duration_months, client_id, trainer_id}	{equipment_detected[], routine{}}
generate-meal-plan	POST /functions/v1/generate-meal-plan	Gemini 2.0 Flash	{profile, food_preferences, preferred_food_ids[], meals_per_day, period, trainer_food_library_ids[]}	{days[]}
analyze-onboarding-form	POST /functions/v1/analyze-onboarding-form	GPT-4o	{form_id, client_id, trainer_id, responses{}}	{ai_analysis: string, ai_alerts[]}
rpe-suggestion	POST /functions/v1/rpe-suggestion	GPT-4o + LSTM	{client_id, rpe_history[], weight_log[], biometric_data[]}	{suggestion{}, explanation}
cv-analyze	POST /functions/v1/cv-analyze	GPT-4o	{landmarks_json, angles_json, exercise_name, client_id}	{feedback_text, corrections[]}
weekly-summary	POST /functions/v1/weekly-summary	GPT-4o	{trainer_id, week_start}	{summaries[{client_id, summary, alerts[]}]}
content-creator	POST /functions/v1/content-creator	GPT-4o + DALL-E 3	{client_id, metric, period, trainer_brand}	{image_url, caption, hashtags[]}
validate-promo-code	POST /functions/v1/validate-promo-code	Sin IA (SQL)	{code: string}	{valid, trainer_id?, trainer_name?, error?}
generate-ics	GET /api/calendar/export.ics	Sin IA (ical-generator)	{Authorization header}	Archivo .ics RFC 5545

Seguridad de todas las Edge Functions
• GEMINI_API_KEY y OPENAI_API_KEY solo existen como secretos de Supabase Edge Functions. NUNCA en el frontend ni en variables de entorno de Vercel.
• Todas las funciones validan el Bearer token de Supabase antes de procesar.
• Las imágenes del Calorie Tracker se procesan en memoria (no se almacenan).
• Los tokens OAuth de Google Calendar y wearables se almacenan cifrados en Supabase Vault.
• Rate limiting: máximo 10 llamadas IA/minuto por usuario (Upstash Ratelimit).

 
9. Estética, UX y Sistema de Diseño
▌ 9.1. Tema Visual
Variable	Valor	Uso
Modo de color	Dark Mode exclusivo (sin toggle)	Sin excepción
Fondo principal	#0A0A0F — negro profundo azulado	Background de todas las páginas
Fondo de cards	#12121A — superficie elevada	Cards, modales, popovers
Acento primario	#00E5FF — cian neón	CTAs, highlights, iconos activos
Acento secundario	#7C3AED — violeta eléctrico	Badges, tags, gamificación
Color de éxito	#00C853 — verde neón	Completado, métricas positivas
Color advertencia	#FF9100 — naranja	Alertas biométricas, RPE alto
Color error	#FF1744 — rojo	Errores, alertas críticas del formulario
Tipografía	Inter — pesos 400/500/600/700	Única fuente; cargada con next/font
Border radius	12px base, 16px cards, 8px botones	Consistente en todos los componentes
Sombras	box-shadow con acento al 20% opacidad	Efecto "neón" en hover de cards

▌ 9.2. Componentes Aceternity UI
Componente	Uso	Implementación
Spotlight	Login + Onboarding de ambos roles	Efecto de luz que sigue al cursor sobre #0A0A0F
Vortex	Dashboard del cliente (Master Calendar)	Animación de fondo suave; opacity 0.3
Bento Grid	Master Calendar + Home del entrenador	Layout 3 columnas desktop, 1 móvil
Floating Navbar	Navegación entre los 4 módulos del cliente	Blur backdrop-filter; iconos Lucide React

▌ 9.3. Animaciones Framer Motion
•	Transición entre páginas: slide + fade, 0.3s, easeInOut.
•	Aparición de tarjetas (calorías, ejercicios, comidas, progreso): stagger 0.05s por card.
•	Checkbox de cumplimiento: tick con spring physics (stiffness 300, damping 20).
•	Skeleton pulse mientras se espera respuesta de Supabase (< 300ms spinner, > 300ms skeleton).
•	Toast: slide-in desde esquina inferior derecha, auto-dismiss 4 segundos.
•	Galería de fotos de progreso: fade cross-dissolve al deslizar entre fechas.
•	Vídeos de ejercicios: fade-in del player al hacer clic en el ejercicio.

 
10. Estrategia SEO
▌ 10.1. SEO Técnico
•	SSR para páginas indexables: landing de marketing, blog, directorio de entrenadores, páginas de nicho.
•	Metadata API Next.js 15: título, description, Open Graph, Twitter Cards dinámicos.
•	JSON-LD: SoftwareApplication (home), LocalBusiness+Person (perfiles entrenadores), FAQPage (precios), Review (testimonios).
•	Sitemap.xml dinámico con next-sitemap. robots.txt indexa /landing y /blog, bloquea /app/*.
•	Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1 (Vercel Speed Insights).
•	WCAG 2.1 AA: contraste mínimo 4.5:1, navegación por teclado, ARIA en todos los componentes.

▌ 10.2. Arquitectura de Contenidos SEO
•	"Software para entrenadores personales" — landing principal de captación.
•	"App para entrenadores personales iPhone Android" — landing específica móvil.
•	"Planificador de comidas con IA gratis" — captación de clientes finales.
•	Directorio público de entrenadores: /entrenadores/[ciudad]/[especialidad] — SEO local.
•	"Cómo cobrar a mis clientes de entrenamiento personal" — artículo blog.

 
11. Seguridad, GDPR y Cumplimiento
Área	Implementación
Autenticación	Email+contraseña bcrypt cost 12; OAuth Google+Apple; MFA TOTP obligatoria para entrenador; Passkeys WebAuthn
Cifrado tránsito	TLS 1.3 + HSTS max-age=63072000; Certificate Transparency logs
Cifrado reposo	AES-256-GCM para datos biométricos (pgcrypto); tokens OAuth en Supabase Vault
RLS	17 tablas con RLS; auth.uid() = user_id como regla base; políticas granulares trainer-client
Fotos de progreso	Almacenadas en Supabase Storage con acceso privado; solo el cliente y su entrenador vinculado pueden acceder
Vídeos de análisis CV	Procesados on-device; si se envían al servidor, TTL de 7 días; los landmarks no contienen datos identificables
Imágenes Calorie Tracker	Procesadas en memoria en la Edge Function; NO se almacenan
Formularios onboarding	Las respuestas del cliente son datos personales sensibles; acceso estrictamente limitado al trainer vinculado vía RLS
RGPD/GDPR	DPA firmado con sub-processors; Registro de tratamientos Art. 30; derecho al olvido en < 30 días; Privacy by Design
Rate limiting	Upstash Ratelimit: 10 llamadas IA/minuto/usuario; brute force login: bloqueo tras 5 intentos
Menores de edad	Bloqueo de registro para < 16 años sin consentimiento parental verificado
Backups	Supabase PITR; backups cada 6h; RTO < 4h, RPO < 1h

 
12. Modelo de Negocio y Pricing
▌ 12.1. Planes del Entrenador
Plan	€/mes (anual)	€/mes (mensual)	Límite clientes	Incluye
Starter	24 €	29 €	Hasta 15	CRM, rutinas, menús, pagos, chat, formulario de onboarding básico (5 campos), biblioteca ejercicios global
Pro	65 €	79 €	Hasta 75	Todo Starter + Coach Co-pilot RPE, Gamificación, Wearables básicos, Biblioteca alimentos propia, Formulario sin límite de campos
Elite	119 €	149 €	Ilimitados	Todo Pro + Computer Vision, Wearables avanzados (Garmin/Whoop/Oura), Marketing Suite, Vídeos ejercicios propios (hasta 50GB)
Clínica	239 €	299 €	Ilimitados (5 trainers)	Todo Elite + Panel multi-entrenador + Reporting avanzado + Vídeos ejercicios sin límite

Los clientes NO pagan FitOS directamente. El acceso del cliente está incluido en el plan del entrenador. La comisión de FitOS es el 1% sobre pagos procesados a través de la plataforma (por encima de las fees de Stripe).

 
13. Fases de Desarrollo — Guía Completa con MCPs
FASE
0
Semanas 1–4	Setup y Fundamentos
🎯 Objetivo: Entorno completamente operativo, monorepo configurado, BD con las 17 tablas creadas, auth con roles y código promo funcionando.

Entregables Fase 0
41.	Monorepo Turborepo en GitHub con la estructura completa del Capítulo 3.
42.	Supabase: proyecto creado + 17 migraciones SQL ejecutadas en orden (001-017) con RLS, índices y seeds.
43.	Autenticación: registro con selector de rol, login, logout, OAuth Google y Apple, trigger handle_new_user().
44.	Sistema de código promocional: generación automática en onboarding del entrenador, validación en tiempo real en registro del cliente.
45.	Formulario de onboarding del entrenador: editor visual básico de campos.
46.	Middleware de protección de rutas con redirección por rol.
47.	Design system dark mode: tokens (#0A0A0F, #00E5FF), Inter, shadcn/ui + Aceternity UI Spotlight en login.
48.	CI/CD: GitHub Actions con lint + typecheck + tests; deploy automático a Vercel en merge a main.

MCPs Necesarios — Fase 0
MCP / Conector	Para qué se usa en esta fase	Urgencia
GitHub MCP	Crear monorepo, configurar branches y protecciones, configurar GitHub Actions CI/CD	🔴 Crítico
Vercel MCP	Crear proyecto, vincular con GitHub, configurar variables de entorno, dominios, preview por PR	🔴 Crítico
Supabase MCP	Crear proyecto, ejecutar las 17 migraciones SQL, configurar RLS, Edge Functions iniciales, semilla de alimentos	🔴 Crítico
Fetch MCP	Consultar docs de Supabase Auth (triggers, RLS), Next.js 15, Aceternity UI, shadcn/ui durante el setup	🟠 Alto
Slack MCP	Notificaciones del equipo: deploys, errores de Sentry, alertas de Supabase	🟡 Medio

Checklist Fase 0
☐	Crear cuenta en GitHub. Crear organización "fitos-app". Instalar MCP de GitHub en AntiGravity.
☐	Crear cuenta en Vercel Pro. Conectar con GitHub. Instalar MCP de Vercel en AntiGravity.
☐	Crear cuenta en Supabase. Crear proyecto "fitos-prod" en eu-west-1. Instalar MCP de Supabase en AntiGravity.
☐	Instalar Fetch MCP y Slack MCP en AntiGravity.
☐	Activar Skills en AntiGravity: frontend-design, docx, pdf, pptx, xlsx.
☐	Ejecutar migraciones SQL 001-017 en Supabase. Verificar RLS en las 17 tablas.
☐	Ejecutar seed de 120+ alimentos (migración 007 seed). Verificar distribución en 5 categorías.
☐	Configurar Supabase Auth: email+contraseña, OAuth Google y Apple, confirmar email.
☐	Configurar variables de entorno en Vercel: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, APPLE_*.
☐	Verificar con el agente: test de RLS (un usuario no puede leer datos de otro).

FASE
1
Semanas 5–16	MVP Core — Módulos del Cliente y del Entrenador (Básico)
🎯 Objetivo: Los 4 módulos del cliente funcionando + dashboard del entrenador con CRM básico, gestión de formulario, biblioteca de ejercicios y biblioteca de alimentos.

Entregables Fase 1
49.	Vision Calorie Tracker: foto → Gemini 2.0 Flash → tarjetas de resultado → guardar en food_log.
50.	Gym Scan & Routine Generator: 6 fotos → Gemini multimodal → rutina → user_routines.
51.	Smart Meal Planner: combobox alimentos, perfil físico, preferencias del cliente, generación IA, guardar en meal_plans.
52.	Master Calendar: Bento Grid, Optimistic Updates, sincronización Google Calendar, exportación .ics.
53.	Dashboard del entrenador: KPIs básicos, CRM (listado, perfil del cliente), gestión de formulario de onboarding.
54.	Edge Function analyze-onboarding-form: análisis GPT-4o de respuestas del cliente.
55.	Biblioteca de ejercicios del entrenador: gestión de ejercicios globales + añadir ejercicios propios + subir vídeos.
56.	Biblioteca de alimentos del entrenador: gestión de alimentos globales + añadir alimentos propios.
57.	Creador de menús: manual + generación con IA usando preferencias del cliente y biblioteca del entrenador.
58.	App móvil básica: los 4 módulos del cliente en React Native + Expo.
59.	Publicación en App Store y Google Play Store.

MCPs Necesarios — Fase 1
MCP / Conector	Para qué se usa en esta fase	Urgencia
GitHub MCP	Gestionar branches de los módulos, commits, PRs con descripción automática	🔴 Crítico
Vercel MCP	Deploy a staging de cada módulo; añadir GEMINI_API_KEY como secreto de Supabase Edge Functions	🔴 Crítico
Supabase MCP	Crear las Edge Functions analyze-food-image, generate-gym-routine, generate-meal-plan, analyze-onboarding-form; añadir GEMINI_API_KEY y OPENAI_API_KEY como secretos	🔴 Crítico
AWS S3 MCP	Crear bucket de Supabase Storage para vídeos de ejercicios del entrenador; configurar políticas de acceso	🟠 Alto
Google Calendar MCP	Configurar OAuth 2.0 de Google Calendar, implementar creación de eventos y sync bidireccional	🟠 Alto
Gmail MCP	Emails de bienvenida al entrenador y cliente, notificación de nuevo formulario completado	🟠 Alto
Fetch MCP	Consultar docs de Gemini 2.0 Flash multimodal, Google Calendar API v3, Expo Camera, react-beautiful-dnd	🟠 Alto
PostHog MCP	Eventos: signup_trainer, signup_client, promo_code_validated, photo_analyzed, routine_generated, menu_created, form_analyzed	🟡 Medio
Resend MCP	Plantillas de email con branding FitOS: bienvenida, formulario analizado, nuevo menú/rutina asignados	🟡 Medio

Criterios de Éxito — Fase 1
•	El formulario de onboarding del entrenador acepta al menos 8 tipos de campo y la IA genera el análisis en < 10 segundos.
•	El entrenador puede añadir un ejercicio propio con vídeo y el cliente lo ve reproducible en su app en < 2 minutos.
•	El entrenador puede añadir un alimento propio y aparece en el combobox de menús en < 30 segundos.
•	El combobox de alimentos muestra badges de preferencias del cliente correctamente.
•	El menú generado por IA solo contiene alimentos compatibles con las preferencias del cliente al 100%.
•	El cliente puede subir fotos de progreso y el entrenador las ve en la ficha del cliente en tiempo real.
•	El histórico de pesos se actualiza automáticamente al registrar una sesión.

FASE
2
Semanas 17–24	Pagos, Chat y Negocio
🎯 Objetivo: El entrenador puede cobrar a sus clientes, gestionar su suscripción, usar el chat interno y ver las métricas de su negocio.

Entregables Fase 2
60.	Pasarela de pagos Stripe: suscripción del entrenador + cobros del entrenador a sus clientes.
61.	Portal Stripe del cliente: gestión de método de pago, facturas, cancelación.
62.	Panel de métricas del negocio: MRR, churn, LTV, forecast.
63.	Chat interno cifrado entre entrenador y cliente.
64.	Área personal del entrenador: gestión del código promo, suscripción, marca blanca.
65.	Calendario de citas: reserva, tipos de sesión, sincronización con Google Calendar.
66.	Supabase Realtime para el dashboard del entrenador: actualizaciones en tiempo real de progreso del cliente.

MCPs Necesarios — Fase 2
MCP / Conector	Para qué se usa en esta fase	Urgencia
Stripe MCP	Crear productos (Starter/Pro/Elite/Clínica), precios, webhooks customer.subscription.updated/deleted, Stripe Connect para pagos entrenador→cliente	🔴 Crítico
Supabase MCP	Configurar Realtime para tablas body_metrics, weight_log, user_calendar; configurar Supabase Vault para tokens OAuth	🔴 Crítico
Vercel MCP	Configurar webhook de Stripe en /api/webhooks/stripe; añadir STRIPE_* a variables de entorno	🔴 Crítico
Gmail MCP	Factura mensual del entrenador, notificación de pago recibido, recordatorio de cita	🟠 Alto
Fetch MCP	Consultar docs de Stripe webhooks, Supabase Realtime, Supabase Vault	🟠 Alto
Figma MCP	Exportar assets del design system; revisar tokens del dashboard del entrenador	🟡 Medio
PostHog MCP	Eventos del entrenador: routine_assigned, meal_plan_assigned, payment_received, form_created	🟡 Medio

FASE
3
Semanas 25–36	IA Avanzada — RPE, CV, Wearables y Biométrica
🎯 Objetivo: RPE Engine, análisis biomecánico, Weekly AI Summary y wearables básicos (Apple Health, Google Fit).

Entregables Fase 3
67.	RPE Engine completo: registro de RPE, sugerencias de ajuste de carga con GPT-4o, aprendizaje por cliente.
68.	Computer Vision v1.0: 8 ejercicios, anotaciones sobre vídeo, reporte GPT-4o, feedback del entrenador.
69.	AI Inbox: asistente de preguntas con contexto del plan actual y el histórico.
70.	Weekly AI Summary: análisis por cliente con alertas de sobreentrenamiento y baja adherencia.
71.	Wearables básicos: Apple HealthKit (iOS) + Google Fit (Android) → biometric_data.
72.	Motor de auto-regulación básico: alertas de sueño < 6h y HRV bajo.
73.	Comandos de voz v1.0: registrar series y pesos por voz (español e inglés).
74.	Widget de iOS y Android: ver entrenamiento del día sin abrir la app.

MCPs Necesarios — Fase 3
MCP / Conector	Para qué se usa en esta fase	Urgencia
GitHub MCP	Gestionar services/ai-service (FastAPI Python) con RPE Engine LSTM; paquete packages/ai	🔴 Crítico
Vercel MCP	Desplegar microservicio IA en AWS ECS Fargate; variables OPENAI_API_KEY en Supabase (ya añadida en F1)	🔴 Crítico
Supabase MCP	Añadir Edge Functions rpe-suggestion, cv-analyze, weekly-summary; configurar bucket privado para vídeos CV con TTL 7 días	🔴 Crítico
OpenAI MCP	GPT-4o para CV feedback, AI Inbox, Weekly Summary; embeddings para búsqueda semántica de ejercicios	🔴 Crítico
AWS S3 MCP	Bucket privado para vídeos de Computer Vision con política de retención 7 días; presigned URLs	🟠 Alto
OneSignal MCP	Push notifications: alertas biométricas, RPE alto, recordatorios, actualizaciones de liga, nuevo análisis CV listo	🟠 Alto
Fetch MCP	Docs de Apple HealthKit, Google Fit REST API, MediaPipe Tasks Vision, Web Speech API, Whisper API	🟠 Alto
PostHog MCP	Feature flags para rollout gradual del RPE Engine; eventos cv_analysis_requested, rpe_suggestion_accepted	🟡 Medio

FASE
4
Semanas 37–48	Gamificación, Wearables Avanzados y Marketing Suite
🎯 Objetivo: Ligas, retos, Garmin/Whoop/Oura, auto-regulación completa, Landing Page Builder y Content Creator AI.

Entregables Fase 4
75.	Ligas de Consistencia y Retos Grupales: rankings, muro de actividad, badges personalizables.
76.	Wearables avanzados: Garmin Connect, Whoop, Oura Ring, Polar Flow.
77.	Motor de auto-regulación completo: 5 reglas configurables con 4 niveles de automatización.
78.	Landing Page Builder: 12 bloques, dominio personalizado, A/B testing, analytics de conversión.
79.	Content Creator AI: gráficas de progreso (peso corporal, medidas, 1RM) + captions RRSS.
80.	Pipeline CRM de leads: Kanban, formulario embebible, follow-up automáticos.

MCPs Necesarios — Fase 4
MCP / Conector	Para qué se usa en esta fase	Urgencia
GitHub MCP	Módulos /app/trainer/leagues, /app/trainer/marketing; adapters de wearables avanzados; Landing Page Builder	🔴 Crítico
Vercel MCP	Wildcard domains para dominios personalizados de los entrenadores (*.fitos.app + CNAME propios)	🔴 Crítico
Stripe MCP	Stripe Connect para marketplace; Payment Links vinculados a la landing; webhooks checkout.session.completed	🔴 Crítico
Supabase MCP	Edge Function content-creator v2 (usa datos de body_metrics y weight_log); Edge Function weekly-summary v2 con biométrica avanzada	🔴 Crítico
OpenAI MCP	DALL-E 3 para Content Creator AI (gráficas de progreso con branding); GPT-4o para captions RRSS y follow-up emails	🔴 Crítico
AWS S3 MCP	Assets generados por Content Creator AI (imágenes de progreso exportadas); URLs temporales para compartir	🟠 Alto
Gmail MCP	Secuencias de follow-up automáticas desde el email del entrenador; campañas de reactivación a ex-clientes	🟠 Alto
Resend MCP	Plantillas de follow-up con branding del entrenador; tracking de aperturas y clics	🟠 Alto
Fetch MCP	Docs de Garmin Health API (OAuth 2.0 + webhooks), Whoop API v1, Oura API v2, Polar AccessLink v3	🟠 Alto
PostHog MCP	Eventos de gamificación: league_created, badge_earned, challenge_joined; analytics de conversión de la landing	🟡 Medio
Algolia MCP	Indexar perfiles de entrenadores para el directorio público; búsqueda de la biblioteca de ejercicios (> 800 ejercicios)	🟡 Medio

FASE
5
Semanas 49–56	UX Frictionless y Pulido Final
🎯 Objetivo: Modo offline v2, voz v3, i18n, WCAG 2.1 AA, performance final. La app es perfecta.

Entregables Fase 5
81.	Modo offline v2: resolución de conflictos con UI clara, sync 100% transparente.
82.	Comandos de voz v3: wake word "Oye FitOS", español/inglés/portugués/francés, > 95% precisión.
83.	Widget mejorado iOS/Android: registrar serie completa sin abrir la app.
84.	Internacionalización (i18n): español, inglés, portugués; preparar alemán y francés.
85.	Accesibilidad WCAG 2.1 AA: auditoría completa; 0 issues en Lighthouse.
86.	Performance: LCP < 2.0s, INP < 150ms, CLS < 0.05 en todas las páginas críticas.
87.	Integración Buffer/Later: programar posts del Content Creator AI desde FitOS.

MCPs Necesarios — Fase 5
MCP / Conector	Para qué se usa en esta fase	Urgencia
GitHub MCP	PRs de performance, i18n, accesibilidad; tests Playwright y Detox automatizados	🔴 Crítico
Vercel MCP	Speed Insights para Web Vitals reales; Edge Config para feature flags de rendimiento	🟠 Alto
Supabase MCP	Optimizar índices PostgreSQL con pg_stat_statements; análisis de queries lentas en producción	🟠 Alto
PostHog MCP	Session recordings para identificar fricción en flujos de progreso y entrenamiento; funnels de activación	🟠 Alto
OpenAI MCP	Whisper API v3 para comandos de voz en entornos ruidosos (gimnasio con música alta)	🟡 Medio
Fetch MCP	Docs de Workbox (Service Workers), WidgetKit (iOS), Glance Widgets (Android), i18n best practices	🟡 Medio
Algolia MCP	Optimizar autocompletado del combobox de ejercicios y alimentos a < 50ms	🟡 Medio
Buffer MCP	Programación de posts de Content Creator AI en Instagram/LinkedIn/TikTok directamente desde FitOS	🟢 Bajo

FASE
6
Semanas 57+	Escala, API Pública y Marketplace
🎯 Objetivo: API pública, marketplace de plantillas, expansión internacional, SOC 2 Type II.

Entregables Fase 6
88.	API pública documentada (OpenAPI 3.0) con OAuth 2.0 para integraciones de terceros.
89.	Developer Portal: docs, sandbox, SDK JavaScript y Python.
90.	Marketplace de plantillas: entrenadores venden rutinas, planes y formularios (FitOS retiene 30%).
91.	Internacionalización completa: alemán, francés, italiano.
92.	Infraestructura multi-región: eu-west-1, us-east-1, sa-east-1.
93.	SOC 2 Type II: inicio del proceso de certificación.

MCPs Necesarios — Fase 6
MCP / Conector	Para qué se usa en esta fase	Urgencia
GitHub MCP	Developer Portal, SDKs públicos, repositorio del Marketplace, documentación OpenAPI	🔴 Crítico
Vercel MCP	Wildcards para Enterprise white-label; multi-región con Vercel Edge Network	🟠 Alto
Stripe MCP	Stripe Connect para marketplace con split de pagos; nuevos precios Enterprise	🟠 Alto
Supabase MCP	Read replicas multi-región; migración a Plan Enterprise de Supabase	🟠 Alto
AWS S3 MCP	Infraestructura multi-región con Terraform; replicación S3 cross-region; ECS multi-AZ	🟠 Alto
Fetch MCP	Docs de SOC 2 compliance, Supabase Enterprise, Stripe Connect marketplace, i18n avanzado	🟡 Medio
Algolia MCP	Índice del Marketplace: búsqueda por tipo, objetivo, nivel, idioma, precio, rating	🟡 Medio
Slack MCP	Alertas SLA Enterprise; resumen semanal de métricas; notificaciones de ventas en el marketplace	🟡 Medio


14. Métricas de Éxito — KPIs por Fase
KPI	Fin Fase 1	Fin Fase 3	Fin Fase 5	Fin Fase 6
Entrenadores pagantes	50	300	1.000	3.500
Clientes finales activos	300	4.000	18.000	75.000
MRR (€)	2.500 €	18.000 €	70.000 €	260.000 €
Monthly Churn Rate	< 9%	< 5%	< 3%	< 2%
NPS entrenadores	> 30	> 45	> 55	> 65
Adherencia media clientes	> 50%	> 65%	> 72%	> 78%
LCP (p75, usuarios reales)	< 3.0s	< 2.5s	< 2.0s	< 1.8s
CAC (€)	< 280 €	< 180 €	< 110 €	< 75 €
Precisión Calorie Tracker	> 75%	> 85%	> 90%	> 92%
Formularios analizados por IA	< 15s	< 10s	< 8s	< 6s

