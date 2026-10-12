---
type: feature
id: WI-036
title: Refinamiento de Learning Path, relevancia y agenda
knowledge_level: K2
status: completed
phase: now
initiative: INI-008
domains:
  - product
  - experience
  - frontend
  - recommendations
  - learning-path
code:
  - packages/domain/src/types/learning-path.ts
  - packages/domain/src/types/session-recommendation.ts
  - packages/domain/src/index.ts
  - packages/domain/src/domain.test.ts
  - ai/knowledge/src/recommendations/learning-path-builder.ts
  - ai/knowledge/src/recommendations/learning-path-builder.test.ts
  - apps/client/src/components/LearningPathView.tsx
  - apps/client/src/App.tsx
  - apps/client/src/client.test.ts
created_at: '2026-10-12'
completed_at: '2026-10-12'
source: initiative
source_id: WI-CANDIDATE-007
source_initiative: INI-008
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-12'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - ai/knowledge/src/recommendations/learning-path-builder.test.ts
        - ai/knowledge/src/recommendations/learning-path-builder.ts
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
        - apps/client/src/components/LearningPathView.tsx
        - packages/domain/src/domain.test.ts
        - packages/domain/src/types/learning-path.ts
      validations:
        - pnpm -r test
        - pnpm -r build
        - pnpm -r lint
implementation_status: completed
validation_status: completed
verified_at: '2026-10-12'
---

# Refinamiento de Learning Path, relevancia y agenda

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-007.

## Outcome Framing

- **Actor:** Asistente o arquitecto que utiliza Pathfinder para armar su agenda formativa en AWS re:Invent.
- **Current Behavior:** Todas las recomendaciones se presentan en una lista plana idéntica, sin clasificar sesiones esenciales frente a secundarias o de baja relevancia. Si hay conflictos de agenda o disponibilidad restringida, las sesiones conflictivas aparecen mezcladas en el flujo principal, y no se distinguen sesiones alternativas viables.
- **Target Behavior:** El Learning Path diferencia de manera clara y determinística entre:
  1. **Sesiones Principales (`primary`):** Alta relevancia para los gaps del usuario y sin conflictos bloqueantes de horario.
  2. **Sesiones Alternativas (`alternative`):** Opciones de respaldo para gaps cubiertos o que compiten por el mismo intervalo de tiempo.
  3. **Baja Relevancia / Exploratorias (`exploratory`):** Recomendaciones con puntajes más modestos que se conservan visibles y accesibles sin ser descartadas arbitrariamente.
  Cada ítem muestra información operativa completa (código, título, venue/sala si existe, horario, disponibilidad, gaps cubiertos y justificación visible).
- **Observable Completion:** Tipos ampliados en `@pathfinder/domain` con niveles de relevancia (`RelevanceTier = 'primary' | 'alternative' | 'exploratory'`), lógica de clasificación en `learning-path-builder.ts`, interfaz visual enriquecida con filtrado o secciones por tier en `LearningPathView.tsx`, y pruebas unitarias integrales en todos los paquetes.

## Journey Reconstruction

1. **Generación del Learning Path:**
   - A partir de las recomendaciones rankeadas y la agenda del usuario, `buildLearningPath` evalúa conflictos y clasifica cada sesión en un `tier` determinístico (`primary`, `alternative`, `exploratory`).
2. **Visualización Segmentada:**
   - `LearningPathView` muestra la ruta organizada:
     - Pestañas de filtrado con conteos (`Todas`, `⭐ Principales`, `🔄 Alternativas`, `🧭 Exploratorias`).
     - Distintivo visual coloreado para cada tier.
     - Indicadores de conflicto con explicación operativa (solapamiento en minutos y sesiones en colisión).
3. **Acciones Operativas:**
   - El usuario visualiza de inmediato nivel, formato, horario, sala, cupos restantes y puede alternar favoritos, reservar asiento y descartar sesiones con información operativa directa.
4. **Conservación de Recomendaciones:**
   - Ninguna recomendación válida es ocultada o eliminada por un umbral arbitrario; se mantienen en la categoría `exploratory` con su justificación visible.

## Problem

Pathfinder anteriormente listaba todas las recomendaciones en orden de rankeo en un único bloque visual plano. Esto generaba fricción:
- Las sesiones con conflictos de agenda ocupaban la misma jerarquía visual que las sesiones viables.
- Sesiones con relevancia marginal aparecían como si fueran parte crítica del camino formativo principal.
- Faltaba claridad operativa sobre cuáles sesiones son alternativas directas cuando una sesión principal está llena o tiene conflicto.
- No se debe filtrar bruscamente por umbral fijo de score porque el usuario puede preferir una sesión complementaria o un topic periférico.

## Expected Value

Transforma la lista de recomendaciones en una ruta priorizada, diferenciando sesiones principales, alternativas y baja relevancia, con información operativa y justificación visible, manteniendo la reconciliación determinística con disponibilidad, agenda y conflictos sin eliminar recomendaciones útiles.

## Scope

1. **Modelo de Dominio (`@pathfinder/domain`):**
   - Incorporar `RelevanceTier = 'primary' | 'alternative' | 'exploratory'` en `learning-path.ts`.
   - Añadir `tier?: RelevanceTier` a `LearningPathItem`.
2. **Constructor de Learning Path (`ai/knowledge`):**
   - Actualizar `buildLearningPath` para calcular determinísticamente el tier de cada ítem según su score y solapamiento/conflicto de agenda.
3. **Componente de UI (`apps/client/src/components/LearningPathView.tsx`):**
   - Pestañas interactivas de filtro por tier (`Todas`, `Principales`, `Alternativas`, `Exploratorias`).
   - Insignias claras por tier con colores distintivos (`⭐ Principal`, `🔄 Alternativa`, `🧭 Exploratoria`).
   - Presentación de detalles operativos (nivel, formato, horario, sala, disponibilidad de cupos, justificación visible).
4. **Pruebas y Verificación:**
   - Pruebas unitarias en `learning-path-builder.test.ts`, `domain.test.ts` y `client.test.ts`.

## Out of Scope

- Cambios en el motor de ranking de Bedrock en el backend (`services/api`).
- Modificación del algoritmo de autenticación Builder ID.

## Acceptance Criteria

- [x] Tipo `RelevanceTier` ('primary' | 'alternative' | 'exploratory') definido y exportado en `@pathfinder/domain`.
- [x] `LearningPathItem` incluye la propiedad `tier: RelevanceTier`.
- [x] `buildLearningPath` categoriza determinísticamente cada sesión sin descartar ninguna por umbral arbitrario.
- [x] `LearningPathView` permite visualizar y alternar claramente entre sesiones principales, alternativas y exploratorias.
- [x] Cada tarjeta muestra información operativa: código, justificación, gaps cubiertos, relevancia, horario y estado de conflicto.
- [x] Todas las pruebas de workspace (`pnpm -r test`, `pnpm -r build`, `pnpm -r lint`) pasan en verde.

## Validation

- Ejecutar `tsc -b` y `pnpm -r test`.
- Validar pruebas unitarias de clasificación de tiers en `learning-path-builder.test.ts` y UI en `client.test.ts`.
- Ejecutar `pnpm -r lint`.

## Learning

1. **Segmentación de Relevancia sin Pérdida de Información:**
   - En vez de descartar recomendaciones mediante filtros rígidos de umbral (e.g. `score >= 0.70`), clasificar determinísticamente en tiers (`primary`, `alternative`, `exploratory`) permite presentar una ruta focalizada sin privar al usuario de sesiones complementarias o de backup.
2. **Reconciliación Determinística de Agenda y Conflicto en el Tiering:**
   - Vincular la detección de conflictos de agenda directamente a la clasificación de la sesión (marcando sesiones solapadas como `alternative`) ayuda al asistente a tomar decisiones tácticas inmediatas en la conferencia sin degradar la coherencia de la ruta global.
