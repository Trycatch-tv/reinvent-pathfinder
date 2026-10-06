---
type: feature
id: WI-020
title: Integración de agenda personal y favoritos
knowledge_level: K3
status: completed
phase: now
initiative: INI-007
domains:
  - aws-events
  - experience
related_domain: AWS Events
related_capabilities:
  - event-navigation
  - schedule-management
code:
  - packages/events-client/src/types/user-schedule.ts
  - packages/events-client/src/client/aws-events-client.ts
  - packages/events-client/src/events-client.test.ts
  - apps/client/src/App.tsx
  - apps/client/src/components/AvailabilityHeatmap.tsx
  - apps/client/src/client.test.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: medium
refined_by: work-item-agent
implemented_by: implementation-agent
project_state: ai-assisted
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-006
source_initiative: INI-007
ready_at: '2026-10-06'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - .kaddo/context-pack.json
        - .kaddo/context-pack.md
        - .kaddo/scan.json
        - .kaddo/understand.md
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
        - apps/client/src/components/AvailabilityHeatmap.tsx
        - >-
          knowledge/delivery/initiatives/INI-007-live-event-experience-disponibilidad-agenda-y-rese.md
        - knowledge/tech/current-state.md
        - packages/events-client/src/client/aws-events-client.ts
        - packages/events-client/src/events-client.test.ts
        - packages/events-client/src/types/user-schedule.ts
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-06'
completed_at: '2026-10-06'
---

# Integración de agenda personal y favoritos

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-006.

## Problem

El catálogo live muestra sesiones y disponibilidad, pero no refleja la agenda personal ni permite administrar favoritos con el estado confirmado por AWS Events.

_Expected value:_ `GetSchedule` y favoritos reconciliados con el mapa de disponibilidad.

## Actor and Outcome

Como asistente autenticado y registrado para el evento, puedo consultar mi agenda real, identificar mis reservas y favoritos en el heatmap, y agregar o quitar un favorito sabiendo que la UI muestra el estado confirmado por AWS Events.

## Current and Target State

`AwsEventsClient` conserva rutas y shapes demo para agenda/favoritos (`/user/schedule` y favoritos individuales) que no corresponden al contrato actual. El heatmap live no representa la agenda del asistente.

El objetivo es usar `GET /v1/events/{eventId}/schedule` como fuente de verdad, cuyos arrays `reserved`, `favorites` y `personalTime` representan la agenda del asistente; usar `POST /favorites` con `sessionIds` y `DELETE /favorites/{sessionId}` para favoritos; y reconciliar la interfaz solo después de leer de nuevo `GetSchedule`.

## Official API Contract

- `GetSchedule` requiere sesión Builder ID y registro para el evento; retorna siempre `schedule.reserved`, `schedule.favorites` y `schedule.personalTime`, incluso vacíos.
- `reserved` y `favorites` contienen IDs; se enriquecen exclusivamente con el catálogo live ya cargado, sin hacer un request por sesión.
- `POST /v1/events/{eventId}/favorites` admite de 1 a 10 IDs distintos y responde por sesión en `result.successful` y `result.failed`; un `200` no significa que todos se marcaron ni es seguro repetir a ciegas.
- `DELETE /v1/events/{eventId}/favorites/{sessionId}` retorna `204`; `404` significa que ese favorito ya no existe.
- Un favorito expresa interés, no reserva ni disponibilidad.

## End-to-End Flow

Builder ID activo + `eventId` configurado + snapshot de catálogo live → acción “Actualizar mi agenda” → `GetSchedule` → enriquecer IDs con el snapshot en memoria → heatmap y panel muestran reservado/favorito/personal time y hora de sincronización → el usuario marca o elimina favorito → respuesta por sesión → `GetSchedule` de reconciliación → UI refleja exclusivamente el estado retornado por AWS Events. Ante fallos, la última agenda confirmada permanece visible con aviso y nunca se confirma un cambio optimista.

## Scope

- Sustituir en `@pathfinder/events-client` los tipos y rutas demo de agenda/favoritos por el contrato oficial basado en `eventId`.
- Modelar un snapshot de agenda en memoria que preserve IDs, reservas, favoritos y bloques `personalTime`; enriquecer sesiones únicamente desde el catálogo live disponible.
- Mostrar en `/availability` el estado de agenda por sesión, un resumen de agenda y acciones accesibles para agregar/quitar favoritos.
- Tras cada intento de mutación, inspeccionar resultados parciales y recargar `GetSchedule`; comunicar éxitos, fallos y estado no confirmado sin exponer tokens o detalles sensibles.
- Reutilizar `InMemoryTokenStore`, `VITE_AWS_EVENT_ID` y el proxy de desarrollo de WI-019. Mantener fallback local explícito si falta configuración, login, registro o snapshot live.
- Cubrir respuesta vacía, IDs desconocidos, `personalTime`, éxitos y fallos parciales de favoritos, `404` al eliminar, `401`/`403`/`429` y preservación del último snapshot confirmado.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| AWS Events adapter | Affected: contrato `GetSchedule`, mutaciones de favoritos, resultados parciales y reconciliación. |
| Frontend / `apps/client` | Affected: refresco de agenda, señales por sesión, panel/resumen y acciones de favorito. |
| Authentication | Reviewed, not changed: reutiliza exclusivamente el token efímero de Builder ID. |
| Domain | Reviewed, not changed: reutiliza `SessionCandidate` y availability; la agenda permanece como adapter/UI state. |
| Configuration | Reviewed, not changed: usa el `eventId` no secreto y proxy ya configurados en WI-019. |
| Backend, database, AI, notifications, analytics | Not applicable. |
| Documentation | Affected: evidencia y aprendizaje al cierre. |

## Module Coverage

- `reinvent-pathfinder` — affected: adapter de AWS Events y cliente web en el mismo módulo mapeado.

## Scope Unknowns

- `GetSchedule` solo entrega IDs de sesiones; se mostrará detalle únicamente para IDs presentes en el catálogo live ya cargado. Los IDs no resueltos se conservan en el resumen como no enriquecidos, sin lanzar una lectura por cada sesión.
- La agenda real depende de que la cuenta Builder ID esté registrada para `eventId`; un `403` comunica ese requisito.
- El contrato live de AWS Events fue confirmado mediante OpenAPI y documentación. La validación manual debe confirmar qué combinación de favoritos/reservas tiene la cuenta de prueba.

## Acceptance Criteria

- [x] `AwsEventsClient` usa `GET /v1/events/{eventId}/schedule` y normaliza `reserved`, `favorites` y `personalTime`, tolerando arrays vacíos y manteniendo IDs desconocidos sin fetches por sesión.
- [x] El cliente usa `POST /favorites` con `sessionIds` y `DELETE /favorites/{sessionId}` conforme al contrato oficial, distingue éxitos/fallos parciales y no trata un `200` como éxito global.
- [x] Después de cada mutación de favorito, la UI recarga `GetSchedule`; solo entonces refleja el favorito agregado o retirado.
- [x] El heatmap identifica de forma accesible sesiones reservadas y favoritas, ofrece actualizar agenda y acciones de favorito, y muestra el momento del último snapshot confirmado.
- [x] La UI preserva la última agenda confirmada ante un refresh o mutación fallida y comunica de forma accionable `401`, `403`, `404` de favorito inexistente y `429`, sin revelar tokens.
- [x] Sin `eventId`, sesión, registro o catálogo live válido, la agenda/favoritos permanece en modo local explícito y no ejecuta mutaciones.
- [x] Pruebas cubren respuesta vacía, `personalTime`, IDs sin catálogo, batch parcial, eliminación `404`, errores de acceso/throttling y reconciliación posterior; validación manual consulta y modifica un favorito autorizado.

## Out of Scope

- Crear, editar o borrar `personalTime`.
- Reservar, cancelar reservas, waitlist o cualquier operación de seating; pertenecen a WI-CANDIDATE-007.
- Polling, sincronización entre pestañas, cache persistente, backend/proxy desplegado, notificaciones o analítica.
- Inferir una reserva o favorito localmente, cambiar disponibilidad, o persistir tokens.

## Validation

```bash
corepack pnpm --filter @pathfinder/events-client test
corepack pnpm --filter @pathfinder/client test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
kaddo guard
```

Validación manual: con Builder ID autenticado, `VITE_AWS_EVENT_ID=reinvent2026` y cuenta registrada, cargar disponibilidad live → actualizar agenda → identificar un favorito existente o marcar uno → verificar resultado y refresco de agenda → quitarlo → confirmar el estado resultante mediante `GetSchedule`. Verificar también que un fallo posterior conserva la última agenda visible.

## Definition of Done

- Adapter alineado al contrato actual de agenda y favoritos de AWS Events, con reconciliación post-mutación.
- Heatmap y resumen comunican agenda, favoritos, timestamp, estados de carga/error y fallback accesible.
- No hay confirmación optimista, persistencia de tokens ni lecturas N+1 para enriquecer la agenda.
- Evidencia de pruebas y validación manual capturada antes del cierre.

## Open Questions

No hay preguntas abiertas bloqueantes para refinar el contrato. La disponibilidad de una cuenta registrada con favoritos de prueba se trata como validación manual externa; no se codificarán IDs, tokens ni datos de una cuenta real.

## Suggested Ownership

- `packages/events-client/src/types/user-schedule.ts`
- `packages/events-client/src/client/aws-events-client.ts`
- `packages/events-client/src/events-client.test.ts`
- `apps/client/src/App.tsx`
- `apps/client/src/components/AvailabilityHeatmap.tsx`
- `apps/client/src/client.test.ts`

## Related Decisions

No hay ADR ni candidato de decisión técnica que bloquee este Work Item. La elección de proxy local ya se validó como parte de WI-019 y no introduce infraestructura desplegada.

## Learning

El contrato actual de GetSchedule entrega arrays de IDs en schedule y las mutaciones de favoritos pueden ser parciales; por eso la interfaz debe reconciliarse leyendo de nuevo la agenda antes de confirmar cambios. La validacion live con Builder ID y reinvent2026 confirmo agenda y una alta de favorito; tokens y snapshots permanecen solo en memoria.
