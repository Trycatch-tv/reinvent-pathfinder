---
type: feature
id: WI-007
title: Análisis de contexto → Knowledge Profile + Knowledge Gaps
knowledge_level: K3
status: completed
phase: now
initiative: INI-003
domains:
  - ai
  - knowledge
code:
  - packages/contracts/**
  - ai/knowledge/**
  - services/api/**
created_at: '2026-10-05'
completed_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-003
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-05'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/contracts/package.json
        - packages/contracts/src/context.ts
        - packages/contracts/src/index.ts
        - ai/knowledge/package.json
        - ai/knowledge/src/context-analyzer.ts
        - ai/knowledge/src/context-analyzer.test.ts
        - ai/knowledge/src/index.ts
        - services/api/package.json
        - services/api/src/handlers/context-analyze.ts
        - services/api/src/handlers/context-analyze.test.ts
        - services/api/src/index.ts
      validations: []
implementation_status: completed
validation_status: completed
verified_at: '2026-10-05'
---

# Análisis de contexto → Knowledge Profile + Knowledge Gaps

> Materialized from Initiative INI-003, candidate WI-CANDIDATE-001.

## Outcome

- **Actor:** Asistente a AWS re:Invent describiendo lo que está construyendo en la interfaz de Pathfinder.
- **Current behavior:** No existe mecanismo para transformar la descripción libre de un proyecto en un perfil estructurado de necesidades de conocimiento ni identificar brechas técnicas.
- **Target behavior:** Pathfinder recibe la descripción libre del proyecto, tecnologías y objetivos del usuario (`ProjectContext`), extrae y estructura su `KnowledgeProfile` (skills, dominios de interés y nivel), detecta las brechas técnicas requeridas (`KnowledgeGaps`) con severidad (`critical`, `important`, `nice-to-have`) y justificación explicable; soporta tanto inferencia asistida por Amazon Bedrock (vía Converse API) como un motor heurístico de respaldo (Mock / Offline) para pruebas y desarrollo sin costo.
- **Observable completion:** Contratos de API estructurados y validados (`AnalyzeContextInput`, `AnalyzeContextOutput`), analizador de contexto implementado en `ai/knowledge/src/context-analyzer.ts`, handler HTTP en `services/api/src/handlers/context-analyze.ts` para `POST /v1/context/analyze`, y suite de pruebas unitarias al 100% con Vitest.

## Journey reconstruction

```text
Usuario ingresa descripción del proyecto en Pathfinder:
"Estoy construyendo una plataforma multi-agente en AWS con Amazon Bedrock,
 DynamoDB y observabilidad distribuida"
       ↓
POST /v1/context/analyze (con ProjectContext saneado)
       ↓
Validation de Schema (contracts)
       ↓
ContextAnalyzer (Amazon Bedrock Converse API / Heurístico Offline)
       ↓
Extracción estructurada:
  • KnowledgeProfile: { skills: ['Amazon Bedrock', 'DynamoDB', 'Observability'], ... }
  • KnowledgeGaps: [
      { topic: 'Agent Observability', severity: 'critical', rationale: '...' },
      { topic: 'DynamoDB Single-Table Modeling', severity: 'important', rationale: '...' }
    ]
       ↓
Retorna { profile, gaps } al cliente para revisión y edición por el usuario
```

## Problem

Pathfinder parte de la premisa de que las recomendaciones no deben basarse únicamente en palabras clave sueltas, sino en el proyecto real y los objetivos de aprendizaje del asistente. Para construir un Learning Path personalizado es indispensable transformar el lenguaje natural del asistente en entidades de conocimiento procesables (`KnowledgeProfile` y `KnowledgeGaps`) que alimentarán las etapas de filtrado y reranking del catálogo de re:Invent.

_Expected value:_ Primera rebanada de valor de producto (Journey 1): del contexto al perfil con gaps revisables.

## Scope

- Definir contratos TypeScript y esquemas de validación en `packages/contracts/src/context.ts`:
  - `AnalyzeContextRequest`: texto del proyecto, stack actual, seniority, metas y restricciones.
  - `AnalyzeContextResponse`: `KnowledgeProfile` estructurado y lista de `KnowledgeGap[]`.
- Implementar el analizador de contexto en `ai/knowledge/src/context-analyzer.ts`:
  - Interfaz `ContextAnalyzerProvider`:
    - `BedrockContextAnalyzer`: invoca Amazon Bedrock (Converse API con JSON estructurado) utilizando el modelo configurable (ej. Claude 3.5 Sonnet / Haiku).
    - `HeuristicContextAnalyzer`: analizador offline/simulado determinístico para tests y desarrollo local sin llamadas a AWS.
- Implementar el handler de API en `services/api/src/handlers/context-analyze.ts`:
  - Endpoint `POST /v1/context/analyze`.
  - Validación de payload de entrada (protección contra payloads vacíos o excesivamente grandes).
- Pruebas unitarias completas con Vitest en `ai/knowledge` y `services/api`:
  - Validación de parsing y estructuración correcta de perfil y brechas.
  - Manejo de fallos en el modelo o respuestas malformadas con fallback seguro.
  - Validación de esquemas y códigos de error (400 Bad Request, 500 Internal Error).

## Out of scope

- Reranking de sesiones del catálogo (`WI-CANDIDATE-003`).
- Ingesta semántica a Amazon Bedrock Knowledge Bases (`WI-CANDIDATE-002`).
- UI gráfica de React (`INI-004`).

## Surface review

- **Product/UI:** reviewed — `apps/client` consumirá este endpoint en Journey 1.
- **Frontend:** reviewed-not-affected en este slice (SDK y backend primero).
- **Backend:** affected — `services/api/src/handlers/context-analyze.ts`.
- **AI/Agentic:** affected — `ai/knowledge/src/context-analyzer.ts` y contratos en `packages/contracts`.
- **Shared packages:** affected — `packages/contracts` y `@pathfinder/domain`.
- **Operations/release:** reviewed — utiliza variables de entorno estándar `BEDROCK_REGION`, `BEDROCK_MODEL_ID`.

## Acceptance Criteria

- [x] Contratos `AnalyzeContextRequest` y `AnalyzeContextResponse` definidos y exportados en `@pathfinder/contracts`.
- [x] `ContextAnalyzerProvider` implementado con soporte tanto para `BedrockContextAnalyzer` como para `HeuristicContextAnalyzer` (offline).
- [x] La extracción identifica correctamente tecnologías, nivel estimado y brechas categorizadas (`critical`, `important`, `nice-to-have`).
- [x] Handler `POST /v1/context/analyze` implementado en `services/api` con validación defensiva de entrada y códigos HTTP estándar.
- [x] Suite de pruebas con Vitest cubriendo análisis exitoso, escenarios offline y validación de errores con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` validando compatibilidad entre contratos, domain y handlers.
- Ejecutar `pnpm test` verificando la cobertura de análisis de contexto y validación de esquemas.
- Ejecutar `pnpm lint` confirmando cero advertencias.

## Learning

- Desacoplar la inferencia de IA mediante la interfaz `ContextAnalyzerProvider` permite que el entorno de desarrollo y la suite de CI funcionen de forma determinística y veloz utilizando `HeuristicContextAnalyzer` sin incurrir en costos de tokens de Bedrock ni requerir credenciales de AWS activas.
- La validación defensiva en la capa de contratos (`validateAnalyzeContextRequest`) protege al backend de payloads sobredimensionados (límite de 5,000 caracteres) antes de iniciar cualquier procesamiento de IA.
- La salida estructurada (`KnowledgeProfile` y `KnowledgeGaps`) sienta la base exacta para que los siguientes Work Items (`WI-CANDIDATE-002` y `WI-CANDIDATE-003`) puedan filtrar y ranquear las sesiones del catálogo de AWS re:Invent con explicabilidad.
