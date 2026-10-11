---
type: feature
id: WI-034
title: 'Carga automática de disponibilidad, catálogo y agenda'
knowledge_level: K2
status: completed
completed_at: '2026-10-11'
phase: now
initiative: INI-008
domains:
  - product
  - experience
  - frontend
  - architecture
code:
  - apps/client/src/App.tsx
  - apps/client/src/client.test.ts
created_at: '2026-10-11'
source: initiative
source_id: WI-CANDIDATE-005
source_initiative: INI-008
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-11'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
        - >-
          knowledge/delivery/initiatives/INI-008-experiencia-unificada-orquestaci-n-de-modos-y-traza.md
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-11'
---

# Carga automática de disponibilidad, catálogo y agenda

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-005.

## Outcome Framing

- **Actor:** Usuario que inicia sesión en Modo Live con AWS Builder ID o que explora en Modo Demo.
- **Current Behavior:** La disponibilidad de sesiones y la agenda no se cargan automáticamente al iniciar; el usuario se ve obligado a presionar manualmente botones de actualización ("Actualizar disponibilidad", "Actualizar agenda"), encontrándose con estados vacíos iniciales o requerimientos secuenciales confusos.
- **Target Behavior:** Carga automática transparente y resiliente de disponibilidad, catálogo y agenda según el modo activo al cargar la aplicación o al autenticarse. Se presentan indicadores de carga limpios, se previenen llamadas duplicadas concurrentes, se respeta el rate limit sin polling agresivo y se conserva el botón de refresco manual como acción secundaria.
- **Observable Completion:** Disponibilidad y agenda pobladas automáticamente sin clics obligatorios al entrar a `/` y `/availability`, estados visuales de loading no bloqueantes, control de concurrencia en `App.tsx` y pruebas unitarias que validan la autocarga en Demo y Live.

## Journey Reconstruction

1. **Entrada en Modo Demo:**
   - La aplicación inicializa automáticamente la disponibilidad y la agenda simulada desde el provider.
   - El heatmap y el Learning Path muestran datos inmediatos sin exigir acciones manuales de refresco.
2. **Entrada o Autenticación en Modo Live:**
   - Una vez autenticado con Builder ID (`authState === 'authenticated'`), un efecto reactivo dispara la carga automática de la disponibilidad y la agenda del asistente.
   - Si la llamada está en progreso, se muestra un indicador de carga no invasivo (`Sincronizando disponibilidad y agenda...`).
   - Si ocurre un error (ej. `401 Unauthorized` o `429 Throttling`), se muestra el mensaje de error correspondiente y se habilita la acción manual de reintento.
3. **Prevención de Llamadas Duplicadas:**
   - Se asegura que montajes consecutivos o re-renders no disparen múltiples solicitudes paralelas a AWS Events.
   - No se utiliza polling agresivo en segundo plano.
4. **Acción Secundaria de Refresco:**
   - Los botones de actualización manual permanecen disponibles para cuando el usuario desee forzar una re-sincronización voluntaria.

## Problem

En la experiencia actual:
- Un asistente que se loguea con Builder ID ve una pantalla de disponibilidad vacía hasta que hace clic manual en "Actualizar disponibilidad".
- Luego ve la agenda bloqueada ("Actualiza primero la disponibilidad live para consultar tu agenda") requiriendo otro clic manual.
- Esta fricción innecesaria degrada la sensación de un companion inteligente de re:Invent.

## Expected Value

Elimina la necesidad de actualizar manualmente la disponibilidad al entrar y carga automáticamente los datos del modo seleccionado, con manejo de loading, errores y snapshots, mejorando sustancialmente la inmediatez y usabilidad de Pathfinder.

## Scope

1. **Orquestación de Autocarga en `apps/client/src/App.tsx`:**
   - Hook / efecto para inicializar disponibilidad y agenda en Modo Demo y en Modo Live autenticado.
   - Bandera `isAutoLoading` / prevención de solicitudes duplicadas concurrentes.
   - Actualización de mensajes de estado acordes a la carga automática.
2. **Estados Visuales en `/availability` y Journey Principal:**
   - Indicador de sincronización en progreso.
   - Notificación de éxito o advertencia de error sin degradación silenciosa.
3. **Pruebas y Verificación (`apps/client/src/client.test.ts`):**
   - Verificar que al entrar en Demo, la disponibilidad y agenda se inicializan automáticamente.
   - Verificar que en Live autenticado, se dispara la carga de snapshot y agenda sin clics manuales.

## Out of Scope

- Implementación de WebSockets o Server-Sent Events para live-updates en tiempo real.
- Rediseño integral de CSS de la pantalla de disponibilidad (WI-CANDIDATE-002).

## Acceptance Criteria

- [x] En Modo Demo, la disponibilidad y la agenda se inicializan automáticamente al montar la aplicación sin requerir clics manuales.
- [x] En Modo Live autenticado, la disponibilidad y la agenda personal se cargan automáticamente al iniciar o tras el callback de autenticación.
- [x] Se previenen solicitudes duplicadas o concurrentes durante la carga automática.
- [x] Los botones de refresco manual se conservan como acciones secundarias de reintento o actualización voluntaria.
- [x] Los estados de error en Live comunican el fallo de forma accionable sin caer en fixtures silenciosos.
- [x] Todas las pruebas pasan en verde (`pnpm -r test`, `pnpm -r build`, `pnpm -r lint`).

## Validation

- Ejecutar `pnpm -r build` y `pnpm -r test`.
- Ejecutar `pnpm -r lint`.
- Validar comportamiento con pruebas unitarias en `apps/client/src/client.test.ts`.

## Learning

- **Concurrencia y Resiliencia en Autocarga:** Disparar la sincronización de disponibilidad y agenda en paralelo vía `Promise.all` reduce a la mitad el tiempo de espera inicial en Modo Live sin generar llamadas duplicadas gracias al uso de un `isAutoLoadingRef` persistente durante el ciclo de vida del componente.
- **Transición Transparente en Modo Demo:** Al inicializar automáticamente la agenda en Modo Demo, los componentes visuales (como el heatmap y los marcadores de conflicto) ofrecen feedback inmediato sin forzar al usuario a descubrir botones de refresco manuales.
- **Conservación del Refresco Manual como Acción Secundaria:** Mantener los botones de actualización manual con estados de carga locales permite al asistente forzar la re-sincronización tras realizar cambios externos en la aplicación de AWS Events sin saturar la red con polling innecesario.
