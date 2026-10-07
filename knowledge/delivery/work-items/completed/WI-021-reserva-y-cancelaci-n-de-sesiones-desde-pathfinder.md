---
type: feature
id: WI-021
title: Reserva y cancelación de sesiones desde Pathfinder
knowledge_level: K3
status: completed
phase: now
initiative: INI-007
domains:
  - aws-events
  - experience
related_domain: AWS Events
related_capabilities:
  - schedule-management
  - reservations
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
source_id: WI-CANDIDATE-007
source_initiative: INI-007
generated_by: kaddo-create
template_version: 1
summary: >-
  Pathfinder permite consultar disponibilidad y agenda, pero no reservar ni
  cancelar sesiones desde la experiencia autenticada con estado confirmado por
  AWS Events.
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
verified_at: '2026-10-07'
completed_at: '2026-10-07'
---

# Reserva y cancelación de sesiones desde Pathfinder

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-007.

## Problem

Pathfinder permite consultar disponibilidad y agenda, pero no reservar ni cancelar sesiones desde la experiencia autenticada con estado confirmado por AWS Events.

_Expected value:_ completar el journey operativo sin abandonar Pathfinder, sin inferir reservas ni reintentar escrituras no idempotentes.

## Actor and Outcome

Como asistente autenticado y registrado para el evento, puedo reservar una sesión elegible o cancelar una reserva propia desde su detalle y ver únicamente el estado confirmado por AWS Events.

## Current and Target State

`AwsEventsClient` y el heatmap ya leen `GetSchedule` y gestionan favoritos, pero no exponen mutaciones de reservas. El detalle solo indica si una sesión está reservada.

El objetivo es llamar `POST /v1/events/{eventId}/reservations` con entre uno y diez `sessionIds` distintos y procesar cada resultado; cancelar mediante `DELETE /v1/events/{eventId}/reservations/{sessionId}`; y siempre releer `GetSchedule` antes de actualizar la UI. Las operaciones de escritura no se reintentan automáticamente.

## Official API Contract

- `ReserveSessions` requiere Builder ID y registro en el evento; recibe entre 1 y 10 IDs de sesión distintos y reporta éxito o fallo por sesión.
- Un `200` no implica éxito global: los fallos pueden representar sesión llena, choque horario o una reserva existente. Reenviar la misma solicitud no es un retry seguro.
- `CancelReservation` elimina una reserva por `sessionId`; un `404` confirma que ya no existe y debe comunicarse sin afirmar una cancelación nueva.
- `GetSchedule` es la fuente de verdad y se debe leer tras cada cambio para confirmar la agenda real.

## End-to-End Flow

Builder ID activo + `eventId` + catálogo y agenda live → usuario abre una sesión → la UI habilita “Reservar” solo cuando no está ya reservada y el contexto live es válido → `ReserveSessions` retorna resultado por sesión → `GetSchedule` reconcilia → detalle y matriz reflejan la reserva confirmada. Para una reserva existente, el usuario elige “Cancelar reserva” → `CancelReservation` → `GetSchedule` → UI muestra el estado confirmado. Errores de acceso, throttling, conflicto, lleno o `404` conservan el último snapshot de agenda y muestran un mensaje accionable.

## Scope

- Añadir al adapter de AWS Events tipos y métodos para reservar una o más sesiones y cancelar una, conforme al contrato de `eventId`.
- Modelar resultados parciales y códigos/choques devueltos por AWS sin inventar significados para códigos desconocidos.
- Extender el detalle de `/availability` con acciones accesibles de reservar/cancelar y estados de carga por sesión.
- Reconciliar con `GetSchedule` tras cada mutación y conservar la última agenda confirmada ante fallo.
- Cubrir fixtures, respuesta parcial, sesión llena/conflicto/ya reservada, `404` al cancelar, `401`, `403`, `429` y ausencia de configuración o catálogo live.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| AWS Events adapter | Affected: rutas, payloads, resultados parciales, no-retry y reconciliación. |
| Frontend / `apps/client` | Affected: acciones de reserva, mensajes y estado confirmado por sesión. |
| Authentication | Reviewed, not changed: reutiliza token efímero Builder ID. |
| Domain | Reviewed, not changed: usa `SessionCandidate` y agenda del adapter/UI. |
| Configuration | Reviewed, not changed: reutiliza `VITE_AWS_EVENT_ID` y el proxy local. |
| Backend, database, AI, notifications, analytics | Not applicable. |
| Documentation | Affected: aprendizaje y estado técnico al cierre. |

## Module Coverage

- `reinvent-pathfinder` — affected: adapter y cliente web del mismo módulo mapeado.

## Scope Unknowns

- La documentación garantiza códigos de fallo extensibles; la UI presentará mensajes específicos solo para lleno, conflicto y ya reservada cuando estén presentes, y un rechazo genérico para códigos desconocidos.
- La validación live de mutación requiere una cuenta o sesión de prueba autorizada. La agenda personal real del asistente no se usará para reservar ni cancelar como prueba. No se codificarán IDs, datos ni tokens de una cuenta real.
- La disponibilidad de una acción de reserva depende del evento y registro actuales; un `403` o un resultado parcial es comportamiento esperado del proveedor, no una autorización para inferir el estado.

## Acceptance Criteria

- [x] `AwsEventsClient` usa `POST /v1/events/{eventId}/reservations` con entre 1 y 10 IDs distintos, procesa éxitos y fallos por sesión y no reintenta la escritura automáticamente.
- [x] `AwsEventsClient` usa `DELETE /v1/events/{eventId}/reservations/{sessionId}`; un `404` se comunica como reserva inexistente y no altera de forma optimista la agenda.
- [x] Después de reservar o cancelar, la UI relee `GetSchedule`; solo entonces muestra reserva agregada o retirada y preserva la última agenda confirmada si falla la mutación o la reconciliación.
- [x] El detalle de una sesión live ofrece acciones accesibles de reservar o cancelar según la agenda confirmada, con estado de carga y mensajes accionables para lleno, conflicto, ya reservada, `401`, `403` y `429`.
- [x] Sin `eventId`, Builder ID, registro, catálogo live o snapshot de agenda válido, no se ejecutan mutaciones de reserva y la UI explica el requisito.
- [x] Pruebas cubren éxito, batch parcial, lleno/conflicto/ya reservada, cancelación `404`, acceso/throttling y reconciliación. La validación de una mutación contra AWS Events queda diferida hasta tener una cuenta o sesión de prueba autorizada, para no alterar la agenda real.

## Out of Scope

- Waitlist, transferencias, modificación de `personalTime`, reservas automáticas, polling, sincronización entre pestañas, cache persistente, backend o proxy desplegado.
- Cambiar la normalización de disponibilidad o inferir reservabilidad desde señales incompletas.
- Recomendaciones IA, persistencia de tokens, analítica y notificaciones.

## Validation

```bash
corepack pnpm --filter @pathfinder/events-client test
corepack pnpm --filter @pathfinder/client test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
kaddo guard
```

Validación manual no destructiva: con Builder ID autenticado, `VITE_AWS_EVENT_ID=reinvent2026`, catálogo live y cuenta registrada, abrir una sesión no disponible → confirmar que no ofrece reserva y comunica el requisito. La reserva/cancelación live se validará únicamente con una cuenta o sesión de prueba autorizada; no se modificará la agenda personal real.

## Definition of Done

- Adapter alineado a `ReserveSessions` y `CancelReservation`, con resultados parciales y sin retries de escritura.
- UI accesible muestra acciones y solamente el estado de agenda reconciliado.
- Pruebas locales sin credenciales y evidencia manual no destructiva registrada; evidencia live de mutación diferida hasta disponer de una cuenta o sesión de prueba autorizada.
- Conocimiento técnico y aprendizaje actualizados; `kaddo guard` revisado antes de commit.

## Open Questions

No hay preguntas bloqueantes. Los códigos de fallo adicionales de AWS se manejarán de manera segura como rechazo genérico hasta tener un significado documentado.

## Suggested Ownership

- `packages/events-client/src/types/user-schedule.ts`
- `packages/events-client/src/client/aws-events-client.ts`
- `packages/events-client/src/events-client.test.ts`
- `apps/client/src/App.tsx`
- `apps/client/src/components/AvailabilityHeatmap.tsx`
- `apps/client/src/client.test.ts`

## Related Decisions

No hay ADR ni candidato de decisión técnica bloqueante. Se conserva la decisión existente de usar AWS Events como fuente de verdad y el proxy de desarrollo local.

## Learning

Las reservas deben requerir tanto isReservable como disponibilidad actual disponible o limitada; las mutaciones no se reintentan y se reconcilian con GetSchedule. La cobertura automatizada valida los flujos, mientras que la mutación live queda diferida hasta contar con una cuenta o sesión de prueba autorizada para no alterar la agenda personal real.
