---
type: feature
id: WI-013
title: Construcción y visualización del Learning Path (con reconciliación de agenda)
knowledge_level: K2
status: ready
phase: now
initiative: INI-004
domains:
  - experience
  - product
code:
  - apps/client/**
  - ai/knowledge/**
  - packages/contracts/**
affected_modules:
  - reinvent-pathfinder
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-002
source_initiative: INI-004
ready_at: '2026-10-06'
---

# Construcción y visualización del Learning Path (con reconciliación de agenda)

> Materialized from Initiative INI-004, candidate WI-CANDIDATE-002.

## Outcome

- **Actor:** asistente a AWS re:Invent que ya completó la captura de contexto (WI-011) y tiene su `KnowledgeProfile` y `KnowledgeGaps`.
- **Current behavior:** en `apps/client`, tras ver perfil y gaps, el botón "Construir Learning Path Recomendado →" solo dispara un `alert` placeholder. No existe la construcción del `LearningPath` ni su visualización, ni la reconciliación con la agenda. El dominio ya define `LearningPath`/`LearningPathItem`/`ScheduleConflict`, el reranker (`SessionReranker`) ya produce `SessionRecommendation[]`, y `events-client` ya expone `evaluateScheduleConflicts`.
- **Target behavior:** desde el diagnóstico, el usuario construye un `LearningPath` priorizado a partir de las recomendaciones rankeadas, con cada ítem ligado a los `KnowledgeGaps` que cubre; el path se reconcilia con la agenda personal detectando conflictos de horario; y el usuario puede revisar la ruta, ver los conflictos y mantener/descartar ítems. Journey 3 ("Construir el Learning Path") + parte del Journey 4 ("Integrar la agenda").
- **Observable completion:** el cliente muestra un `LearningPath` ordenado con sus ítems, los gaps cubiertos por cada uno y los conflictos de agenda detectados; reemplaza el `alert` placeholder de `App.tsx`; y existe lógica de construcción del path cubierta por tests Vitest. `pnpm -r test` y `tsc -b` en verde.

## Journey reconstruction

```text
KnowledgeProfile + KnowledgeGaps (WI-011)
        ↓
Recomendaciones rankeadas (SessionReranker → SessionRecommendation[])
        ↓
buildLearningPath(recommendations, gaps)  → LearningPath (items ordenados, targetGapIds)
        ↓
reconciliación con agenda (evaluateScheduleConflicts) → ScheduleConflict[]
        ↓
visualización en apps/client: ruta priorizada + gaps cubiertos + conflictos
        ↓
el usuario mantiene/descarta ítems (mantiene el control)
```

## Problem

El ciclo de valor de producto se corta tras los Knowledge Gaps: hay recomendaciones y detección de conflictos como piezas sueltas, pero no una ruta de aprendizaje construida, priorizada y reconciliada con la agenda que el usuario pueda ver y ajustar. Este WI conecta esas piezas en el `LearningPath` y lo expone en la experiencia local-first.

_Expected value:_ Ruta priorizada que considera conocimiento, horario y conflictos; el usuario mantiene control.

## Scope

- **Construcción del path** (`ai/knowledge` o módulo cercano, siguiendo el patrón de `recommendations/`): una función/clase `buildLearningPath` que tome `SessionRecommendation[]` + `KnowledgeGap[]` y produzca un `LearningPath` del dominio (`items` ordenados por prioridad, `targetGapIds` por ítem, `status: 'planned'`).
- **Reconciliación de agenda:** poblar `LearningPath.conflicts` usando `evaluateScheduleConflicts` de `@pathfinder/events-client` contra los `UserScheduleItem` disponibles (modo offline/mock admitido, sin requerir AWS).
- **Contrato** (si hace falta) en `@pathfinder/contracts` para la petición/respuesta de construcción del path.
- **UI** en `apps/client`: nuevo componente que visualiza el `LearningPath` (orden, gaps cubiertos por ítem, conflictos), reemplazando el `alert` del botón "Construir Learning Path Recomendado →" en `App.tsx`. Permitir mantener/descartar ítems.
- **Tests Vitest** para la construcción del path y, donde aplique, el componente de UI (Testing Library).

## Out of scope

- Reflexión post-sesión y re-ranking adaptativo → **INI-004 / WI-CANDIDATE-003** (siguiente WI).
- Gestión de reservas/escritura en AWS Events (más allá de leer agenda y detectar conflictos).
- Persistencia del `LearningPath` en DynamoDB (el MVP local-first lo mantiene en memoria/cliente).
- Despliegue de infraestructura.

## Surface review

- **Frontend (`apps/client`):** affected — nuevo componente de visualización + sustitución del `alert` en `App.tsx`.
- **AI/knowledge (`ai/knowledge`):** affected — lógica `buildLearningPath` (reutiliza `SessionReranker`).
- **Contracts (`packages/contracts`):** affected si se añade un contrato de construcción del path.
- **Domain (`packages/domain`):** reviewed-not-affected — `LearningPath`/`LearningPathItem`/`ScheduleConflict` ya existen; se usan tal cual.
- **events-client:** reviewed-not-affected — `evaluateScheduleConflicts` ya existe; se consume.
- **services/api:** not-applicable — decidido local-first; sin endpoint en este corte (ver Open questions resueltas).
- **Auth / datastore / infra:** not-applicable.

## Acceptance Criteria

- [ ] Existe una función/módulo que construye un `LearningPath` del dominio a partir de `SessionRecommendation[]` + `KnowledgeGap[]`, con `items` ordenados y `targetGapIds` por ítem.
- [ ] El `LearningPath` resultante incluye `conflicts` poblados vía `evaluateScheduleConflicts` contra la agenda del usuario (con soporte offline/mock).
- [ ] `apps/client` visualiza el `LearningPath` (orden, gaps cubiertos, conflictos) y reemplaza el `alert` placeholder del botón de construcción.
- [ ] El usuario puede descartar/mantener ítems del path desde la UI.
- [ ] **End-to-end:** desde el diagnóstico (perfil+gaps) el usuario llega a un Learning Path visible con conflictos reconciliados, ejecutable local-first sin AWS.
- [ ] Tests Vitest cubren la construcción del path (y el componente de UI donde aplique); `pnpm -r test` y `tsc -b` en verde.

## Validation

- `pnpm -r test` y `tsc -b` en exit 0.
- Ejecutar/validar el flujo en el cliente (local-first): construir el path tras un diagnóstico y verificar que se muestran orden, gaps cubiertos y conflictos.
- Verificar que un conflicto de agenda conocido (fixtures de `events-client`) aparece reflejado en el path.

## Definition of Done

- Acceptance criteria cumplidos y validación ejecutada sin errores.
- Reutiliza el dominio y `events-client` existentes (sin duplicar tipos ni lógica de conflictos).
- Sin lógica de reflexión/adaptación (eso es el siguiente WI).
- Cambios revisados por un maintainer antes de merge.

## Open questions

_Resueltas durante el refinamiento (2026-10-06) — defaults local-first, coherentes con la arquitectura ya establecida:_

- [resolved] **Dónde vive la construcción del path.** Solo en el cliente (local-first) para este corte; **no** se expone endpoint en `services/api`. La variante con endpoint queda fuera de alcance (futura, si se necesita servidor). Esto resuelve la superficie `services/api` como `not-applicable` en este WI.
- [resolved] **Origen de `UserScheduleItem` en demo.** Fixtures de `events-client` (`SAMPLE_USER_SCHEDULE`); la agenda autenticada real se integra cuando el login esté cableado en el cliente (fuera de este WI).
- [resolved] **Criterio de priorización.** Se respeta el orden/score del `SessionReranker` tal cual para el `order` de los ítems; no se re-prioriza por severidad/horario en este corte (posible mejora posterior).

## Dependencies

- Depende de WI-011 (UI de contexto/perfil/gaps) y de WI-009 (`SessionReranker`/recomendaciones).
- Reutiliza WI-006 (`evaluateScheduleConflicts`) y WI-003 (tipos de dominio).

## Learning

_What did we learn? Update after completion._
