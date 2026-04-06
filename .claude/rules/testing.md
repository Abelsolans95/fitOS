# Testing Rules — Vitest

## Setup

- Framework: Vitest 4.x + happy-dom. Instalado en `apps/web`.
- Config: `apps/web/vitest.config.ts` con alias `@/*`.
- Ejecutar: `npm test` (una pasada) o `npm run test:watch` (watch).

## Convenciones

- Archivos junto al archivo que testean: `lib/foo.test.ts` testea `lib/foo.ts`.
- Tests obligatorios al crear módulos de lógica (`lib/*.ts`). Mínimo: happy path + 1 edge case + 1 error case.
- Crear `.test.ts` en la misma sesión — no esperar a code review.

## Mocks de Supabase

- Pasar cliente mock como parámetro (no `vi.mock` del módulo).
- Usar `createChain(result)` + `createMockSupabase(table → result)`.
- Referencia: `exercise-resolver.test.ts`.

## Ejemplos de referencia

- `exercise-resolver.test.ts` — 9 tests, three-layer resolver.
- `complete-registration/route.test.ts` — 7 tests: happy path, missing fields, DB errors, promo resilience.
- `client-trainer/route.test.ts` — 8 tests: happy path, unauth, no trainer, DB errors.
- `excel-parser.test.ts` — buffers XLSX en memoria con `wb.xlsx.writeBuffer()`.
- `email-notifications.test.ts` — stub con `vi.stubEnv`.
