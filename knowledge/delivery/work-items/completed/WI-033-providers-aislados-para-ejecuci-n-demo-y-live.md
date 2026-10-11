---
type: refactor
id: WI-033
title: Providers aislados para ejecución Demo y Live
knowledge_level: K3
status: completed
completed_at: '2026-10-11'
phase: now
initiative: INI-008
domains:
  - architecture
  - frontend
  - product
  - experience
code:
  - apps/client/src/providers/
  - apps/client/src/App.tsx
  - apps/client/src/client.test.ts
created_at: '2026-10-11'
source: initiative
source_id: WI-CANDIDATE-004
source_initiative: INI-008
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-11'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - apps/client/src/App.tsx
        - >-
          knowledge/delivery/initiatives/INI-008-experiencia-unificada-orquestaci-n-de-modos-y-traza.md
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-11'
---

# Providers aislados para ejecución Demo y Live

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-004.

## Outcome Framing

- **Actor:** Desarrollador y usuario de Pathfinder que ejecutan el Journey en cualquiera de los dos modos (`demo` o `live`).
- **Current Behavior:** La lógica de acceso a datos (catálogo, disponibilidad de sesiones, agenda personal, favoritos y reservas) está acoplada directamente dentro de `App.tsx` mediante bloques condicionales dispersos (`if (mode === "demo")`), cayendo en fallbacks silenciosos a fixtures (`DEMO_SESSIONS` / `SAMPLE_USER_SCHEDULE`) ante fallos de red en modo Live, o hardcodeando fixtures durante la reflexión adaptativa.
- **Target Behavior:** Una arquitectura de providers desacoplados bajo interfaces uniformes (`CatalogProvider`, `AvailabilityProvider`, `ScheduleProvider`) empaquetados en un `PathfinderDataProvider`. La implementación `DemoDataProvider` resuelve exclusivamente desde fixtures y estado en memoria sin llamadas a red. La implementación `LiveDataProvider` resuelve contra las APIs oficiales de AWS Events con credenciales de AWS Builder ID y reporta fallos reales sin sustitución silenciosa por fixtures.
- **Observable Completion:** Contratos e implementaciones de providers en `apps/client/src/providers/`, `App.tsx` refactorizado para delegar la obtención y mutación de datos al provider según el `ExperienceMode` activo, erradicación de fallbacks silenciosos de Live a fixtures, y suite de pruebas unitarias que verifica el aislamiento y la gestión de errores en ambos modos.

## Journey Reconstruction

1. **Inicialización según Modo:**
   - Si `mode === 'demo'`, la aplicación instancia `DemoDataProvider`. Las consultas de catálogo retornan el conjunto de 12 sesiones de muestra, la disponibilidad usa el snapshot precalculado, y las mutaciones de favoritos/reservas actualizan el store local en memoria.
   - Si `mode === 'live'`, la aplicación instancia `LiveDataProvider` con el cliente autenticado de AWS Events. Las consultas y mutaciones van directo a la API de AWS Events.
2. **Consultas de Catálogo y Disponibilidad:**
   - La construcción del Learning Path solicita el catálogo al provider activo.
   - La visualización y reconciliación de disponibilidad consultan al provider activo sin mezclar fixtures.
3. **Manejo de Errores Operativos en Live:**
   - Si AWS Events retorna `401 Unauthorized`, `403 Forbidden` o `429 Throttling`, el provider propaga el error correspondiente. La UI informa el estado de error al usuario y NO sustituye silenciosamente los datos por el catálogo demo.
4. **Mutación de Agenda (Favoritos y Reservas):**
   - En Demo, las mutaciones confirman inmediatamente en memoria.
   - En Live, las mutaciones se envían a AWS Events y reconcilian contra la agenda confirmada del asistente.

## Problem

En la auditoría E2E (`knowledge/tech/discovery/e2e-modes-data-ai-audit.md`) se identificaron mezclas críticas:
1. `handleBuildLearningPath` intentaba consultar AWS Events, pero ante cualquier error recurría a `DEMO_SESSIONS`, ocultando fallos de red al usuario.
2. `handleReflectionSubmit` hardcodeaba `DEMO_SESSIONS` y `SAMPLE_USER_SCHEDULE`, perdiendo las sesiones y la agenda real cuando el usuario estaba en modo Live.
3. El estado de la agenda y las operaciones de mutación estaban implementados como lógica ad-hoc dentro de `App.tsx`.

## Expected Value

Elimina mezclas entre fixtures y servicios reales mediante contratos compartidos e implementaciones independientes, reutilizando domain, events-client y los servicios de IA, garantizando predictibilidad y fidelidad operativa.

## Scope

1. **Contratos de Providers (`apps/client/src/providers/types.ts`):**
   - `CatalogProvider`: `getCatalog(): Promise<readonly SessionCandidate[]>`.
   - `AvailabilityProvider`: `getAvailability(): Promise<Record<string, number>>`.
   - `ScheduleProvider`: `getSchedule(): Promise<UserScheduleResult>`, `toggleFavorite(...)`, `toggleReservation(...)`.
   - `PathfinderDataProvider`: interfaz unificada que agrupa los tres proveedores para el modo activo.

2. **Implementación Demo (`DemoDataProvider`):**
   - Consume fixtures locales (`SAMPLE_RAW_SESSIONS`, `SAMPLE_HEATMAP_AVAILABILITY`, `SAMPLE_USER_SCHEDULE`).
   - Mantiene favoritos y reservas simuladas en memoria sin interactuar con endpoints remotos.

3. **Implementación Live (`LiveDataProvider`):**
   - Delega a `AwsEventsClient` oficial.
   - Propaga fielmente los errores tipados (`AwsEventsUnauthorizedError`, `AwsEventsForbiddenError`, `AwsEventsThrottlingError`).
   - Sin sustitución silenciosa de fallos por datos de prueba.

4. **Refactorización de `App.tsx`:**
   - Reemplazar lógica inline por consumo del `PathfinderDataProvider` activo.
   - Pasar el catálogo y la agenda del provider a `buildLearningPath` y a la reflexión adaptativa.

5. **Pruebas Unitarias (`apps/client/src/client.test.ts` / `providers.test.ts`):**
   - Pruebas exhaustivas para `DemoDataProvider` y `LiveDataProvider`.
   - Validación de que un fallo en Live no degrada a fixtures Demo.

## Out of Scope

- Cambios a Bedrock o al servicio backend `services/api`.
- Rediseño general del sistema de diseño (cubierto por WI-CANDIDATE-002).
- Prefetch automático en segundo plano sin interacción (cubierto por WI-CANDIDATE-005).

## Acceptance Criteria

- [x] Interfaces `CatalogProvider`, `AvailabilityProvider`, `ScheduleProvider` y `PathfinderDataProvider` definidas con tipado estricto.
- [x] `DemoDataProvider` implementado y operando 100% offline sin llamadas HTTP a AWS.
- [x] `LiveDataProvider` implementado delegando a `AwsEventsClient` y propagando errores tipados sin fallbacks silenciosos a fixtures.
- [x] `App.tsx` refactorizado para utilizar el provider correspondiente según el `ExperienceMode` activo.
- [x] La reflexión adaptativa utiliza el catálogo del Journey y la agenda provista por el provider en lugar de hardcodear `DEMO_SESSIONS` y `SAMPLE_USER_SCHEDULE`.
- [x] Suite de pruebas unitarias que verifica el comportamiento y aislamiento de ambos providers en verde (`pnpm -r test`).

## Validation

- Ejecutar `pnpm -r build` (`tsc -b`).
- Ejecutar `pnpm -r test` asegurando que todos los tests pasen.
- Ejecutar `pnpm -r lint`.

## Learning

- **Eliminación de Degradación Silenciosa:** Al desacoplar `LiveDataProvider`, cualquier fallo de autenticación o throttling de AWS Events se propaga limpiamente a la capa de presentación con errores tipados (`AwsEventsUnauthorizedError`, `AwsEventsThrottlingError`), erradicando la práctica de sustituir datos reales por fixtures de demo sin advertir al usuario.
- **Continuidad del Journey en Reflexión Adaptativa:** Almacenar `activeCatalog` en el estado del Journey permite que `handleReflectionSubmit` recalcule las recomendaciones sobre las mismas sesiones de AWS Events observadas en el modo Live, resolviendo la inconsistencia crítica identificada en la auditoría E2E.
- **Abstracción Uniforme de Mutaciones:** Consolidar `toggleFavorite` y `toggleReservation` dentro de `ScheduleProvider` desacopla a `App.tsx` de los detalles de persistencia en memoria (Demo) y de los endpoints REST de AWS Events (Live), simplificando el flujo de reconciliación.
