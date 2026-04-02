# Chat 3: Auditoria de TypeScript y tipos

Lee CLAUDE.md completo antes de empezar.

Auditoria de tipos TypeScript en todo el proyecto.

## 1. Busca TODOS los any en el codebase (apps/web + apps/mobile)

- Reemplaza cada any por un tipo correcto
- Si el tipo viene de Supabase, usa el tipo inferido de la query
- Si es un objeto complejo, crea una interface en el types.ts mas cercano
- Prioriza: API routes > lib/ > hooks > componentes

## 2. Busca TODOS los "as unknown as" y "as any"

- Son type casts inseguros. Reemplaza por type guards o tipos correctos
- Si el cast es necesario (ej: mocks en tests), dejalo pero anade comentario

## 3. Verifica que no haya errores de TypeScript

Ejecuta:
```
cd apps/web && npx tsc --noEmit
```
- Corrige TODOS los errores que salgan
- No uses @ts-ignore ni @ts-expect-error como solucion

## 4. Busca funciones sin tipo de retorno explicito en lib/

- Todas las funciones exportadas en lib/ deben tener return type
- Ejemplo: export function resolveExercise(...): Promise<Exercise[]>

## Reglas

Commitea y pushea despues de cada archivo corregido.
No rompas funcionalidad existente — si no estas seguro del tipo, dejalo y anota.
