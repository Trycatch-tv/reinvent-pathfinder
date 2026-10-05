---
type: feature
id: WI-004
title: >-
  events-client: adapter base de AWS Events REST API (catálogo + paginación +
  normalización)
knowledge_level: K3
status: completed
completed_at: '2026-10-05'
phase: now
initiative: INI-002
domains:
  - aws-events
  - integration
code:
  - packages/events-client/**
created_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-002
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-05'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - .kaddo/context-pack.json
        - >-
          knowledge/delivery/initiatives/INI-001-fundaci-n-t-cnica-del-monorepo.md
        - knowledge/delivery/initiatives/INI-002-integraci-n-con-aws-events.md
        - package.json
        - packages/events-client/package.json
        - packages/events-client/src/index.ts
        - packages/events-client/tsconfig.json
        - pnpm-lock.yaml
        - tsconfig.base.json
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-05'
---

# events-client: adapter base de AWS Events REST API (catálogo + paginación + normalización)

> Materialized from Initiative INI-002, candidate WI-CANDIDATE-001.

## Outcome

- **Actor:** servicios de backend (`services/api`), agentes de IA (`ai/agents`) y pipelines de ingesta semántica (`ai/knowledge`).
- **Current behavior:** `packages/events-client` es un placeholder sin implementación. No existe cliente HTTP para consultar la API de eventos de AWS re:Invent, ni lógica de paginación, normalización de sesiones a las entidades de `@pathfinder/domain`, ni manejo de resiliencia frente a límites de tasa (429) o fallos de red.
- **Target behavior:** `packages/events-client` provee un adapter TypeScript robusto (`AwsEventsClient`) que encapsula la interacción con la REST API de AWS Events para catálogo público de sesiones, soporta paginación iterativa/asíncrona, normaliza los datos crudos a la entidad `SessionCandidate` de `@pathfinder/domain`, maneja reintentos con backoff exponencial ante respuestas `429/5xx` y ofrece soporte para fixtures/mocks en entornos sin conexión.
- **Observable completion:** `packages/events-client` compila con `tsc -b`, exporta el cliente y normalizadores, y cuenta con un suite exhaustivo de tests unitarios con Vitest que valida paginación, normalización y resiliencia ante errores simulados.

## Journey reconstruction

Flujo de consulta y consumo del catálogo:

```text
Llamada al cliente: client.fetchCatalog(params)
       ↓
Solicitud HTTP con headers, timeout y paginación
       ↓
Intercepción de resiliencia (retry con backoff en 429/5xx)
       ↓
Recepción de RawAwsCatalogResponse
       ↓
Normalizador: normalizeAwsSession(raw) → SessionCandidate (de @pathfinder/domain)
       ↓
Retorno tipado de sesiones normalizadas para cache / Bedrock KB / recomendaciones
```

## Problem

La API de AWS Events es la fuente de verdad del catálogo oficial de re:Invent (sesiones, horarios, salas, niveles y formatos). Sin un adapter desacoplado que normalice los esquemas crudos y proteja el sistema contra throttling (429) y caídas temporales, cada servicio consumidor tendría que reinventar la llamada HTTP y parseo, arriesgando inconsistencias y errores en tiempo de ejecución.

_Expected value:_ Adapter TypeScript que encapsula catalog, paginación, normalización, errores y retry/throttling. Fuente de verdad del catálogo.

## Scope

- Conectar `packages/events-client` con `@pathfinder/domain` como dependencia de workspace (`@pathfinder/domain: workspace:*`).
- Definir interfaces de esquemas crudos de la API de AWS Events (`RawAwsSession`, `RawAwsCatalogResponse`, etc.).
- Implementar normalizador puro (`normalizeAwsSession`) que transforme el esquema crudo en `SessionCandidate`, manejando campos opcionales ausentes de forma segura.
- Implementar el cliente `AwsEventsClient` con soporte para:
  - Obtención de páginas individuales (`fetchCatalogPage`).
  - Iterador paginado completo (`fetchAllSessions` / generador asíncrono con salvaguarda de páginas máximas).
  - Consulta de sesión individual por ID (`fetchSessionById`).
- Implementar política de resiliencia:
  - Reintentos con exponential backoff + jitter ante respuestas HTTP `429` (Rate Limited) y `5xx`.
  - Configuración de reintentos máximos, timeout y headers.
  - Tipos de error estructurados (`AwsEventsApiError`, `AwsEventsThrottlingError`).
- Implementar proveedor de datos simulados (`MockAwsEventsClient` o soporte de fixtures) para pruebas y desarrollo local sin credenciales ni internet.
- Suite de pruebas unitarias en `packages/events-client/src/*.test.ts` con Vitest probando:
  - Normalización correcta de sesiones completas y con campos faltantes.
  - Paginación secuencial con tokens de cursor.
  - Reintento exitoso tras error 429 transitorio.
  - Propagación controlada de error 404 o 500 tras agotar reintentos.

## Out of scope

- Autenticación OAuth 2.0 + PKCE con AWS Builder ID (`WI-CANDIDATE-002`).
- Endpoints de agenda personal (`GetSchedule`), favoritos y reservas (`WI-CANDIDATE-003`).
- Ingesta semántica a Amazon Bedrock Managed Knowledge Bases (`INI-003`).
- Almacenamiento en caché de DynamoDB (`packages/data`).

## Surface review

- **Product/UI:** not-applicable (componente de integración backend/librería).
- **Frontend:** reviewed-not-affected.
- **Backend:** affected — `services/api` usará este cliente para proxy/catálogo.
- **AI/Agentic:** affected — `ai/knowledge` usará este cliente para alimentar las Knowledge Bases de Bedrock.
- **Shared packages:** affected — `packages/events-client` y dependencia con `packages/domain`.
- **Configuration:** affected — `package.json` y `tsconfig.json` de `packages/events-client`.
- **Database / Auth / Analytics:** not-applicable.
- **Operations/release:** reviewed-not-affected.

## Acceptance Criteria

- [x] `packages/events-client` depende de `@pathfinder/domain` y compila con `tsc -b`.
- [x] Define tipos de datos crudos (`RawAwsSession`, `RawAwsCatalogResponse`) basados en la API pública de AWS Events.
- [x] Función pura `normalizeAwsSession` transforma datos crudos a `SessionCandidate` mapeando correctamente nivel (100-400), formato, fecha, venue y room.
- [x] `AwsEventsClient` soporta paginación por cursor y maneja obtención completa con límite de páginas configurable.
- [x] El cliente gestiona resiliencia con backoff exponencial ante errores `429` y fallos `5xx`.
- [x] Existe modo o cliente mock con fixtures para permitir desarrollo y tests offline sin llamadas reales a la API.
- [x] Suite de pruebas con Vitest en `packages/events-client` con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` para verificar resolución de referencias TypeScript entre `events-client` y `domain`.
- Ejecutar `pnpm test` verificando que pasen las pruebas de normalización, paginación, mock provider y reintentos 429.
- Ejecutar `pnpm lint` verificando ausencia de errores de linter.

## Learning

Se implementó el adapter de AWS Events REST API en `packages/events-client` con soporte para paginación por cursor e iteración completa. Se creó la función normalizadora pura `normalizeAwsSession` que transforma el esquema crudo en `SessionCandidate` de `@pathfinder/domain`. Se integró una política de resiliencia con exponential backoff + jitter para errores 429 (throttling) y 5xx, así como modo mock con fixtures realistas de re:Invent para desarrollo y tests offline. Se cubrieron 10 pruebas unitarias con Vitest pasando al 100%.
