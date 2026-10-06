---
type: feature
id: WI-014
title: Reflexión post-sesión y adaptación del journey (re-ranking)
knowledge_level: K3
status: completed
phase: now
initiative: INI-004
domains:
  - experience
  - product
code:
  - apps/client/**
  - ai/knowledge/**
affected_modules:
  - reinvent-pathfinder
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-003
source_initiative: INI-004
ready_at: '2026-10-06'
completed_at: '2026-10-06'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - ai/knowledge/src/recommendations/reflection-adapter.ts
        - ai/knowledge/src/recommendations/reflection-adapter.test.ts
        - ai/knowledge/src/index.ts
        - apps/client/src/components/ReflectionForm.tsx
        - apps/client/src/components/LearningPathView.tsx
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
      validations:
        - command: 'tsc -b'
          status: passed
          reason: 'Typecheck del workspace sin errores (exit 0).'
        - command: 'pnpm -r test'
          status: passed
          reason: 'Workspace en verde; ai/knowledge 56 tests (incl. 4 del reflection-adapter), apps/client 7 tests (incl. ReflectionForm y acción de reflexión).'
implementation_status: completed
validation_status: completed
verified_at: '2026-10-06'
---

# Reflexión post-sesión y adaptación del journey (re-ranking)

> Materialized from Initiative INI-004, candidate WI-CANDIDATE-003.

## Outcome

- **Actor:** asistente a AWS re:Invent que ya tiene un Learning Path (WI-013) y asistió a una sesión.
- **Current behavior:** el Learning Path se construye una vez a partir de las recomendaciones iniciales. No hay forma de registrar qué aprendió el usuario tras una sesión ni de que esa reflexión altere los gaps o recalcule la ruta. El dominio ya ofrece `Reflection`/`GapUpdateIntent`, `applyReflectionToGaps` y `recordReflectionOnJourney`, pero no están cableados a la experiencia.
- **Target behavior:** tras una sesión, el usuario registra una reflexión corta (rating, aprendizajes, y qué gaps considera cubiertos/parciales). Pathfinder aplica la reflexión a los `KnowledgeGaps` (`applyReflectionToGaps`), recalcula las recomendaciones con los gaps actualizados (`SessionReranker`) y reconstruye el `LearningPath` (`buildLearningPath`), mostrando la ruta adaptada. Cierra el ciclo adaptativo del Journey 5.
- **Observable completion:** desde un Learning Path existente, registrar una reflexión que marca un gap como `addressed` cambia de forma observable el estado del gap y recalcula el path (las sesiones que cubrían ese gap bajan de prioridad o salen). Ejecutable local-first, con tests.

## Journey reconstruction

```text
Learning Path existente (WI-013) + sesión asistida
        ↓
UI de reflexión: rating (1-5), key takeaways, gapUpdates (gapId -> nuevo status)
        ↓
applyReflectionToGaps(gaps, reflection)  → gaps actualizados
recordReflectionOnJourney(journey)        → journey.reflectionsCount++
        ↓
SessionReranker.rank(gaps actualizados)   → recomendaciones recalculadas
buildLearningPath(...)                     → LearningPath adaptado
        ↓
visualización del path adaptado (reusa LearningPathView)
```

## Problem

El producto promete una experiencia adaptativa (Journey 5), pero hoy el Learning Path es estático: no reacciona a lo que el usuario aprende. La lógica de dominio para aplicar reflexiones a gaps ya existe; falta la experiencia (captura de reflexión) y el cableado que recalcula la ruta.

_Expected value:_ Cierra el ciclo adaptativo (Journey 5): la reflexión actualiza gaps y recalcula recomendaciones.

## Scope

- **UI de reflexión** en `apps/client`: componente para capturar una `Reflection` (rating 1-5, key takeaways, y marcar gaps como `addressed`/`in-progress`/etc.), accesible desde un ítem del Learning Path (sesión asistida).
- **Adaptación en el cliente** (local-first): aplicar la reflexión a los gaps con `applyReflectionToGaps`, recalcular recomendaciones con `HeuristicSessionReranker` y reconstruir el path con `buildLearningPath`; actualizar la vista.
- **Helper de adaptación** (si aporta claridad) en `ai/knowledge`: una función que encapsule "reflexión → gaps actualizados → re-ranking → nuevo LearningPath", para no dispersar la orquestación en el componente.
- **Tests Vitest**: aplicación de la reflexión a gaps, el recálculo del path, y el componente de reflexión (donde aplique).

## Out of scope

- Persistencia de reflexiones/journey en DynamoDB (local-first; en memoria/cliente).
- Learning Report / cierre de ciclo post-evento → **INI-005**.
- Inferencia de `gapUpdates` por IA a partir del texto libre (en este corte, el usuario marca los gaps explícitamente; la inferencia asistida puede ser mejora posterior).
- Escritura en AWS Events.

## Surface review

- **Frontend (`apps/client`):** affected — nuevo componente de reflexión + recálculo y re-render del path.
- **AI/knowledge (`ai/knowledge`):** affected si se añade el helper de adaptación (reusa reranker + builder).
- **Domain (`packages/domain`):** reviewed-not-affected — `Reflection`, `applyReflectionToGaps`, `recordReflectionOnJourney`, `advanceJourneyPhase` ya existen; se usan tal cual.
- **services/api:** not-applicable — local-first, sin endpoint en este corte (coherente con WI-013).
- **Auth / datastore / infra:** not-applicable.

## Acceptance Criteria

- [x] `apps/client` ofrece una UI para capturar una `Reflection` (rating, takeaways, gapUpdates) sobre una sesión del Learning Path. → `ReflectionForm` abierto desde cada ítem en `LearningPathView`.
- [x] Al enviar la reflexión, los `KnowledgeGaps` se actualizan con `applyReflectionToGaps` (p. ej. un gap marcado pasa a `addressed`). → `adaptLearningPathFromReflection`; verificado por test.
- [x] Tras aplicar la reflexión, las recomendaciones se recalculan y el `LearningPath` se reconstruye con los gaps actualizados, reflejándose en la UI. → re-rank con gaps abiertos + `buildLearningPath`; `App.handleReflectionSubmit` actualiza el estado.
- [x] El contador de reflexiones del journey se incrementa (`recordReflectionOnJourney`) o se registra la reflexión de forma observable. → vía "registro observable": la reflexión actualiza gaps y recalcula el path. Nota: no se instanció `AttendeeJourney` en el cliente MVP, así que `recordReflectionOnJourney` queda disponible para cuando exista el journey persistido (pendiente).
- [x] **End-to-end:** desde un Learning Path, registrar una reflexión que cubre un gap cambia de forma observable el path recalculado. Local-first, sin AWS. → verificado vía test del adapter (gap `addressed` sale del re-ranking); cableado en la UI.
- [x] Tests Vitest cubren la adaptación (gaps + re-ranking) y el componente; `pnpm -r test` y `tsc -b` en verde. → ai/knowledge 56, apps/client 7; suite exit 0.

## Validation

- `pnpm -r test` y `tsc -b` en exit 0.
- Verificar que marcar un gap como `addressed` en la reflexión lo transiciona (vía `applyReflectionToGaps`) y que el path recalculado cambia respecto al anterior.
- Validar el flujo en el cliente (local-first).

## Definition of Done

- Acceptance criteria cumplidos y validación sin errores.
- Reutiliza la lógica de dominio existente (`applyReflectionToGaps`, `recordReflectionOnJourney`) y el reranker/builder (sin duplicar).
- Cierra el ciclo adaptativo del Journey 5 en modo local-first.
- Cambios revisados por un maintainer antes de merge.

## Open questions

_Resueltas durante el refinamiento (2026-10-06) — defaults local-first, coherentes con WI-013:_

- [resolved] **Inferencia de gapUpdates.** En este corte el usuario marca explícitamente qué gaps quedaron cubiertos/parciales; la inferencia asistida por IA a partir del texto libre queda fuera de alcance (mejora posterior).
- [resolved] **Persistencia.** El journey/reflexiones viven en memoria/cliente (local-first); la persistencia en DynamoDB es trabajo futuro.
- [resolved] **Dónde vive el recálculo.** En el cliente (sin endpoint `services/api`), reutilizando `SessionReranker` + `buildLearningPath`, igual que WI-013.

## Dependencies

- Depende de WI-013 (Learning Path + `LearningPathView`), WI-009 (`SessionReranker`) y WI-003 (lógica de dominio: `Reflection`, `applyReflectionToGaps`, `recordReflectionOnJourney`).

## Learning

_Capturado al cierre (2026-10-06):_

- **Qué se entregó:** `adaptLearningPathFromReflection` (`ai/knowledge`) que cierra el ciclo adaptativo: aplica la reflexión a los gaps (`applyReflectionToGaps`), re-rankea con los gaps aún abiertos y reconstruye el `LearningPath`. Componente `ReflectionForm` (rating, takeaways, marcar gaps como cubiertos) y cableado en `App.tsx`/`LearningPathView` (botón "Reflexionar" por ítem → adaptación → re-render del path). Local-first, sin AWS.
- **Reutilización:** se apoyó en lógica de dominio ya existente (`applyReflectionToGaps`, `transitionGapStatus`) y en `SessionReranker` + `buildLearningPath` de WIs anteriores. Sin duplicar.
- **Decisión de alcance:** el re-ranking considera solo gaps `open` (si todos quedaran cerrados, usa el conjunto completo como fallback para no dejar el path vacío). El usuario marca explícitamente los gaps cubiertos (sin inferencia por IA en este corte).
- **Hallazgos durante implementación:**
  - El reformateador del editor volvió a descartar imports añadidos; hubo que re-insertarlos en `App.tsx`, `LearningPathView.tsx` y `client.test.ts` (patrón ya visto en WI-013). 
  - Un primer intento de test llamaba al componente como función (hooks no corren fuera de React); se reemplazó por un render SSR real de `LearningPathView` con `onReflectionSubmit`.
- **Verificación:** `tsc -b` exit 0; `pnpm -r test` exit 0 (ai/knowledge 56 tests, apps/client 7 tests).

### Conocimiento a actualizar

- Ninguna ADR nueva; sigue las decisiones ya establecidas (local-first, reutilización de dominio).
- Con WI-014, **INI-004 queda completa** (candidatos 1-3 entregados): se cumple el ciclo del Journey 5 (contexto → gaps → recomendaciones → learning path → reflexión → adaptación).

### Pendientes

- [open] `recordReflectionOnJourney` / `AttendeeJourney` persistido: hoy el cliente no instancia el journey; integrarlo cuando haya persistencia.
- [open] Inferencia asistida de `gapUpdates` desde el texto libre de la reflexión (mejora posterior).
- [open] Persistencia de reflexiones (hoy en memoria/cliente).
