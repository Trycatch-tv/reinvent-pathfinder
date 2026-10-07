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
    materialized_as: WI-025
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

> **Handoff — BORRADOR.** Esta iniciativa la diseña e implementa un responsable de IA
> dedicado. Las secciones de abajo son una propuesta basada en el estado actual del
> repositorio (hoy todo el bloque de IA corre en modo heurístico/offline). El responsable
> de IA debe confirmar o ajustar Goal, Scope y Success Criteria, y resolver las Open
> Questions antes de materializar los Work Items. No están fijadas por el equipo actual.

## Goal

Reemplazar el modo heurístico/offline del bloque de IA por capacidades reales sobre AWS:
inferencia con Amazon Bedrock, recuperación semántica con Managed Knowledge Bases y
ejecución de los agentes en Amazon Bedrock AgentCore — preservando el fallback local-first
existente para desarrollo y pruebas sin costo.

## Expected Value

Convierte las recomendaciones y el análisis de contexto de deterministas/heurísticos a
inferencia real, elevando la calidad y explicabilidad, y habilitando el valor diferencial
del producto (contexto → conocimiento semántico → recomendaciones adaptativas) sobre datos
reales de AWS Events.

## Scope

- Integrar el SDK de AWS (`@aws-sdk/client-bedrock-runtime` y afines) y activar los wrappers
  ya existentes `BedrockContextAnalyzer` y `BedrockSessionReranker` para que invoquen Bedrock
  de verdad (Converse API), manteniendo el fallback heurístico cuando no haya AWS.
- Ingesta real del catálogo a Amazon Bedrock Managed Knowledge Bases (embeddings + Retrieve
  API), reemplazando `InMemoryKnowledgeBaseRetriever`. Reutilizar `SessionDocumentTransformer`.
- Desplegar los 2 agentes (`knowledge-agent`, `journey-recommendation-agent`) en Amazon
  Bedrock AgentCore Runtime, con invocación real de las tools de `ai/tools`.
- Controles de costo/seguridad y observabilidad de las llamadas a IA (límites, alertas,
  latencia/costo/calidad).

## Out of Scope

- La experiencia local-first ya entregada (INI-001 a INI-004): no se reescribe; el fallback
  heurístico se conserva como camino sin AWS.
- Observabilidad general de la plataforma no-IA → coordinar con INI-005 (hay solapamiento en
  el candidato de costos/observabilidad; definir el límite entre INI-005 e INI-006).
- Persistencia operacional en DynamoDB (pendiente técnico transversal, no exclusivo de IA).

## Success Criteria

_Propuesta — a confirmar por el responsable de IA:_

- El análisis de contexto y el ranking producen resultados vía Bedrock real cuando hay AWS
  configurado, y caen al heurístico sin AWS (ambos caminos verificables).
- La recuperación semántica consulta una Managed KB real (Retrieve) con el catálogo ingerido.
- Los 2 agentes se ejecutan en AgentCore (ya no reportan `agentcore-runtime-offline-v1`).
- Existen límites de consumo y observabilidad de costo/latencia desde el primer despliegue.
- `pnpm -r test` y `tsc -b` siguen en verde (los tests offline deben seguir pasando).

## Dependencies

- Reutiliza el bloque de IA ya implementado (INI-003) en modo offline: `ContextAnalyzer`,
  `SessionReranker`, `SessionDocumentTransformer`, agentes y tools.
- Requiere cuenta/credenciales AWS y acceso a Amazon Bedrock + AgentCore + Managed KB.
- Solapamiento con INI-005 (observabilidad/costos): coordinar alcance.
- Pendiente técnico relacionado: entorno Node 24 / pnpm 12 reales.

## Work Item Candidates

1. **WI-CANDIDATE-001** — Integración del SDK de Bedrock y activación de analyzer/reranker reales.
2. **WI-CANDIDATE-002** — Ingesta real a Amazon Bedrock Managed Knowledge Bases (embeddings + Retrieve).
3. **WI-CANDIDATE-003** — Despliegue del runtime agentic en Amazon Bedrock AgentCore.
4. **WI-CANDIDATE-004** — Control de costos/seguridad y observabilidad de IA.

(Detalle y `notes` por candidato en el frontmatter `candidates`.)

## Open Questions

_A resolver por el responsable de IA antes de materializar los Work Items:_

- [open] **Modelo Bedrock inicial** (calidad/latencia/costo) e inyección de credenciales/region.
- [open] **IaC del bloque agentic**: `agentcore deploy` vs. CDK/SAM; y límite entre `services/api` (Lambda) y el runtime de AgentCore.
- [open] **Ingesta de Managed KB**: formato de documentos, metadata, embeddings y frecuencia de sincronización desde AWS Events API.
- [open] **Autenticación del backend con costo de Bedrock**: cómo proteger endpoints sin reutilizar el access token de AWS Events.
- [open] **Límite con INI-005** en el candidato de costos/observabilidad.

## Learning

_Captured on completion: what was delivered, what stayed out of scope, outcome reached._
