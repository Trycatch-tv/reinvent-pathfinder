---
type: initiative
id: INI-007
title: 'Live Event Experience — disponibilidad, agenda y reservas'
status: planned
knowledge_level: K2
domains:
  - aws-events
  - experience
  - product
related_capabilities:
  - session-availability
  - event-navigation
  - schedule-management
  - reservations
created_at: '2026-10-06'
external_links:
  - 'https://docs.aws.amazon.com/events/latest/devguide/rest-op-listsessions.html'
  - 'https://docs.aws.amazon.com/events/latest/devguide/authentication.html'
  - 'https://docs.aws.amazon.com/events/latest/devguide/rest-op-getschedule.html'
  - >-
    https://docs.aws.amazon.com/events/latest/devguide/rest-op-reservesessions.html
candidates:
  - id: WI-CANDIDATE-001
    title: Modelo normalizado de disponibilidad de sesiones y fixtures
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Introduce un contrato estable e independiente de AWS para disponibilidad,
      reservabilidad y modalidad walk-up, apto para desarrollo y pruebas sin el
      API real.
    notes: >-
      No asumir capacidad numérica exacta; tolerar campos ausentes y normalizar
      únicamente señales confiables a estados internos estables.
    materialized_as: WI-015
  - id: WI-CANDIDATE-002
    title: Motor de proyección y filtrado para Availability Heatmap
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Proyección por día, horario, venue y disponibilidad reutilizable por
      cualquier UI.
    materialized_as: WI-016
  - id: WI-CANDIDATE-003
    title: UI local-first del Session Availability Heatmap
    type: feature
    suggested_knowledge_level: K2
    expected_value: Matriz accesible de disponibilidad con filtros y estados visuales claros.
    materialized_as: WI-017
  - id: WI-CANDIDATE-004
    title: Integración del login con AWS Builder ID en apps/client
    type: feature
    suggested_knowledge_level: K3
    expected_value: UI autenticada contra AWS Events mediante el OAuth 2.0 + PKCE existente.
    notes: >-
      Tokens solo en memoria; reutilizar AwsBuilderIdAuthClient, PKCE e
      InMemoryTokenStore.
    materialized_as: WI-018
  - id: WI-CANDIDATE-005
    title: Integración live de disponibilidad con AWS Events
    type: feature
    suggested_knowledge_level: K3
    expected_value: 'Catálogo real con paginación, throttling, refresh y degradación segura.'
    materialized_as: WI-019
  - id: WI-CANDIDATE-006
    title: Integración de agenda personal y favoritos
    type: feature
    suggested_knowledge_level: K2
    expected_value: GetSchedule y favoritos reconciliados con el mapa de disponibilidad.
    materialized_as: WI-020
  - id: WI-CANDIDATE-007
    title: Reserva y cancelación de sesiones desde Pathfinder
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Reservas y cancelaciones con partial success y reconciliación posterior
      con GetSchedule.
    materialized_as: WI-021
  - id: WI-CANDIDATE-008
    title: Launcher local y distribución de la experiencia autenticada
    type: feature
    suggested_knowledge_level: K2
    expected_value: Ejecución local compatible con el callback OAuth de AWS Events.
    materialized_as: WI-022
horizon: now
priority: high
---

# Live Event Experience — disponibilidad, agenda y reservas

## Goal

Habilitar una experiencia operativa y usable de Pathfinder durante AWS re:Invent para
iniciar sesión con AWS Builder ID, consultar catálogo y disponibilidad real, revisar la
agenda, detectar conflictos, gestionar favoritos y reservar o cancelar cuando AWS Events lo permita.

La iniciativa debe entregarse independientemente de IA, recomendaciones, DynamoDB y el
resto de servicios cloud de Pathfinder.

## Expected Value

Una sesión relevante deja de ser viable cuando está llena, se cruza con la agenda o exige
una decisión inmediata. Esta capa responde «¿qué sesiones puedo tomar ahora?», «¿dónde hay
disponibilidad?» y «¿puedo reservarla?», por lo que aporta valor aun sin el bloque de IA de
INI-006. En el futuro availability será una señal para el Recommendation Engine, junto con
relevancia, compatibilidad de agenda y venue.

## Scope

- **Availability domain:** modelo interno independiente de AWS con `sessionId`, código,
  título, estado, reservabilidad, inicio/fin, venue, sala, última actualización y capacidad
  solo cuando AWS la entregue de forma confiable. Estados: `available`, `limited`, `full`,
  `walk-up`, `unavailable` y `unknown`; nunca inferir disponibilidad ausente.
- **Availability projection:** TypeScript puro que transforma `SessionCandidate[]` y
  `SessionAvailability[]` en `AvailabilityProjection` por día, horario, venue y sesión.
  Filtra por día, horario, venue, availability, tipo, nivel y topics.
- **Availability Heatmap:** vista independiente `/availability` en `apps/client`, matriz
  temporal por venue y horario. Color no es la única señal accesible. El detalle muestra
  código, título, horario, venue/sala, estado, tipo, nivel, topics, estado de agenda,
  favorito, reserva y última actualización.
- **Builder ID:** integrar `AwsBuilderIdAuthClient`, PKCE e `InMemoryTokenStore` existentes
  en `apps/client`. El callback es local; los tokens permanecen en memoria, nunca se envían
  al backend ni se guardan en localStorage, IndexedDB o cookies.
- **Catálogo live:** reutilizar `@pathfinder/events-client` para catálogo paginado con refresh
  manual, cache en memoria, timestamp, manejo `429`/`Retry-After`, campos opcionales y último
  snapshot válido ante fallo.
- **Agenda y favoritos:** después del login, tratar `GetSchedule` como source of truth para
  reservas, favoritos y personal time; distinguir `available`, `favorite`, `reserved` y
  `conflict`, y reconciliar tras cada modificación.
- **Reservas:** completar `reserveSession`/`reserveSessions` y `cancelReservation`; tratar
  partial success, sesión llena, conflicto, operación no disponible, throttling y errores de
  autenticación. Después de reservar/cancelar, ejecutar `GetSchedule` y renderizar el estado real.
- **Launcher local:** inicialmente `pnpm dev`; después puede evolucionar a
  `npx reinvent-pathfinder`. El cliente debe usar un puerto compatible con OAuth, por ejemplo
  `http://localhost:8484`.

### Architecture Boundary

Dependencias permitidas: `apps/client`, `packages/domain` y `packages/events-client`.
INI-007 no depende directamente de `ai/agents`, `ai/tools`, `ai/knowledge`, Amazon Bedrock,
AgentCore, Managed Knowledge Bases ni DynamoDB. AWS Events permanece como source of truth.

## Out of Scope

- Amazon Bedrock, Strands, AgentCore, Managed Knowledge Bases, ranking con IA,
  Knowledge Profile/Gaps, DynamoDB, Learning Report o reflexión post-sesión.
- Sitio público/Builder Center, navegación indoor, mapa geográfico real, optimización avanzada
  de desplazamientos, persistencia central de agenda o reemplazar AWS Events.

## Success Criteria

Un asistente puede abrir Pathfinder localmente, iniciar sesión, cargar el catálogo real,
ver y filtrar disponibilidad, abrir el detalle, consultar su agenda, marcar favorito o
reservar, reconciliar con `GetSchedule` y ver el estado real reflejado en la UI.

- El heatmap funciona íntegramente con fixtures y la UI no depende de IA.
- Login/logout, catálogo actualizable, agenda y favoritos funcionan contra AWS Events.
- Reserva/cancelación funcionan cuando la API está habilitada y representan partial success.
- `unknown` representa disponibilidad sin datos; `401`, `403`, `409` y `429` se manejan explícitamente.
- Los tests locales no requieren credenciales de AWS y `pnpm lint`, `pnpm typecheck` y `pnpm test` siguen en verde.

## Dependencies

### Required

- **INI-001** — Fundación técnica del monorepo.
- **INI-002** — Integración con AWS Events: `AwsBuilderIdAuthClient`, OAuth 2.0 + PKCE,
  `InMemoryTokenStore`, catálogo, paginación, `GetSchedule`, favoritos y detección de conflictos.

### Explicitly not required

- **INI-005**, **INI-006**, Amazon Bedrock, AgentCore, Managed Knowledge Bases y DynamoDB.

INI-007 puede desarrollarse en paralelo con INI-006: aquella se ocupa de Builder ID,
AWS Events, availability, agenda y reservas; INI-006 de Bedrock, Managed KB, Strands,
AgentCore y observabilidad de IA. No comparten una dependencia de entrega.

## Work Item Candidates

1. `WI-CANDIDATE-001` — Modelo normalizado de disponibilidad y fixtures.
2. `WI-CANDIDATE-002` — Motor de proyección y filtrado.
3. `WI-CANDIDATE-003` — UI local-first del heatmap.
4. `WI-CANDIDATE-004` — Login Builder ID en `apps/client`.
5. `WI-CANDIDATE-005` — Disponibilidad live con AWS Events.
6. `WI-CANDIDATE-006` — Agenda personal y favoritos.
7. `WI-CANDIDATE-007` — Reserva y cancelación.
8. `WI-CANDIDATE-008` — Launcher local/distribución autenticada.

Orden sugerido: 001 → (002 → 003); 004 → 005; 004 → 006 → 007; 005 también precede 007;
008 sigue el journey completo. El primer demo usa 001–003 con fixtures; el primero conectado,
004–005; y el journey operativo completo, 006–007. Estos son candidatos: no se materializa
ningún Work Item en esta iniciativa.

## Open Questions

- [assumed] Mientras se valida el catálogo real, el normalizador solo asigna un estado distinto
  de `unknown` cuando AWS Events entregue una señal inequívoca. Los campos ausentes, ambiguos
  o no mapeados se representan como `unknown`; no se infiere capacidad ni disponibilidad.
  - note: Esto permite completar el primer slice con fixtures y protege a la UI contra cambios
    del proveedor. El mapping definitivo se verificará durante WI-CANDIDATE-005.
- [resolved] `ReserveSessions` usa `POST /v1/events/{eventId}/reservations` con 1–10 IDs distintos y resultados por sesión; `CancelReservation` usa `DELETE /v1/events/{eventId}/reservations/{sessionId}` y devuelve `404` cuando no existe reserva.
  - note: Confirmado contra la documentación oficial de AWS Events; `GetSchedule` seguirá siendo la reconciliación obligatoria.
- [resolved] El primer release de la experiencia autenticada se ejecuta con `pnpm dev`.
  - note: Alineado con la decisión de distribución local del MVP en
    `knowledge/tech/codebase.md`. `npx reinvent-pathfinder` queda como extensión posterior.
- [assumed] Si el estado observado cambia durante la interacción, la UI muestra el timestamp
  del snapshot, refresca desde AWS Events y trata la respuesta reconciliada como fuente de
  verdad; no confirma una reserva localmente hasta reconciliar `GetSchedule`.
  - note: Evita promesas incorrectas sin requerir persistencia ni mecanismos de tiempo real.
- [deferred] Definir si mobile prioriza venue u horario.
  - note: Es una decisión de UX para WI-CANDIDATE-003, posterior al contrato de proyección.
- [deferred] Incorporar availability al Recommendation Engine y explorar una visualización
  geográfica cuando existan datos de ubicación confiables.
  - note: Ambas extensiones permanecen fuera de INI-007 para preservar su independencia de IA.

## Learning

Al completar, capturar el comportamiento real de availability, integración de Builder ID en UI,
limitaciones de reservations, decisiones UX y aprendizajes de AWS Events durante el evento.
