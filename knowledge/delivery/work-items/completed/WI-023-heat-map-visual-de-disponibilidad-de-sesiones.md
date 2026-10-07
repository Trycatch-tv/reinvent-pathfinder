---
type: bugfix
id: WI-023
title: Heat map visual de disponibilidad de sesiones
knowledge_level: K2
status: completed
phase: now
initiative: INI-007
domains:
  - experience
  - aws-events
related_domain: Experience
related_capabilities:
  - session-availability
code:
  - apps/client/src/components/AvailabilityHeatmap.tsx
  - apps/client/src/client.test.ts
affected_modules:
  - reinvent-pathfinder
scope_confidence: high
refined_by: work-item-agent
implemented_by: implementation-agent
project_state: ai-assisted
created_at: '2026-10-07'
source: validation-gap
source_id: WI-017
source_initiative: INI-007
generated_by: kaddo-create
template_version: 1
ready_at: '2026-10-07'
---

# Heat map visual de disponibilidad de sesiones

## Problem

La matriz muestra el estado con texto, pero no ofrece una señal visual inmediata que permita comparar disponibilidad entre horarios y venues.

## Actor and Outcome

Como asistente, puedo identificar de un vistazo sesiones disponibles o limitadas mediante bloques compactos coloreados, sin perder el texto ni las etiquetas accesibles que describen cada estado.

## Current and Target State

`AvailabilityHeatmap` ya agrupa sesiones y conserva el estado cualitativo normalizado (`available`, `limited`, `full`, `walk-up`, `unavailable`, `unknown`), pero todos los botones tienen el mismo aspecto.

El objetivo es aplicar una paleta semántica y de contraste suficiente a cada bloque: verde para disponible, amarillo para limitada, naranja para walk-up, rojo/gris para completa o no disponible y gris neutro para desconocida. La interfaz no mostrará ni inferirá una cantidad de cupos porque AWS Events solo entrega señal cualitativa.

## Scope

- Estilizar cada bloque de sesión según su `availability.status`.
- Añadir una leyenda visible con los estados y su texto.
- Conservar código de sesión, texto, `aria-label`, foco de teclado y semántica de botón.
- Aplicar la misma visualización a fixtures y catálogo live.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| Frontend / heatmap | Affected: paleta, leyenda y estados visuales. |
| AWS Events adapter | Reviewed, not changed: reutiliza el estado normalizado existente. |
| Domain, auth, backend, database, configuration, analytics | Not applicable. |
| Documentation | Reviewed, not changed: la semántica de disponibilidad ya está documentada. |

## Module Coverage

- `reinvent-pathfinder` — affected: componente y prueba de cliente del módulo mapeado.

## Acceptance Criteria

- [x] Cada sesión en la matriz muestra una señal de color consistente con `available`, `limited`, `full`, `walk-up`, `unavailable` o `unknown`, sin representar cantidades numéricas de cupos.
- [x] La vista incluye una leyenda textual y conserva código, estado escrito, foco visible y `aria-label`; el color nunca es la única señal.
- [x] Las pruebas verifican al menos los estados disponible, limitada, completa/no disponible y desconocida sobre fixtures.

## Out of Scope

- Mostrar o estimar cantidades de cupos, polling, animaciones en tiempo real, mapas de venue, cambios a reservas o a la API de AWS Events.

## Validation

```bash
corepack pnpm --filter @pathfinder/client test
corepack pnpm lint
corepack pnpm typecheck
```

Validación manual: abrir `/availability` con fixtures y con catálogo live; comprobar que la leyenda y los bloques permiten diferenciar los estados sin depender solo del color.

## Definition of Done

- Heat map visual accesible sobre los estados existentes.
- No se inventa ni expone una cantidad de cupos.
- Pruebas y controles de calidad pasan.

## Open Questions

No hay preguntas bloqueantes. La paleta se aplica a estados cualitativos, porque el API no entrega capacidad numérica exacta.

## Learning

La matriz visual de disponibilidad utiliza estilos semánticos y `data-availability-status` accesibles sin depender exclusivamente del color. En componentes React renderizados tanto en SSR como en pruebas de texto, el uso de template literals consolida los nodos de texto previniendo delimitadores de comentario de hidratación.
