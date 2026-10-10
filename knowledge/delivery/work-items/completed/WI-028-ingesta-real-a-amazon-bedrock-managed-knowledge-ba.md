---
type: feature
id: WI-028
title: Ingesta real a Amazon Bedrock Managed Knowledge Bases (embeddings + Retrieve)
knowledge_level: K3
status: completed
phase: now
completed_at: '2026-10-10'
initiative: INI-006
domains:
  - ai
  - tech
related_domain: Tech
related_capabilities:
  - session-search
  - session-recommendations
code:
  - ai/knowledge/package.json
  - ai/knowledge/src/kb/knowledge-base-client.ts
  - ai/knowledge/src/kb/session-document-transformer.ts
  - ai/knowledge/src/kb/types.ts
  - ai/knowledge/src/kb/knowledge-base.test.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
created_at: '2026-10-10'
source: initiative
source_id: WI-CANDIDATE-002
source_initiative: INI-006
generated_by: kaddo-create
template_version: 1
ready_at: '2026-10-10'
---

# Ingesta real a Amazon Bedrock Managed Knowledge Bases (embeddings + Retrieve)

> Materialized from Initiative INI-006, candidate WI-CANDIDATE-002.

## Problem

Actualmente `BedrockAgentRuntimeKnowledgeBaseClient` en `ai/knowledge/src/kb/knowledge-base-client.ts` es un esqueleto que únicamente delega en `InMemoryKnowledgeBaseRetriever`. No invoca el SDK `@aws-sdk/client-bedrock-agent-runtime` ni su API `RetrieveCommand`, impidiendo la búsqueda semántica vectorial real sobre la base de conocimiento administrada en AWS Bedrock cuando `KNOWLEDGE_BASE_ID` está configurado.

## Actor and Outcome

Como servicio de recomendaciones o agente conversacional, puedo ejecutar búsquedas semánticas vectoriales reales sobre el catálogo de conferencias indexado en Amazon Bedrock Managed Knowledge Bases mediante la API `Retrieve`, obteniendo fragmentos relevantes con scores de similitud calculados por el motor de embeddings de Bedrock, con fallback automático al retriever en memoria ante ausencia de credenciales o fallos temporales.

## Current and Target State

- **Current behavior**:
  - `BedrockAgentRuntimeKnowledgeBaseClient` siempre retorna `this.fallbackRetriever.retrieve(query)`.
  - `@aws-sdk/client-bedrock-agent-runtime` no está instalado en `ai/knowledge`.
- **Target behavior**:
  - `ai/knowledge` incluye `@aws-sdk/client-bedrock-agent-runtime`.
  - `BedrockAgentRuntimeKnowledgeBaseClient` permite inyectar un cliente `BedrockAgentRuntimeClient` o instanciarlo a partir de `region` / variables de entorno de AWS.
  - Cuando `knowledgeBaseId` está presente, ejecuta `RetrieveCommand` con la consulta semántica, número máximo de resultados y filtros de metadata.
  - Mapea los resultados devueltos por Bedrock (`retrievalResults`) a `KnowledgeRetrievalResult` asociando los candidatos y scores vectoriales.
  - Se garantiza degradación defensiva y silenciosa hacia `InMemoryKnowledgeBaseRetriever` ante cualquier error (falta de credenciales, timeout, cuotas, errores de red).
  - La suite de pruebas unitarias verifica la invocación con cliente simulado (`mockBedrockAgentRuntimeClient`), el mapeo de respuestas vectoriales y la degradación automática.

## Entry Points and Journey

- **Entry points**:
  - `BedrockAgentRuntimeKnowledgeBaseClient.retrieve(query)`
  - `BedrockAgentRuntimeKnowledgeBaseClient.retrieveForGap(gap, maxResults)`
  - `SessionDocumentTransformer.transform(sessions)` para preparación del dataset de ingesta.
- **End-to-end flow**:
  1. El recomendador o agente invoca `retrieve()` o `retrieveForGap()`.
  2. Si `knowledgeBaseId` está configurado, formula el `RetrieveCommandInput`.
  3. Ejecuta la llamada a Bedrock Knowledge Bases vía `BedrockAgentRuntimeClient.send(RetrieveCommand)`.
  4. Transforma los fragmentos recuperados en `KnowledgeRetrievalResult`.
  5. Si ocurre cualquier excepción o no hay `knowledgeBaseId`, delega inmediatamente en `InMemoryKnowledgeBaseRetriever`.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| AI / Knowledge (`ai/knowledge`) | Affected: integración de `@aws-sdk/client-bedrock-agent-runtime`, implementación real de `RetrieveCommand` en `BedrockAgentRuntimeKnowledgeBaseClient` y tests unitarios. |
| Services / API (`services/api`) | Reviewed, not changed: interactúa mediante las interfaces existentes de `KnowledgeBaseRetriever`. |
| Domain & Contracts | Reviewed, not changed: las entidades de dominio `SessionCandidate` y `KnowledgeGap` se mantienen. |

## Acceptance Criteria

- [x] `ai/knowledge` declara y utiliza `@aws-sdk/client-bedrock-agent-runtime` en sus dependencias.
- [x] `BedrockAgentRuntimeKnowledgeBaseClient` acepta `BedrockAgentRuntimeClient`, `knowledgeBaseId` y `region` en sus opciones.
- [x] Cuando `knowledgeBaseId` está configurado y el cliente está disponible, `retrieve()` invoca `RetrieveCommand` de Amazon Bedrock Agent Runtime.
- [x] La respuesta de `RetrieveCommand` se procesa y mapea correctamente a `KnowledgeRetrievalResult`, incluyendo scores normalizados y fragmentos recuperados.
- [x] Ante cualquier excepción durante la llamada a Bedrock (o si `knowledgeBaseId` no está definido), el cliente degrada automáticamente a `InMemoryKnowledgeBaseRetriever` sin arrojar errores no controlados.
- [x] La suite de pruebas unitarias (`ai/knowledge/src/kb/knowledge-base.test.ts`) verifica tanto la recuperación vectorial simulada con mock como la degradación transparente ante fallos de AWS, ejecutándose 100% offline.
- [x] `pnpm test`, `pnpm typecheck` y `pnpm lint` pasan con 0 errores.

## Out of Scope

- Despliegue de infraestructura IaC (OpenSearch Serverless / S3 data source) para la creación de la KB (cubierto en despliegue de infraestructura).
- Despliegue del runtime agentic en AgentCore (cubierto en WI-CANDIDATE-003).

## Validation

```bash
pnpm --filter @pathfinder/ai-knowledge test
pnpm test
pnpm typecheck
pnpm lint
```

## Definition of Done

- SDK instalado y configurado en `ai/knowledge`.
- `BedrockAgentRuntimeKnowledgeBaseClient` ejecutando `RetrieveCommand` con fallback.
- Tests unitarios con mocks para casos exitosos y casos de degradación.
- 100% de tests en verde en CI offline.

## Learning

1. **Interoperabilidad con Bedrock Agent Runtime**: El SDK `@aws-sdk/client-bedrock-agent-runtime` mediante `RetrieveCommand` permite separar limpiamente la capa de recuperación semántica (RAG) de la orquestación conversacional, devolviendo fragmentos con métricas de similitud vectorial nativas de AWS Bedrock.
2. **Reconciliación de Metadatos y Fallback Híbrido**: `SessionDocumentTransformer` produce chunks enriquecidos que preservan las claves esenciales (`code`, `level`, `format`, `topics`, etc.). El cliente híbrido permite correlacionar el resultado de la base de conocimiento vectorial con los candidatos cargados en memoria o reconstruirlos al vuelo garantizando tipado estricto.
3. **Resiliencia Total sin Dependencia Externa en CI**: Al abstraer el cliente inyectable, la suite unitaria emula los comportamientos reales de Bedrock Knowledge Bases (incluyendo casos de denegación de permisos o cuotas) sin incurrir en costos ni requerir credenciales en pipelines de integración continua.

