---
type: roadmap
updated_at: 2026-10-03
---

# pathfinder — Roadmap

> What we intend to build and why.

El roadmap se organiza en Iniciativas (`knowledge/delivery/initiatives/`). Cada iniciativa agrupa candidatos de Work Item derivados del scope y los journeys de producto. Los candidatos aún no son Work Items: se materializan uno a uno cuando se decide trabajarlos.

## Now

Fundación e integración base que habilitan todo lo demás.

- **INI-001 — Fundación técnica del monorepo** (priority: high)
  - Scaffolding del monorepo (pnpm workspace, estructura `apps`/`services`/`ai`/`packages`).
  - Tooling de calidad y CI (lint, typecheck, Vitest, pipeline de PR).
  - Modelo de dominio base en `packages/domain`.
- **INI-002 — Integración con AWS Events** (priority: high)
  - `events-client`: adapter base de AWS Events REST API (catálogo + paginación + normalización).
  - Autenticación OAuth 2.0 + PKCE con AWS Builder ID (callback local).
  - Agenda personal: `GetSchedule`, favoritos y detección de conflictos.

## Next

Valor central del producto: conocimiento, recomendaciones y experiencia.

- **INI-003 — Motor de conocimiento y recomendaciones** (priority: high)
  - Análisis de contexto → Knowledge Profile + Knowledge Gaps.
  - Ingesta semántica del catálogo a Amazon Bedrock Managed Knowledge Bases.
  - Recomendaciones explicables: candidate filtering + ranking contextual con Bedrock.
  - Runtime agentic (Strands + AgentCore): topología reducida y tools (spike).
- **INI-004 — Experiencia Learning Path y reflexión** (priority: medium)
  - UI de captura de contexto y visualización de Knowledge Profile / Gaps.
  - Construcción y visualización del Learning Path (con reconciliación de agenda).
  - Reflexión post-sesión y adaptación del journey (re-ranking).

## Later

Cierre de ciclo y exposición, no comprometido todavía.

- **INI-005 — Cierre de ciclo y exposición** (priority: low)
  - Learning Report y ruta post-evento.
  - Demo / sitio público (`apps/site`) para Builder Center.
  - Observabilidad y controles de costo/seguridad de IA.
