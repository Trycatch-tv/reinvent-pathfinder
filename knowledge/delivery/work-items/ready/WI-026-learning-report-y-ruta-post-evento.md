---
type: feature
id: WI-026
title: Learning Report y ruta post-evento
knowledge_level: K2
status: ready
phase: now
initiative: INI-005
domains:
  - product
  - experience
code:
  - ai/knowledge/**
  - apps/client/**
affected_modules:
  - reinvent-pathfinder
created_at: '2026-10-07'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-005
ready_at: '2026-10-07'
---

# Learning Report y ruta post-evento

> Materialized from Initiative INI-005, candidate WI-CANDIDATE-001.

## Outcome

- **Actor:** asistente a AWS re:Invent que ya recorrió el ciclo (contexto → gaps → learning path → reflexiones) y quiere ver qué aprendió al cerrar el evento.
- **Current behavior:** las reflexiones post-sesión ya actualizan los `KnowledgeGaps` (WI-014), pero no existe una vista que **contraste el estado inicial con el posterior** ni que resuma el aprendizaje del evento. El ciclo de valor (Journey 6) queda sin cerrar.
- **Target behavior:** Pathfinder genera un **Learning Report** que compara el perfil/gaps iniciales con los actuales, clasifica cada gap como **cubierto / parcial / pendiente**, y propone una **ruta de aprendizaje posterior** con los gaps aún abiertos. Local-first, sin requerir AWS.
- **Observable completion:** desde un journey con reflexiones aplicadas, el usuario ve un reporte con conteos (cubiertos/parciales/pendientes), el detalle por gap y una lista priorizada de pendientes como "siguiente ruta". Verificable por test.

## Journey reconstruction

```text
Estado inicial: KnowledgeGaps al construir el Learning Path (WI-013) — todos 'open'
        ↓
Reflexiones post-sesión (WI-014) → applyReflectionToGaps → gaps actualizados
        ↓
buildLearningReport(gapsIniciales, gapsActuales)
        ↓
clasificación por gap: cubierto ('closed'/'addressed') / parcial / pendiente ('open')
        ↓
ruta post-evento = gaps pendientes priorizados por severidad
        ↓
visualización en apps/client (LearningReportView)
```

## Problem

El producto promete cerrar el ciclo mostrando el progreso de aprendizaje (Journey 6), pero hoy no hay forma de ver qué gaps se cerraron durante el evento ni qué queda pendiente. Las piezas de datos existen (gaps con `status`, reflexiones); falta la agregación/reporte y su visualización.

_Expected value:_ Compara perfil inicial vs. post-evento; identifica gaps cubiertos/parciales/pendientes (Journey 6).

## Scope

- **Generador del reporte** (`ai/knowledge`, siguiendo el patrón de `recommendations/`): una función `buildLearningReport` que tome los gaps iniciales y los actuales y produzca un resumen (conteos por categoría, detalle por gap, y la ruta de pendientes priorizada por severidad).
- **Clasificación de gaps:** cubierto (`closed`), parcialmente cubierto (`addressed`), pendiente (`open`) — mapeando el `KnowledgeGapStatus` del dominio.
- **UI** en `apps/client`: `LearningReportView` que muestra el reporte (conteos, detalle, ruta post-evento), accesible al final del flujo del Learning Path.
- **Tests Vitest** del generador y del componente.

## Out of scope

- Persistencia del reporte (local-first; en memoria/cliente).
- Landing/demo pública → WI-CANDIDATE-002 de INI-005.
- Inferencia por IA del resumen (el reporte es determinístico sobre el `status` de los gaps; una narrativa generada por Bedrock sería mejora futura dependiente de INI-006).
- Observabilidad/costo de IA → INI-006.

## Surface review

- **AI/knowledge (`ai/knowledge`):** affected — nuevo `buildLearningReport` (determinístico).
- **Frontend (`apps/client`):** affected — nuevo `LearningReportView` + punto de entrada en el flujo.
- **Domain (`packages/domain`):** reviewed-not-affected — `KnowledgeGap.status`, `KnowledgeProfile` ya existen; se usan tal cual.
- **services/api:** not-applicable — local-first, sin endpoint en este corte (coherente con WI-013/WI-014).
- **Auth / datastore / infra:** not-applicable.

## Acceptance Criteria

- [ ] Existe `buildLearningReport` que, dados los gaps iniciales y los actuales, devuelve conteos de cubiertos/parciales/pendientes y el detalle por gap.
- [ ] La ruta post-evento lista los gaps aún `open`, priorizados por severidad (`critical` → `important` → `nice-to-have`).
- [ ] `apps/client` muestra el Learning Report (conteos + detalle + ruta pendiente) al cerrar el flujo del Learning Path.
- [ ] **End-to-end:** desde un journey con al menos una reflexión que cerró un gap, el reporte refleja ese gap como cubierto y lo excluye de la ruta pendiente. Local-first, sin AWS.
- [ ] Tests Vitest cubren el generador y el componente; `pnpm -r test` y `tsc -b` en verde.

## Validation

- `pnpm -r test` y `tsc -b` en exit 0.
- Verificar que un gap marcado `addressed`/`closed` por una reflexión aparece como cubierto y no en la ruta pendiente, y que un gap `open` aparece como pendiente.

## Definition of Done

- Acceptance criteria cumplidos y validación sin errores.
- Reutiliza el dominio y el flujo de reflexión existentes (sin duplicar lógica de gaps).
- Local-first; sin dependencia de INI-006 (IA real).
- Revisado por un maintainer antes de merge.

## Open questions

_Resueltas durante el refinamiento (2026-10-07):_

- [resolved] **MVP:** el Learning Report entra en el MVP del hackathon (decisión del usuario).
- [resolved] **Determinístico vs. IA:** el reporte es determinístico sobre el `status` de los gaps; una narrativa generada por Bedrock queda como mejora futura (dependería de INI-006).

## Dependencies

- Depende de WI-014 (reflexión/adaptación) y WI-013 (Learning Path), y del dominio de INI-003 (`KnowledgeGap`, `KnowledgeProfile`).
- Sin dependencia de INI-006.

## Learning

_What did we learn? Update after completion._
