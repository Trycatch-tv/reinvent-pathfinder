---
type: chore
id: WI-012
title: Reconciliar verificación de delivery y tests ausentes (deuda de WI-002..011)
status: ready
work_type: chore
knowledge_level: K2
phase: now
created_at: '2026-10-06'
source:
  type: chat
  imported_at: '2026-10-06'
  source_format: markdown-frontmatter
  source_hash: 46c1d2c566e7de6a6a4235bb8d605219ecc953f05f969a4049029523ab99e78a
  inferred: false
generated_by: kaddo-admin
domains:
  - platform
  - tech
code:
  - packages/contracts/**
  - packages/domain/**
  - packages/data/**
  - packages/shared/**
  - knowledge/delivery/work-items/**
affected_modules:
  - reinvent-pathfinder
summary: >-
  Varios Work Items (WI-002, WI-003, WI-004, WI-009, WI-010, WI-011) fueron
  cerrados a lifecycle `completed` fuera de sesión, pero su evidencia interna
  quedó inconsistente: `implementation_status`/`validation_status: in-progress`,
  `validations: []`, y `changed_paths` mal copiado…
original_snapshot:
  title: Reconciliar verificación de delivery y tests ausentes (deuda de WI-002..011)
  description: >-
    Varios Work Items (WI-002, WI-003, WI-004, WI-009, WI-010, WI-011) fueron
    cerrados a lifecycle `completed` fuera de sesión, pero su evidencia interna
    quedó inconsistente: `implementation_status`/`validation_status:
    in-progress`, `validations: []`, y `changed_paths` mal copiado…
  type: chore
ready_at: '2026-10-06'
---

# Reconciliar verificación de delivery y tests ausentes (deuda de WI-002..011)

## Outcome

- **Actor:** maintainer del proyecto / responsable de calidad de delivery.
- **Current behavior:** 11 Work Items figuran `completed`, pero `pnpm -r test` falla (exit 1) y 6 WI tienen evidencia interna inconsistente (`*_status: in-progress`, `validations: []`, `changed_paths` erróneos). El estado de delivery no es fiable.
- **Target behavior:** `pnpm -r test` pasa en todo el workspace, no quedan scripts de test placeholder donde el WI declara tests, y el lifecycle de los 6 WI afectados es coherente con su evidencia real (verificado con `kaddo verify`).
- **Observable completion:** `pnpm -r test` y `tsc -b` terminan en exit 0; el frontmatter de los WI reconciliados muestra `implementation_status`/`validation_status` consistentes y `changed_paths` reales.

## Problem

Varios Work Items (WI-002, WI-003, WI-004, WI-009, WI-010, WI-011) fueron cerrados a lifecycle `completed` fuera de sesión, pero su evidencia interna quedó inconsistente: `implementation_status`/`validation_status: in-progress`, `validations: []`, y `changed_paths` mal copiados (apuntan a archivos de WI-001). Además hay fallos de sustancia: `packages/contracts` no tiene archivos de test (su script `vitest run` falla con "No test files found"), y `packages/domain`, `packages/data` y `packages/shared` conservan el script placeholder `echo "(test pendiente)"` pese a que WI-003 afirma tener suite de tests. Como consecuencia, `pnpm -r test` falla (exit 1), por lo que el "observable completion" de WI-002 ("pnpm test sin errores") no se cumple hoy.

Evidencia objetiva recogida el 2026-10-05: `pnpm install` OK (12 proyectos); `tsc -b` PASS (exit 0); `events-client` 6 archivos de test PASS; `contracts` FAIL (sin tests); `pnpm -r test` FAIL (exit 1).

## Scope

- Añadir/arreglar tests ausentes para que `pnpm -r test` pase: `packages/contracts`, `packages/domain`, `packages/data`, `packages/shared` (reemplazar scripts placeholder por `vitest run` real donde el WI declara tests, o ajustar la definición del WI si no corresponde).
- Reconciliar la trazabilidad de los 6 WARN Work Items del Hallazgo A: re-verificar formalmente con `kaddo verify` (requiere revertir a `in-progress`) o corregir su evidencia/estado para que `completed` sea honesto.
- Corregir los `changed_paths` mal copiados en la evidencia de esos WI.

## Out of scope

- Implementar nuevas features de producto (INI-004/INI-005).
- Reescribir el código de aplicación ya entregado que sí compila y pasa (`events-client`, handlers con tests passing).

## Acceptance Criteria

- [ ] `pnpm -r test` termina sin errores (exit 0) en todo el workspace.
- [ ] Ningún paquete conserva el script de test placeholder `echo "(test pendiente)"` si su Work Item declara tests.
- [ ] Los 6 Work Items del Hallazgo A tienen `implementation_status` y `validation_status` coherentes con su lifecycle (o se bajan a `in-progress` si no cumplen).
- [ ] Los `changed_paths` de la evidencia reflejan los archivos reales de cada WI, no los de WI-001.

## Surface review

- **Tests / calidad:** affected — `packages/contracts`, `packages/domain`, `packages/data`, `packages/shared` (scripts y/o tests ausentes).
- **Delivery knowledge:** affected — frontmatter y evidencia de WI-002, 003, 004, 009, 010, 011.
- **Backend / handlers con tests passing:** reviewed-not-affected — `services/api`, `ai/*` (compilan; `events-client` con 6 tests passing).
- **Product/UI, frontend:** reviewed-not-affected — no se cambia comportamiento de producto en este WI.
- **CI (`.github/workflows/ci.yml`):** reviewed — debe seguir verde tras el arreglo; no se reescribe aquí salvo que el fix de tests lo requiera.
- **Infra / auth / datastore:** not-applicable.

## Validation

- Ejecutar `pnpm -r test` y confirmar exit 0.
- Ejecutar `tsc -b` y confirmar exit 0.
- Revisar el frontmatter de los WI reconciliados (`implementation_status`, `validation_status`, `changed_paths`).

## Definition of Done

- Acceptance criteria cumplidos y validación ejecutada sin errores.
- Sin scripts de test placeholder donde el WI declara tests.
- Lifecycle y evidencia de los 6 WI del Hallazgo A coherentes entre sí.
- Cambios revisados por un maintainer antes de merge.

## Dependencies

- Depende del trabajo ya entregado en WI-002..011 (no los reemplaza; corrige su cierre).
- Sin dependencias hacia INI-004/INI-005.

## Decision (open question resuelta — 2026-10-06)

- [resolved] **Estrategia de reconciliación:** primero corregir la **sustancia** (tests ausentes en `contracts`/`domain`/`data`/`shared` hasta que `pnpm -r test` pase), y después reconciliar el **lifecycle** re-verificando los 6 WI con `kaddo verify` (revirtiéndolos a `in-progress`, ya que la CLI no re-verifica WI `completed`). Razón: la verificación debe reflejar la verdad; forzar `completed` sin que los tests pasen reproduce justamente la inconsistencia que este WI corrige. Un WI que no pase su verificación quedará legítimamente en `in-progress` hasta cumplirla.
