# Architecture Rules — Code Patterns & Structure

## Fragmentar páginas complejas (>300 líneas)

- Crear carpeta `components/` junto al `page.tsx`.
- `types.ts` — interfaces compartidas.
- `shared.tsx` — utilidades, constantes, UI compartida.
- Un fichero por sección (`TabPerfil.tsx`, `TabChat.tsx`, etc.).
- `page.tsx` padre: solo orquestación (~250 líneas orientativo).
- **Fragmentar DURANTE la creación, no después.**
- Ejemplo de referencia: `trainer/clients/[id]/components/`.

## useReducer para estado complejo

- 8+ `useState` sueltos con estado interdependiente → obligatorio `useReducer` + custom hook.
- `useXxx.ts` junto al `page.tsx`. Acciones tipadas.
- Timers en el hook via `useRef` con cleanup.
- `savePartialProgress()` con 1 reintento + `toast.error`.
- `finalizeSession()` retorna boolean — si falla, NO redirigir; botón "Reintentar".
- Ejemplos: `useActiveTraining.ts`, `useNutritionPage.ts`, `useRoutinesPage.ts`.

## Error handling — Patrón C obligatorio

Toda query Supabase DEBE destructurar `error`:

**Bloqueante (saves/mutations/loads críticos):**
```ts
const { data, error } = await supabase.from("tabla").select("...");
if (error) {
  toast.error("Mensaje descriptivo en español");
  console.error("[NombreComponente] Contexto:", error);
  return;
}
```

**No bloqueante (datos secundarios de display):**
```ts
const { data, error } = await supabase.from("profiles")...;
if (error) { console.error("[Context] Error:", error); } // No bloqueante
```

## Performance patterns

- `Promise.all` para queries independientes — SIEMPRE. Nunca `await` secuenciales.
- `.limit()` en tablas crecientes (posts=50, messages=100-500, metrics=100).
- `React.memo` en componentes hoja reutilizables.
- `fetch("/api/...")` fire-and-forget para side effects no bloqueantes.
- `next/image` obligatorio para imágenes dinámicas.
- Filtro de rango de fechas obligatorio en queries de appointments.

## UI patterns

- `DarkSelect` obligatorio — nunca `<select>` nativo (Chrome/Windows lo muestra blanco).
- `useSearchParams` en "use client" requiere `<Suspense>` wrapper.
- `loading.tsx` obligatorio en rutas de dashboard.
- Confirmación 2 pasos para acciones destructivas (`confirmXxxId` state pattern).
- Toast de error para resource IDs inválidos en URL params.
- Sonner toast (`"sonner"`) — `<Toaster />` en layout raíz.

## Code quality

- `??` (no `||`) para merges de override — permite cadenas vacías y `false`.
- Constantes nombradas en lugar de magic strings/numbers en `lib/`.
- Verificar que archivos importados existen antes de referenciarlos.
- Batch insert en lugar de bucles en API routes.
- `useChat` hook compartido — no duplicar lógica de chat.
- `ClientOption` centralizado en `trainer/types.ts`.

## Shared packages

- `@kuvox/theme` — fuente de verdad para colores/spacing/radius/fonts.
- `@kuvox/shared` — tipos, zonas anatómicas, routine-logic, utils.
- Routine logic compartida en `packages/shared/src/routine-logic/`.
- NO migrar valores hardcoded existentes de tema — política "new code only".
- Tailwind v4 CSS-first — NO crear `tailwind.config.js`.
- `npm run sync-theme` regenera bloque `@theme` en `globals.css`.

## Auth flows

- Registro Trainer: 3 pasos (signup → onboarding wizard → promo code).
- Registro Cliente: promo code → 2 pasos (formulario trainer → biométricos).
- Middleware: sin sesión → `/login`. Onboarding incompleto → `/onboarding/[role]`. Cross-role → dashboard correcto.
- `onboarding_completed` se lee de `user_metadata` (sin query DB).

## Permissions architecture (3 layers)

- **Capa 1 — Middleware:** routing por rol, redirect cross-role.
- **Capa 2 — RLS:** `auth.uid()` scope por usuario en todas las tablas.
- **Capa 3 — API Routes:** verificación explícita de auth + role + ownership.
- Rol vive en: `auth.users.raw_user_meta_data.role` (JWT), `profiles.role` (DB), `AuthContext.role` (mobile).
