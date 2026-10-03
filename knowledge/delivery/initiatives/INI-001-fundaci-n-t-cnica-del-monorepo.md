---
type: initiative
id: INI-001
title: Fundación técnica del monorepo
status: planned
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
  - id: WI-CANDIDATE-003
    title: Modelo de dominio base en packages/domain
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Define AttendeeJourney, ProjectContext, KnowledgeProfile, KnowledgeGap,
      etc. independiente de AWS.
horizon: now
priority: high
---

# Fundación técnica del monorepo

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
