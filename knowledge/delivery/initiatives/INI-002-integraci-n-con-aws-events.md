---
type: initiative
id: INI-002
title: Integración con AWS Events
status: completed
knowledge_level: K2
domains:
  - aws-events
  - integration
related_capabilities: []
created_at: '2026-10-03'
external_links: []
candidates:
  - id: WI-CANDIDATE-001
    title: >-
      events-client: adapter base de AWS Events REST API (catálogo + paginación
      + normalización)
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Adapter TypeScript que encapsula catalog, paginación, normalización,
      errores y retry/throttling. Fuente de verdad del catálogo.
    materialized_as: WI-004
  - id: WI-CANDIDATE-002
    title: Autenticación OAuth 2.0 + PKCE con AWS Builder ID (callback local)
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Habilita la experiencia autenticada con AWS Builder ID; tokens solo en
      memoria, nunca enviados al backend.
    materialized_as: WI-005
  - id: WI-CANDIDATE-003
    title: 'Agenda personal: GetSchedule, favoritos y detección de conflictos'
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Lee agenda personal (GetSchedule), favoritos y detecta conflictos con el
      Learning Path.
    materialized_as: WI-006
horizon: now
priority: high
completed_at: '2026-10-05'
---

# Integración con AWS Events

## Goal

Proveer un paquete cliente TypeScript (`@pathfinder/events-client`) robusto, seguro y desacoplado para integrar Pathfinder con la API de AWS Events y AWS Builder ID, sirviendo como la fuente de verdad del catálogo oficial de sesiones de AWS re:Invent y de la agenda personal del asistente.

## Expected Value

Permite a Pathfinder operar tanto en modo online frente a los endpoints oficiales como en modo offline/mock, asegurando privacidad estricta (tokens OAuth en RAM, sin almacenamiento permanente ni fugas al backend propio) y habilitando la detección temprana de conflictos de horario con el Learning Path.

## Scope

- Adapter base de AWS Events (`AwsEventsClient`): paginación por cursores, normalización canónica a `SessionCandidate`, manejo resiliente de errores HTTP 429 (backoff exponencial) y 5xx.
- Flujo de autenticación OAuth 2.0 + PKCE con AWS Builder ID (`pkce.ts`, `InMemoryTokenStore`, `AwsBuilderIdAuthClient`): sin dependencias externas pesadas, tokens estrictamente efímeros.
- Integración de agenda personal (`getPersonalSchedule`), favoritos (`getFavorites`, `addFavorite`, `removeFavorite`) y evaluación de colisiones (`evaluateScheduleConflicts`).
- Fixtures completas y soporte mock para desarrollo local sin conexión.

## Out of Scope

- Interfaz gráfica o componentes de visualización de calendario (pertenece a `apps/client`).
- Endpoints transaccionales de reserva de asientos en vivo que requieran validación web interactiva.
- Persistencia de tokens en disco o bases de datos.

## Success Criteria

- 100% de los candidatos materializados y completados con pruebas automatizadas (`WI-004`, `WI-005`, `WI-006`).
- Capacidad de ejecutar todo el flujo en modo mock y modo live de manera indistinta.
- Cero advertencias de linting, tipos válidos y suite de pruebas aprobada al 100%.

## Dependencies

- Depende de `INI-001` (Fundación técnica del monorepo, pure domain types y scripts raíz).

## Work Item Candidates

- `WI-004` (WI-CANDIDATE-001): `events-client: adapter base de AWS Events REST API` (Completado).
- `WI-005` (WI-CANDIDATE-002): `Autenticación OAuth 2.0 + PKCE con AWS Builder ID` (Completado).
- `WI-006` (WI-CANDIDATE-003): `Agenda personal: GetSchedule, favoritos y detección de conflictos` (Completado).

## Open Questions

Ninguna pregunta bloqueante abierta. Todas las premisas técnicas y de seguridad están resueltas.

## Learning

- La arquitectura de almacenamiento de tokens en memoria (`InMemoryTokenStore`) cumple a cabalidad con la directriz de seguridad de Pathfinder, evitando riesgos de persistencia de tokens de terceros.
- Reutilizar la lógica de `@pathfinder/domain` para detectar conflictos horaristas entre la agenda personal y el Learning Path acelera el desarrollo y preserva una única fuente de verdad funcional en el monorepo.

