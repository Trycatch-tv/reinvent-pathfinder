---
type: spike
id: WI-031
title: 'Auditoría E2E de modos, fuentes de datos y participación de IA'
knowledge_level: K3
status: completed
completed_at: '2026-10-11'
phase: now
initiative: INI-008
domains:
  - product
  - experience
  - frontend
  - ai
  - architecture
code:
  - apps/client/src/App.tsx
  - apps/client/src/components/
  - apps/client/src/auth/
  - apps/client/src/fixtures/
  - packages/events-client/src/
  - ai/knowledge/src/
  - services/api/src/
created_at: '2026-10-11'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-008
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-11'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - knowledge/tech/discovery/e2e-modes-data-ai-audit.md
      validations:
        - command: audit inspection against codebase
          status: passed
          reason: >-
            Inspección exhaustiva de apps/client, ai/knowledge,
            packages/events-client y services/api.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-11'
---

# Auditoría E2E de modos, fuentes de datos y participación de IA

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-001.

## Outcome Framing

- **Actor:** Desarrolladores, arquitectos y usuarios de Pathfinder que necesitan comprender con certeza qué datos son reales, qué operaciones usan inferencia en la nube y cómo se orquesta la experiencia.
- **Current Behavior:** La aplicación ejecuta llamadas mixtas: `App.tsx` consulta servicios reales y ante excepciones o en ciertas etapas (como reflexión adaptativa) recurre a `DEMO_SESSIONS` o heurísticas sin comunicarlo; la autenticación Demo simula un token en `LocalStorageTokenStore`; no existe una matriz verificable de fuentes de datos ni categorización de inferencia por etapa.
- **Target Behavior:** Se dispone de una matriz documental y técnica verificable que audita exhaustivamente cada etapa del Journey y flujo transversal, detallando entradas, salidas, fuentes de datos, uso de IA vs heurística vs reglas determinísticas, persistencia y puntos de fallo.
- **Observable Completion:** Documento de auditoría con la matriz E2E completa de las 7 etapas del Journey y los 6 flujos transversales, sirviendo de baseline inmutable para los siguientes Work Items de INI-008.

## Journey Reconstruction

1. **Context Capture (`ContextForm`):** Captura tecnológica, seniority y objetivos. Ejecución en cliente.
2. **Knowledge Profile & Gaps (`analyze`):** Invocación a `/api/analyze` (Bedrock Nova/Claude en backend) con fallback a `HeuristicContextAnalyzer` en local.
3. **Session Ranking (`rank`):** Invocación a `/api/recommendations/rank` con Bedrock Converse API vs fallback a `HeuristicSessionReranker`.
4. **Learning Path (`buildLearningPath`):** Ordenamiento por ranking y detección de conflictos con agenda. 100% determinístico local.
5. **Session Availability & Schedule:** Consulta de disponibilidad y agenda (`GetSchedule`) con `AwsEventsClient` o fixtures `SAMPLE_HEATMAP_AVAILABILITY`.
6. **Reflection Adaptation (`adaptLearningPathFromReflection`):** Cierre de ciclo adaptativo. Actualmente ejecuta `HeuristicSessionReranker` y fuerza `DEMO_SESSIONS`.
7. **Learning Report (`buildLearningReport`):** Análisis comparativo de estado de brechas iniciales vs finales. 100% determinístico.

## Problem

Pathfinder creció a través de iniciativas incrementales (INI-001 a INI-007). Cada capacidad fue probada de forma aislada, pero en la integración global de `apps/client` existen discrepancias:
- Asincronía entre catálogos: una ruta construida con sesiones live puede recalcularse con fixtures en la reflexión.
- Falta de trazabilidad: el usuario no puede verificar si un análisis provino de Amazon Bedrock o de expresiones regulares heurísticas locales.
- Falsos estados de autenticación: el botón "Quick Demo Login" inyecta un token en `LocalStorageTokenStore`, simulando sesión Builder ID activa.
- Carga manual: `/availability` requiere clics repetidos en lugar de auto-bootstrapping.

Sin una auditoría técnica profunda y documentada con evidencias del código, cualquier refactorización corre el riesgo de introducir regresiones o suposiciones falsas sobre las dependencias de AWS.

## Expected Value

Establece el mapa verificable de cómo se ejecuta cada etapa de Pathfinder, identificando fuentes reales, fixtures, inferencia, reglas determinísticas, fallbacks y mezclas inconsistentes. Esta evidencia fundamentará directamente los contratos de providers (WI-CANDIDATE-004), la orquestación global de modos (WI-CANDIDATE-003) y la metadata de trazabilidad (WI-CANDIDATE-006).

## Scope

1. **Auditoría de las 7 etapas del Learning Journey:**
   - Captura de Contexto (`ContextForm.tsx`).
   - Perfil de Conocimiento y Brechas (`KnowledgeProfileView.tsx`, `KnowledgeGapsList.tsx`, `context-analyzer.ts`).
   - Ranking de Recomendaciones (`session-reranker.ts`, `/api/recommendations/rank`).
   - Construcción del Learning Path (`learning-path-builder.ts`, `LearningPathView.tsx`).
   - Disponibilidad y Horarios (`AvailabilityHeatmap.tsx`, `aws-events-client.ts`).
   - Reflexión Post-Sesión (`ReflectionForm.tsx`, `reflection-adapter.ts`).
   - Learning Report (`learning-report-builder.ts`, `LearningReportView.tsx`).

2. **Auditoría de los flujos transversales:**
   - Autenticación Builder ID y persistencia de tokens (`builder-id-client.ts`, `token-store.ts`, `BuilderIdLogin.tsx`).
   - Obtención de catálogo y disponibilidad en vivo vs demo.
   - Agenda personal, favoritos y reservas (`user-schedule.ts`, `schedule-conflict-evaluator.ts`).
   - Almacenamiento en navegador (`JOURNEY_STORAGE_KEY`, `pathfinder_journey_state`).

3. **Matriz de Ejecución E2E:**
   - Input y Output.
   - Fuente de datos (Live AWS Events, Live Bedrock, Fixture local, Heurística).
   - Tipo de ejecución (`ai`, `heuristic`, `deterministic`, `hybrid`, `fixture`, `fallback`).
   - Dependencias de red y credenciales requeridas.
   - Riesgos de inconsistencia identificados.

## Out of Scope

- Modificar el código fuente funcional de `apps/client`, `packages/`, o `ai/` (reservado para los Work Items subsiguientes).
- Implementar nuevos componentes de UI o rediseñar el App Shell (corresponde a WI-CANDIDATE-002).
- Cambiar la infraestructura de AWS o las APIs oficiales de AWS Events.

## Acceptance Criteria

- [x] Existe una matriz documental detallada en Kaddo que audita las 7 etapas del Journey y los flujos transversales de autenticación, catálogo, disponibilidad, agenda y reservas (`knowledge/tech/discovery/e2e-modes-data-ai-audit.md`).
- [x] Para cada etapa se identifican con precisión las fuentes de datos (Live vs Fixtures), la participación real de IA (Bedrock vs Heurística vs Reglas) y las condiciones de fallback.
- [x] Se documentan los puntos exactos de mezcla inconsistente detectados en el código actual (ej. `candidateSessions: DEMO_SESSIONS` en reflexión, simulación de Builder ID en Demo).
- [x] Se define el catálogo de metadata de ejecución objetivo que deberán soportar los contratos en WI-CANDIDATE-004 y WI-CANDIDATE-006 (`ExecutionProvenance`, `ExecutionMetadata`).
- [x] Los hallazgos y recomendaciones técnicas son verificables directamente contra los archivos del repositorio.

## Validation

- Documento de descubrimiento formalizado en [`knowledge/tech/discovery/e2e-modes-data-ai-audit.md`](file:///c:/Users/Admin/Documents/repos/reinvent-pathfinder/knowledge/tech/discovery/e2e-modes-data-ai-audit.md).
- Trazabilidad cruzada contra `App.tsx`, `reflection-adapter.ts`, `learning-path-builder.ts`, `learning-report-builder.ts`, `context-analyzer.ts`, `session-reranker.ts`, `token-store.ts` y `aws-events-client.ts`.

## Learning

- **Entrega completada:** Se documentó la matriz E2E completa en `knowledge/tech/discovery/e2e-modes-data-ai-audit.md`.
- **Hallazgo clave 1:** `buildLearningPath` y `buildLearningReport` son 100% determinísticos y no usan IA generativa. `adaptLearningPathFromReflection` fuerza `HeuristicSessionReranker` y `DEMO_SESSIONS`, ignorando sesiones y agenda en modo Live.
- **Hallazgo clave 2:** El modo Demo inyectaba falsos tokens en `LocalStorageTokenStore`, creando inconsistencia de seguridad.
- **Próximo paso recomendado:** Materializar WI-CANDIDATE-003 (`ExperienceMode = 'demo' | 'live'`) y WI-CANDIDATE-004 (Providers aislados) para desacoplar las fuentes de datos antes de refactorizar la UI en WI-CANDIDATE-002.
