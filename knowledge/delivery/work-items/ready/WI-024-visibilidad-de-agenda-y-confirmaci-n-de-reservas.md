---
type: bugfix
id: WI-024
title: Visibilidad de agenda y confirmación de reservas
knowledge_level: K2
status: ready
phase: now
initiative: INI-007
domains:
  - experience
  - aws-events
related_domain: Experience
related_capabilities:
  - schedule-management
  - reservations
code:
  - apps/client/src/App.tsx
  - apps/client/src/components/AvailabilityHeatmap.tsx
  - apps/client/src/client.test.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
created_at: '2026-10-07'
source: validation-gap
source_id: WI-021
source_initiative: INI-007
generated_by: kaddo-create
template_version: 1
ready_at: '2026-10-07'
---

# Visibilidad de agenda y confirmación de reservas

## Problem

Actualizar la agenda muestra conteos y marcas dispersas en la matriz, pero no una lista verificable de reservas/favoritos ni una confirmación explícita de que una reserva quedó en el snapshot de AWS Events.

## Actor and Outcome

Como asistente, después de actualizar mi agenda puedo revisar una lista de mis reservas y favoritos conocidos. Al reservar, recibo “Reserva confirmada” únicamente cuando el `sessionId` aparece en la respuesta reconciliada de `GetSchedule`.

## Current and Target State

La UI conserva `reservedSessionIds` y `favoriteSessionIds`, pero solo renderiza el resumen numérico y etiquetas dentro de una matriz grande. La mutación informa una reconciliación genérica, sin comprobar el ID objetivo.

El objetivo es renderizar un panel “Mi agenda confirmada” con sesiones del catálogo live cargado, conservar el conteo de IDs aún no resueltos y comparar el resultado de `GetSchedule` contra el ID de la mutación. Si el ID no aparece, se comunica que AWS no confirmó la reserva aunque la respuesta inicial no haya sido un error.

## Scope

- Listar reservas y favoritos confirmados que existan en el catálogo visible, con código, título y estado de agenda.
- Informar de forma segura cuántos IDs de agenda no pudieron enriquecerse sin realizar requests por sesión.
- Cambiar el mensaje post-reserva para confirmar explícitamente solo cuando el ID esté en `reservedSessionIds` tras la reconciliación.
- Mantener la última agenda confirmada ante errores y conservar la protección contra estado optimista.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| Frontend / `apps/client` | Affected: panel de agenda y mensajes post-mutación. |
| AWS Events adapter | Reviewed, not changed: `GetSchedule` continúa siendo la fuente de verdad. |
| Authentication, domain, backend, database, configuration, analytics | Not applicable. |

## Module Coverage

- `reinvent-pathfinder` — affected: estado de UI, heatmap y pruebas del módulo mapeado.

## Acceptance Criteria

- [ ] Tras “Actualizar mi agenda”, la UI lista reservas y favoritos cuyos IDs estén presentes en el catálogo live, y comunica el número de IDs no enriquecidos sin lecturas N+1.
- [ ] Tras intentar reservar, la UI muestra “Reserva confirmada” solo si el ID objetivo aparece en `reservedSessionIds` del snapshot reconciliado; en caso contrario explica que AWS no la confirmó.
- [ ] El panel conserva etiquetas y navegación accesibles, no expone tokens y mantiene el último snapshot confirmado ante fallo.
- [ ] Las pruebas cubren lista de agenda, IDs desconocidos, reserva confirmada y respuesta de reserva no confirmada tras reconciliación.

## Out of Scope

- Modificar reservas reales para probar, polling, cache persistente, búsqueda de sesiones faltantes, waitlist, `personalTime`, notificaciones o backend.

## Validation

```bash
corepack pnpm --filter @pathfinder/client test
corepack pnpm lint
corepack pnpm typecheck
```

Validación manual no destructiva: actualizar agenda con Builder ID y confirmar que el panel coincide con el resumen, sin crear ni cancelar reservas reales.

## Definition of Done

- Agenda confirmada visible y trazable al catálogo live en memoria.
- Confirmación de reserva vinculada al snapshot reconciliado, no a un `200` aislado.
- Pruebas y controles de calidad pasan.

## Open Questions

No hay preguntas bloqueantes. IDs que AWS devuelve pero el catálogo live no contiene se conservarán en el conteo, no se consultarán individualmente.

## Learning

_What did we learn? Update after completion._
