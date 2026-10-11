---
type: feature
id: WI-026
title: >-
  Simplificar el modo POC eliminando Bootstrap del happy path y priorizando Tech
  + Delivery
status: draft
work_type: feature
created_at: '2026-10-09'
source:
  type: chat
  imported_at: '2026-10-09'
  source_format: markdown-frontmatter
  source_hash: ddc554be24756160a47c016aadff1b0476c6bea052203e1c0a41fabda8a1b0b5
  inferred: false
generated_by: kaddo-admin
affected_modules: []
summary: >-
  Simplificar el modo POC eliminando Bootstrap del happy path y priorizando Tech
  + Delivery


  # Simplificar el modo POC eliminando Bootstrap del happy path y priorizando
  Tech + Delivery


  ## Intent


  El modo `project.mode: poc` debe aplicar Minimum Sufficient Knowledge. Una POC
  valida una hipótesis y no debe modelar un producto completo antes de iniciar.


  ## Goal


  `kaddo init --mode poc` debe dejar una POC lista para definir y experimentar
  sin requerir `kaddo bootstrap`.


  Happy path:


  ```text

  init --mode poc

  ↓

  hypothesis + success criteria

  ↓

  minimal technical context when useful

  ↓

  Project Resources when relevant

  ↓

  experiment / spike

  ↓

  evidence

  ↓

  conclusion

  ```


  ## Target behavior


  - `poc.md` concentra el contexto mínimo: Problem, Hypothesis, Expected Value,
  Scenario, Success Criteria, Constraints, Non-goals, Evidence y Conclusion.

  - Business, Product, Capabilities y Roadmap no son requisitos ni bloquean
  route, understand, context o experiment delivery en modo POC.

  - El contexto técnico es progresivo: una POC pequeña puede iniciar con
  `poc.md` y un spike; sobre código existente puede requerir `kaddo scan`,
  current-state o codebase; con sistemas externos puede requerir Project
  Resources.

  - No crear documentación técnica vacía.

  - `kaddo project mode poc` debe preservar el conocimiento existente y
  garantizar que exista `knowledge/delivery/poc.md`.

  - `kaddo project mode standard` preserva poc.md, evidencia, WIs, recursos,
  conocimiento técnico y decisiones.

  - `kaddo bootstrap` en POC debe ser un no-op informativo o asegurar solo
  estructura POC/mínima, sin crear business, product, capabilities ni roadmap.

  - Standard bootstrap se mantiene sin cambios.


  ## POC-aware next step


  1. POC artifact missing: create or restore poc.md.

  2. Hypothesis missing: define it.

  3. Success criteria missing: define them.

  4. Existing code requires understanding: scan and establish minimal technical
  context.

  5. Experiment WI missing: create or refine a spike.

  6. Experiment incomplete: implement and verify it.

  7. Evidence insufficient: collect it.

  8. Conclusion pending: evaluate.

  9. Conclusion recorded: POC complete.


  Never insert Business/Product bootstrap between hypothesis and experiment.


  ## MCP and documentation


  - Keep `kaddo://poc`, but when the artifact is absent instruct to initialize
  in POC mode or switch with `kaddo project mode poc`; never require bootstrap.

  - Update README and EN/ES docs to show:
    ```bash
    kaddo init --mode poc
    # define hypothesis and success criteria in poc.md
    kaddo context
    kaddo understand
    kaddo create spike
    ```
  - Explicitly document that POC mode does not require the standard
  Business/Product knowledge baseline.


  ## Out of scope


  - Removing bootstrap from the product.

  - Changing standard bootstrap.

  - Removing Business/Product from the general model.

  - New Work Item type or exclusive POC agent.

  - Automatic infrastructure, Project Resources execution, automatic experiment
  metrics, state changes, or deleting existing Business/Product knowledge.


  ## Acceptance Criteria


  - [ ] AC-01: `kaddo init --mode poc` is sufficient to define and execute a POC
  without bootstrap.

  - [ ] AC-02: `poc.md` supports Problem, Hypothesis, Expected Value, Scenario,
  Success Criteria, Constraints, Non-goals, Evidence and Conclusion.

  - [ ] AC-03: Business, Product, Capabilities and Roadmap do not block POC
  route, understand, context or experiment delivery.

  - [ ] AC-04: Tech knowledge is progressive; missing current-state/codebase is
  only recommended when technically needed.

  - [ ] AC-05: Next step follows hypothesis → criteria → tech/resources when
  relevant → experiment → evidence → conclusion.

  - [ ] AC-06: `kaddo project mode poc` ensures poc.md, preserves existing
  knowledge and does not require bootstrap.

  - [ ] AC-07: Bootstrap in POC does not create business, product, capabilities
  or roadmap artifacts.

  - [ ] AC-08: Standard bootstrap behavior remains unchanged.

  - [ ] AC-09: understand and context work immediately on a fresh POC.

  - [ ] AC-10: `kaddo://poc` does not present bootstrap as a requirement.

  - [ ] AC-11: README and EN/ES docs show the corrected happy path.


  ## Validation


  Fresh POC: initialize with `kaddo init --mode poc`; verify config, poc.md and
  work-items exist, then run context and understand. The next step must be
  hypothesis or success criteria and no Business/Product absence can block it.


  Existing project: run `kaddo project mode poc`; verify poc.md exists,
  knowledge is preserved and bootstrap is not required.


  Explicit bootstrap: run it in POC; verify it creates none of
  business/business.md, product/product.md, product/capabilities.md or
  delivery/roadmap.md.


  Experiment: complete hypothesis and criteria, then create a spike and follow
  implementation/evidence/evaluation/conclusion.


  Graduation: switch to standard; verify poc.md, WIs, evidence, resources and
  technical knowledge remain.


  ## Implementation handoff guidance


  Start from WI-041. Simplify rather than redesign project.mode. Focus files:

  - packages/cli/src/commands/init.ts

  - packages/cli/src/commands/bootstrap.ts

  - packages/cli/src/core/next-step.ts

  - packages/cli/src/core/project-route.ts

  - packages/cli/src/core/understand.ts

  - packages/cli/src/core/context-pack.ts

  - packages/mcp/src/resources.ts

  - apps/docs/**/poc-mode.md

  - README.md


  Guiding principle: A POC exists to reduce uncertainty, not to anticipate
  documentation for a product that may not need to exist.
original_snapshot:
  title: >-
    Simplificar el modo POC eliminando Bootstrap del happy path y priorizando
    Tech + Delivery
  description: >-
    # Simplificar el modo POC eliminando Bootstrap del happy path y priorizando
    Tech + Delivery


    ## Intent


    El modo `project.mode: poc` debe aplicar Minimum Sufficient Knowledge. Una
    POC valida una hipótesis y no debe modelar un producto completo antes de
    iniciar.


    ## Goal


    `kaddo init --mode poc` debe dejar una POC lista para definir y experimentar
    sin requerir `kaddo bootstrap`.


    Happy path:


    ```text

    init --mode poc

    ↓

    hypothesis + success criteria

    ↓

    minimal technical context when useful

    ↓

    Project Resources when relevant

    ↓

    experiment / spike

    ↓

    evidence

    ↓

    conclusion

    ```


    ## Target behavior


    - `poc.md` concentra el contexto mínimo: Problem, Hypothesis, Expected
    Value, Scenario, Success Criteria, Constraints, Non-goals, Evidence y
    Conclusion.

    - Business, Product, Capabilities y Roadmap no son requisitos ni bloquean
    route, understand, context o experiment delivery en modo POC.

    - El contexto técnico es progresivo: una POC pequeña puede iniciar con
    `poc.md` y un spike; sobre código existente puede requerir `kaddo scan`,
    current-state o codebase; con sistemas externos puede requerir Project
    Resources.

    - No crear documentación técnica vacía.

    - `kaddo project mode poc` debe preservar el conocimiento existente y
    garantizar que exista `knowledge/delivery/poc.md`.

    - `kaddo project mode standard` preserva poc.md, evidencia, WIs, recursos,
    conocimiento técnico y decisiones.

    - `kaddo bootstrap` en POC debe ser un no-op informativo o asegurar solo
    estructura POC/mínima, sin crear business, product, capabilities ni roadmap.

    - Standard bootstrap se mantiene sin cambios.


    ## POC-aware next step


    1. POC artifact missing: create or restore poc.md.

    2. Hypothesis missing: define it.

    3. Success criteria missing: define them.

    4. Existing code requires understanding: scan and establish minimal
    technical context.

    5. Experiment WI missing: create or refine a spike.

    6. Experiment incomplete: implement and verify it.

    7. Evidence insufficient: collect it.

    8. Conclusion pending: evaluate.

    9. Conclusion recorded: POC complete.


    Never insert Business/Product bootstrap between hypothesis and experiment.


    ## MCP and documentation


    - Keep `kaddo://poc`, but when the artifact is absent instruct to initialize
    in POC mode or switch with `kaddo project mode poc`; never require
    bootstrap.

    - Update README and EN/ES docs to show:
      ```bash
      kaddo init --mode poc
      # define hypothesis and success criteria in poc.md
      kaddo context
      kaddo understand
      kaddo create spike
      ```
    - Explicitly document that POC mode does not require the standard
    Business/Product knowledge baseline.


    ## Out of scope


    - Removing bootstrap from the product.

    - Changing standard bootstrap.

    - Removing Business/Product from the general model.

    - New Work Item type or exclusive POC agent.

    - Automatic infrastructure, Project Resources execution, automatic
    experiment metrics, state changes, or deleting existing Business/Product
    knowledge.


    ## Acceptance Criteria


    - [ ] AC-01: `kaddo init --mode poc` is sufficient to define and execute a
    POC without bootstrap.

    - [ ] AC-02: `poc.md` supports Problem, Hypothesis, Expected Value,
    Scenario, Success Criteria, Constraints, Non-goals, Evidence and Conclusion.

    - [ ] AC-03: Business, Product, Capabilities and Roadmap do not block POC
    route, understand, context or experiment delivery.

    - [ ] AC-04: Tech knowledge is progressive; missing current-state/codebase
    is only recommended when technically needed.

    - [ ] AC-05: Next step follows hypothesis → criteria → tech/resources when
    relevant → experiment → evidence → conclusion.

    - [ ] AC-06: `kaddo project mode poc` ensures poc.md, preserves existing
    knowledge and does not require bootstrap.

    - [ ] AC-07: Bootstrap in POC does not create business, product,
    capabilities or roadmap artifacts.

    - [ ] AC-08: Standard bootstrap behavior remains unchanged.

    - [ ] AC-09: understand and context work immediately on a fresh POC.

    - [ ] AC-10: `kaddo://poc` does not present bootstrap as a requirement.

    - [ ] AC-11: README and EN/ES docs show the corrected happy path.


    ## Validation


    Fresh POC: initialize with `kaddo init --mode poc`; verify config, poc.md
    and work-items exist, then run context and understand. The next step must be
    hypothesis or success criteria and no Business/Product absence can block it.


    Existing project: run `kaddo project mode poc`; verify poc.md exists,
    knowledge is preserved and bootstrap is not required.


    Explicit bootstrap: run it in POC; verify it creates none of
    business/business.md, product/product.md, product/capabilities.md or
    delivery/roadmap.md.


    Experiment: complete hypothesis and criteria, then create a spike and follow
    implementation/evidence/evaluation/conclusion.


    Graduation: switch to standard; verify poc.md, WIs, evidence, resources and
    technical knowledge remain.


    ## Implementation handoff guidance


    Start from WI-041. Simplify rather than redesign project.mode. Focus files:

    - packages/cli/src/commands/init.ts

    - packages/cli/src/commands/bootstrap.ts

    - packages/cli/src/core/next-step.ts

    - packages/cli/src/core/project-route.ts

    - packages/cli/src/core/understand.ts

    - packages/cli/src/core/context-pack.ts

    - packages/mcp/src/resources.ts

    - apps/docs/**/poc-mode.md

    - README.md


    Guiding principle: A POC exists to reduce uncertainty, not to anticipate
    documentation for a product that may not need to exist.
  type: feature
  status: draft
---

# Simplificar el modo POC eliminando Bootstrap del happy path y priorizando Tech + Delivery

> Type: feature
