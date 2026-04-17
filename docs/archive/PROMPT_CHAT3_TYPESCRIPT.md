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

---

## Resumen de ejecucion (02/04/2026)

### Web — `any` eliminados (24 instancias → ~6 restantes)
| Archivo | Cambio |
|---------|--------|
| trainer/import/page.tsx | 3x `catch (err: any)` → `catch (err: unknown)` |
| onboarding/trainer/page.tsx | 3x `catch (err: any)` → `catch (err: unknown)` |
| client/routine/active/components/ExerciseCard.tsx | 5x `as any` eliminados (SetConfig ya tiene target_rpe y set_type) |
| client/routine/components/ExerciseCard.tsx | 1x `(s as any).set_type` → `s.set_type` |
| client/routine/useClientRoutine.ts | `(state.routine as any).trainer_id` → añadido `trainer_id` a RoutineRaw + select |

### Mobile — `any` eliminados (22 instancias → ~5 restantes)
| Archivo | Cambio |
|---------|--------|
| widget-data.ts | 7x `any` → interface `WidgetExercise` local |
| useRoutineScreen.ts | 4x `as any` → tipos correctos (`SetEntry["type"]`, `PreviousSet & {...}`) |
| ActiveTraining.tsx | 3x `any` eliminados en `shouldShowRpe` |
| RegistrationMode.tsx | 3x `any` eliminados en `shouldShowRpe` |

### Instancias restantes (justificadas)
- `excel-parser.ts`: `Record<string, any>` para datos XLSX dinámicos (no tipable)
- `MetricChart.tsx`: `as any` en props de recharts (API de la libreria)
- `useActiveTraining.ts`: 1x `s: any` con eslint-disable (datos JSONB de DB)
- `Text.tsx` mobile: `let mappedStyle: any` (StyleSheet dynamics)
- `ReportModal.tsx`: `maxHeight: "85%" as any` (RN style compat)
