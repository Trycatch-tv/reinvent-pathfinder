---
type: codebase
project_state: new
generated_by: kaddo-bootstrap
template_version: 1
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Codebase Map

## Repository structure

El proyecto está en estado `new`: todavía no existe una estructura de producción consolidada. La siguiente estructura representa la **intención arquitectónica inicial** y debe evolucionar únicamente cuando aparezcan límites reales en el código.

```text
reinvent-pathfinder/
│
├── apps/
│   ├── client/                    # React + Vite + TypeScript
│   │                              # Experiencia local-first del asistente
│   └── site/                      # Sitio/demo público para Builder Center
│
├── services/
│   └── api/                       # API serverless tradicional
│       ├── src/
│       │   ├── handlers/
│       │   ├── application/
│       │   └── adapters/
│       └── serverless.yml
│
├── ai/
│   ├── agents/                    # Agentes Strands
│   ├── tools/                     # Tools expuestas a los agentes
│   ├── knowledge/                 # Ingesta / acceso a Managed KB
│   └── contracts/                 # Schemas de entradas/salidas agentic
│
├── packages/
│   ├── domain/                    # Journey, KnowledgeProfile, Gaps, Recommendations
│   ├── events-client/             # Adapter TypeScript para AWS Events REST API
│   ├── data/                      # Repositories / contratos DynamoDB
│   ├── contracts/                 # DTOs y schemas compartidos
│   └── shared/                    # Solo utilidades realmente compartidas
│
├── infra/
│   ├── serverless/                # Infra de aplicación tradicional
│   └── agentic/                   # IaC / deployment del bloque AI-AgentCore
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   └── technical-brief.md
│
├── knowledge/                     # Knowledge base de Kaddo
├── .kaddo/
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
├── package.json
└── pnpm-workspace.yaml
```

### Límites principales

#### `apps/client`

Cliente local-first encargado de:

- `Project Context UI`;
- OAuth 2.0 + PKCE para AWS Events;
- manejo en memoria de tokens;
- consumo directo de AWS Events cuando corresponda;
- visualización del `Knowledge Profile`;
- `Learning Path`;
- agenda;
- reflexión post-sesión;
- coordinación del journey del usuario.

Tecnología base:

```text
React
Vite
TypeScript
```

#### `services/api`

Backend serverless tradicional.

Responsabilidades esperadas:

- exponer endpoints propios de Pathfinder;
- validación de requests;
- acceso a DynamoDB;
- integración de servicios no agentic;
- coordinación con el bloque de IA cuando corresponda;
- métricas técnicas y manejo de errores.

Infraestructura:

```text
API Gateway
AWS Lambda
Amazon DynamoDB
IAM
CloudWatch
```

IaC:

```text
Serverless Framework
```

#### `ai`

Bloque de inteligencia y agentes.

Tecnología base:

```text
Strands Agents SDK
Amazon Bedrock AgentCore Runtime
Amazon Bedrock
Amazon Bedrock Managed Knowledge Bases
```

Responsabilidades esperadas:

- interpretar el contexto del proyecto;
- generar/actualizar `Knowledge Profile`;
- identificar `Knowledge Gaps`;
- recuperar conocimiento semántico de sesiones;
- realizar ranking semántico;
- explicar recomendaciones;
- construir/adaptar el Learning Path.

El MVP no debe crear un agente independiente por cada función. La topología objetivo será pequeña, idealmente entre uno y tres agentes, con tools explícitas.

#### `packages/events-client`

Adapter TypeScript de AWS Events REST API.

Debe encapsular:

- catalog;
- pagination;
- session normalization;
- `GetSchedule`;
- favorites;
- reservations;
- personal time;
- error normalization;
- retry/throttling behavior.

AWS Events API es la fuente de verdad para información del evento y agenda.

#### `packages/domain`

Dominio independiente de AWS cuando sea razonable.

Conceptos principales:

```text
AttendeeJourney
ProjectContext
KnowledgeProfile
KnowledgeGap
SessionCandidate
SessionRecommendation
LearningPath
Reflection
ScheduleConflict
```

#### `packages/data`

Abstracciones de persistencia operacional.

Backend principal:

```text
Amazon DynamoDB
```

Datos potenciales:

- journey;
- knowledge profiles;
- knowledge gaps;
- reflections;
- recommendations;
- estado de ingestión;
- cache operacional del catálogo si se decide centralizarlo.

DynamoDB no reemplaza la `Managed Knowledge Base`.

#### `ai/knowledge`

Responsable de la representación semántica de conocimiento del catálogo.

Flujo esperado:

```text
AWS Events API
      ↓
Catalog Ingestion
      ↓
Normalized session documents
      ↓
Amazon Bedrock Managed Knowledge Bases
      ↓
Semantic retrieval
      ↓
Agent / Recommendation Tool
```

La `Managed Knowledge Base` es una representación optimizada para recuperación semántica; AWS Events API sigue siendo la fuente de verdad del catálogo.

## Entry points

Los entry points definitivos se crearán durante el bootstrap técnico. La intención inicial es:

### Client

```text
apps/client/src/main.tsx
```

Responsable de iniciar la experiencia local-first.

### Pathfinder API

Handlers bajo:

```text
services/api/src/handlers/
```

Endpoints iniciales esperados:

```text
GET  /health

POST /v1/context/analyze
POST /v1/recommendations/rank
POST /v1/journey/adapt
```

Los contratos exactos se definirán mediante schemas versionados antes de considerarlos estables.

### Agentic runtime

Entry point esperado bajo:

```text
ai/agents/
```

La topología exacta sigue abierta. Las responsabilidades mínimas deben cubrir:

```text
analyzeProjectContext()
retrieveSessionKnowledge()
findKnowledgeGaps()
rankSessions()
buildLearningPath()
getSchedule()
manageFavorites()
reserveSession()
adaptJourney()
```

Estas responsabilidades pueden agruparse en máximo tres agentes para el MVP, en lugar de crear un agente por operación.

### Infrastructure

Aplicación tradicional:

```text
services/api/serverless.yml
```

o estructura equivalente bajo:

```text
infra/serverless/
```

Bloque agentic:

```text
infra/agentic/
```

El mecanismo final puede combinar `agentcore deploy` con IaC específico para recursos complementarios.

## How to run

Aún no existen comandos de producción definitivos.

La experiencia objetivo de desarrollo es:

```bash
pnpm install
pnpm dev
```

y debe permitir levantar localmente las partes que no requieren infraestructura real.

### Desarrollo local sin AWS

Un contribuidor normal debe poder trabajar con:

- fixtures;
- mocks;
- contratos;
- UI;
- dominio;
- tests;

sin necesidad de desplegar recursos AWS ni ejecutar `serverless login`.

### Desarrollo con infraestructura AWS

Para trabajo sobre el backend serverless:

```text
Serverless Framework authentication
+
AWS credentials / SSO
```

El deployment esperado será equivalente a:

```bash
serverless deploy --stage dev
```

### Desarrollo del bloque agentic

Se definirá un flujo reproducible para:

```text
Strands Agents
AgentCore local/dev
AgentCore deployment
Managed Knowledge Base
Bedrock models
```

Los comandos concretos se documentarán cuando el primer Vertical Slice agentic sea implementado.

### AWS Events authentication

La experiencia autenticada debe ejecutarse desde un callback local compatible con OAuth 2.0 + PKCE.

Los access/refresh tokens no deben almacenarse de forma persistente ni enviarse al backend de Pathfinder.

## How to test

La estrategia inicial tendrá varias capas.

### Unit tests

Para:

- dominio;
- scoring determinístico;
- Knowledge Gap transitions;
- session normalization;
- request validation;
- mappers;
- repositories.

Herramienta propuesta:

```text
Vitest
```

### Integration tests

Para:

- AWS Events adapter con fixtures/mocks;
- DynamoDB repositories;
- handlers Lambda;
- Bedrock adapters;
- tools de Strands;
- contratos entre API y agentes.

Cuando sea útil se usarán:

```text
MSW
local mocks
AWS test resources
```

### E2E

Para journeys críticos:

```text
Project Context
→ Knowledge Profile
→ Knowledge Gaps
→ Recommendations
→ Learning Path
```

y posteriormente:

```text
Reflection
→ Knowledge changes
→ Recommendation adaptation
```

Herramienta propuesta:

```text
Playwright
```

### Casos de resiliencia obligatorios

Se deben cubrir al menos:

- AWS Events pagination;
- `401`;
- `403`;
- `409`;
- `429` + retry;
- campos opcionales ausentes;
- partial success en favorites/reservations;
- fallos de Bedrock;
- respuestas AI inválidas;
- fallos de DynamoDB;
- ausencia de resultados relevantes.

### CI

En Pull Requests se espera ejecutar:

```text
install
lint
typecheck
unit tests
integration tests
build
infrastructure validation
```

El deployment debe ocurrir desde pipeline y no depender de credenciales permanentes almacenadas localmente.

## Open questions

- [open] **Topología de agentes.** Definir si el MVP tendrá un único `Pathfinder Agent` o una agrupación de máximo tres agentes. Evitar un agente por capacidad.
- [open] **Agrupación propuesta de agentes.** Evaluar una división como `Knowledge Agent`, `Recommendation/Journey Agent` y `Event Experience Agent`.
- [open] **IaC del bloque agentic.** Confirmar si `Amazon Bedrock AgentCore` se desplegará principalmente mediante `agentcore deploy`, CDK, SAM o una combinación. El bloque tradicional continuará con Serverless Framework.
- [open] **Límite entre Lambda y AgentCore.** Definir qué operaciones pertenecen a `services/api` y cuáles se ejecutan directamente dentro del agent runtime.
- [open] **Autenticación del backend de Pathfinder.** Definir cómo proteger endpoints con costo de Bedrock sin reutilizar indebidamente el access token de AWS Events.
- [open] **Modelo de identidad.** Definir cómo correlacionar un journey persistido en DynamoDB con un usuario sin aumentar innecesariamente el alcance de autenticación.
- [open] **Modelo DynamoDB.** Definir partition/sort keys y si se utilizará single-table design o tablas separadas.
- [open] **Persistencia del catálogo.** Definir qué parte del catálogo vive únicamente en cache local, qué parte se almacena en DynamoDB y qué parte solo se representa en Managed Knowledge Bases.
- [open] **Ingesta de Managed Knowledge Bases.** Definir formato de documentos, metadata, frecuencia de sincronización y mecanismo de actualización desde AWS Events API.
- [open] **Candidate Filtering vs semantic retrieval.** Definir en qué orden y con qué señales se combinan filtros determinísticos, KB retrieval y ranking de Bedrock.
- [open] **Modelo Bedrock.** Seleccionar el modelo inicial con base en calidad, latencia y costo; mantenerlo configurable.
- [open] **Distribución local.** Definir si el MVP se ejecutará con `pnpm dev`, un launcher tipo `npx reinvent-pathfinder`, o una app desktop.
- [open] **Public site.** Definir si `apps/site` será una aplicación separada o una vista pública dentro del mismo frontend.
- [open] **Retención de datos.** Definir cuánto tiempo se conservarán journeys, profiles, reflections y recommendations.
- [open] **Observabilidad de producto.** Definir eventos permitidos sin registrar información privada del proyecto del usuario.
- [open] **Optimización logística.** Validar si los datos de venue disponibles permiten calcular una señal útil de desplazamiento.
- [open] **Learning Report.** Definir si entra en el MVP del hackathon o queda como extensión post-event.
