---
type: capabilities
project_state: ai-assisted
generated_by: kaddo-bootstrap
template_version: 1
refined_by: capability-agent
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Capabilities

Inventario de capacidades orientado a dominios, basado en evidencia real del repositorio (no en
intención). Cada capacidad declara un `Status`; `implemented` solo se usa con evidencia concreta de
path/función/test. La capa de IA real (Amazon Bedrock / Strands / AgentCore) **no está implementada**
y se marca como `unknown`/planificada (pertenece a INI-006).

## Summary

El ciclo de valor del producto (Journeys 1-6) está implementado end-to-end en modo **local-first /
heurístico** y desplegado públicamente en Netlify. Lo que recomienda y adapta no usa modelos de IA
externos: usa analizadores y rerankers heurísticos en `ai/knowledge`. La integración live con AWS
Events (catálogo, disponibilidad, agenda, favoritos, reservas) y la autenticación Builder ID
(OAuth 2.0 + PKCE) están implementadas en el cliente.

## Capability map

Encadenamiento real de las capacidades implementadas (todas local-first salvo la integración live):

```text
Captura de contexto (ContextForm)
        ↓
Knowledge Profile ──► Knowledge Gaps          [ai/knowledge: HeuristicContextAnalyzer]
        ↓
Candidate filtering + ranking explicable       [ai/knowledge: candidate-filter + HeuristicSessionReranker]
        ↓
Learning Path ◄──► Integración live AWS Events  [events-client: catálogo, agenda, favoritos, reservas]
        ↓            (conflictos, disponibilidad)   (requiere VITE_AWS_EVENT_ID + Builder ID)
Reflexión post-sesión (ReflectionForm)
        ↓
Adaptación de recomendaciones  ──►  (repite el ciclo)   [adaptLearningPathFromReflection]
        ↓
Cierre de ciclo: Learning Report                [buildLearningReport → LearningReportView]
```

Exposición pública: la landing (`/about`) y la demo (`/availability`, modo fixture) dan acceso al
ciclo sin login; las operaciones autenticadas de AWS Events quedan fuera de la vista pública.

## Capability Domains

### Domain: Captura de contexto y Knowledge Profile

**Purpose:** convertir "qué estás construyendo" en un perfil de conocimiento y brechas explícitas.

**Evidence summary:**
- `apps/client/src/components/ContextForm.tsx`, `apps/client/src/components/KnowledgeProfileView.tsx`
- `ai/knowledge/src/context-analyzer.ts` (`HeuristicContextAnalyzer`)
- `packages/domain/src/types/**` (`ProjectContext`, `KnowledgeProfile`)
- Tests: `ai/knowledge/src/context-analyzer.test.ts`, `apps/client/src/client.test.ts`

#### Capability: Captura de contexto del proyecto (Journey 1)

- Status: implemented
- Capability type: product
- User-facing: yes
- Evidence: `apps/client/src/components/ContextForm.tsx`, `apps/client/src/App.tsx` (ruta `/`)
- Current behavior: el usuario describe su proyecto/reto; el cliente envía el contexto al analizador.
- Known constraints: ejecución local-first; sin IA externa.
- Open questions:
  - [open] ninguna

#### Capability: Generación del Knowledge Profile y Knowledge Gaps (Journey 1)

- Status: implemented
- Capability type: product
- User-facing: yes
- Evidence: `ai/knowledge/src/context-analyzer.ts` (`HeuristicContextAnalyzer`),
  `apps/client/src/components/KnowledgeGapsList.tsx`
- Related data: `KnowledgeProfile`, `KnowledgeGap` (`packages/domain`)
- Current behavior: deriva perfil y brechas priorizadas por heurística; se visualizan y pueden revisarse.
- Known constraints: inferencia heurística determinística, no semántica.

### Domain: Recomendaciones de sesiones

**Purpose:** priorizar y explicar sesiones del catálogo según las brechas del usuario.

**Evidence summary:**
- `ai/knowledge/src/recommendations/candidate-filter.ts`,
  `ai/knowledge/src/recommendations/session-reranker.ts` (`HeuristicSessionReranker`)
- `packages/domain/src/types/**` (`SessionCandidate`, `SessionRecommendation`)
- Tests: `ai/knowledge/src/recommendations/recommendations.test.ts`

#### Capability: Candidate filtering + ranking explicable (Journey 2)

- Status: implemented
- Capability type: product
- User-facing: yes
- Evidence: `ai/knowledge/src/recommendations/candidate-filter.ts`,
  `ai/knowledge/src/recommendations/session-reranker.ts`
- Current behavior: filtro determinístico seguido de reranking heurístico; cada recomendación
  expone por qué es relevante y qué gap cubre.
- Known constraints: el "ranking contextual con Bedrock" descrito en producto NO está activo; hoy es
  reranking heurístico.
- Open questions:
  - [open] activación del reranking semántico real (INI-006).

### Domain: Learning Path

**Purpose:** construir una ruta priorizada que concilie recomendaciones y agenda.

**Evidence summary:**
- `ai/knowledge/src/index.ts` (`buildLearningPath`)
- `apps/client/src/components/LearningPathView.tsx`
- Tests: `apps/client/src/client.test.ts`, `ai/knowledge` suite

#### Capability: Construcción y visualización del Learning Path (Journey 3)

- Status: implemented
- Capability type: product
- User-facing: yes
- Evidence: `ai/knowledge/src/index.ts` (`buildLearningPath`),
  `apps/client/src/components/LearningPathView.tsx`
- Current behavior: concilia recomendaciones con la agenda de muestra; detecta conflictos; el usuario
  revisa la ruta.
- Known constraints: usa catálogo demo normalizado cuando no hay snapshot live.

### Domain: Reflexión y adaptación

**Purpose:** recalcular la ruta a medida que cambia el conocimiento del usuario.

**Evidence summary:**
- `ai/knowledge/src/index.ts` (`adaptLearningPathFromReflection`)
- `apps/client/src/components/ReflectionForm.tsx`
- `packages/domain` (`Reflection`)

#### Capability: Reflexión post-sesión y re-ranking adaptativo (Journey 5)

- Status: implemented
- Capability type: product
- User-facing: yes
- Evidence: `ai/knowledge/src/index.ts` (`adaptLearningPathFromReflection`),
  `apps/client/src/components/ReflectionForm.tsx`
- Current behavior: registra la reflexión, recalcula gaps/recomendaciones/Learning Path local-first.

### Domain: Cierre de ciclo (Learning Report)

**Purpose:** contrastar el perfil inicial vs. el posterior y proponer ruta post-evento.

**Evidence summary:**
- `ai/knowledge/src/index.ts` (`buildLearningReport`)
- `apps/client/src/components/LearningReportView.tsx`
- Tests: `apps/client/src/client.test.ts`

#### Capability: Learning Report y ruta post-evento (Journey 6)

- Status: implemented
- Capability type: product
- User-facing: yes
- Evidence: `ai/knowledge/src/index.ts` (`buildLearningReport`),
  `apps/client/src/components/LearningReportView.tsx`
- Current behavior: cuenta gaps cubiertos/parciales/pendientes y propone ruta pendiente.
- Known constraints: parte del MVP (decisión confirmada); local-first.

### Domain: Integración live con AWS Events

**Purpose:** usar AWS Events como fuente de verdad para catálogo, disponibilidad, agenda y reservas.

**Evidence summary:**
- `packages/events-client/src/client/aws-events-client.ts` (`AwsEventsClient`)
- `packages/events-client/src/normalizer/**`, `packages/events-client/src/types/**`
- `apps/client/src/components/AvailabilityHeatmap.tsx`, `apps/client/src/App.tsx`
- Tests: `packages/events-client/src/events-client.test.ts` (~102)

#### Capability: Catálogo + disponibilidad normalizada (Journey 2 / 4)

- Status: implemented
- Capability type: integration
- User-facing: yes
- Evidence: `AwsEventsClient` (`ListSessions`, paginación `nextToken`, `seatAvailability`),
  `apps/client/src/components/AvailabilityHeatmap.tsx`
- Current behavior: en live mapea señales explícitas de disponibilidad sin inferir capacidad;
  fallback a fixtures locales sin snapshot. Heat map accesible (color + texto).
- Known constraints: requiere `VITE_AWS_EVENT_ID` + sesión Builder ID para modo live.

#### Capability: Agenda personal, favoritos y reservas (Journey 4)

- Status: implemented
- Capability type: integration
- User-facing: yes
- Evidence: `AwsEventsClient` (`GetSchedule`, favoritos, reserva/cancelación),
  `packages/events-client/src/types/user-schedule.ts`, `apps/client/src/App.tsx`
- Current behavior: reconcilia reservas/favoritos/bloques personales en memoria; las mutaciones se
  confirman releyendo la agenda (sin estado optimista ni persistencia de credenciales).
- Known constraints: depende de ventanas/habilitación de AWS Events; escrituras sin reintento automático.

### Domain: Autenticación AWS Builder ID

**Purpose:** autenticar al asistente sin persistir tokens ni enviarlos al backend.

**Evidence summary:**
- `apps/client/src/auth/builder-id-transaction.ts` + PKCE (Web Crypto API)
- `apps/client/src/components/BuilderIdLogin.tsx`
- Tests: `apps/client/src/client.test.ts`

#### Capability: OAuth 2.0 + PKCE con Builder ID (Journey 4)

- Status: implemented
- Capability type: technical
- User-facing: yes
- Evidence: `apps/client/src/auth/builder-id-transaction.ts`,
  `apps/client/src/components/BuilderIdLogin.tsx`
- Current behavior: flujo Authorization Code + PKCE con callback en `/callback`; tokens solo en
  memoria. PKCE usa Web Crypto API (compatible con navegador).
- Known constraints: no se persisten access/refresh tokens; no se envían al backend de Pathfinder.

### Domain: Exposición pública

**Purpose:** dar cara pública al proyecto y una demo navegable sin login.

**Evidence summary:**
- `apps/client/src/components/LandingView.tsx` (ruta `/about`)
- `apps/client/src/App.tsx` (header + routing), `apps/client/src/fixtures/availability-heatmap.ts`
- `netlify.toml`
- Tests: `apps/client/src/client.test.ts`

#### Capability: Landing pública + demo fixture (Journey 2, acceso público)

- Status: implemented
- Capability type: product
- User-facing: yes
- Evidence: `apps/client/src/components/LandingView.tsx`, ruta `/about` y `/availability` en
  `apps/client/src/App.tsx`, deploy `netlify.toml`
- Current behavior: landing explica producto/ciclo/cómo lanzar local; la demo reutiliza
  `/availability` en modo fixture sin login. No expone operaciones autenticadas.
- Known constraints: `apps/site` quedó descartado como app separada.

### Domain: Fundación técnica y calidad (operacional)

**Purpose:** monorepo reproducible con tipos, tests y CI.

**Evidence summary:**
- `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`, `vitest.config.ts`,
  `eslint.config.mjs`, `.github/workflows/ci.yml`

#### Capability: Monorepo pnpm + project references + CI

- Status: implemented
- Capability type: operational
- User-facing: internal
- Evidence: `pnpm-workspace.yaml`, `tsconfig.json` (project references), `.github/workflows/ci.yml`
- Current behavior: `tsc -b` y `pnpm -r test` verifican todo el monorepo; CI corre en PRs.

### Domain: Capa de IA real (planificada — INI-006)

**Purpose:** sustituir/complementar la heurística con recuperación semántica y razonamiento sobre
Amazon Bedrock.

**Evidence summary:**
- Esqueleto/spike: `ai/agents/src/**`, `ai/tools/src/**`, `ai/contracts/src/**`,
  `ai/knowledge/src/kb/**` (preparación de documentos de sesión).

#### Capability: Recuperación semántica + ranking con Bedrock / runtime agentic

- Status: unknown
- Capability type: technical
- User-facing: no
- Evidence: - pending validation (solo spike/contratos; sin runtime Bedrock/AgentCore activo)
- Current behavior: no implementado; el valor equivalente lo cubre hoy la heurística local-first.
- Open questions:
  - [open] topología de agentes, modelo Bedrock, IaC y límite Lambda ↔ AgentCore (INI-006).

### Domain: Persistencia operacional (parcial)

**Purpose:** persistir journey/perfiles/reflexiones cuando se requiera estado central.

**Evidence summary:**
- `packages/data/src/**` (contratos/repositorios base, sin tests)

#### Capability: Persistencia DynamoDB

- Status: partial
- Capability type: technical
- User-facing: no
- Evidence: `packages/data/src/**`
- Current behavior: existe base de contratos; sin modelo single-table definido ni tests; la
  experiencia actual es local-first en memoria.
- Open questions:
  - [open] partition/sort keys, single-table vs. tablas, retención (TTL).

## Capability Gaps

- [gap] Recuperación semántica y ranking con IA real no implementados.
  - Domain: Capa de IA real (planificada — INI-006)
  - Related capability: Recuperación semántica + ranking con Bedrock / runtime agentic
  - Impact: medium
  - Possible roadmap candidate: yes
- [gap] Persistencia central (DynamoDB) sin modelo ni tests.
  - Domain: Persistencia operacional (parcial)
  - Related capability: Persistencia DynamoDB
  - Impact: low
  - Possible roadmap candidate: yes
- [gap] Despliegue serverless de `services/api` no activo.
  - Domain: Fundación técnica y calidad (operacional)
  - Related capability: Monorepo pnpm + project references + CI
  - Impact: medium
  - Possible roadmap candidate: yes
- [gap] Sin cobertura E2E (Playwright) de los journeys críticos.
  - Domain: Fundación técnica y calidad (operacional)
  - Related capability: Monorepo pnpm + project references + CI
  - Impact: low
  - Possible roadmap candidate: yes

## Roadmap Candidate Signals

- [candidate] Habilitar IA real (Bedrock/Strands/AgentCore) y conmutar heurística ↔ semántica.
  - Domain: Capa de IA real (planificada — INI-006)
  - Related capability: Recuperación semántica + ranking con Bedrock / runtime agentic
  - Based on: gap
- [candidate] Definir y probar el modelo DynamoDB + despliegue serverless de `services/api`.
  - Domain: Persistencia operacional (parcial)
  - Related capability: Persistencia DynamoDB
  - Based on: partial capability
- [candidate] Introducir E2E (Playwright) para el ciclo contexto → Learning Path → reflexión.
  - Domain: Fundación técnica y calidad (operacional)
  - Related capability: Monorepo pnpm + project references + CI
  - Based on: gap

## Open questions

- [open] **IA real (INI-006).** Topología de agentes, modelo Bedrock, IaC y límite Lambda ↔ AgentCore.
- [open] **Persistencia.** Modelo DynamoDB (keys, single-table, retención) cuando se active estado central.
- [open] **Despliegue.** Pipeline y activación del backend serverless de `services/api`.
