---
type: chore
id: WI-002
title: 'Tooling de calidad y CI (lint, typecheck, Vitest, pipeline de PR)'
knowledge_level: K2
status: completed
completed_at: '2026-10-04'
phase: now
initiative: INI-001
domains:
  - platform
  - tech
code:
  - package.json
  - tsconfig.json
  - tsconfig.base.json
  - eslint.config.mjs
  - vitest.config.ts
  - .github/workflows/ci.yml
created_at: '2026-10-04'
source: initiative
source_id: WI-CANDIDATE-002
source_initiative: INI-001
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-04'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - .kaddo/config.yml
        - .kaddo/context-pack.json
        - .kaddo/context-pack.md
        - .kaddo/explain.json
        - .kaddo/explain.md
        - >-
          knowledge/delivery/initiatives/INI-001-fundaci-n-t-cnica-del-monorepo.md
        - knowledge/tech/codebase.md
        - package.json
        - packages/shared/src/index.ts
        - pnpm-lock.yaml
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-04'
---

# Tooling de calidad y CI (lint, typecheck, Vitest, pipeline de PR)

> Materialized from Initiative INI-001, candidate WI-CANDIDATE-002.

## Outcome

- **Actor:** contribuidor o maintainer del proyecto.
- **Current behavior:** el monorepo tiene estructura de directorios y workspace de pnpm, pero no cuenta con herramientas de linting, framework de pruebas configurado (Vitest) ni pipeline de CI en GitHub Actions para validar PRs.
- **Target behavior:** cualquier cambio en el repositorio es verificado localmente con comandos unificados (`pnpm lint`, `pnpm typecheck`, `pnpm test`) y automáticamente en GitHub Actions en cada Pull Request antes del merge.
- **Observable completion:** `pnpm lint`, `pnpm typecheck` y `pnpm test` se ejecutan sin errores en local, y existe el workflow `.github/workflows/ci.yml` que corre esos mismos checks en CI.

## Journey reconstruction

Flujo de verificación de calidad (local y CI):

```text
desarrollador hace cambios
       ↓
pnpm lint      (ESLint verifica TypeScript y estilo en el workspace)
       ↓
pnpm typecheck (tsc -b valida tipos y project references)
       ↓
pnpm test      (Vitest ejecuta tests unitarios)
       ↓
git push / PR  → GitHub Actions (.github/workflows/ci.yml)
                 corre install → lint → typecheck → test
```

## Problem

Sin tooling de calidad homogéneo y pipeline de CI, el código añadido en los paquetes posteriores (`packages/domain`, `packages/events-client`, etc.) carece de estándares verificables automáticos, facilitando regresiones de tipos, inconsistencias de estilo y roturas no detectadas.

_Expected value:_ Garantiza trazabilidad y calidad desde el primer PR.

## Scope

- Configurar ESLint (flat config `eslint.config.mjs`) con soporte de TypeScript para todo el monorepo.
- Configurar Vitest (configuración base y script para ejecutar pruebas unitarias en paquetes del workspace).
- Ajustar scripts en `package.json` raíz (`lint`, `typecheck`, `test`) para que corran de forma consistente.
- Crear el workflow de GitHub Actions `.github/workflows/ci.yml` que ejecute:
  - Setup Node.js (v24) y pnpm (v12).
  - `pnpm install --frozen-lockfile`.
  - `pnpm lint`.
  - `pnpm typecheck`.
  - `pnpm test`.
- Añadir al menos una prueba unitaria smoke/sanity en un paquete base (p. ej. `packages/shared` o `packages/domain`) para verificar que Vitest ejecute correctamente.

## Out of scope

- Implementación del modelo de dominio real en `packages/domain` → **WI-CANDIDATE-003 / WI-003**.
- Pruebas E2E con Playwright (se incorporarán cuando exista UI en `apps/client`).
- Pipeline de deployment o credenciales de AWS (CD).
- Reglas avanzadas de lint específicas de framework (React Hooks, etc. se añadirán al crear las UIs).

## Surface review

- **Product/UI:** not-applicable (herramientas internas de desarrollo).
- **Frontend:** reviewed — lint y typecheck abarcarán `apps/*`.
- **Backend:** reviewed — lint y typecheck abarcarán `services/*`.
- **AI/Agentic:** reviewed — lint y typecheck abarcarán `ai/*`.
- **Shared packages:** affected — configuración de Vitest y tests iniciales en `packages/*`.
- **Configuration:** affected — `package.json`, `eslint.config.mjs`, `vitest.config.ts`, `.github/workflows/ci.yml`.
- **Database / Auth / Analytics:** not-applicable.
- **Operations/release:** affected — creación del pipeline de PR en GitHub Actions.

## Acceptance Criteria

- [x] Existe `eslint.config.mjs` funcional en la raíz y `pnpm lint` analiza los archivos TypeScript del monorepo.
- [x] `pnpm typecheck` (`tsc -b`) valida tipos en el monorepo sin errores.
- [x] Vitest está configurado en el monorepo y `pnpm test` ejecuta pruebas unitarias correctamente.
- [x] Existe al menos un test unitario básico que pasa exitosamente con `pnpm test`.
- [x] Existe `.github/workflows/ci.yml` configurado para ejecutarse en Pull Requests y pushes a `main`, ejecutando los pasos: install, lint, typecheck y test.
- [x] **End-to-end:** la ejecución secuencial `pnpm lint; pnpm typecheck; pnpm test` finaliza con código de salida 0 en una terminal limpia.

## Validation

- Ejecutar localmente `pnpm lint` y confirmar código de salida 0.
- Ejecutar localmente `pnpm typecheck` y confirmar código de salida 0.
- Ejecutar localmente `pnpm test` y verificar que Vitest reporte tests ejecutados y aprobados.
- Validar la sintaxis del archivo YAML de GitHub Actions.

## Learning

Se configuró ESLint 9 con flat config (`eslint.config.mjs`) para TypeScript, Vitest 5 (`vitest.config.ts`) en la raíz del monorepo y el pipeline de CI en GitHub Actions (`.github/workflows/ci.yml`). Se implementó la primera función utilitaria (`normalizeSessionId`) con sus pruebas unitarias en `@pathfinder/shared`, verificando que la cadena `lint`, `typecheck` y `test` corra de forma consistente en el espacio de trabajo.
