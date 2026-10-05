---
type: initiative
id: INI-003
title: Motor de conocimiento y recomendaciones
status: in-progress
knowledge_level: K2
domains:
  - ai
  - knowledge
  - recommendations
related_capabilities: []
created_at: '2026-10-03'
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
  - id: WI-CANDIDATE-003
    title: >-
      Recomendaciones explicables: candidate filtering + ranking contextual con
      Bedrock
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Filtros determinísticos + ranking Bedrock con explicación de por qué cada
      sesión es relevante y qué gap cubre.
  - id: WI-CANDIDATE-004
    title: 'Runtime agentic (Strands + AgentCore): topología reducida y tools'
    type: spike
    suggested_knowledge_level: K3
    expected_value: >-
      Topología agentic reducida (1-3 agentes) con tools; depende de resolver la
      open question de topología.
horizon: next
priority: high
---

# Motor de conocimiento y recomendaciones

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
