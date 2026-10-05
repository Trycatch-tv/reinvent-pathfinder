---
type: feature
id: WI-003
title: Modelo de dominio base en packages/domain
knowledge_level: K2
status: completed
completed_at: '2026-10-04'
phase: now
initiative: INI-001
domains:
  - platform
  - tech
code:
  - packages/domain/**
created_at: '2026-10-04'
source: initiative
source_id: WI-CANDIDATE-003
source_initiative: INI-001
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-04'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - >-
          knowledge/delivery/initiatives/INI-001-fundaci-n-t-cnica-del-monorepo.md
        - packages/domain/src/index.ts
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-05'
---

# Modelo de dominio base en packages/domain

> Materialized from Initiative INI-001, candidate WI-CANDIDATE-003.

## Outcome

- **Actor:** desarrollador o componente de los servicios y agentes (`services/api`, `ai/agents`, `apps/client`).
- **Current behavior:** `packages/domain` es solo un placeholder vacío sin tipos ni entidades. Cualquier desarrollo en los adapters de AWS o agentes carece de contratos de dominio tipados y desacoplados de APIs externas.
- **Target behavior:** `packages/domain` expone tipos, entidades inmutables y schemas/validadores para los conceptos esenciales de Pathfinder (`ProjectContext`, `KnowledgeProfile`, `KnowledgeGap`, `SessionCandidate`, `SessionRecommendation`, `LearningPath`, `Reflection`, `ScheduleConflict`, `AttendeeJourney`), totalmente independientes de AWS.
- **Observable completion:** `packages/domain` compila con `tsc -b`, exporta los tipos y factories/validadores necesarios, y cuenta con un suite exhaustivo de tests unitarios con Vitest que pasa con 0 errores.

## Journey reconstruction

Flujo de consumo del dominio:

```text
Project Context del usuario (industria, stack, metas)
       ↓
Knowledge Profile & Knowledge Gaps calculados
       ↓
Session Candidates (del catálogo normalizado) + Session Recommendations (explicables)
       ↓
Learning Path (agenda pedagógica sin conflictos)
       ↓
Reflection post-sesión (actualización del estado de los gaps)
       ↓
Attendee Journey (ciclo completo antes, durante y después del evento)
```

## Problem

Toda la lógica de recomendaciones, agentes de IA, persistencia en DynamoDB e interfaces de usuario necesita un vocabulario y modelo conceptual común. Si este modelo no existe o se acopla directamente al payload crudo de AWS Events o al SDK de Bedrock, el sistema se vuelve frágil y difícil de evolucionar. Este Work Item establece el núcleo agnóstico del producto.

_Expected value:_ Define AttendeeJourney, ProjectContext, KnowledgeProfile, KnowledgeGap, etc. independiente de AWS.

## Scope

- Definir las entidades y tipos de TypeScript con interfaces y tipos estrictos en `packages/domain/src/`:
  - `ProjectContext`: Descripción de reto técnico, stack actual, nivel de seniority, objetivos y restricciones.
  - `KnowledgeProfile`: Perfil de habilidades del asistente con niveles declarados por área/tópico.
  - `KnowledgeGap`: Brechas de conocimiento con severidad (`critical`, `important`, `nice-to-have`), estado (`open`, `addressed`, `closed`) y justificación.
  - `SessionCandidate`: Sesión normalizada del catálogo (id, código, título, nivel 100-400, duración, tipo, tópicos, venue, horario).
  - `SessionRecommendation`: Recomendación explicable que vincula una sesión candidata con los gaps que cubre, score de relevancia y justificación textual.
  - `ScheduleConflict`: Conflicto de horario entre sesiones o eventos personales.
  - `LearningPath`: Secuencia de sesiones priorizadas y reconciliadas cronológicamente para el asistente.
  - `Reflection`: Evaluación y feedback post-sesión del usuario con impacto en el estado de los gaps.
  - `AttendeeJourney`: Agregado del estado general del asistente en sus 3 fases: antes, durante y después del evento.
- Implementar funciones puras de utilidad y validación/construcción (factories/helpers) para creación consistente y transiciones de estado de gaps y journeys.
- Exportar todos los tipos y helpers desde `packages/domain/src/index.ts`.
- Crear pruebas unitarias con Vitest (`packages/domain/src/*.test.ts`) que verifiquen instanciación, tipado y reglas de transición de estado.

## Out of scope

- Adapter de AWS Events REST API (`packages/events-client` → **INI-002**).
- Repositorios DynamoDB (`packages/data` → **INI-002/INI-003**).
- Ingesta semántica o llamadas a Bedrock (`ai/*` → **INI-003**).
- Persistencia o endpoints HTTP.

## Surface review

- **Product/UI:** not-applicable (modelo conceptual interno).
- **Frontend:** reviewed — `apps/client` consumirá estos tipos.
- **Backend:** reviewed — `services/api` consumirá estos tipos.
- **AI/Agentic:** reviewed — `ai/agents` y `ai/tools` consumirán estos tipos para razonar y generar recomendaciones.
- **Shared packages:** affected — `packages/domain`.
- **Configuration:** not-applicable.
- **Database / Auth / Analytics:** reviewed-not-affected.
- **Operations/release:** reviewed-not-affected.

## Acceptance Criteria

- [x] `packages/domain/src/` define tipos e interfaces completas para: `ProjectContext`, `KnowledgeProfile`, `KnowledgeGap`, `SessionCandidate`, `SessionRecommendation`, `ScheduleConflict`, `LearningPath`, `Reflection` y `AttendeeJourney`.
- [x] No existen dependencias de AWS SDK ni APIs externas en `packages/domain` (modelo puro y desacoplado).
- [x] Existen funciones helper/factories puras para inicializar entidades y realizar transiciones de estado (ej: transicionar un `KnowledgeGap` a `addressed` tras una `Reflection`).
- [x] `packages/domain` compila limpiamente con `pnpm typecheck` (`tsc -b`).
- [x] Existen pruebas unitarias con Vitest en `packages/domain` que validan la creación, validación y transiciones del modelo con 100% de éxito.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finaliza con código de salida 0 en el monorepo.

## Validation

- Ejecutar `pnpm typecheck` para verificar que los tipos y project references compilan sin errores.
- Ejecutar `pnpm test` para verificar que todas las pruebas unitarias de `packages/domain` pasen en verde.
- Ejecutar `pnpm lint` para verificar cumplimiento de estilo y buenas prácticas.

## Learning

Se implementó el modelo de dominio agnóstico de AWS en `packages/domain`, con tipos e interfaces inmutables para `ProjectContext`, `KnowledgeProfile`, `KnowledgeGap`, `SessionCandidate`, `SessionRecommendation`, `ScheduleConflict`, `LearningPath`, `Reflection` y `AttendeeJourney`. Se desarrollaron funciones puras para transiciones de estado de gaps (`transitionGapStatus`, `applyReflectionToGaps`), detección de solapamiento de horarios (`detectScheduleConflict`) y ciclo de vida del journey (`advanceJourneyPhase`, `recordReflectionOnJourney`), con suite de pruebas unitarias 100% pasando en Vitest.
