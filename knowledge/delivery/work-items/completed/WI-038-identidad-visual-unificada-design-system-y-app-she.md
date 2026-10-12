---
type: feature
id: WI-038
title: 'Identidad visual unificada, Design System y App Shell'
knowledge_level: K2
status: completed
phase: now
initiative: INI-008
domains:
  - frontend
  - experience
  - product
code:
  - apps/client/src/theme/tokens.ts
  - apps/client/src/components/ui/Button.tsx
  - apps/client/src/components/ui/Card.tsx
  - apps/client/src/components/ui/Badge.tsx
  - apps/client/src/components/ui/Alert.tsx
  - apps/client/src/components/ui/index.ts
  - apps/client/src/components/AppShell.tsx
  - apps/client/src/App.tsx
  - apps/client/src/client.test.ts
created_at: '2026-10-12'
completed_at: '2026-10-12'
source: initiative
source_id: WI-CANDIDATE-002
source_initiative: INI-008
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-12'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - apps/client/src/theme/tokens.ts
        - apps/client/src/components/ui/Button.tsx
        - apps/client/src/components/ui/Card.tsx
        - apps/client/src/components/ui/Badge.tsx
        - apps/client/src/components/ui/Alert.tsx
        - apps/client/src/components/ui/index.ts
        - apps/client/src/components/AppShell.tsx
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
      validations:
        - pnpm -r test
        - pnpm -r build
        - pnpm -r lint
implementation_status: completed
validation_status: completed
verified_at: '2026-10-12'
---

# Identidad visual unificada, Design System y App Shell

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-002.

## Problem

Pathfinder fue construido de manera modular a través de múltiples iniciativas (autenticación, disponibilidad, catálogo, inferencia, reflexiones adaptativas, reportes ejecutivos). Sin embargo, la interfaz carecía de un sistema de diseño estructurado y de un App Shell unificado:
- Cada componente y vista definía estilos en línea o layouts ad-hoc sin un set canónico de design tokens (colores de marca navy/naranja/cyan, escalas de espaciado, tipografía, bordes redondeados y sombras).
- La navegación superior y el encabezado estaban embebidos directamente en `App.tsx` con enlaces y botones dispersos.
- No existían componentes primitivos reutilizables (`Button`, `Card`, `Badge`, `Alert`) lo que generaba inconsistencia en estados interactivos, tamaños y accesibilidad.
- No había un pie de página ni contexto de versión/modo visiblemente cohesionado.

## Acceptance Criteria

- [x] Design Tokens canónicos (`tokens.ts`) centralizados para paleta navy/naranja/cyan, tipografía, espaciado, radios y sombras.
- [x] Componentes base de UI (`Button`, `Card`, `Badge`, `Alert`) con variantes y estados interactivos y accesibles.
- [x] AppShell unificado con encabezado institucional, badge de modo Live/Demo con switch, navegación semántica y footer.
- [x] Barra de progreso visual del Journey en AppShell reflejando activamente las etapas (Contexto, Diagnóstico, Learning Path, Reflexión, Reporte).
- [x] Integración limpia en `App.tsx` reemplazando el header manual y alertas de error ad-hoc.
- [x] Pruebas unitarias de renderizado en `client.test.ts` pasando al 100%.
- [x] Workspace limpio y compilando con `pnpm -r build`, `pnpm -r test` y `pnpm -r lint`.

## Out of scope

- Rediseño de la lógica interna de algoritmos de recomendación o APIs de AWS.
- Migración de frameworks CSS externos (se preservan estilos compatibles con React y tokens sin requerir dependencias adicionales).

## Validation

- `pnpm -r build` compila limpiamente sin errores de tipos TypeScript.
- `pnpm -r test` pasa el 100% de tests unitarios en todos los paquetes.
- `pnpm -r lint` pasa con 0 errores y 0 advertencias.
- `kaddo verify WI-038 --yes` valida el cumplimiento de las metas.

## Learning

1. **Design Tokens canónicos sin dependencias de CSS pesadas**: Centralizar colores de marca, tipografía, radios y espaciado en `tokens.ts` permite mantener consistencia visual en todo el cliente React/Vite sin introducir peso extra de frameworks CSS ni dependencias externas.
2. **Componentes primitivos reutilizables (`Button`, `Card`, `Badge`, `Alert`)**: La extracción de componentes base desacopla los estados interactivos y garantiza accesibilidad con atributos ARIA y roles semánticos (`role="alert"`, badges con dot de estado).
3. **App Shell con orquestación visual de Journey**: El nuevo `AppShell` ofrece una cabecera institucional fijada con el selector de modo (Live/Demo), navegación unificada a través de todas las rutas (`/`, `/about`, `/availability`, `/callback`), una barra de progreso que refleja activamente las 5 etapas del Journey (Contexto → Diagnóstico → Learning Path → Reflexión → Learning Report), y un pie de página con información de entorno y sesión.
4. **Resistencia de cadenas en SSR con React 19**: Las interpolaciones adyacentes de texto JSX generan comentarios delimitadores `<!-- -->` en `renderToString`; encapsular etiquetas dinámicas en template strings (`{`Cambiar a ${mode}...`}`) previene rupturas en aserciones de renderizado.
