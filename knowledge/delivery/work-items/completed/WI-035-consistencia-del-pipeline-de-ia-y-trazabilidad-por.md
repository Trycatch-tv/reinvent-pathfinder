---
type: feature
id: WI-035
title: Consistencia del pipeline de IA y trazabilidad por etapa
knowledge_level: K3
status: completed
phase: now
initiative: INI-008
domains:
  - ai
  - product
  - experience
  - frontend
  - architecture
code:
  - packages/domain/src/types/ai-trace.ts
  - packages/domain/src/index.ts
  - packages/domain/src/domain.test.ts
  - apps/client/src/components/AITraceBadge.tsx
  - apps/client/src/components/AITracePanel.tsx
  - apps/client/src/App.tsx
  - apps/client/src/client.test.ts
created_at: '2026-10-11'
completed_at: '2026-10-11'
source: initiative
source_id: WI-CANDIDATE-006
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
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
        - apps/client/src/components/AITraceBadge.tsx
        - apps/client/src/components/AITracePanel.tsx
        - packages/domain/src/types/ai-trace.ts
        - packages/domain/src/domain.test.ts
        - packages/domain/src/index.ts
      validations:
        - pnpm -r test
        - pnpm -r build
        - pnpm -r lint
implementation_status: completed
validation_status: completed
verified_at: '2026-10-11'
---

# Consistencia del pipeline de IA y trazabilidad por etapa

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-006.

## Outcome Framing

- **Actor:** Evaluador, arquitecto o usuario de Pathfinder que desea saber con certeza qué etapas del Journey utilizan inferencia generativa con Amazon Bedrock, cuáles emplean heurísticas locales y cuáles son algoritmos determinísticos.
- **Current Behavior:** La participación de IA es opaca. No existe un modelo unificado de trazabilidad por etapa; algunas vistas muestran `modelId` suelto, mientras que otras etapas determinísticas (como la reconciliación de conflictos o el Learning Report) pueden confundirse con inferencia de LLM, o enmascarar silenciosamente la degradación a heurísticas locales tras errores de red.
- **Target Behavior:** Modelo de datos tipado en el dominio (`StageExecutionTrace`, `ProcessingEngine`) que registra explícitamente el motor (`bedrock` | `heuristic` | `deterministic`) y metadata de ejecución para cada etapa del Journey. La interfaz presenta insignias visuales de motor y un panel de trazabilidad de IA que expone la procedencia exacta de los resultados sin filtrar secretos ni prompts sensibles.
- **Observable Completion:** Tipos de trazabilidad en `@pathfinder/domain`, registro de trazas en cada etapa en `App.tsx`, componente visual `AITraceIndicator` / panel de trazabilidad accesible por etapa y pruebas unitarias que validan la correcta asignación de trazabilidad.

## Journey Reconstruction

1. **Context Analysis (Etapa 1):**
   - Si `/api/analyze` responde exitosamente: registra `engine: 'bedrock'`, `modelId: 'anthropic.claude-...'`.
   - Si cae a fallback local: registra `engine: 'heuristic'`, `modelId: 'heuristic-local'`.
2. **Session Ranking (Etapa 2):**
   - Si `/api/recommendations/rank` responde exitosamente: registra `engine: 'bedrock'`, `modelId: '...'`.
   - Si cae al reranker heurístico: registra `engine: 'heuristic'`, `modelId: 'heuristic-reranker'`.
3. **Learning Path Construction (Etapa 3):**
   - Reconciliación con agenda y disponibilidad: registra explícitamente `engine: 'deterministic'`, describiendo la evaluación de conflictos.
4. **Adaptive Reflection (Etapa 4):**
   - Recálculo adaptativo de gaps y recomendaciones: registra explícitamente `engine: 'heuristic'` (algoritmo heurístico local de adaptación).
5. **Learning Report (Etapa 5):**
   - Comparador de cobertura y brechas pendientes: registra explícitamente `engine: 'deterministic'`.
6. **Inspección de Trazabilidad:**
   - El usuario visualiza en cada sección una insignia clara del tipo de procesamiento (`[🤖 Bedrock]`, `[⚙️ Heurístico]`, `[📐 Determinístico]`) y puede consultar la traza consolidada del Journey.

## Problem

En la auditoría E2E (`knowledge/tech/discovery/e2e-modes-data-ai-audit.md`) se verificó que la aplicación carecía de trazabilidad unificada:
- No se comunicaba cuándo un error de API degradaba silenciosamente a lógica heurística.
- Se atribuía erróneamente inferencia de IA a etapas que son 100% determinísticas (como la generación del reporte y la reconciliación de conflictos).
- El usuario no tenía forma de certificar que el catálogo y el contexto fueron preservados consistentemente entre las llamadas de Bedrock y las reglas de negocio.

## Expected Value

Permite verificar qué etapas utilizan Bedrock, cuáles usan heurísticas y cuáles son determinísticas, manteniendo el mismo contexto y las mismas sesiones durante todo el Journey, garantizando honestidad técnica y auditabilidad de IA.

## Scope

1. **Contrato de Dominio (`packages/domain/src/types/ai-trace.ts`):**
   - `ExecutionStage`: `'context_analysis' | 'session_ranking' | 'path_construction' | 'reflection_adaptation' | 'report_generation'`.
   - `ProcessingEngine`: `'bedrock' | 'heuristic' | 'deterministic'`.
   - `StageExecutionTrace`: interfaz con `stage`, `engine`, `modelId?`, `executedAt`, `summary`, `fallbackReason?`, `durationMs?`.
2. **Registro de Trazas en `apps/client/src/App.tsx`:**
   - Estado `traces: Partial<Record<ExecutionStage, StageExecutionTrace>>`.
   - Registro al completar cada etapa del Journey con persistencia local en `pathfinder_journey_state`.
3. **Componente Visual (`AITraceBadge.tsx` / `AITracePanel.tsx`):**
   - Insignias visibles en cada etapa (`🤖 Bedrock AI`, `⚙️ Heurístico Local`, `📐 Determinístico`, `⏳ Pendiente`).
   - Panel de auditoría expandible que expone los tiempos de ejecución, motivos de fallback y descripción de algoritmos.
4. **Pruebas y Verificación:**
   - Pruebas unitarias en `domain.test.ts` y `client.test.ts` validando la consistencia y captura de trazas.

## Out of Scope

- Exposición de prompts sensibles, API keys o tokens de AWS en el frontend.
- Modificación del backend de inferencia de Bedrock en `services/api`.

## Acceptance Criteria

- [x] Tipos `StageExecutionTrace`, `ProcessingEngine` y `ExecutionStage` definidos y exportados en `@pathfinder/domain`.
- [x] Cada etapa del Journey (`context_analysis`, `session_ranking`, `path_construction`, `reflection_adaptation`, `report_generation`) registra su traza de ejecución correspondiente.
- [x] La UI identifica visualmente el motor de procesamiento para cada etapa (`bedrock` vs `heuristic` vs `deterministic`).
- [x] Las etapas determinísticas nunca se etiquetan como inferencia generativa.
- [x] Si la llamada a Bedrock falla y se activa el fallback heurístico, la traza refleja fielmente `heuristic` con notas explicativas.
- [x] Todas las pruebas de workspace (`pnpm -r test`, `pnpm -r build`, `pnpm -r lint`) pasan en verde.

## Validation

- Ejecutar `tsc -b` y `pnpm -r test`.
- Validar pruebas unitarias de trazabilidad en cliente y dominio.
- Ejecutar `pnpm -r lint`.

## Learning

1. **Auditabilidad y Honestidad Técnica en Sistemas con IA:**
   - En arquitecturas híbridas (LLM + Heurísticas locales + Algoritmos determinísticos), etiquetar todo genéricamente como "IA" devalúa la credibilidad técnica y oculta fallos de infraestructura.
   - Definir un contrato explícito `ProcessingEngine = 'bedrock' | 'heuristic' | 'deterministic'` junto con `fallbackReason` permite que usuarios y evaluadores auditen la ejecución real del pipeline en tiempo real sin revelar secretos, API keys o prompts internos.
2. **Aislamiento entre Inferencia y Reconciliación de Negocio:**
   - El ordenamiento de recomendaciones ante conflictos de horario (`path_construction`) y el cálculo de porcentajes de cobertura en el reporte (`report_generation`) son operaciones puramente algorítmicas y determinísticas. Al registrarlas explícitamente como `deterministic`, el sistema demuestra rigor y claridad arquitectónica.
