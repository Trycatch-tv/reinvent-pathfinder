---
type: feature
id: WI-017
title: UI local-first del Session Availability Heatmap
knowledge_level: K2
status: completed
phase: now
initiative: INI-007
domains:
  - experience
  - aws-events
related_domain: experience
related_capabilities:
  - event-navigation
  - session-availability
code:
  - apps/client/src/App.tsx
  - apps/client/src/components/AvailabilityHeatmap.tsx
  - apps/client/src/fixtures/availability-heatmap.ts
  - apps/client/src/client.test.ts
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-003
source_initiative: INI-007
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
ready_at: '2026-10-06'
started_at: '2026-10-06'
implementation_evidence:
  repositories:
    reinvent-pathfinder:
      role: core
      status: completed
      changed_paths:
        - apps/client/src/App.tsx
        - apps/client/src/components/AvailabilityHeatmap.tsx
        - apps/client/src/fixtures/availability-heatmap.ts
        - apps/client/src/client.test.ts
      validations:
        - command: corepack pnpm --filter @pathfinder/client test
          status: passed
          reason: '10 pruebas del cliente en verde, incluidas ruta, filtro y detalle.'
        - command: corepack pnpm lint
          status: passed
          reason: ESLint finalizó sin errores.
        - command: corepack pnpm typecheck
          status: passed
          reason: Project references de TypeScript completaron sin errores.
        - command: corepack pnpm test
          status: passed
          reason: Suite completa del workspace en verde.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-06'
completed_at: '2026-10-06'
---

# UI local-first del Session Availability Heatmap

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-003.

## Problem

El cliente no expone aún una vista de disponibilidad; el contrato y la proyección de dominio existen, pero un asistente no puede inspeccionar visualmente qué sesiones de demo están disponibles por horario y venue.

_Expected value:_ una matriz local-first, accesible y filtrable que presenta la disponibilidad sin requerir autenticación ni llamadas a AWS Events.

## Actor and Outcome

Como asistente a re:Invent, puedo abrir `/availability`, filtrar sesiones de demo y leer su estado, horario, venue y detalle sin depender solo del color.

## Current and Target State

Actualmente `apps/client` inicia en el flujo de contexto y no tiene una vista ni datos de UI para availability. Tras este Work Item, la ruta local `/availability` renderizará una matriz basada en `projectSessionAvailability`, el catálogo de demo ya normalizado y una fixture local de disponibilidad con IDs compatibles.

## Entry Points

- URL local `http://localhost:8484/availability`.
- Navegación desde la pantalla principal hacia la vista de disponibilidad.

## End-to-End Flow

Abrir `/availability` → cargar catálogo y fixture local en memoria → proyectar con `@pathfinder/domain` → seleccionar filtros → actualizar la matriz y su resumen accesible → seleccionar una sesión → ver detalle de metadata y disponibilidad.

## Scope

- Crear un componente de heatmap accesible en `apps/client` que consuma `projectSessionAvailability`.
- Añadir una fixture local de disponibilidad cuyos `sessionId` correspondan con el catálogo demo de `@pathfinder/events-client`.
- Exponer una ruta local `/availability` sin incorporar una librería de routing; la selección de vista se resuelve con `window.location.pathname`.
- Incluir filtros locales por día, venue, formato, nivel y estado de disponibilidad, más una acción para restablecerlos.
- Usar una tabla semántica con encabezados de horario y venue; cada celda debe incluir texto de estado, no solo color.
- Mostrar un panel o sección de detalle al seleccionar una sesión: código, título, horario, venue/sala, disponibilidad, tipo, nivel, topics y última actualización si existe.
- Añadir pruebas de renderizado para ruta, matriz, filtros y detalle usando fixtures, sin navegador real ni red.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| Frontend / `apps/client` | Affected: ruta local, componente, fixture y pruebas. |
| Domain | Reviewed, not changed: consume la proyección terminada en WI-016. |
| AWS Events adapter | Reviewed, not changed: reutiliza solo sus fixtures y normalizador ya públicos. |
| Authentication, backend, database, AI | Not applicable. |
| Configuration / release | Reviewed, not changed: conserva Vite en el puerto local 8484. |
| Documentation | Affected: evidencia y aprendizaje de WI-017 al completar. |

## Module Coverage

- `reinvent-pathfinder` — affected: el monorepo contiene la UI y sus dependencias locales.

## Scope Unknowns

- La decisión de UX móvil (priorizar venue u horario) continúa diferida; esta primera vista debe permanecer usable con scroll horizontal y encabezados explícitos, sin diseñar una navegación móvil alternativa.
- El estado de agenda, favorito y reserva no está disponible en este slice de fixtures; el detalle no debe inventarlo y esos indicadores llegan con WI-006 y WI-007.

## Acceptance Criteria

- [x] Abrir `/availability` muestra un heatmap construido desde `projectSessionAvailability`, catálogo de demo y una fixture local compatible, sin red ni credenciales.
- [x] La matriz usa estructura semántica accesible y cada celda expone por texto el estado de disponibilidad además de cualquier color decorativo.
- [x] El usuario puede filtrar por día, venue, formato, nivel y estado de disponibilidad; los filtros actualizan los resultados y pueden restablecerse.
- [x] Al seleccionar una sesión, se muestra código, título, horario, venue/sala, estado, tipo, nivel, topics y `lastUpdatedAt` cuando exista.
- [x] La vista representa `unknown` explícitamente y no lo confunde con disponibilidad confirmada.
- [x] Las pruebas del cliente validan al menos el render de `/availability`, un filtro aplicado y el detalle de sesión usando fixtures locales.

## Out of Scope

- Login Builder ID, OAuth, tokens, catálogo live, refresh, `429` o reconciliación con AWS Events.
- Agenda personal, favoritos, reservas, cancelaciones y sus indicadores visuales.
- Librería de routing, persistencia de filtros, geolocalización, mapa indoor, IA o recomendaciones.
- Rediseño del flujo de contexto o del Learning Path existente.

## Validation

```bash
corepack pnpm --filter @pathfinder/client test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
kaddo guard
```

Validación manual: ejecutar `corepack pnpm dev`, abrir `http://localhost:8484/availability`, aplicar y restablecer filtros, seleccionar una sesión y comprobar que el detalle contiene su metadata y estado textual.

## Definition of Done

- La ruta local, matriz, filtros, detalle y fixture están implementados exclusivamente en `apps/client`.
- El componente reutiliza la proyección de dominio y no duplica su lógica de filtrado o agrupación.
- Pruebas del cliente y validaciones del Work Item en verde.
- Evidencia de implementación registrada y `kaddo verify WI-017 --yes` ejecutado antes de solicitar el cierre.

## Open Questions

No hay preguntas abiertas bloqueantes. La prioridad móvil permanece diferida y no altera la primera vista desktop/local-first.

## Suggested Ownership

- `apps/client/src/App.tsx`
- `apps/client/src/components/AvailabilityHeatmap.tsx`
- `apps/client/src/fixtures/availability-heatmap.ts`
- `apps/client/src/client.test.ts`

## Learning

Una matriz semantica con estados textuales, filtros locales y fixtures alineadas al catalogo permite validar la experiencia de disponibilidad antes de integrar autenticacion o datos live de AWS Events.
