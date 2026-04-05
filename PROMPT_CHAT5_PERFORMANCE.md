# Chat 5: Optimizacion de queries y rendimiento

Lee CLAUDE.md completo antes de empezar.

Auditoria de rendimiento de TODAS las queries a Supabase.

## 1. Revisa CADA archivo que haga queries

Busca con: grep -r "supabase.from" apps/web/

Esto incluye page.tsx, hooks, API routes.

## 2. Para CADA query verifica

- Usa .select("*")? Cambiar a campos especificos
- Hay queries secuenciales independientes? Convertir a Promise.all (regla 103)
- Tabla que crece tiene .limit()? Anadir (regla 106)
- Query a appointments sin filtro de fecha? Anadir .gte/.lte (regla 105)
- Hay .from() dentro de un for/map loop? Batch con .in() (regla 107)

## 3. Busca N+1 queries

- Hay algun componente que haga una query por cada item de una lista?
- Convertir a una sola query con .in("id", [...ids])

## 4. Verifica React.memo (regla 101, 110)

- Componentes dentro de .map() DEBEN tener memo()
- Busca: grep -r "\.map(" apps/web/app --include="*.tsx"
- Si el componente mapeado no tiene memo, anadelo

## 5. Busca re-renders innecesarios

- Hay useState con objetos/arrays que se recrean en cada render?
- Hay funciones inline en props que deberian ser useCallback?
- Solo optimiza donde haya listas largas (>20 items)

## Reglas

Commitea y pushea despues de cada optimizacion.
Ejecuta al final para verificar que nada se rompio:
```
cd apps/web && npm run build
```
