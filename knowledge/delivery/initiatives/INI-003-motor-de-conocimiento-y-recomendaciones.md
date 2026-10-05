---
type: initiative
id: INI-003
title: Motor de conocimiento y recomendaciones
status: completed
knowledge_level: K2
domains:
  - ai
  - knowledge
  - recommendations
related_capabilities: []
created_at: '2026-10-03'
completed_at: '2026-10-05'
external_links: []
candidates:
  - id: WI-CANDIDATE-001
    title: Análisis de contexto → Knowledge Profile + Knowledge Gaps
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Primera rebanada de valor de producto (Journey 1): del contexto al perfil
      con gaps revisables.
    materialized_as: WI-007
  - id: WI-CANDIDATE-002
    title: Ingesta semántica del catálogo a Amazon Bedrock Managed Knowledge Bases
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Ingesta del catálogo a Managed KB para recuperación semántica; AWS Events
      sigue siendo fuente de verdad.
    materialized_as: WI-008
  - id: WI-CANDIDATE-003
    title: >-
      Recomendaciones explicables: candidate filtering + ranking contextual con
      Bedrock
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Filtros determinísticos + ranking Bedrock con explicación de por qué cada
      sesión es relevante y qué gap cubre.
    materialized_as: WI-009
  - id: WI-CANDIDATE-004
    title: 'Runtime agentic (Strands + AgentCore): topología reducida y tools'
    type: spike
    suggested_knowledge_level: K3
    expected_value: >-
      Topología agentic reducida (1-3 agentes) con tools; depende de resolver la
      open question de topología.
    materialized_as: WI-010
horizon: next
priority: high
---

# Motor de conocimiento y recomendaciones

## Goal

Construir el núcleo cognitivo y de recomendaciones de Pathfinder: transformar el contexto técnico del participante en perfiles y brechas de conocimiento (`KnowledgeProfile`, `KnowledgeGaps`), indexar semánticamente el catálogo en Amazon Bedrock Managed Knowledge Bases, generar recomendaciones explicables multivariable y establecer la topología de agentes para Amazon Bedrock AgentCore Runtime.

## Expected Value

Permite a los asistentes a AWS re:Invent ir más allá de búsquedas por palabras clave, recibiendo un itinerario priorizado que atiende específicamente sus desafíos arquitectónicos con explicaciones fundamentadas de por qué cada sesión aporta a su proyecto.

## Scope

- Análisis de contexto de proyecto a perfil de conocimiento y brechas (`WI-007`).
- Ingesta semántica y recuperación de sesiones en Bedrock Knowledge Bases (`WI-008`).
- Pipeline híbrido de recomendación: prefiltrado determinístico (`CandidateFilter`), scoring multifactorial y reranking explicable (`WI-009`).
- Runtime agentic dual con topología reducida de 2 agentes (`KnowledgeAgent` y `JourneyRecommendationAgent`) y tools interoperables (`WI-010`).

## Out of Scope

- Persistencia en DynamoDB de agendas y journeys (`INI-004`).
- Interfaz web interactiva en React (`INI-004`).
- Despliegue de producción con credenciales permanentes de AWS (`INI-005`).

## Success Criteria

- 100% de los 4 Work Items materializados y completados con pruebas unitarias (`WI-007`, `WI-008`, `WI-009`, `WI-010`).
- Capacidad de operar en modo dual: completamente funcional local-first y determinístico para desarrollo rápido/CI, con adaptadores para Amazon Bedrock en producción.
- 100% de tests unitarios aprobados y 0 errores de compilación TypeScript y ESLint.

## Dependencies

- Requiere `INI-001` (Fundación técnica del monorepo) e `INI-002` (Integración con AWS Events).

## Learning

- La arquitectura en dos fases (filtro determinístico y luego recuperación/reranking semántico) resuelve el dilema entre latencia, costo de tokens de LLM y precisión en catálogos de miles de sesiones.
- La consolidación de 2 agentes especializados con tools reutilizables (`@pathfinder/ai-tools`) desacopla limpiamente las capacidades de la plataforma del runtime de ejecución en la nube.
