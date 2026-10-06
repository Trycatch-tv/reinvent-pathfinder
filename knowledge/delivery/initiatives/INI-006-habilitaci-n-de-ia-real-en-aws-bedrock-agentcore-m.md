---
type: initiative
id: INI-006
title: Habilitación de IA real en AWS (Bedrock + AgentCore + Managed KB)
status: planned
knowledge_level: K2
domains:
  - ai
  - tech
related_capabilities: []
created_at: '2026-10-06'
external_links: []
candidates:
  - id: WI-CANDIDATE-001
    title: Integración del SDK de Bedrock y activación de analyzer/reranker reales
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Sustituye el modo heurístico por inferencia real de Bedrock (Converse) en
      BedrockContextAnalyzer/BedrockSessionReranker, con fallback heurístico ya
      existente.
    notes: >-
      Open question (decide el responsable de IA): qué modelo Bedrock inicial
      (calidad/latencia/costo), y cómo se inyectan credenciales/region. Hoy no
      hay @aws-sdk en el repo; el código Bedrock* hace fallback a heurístico.
  - id: WI-CANDIDATE-002
    title: >-
      Ingesta real a Amazon Bedrock Managed Knowledge Bases (embeddings +
      Retrieve)
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Ingesta real del catálogo a Amazon Bedrock Managed Knowledge Bases con
      recuperación semántica (Retrieve API), sustituyendo el retriever en
      memoria.
    notes: >-
      Open question (responsable de IA): formato de documentos, metadata,
      embeddings y frecuencia de sincronización desde AWS Events API. Hoy existe
      InMemoryKnowledgeBaseRetriever (offline) y SessionDocumentTransformer;
      falta la KB real + Retrieve API.
  - id: WI-CANDIDATE-003
    title: Despliegue del runtime agentic en Amazon Bedrock AgentCore
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Despliega los 2 agentes (knowledge-agent, journey-recommendation-agent) en
      Amazon Bedrock AgentCore Runtime, con invocación real de tools.
    notes: >-
      Open question (responsable de IA): IaC del bloque agentic (agentcore
      deploy vs CDK/SAM) y límite Lambda/AgentCore. Hoy los agentes reportan
      modelId 'agentcore-runtime-offline-v1' (sin runtime real).
  - id: WI-CANDIDATE-004
    title: Control de costos/seguridad y observabilidad de IA
    type: chore
    suggested_knowledge_level: K3
    expected_value: >-
      Límites de consumo, alertas de costo y observabilidad
      (latencia/costo/calidad) de las llamadas a Bedrock, desde las primeras
      versiones desplegadas.
    notes: >-
      Open question (responsable de IA): cómo proteger endpoints con costo de
      Bedrock sin reutilizar el access token de AWS Events; umbrales de alerta
      de costo. Se solapa con INI-005 (observabilidad); coordinar alcance.
horizon: next
priority: high
---

# Habilitación de IA real en AWS (Bedrock + AgentCore + Managed KB)

## Goal

_What outcome does this Initiative pursue?_

## Expected Value

_Why it matters._

## Scope

_What this Initiative covers._

## Out of Scope

_What it explicitly does not cover._

## Success Criteria

_Observable outcomes that define completion (not just "all Work Items done")._

## Dependencies

_Other Initiatives, modules, or external work this depends on._

## Work Item Candidates

_Candidates live in frontmatter `candidates`; summarize them here as they evolve._

## Open Questions

_Unresolved questions for this Initiative._

## Learning

_Captured on completion: what was delivered, what stayed out of scope, outcome reached._
