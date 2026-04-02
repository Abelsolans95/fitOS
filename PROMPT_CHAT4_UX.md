# Chat 4: Auditoria de UX y textos

Lee CLAUDE.md completo antes de empezar.

Auditoria de experiencia de usuario en toda la web.

## 1. Loading states

- Abre CADA page.tsx bajo apps/web/app/(dashboard)/
- Tiene loading.tsx o skeleton mientras carga?
- Los botones muestran spinner/disabled mientras procesan?
- Hay pantallas que se quedan en blanco sin feedback?
- Si falta, anade loading state apropiado

## 2. Mensajes de error

- Busca todos los toast.error() y console.error()
- Los mensajes son en espanol y descriptivos?
- Hay algun error que muestre texto tecnico al usuario?
- Reemplaza mensajes genericos por especificos:
  - MAL: "Error"
  - BIEN: "No se pudo guardar la rutina. Intentalo de nuevo."

## 3. Estados vacios

- Que ve el trainer cuando no tiene clientes? Y sin rutinas?
- Que ve el cliente cuando no tiene rutina asignada? Ni menu?
- Cada lista vacia debe tener mensaje + CTA claro
  - Ejemplo: "No tienes rutinas. Crea tu primera rutina"

## 4. Textos en ingles perdidos

- Busca cualquier texto visible al usuario que este en ingles
- Traduce a espanol (la app es 100% espanol)
- Incluye: placeholders, tooltips, labels, mensajes de error, botones

## 5. Confirmaciones destructivas (regla 99)

- Busca botones de "Eliminar", "Cancelar cita", "Borrar"
- Todos tienen confirmacion en dos pasos?
- Si no, implementa el patron de CLAUDE.md regla 99

## Reglas

Commitea y pushea despues de cada grupo de cambios.
