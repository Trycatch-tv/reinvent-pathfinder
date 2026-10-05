---
type: feature
id: WI-008
title: Ingesta semántica del catálogo a Amazon Bedrock Managed Knowledge Bases
knowledge_level: K3
status: completed
phase: now
initiative: INI-003
domains:
  - ai
  - knowledge
code:
  - ai/knowledge/**
created_at: '2026-10-05'
completed_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-002
source_initiative: INI-003
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-05'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - ai/knowledge/src/kb/types.ts
        - ai/knowledge/src/kb/session-document-transformer.ts
        - ai/knowledge/src/kb/knowledge-base-client.ts
        - ai/knowledge/src/kb/knowledge-base.test.ts
        - ai/knowledge/src/index.ts
      validations: []
implementation_status: completed
validation_status: completed
verified_at: '2026-10-05'
---

# Ingesta semántica del catálogo a Amazon Bedrock Managed Knowledge Bases

> Materialized from Initiative INI-003, candidate WI-CANDIDATE-002.

## Outcome

- **Actor:** Motor de conocimiento de Pathfinder (`ai/knowledge`) y pipelines de indexación semántica.
- **Current behavior:** Las sesiones de AWS Events se normalizan a `SessionCandidate`, pero no existe un pipeline para transformar estas sesiones en documentos estructurados optimizados para búsqueda vectorial/semántica (embeddings y chunking de Bedrock Knowledge Bases) ni un cliente para realizar consultas semánticas (Retrieve API) frente a brechas de conocimiento.
- **Target behavior:** `ai/knowledge` provee:
  1. Un transformador de documentos semánticos (`SessionDocumentTransformer`) que genera documentos listos para ingesta en Bedrock Managed KB con metadata enriquecida (topics, level, format, track).
  2. Un cliente de recuperación semántica (`BedrockKnowledgeBaseClient`) con soporte para invocar la API `Retrieve` de Bedrock Agent Runtime y un modo offline/local con búsqueda semántica simulada por similitud de cosenos/jaccard (`InMemoryKnowledgeBaseRetriever`).
- **Observable completion:** Documentos de ingesta generados conforme a la especificación de Bedrock KB, interfaz de consulta semántica `retrieveRelevantSessions(gap, candidates)`, pruebas unitarias completas con Vitest al 100%.

## Journey reconstruction

```text
Catálogo de AWS Events (SessionCandidate[])
       ↓
SessionDocumentTransformer.transform(candidates)
       ↓
Documentos enriquecidos con metadata:
  • content: Título, abstract, objetivos, prerrequisitos
  • metadata: { level, format, track, topics, venue }
       ↓
Ingesta a Bedrock Managed Knowledge Base (S3 / OpenSearch Serverless)
       ↓
KnowledgeGap identificado ("Agent Observability")
       ↓
BedrockKnowledgeBaseClient.retrieve(query, options)
       ↓
Retorna sesiones más relevantes con score de confianza para el reranker
```

## Problem

El catálogo de AWS re:Invent cuenta con miles de sesiones. Enviar todo el catálogo crudo a un LLM en cada solicitud genera costos prohibitivos y alta latencia. La arquitectura de Pathfinder ([codebase.md](file:///c:/Users/julia/Documents/repos/pathfinder-ws/reinvent-pathfinder/knowledge/tech/codebase.md#L213) y Brief Técnico Sección 21) exige un flujo desacoplado donde el catálogo se ingesta en una `Managed Knowledge Base` de Amazon Bedrock para realizar recuperación semántica de alta precisión basada en las brechas de conocimiento del usuario, manteniendo a AWS Events API como la única fuente de verdad.

_Expected value:_ Ingesta del catálogo a Managed KB para recuperación semántica; AWS Events sigue siendo fuente de verdad.

## Scope

- Implementar `SessionDocumentTransformer` en `ai/knowledge/src/kb/session-document-transformer.ts`:
  - Transforma `SessionCandidate` en documentos estructurados para Bedrock KB (`BedrockKnowledgeDocument`).
  - Genera texto semántico unificado (título, descripción, track, topics).
  - Estructura atributos de metadata para filtrado vectorial (level, format, topic tags).
- Implementar cliente de recuperación en `ai/knowledge/src/kb/knowledge-base-client.ts`:
  - Interfaz `KnowledgeBaseRetriever`.
  - `BedrockAgentRuntimeKnowledgeBaseClient`: invoca la API `Retrieve` de Bedrock Agent Runtime cuando existen credenciales AWS configuradas (`KNOWLEDGE_BASE_ID`).
  - `InMemoryKnowledgeBaseRetriever`: implementa recuperación semántica en memoria mediante token overlap y scoring de relevancia, ideal para desarrollo offline y pruebas en CI.
- Definir tipos y schemas en `ai/knowledge/src/kb/types.ts`:
  - `BedrockKnowledgeDocument`, `KnowledgeRetrievalQuery`, `KnowledgeRetrievalResult`.
- Exportar los nuevos módulos en `ai/knowledge/src/index.ts`.
- Pruebas unitarias exhaustivas con Vitest en `ai/knowledge/src/kb/*.test.ts`:
  - Transformación precisa de candidatos a documentos de Bedrock.
  - Generación de filtros de metadata compatibles con Bedrock.
  - Recuperación de sesiones relevantes para un `KnowledgeGap`.
  - Ejecución confiable offline sin dependencias externas.

## Out of scope

- Infraestructura CDK de OpenSearch Serverless y S3 bucket (pertenece a `infra/cdk`).
- Reranking final con LLM (`WI-CANDIDATE-003`).

## Surface review

- **Product/UI:** not-applicable (capa de IA/conocimiento).
- **Frontend:** not-applicable.
- **Backend:** affected — handlers consumirán este cliente para recuperar candidatos.
- **AI/Agentic:** affected — `ai/knowledge`.
- **Shared packages:** affected — `packages/domain` y `ai/knowledge`.
- **Operations/release:** reviewed — utiliza variable `KNOWLEDGE_BASE_ID`.

## Acceptance Criteria

- [x] `SessionDocumentTransformer` genera documentos conformes al formato de ingesta de Bedrock con contenido y metadata estructurada.
- [x] `InMemoryKnowledgeBaseRetriever` permite indexar y consultar sesiones en memoria con ranking de similitud sin llamadas a AWS.
- [x] `BedrockAgentRuntimeKnowledgeBaseClient` implementa fallback automático al modo in-memory si `KNOWLEDGE_BASE_ID` o credenciales no están presentes.
- [x] La consulta por `KnowledgeGap` retorna las sesiones más afines ordenadas por score de relevancia.
- [x] Suite de pruebas con Vitest en `ai/knowledge/src/kb/*.test.ts` con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` validando compatibilidad de tipos con `@pathfinder/domain`.
- Ejecutar `pnpm test` verificando transformación de documentos y recuperación semántica.
- Ejecutar `pnpm lint` confirmando 0 advertencias.

## Learning

- Estructurar los documentos de sesión en fragmentos semánticos enriquecidos (`SessionDocumentTransformer`) que concatenan código, título, formato, nivel, tópicos y descripción permite una mayor tasa de acierto y similitud frente a brechas técnicas complejas.
- El recuperador semántico en memoria (`InMemoryKnowledgeBaseRetriever`) basado en overlap ponderado de tokens y boost en títulos permite simular fielmente el comportamiento de Bedrock Knowledge Bases en pruebas locales sin incurrir en costos de indexación ni dependencias de nube.
- La abstracción `KnowledgeBaseRetriever` proporciona la interfaz exacta que consumirá el motor de recomendaciones (`WI-CANDIDATE-003`) para la preselección de candidatos.
