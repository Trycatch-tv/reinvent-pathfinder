---
type: feature
id: WI-025
title: Integración del SDK de Bedrock y activación de analyzer/reranker reales
knowledge_level: K3
status: completed
phase: now
completed_at: '2026-10-07'
initiative: INI-006
domains:
  - ai
  - tech
related_domain: Tech
related_capabilities:
  - context-analysis
  - session-recommendations
code:
  - ai/knowledge/package.json
  - ai/knowledge/src/context-analyzer.ts
  - ai/knowledge/src/context-analyzer.test.ts
  - ai/knowledge/src/recommendations/session-reranker.ts
  - ai/knowledge/src/recommendations/recommendations.test.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
created_at: '2026-10-07'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-006
generated_by: kaddo-create
template_version: 1
ready_at: '2026-10-07'
---

# Integración del SDK de Bedrock y activación de analyzer/reranker reales

> Materialized from Initiative INI-006, candidate WI-CANDIDATE-001.

## Problem

Actualmente `BedrockContextAnalyzer` y `BedrockSessionReranker` son esqueletos que siempre delegan en el modo heurístico offline (`heuristic-offline-v1`), sin capacidad de invocar modelos fundacionales reales de Amazon Bedrock cuando existen credenciales y región configuradas.

## Actor and Outcome

Como asistente o sistema que envía el contexto de proyecto o solicita un re-ranking, obtengo análisis semántico y justificaciones explicables generadas por un LLM real (Claude 3.5 Sonnet / Haiku vía Bedrock Converse API) cuando el entorno AWS está activo, manteniendo fallback automático e imperceptible al modo heurístico si AWS no está disponible o falla la llamada.

## Current and Target State

- **Current behavior**: Las clases `BedrockContextAnalyzer` y `BedrockSessionReranker` importan interfaces pero retornan directamente `this.fallbackAnalyzer.analyze()` / `this.fallbackReranker.rank()`. `@aws-sdk/client-bedrock-runtime` no está instalado en `ai/knowledge`.
- **Target behavior**:
  - `ai/knowledge` incluye `@aws-sdk/client-bedrock-runtime`.
  - `BedrockContextAnalyzer` invoca la API `Converse` de Bedrock con un prompt estructurado para extraer `KnowledgeProfile` y `KnowledgeGap[]` en JSON conforme a `@pathfinder/domain`.
  - `BedrockSessionReranker` invoca `Converse` para ponderar los candidatos contra las brechas y generar `SessionRecommendation[]` con explicaciones semánticas reales.
  - Se parametriza el `modelId` (por defecto Claude 3.5 Sonnet / Haiku configurable por `BEDROCK_MODEL_ID` o constructor) y `region` (por `AWS_REGION` o constructor).
  - Ambos componentes implementan un bloque `try/catch` defensivo que garantiza degradación transparente al modo heurístico ante falta de credenciales, timeout, cuotas excedidas o errores de red.

## Entry Points and Journey

- **Entry points**: `BedrockContextAnalyzer.analyze(request)` y `BedrockSessionReranker.rank(request)` utilizados por las lambdas (`services/api`) y herramientas del agente (`ai/tools`).
- **End-to-end flow**:
  1. La aplicación invoca el analyzer o reranker con un payload tipado (`AnalyzeContextRequest` o `RankRecommendationsRequest`).
  2. Si `bedrockClient` o variables AWS están presentes, construye el mensaje Converse con schema estructurado.
  3. Ejecuta la llamada a Bedrock. Si tiene éxito y el JSON es válido, devuelve la respuesta enriquecida (`modelId: bedrock-converse-...`).
  4. Si ocurre cualquier error o no hay credenciales, captura la excepción y ejecuta inmediatamente el `HeuristicContextAnalyzer` / `HeuristicSessionReranker`.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| AI / Knowledge (`ai/knowledge`) | Affected: integración del cliente SDK de Bedrock, prompts Converse y tests unitarios con mocks. |
| API Services (`services/api`) | Reviewed, not changed: ya consumen las interfaces `ContextAnalyzerProvider` y `SessionRerankerProvider`. |
| AI Tools (`ai/tools`) | Reviewed, not changed: ya consumen las interfaces existentes. |
| Domain & Contracts | Reviewed, not changed: los contratos `AnalyzeContextResponse` y `RankRecommendationsResponse` ya contemplan `modelId`. |
| Frontend | Reviewed, not changed: desacoplado del runtime de inferencia. |

## Module Coverage

- `reinvent-pathfinder` — affected: paquete `ai/knowledge` en el monorepo.

## Acceptance Criteria

- [x] `ai/knowledge` declara y utiliza `@aws-sdk/client-bedrock-runtime` para comunicarse con Amazon Bedrock.
- [x] `BedrockContextAnalyzer.analyze()` utiliza la API Converse estructurada y parsea correctamente la respuesta a `AnalyzeContextResponse`.
- [x] `BedrockSessionReranker.rank()` utiliza la API Converse para evaluar candidatos y devolver recomendaciones explicadas.
- [x] Ambos componentes permiten configurar `modelId`, `region` o un cliente inyectado para pruebas.
- [x] Cuando la llamada a Bedrock falla (por red, credenciales inválidas, formato inesperado o cuota), el componente degrada de forma transparente y retorna el resultado del analizador/reranker heurístico sin arrojar error no controlado.
- [x] La suite de pruebas unitarias (`ai/knowledge/src/context-analyzer.test.ts` y `ai/knowledge/src/recommendations/recommendations.test.ts`) verifica tanto la ejecución exitosa con cliente Bedrock simulado (mock) como la degradación automática al ocurrir un fallo, sin requerir credenciales de AWS reales en CI.

## Out of Scope

- Despliegue de infraestructura de Bedrock / AgentCore (cubierto en WI-CANDIDATE-003).
- Ingesta a Managed Knowledge Bases (cubierto en WI-CANDIDATE-002).
- Controles de cuotas y métricas avanzadas de CloudWatch (cubierto en WI-CANDIDATE-004).

## Validation

```bash
pnpm --filter @pathfinder/ai-knowledge test
pnpm test
pnpm typecheck
pnpm lint
```

## Definition of Done

- SDK integrado en `ai/knowledge`.
- Ambas clases ejecutan llamadas reales/mockeadas a Converse API con fallback resiliente.
- Tests unitarios prueban flujo normal mockeado y casos de fallback.
- `pnpm test`, `typecheck` y `lint` pasan al 100%.

## Open Questions

- [assumed] Modelo Bedrock base: Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`) con opción de Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) vía `BEDROCK_MODEL_ID`.
  - note: Acorde a la decisión asumida en `knowledge/tech/codebase.md`.

## Learning

1. **Patrón Converse API con degradación silenciosa**: Implementar la API `Converse` de Bedrock con extracción defensiva de bloques JSON (mediante regex tolerante a markdown fences y parseo estricto) permite interoperabilidad limpia con Claude 3.5 Sonnet/Haiku.
2. **Resiliencia en CI y pruebas**: Inyectar `bedrockClient` opcional en los constructores permite simular respuestas con mocks exactos sin depender de credenciales reales de AWS ni emuladores pesados, garantizando 100% de pasaje offline en CI.
3. **Mantenimiento de contratos**: Ambos adaptadores preservan la interfaz `ContextAnalyzerProvider` y `SessionRerankerProvider`, asegurando total compatibilidad con las lambdas de `services/api` y las herramientas de `ai/tools`.
