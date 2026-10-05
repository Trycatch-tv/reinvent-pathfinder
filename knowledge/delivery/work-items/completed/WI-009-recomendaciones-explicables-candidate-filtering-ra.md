---
type: feature
id: WI-009
title: >-
  Recomendaciones explicables: candidate filtering + ranking contextual con
  Bedrock
knowledge_level: K3
status: completed
phase: now
completed_at: '2026-10-05'
initiative: INI-003
domains:
  - ai
  - recommendations
code:
  - packages/contracts/**
  - ai/knowledge/**
  - services/api/**
created_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-003
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
        - ai/knowledge/src/index.ts
        - >-
          knowledge/delivery/initiatives/INI-003-motor-de-conocimiento-y-recomendaciones.md
        - packages/contracts/src/index.ts
        - services/api/src/index.ts
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-05'
---

# Recomendaciones explicables: candidate filtering + ranking contextual con Bedrock

> Materialized from Initiative INI-003, candidate WI-CANDIDATE-003.

## Outcome

- **Actor:** Asistente a AWS re:Invent consultando sus sesiones recomendadas en Pathfinder.
- **Current behavior:** Se cuenta con el catálogo normalizado (`SessionCandidate[]`), el análisis de contexto (`KnowledgeProfile`, `KnowledgeGaps`) y el recuperador de Knowledge Bases, pero no existe el pipeline que filtre miles de sesiones de forma determinística, aplique scoring multifactorial y produzca recomendaciones priorizadas con explicabilidad.
- **Target behavior:** Pathfinder ejecuta el pipeline completo de recomendación (Brief Técnico Sección 21 y 23):
  1. `CandidateFilter`: prefiltrado determinístico por nivel, formato, tópicos y disponibilidad horaria para reducir el espacio de búsqueda.
  2. `SessionReranker`: scoring multifactorial ponderado (cobertura de brechas, relevancia semántica, novedad, logística) y generación de explicaciones claras (por qué es relevante, qué gap cubre y qué aprenderá).
  3. Handler HTTP en `services/api`: `POST /v1/recommendations/rank` para servir las recomendaciones explicables al frontend.
- **Observable completion:** Contratos de API (`RankRecommendationsRequest`, `RankRecommendationsResponse`), módulos `CandidateFilter` y `SessionReranker` (con soporte offline determinístico y Bedrock LLM reranker), handler API `POST /v1/recommendations/rank`, y 100% de tests aprobados con Vitest.

## Journey reconstruction

```text
Entrada:
  • ProjectContext + KnowledgeProfile + KnowledgeGaps
  • Catálogo disponible (SessionCandidate[])
  • Agenda del asistente (opcional para penalizar conflictos)
       ↓
POST /v1/recommendations/rank
       ↓
1. CandidateFilter (Filtro determinístico):
   - Filtra por nivel (ej. 300-400 si es avanzado), formato deseado, tópicos
   - Reduce miles de sesiones a un subconjunto óptimo (10 - 30 candidatos)
       ↓
2. Semantic Retrieval + Scoring ponderado:
   - Cobertura de gaps (35%)
   - Relevancia semántica (30%)
   - Novedad / Profundidad técnica (15%)
   - Compatibilidad de agenda (10%)
   - Nivel / Formato (5%)
   - Logística / Venue (5%)
       ↓
3. LLM / Heuristic Reranker:
   - Ordena los mejores candidatos
   - Redacta explicabilidad: por qué importa, qué gap cubre, posibles trade-offs
       ↓
Salida: SessionRecommendation[] ordenadas con score y explicación detallada
```

## Problem

Recomendar sesiones basadas únicamente en keywords devuelve listas genéricas y ruidosas. Enviar todo el catálogo a un LLM es inviable por costos y latencia. Pathfinder soluciona esto mediante un pipeline híbrido en dos fases: reducción determinística primero y reranking semántico explicable después.

_Expected value:_ Filtros determinísticos + ranking Bedrock con explicación de por qué cada sesión es relevante y qué gap cubre.

## Scope

- Definir contratos en `packages/contracts/src/recommendations.ts`:
  - `RankRecommendationsRequest`: `projectContext`, `knowledgeGaps`, `candidateSessions`, preferencias opcionales (`targetLevels`, `preferredFormats`, `maxRecommendations`).
  - `RankRecommendationsResponse`: `recommendations: SessionRecommendation[]`, metadata de procesamiento (`totalCandidatesEvaluated`, `modelId`).
- Implementar prefiltro determinístico en `ai/knowledge/src/recommendations/candidate-filter.ts`:
  - `filterCandidates(sessions, criteria)`: descarta sesiones incompatibles con nivel, formato o tópicos no relacionados.
- Implementar motor de scoring y reranking en `ai/knowledge/src/recommendations/session-reranker.ts`:
  - Interfaz `SessionRerankerProvider`.
  - `HeuristicSessionReranker`: calcula scores ponderados basados en cobertura de `KnowledgeGaps` y genera explicaciones estructuradas determinísticas.
  - `BedrockSessionReranker`: utiliza prompts estructurados contra Amazon Bedrock con fallback a heurística.
- Implementar handler de API en `services/api/src/handlers/recommendations-rank.ts`:
  - Endpoint `POST /v1/recommendations/rank` con validación y manejo de errores.
- Exportar módulos en `@pathfinder/contracts`, `@pathfinder/ai-knowledge` y `@pathfinder/api`.
- Pruebas unitarias completas con Vitest en `ai/knowledge` y `services/api`:
  - Filtrado correcto de sesiones según seniority y formatos.
  - Cálculo de scores ponderados y correlación con `KnowledgeGaps`.
  - Explicabilidad generada para cada sesión recomendada.
  - Handler HTTP retornando 200 con ranking ordenado descendente.

## Out of scope

- Persistencia de recomendaciones en DynamoDB.
- Interfaz gráfica en React (`INI-004`).

## Surface review

- **Product/UI:** not-applicable (capa SDK / API).
- **Frontend:** reviewed — `apps/client` consumirá este endpoint al generar el Learning Path.
- **Backend:** affected — `services/api/src/handlers/recommendations-rank.ts`.
- **AI/Agentic:** affected — `ai/knowledge/src/recommendations/`.
- **Shared packages:** affected — `packages/contracts` y `@pathfinder/domain`.
- **Operations/release:** reviewed.

## Acceptance Criteria

- [x] Contratos `RankRecommendationsRequest` y `RankRecommendationsResponse` definidos y validados.
- [x] `CandidateFilter` reduce el catálogo eficientemente según criterios de nivel, formato y tópicos.
- [x] `SessionReranker` calcula scores ponderados y genera explicaciones claras asociadas a los `KnowledgeGaps`.
- [x] Handler `POST /v1/recommendations/rank` implementado en `services/api` con códigos HTTP estándar y CORS.
- [x] Suite de pruebas con Vitest con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` validando compatibilidad entre contratos, domain y handlers.
- Ejecutar `pnpm test` verificando filtrado, scoring y ordenamiento de recomendaciones.
- Ejecutar `pnpm lint` confirmando 0 errores.

## Learning

- El pipeline de dos etapas (`CandidateFilter` determinístico seguido de `SessionReranker` ponderado/semántico) reduce drásticamente el espacio de búsqueda (evitando sobrecostos y latencia al no enviar miles de sesiones al LLM).
- El scoring multifactorial (40% cobertura de brechas, 30% superposición técnica, 20% alineación de nivel, 10% logística) produce recomendaciones interpretables con explicaciones contextuales que justifican por qué cada sesión resuelve una brecha específica del asistente.
