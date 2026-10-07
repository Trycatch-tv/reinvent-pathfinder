---
type: feature
id: WI-022
title: Launcher local y distribución de la experiencia autenticada
knowledge_level: K2
status: completed
phase: now
initiative: INI-007
domains:
  - experience
  - aws-events
related_domain: Experience
related_capabilities:
  - event-navigation
code:
  - package.json
  - apps/client/package.json
  - apps/client/vite.config.ts
  - apps/client/src/App.tsx
  - README.md
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
project_state: ai-assisted
created_at: '2026-10-07'
source: initiative
source_id: WI-CANDIDATE-008
source_initiative: INI-007
generated_by: kaddo-create
template_version: 1
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
        - >-
          knowledge/delivery/initiatives/INI-007-live-event-experience-disponibilidad-agenda-y-rese.md
        - knowledge/tech/current-state.md
        - packages/events-client/src/client/aws-events-client.ts
        - packages/events-client/src/events-client.test.ts
        - packages/events-client/src/types/user-schedule.ts
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-07'
completed_at: '2026-10-07'
---

# Launcher local y distribución de la experiencia autenticada

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-008.

## Problem

El asistente necesita iniciar Pathfinder en un puerto compatible con el callback de Builder ID sin introducir un empaquetador no requerido por el MVP.

## Assessment

El repositorio ya satisface el resultado esperado: `pnpm dev` delega en `@pathfinder/client`, Vite usa el puerto estricto `8484`, la aplicación configura `http://localhost:8484/callback` y el README documenta el flujo de instalación y arranque. Las validaciones manuales anteriores confirmaron el callback de Builder ID en esa URL.

## Scope

- Verificar y aceptar el launcher existente basado en `pnpm dev` y Vite.
- Mantener la distribución del MVP como ejecución local documentada.

## Out of Scope

- `npx reinvent-pathfinder`, Electron, Tauri, instaladores, hosting del flujo autenticado y cualquier persistencia de credenciales.

## Acceptance Criteria

- [x] Desde un clon limpio, `pnpm dev` inicia el cliente en `http://localhost:8484` mediante el script raíz existente.
- [x] El callback configurado de Builder ID es `http://localhost:8484/callback` y Vite usa `strictPort: true` para evitar un redirect URI variable.
- [x] El README documenta `pnpm install`, `pnpm dev`, la URL local y el callback.
- [x] No se añade un empaquetador o launcher adicional sin una necesidad de producto confirmada.

## Validation

```bash
corepack pnpm dev
```

Abrir `http://localhost:8484`, iniciar Builder ID y confirmar retorno a `/callback`. La configuración y el flujo ya fueron validados durante WI-018 a WI-021.

## Definition of Done

- Launcher local, callback y documentación existentes revisados.
- Se descarta explícitamente una distribución adicional para el MVP.

## Open Questions

No hay preguntas bloqueantes. Una distribución `npx` o desktop requerirá un nuevo Work Item si se justifica.

## Learning

El launcher Vite existente satisface el MVP: pnpm dev, puerto estricto 8484 y callback localhost:8484/callback. Un empaquetador npx o desktop no aporta valor suficiente sin una necesidad de distribución confirmada.
