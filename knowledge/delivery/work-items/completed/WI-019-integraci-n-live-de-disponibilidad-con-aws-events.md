---
type: feature
id: WI-019
title: Integración live de disponibilidad con AWS Events
knowledge_level: K3
status: completed
phase: now
initiative: INI-007
domains:
  - aws-events
  - experience
related_domain: AWS Events
related_capabilities:
  - Ingesta y normalización del catálogo
  - session-availability
code:
  - packages/events-client/src/types/raw-aws-events.ts
  - packages/events-client/src/normalizer/normalize-session.ts
  - packages/events-client/src/normalizer/normalize-availability.ts
  - packages/events-client/src/client/aws-events-client.ts
  - packages/events-client/src/events-client.test.ts
  - apps/client/src/App.tsx
  - apps/client/src/components/AvailabilityHeatmap.tsx
  - apps/client/src/client.test.ts
  - apps/client/src/vite-env.d.ts
  - apps/client/vite.config.ts
  - packages/domain/src/types/session-candidate.ts
  - packages/domain/src/domain.test.ts
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-005
source_initiative: INI-007
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
ready_at: '2026-10-06'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - .kaddo/context-pack.json
        - .kaddo/context-pack.md
        - .kaddo/scan.json
        - .kaddo/understand.md
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
        - apps/client/src/components/AvailabilityHeatmap.tsx
        - apps/client/vite.config.ts
        - >-
          knowledge/delivery/initiatives/INI-007-live-event-experience-disponibilidad-agenda-y-rese.md
        - knowledge/tech/current-state.md
        - packages/domain/src/domain.test.ts
        - packages/domain/src/types/session-candidate.ts
        - packages/events-client/src/client/aws-events-client.ts
        - packages/events-client/src/events-client.test.ts
        - packages/events-client/src/index.ts
        - packages/events-client/src/normalizer/normalize-session.ts
        - packages/events-client/src/types/errors.ts
        - packages/events-client/src/types/raw-aws-events.ts
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-06'
completed_at: '2026-10-06'
---

# Integración live de disponibilidad con AWS Events

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-005.

## Problem

El heatmap solo consume fixtures y el adapter actual usa un contrato demo de catálogo. Por tanto, la UI no puede mostrar disponibilidad real de AWS Events ni degradar de forma segura ante respuestas operativas del proveedor.

_Expected value:_ catálogo real paginado, disponibilidad normalizada desde señales explícitas de AWS Events, refresh manual y último snapshot válido ante fallos.

## Actor and Outcome

Como asistente autenticado y registrado para el evento, puedo actualizar la disponibilidad del heatmap desde AWS Events y sé cuándo los datos son actuales, incompletos o no se pudieron refrescar.

## Current and Target State

`AwsEventsClient` normaliza un esquema demo y `AvailabilityHeatmap` usa fixtures locales. El objetivo es adaptar el adapter al contrato oficial `ListSessions`, obtener todas las páginas mediante `nextToken`, normalizar `seatAvailability` sin inferencias y permitir que el heatmap cambie explícitamente entre datos demo y un snapshot live.

## Official API Contract

- `GET /v1/events/{eventId}/sessions` retorna `items`, `totalCount` y `nextToken`; una página corta no indica fin de catálogo.
- `Session.seatAvailability` es opcional y usa `available`, `limited`, `veryLimited`, `unavailable` o `walkUp`; la ausencia se convierte en `unknown`.
- `Session.isReservable` se conserva cuando el proveedor lo entregue.
- `eventId` es configuración no secreta requerida para carga live; no se hardcodea un evento en el código.

## End-to-End Flow

Sesión Builder ID activa + `eventId` configurado → acción “Actualizar disponibilidad” → `AwsEventsClient.fetchAllSessions()` recorre `nextToken` → normaliza catálogo y availability → UI actualiza el heatmap con timestamp local de snapshot → ante error conserva el último snapshot válido y muestra un estado seguro → el usuario puede reintentar manualmente.

## Scope

- Adaptar tipos, normalizador y cliente de `@pathfinder/events-client` al shape oficial de `ListSessions`, manteniendo fixtures demo compatibles con las pruebas locales.
- Definir una salida de disponibilidad normalizada basada solo en `seatAvailability` e `isReservable`: `available` → `available`, `limited`/`veryLimited` → `limited`, `unavailable` → `unavailable`, `walkUp` → `walk-up`, ausencia o valor no reconocido → `unknown`.
- Preservar el nivel oficial `500` desde AWS Events para que el filtro del heatmap lo exponga de manera explícita.
- Usar `nextToken` hasta que esté ausente; no detenerse por el tamaño de página.
- Reutilizar el token en memoria de Builder ID para eventos que requieran registro, sin persistirlo ni pasarlo a backend.
- En desarrollo local, enrutar las lecturas autenticadas por un proxy de Vite same-origin para resolver el preflight CORS; no incorporar un proxy desplegado ni persistencia de credenciales.
- Añadir carga live y refresh manual al heatmap; conservar el último snapshot exitoso solo en memoria, con timestamp de observación y mensaje de estado.
- Mapear errores `401`, `403` y `429` a estados de UI accionables; respetar el retry/backoff existente del adapter para lecturas.
- Mantener el modo de fixtures como fallback local cuando no exista `eventId`, no haya sesión autenticada o falle el primer refresh.
- Probar paginación, mapping de cada valor de availability, campos opcionales, errores y preservación del último snapshot.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| AWS Events adapter | Affected: contrato real, paginación, normalización y errores de lectura. |
| Frontend / `apps/client` | Affected: carga live, refresh, estado del snapshot y fallback local. |
| Domain | Affected: amplía `SessionLevel` para representar el nivel oficial 500; reutiliza `SessionAvailability` y proyección de WI-015/016. |
| Authentication | Reviewed, not changed: consume exclusivamente el token efímero entregado por WI-018. |
| Backend, database, AI | Not applicable. |
| Configuration | Affected: `eventId` no secreto debe estar configurado para habilitar la lectura live. |
| Documentation | Affected: evidencia y aprendizaje al cierre. |

## Module Coverage

- `reinvent-pathfinder` — affected: incluye el adapter y el cliente web que consume su snapshot.

## Scope Unknowns

- La configuración concreta de `eventId` y la autorización de un asistente registrado se validan manualmente; sin ellas, el fallback fixture sigue disponible.
- La API no provee capacidad numérica exacta ni un timestamp de disponibilidad; `lastUpdatedAt` representa el instante local en que se recibió el snapshot, no una afirmación del proveedor.
- `full` no se infiere de `seatAvailability`: el valor oficial `unavailable` conserva esa semántica; `full` permanece reservado para una señal futura inequívoca.

## Acceptance Criteria

- [ ] `AwsEventsClient` consume el contrato `ListSessions` con `items` y `nextToken`, recorre todas las páginas hasta que el token esté ausente y no depende de páginas de tamaño fijo.
- [ ] La normalización traduce `available`, `limited`, `veryLimited`, `unavailable` y `walkUp` a los estados de dominio definidos; ausencia o valores desconocidos se traducen a `unknown` sin inferir capacidad.
- [ ] La disponibilidad conserva `isReservable` cuando exista y registra `lastUpdatedAt` como instante local de snapshot, sin afirmar que sea un timestamp del proveedor.
- [ ] El heatmap puede realizar refresh live con `eventId` configurado y token en memoria, muestra el timestamp y conserva el último snapshot válido si un refresh posterior falla.
- [ ] `401` solicita iniciar sesión, `403` comunica falta de registro/acceso y `429` comunica throttling/reintento; ningún error revela tokens o detalles sensibles.
- [ ] Sin configuración, sesión o snapshot live válido, el heatmap mantiene el modo fixture local explícitamente señalado.
- [ ] Las pruebas cubren paginación con múltiples páginas, todos los mappings, datos opcionales, `401`/`403`/`429`, fallback y preservación de snapshot; una validación manual consulta catálogo live autorizado.

## Out of Scope

- Agenda personal, favoritos, reservas, cancelaciones, personal time y reconciliación con `GetSchedule`.
- Refresh automático, polling, WebSockets, cache persistente, service workers o sincronización entre pestañas.
- Inferir disponibilidad desde capacidad, declarar una sesión `full` sin señal oficial o alterar reglas de dominio de WI-015.
- Secretos, backend proxy, IA, recomendaciones, DynamoDB o cambios al flujo OAuth/PKCE.

## Validation

```bash
corepack pnpm --filter @pathfinder/events-client test
corepack pnpm --filter @pathfinder/client test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
kaddo guard
```

Validación manual: con Builder ID autenticado y un `eventId` autorizado, abrir `/availability`, ejecutar refresh, verificar timestamp y los estados textuales; simular un fallo posterior y comprobar que el último snapshot sigue visible con aviso de datos no actualizados.

## Definition of Done

- Adapter compatible con el contrato oficial de `ListSessions` y paginación por `nextToken`.
- Mapping conservador de availability cubierto por pruebas y sin inferencias desde capacidad.
- Heatmap live/local-first comunica origen, timestamp, errores y fallback de manera accesible.
- No hay tokens ni secretos persistidos o expuestos.
- Evidencia de pruebas y `kaddo verify WI-019 --yes` registrados antes de solicitar cierre.

## Open Questions

No hay preguntas abiertas bloqueantes para la implementación local. La disponibilidad de un `eventId` y una cuenta registrada se trata como validación manual externa; no se debe codificar un evento o secreto para suplirla.

## Suggested Ownership

- `packages/events-client/src/types/raw-aws-events.ts`
- `packages/events-client/src/normalizer/normalize-session.ts`
- `packages/events-client/src/client/aws-events-client.ts`
- `packages/events-client/src/events-client.test.ts`
- `apps/client/src/App.tsx`
- `apps/client/src/components/AvailabilityHeatmap.tsx`
- `apps/client/src/client.test.ts`

## Learning

El contrato live de AWS Events usa sessionTime.date, sessionTime.time y sessionTime.length; el navegador requiere un proxy de desarrollo Vite para enviar Authorization sin bloqueo CORS; el catálogo real incluye nivel 500. Se validó manualmente ListSessions para reinvent2026 con Builder ID y se conserva el snapshot solo en memoria.
