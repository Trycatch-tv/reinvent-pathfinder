---
type: feature
id: WI-015
title: Modelo normalizado de disponibilidad de sesiones y fixtures
knowledge_level: K2
status: completed
phase: now
initiative: INI-007
domains:
  - aws-events
  - experience
related_domain: AWS Events
related_capabilities:
  - Ingesta y normalización del catálogo
code:
  - packages/domain/src/types/**
  - packages/domain/src/fixtures/**
  - packages/domain/src/index.ts
  - packages/domain/src/domain.test.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: medium
refined_by: work-item-agent
project_state: ai-assisted
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-007
ready_at: '2026-10-06'
started_at: '2026-10-06'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/domain/src/types/session-availability.ts
        - packages/domain/src/fixtures/session-availability.ts
        - packages/domain/src/index.ts
        - packages/domain/src/domain.test.ts
      validations:
        - command: corepack pnpm --filter @pathfinder/domain test
          status: passed
          reason: >-
            19 pruebas del paquete domain en verde, incluidas las de
            disponibilidad.
        - command: corepack pnpm lint
          status: passed
          reason: ESLint finalizó sin errores.
        - command: corepack pnpm typecheck
          status: passed
          reason: Project references de TypeScript completaron sin errores.
        - command: corepack pnpm test
          status: passed
          reason: 105 pruebas del workspace en verde.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-06'
completed_at: '2026-10-06'
---

# Modelo normalizado de disponibilidad de sesiones y fixtures

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-001. Refinado sin
> iniciar implementación.

## Actor and outcome

Los equipos que construyen la proyección de availability y el heatmap pueden consumir un
contrato TypeScript estable, junto con fixtures deterministas, sin conocer ni depender del
payload de AWS Events.

## Current behavior

`SessionCandidate` contiene metadata de catálogo y `capacityRemaining` opcional, pero no
existe un modelo explícito para disponibilidad, reservabilidad, walk-up o fecha de
actualización. Las fixtures actuales son payloads crudos de AWS Events en
`packages/events-client`, por lo que no pueden validar una proyección independiente del adapter.

## Target behavior

El paquete `@pathfinder/domain` expone un modelo de disponibilidad independiente del proveedor
con estados cerrados y semántica conservadora. Incluye fixtures de dominio que cubren cada estado
relevante, campos opcionales y datos desconocidos; las fixtures no hacen inferencias a partir de
capacidad numérica.

## Entry points

- Imports desde `@pathfinder/domain` para consumidores TypeScript posteriores.
- Fixtures de dominio utilizadas por pruebas unitarias del modelo y, después, por la proyección
  de WI-016.

## End-to-end flow

Fixture de disponibilidad de dominio → contrato `SessionAvailability` validado por pruebas →
consumidor TypeScript puede asociarlo a un `SessionCandidate` por `sessionId` → la futura
proyección consume un estado explícito o `unknown`, sin requerir credenciales ni llamadas de red.

## Problem

No hay un contrato de dominio que represente disponibilidad de sesión sin acoplar la experiencia
al payload y a las señales incompletas de AWS Events.

## Expected result

Un contrato puro y testeado representa disponibilidad, reservabilidad y walk-up para una sesión,
preserva `unknown` ante datos no verificables y provee fixtures reutilizables para UI y lógica.

## Suggested Knowledge Level

K2. Es un cambio limitado de modelo y pruebas locales; no cambia el adapter live, OAuth,
reservas ni UI.

## Impact analysis

| Surface | Estado | Evaluación |
| --- | --- | --- |
| Product/UI | reviewed-not-affected | No crea ruta ni interacción; entrega contrato para el heatmap posterior. |
| Frontend | reviewed-not-affected | `apps/client` no se modifica en este slice. |
| Domain | affected | Define tipos, estados, fixtures y pruebas de disponibilidad. |
| AWS Events adapter | reviewed-not-affected | No interpreta payloads reales ni cambia normalización; ese trabajo es WI-019. |
| Backend/database | not-applicable | No hay API propia ni persistencia. |
| Auth/authorization | not-applicable | No usa Builder ID ni tokens. |
| Configuration/feature flags | not-applicable | No requiere configuración. |
| Analytics/notifications | not-applicable | No produce eventos ni notificaciones. |
| Documentation | affected | El contrato público debe documentar semántica de `unknown`. |
| Operations/release | reviewed-not-affected | Solo validaciones locales existentes. |

## Module coverage

- `reinvent-pathfinder` — **affected**: `packages/domain` concentra el contrato y sus pruebas.

## Scope unknowns

- El mapping definitivo desde campos AWS Events a `AvailabilityStatus` no forma parte de este WI.
  Hasta validarlo en WI-CANDIDATE-005, el contrato debe permitir representar `unknown`.
- No se fija una política de umbrales numéricos para convertir capacidad restante en `limited` o
  `full`; los fixtures expresan el estado deseado de manera explícita.

## Scope confidence

Media. El límite de dominio y la semántica conservadora están claros; el nombre final de los
tipos y el lugar exacto de las fixtures deben respetar las convenciones existentes de
`packages/domain`, sin trasladar lógica del adapter.

## Acceptance Criteria

- [x] `@pathfinder/domain` exporta un tipo de estado cerrado con `available`, `limited`, `full`,
  `walk-up`, `unavailable` y `unknown`.
- [x] El contrato asocia una disponibilidad a un `sessionId` y puede expresar reservabilidad,
  última actualización y capacidad numérica solo como información opcional.
- [x] La ausencia o ambigüedad de datos puede expresarse como `unknown`; el contrato no obliga a
  inferir un estado desde `capacityRemaining`.
- [x] Hay fixtures deterministas de dominio que cubren los seis estados y al menos un caso con
  campos opcionales ausentes.
- [x] Las pruebas unitarias verifican las invariantes del contrato y las fixtures, sin red,
  credenciales de AWS ni `AwsEventsClient`.
- [x] De extremo a extremo para este slice: un consumidor TypeScript importa `SessionCandidate`,
  el contrato de disponibilidad y una fixture; puede asociarlos por `sessionId` y renderizar o
  proyectar el estado explícito sin depender de un payload de AWS.

## Out of scope

- Consultar AWS Events, normalizar payloads reales o definir el mapping AWS → availability.
- Umbrales de capacidad, refresh, cache, throttling o último snapshot válido.
- Heatmap, filtros, rutas de UI, login, agenda, favoritos, reservas y cancelaciones.
- Persistencia, APIs propias, IA, Bedrock, AgentCore y DynamoDB.

## Validation

1. Ejecutar `corepack pnpm --filter @pathfinder/domain test` y comprobar las invariantes y
   fixtures del contrato sin dependencias de red.
2. Ejecutar `corepack pnpm lint`, `corepack pnpm typecheck` y `corepack pnpm test`.
3. Confirmar mediante una prueba de consumidor que una sesión con disponibilidad explícita
   `unknown` conserva ese valor y que ninguna capacidad numérica fuerza una inferencia.
4. Ejecutar `kaddo guard` y revisar cualquier drift de conocimiento antes de completar.

## Definition of Done

- Contrato y fixtures públicos, tipados y documentados en `@pathfinder/domain`.
- Cobertura de pruebas para todos los estados, opcionales y preservación de `unknown`.
- Validaciones de lint, typecheck y tests en verde.
- El Work Item no introduce dependencias desde `packages/domain` hacia AWS Events, UI, IA o AWS SDK.
- Las decisiones o desviaciones descubiertas se registran en el Work Item o la iniciativa antes
  de cerrar.

## Open questions

No hay preguntas abiertas que bloqueen este slice. El mapping real de AWS Events y los umbrales
de capacidad permanecen explícitamente diferidos a WI-CANDIDATE-005.

## Suggested ownership (code globs)

- `packages/domain/src/types/**`
- `packages/domain/src/fixtures/**`
- `packages/domain/src/index.ts`
- `packages/domain/src/domain.test.ts`

## Learning

Un contrato de disponibilidad explícito y fixtures de dominio permiten avanzar sin depender de señales incompletas de AWS Events; unknown evita inferencias incorrectas hasta validar el mapping real.
