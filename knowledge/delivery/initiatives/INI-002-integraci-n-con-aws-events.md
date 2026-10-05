---
type: initiative
id: INI-002
title: Integración con AWS Events
status: in-progress
knowledge_level: K2
domains:
  - aws-events
  - integration
related_capabilities: []
created_at: '2026-10-03'
external_links: []
candidates:
  - id: WI-CANDIDATE-001
    title: >-
      events-client: adapter base de AWS Events REST API (catálogo + paginación
      + normalización)
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Adapter TypeScript que encapsula catalog, paginación, normalización,
      errores y retry/throttling. Fuente de verdad del catálogo.
    materialized_as: WI-004
  - id: WI-CANDIDATE-002
    title: Autenticación OAuth 2.0 + PKCE con AWS Builder ID (callback local)
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Habilita la experiencia autenticada con AWS Builder ID; tokens solo en
      memoria, nunca enviados al backend.
    materialized_as: WI-005
  - id: WI-CANDIDATE-003
    title: 'Agenda personal: GetSchedule, favoritos y detección de conflictos'
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Lee agenda personal (GetSchedule), favoritos y detecta conflictos con el
      Learning Path.
horizon: now
priority: high
---

# Integración con AWS Events

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
