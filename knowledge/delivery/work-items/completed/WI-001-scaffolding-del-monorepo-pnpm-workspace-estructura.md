---
type: chore
id: WI-001
title: >-
  Scaffolding del monorepo (pnpm workspace, estructura
  apps/services/ai/packages)
knowledge_level: K1
status: completed
phase: now
initiative: INI-001
domains:
  - platform
  - tech
code:
  - package.json
  - pnpm-workspace.yaml
  - apps/**
  - services/**
  - ai/**
  - packages/**
created_at: '2026-10-03'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-001
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-03'
completed_at: '2026-10-03'
---

# Scaffolding del monorepo (pnpm workspace, estructura apps/services/ai/packages)

> Materialized from Initiative INI-001, candidate WI-CANDIDATE-001.

## Outcome

- **Actor:** un contribuidor del proyecto (maintainer o colaborador open source).
- **Current behavior:** el repositorio solo contiene conocimiento (`knowledge/`, `.kaddo/`) y archivos raíz (LICENSE, README). No existe estructura de código, workspace de pnpm ni forma de instalar dependencias o levantar nada localmente.
- **Target behavior:** el contribuidor clona el repo, ejecuta `pnpm install` y obtiene un monorepo con la estructura base (`apps/`, `services/`, `ai/`, `packages/`) y la configuración de workspace, listo para añadir código real en los siguientes Work Items.
- **Observable completion:** `pnpm install` resuelve el workspace sin errores y la estructura de carpetas/paquetes esperada existe y es reconocida por pnpm.

## Journey reconstruction

Flujo de desarrollo (no hay flujo de usuario final; es trabajo de fundación):

```text
git clone
   ↓
pnpm install   (resuelve el workspace definido en pnpm-workspace.yaml)
   ↓
estructura apps/ services/ ai/ packages/ disponible, con placeholders mínimos por paquete
   ↓
pnpm -r <script>  (los comandos recursivos reconocen los paquetes del workspace)
```

## Problem

El proyecto está en estado `new` y no tiene base de código. Sin una estructura de monorepo y un workspace de pnpm no se puede empezar a implementar ninguna capacidad ni habilitar `pnpm install` / `pnpm dev`. Este Work Item crea esa fundación estructural.

_Expected value:_ Base estructural para todo el desarrollo; habilita `pnpm install` + `pnpm dev` y da un lugar coherente a cada bloque del sistema.

## Scope

- Crear `pnpm-workspace.yaml` declarando los globs del workspace (`apps/*`, `services/*`, `ai/*`, `packages/*`).
- Crear `package.json` raíz con metadata del proyecto, `packageManager` fijado a `pnpm@12.8.1`, `engines.node` a `24.21.0` y scripts base (p. ej. `dev`, `build`, `lint`, `test`) que deleguen de forma recursiva.
- Crear la estructura de directorios según el codebase map: `apps/client`, `apps/site` (placeholder de carpeta), `services/api`, `ai/{agents,tools,knowledge,contracts}`, `packages/{domain,events-client,data,contracts,shared}`.
- Añadir un `package.json` mínimo por paquete workspace (name con scope, `private` donde aplique, `version`) para que pnpm lo reconozca.
- Configuración base de TypeScript compartida (`tsconfig.base.json`) con TypeScript project references entre paquetes desde el inicio, sin implementar lógica.
- Placeholders mínimos (`.gitkeep` o `README.md` por carpeta) donde todavía no haya código.

## Out of scope

- Tooling de calidad y pipeline de CI (lint/typecheck/Vitest/PR) → **INI-001 / WI-CANDIDATE-002**.
- Modelo de dominio real en `packages/domain` → **INI-001 / WI-CANDIDATE-003**.
- Cualquier lógica de aplicación, handlers, agentes, adapters o UI.
- Configuración de infraestructura (Serverless Framework, IaC agentic).
- Resolver las open questions de topología de agentes o IaC (siguen abiertas).

## Surface review

- **Product/UI:** not-applicable (sin cambios de cara al usuario).
- **Frontend:** affected — se crea el esqueleto de `apps/client` y `apps/site` (solo estructura, sin UI).
- **Backend:** affected — se crea el esqueleto de `services/api` (sin handlers).
- **AI/Agentic:** affected — se crea el esqueleto de `ai/*` (sin agentes ni tools).
- **Shared packages:** affected — esqueleto de `packages/*`.
- **Configuration:** affected — `pnpm-workspace.yaml`, `package.json` raíz, `tsconfig.base.json`.
- **Database:** not-applicable.
- **Auth / notifications / analytics:** not-applicable.
- **Documentation:** reviewed — el README puede referenciar la estructura, pero no es obligatorio en este WI.
- **Operations/release:** reviewed-not-affected — el pipeline llega en el WI de tooling/CI.

## Acceptance Criteria

- [ ] Existe `pnpm-workspace.yaml` en la raíz declarando los globs `apps/*`, `services/*`, `ai/*`, `packages/*`.
- [ ] Existe `package.json` raíz con `packageManager: pnpm@12.8.1`, `engines.node: 24.21.0` y scripts base (`dev`, `build`, `lint`, `test`).
- [ ] Existen los directorios: `apps/client`, `apps/site`, `services/api`, `ai/agents`, `ai/tools`, `ai/knowledge`, `ai/contracts`, `packages/domain`, `packages/events-client`, `packages/data`, `packages/contracts`, `packages/shared`.
- [ ] Cada paquete del workspace tiene un `package.json` mínimo con `name` (scoped) reconocido por pnpm.
- [ ] Existe un `tsconfig.base.json` compartido y los paquetes lo referencian mediante TypeScript project references.
- [ ] **End-to-end:** desde un clon limpio, `pnpm install` termina sin errores y `pnpm -r ls` (o equivalente) lista todos los paquetes del workspace.

## Validation

- Ejecutar `pnpm install` en un clon limpio y confirmar que resuelve el workspace sin errores.
- Ejecutar un comando recursivo (p. ej. `pnpm -r exec node -e "0"` o `pnpm -r ls`) y verificar que todos los paquetes esperados aparecen.
- Verificar que `pnpm run build`/`lint`/`test` no fallan por configuración ausente (pueden ser no-ops en este WI, pero no deben romper).

## Definition of Done

- Acceptance criteria cumplidos y validación ejecutada sin errores.
- Estructura coherente con el codebase map (`knowledge/tech/codebase.md`).
- Sin lógica de aplicación introducida (solo scaffolding).
- Cambios revisados por un maintainer antes de merge.

## Open questions

_Resueltas durante el refinamiento (2026-10-03):_

- [resolved] **Versiones.** Node `24.21.0` (LTS) y pnpm `12.8.1`, fijadas en `engines.node` y `packageManager`.
- [resolved] **`apps/site`.** Se crea como placeholder de carpeta ahora; la decisión app separada vs. vista integrada sigue siendo una open question de producto (no bloquea el scaffolding).
- [resolved] **TypeScript project references.** Se adoptan desde el inicio en `tsconfig.base.json`.

## Dependencies

- Ninguna. Este Work Item es la base; los demás candidatos de INI-001 (tooling/CI y dominio) dependen de él.

## Learning

_Capturado durante la implementación (2026-10-03):_

- **Qué se entregó:** monorepo pnpm con 11 paquetes `@pathfinder/*` (packages: shared, contracts, domain, data, events-client; services/api; apps/client; ai: agents, tools, knowledge, contracts) + `apps/site` como placeholder. TypeScript project references desde el inicio (`tsconfig.base.json` composite + `tsconfig.json` raíz con references). Verificado: `pnpm install` resuelve los 12 proyectos y `tsc -b` compila sin errores.
- **Desviaciones acordadas:** `engines.node` como rango `>=24` (no pin exacto 24.21.0) y `engine-strict=false`, para no bloquear entornos no actualizados (decisión del usuario). `packageManager` mantiene `pnpm@12.8.1`. Se añadió `typescript` como devDependency raíz para poder verificar `tsc -b`.
- **Hallazgo de entorno (open):** Corepack no logró activar `pnpm@12.8.1` localmente (`bin/pnpm.cjs` corrupto/incompleto), y el `pnpm install` se colgaba por el prompt de descarga. Se verificó usando el binario íntegro de pnpm 11.20.0 vía `node`. Node local es v22.17.1, por lo que el objetivo Node 24 no se validó en Node 24 real. Acción sugerida: re-provisionar Corepack / instalar pnpm 12 y Node 24 en el entorno de desarrollo y CI.
- **Hallazgo de proceso (resuelto):** `verify_work_item` pedía registrar el repo en `.kaddo/modules.yml`. Se alineó el modelo de Kaddo para este monorepo single-repo: se añadió `project.role: core` en `.kaddo/config.yml` y se creó `.kaddo/modules.yml` registrando `reinvent-pathfinder` (`path: .`, `role: module`), más `affected_modules: [reinvent-pathfinder]` en el WI. Tras esto, la verificación pasó a `READY_TO_COMPLETE` (6/6 AC, sin blockers).

### Conocimiento a actualizar

- **current-state (`knowledge/tech/current-state.md`):** la dirección técnica (monorepo pnpm, project references, scripts raíz) dejó de ser solo intención y ahora existe en código. Conviene reflejar que la fundación del monorepo está implementada.
- **config/estructura Kaddo:** registrado `project.role: core` y `.kaddo/modules.yml` (decisión operativa de cómo se modela este single-repo en Kaddo).
- **No se requiere ADR:** las decisiones de stack ya estaban en el conocimiento; este WI solo las materializó.

### Pendientes

- [open] Validar `pnpm install` y `tsc -b` en un entorno con Node 24 y pnpm 12 reales (CI o dev actualizado); re-provisionar Corepack.
- [open] Añadir `references` internas entre paquetes cuando aparezcan imports reales (hoy los paquetes son placeholders sin dependencias entre sí).
- [open] Decisión de producto sobre `apps/site` (app separada vs. vista integrada) sigue abierta.
