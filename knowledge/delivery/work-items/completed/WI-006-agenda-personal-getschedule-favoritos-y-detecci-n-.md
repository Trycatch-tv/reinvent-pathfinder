---
type: feature
id: WI-006
title: 'Agenda personal: GetSchedule, favoritos y detección de conflictos'
knowledge_level: K3
status: completed
phase: now
initiative: INI-002
domains:
  - aws-events
  - integration
code:
  - packages/events-client/**
created_at: '2026-10-05'
completed_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-003
source_initiative: INI-002
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-05'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/events-client/src/types/user-schedule.ts
        - packages/events-client/src/types/errors.ts
        - packages/events-client/src/fixtures/sample-user-schedule.ts
        - packages/events-client/src/schedule/schedule-conflict-evaluator.ts
        - packages/events-client/src/schedule/schedule.test.ts
        - packages/events-client/src/client/aws-events-client.ts
        - packages/events-client/src/index.ts
      validations: []
implementation_status: completed
validation_status: completed
verified_at: '2026-10-05'
---

# Agenda personal: GetSchedule, favoritos y detección de conflictos

> Materialized from Initiative INI-002, candidate WI-CANDIDATE-003.

## Outcome

- **Actor:** Asistente a AWS re:Invent con cuenta AWS Builder ID autenticada.
- **Current behavior:** `AwsEventsClient` puede listar el catálogo público y generar tokens PKCE con `InMemoryTokenStore`, pero no provee métodos para recuperar la agenda personal del asistente (`GetSchedule`), consultar ni marcar favoritos (`favorites`), ni correlacionar dicha agenda con el `LearningPath` para alertar sobre solapamientos de horario.
- **Target behavior:** `AwsEventsClient` permite consultar la agenda personal autenticada (`getPersonalSchedule`), obtener sesiones favoritas (`getFavorites`), gestionar favoritos (`addFavorite`, `removeFavorite`), y provee un evaluador de conflictos de agenda (`evaluateScheduleConflicts`) que analiza las sesiones agendadas/favoritas frente a una lista de sesiones del `LearningPath` o recomendaciones, retornando los solapamientos detectados usando la lógica de `@pathfinder/domain`.
- **Observable completion:** Tipos TypeScript correspondientes (`UserScheduleItem`, `UserScheduleResult`), métodos cliente con soporte online y offline/mock, integración con `TokenStore`, utilidades de evaluación de conflictos de agenda probadas con Vitest al 100%.

## Journey reconstruction

```text
Usuario autenticado con AWS Builder ID
       ↓
AwsEventsClient.getPersonalSchedule() / getFavorites()
  (inyecta Authorization: Bearer <token> desde InMemoryTokenStore)
       ↓
AWS Events API devuelve items agendados (reservas, favoritos, personal time)
       ↓
Normalización a SessionCandidate y UserScheduleItem
       ↓
evaluateScheduleConflicts(learningPathSessions, personalScheduleSessions)
       ↓
Retorna lista de ScheduleConflict con motivo, día y minutos de solapamiento
```

## Problem

El valor principal de Pathfinder durante la conferencia radica en ofrecer un *Learning Path* accionable y realista. Si un usuario ya tiene sesiones reservadas o reservaciones de tiempo en AWS Events, recomendar sesiones en el mismo horario genera fricción. Para conectar el aprendizaje con la realidad física del evento, Pathfinder necesita leer la agenda personal autenticada, sincronizar favoritos y alertar de inmediato cuando una sesión recomendada colisione con su agenda reservada.

_Expected value:_ Lee agenda personal (`GetSchedule`), favoritos y detecta conflictos con el Learning Path.

## Scope

- Definir contratos de tipos en `packages/events-client/src/types/user-schedule.ts`:
  - `UserScheduleItem`: estado de reserva (`reserved` | `waitlisted` | `favorite` | `personal_time`), sesión normalizada (`SessionCandidate`), horario y ubicación.
  - `UserScheduleResult`: lista de items agendados y metadata de sincronización.
- Extender `AwsEventsClient` en `packages/events-client/src/client/aws-events-client.ts`:
  - `getPersonalSchedule()`: requiere autenticación (o modo mock), consulta el endpoint `/user/schedule` o devuelve agenda simulada realista.
  - `getFavorites()`: lista de IDs o candidatos de sesiones marcadas como favoritas.
  - `addFavorite(sessionId)` y `removeFavorite(sessionId)`: mutación de favoritos en memoria/API.
- Implementar evaluador de conflictos de agenda en `packages/events-client/src/schedule/schedule-conflict-evaluator.ts`:
  - Integrar con `detectScheduleConflict` de `@pathfinder/domain`.
  - Comparar un conjunto de `SessionCandidate` (propuestas en un `LearningPath`) contra las sesiones ya agendadas/reservadas en la agenda personal.
  - Retornar reporte de conflictos con detalle de día, horarios y minutos solapados.
- Fixtures realistas para modo mock en `packages/events-client/src/fixtures/sample-user-schedule.ts`.
- Exportar los nuevos módulos en `packages/events-client/src/index.ts`.
- Suite exhaustiva de pruebas unitarias en `packages/events-client/src/schedule/schedule.test.ts` con Vitest:
  - Lectura de agenda personal en modo real y mock.
  - Excepción cuando no hay token disponible para endpoints privados.
  - Gestión de favoritos (adición y remoción).
  - Detección precisa de solapamientos entre agenda y Learning Path.

## Out of scope

- Interfaz gráfica de usuario / calendario visual (pertenece a `apps/client` en INI-003).
- Llamadas a endpoints de reserva formal con tarjeta de crédito o cupos limitados en vivo (`ReserveSeat` en backend propietario de AWS Events que requieran validación captcha/web).
- Persistencia de tokens en disco (estrictamente prohibido).

## Surface review

- **Product/UI:** not-applicable (capa SDK de integración).
- **Frontend:** reviewed — `apps/client` consumirá estos métodos al mostrar el itinerario.
- **Backend:** reviewed-not-affected.
- **AI/Agentic:** reviewed — el motor de recomendaciones usará los conflictos detectados para no sugerir sesiones solapadas.
- **Shared packages:** affected — `packages/events-client` y `@pathfinder/domain`.
- **Database / Auth / Analytics:** affected — validación de presencia de Bearer token en `TokenStore`.

## Acceptance Criteria

- [x] `UserScheduleItem` y `UserScheduleResult` definidos y exportados con tipado estricto.
- [x] `AwsEventsClient.getPersonalSchedule()` consulta la agenda personal inyectando Bearer token o usando datos de muestra en modo mock.
- [x] Error descriptivo si se intenta llamar a `getPersonalSchedule()` sin sesión activa en `TokenStore` (y sin `mockMode`).
- [x] Métodos `getFavorites()`, `addFavorite(id)`, `removeFavorite(id)` implementados con soporte real y mock.
- [x] `evaluateScheduleConflicts(learningPathSessions, scheduledSessions)` detecta y reporta correctamente solapamientos utilizando la lógica de `@pathfinder/domain`.
- [x] Fixtures de agenda de usuario simulada (`SAMPLE_USER_SCHEDULE`) configuradas para pruebas y desarrollo offline.
- [x] Suite de pruebas con Vitest en `packages/events-client/src/schedule/schedule.test.ts` con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` validando compatibilidad de tipos con `@pathfinder/domain`.
- Ejecutar `pnpm test` verificando la cobertura de agenda, favoritos y detección de conflictos.
- Ejecutar `pnpm lint` verificando formato y ausencia de warnings.

## Learning

- Adaptar los items de agenda personal (`UserScheduleItem`, incluyendo tiempo personal como almuerzos) a la entidad pura de dominio `SessionCandidate` permite reutilizar la función pura `detectScheduleConflict` sin duplicar cálculos de solapamiento.
- El filtrado opcional de favoritos (`includeFavorites`) en `evaluateScheduleConflicts` ofrece flexibilidad para distinguir compromisos firmes (reservas y almuerzo) de intenciones flexibles (favoritos).
- El soporte transparente de `SAMPLE_USER_SCHEDULE` en modo mock permite el desarrollo desacoplado y offline del frontend y motor de recomendación.
