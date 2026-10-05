---
type: initiative
id: INI-001
title: Fundación técnica del monorepo
status: completed
knowledge_level: K2
domains:
  - platform
  - tech
related_capabilities: []
created_at: '2026-10-03'
external_links: []
candidates:
  - id: WI-CANDIDATE-001
    title: >-
      Scaffolding del monorepo (pnpm workspace, estructura
      apps/services/ai/packages)
    type: chore
    suggested_knowledge_level: K1
    expected_value: Base estructural para todo el desarrollo; permite pnpm install + pnpm dev.
    materialized_as: WI-001
  - id: WI-CANDIDATE-002
    title: 'Tooling de calidad y CI (lint, typecheck, Vitest, pipeline de PR)'
    type: chore
    suggested_knowledge_level: K2
    expected_value: Garantiza trazabilidad y calidad desde el primer PR.
    materialized_as: WI-002
  - id: WI-CANDIDATE-003
    title: Modelo de dominio base en packages/domain
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Define AttendeeJourney, ProjectContext, KnowledgeProfile, KnowledgeGap,
      etc. independiente de AWS.
    materialized_as: WI-003
horizon: now
priority: high
completed_at: '2026-10-05'
---

# Fundación técnica del monorepo

## Goal

Establecer las bases estructurales, de calidad, tooling de CI y el modelo conceptual de dominio puro que sustentan el desarrollo ágil de Pathfinder para el hackathon.

## Expected Value

Garantiza un entorno de desarrollo estructurado y predecible, con verificación automática de calidad desde el primer commit y un modelo de dominio fuertemente tipado e independiente de los servicios de AWS.

## Scope

- Scaffolding de monorepo con `pnpm workspace` (`apps/*`, `services/*`, `ai/*`, `packages/*`).
- Configuración de TypeScript (`tsconfig.base.json` y project references).
- Tooling de calidad unificado: ESLint 9 (flat config), Vitest 5 y scripts en `package.json`.
- Pipeline de integración continua (CI) en GitHub Actions (`.github/workflows/ci.yml`).
- Modelo de dominio agnóstico de AWS en `packages/domain`: entidades (`ProjectContext`, `KnowledgeProfile`, `KnowledgeGap`, `SessionCandidate`, `SessionRecommendation`, `LearningPath`, `Reflection`, `ScheduleConflict`, `AttendeeJourney`), lógica de transiciones puras y pruebas unitarias.

## Out of Scope

- Implementación del adapter de AWS Events REST API (alcance de **INI-002**).
- Infraestructura de backend en AWS Lambda / DynamoDB (alcance de **INI-002/003**).
- Runtime de agentes en Amazon Bedrock AgentCore (alcance de **INI-003**).
- Interfaces de usuario en React/Vite (alcance de **INI-004**).

## Success Criteria

- [x] El monorepo contiene los paquetes workspace estructurados y reconocidos por pnpm.
- [x] `pnpm lint`, `pnpm typecheck` y `pnpm test` se ejecutan localmente con código de salida 0.
- [x] El pipeline `.github/workflows/ci.yml` ejecuta las validaciones en pull requests y pushes a `main`.
- [x] `packages/domain` expone todas las entidades y funciones de dominio sin dependencias externas de AWS y con pruebas unitarias pasando al 100%.

## Dependencies

- Ninguna dependencia técnica previa; es la iniciativa fundacional.

## Work Item Candidates

- `WI-CANDIDATE-001` → **WI-001**: Scaffolding del monorepo (completado).
- `WI-CANDIDATE-002` → **WI-002**: Tooling de calidad y CI (completado).
- `WI-CANDIDATE-003` → **WI-003**: Modelo de dominio base en packages/domain (completado).

## Open Questions

- Las preguntas abiertas de arquitectura e infraestructura relacionadas con el MVP fueron formalizadas como `[resolved]` o `[assumed]` en `knowledge/tech/codebase.md`.

## Learning

Se completó la fundación técnica con éxito, logrando un monorepo ESM puro con TypeScript strict, project references, suite de tests en Vitest, pipeline de CI en GitHub Actions y un modelo de dominio conceptual robusto y desacoplado, listo para ser consumido por el cliente de eventos y el runtime de agentes.
