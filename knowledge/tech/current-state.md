---
type: current-state
project_state: new
generated_by: kaddo-bootstrap
template_version: 1
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Current State

## Initial technical direction

El proyecto está en estado `new`: no existe todavía estructura de producción consolidada; lo descrito es la intención arquitectónica inicial y debe evolucionar solo cuando aparezcan límites reales en el código.

- **Lenguaje y organización**: TypeScript como lenguaje principal, monorepo con `pnpm` (`pnpm-workspace.yaml`).
- **Arquitectura serverless** en AWS, con cuatro bloques:
  - `apps/client` — experiencia local-first (React + Vite + TypeScript), OAuth 2.0 + PKCE con tokens solo en memoria.
  - `services/api` — backend serverless (API Gateway + AWS Lambda + Amazon DynamoDB), IaC con Serverless Framework.
  - `ai` — bloque agentic con Strands Agents SDK, Amazon Bedrock AgentCore Runtime, modelos de Amazon Bedrock y Managed Knowledge Bases.
  - `packages` — `domain`, `events-client` (adapter de AWS Events REST API), `data` (repositorios DynamoDB), `contracts`, `shared`.
- **Fuente de verdad**: AWS Events API para catálogo, agenda, favoritos, reservas y personal time. La Managed Knowledge Base es una representación optimizada para recuperación semántica, no la fuente de verdad.
- **Flujo de recomendación costo-consciente**: filtros determinísticos → recuperación semántica (Managed KB) → ranking contextual con Bedrock.
- **Endpoints iniciales esperados** (contratos aún no estables): `GET /health`, `POST /v1/context/analyze`, `POST /v1/recommendations/rank`, `POST /v1/journey/adapt`.
- **Entry points previstos**: `apps/client/src/main.tsx`, handlers bajo `services/api/src/handlers/`, agentes bajo `ai/agents/`.
- **Topología de agentes**: pequeña para el MVP (1–3 agentes con tools explícitas), evitando un agente por función.
- **Testing**: Vitest (unit), fixtures/MSW/mocks y AWS test resources (integration), Playwright (E2E). CI en PRs: install, lint, typecheck, unit, integration, build, validación de infraestructura.
- **Experiencia de desarrollo objetivo**: `pnpm install` + `pnpm dev`, permitiendo trabajar con fixtures/mocks/contratos/UI/dominio/tests sin desplegar AWS ni ejecutar `serverless login`.

## Known constraints

- AWS Events API es la fuente de verdad; operaciones como reservas dependen de sus ventanas de disponibilidad.
- Autenticación OAuth 2.0 Authorization Code + PKCE con AWS Builder ID y callback local (`localhost`); el usuario debe estar registrado en el evento.
- Los access/refresh tokens de AWS Events no se persisten de forma insegura ni se envían al backend de Pathfinder.
- Minimización de datos: no registrar tokens/authorization codes/secretos; no enviar a los modelos más contexto del necesario; el conocimiento privado del proyecto del usuario no se vuelve público automáticamente.
- Costo-consciencia: filtros determinísticos antes del ranking semántico; observabilidad, límites de consumo y alertas de costo desde las primeras versiones.
- Infra tradicional con Serverless Framework; IaC del bloque agentic por definir. El deployment debe ocurrir desde pipeline, sin credenciales permanentes almacenadas localmente.
- Evitar infraestructura sin valor probado (no EKS/ECS/EC2/RDS/OpenSearch ni base vectorial autogestionada sin necesidad comprobada).

## Unknowns

Preguntas técnicas abiertas (heredadas del codebase map; se resuelven con revisión humana, no por defecto):

- [open] **Topología de agentes.** Un único `Pathfinder Agent` vs. agrupación de máximo tres agentes (p. ej. `Knowledge Agent`, `Recommendation/Journey Agent`, `Event Experience Agent`).
- [open] **IaC del bloque agentic.** Si `Amazon Bedrock AgentCore` se despliega con `agentcore deploy`, CDK, SAM o una combinación.
- [open] **Límite entre Lambda y AgentCore.** Qué operaciones viven en `services/api` y cuáles dentro del agent runtime.
- [open] **Autenticación del backend de Pathfinder.** Cómo proteger endpoints con costo de Bedrock sin reutilizar indebidamente el access token de AWS Events.
- [open] **Modelo de identidad.** Cómo correlacionar un journey persistido en DynamoDB con un usuario sin aumentar el alcance de autenticación.
- [open] **Modelo DynamoDB.** Partition/sort keys y single-table vs. tablas separadas.
- [open] **Persistencia del catálogo.** Qué vive en cache local, qué en DynamoDB y qué solo en Managed Knowledge Bases.
- [open] **Ingesta de Managed Knowledge Bases.** Formato de documentos, metadata, frecuencia y mecanismo de sincronización desde AWS Events API.
- [open] **Candidate Filtering vs. semantic retrieval.** Orden y señales para combinar filtros determinísticos, KB retrieval y ranking de Bedrock.
- [open] **Modelo Bedrock.** Selección inicial por calidad/latencia/costo, manteniéndolo configurable.
- [open] **Distribución local.** `pnpm dev`, launcher `npx reinvent-pathfinder` o app desktop.
- [open] **Public site.** `apps/site` como app separada o vista pública dentro del frontend.
- [open] **Retención de datos.** Tiempo de conservación de journeys, profiles, reflections y recommendations.
- [open] **Observabilidad de producto.** Eventos permitidos sin registrar información privada del proyecto del usuario.
- [open] **Optimización logística.** Si los datos de venue permiten una señal útil de desplazamiento.
- [open] **Learning Report.** Si entra en el MVP del hackathon o queda como extensión post-evento.
