---
type: roadmap
updated_at: '2026-10-11'
---

# pathfinder — Roadmap

> What we intend to build and why.

El roadmap se organiza en Iniciativas (`knowledge/delivery/initiatives/`). Cada iniciativa agrupa candidatos de Work Item derivados del scope y los journeys de producto. Los candidatos aún no son Work Items: se materializan uno a uno cuando se decide trabajarlos.

## Now

Iniciativas activas prioritarias para consolidación de producto:

- **INI-008 — Experiencia unificada, orquestación de modos y trazabilidad de IA** (priority: high)
  - Orquestación explícita de modos Demo y Live en todo el Journey.
  - Design System, tokens compartidos y Unified App Shell.
  - Providers aislados para ejecución Demo y Live sin sustituciones silenciosas.
  - Carga automática (auto-bootstrap) de disponibilidad, catálogo y agenda.
  - Consistencia del pipeline de IA y trazabilidad transparente de ejecución por etapa.
  - Refinamiento de Learning Path (priorización en tiers) y adaptabilidad coherente.
  - Rediseño de reflexión y Learning Report.
  - Persistencia segura y aislamiento estricto de credenciales.
  - Validación E2E, accesibilidad y consistencia de despliegues.

## Completed

Capacidades fundamentales ya entregadas e integradas:

- **INI-001 — Fundación técnica del monorepo** (completed)
  - Scaffolding del monorepo (pnpm workspace, estructura `apps`/`services`/`ai`/`packages`).
  - Tooling de calidad y CI (lint, typecheck, Vitest, pipeline de PR).
  - Modelo de dominio base en `packages/domain`.
- **INI-002 — Integración con AWS Events** (completed)
  - `events-client`: adapter base de AWS Events REST API (catálogo + paginación + normalización).
  - Autenticación OAuth 2.0 + PKCE con AWS Builder ID (callback local).
  - Agenda personal: `GetSchedule`, favoritos y detección de conflictos.
- **INI-003 — Motor de conocimiento y recomendaciones** (completed)
  - Análisis de contexto → Knowledge Profile + Knowledge Gaps.
  - Ingesta semántica del catálogo a Amazon Bedrock Managed Knowledge Bases.
  - Recomendaciones explicables: candidate filtering + ranking contextual con Bedrock.
  - Runtime agentic (Strands + AgentCore): topología reducida y tools (spike).
- **INI-004 — Experiencia Learning Path y reflexión** (completed)
  - UI de captura de contexto y visualización de Knowledge Profile / Gaps.
  - Construcción y visualización del Learning Path (con reconciliación de agenda).
  - Reflexión post-sesión y adaptación del journey (re-ranking).
- **INI-005 — Cierre de ciclo y exposición** (completed)
  - Learning Report y ruta post-evento (WI-026).
  - Landing pública `/about` desplegada en Netlify (WI-027).
- **INI-006 — Habilitación de IA real en AWS (Bedrock + AgentCore + Managed KB)** (completed)
  - Integración del SDK de Bedrock Converse API (Nova/Claude) con fallback (WI-025).
  - Bedrock Managed Knowledge Bases Retrieve API (WI-028).
  - Runtime Bedrock AgentCore con Action Groups (WI-029).
  - Guardrails de costos y observabilidad de IA (WI-030).
- **INI-007 — Live Event Experience — disponibilidad, agenda y reservas** (completed)
  - Modelo de disponibilidad y proyección para heatmap (WI-015, WI-016, WI-017).
  - Autenticación Builder ID y sincronización de disponibilidad en vivo (WI-018, WI-019).
  - Agenda personal, favoritos y reservas de cupos con reconciliación (WI-020, WI-021 a WI-024).

