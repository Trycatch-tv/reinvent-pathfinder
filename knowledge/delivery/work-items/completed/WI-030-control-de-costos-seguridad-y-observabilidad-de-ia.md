---
type: chore
id: WI-030
title: Control de costos/seguridad y observabilidad de IA
knowledge_level: K3
status: completed
phase: now
completed_at: '2026-10-11'
initiative: INI-006
domains:
  - ai
  - tech
related_domain: Tech
related_capabilities:
  - context-analysis
  - session-recommendations
code:
  - ai/knowledge/src/observability/ai-metrics-tracker.ts
  - ai/knowledge/src/observability/cost-guardrail.ts
  - ai/knowledge/src/observability/observability.test.ts
  - ai/knowledge/src/context-analyzer.ts
  - ai/knowledge/src/recommendations/session-reranker.ts
  - ai/knowledge/src/index.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
created_at: '2026-10-11'
source: initiative
source_id: WI-CANDIDATE-004
source_initiative: INI-006
generated_by: kaddo-create
template_version: 1
ready_at: '2026-10-11'
---

# Control de costos/seguridad y observabilidad de IA

> Materialized from Initiative INI-006, candidate WI-CANDIDATE-004.

## Problem

Con la activación de inferencia real en Amazon Bedrock (`ConverseCommand`, `RetrieveCommand` e `InvokeAgentCommand`), no existen mecanismos que midan el consumo de tokens, la latencia, los costos estimados en USD ni límites de presupuesto que protejan contra llamadas descontroladas o ataques de denegación de servicio económico (DoS de costos).

## Actor and Outcome

Como operador de la plataforma o responsable de arquitectura de IA, dispongo de un módulo de observabilidad (`AiMetricsTracker`) que audita cada llamada a Bedrock (latencia, tokens de entrada/salida, costo estimado y estado de fallback) y un guardrail de costos (`CostGuardrail`) que previene sobrecostos forzando degradación transparente a heurística cuando se superan los umbrales configurados.

## Current and Target State

- **Current behavior**:
  - Las llamadas a Bedrock no registran métricas de consumo de tokens ni tiempo de respuesta.
  - No existen límites de presupuesto o tokens por petición.
- **Target behavior**:
  - `ai/knowledge` incorpora `CostGuardrail` para limitar tokens por llamada y presupuestos acumulados con alerta de exceso de costo (`BudgetExceededError` / fallback seguro).
  - Se implementa `AiMetricsTracker` con recolección de eventos de inferencia (`trackOperation`), cálculo de costos por modelo (Claude 3.5 Sonnet / Haiku / embeddings) y generación de reportes resumidos.
  - `BedrockContextAnalyzer` y `BedrockSessionReranker` integran opcionalmente el guardrail y tracker, garantizando fallback al modo heurístico si el guardrail bloquea la llamada por exceder el presupuesto.
  - La suite de pruebas unitarias (`ai/knowledge/src/observability/observability.test.ts`) verifica la medición de latencia, el cálculo de costos, el bloqueo por umbral de presupuesto y la degradación limpia en modo offline.

## Entry Points and Journey

- **Entry points**:
  - `AiMetricsTracker.record(event)` y `AiMetricsTracker.getSummary()`
  - `CostGuardrail.validateAndAcquire(estimatedTokens)`
  - Integración en `BedrockContextAnalyzer.analyze()` y `BedrockSessionReranker.rank()`
- **End-to-end flow**:
  1. El analyzer o reranker recibe una petición y consulta a `CostGuardrail`.
  2. Si el presupuesto se excede, activa inmediatamente la degradación al modo heurístico sin invocar la API con costo.
  3. Si la llamada a Bedrock procede, mide la latencia y extrae `usage.inputTokens` y `usage.outputTokens`.
  4. Registra la métrica en `AiMetricsTracker` actualizando el acumulado de tokens y costo en USD.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| AI / Knowledge (`ai/knowledge`) | Affected: nuevo subdirectorio `observability/`, guardrail de presupuesto, integración con analizador y reranker, y tests unitarios. |
| Services / API (`services/api`) | Reviewed, not changed: puede consultar métricas de observabilidad mediante el singleton exportado. |

## Acceptance Criteria

- [x] `CostGuardrail` permite definir límites de tokens por petición (`maxTokensPerRequest`) y presupuesto máximo acumulado (`maxCostBudgetUsd`), bloqueando o degradando cuando se excede.
- [x] `AiMetricsTracker` registra latencia, modelo, tokens utilizados, costo aproximado en USD y estado (`success` o `fallback`), proporcionando un resumen agregado (`getSummary()`).
- [x] `BedrockContextAnalyzer` y `BedrockSessionReranker` admiten inyección de guardrail y tracker para auditar sus operaciones e interceptar sobrecostos.
- [x] Si se excede el presupuesto o tokens máximos, los componentes ejecutan fallback limpio al modo heurístico sin arrojar excepciones no controladas.
- [x] La suite de pruebas unitarias verifica el seguimiento de métricas, el cálculo de costos y la activación de fallback ante excedente de presupuesto, ejecutándose 100% offline.
- [x] `pnpm test`, `pnpm typecheck` y `pnpm lint` pasan con 0 errores.

## Out of Scope

- Alarmas de AWS CloudWatch / SNS en la nube (pertenece al despliegue de infraestructura).
- Pasarela de pago o facturación por usuario.

## Validation

```bash
pnpm --filter @pathfinder/ai-knowledge test
pnpm test
pnpm typecheck
pnpm lint
```

## Definition of Done

- `CostGuardrail` y `AiMetricsTracker` implementados en `ai/knowledge`.
- Integración en `BedrockContextAnalyzer` y `BedrockSessionReranker`.
- Pruebas unitarias completas.
- CI en verde.

## Learning

1. **Defensa de Costos a Nivel de Aplicación**: En arquitecturas con modelos fundacionales (Claude 3.5 Sonnet), un `CostGuardrail` integrado localmente previene ataques de denegación de presupuesto y fugas de consumo antes de despachar llamadas hacia AWS Bedrock, degradando de manera transparente a heurísticas sin interrumpir la experiencia del usuario.
2. **Observabilidad Unificada en Memoria**: `AiMetricsTracker` proporciona visibilidad inmediata de métricas operativas críticas (latencia p50/p90, tasas de éxito vs fallback, consumo de tokens y estimación de gasto en USD) desacoplada de agentes pesados o agentes APM externos.
3. **Completitud de la Iniciativa INI-006**: Con la entrega de WI-030, el bloque completo de IA real (inferencia en Bedrock Converse, búsqueda vectorial en Bedrock Knowledge Bases, runtime agentic en AgentCore y observabilidad/guardrails de costos) queda 100% cubierto, probado y listo para producción.

