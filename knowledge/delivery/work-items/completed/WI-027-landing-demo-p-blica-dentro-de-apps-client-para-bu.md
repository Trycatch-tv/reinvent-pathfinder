---
type: feature
id: WI-027
title: Landing/demo pública dentro de apps/client para Builder Center
knowledge_level: K2
status: completed
phase: now
initiative: INI-005
domains:
  - product
  - experience
code:
  - apps/client/**
affected_modules:
  - reinvent-pathfinder
created_at: '2026-10-07'
source: initiative
source_id: WI-CANDIDATE-002
source_initiative: INI-005
ready_at: '2026-10-07'
completed_at: '2026-10-07'
implementation_evidence:
  - apps/client/src/components/LandingView.tsx
  - apps/client/src/App.tsx
  - apps/client/src/client.test.ts
validations:
  - 'tsc -b: exit 0'
  - 'pnpm -r test: exit 0 (apps/client 24 passed, +3 landing)'
---

# Landing/demo pública dentro de apps/client para Builder Center

> Materialized from Initiative INI-005, candidate WI-CANDIDATE-002.

## Outcome

- **Actor:** visitante público (comunidad, jurado del hackathon, Builder Center) que llega al deploy de Netlify sin estar autenticado.
- **Current behavior:** el deploy de Netlify (`charlasreinvent.netlify.app`) publica `apps/client`, pero la raíz lleva directo al flujo "Paso 1: ¿Qué estás construyendo?". No hay una landing que explique qué es Pathfinder, cómo lanzar la experiencia local autenticada, ni una demo navegable sin login.
- **Target behavior:** existe una **vista pública de landing** (ruta `/about`, enlazada desde el header) que explica el producto, el ciclo de valor (Journeys 1-6), cómo ejecutar la experiencia local, y enlaces a GitHub/Builder Center. La demo navegable sin login se apoya en lo ya existente (la ruta `/availability` ya funciona en modo fixture sin autenticación).
- **Observable completion:** desde la URL pública, un visitante sin login puede leer la explicación del producto y navegar a la demo de disponibilidad (fixture), sin toparse con operaciones que requieran autenticación. `pnpm -r test` y `tsc -b` en verde.

## Journey reconstruction

```text
Visitante llega a charlasreinvent.netlify.app
        ↓
Header con enlace "Qué es Pathfinder" → ruta /about
        ↓
Landing: explicación del producto, ciclo de valor, cómo lanzar local, enlaces GitHub/Builder Center
        ↓
CTA a la demo pública: /availability (modo fixture, sin login)
        ↓
(opcional) iniciar el flujo local autenticado desde "/"
```

## Problem

El proyecto ya está desplegado públicamente, pero la cara pública es el flujo de captura de contexto, no una explicación. Falta una landing que comunique qué es Pathfinder y guíe al visitante hacia la demo o el repositorio, respetando que las operaciones autenticadas son local-first.

_Expected value:_ Vista pública (landing + demo con datos de muestra) servida por el deploy de Netlify ya existente, dentro de `apps/client`.

## Scope

- **Componente de landing** (`apps/client/src/components/`): explica el producto, el ciclo de valor (Journeys), cómo lanzar la experiencia local (`pnpm dev` / puertos de callback), y enlaces a GitHub y Builder Center.
- **Ruta `/about`** en el routing existente de `App.tsx` (reusar `route`/`navigate`/`popstate`), enlazada desde el header.
- **Reutilizar la demo existente:** la ruta `/availability` ya funciona en modo fixture sin login; la landing enlaza a ella como "demo". No se construye una demo nueva.
- **Tests Vitest** del componente de landing (render SSR de los textos/enlaces clave).

## Out of scope

- Montar hosting (ya existe: Netlify / INI-007).
- `apps/site` como app separada (descartado; la landing vive en `apps/client`).
- Operaciones autenticadas de AWS Events desde la vista pública (boundary de seguridad: son local-first).
- Rediseño visual del resto de la app.

## Surface review

- **Frontend (`apps/client`):** affected — nuevo componente de landing + ruta `/about` + enlace en header.
- **Routing (`App.tsx`):** affected — una ruta más en el switch existente.
- **Demo (`/availability`):** reviewed-not-affected — ya existe en modo fixture; solo se enlaza.
- **Backend / events-client / dominio:** not-applicable.
- **Deploy (Netlify):** reviewed-not-affected — el `_redirects`/SPA fallback ya sirve rutas del cliente.

## Acceptance Criteria

- [x] Existe un componente de landing que explica el producto, el ciclo de valor y cómo lanzar la experiencia local, con enlaces a GitHub y Builder Center.
- [x] La landing es accesible en una ruta pública (`/about`) sin requerir login, enlazada desde el header.
- [x] La landing enlaza a la demo pública (`/availability`, modo fixture) sin exponer operaciones autenticadas.
- [x] **End-to-end:** desde la raíz pública, un visitante sin login llega a la landing y de ahí a la demo de disponibilidad en modo fixture.
- [x] Tests Vitest cubren el componente de landing; `pnpm -r test` y `tsc -b` en verde.

## Validation

- `pnpm -r test` y `tsc -b` en exit 0.
- Render SSR de la landing: verificar que aparecen los textos/enlaces clave (producto, cómo lanzar, GitHub, demo).
- Navegación `/about` ↔ `/` ↔ `/availability` sin requerir autenticación.

## Definition of Done

- Acceptance criteria cumplidos y validación sin errores.
- Reutiliza el routing y la demo (`/availability`) existentes; sin duplicar.
- Respeta el boundary de seguridad (nada autenticado en la vista pública).
- Revisado por un maintainer antes de merge.

## Open questions

_Resueltas durante el refinamiento (2026-10-07):_

- [resolved] **Ubicación:** landing dentro de `apps/client` como ruta `/about` (no `apps/site` separado).
- [resolved] **Demo:** se reutiliza `/availability` en modo fixture (ya existe), no se construye demo nueva.

## Dependencies

- Reutiliza el routing de `App.tsx` y la ruta `/availability` (INI-007), y el deploy de Netlify (WI-022).
- Sin dependencia de INI-006.

## Learning

_Completado 2026-10-07._

- **Reutilizar routing y demo existentes evitó duplicación.** La landing se montó como una rama más del switch de rutas de `App.tsx` (`isAboutRoute`), reusando el estado `route`/`navigate`/`popstate` y enlazando a `/availability` (modo fixture) como "demo" en lugar de construir una vista nueva. El alcance se mantuvo mínimo y respetó el boundary de seguridad (nada autenticado en la vista pública).
- **La landing es puramente presentacional** (`LandingView` recibe `onNavigateDemo`/`onNavigateHome` como props), lo que la hizo trivial de testear vía SSR (`renderToString`) sin stubs de red ni auth.
- **Recordatorio recurrente:** el reformateador del editor descarta imports recién añadidos en `App.tsx` y `client.test.ts`; hubo que re-insertar `import { LandingView }` en ambos y re-verificar con `tsc -b`. Validar siempre el bloque de imports tras guardar.
- Con WI-027 (landing) + WI-026 (Learning Report) cerrados, INI-005 queda completa.
