---
type: feature
id: WI-016
title: Motor de proyección y filtrado para Availability Heatmap
knowledge_level: K2
status: completed
phase: now
initiative: INI-007
domains:
  - aws-events
  - experience
related_domain: AWS Events
related_capabilities:
  - Ingesta y normalización del catálogo
  - Integración con la agenda de AWS Events
code:
  - packages/domain/src/types/**
  - packages/domain/src/logic/**
  - packages/domain/src/index.ts
  - packages/domain/src/domain.test.ts
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-002
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
        - packages/domain/src/types/availability-projection.ts
        - packages/domain/src/logic/availability-projection.ts
        - packages/domain/src/index.ts
        - packages/domain/src/domain.test.ts
      validations:
        - command: corepack pnpm --filter @pathfinder/domain test
          status: passed
          reason: 24 pruebas del paquete domain en verde.
        - command: corepack pnpm lint
          status: passed
          reason: ESLint finalizó sin errores.
        - command: corepack pnpm typecheck
          status: passed
          reason: Project references de TypeScript completaron sin errores.
        - command: corepack pnpm test
          status: passed
          reason: 107 pruebas del workspace en verde.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-06'
completed_at: '2026-10-06'
---

# Motor de proyección y filtrado para Availability Heatmap

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-002.

## Problem

El catálogo de sesiones y la disponibilidad normalizada son fuentes separadas. Sin una proyección de dominio común, cada interfaz tendría que unirlas, aplicar filtros y resolver datos incompletos por su cuenta, con resultados potencialmente distintos.

_Expected value:_ una proyección reutilizable por cualquier UI, agrupada por día, horario y venue, con filtros deterministas y una representación segura de disponibilidad desconocida.

## Actor and Outcome

Como consumidor de dominio de la experiencia de eventos, una UI puede solicitar sesiones proyectadas y filtradas para renderizar un heatmap o una agenda sin conocer la procedencia de los datos.

## Current and Target State

Actualmente `SessionCandidate` modela catálogo, horario y ubicación opcionales, mientras `SessionAvailability` expresa la disponibilidad por `sessionId`. El objetivo es ofrecer una función pura que una ambas fuentes, use `unknown` cuando no exista disponibilidad y agrupe únicamente sesiones con horario y venue utilizables.

## End-to-End Flow

`SessionCandidate[]` + `SessionAvailability[]` + filtros opcionales → asociación por `sessionId` → disponibilidad `unknown` ante ausencia de señal → exclusión explícita de sesiones sin horario o venue → agrupación por día, hora de inicio y venue → proyección ordenada para la UI.

## Scope

- Definir tipos de dominio exportados para filtros, sesiones proyectadas, grupos por día/hora/venue y resultado de proyección.
- Implementar una función pura de proyección sin llamadas de red ni dependencias de AWS.
- Soportar filtros opcionales por día, hora de inicio, venue, disponibilidad, formato, nivel y temas; cuando se combinen, todos deben cumplirse.
- Mantener un orden estable: día ascendente, hora de inicio ascendente, venue ascendente y, dentro de cada grupo, título de sesión ascendente.
- Excluir del heatmap las sesiones sin `schedule` o `location.venue`, informando sus identificadores en el resultado sin inventar datos.
- Añadir fixtures y pruebas de dominio que cubran agrupación, filtros, fallback `unknown`, orden y exclusiones.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| Domain package | Affected: contratos, lógica pura, fixtures, exportaciones y pruebas. |
| Frontend | Reviewed, not changed: consumirá el resultado en un Work Item posterior. |
| AWS Events adapter | Reviewed, not changed: conserva la responsabilidad de ingesta. |
| Backend, auth, database, AI | Not applicable. |
| Delivery knowledge | Affected: este Work Item y evidencia de validación al completarlo. |

## Scope Unknowns

- La zona horaria y el tratamiento visual de franjas pertenecen al Work Item de interfaz; este trabajo conserva `startTime` tal como llega en el catálogo.
- Las sesiones sin horario o venue no pueden proyectarse con seguridad: se excluyen y se reportan, sin inferir ubicación ni momento.

## Acceptance Criteria

- [x] Los tipos y la función de proyección se exportan desde `@pathfinder/domain`.
- [x] Una sesión sin registro de `SessionAvailability` se proyecta con estado `unknown`.
- [x] Los filtros por día, hora, venue, disponibilidad, formato, nivel y temas se aplican de forma conjuntiva cuando están presentes.
- [x] El resultado se agrupa por día, hora de inicio y venue, con el orden estable definido en el alcance.
- [x] Las sesiones sin horario o venue se excluyen de los grupos y aparecen en `excludedSessionIds`.
- [x] La implementación no realiza llamadas de red, no importa SDKs de AWS y no modifica las fuentes de entrada.
- [x] Las pruebas de dominio cubren una proyección end-to-end que incluya al menos un fallback `unknown`, filtros y agrupación.

## Out of Scope

- Componentes React, rutas, estados de carga o representación visual del heatmap.
- OAuth, reservas, señales en vivo de AWS Events o cambios a adaptadores de ingesta.
- Conversión de zona horaria, geolocalización, recomendaciones por IA o mutación del catálogo.

## Validation

```bash
corepack pnpm --filter @pathfinder/domain test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
kaddo guard
```

## Definition of Done

- Contrato y lógica de proyección implementados solamente en el paquete de dominio.
- Criterios de aceptación cubiertos por pruebas reproducibles.
- Evidencia de validación registrada y `kaddo verify WI-016 --yes` ejecutado antes de solicitar el cierre.
- Las advertencias de `kaddo guard`, si existen, se revisan con el usuario antes de actualizar conocimiento relacionado.

## Readiness

No hay preguntas abiertas bloqueantes. La decisión de zona horaria queda diferida explícitamente al Work Item de interfaz para no extender el alcance de esta lógica pura.

## Suggested Ownership

- `packages/domain/src/types/**`
- `packages/domain/src/logic/**`
- `packages/domain/src/index.ts`
- `packages/domain/src/domain.test.ts`

## Learning

Una proyeccion pura que conserva unknown, excluye metadata incompleta y ordena deterministicamente permite reutilizar la disponibilidad sin acoplarla a UI ni a AWS Events.
