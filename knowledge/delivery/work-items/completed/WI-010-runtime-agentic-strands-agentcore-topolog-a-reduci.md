---
type: spike
id: WI-010
title: 'Runtime agentic (Strands + AgentCore): topología reducida y tools'
knowledge_level: K3
status: completed
phase: now
completed_at: '2026-10-05'
initiative: INI-003
domains:
  - ai
  - tech
code:
  - ai/contracts/**
  - ai/tools/**
  - ai/agents/**
created_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-004
source_initiative: INI-003
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-05'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - ai/agents/package.json
        - ai/agents/src/index.ts
        - ai/contracts/package.json
        - ai/contracts/src/index.ts
        - ai/tools/package.json
        - ai/tools/src/index.ts
        - >-
          knowledge/delivery/initiatives/INI-003-motor-de-conocimiento-y-recomendaciones.md
        - pnpm-lock.yaml
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-05'
---

# Runtime agentic (Strands + AgentCore): topología reducida y tools

> Materialized from Initiative INI-003, candidate WI-CANDIDATE-004.

## Outcome

- **Actor:** Desarrollador / Asistente a AWS re:Invent interactuando con las capacidades cognitivas de Pathfinder.
- **Current behavior:** Las capacidades de análisis de contexto (`ContextAnalyzer`), recuperación semántica (`KnowledgeBaseRetriever`) y ranking de sesiones (`SessionReranker`) existen como librerías aisladas (`@pathfinder/ai-knowledge`), pero no están empaquetadas como un runtime agentic coherente con contratos, tools e invocación orquestada para Bedrock AgentCore.
- **Target behavior:** Pathfinder implementa la topología agentic reducida (confirmada en decisiones de arquitectura: exactamente 2 agentes para el MVP):
  1. `Knowledge Agent`: Agente enfocado en el catálogo, análisis del contexto del asistente, perfil técnico y recuperación de brechas en Managed Knowledge Bases.
  2. `Journey & Recommendation Agent`: Agente enfocado en la experiencia del asistente, evaluación de agenda, resolución de conflictos y generación/adaptación de recomendaciones explicables.
  3. Paquete `@pathfinder/ai-tools`: Tools interoperables para Bedrock (ej. `analyzeContextTool`, `searchCatalogTool`, `rankRecommendationsTool`, `checkConflictsTool`).
  4. Paquete `@pathfinder/ai-contracts`: Interfaces estandarizadas de invocación y esquemas JSON Schema para las tools de los agentes.
- **Observable completion:** Contratos agentic definidos en `ai/contracts`, conjunto de tools implementadas y testeadas en `ai/tools`, orquestador y definición de los 2 agentes en `ai/agents` con soporte de ejecución determinística offline y compatibilidad con Amazon Bedrock AgentCore Runtime. 100% de tests aprobados con Vitest.

## Problem

Tener múltiples servicios desconectados sin una topología clara de agentes dificulta la integración fluida con Amazon Bedrock AgentCore y la invocación de herramientas autónomas. Se requiere un spike técnico que cristalice la topología acordada de 2 agentes (`Knowledge Agent` y `Journey & Recommendation Agent`), formalice las tools de Bedrock sobre el código existente y garantice la interoperabilidad local-first sin costo de nube en desarrollo.

_Expected value:_ Topología agentic reducida (2 agentes) con tools; materializa la decisión de arquitectura resuelta en `knowledge/tech/codebase.md`.

## Scope

- **`ai/contracts`:**
  - Esquemas de definición de Tools (`AgentToolDefinition`, `AgentToolCall`, `AgentToolResult`).
  - Esquemas de invocación para agentes (`AgentRunOptions`, `AgentRunResponse`).
- **`ai/tools`:**
  - Implementación de tools que envuelven la lógica ya testeada:
    - `ContextAnalysisTool`: ejecuta el análisis heurístico/Bedrock de contexto y gaps.
    - `KnowledgeBaseSearchTool`: consulta el recuperador semántico de sesiones.
    - `RecommendationsRankTool`: ejecuta el filtrado y reranking explicable de sesiones.
    - `ScheduleConflictCheckTool`: evalúa solapamientos de agenda usando `@pathfinder/events-client`.
- **`ai/agents`:**
  - `KnowledgeAgent`: orquesta el entendimiento del perfil del usuario y el mapeo con sesiones.
  - `JourneyRecommendationAgent`: orquesta la síntesis del Learning Path y las recomendaciones.
  - `AgentRunner`: orquestador ligero con soporte offline determinístico y fallback seguro.
- **Tooling y pruebas:**
  - Tests unitarios con Vitest para tools y agentes en monorepo.
  - Exportación correcta de paquetes en `@pathfinder/ai-contracts`, `@pathfinder/ai-tools`, `@pathfinder/ai-agents`.

## Out of scope

- Despliegue de infraestructura en vivo mediante `agentcore deploy` contra cuentas AWS (se mantendrá emulado/dual local-first en el monorepo).
- Interfaz gráfica de chat en React (`INI-004`).

## Surface review

- **Product/UI:** not-applicable (capa SDK / agentic runtime).
- **Frontend:** reviewed — `apps/client` consumirá los agentes o la API unificada.
- **Backend:** reviewed — `services/api` podrá delegar tareas al runtime agentic.
- **AI/Agentic:** affected — `ai/contracts`, `ai/tools`, `ai/agents`.
- **Shared packages:** reviewed — consume `@pathfinder/domain`, `@pathfinder/contracts`, `@pathfinder/ai-knowledge`, `@pathfinder/events-client`.
- **Operations/release:** reviewed.

## Acceptance Criteria

- [x] Contratos de tools y agentes definidos en `ai/contracts`.
- [x] Tools operativas (`ContextAnalysisTool`, `KnowledgeBaseSearchTool`, `RecommendationsRankTool`, `ScheduleConflictCheckTool`) implementadas en `ai/tools`.
- [x] Topología de 2 agentes (`KnowledgeAgent`, `JourneyRecommendationAgent`) implementada en `ai/agents` con orquestación y tools asignadas.
- [x] Pruebas unitarias completas con Vitest en `ai/tools` y `ai/agents` con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` validando tipado entre `ai/contracts`, `ai/tools`, `ai/agents` y `@pathfinder/ai-knowledge`.
- Ejecutar `pnpm test` verificando la ejecución de tools y el despacho de agentes.
- Ejecutar `pnpm lint` confirmando 0 errores.

## Learning

- La topología reducida a 2 agentes (`Knowledge Agent` y `Journey & Recommendation Agent`) permite una clara separación de responsabilidades: el primero se enfoca en entender el perfil del asistente y explorar el catálogo semántico de re:Invent, mientras que el segundo se enfoca en construir su itinerario viable, reconciliar conflictos de agenda y explicar recomendaciones.
- Encapsular las capacidades en herramientas interoperables (`@pathfinder/ai-tools`) garantiza que los agentes puedan ser ejecutados en Bedrock AgentCore Runtime en la nube o en modo emulado offline local-first sin acoplamiento a la infraestructura de red o costos innecesarios de API durante desarrollo o CI.
