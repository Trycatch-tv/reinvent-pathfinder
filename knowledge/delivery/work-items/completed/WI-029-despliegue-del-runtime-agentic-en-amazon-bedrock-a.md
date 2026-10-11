---
type: feature
id: WI-029
title: Despliegue del runtime agentic en Amazon Bedrock AgentCore
knowledge_level: K3
status: completed
phase: now
completed_at: '2026-10-10'
initiative: INI-006
domains:
  - ai
  - tech
related_domain: Tech
related_capabilities:
  - context-analysis
  - session-recommendations
code:
  - ai/agents/package.json
  - ai/agents/src/knowledge-agent.ts
  - ai/agents/src/journey-recommendation-agent.ts
  - ai/agents/src/agentcore-runtime.ts
  - ai/agents/src/agents.test.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
created_at: '2026-10-10'
source: initiative
source_id: WI-CANDIDATE-003
source_initiative: INI-006
generated_by: kaddo-create
template_version: 1
ready_at: '2026-10-10'
---

# Despliegue del runtime agentic en Amazon Bedrock AgentCore

> Materialized from Initiative INI-006, candidate WI-CANDIDATE-003.

## Problem

Actualmente `KnowledgeAgent` y `JourneyRecommendationAgent` en `ai/agents` son runners estáticos de pasos predefinidos que reportan `modelId: 'agentcore-runtime-offline-v1'` sin capacidad de conectarse al runtime administrado de Amazon Bedrock Agents (`InvokeAgentCommand`) ni de exportar sus especificaciones de Action Groups para despliegue en AWS Bedrock AgentCore.

## Actor and Outcome

Como servicio central o usuario de la plataforma, puedo ejecutar los agentes tanto contra un Bedrock Agent desplegado en AWS (vía Bedrock Agent Runtime con streaming o captura de traces) como en modo local-first offline mediante herramientas de `@pathfinder/ai-tools`, con interoperabilidad completa y esquemas de Action Groups preparados para despliegue en la nube.

## Current and Target State

- **Current behavior**:
  - Los agentes ejecutan llamadas fijas a herramientas locales y siempre retornan `modelId: 'agentcore-runtime-offline-v1'`.
  - `@aws-sdk/client-bedrock-agent-runtime` no está en `ai/agents`.
- **Target behavior**:
  - `ai/agents` incluye `@aws-sdk/client-bedrock-agent-runtime`.
  - Se implementa `BedrockAgentCoreClient` que permite invocar agentes administrados de Amazon Bedrock mediante `InvokeAgentCommand`, procesando eventos de stream y mapeando trazas a `AgentRunStep[]`.
  - `KnowledgeAgent` y `JourneyRecommendationAgent` admiten configuración para runtime real de Bedrock (`bedrockAgentId`, `agentAliasId`, `region` o cliente inyectado).
  - Si el agente remoto de Bedrock está configurado y responde, se devuelven los resultados enriquecidos con su `modelId` real (`bedrock-agentcore-...`).
  - Ante ausencia de credenciales, fallos de red o errores de AWS, se activa la degradación automática e inmediata al orquestador local con herramientas de `@pathfinder/ai-tools`.
  - Se proporciona un generador de esquemas de Action Groups (`exportActionGroupDefinitions`) que mapea las herramientas a la especificación estándar de Bedrock Action Groups.
  - La suite de pruebas unitarias (`ai/agents/src/agents.test.ts`) verifica la invocación con cliente simulado (mock) y la degradación resiliente, ejecutándose 100% offline.

## Entry Points and Journey

- **Entry points**:
  - `KnowledgeAgent.run(options)`
  - `JourneyRecommendationAgent.run(options)`
  - `exportActionGroupDefinitions()` para exportar herramientas a especificaciones de Bedrock Action Groups.
- **End-to-end flow**:
  1. La aplicación invoca el método `run()` de un agente con un prompt y variables de contexto.
  2. Si `bedrockAgentId` está configurado y el cliente Bedrock Agent Runtime está activo, envía `InvokeAgentCommand`.
  3. Procesa los chunks del stream de respuesta y reconstruye el texto de salida y pasos ejecutados.
  4. Si ocurre cualquier error o no hay configuración remota de Bedrock, ejecuta el pipeline de herramientas local con `@pathfinder/ai-tools`.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| AI / Agents (`ai/agents`) | Affected: integración del cliente Bedrock Agent Runtime (`InvokeAgentCommand`), soporte para agentIds remotos, fallback local defensivo y exportación de Action Groups. |
| AI / Tools (`ai/tools`) | Reviewed, not changed: las herramientas existentes se consumen en el pipeline local y sus definiciones se proyectan a Action Groups. |
| AI / Contracts (`ai/contracts`) | Reviewed, not changed: `AgentRunOptions`, `AgentRunResponse` y `AgentRunStep` ya contemplan los campos necesarios. |

## Acceptance Criteria

- [x] `ai/agents` incluye `@aws-sdk/client-bedrock-agent-runtime` en sus dependencias.
- [x] `KnowledgeAgent` y `JourneyRecommendationAgent` aceptan configuración de Bedrock AgentCore (`bedrockAgentId`, `agentAliasId`, `region` y cliente inyectable).
- [x] Cuando `bedrockAgentId` está configurado y el cliente está disponible, `run()` invoca `InvokeAgentCommand` de Bedrock Agent Runtime y procesa el resultado.
- [x] Ante excepciones de red, falta de permisos o cuotas excedidas en AWS, los agentes degradan automáticamente a su ejecución local con herramientas sin arrojar errores no controlados.
- [x] Se incluye la utilidad `exportActionGroupDefinitions` que transforma las herramientas de `@pathfinder/ai-tools` a definiciones estándar de Action Groups para Bedrock AgentCore.
- [x] La suite de pruebas unitarias en `ai/agents/src/agents.test.ts` verifica tanto el flujo con cliente Bedrock simulado (mock) como el flujo de degradación offline sin requerir credenciales de AWS.
- [x] `pnpm test`, `pnpm typecheck` y `pnpm lint` pasan con 0 errores.

## Out of Scope

- Despliegue automatizado de infraestructura CloudFormation/Terraform para los agentes (cubierto en despliegue de infraestructura).
- Integración de autenticación de usuario final en el endpoint de inferencia (cubierto en WI-CANDIDATE-004).

## Validation

```bash
pnpm --filter @pathfinder/ai-agents test
pnpm test
pnpm typecheck
pnpm lint
```

## Definition of Done

- SDK integrado en `ai/agents`.
- Soporte para invocación real de Bedrock AgentCore y degradación transparente a herramientas locales.
- Pruebas unitarias cubriendo escenarios con mock y fallback offline.
- 100% de tests en verde en CI.

## Learning

1. **Protocolo de Streaming y EventStream en Bedrock AgentCore**: `InvokeAgentCommand` entrega respuestas asíncronas vía chunks de bytes (`completion`) y eventos de trace. Decodificar dinámicamente el stream permite soportar tanto respuestas completas como agentes con razonamiento iterativo multi-paso.
2. **Proyección de Herramientas a Action Groups**: Mediante `exportActionGroupDefinitions`, las herramientas nativas de `@pathfinder/ai-tools` generan directamente la especificación JSON de funciones y parámetros de Bedrock Action Groups, simplificando la sincronización entre el código TypeScript y la definición de agentes en AWS.
3. **Resiliencia de Dos Niveles en Agentes**: Los agentes operan en una arquitectura híbrida donde la nube (`InvokeAgentCommand`) provee razonamiento adaptativo administrado cuando está disponible, mientras que el pipeline local con `ai/tools` garantiza funcionamiento offline ininterrumpido en desarrollo y CI.

