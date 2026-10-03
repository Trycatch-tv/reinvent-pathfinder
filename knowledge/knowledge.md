---
type: current-state
updated_at: 2026-10-03
---

# pathfinder — Knowledge

> What is true about this product right now.

## Purpose

**re:Invent Pathfinder** es un companion basado en IA que transforma el catálogo de AWS re:Invent en una ruta de aprendizaje personalizada y adaptativa.

En lugar de partir de filtros, roles o palabras clave como los planners tradicionales, Pathfinder parte de una pregunta distinta: **¿qué estás construyendo?**. A partir de esa respuesta infiere tecnologías, dominios, AWS services y retos de arquitectura, construye un `Knowledge Profile`, detecta `Knowledge Gaps`, consulta el catálogo real de AWS Events y recomienda sesiones que puedan cerrar esos gaps con una explicación de por qué son relevantes.

El ciclo no termina en la agenda inicial: tras asistir a una sesión el usuario registra una reflexión (qué aprendió, qué sigue sin tener claro, qué tan útil fue) y Pathfinder actualiza el perfil de conocimiento y adapta las siguientes recomendaciones.

Sirve a asistentes de AWS re:Invent con un objetivo técnico concreto (developers, architects, cloud/DevOps/platform engineers, AI/ML builders, líderes técnicos). Como actores secundarios participan contribuidores open source, la comunidad de TryCatch.tv y los maintainers del proyecto.

El proyecto también funciona como caso real de Knowledge-Driven Development (KDD) usando Kaddo, Kiro y contribución abierta de la comunidad, y como propuesta para el re:Invent Event Catalog API Hackathon.

## Architecture overview

Arquitectura serverless con TypeScript como lenguaje principal, organizada como monorepo con cuatro bloques principales:

- **`apps/client`** — Experiencia local-first (React + Vite + TypeScript). Captura de contexto, visualización de Knowledge Profile, Knowledge Gaps, Learning Path, agenda y reflexión. Maneja OAuth 2.0 + PKCE contra AWS Events con tokens solo en memoria.
- **`services/api`** — Backend serverless tradicional (API Gateway + AWS Lambda + DynamoDB), desplegado con Serverless Framework. Expone endpoints de Pathfinder, validación, persistencia operacional y coordinación con el bloque de IA.
- **`ai`** — Bloque agentic (Strands Agents SDK + Amazon Bedrock AgentCore Runtime + modelos de Amazon Bedrock + Managed Knowledge Bases). Interpreta contexto, genera/actualiza el perfil de conocimiento, detecta gaps, recupera conocimiento semántico, hace ranking y explica recomendaciones. Topología objetivo pequeña (1–3 agentes).
- **`packages`** — Código compartido: `domain` (modelo de dominio independiente de AWS), `events-client` (adapter de AWS Events REST API, fuente de verdad del catálogo/agenda), `data` (repositorios DynamoDB), `contracts` (DTOs/schemas) y `shared`.

Flujo de recomendación costo-consciente: primero filtros determinísticos para reducir el espacio de búsqueda, luego recuperación semántica (Managed Knowledge Bases) y ranking contextual con Bedrock.

## Key domains

Conceptos de dominio principales (ver `packages/domain`):

- `AttendeeJourney` — el recorrido del asistente a lo largo del evento.
- `ProjectContext` — qué está construyendo el usuario.
- `KnowledgeProfile` — representación de lo que el usuario sabe/necesita.
- `KnowledgeGap` — brechas de conocimiento identificadas y priorizadas.
- `SessionCandidate` / `SessionRecommendation` — sesiones candidatas y recomendaciones explicables.
- `LearningPath` — ruta priorizada de aprendizaje.
- `Reflection` — reflexión post-sesión que adapta el journey.
- `ScheduleConflict` — conflictos de agenda detectados contra el schedule personal.

## Active constraints

- **AWS Events API es la fuente de verdad** para catálogo, agenda, favoritos, reservas y personal time.
- **Autenticación** vía OAuth 2.0 Authorization Code + PKCE con AWS Builder ID y callback local (`localhost`); el usuario debe estar registrado en el evento.
- **Seguridad de tokens**: los access/refresh tokens de AWS Events no se persisten de forma insegura ni se envían al backend de Pathfinder.
- **Minimización de datos**: no registrar tokens, authorization codes ni secretos; no enviar a los modelos más contexto del necesario; el conocimiento privado del proyecto del usuario no se vuelve público automáticamente.
- **Costo-consciencia**: filtros determinísticos antes del ranking semántico; observabilidad, límites de consumo y alertas de costo desde las primeras versiones.
- **Alcance**: priorizar el ciclo de valor (contexto → gaps → recomendaciones → learning path → reflexión → adaptación); evitar convertirlo en agenda genérica o chatbot generalista; evitar infraestructura sin valor probado.
- **Stack**: TypeScript, serverless, DynamoDB para persistencia central, Serverless Framework para infra tradicional (IaC del bloque agentic por definir).
- **Desarrollo**: open source y en público, con trazabilidad entre capacidades, componentes, Vertical Slices, Work Items y cambios de código.
