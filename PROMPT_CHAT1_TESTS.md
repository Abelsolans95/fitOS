# Chat 1: Tests + Performance

Lee CLAUDE.md completo antes de empezar, especialmente la regla 52 (Vitest) y la regla 58 (tests obligatorios).

## Parte 1: Tests

Actualmente solo hay 11 archivos de test (~5% coverage). Necesito cobertura seria en toda la logica de negocio.

### Archivos que DEBEN tener tests (prioridad por impacto)

API Routes (cada una: happy path + auth fail + validation fail + DB error):
- apps/web/app/api/complete-registration/route.ts
- apps/web/app/api/activate-client/route.ts
- apps/web/app/api/client-trainer/route.ts
- apps/web/app/api/import/excel/route.ts
- apps/web/app/api/import/reconcile/route.ts
- apps/web/app/api/import/create-exercises/route.ts

Lib (cada una: happy path + edge cases + error cases):
- apps/web/lib/exercise-resolver.ts
- apps/web/lib/food-resolver.ts
- apps/web/lib/excel-parser.ts
- apps/web/lib/email-notifications.ts
- apps/web/lib/google-calendar.ts
- apps/web/lib/onboarding-templates.ts

Hooks (logica de estado compleja):
- apps/web/hooks/useChat.ts
- apps/web/app/(dashboard)/app/trainer/routines/useRoutinesPage.ts
- apps/web/app/(dashboard)/app/trainer/nutrition/useNutritionPage.ts
- apps/web/app/(dashboard)/app/trainer/community/useCommunityPage.ts
- apps/web/app/(dashboard)/app/trainer/tickets/useTicketsPage.ts
- apps/web/app/(dashboard)/app/client/routine/active/useActiveTraining.ts

Shared packages:
- packages/shared/src/anatomy/zones.ts
- packages/shared/src/onboarding/index.ts

### Minimo por archivo de test
- Happy path completo
- 2-3 edge cases (datos vacios, nulls, arrays vacios, valores limite)
- 1-2 error cases (DB error, auth error, datos invalidos)
- Para API routes: verificar status codes (200, 400, 401, 403, 500)
- Para resolvers/utils: verificar con datos reales del schema de Supabase

### Patron de mocks (ver regla 52 de CLAUDE.md)
- Pasar cliente Supabase mock como parametro
- Usar createChain(result) + createMockSupabase(table -> result)
- Referencia: apps/web/lib/exercise-resolver.test.ts

### IMPORTANTE
Despues de escribir cada archivo de test, ejecutalo:
```
cd apps/web && npx vitest run [archivo.test.ts]
```
Si falla, corrige el test O el codigo fuente (si el bug es real) y vuelve a ejecutar hasta que pase. No me entregues tests que no pasen.

## Parte 2: Performance

Despues de los tests, audita los tiempos de carga. Ninguna query deberia tardar mas de 600ms.

Revisa estos patrones en todas las paginas bajo apps/web/app/(dashboard)/:

1. Promise.all para queries independientes — si hay 2+ await supabase.from(...) secuenciales que no dependen entre si, convertir a Promise.all (regla 103)
2. .select("campo1,campo2") en vez de .select("*") — nunca traer todas las columnas
3. .limit() en tablas que crecen — messages, community_posts, appointments, weight_log, food_log, body_metrics (regla 106)
4. Filtros de rango de fecha en appointments — siempre .gte() + .lte() (regla 105)

Para verificar, anade logs temporales en las funciones de carga:
```
const start = performance.now();
// ...queries...
console.log(`[NombrePagina] carga: ${(performance.now() - start).toFixed(0)}ms`);
```

Si alguna supera 600ms, optimizala (Promise.all, select especifico, limit, indices).

Elimina los console.log de performance cuando termines. Son solo para auditoria.

## Orden de ejecucion
1. Primero los tests de lib/ (logica pura, mas facil de testear)
2. Luego los tests de API routes
3. Luego los tests de hooks
4. Por ultimo la auditoria de performance

Commitea y pushea despues de cada grupo de tests completados.
