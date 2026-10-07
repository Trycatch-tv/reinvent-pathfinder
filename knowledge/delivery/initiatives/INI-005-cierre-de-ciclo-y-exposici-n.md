---
type: initiative
id: INI-005
title: Cierre de ciclo y exposición
status: planned
knowledge_level: K2
domains:
  - product
  - platform
related_capabilities: []
created_at: '2026-10-03'
external_links: []
candidates:
  - id: WI-CANDIDATE-001
    title: Learning Report y ruta post-evento
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Compara perfil inicial vs. post-evento; identifica gaps
      cubiertos/parciales/pendientes (Journey 6). Inclusión en MVP por decidir.
    notes: >-
      Open question: definir si entra en el MVP del hackathon o queda como
      extensión.
  - id: WI-CANDIDATE-002
    title: Landing/demo pública dentro de apps/client para Builder Center
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Vista pública (landing + demo con datos de muestra) servida por el deploy
      de Netlify ya existente, dentro de apps/client. El hosting ya existe; el
      trabajo es el contenido y la ruta pública.
    notes: >-
      Decisión (2026-10-07): landing dentro de apps/client (no apps/site
      separado), porque Netlify ya despliega apps/client. apps/site queda como
      placeholder.
horizon: later
priority: low
---

# Cierre de ciclo y exposición

> **Alcance actualizado (2026-10-07)** tras analizar lo implementado en INI-007.
> Dos cambios respecto al alcance original:
> 1. **Observabilidad/costo de IA se retiró de aquí** y vive en INI-006 (Habilitación de
>    IA real), su hogar natural. Antes era WI-CANDIDATE-003 de INI-005; se eliminó para no
>    duplicar — su equivalente es WI-CANDIDATE-004 de INI-006.
> 2. **La exposición pública ya tiene hosting**: INI-007 dejó un deploy de Netlify
>    (`charlasreinvent.netlify.app`) que publica `apps/client`. El trabajo restante no es
>    montar hosting, sino el contenido de landing/demo, servido dentro de `apps/client`.

## Goal

Cerrar el ciclo de valor del producto (Journey 6: aprendizaje post-evento) y exponer el
proyecto públicamente para la comunidad / Builder Center, reutilizando la infraestructura de
despliegue ya existente.

## Expected Value

Completa la narrativa de producto de principio a fin (del contexto a los resultados tras el
evento) y da una cara pública al proyecto open source, sin reconstruir lo que INI-007 ya dejó
desplegado.

## Scope

- **Learning Report y ruta post-evento (Journey 6):** comparar el `KnowledgeProfile` inicial
  vs. el estado posterior al evento, identificar gaps cubiertos / parciales / pendientes y
  proponer una ruta de aprendizaje posterior. Reutiliza el dominio ya existente
  (`KnowledgeGap.status`, `Reflection`, el adapter de reflexión de WI-014).
- **Landing/demo pública dentro de `apps/client`:** una vista pública (explicación del
  producto, cómo lanzar la experiencia local autenticada, demo con datos de muestra/fixtures)
  servida por el deploy de Netlify ya existente. Sin exponer operaciones autenticadas de AWS
  Events desde el sitio público.

## Out of Scope

- **Observabilidad y controles de costo/seguridad de IA** → ahora en **INI-006**
  (WI-CANDIDATE-004). No se trabaja aquí.
- Montar hosting nuevo: Netlify ya publica `apps/client` (hecho en INI-007/WI-022).
- `apps/site` como aplicación separada: se descartó; la landing vive dentro de `apps/client`.
- Operaciones autenticadas de AWS Events desde el sitio público (viola el boundary de seguridad;
  esas operaciones son local-first).

## Success Criteria

- Tras el evento, el usuario puede ver un Learning Report que contrasta su perfil inicial con
  el posterior y lista gaps cubiertos/parciales/pendientes (Journey 6).
- Existe una ruta/landing pública en el deploy de Netlify que explica el producto y cómo
  lanzar la experiencia local, con una demo basada en fixtures (sin requerir login).
- `pnpm -r test` y `tsc -b` en verde.

## Dependencies

- Reutiliza WI-014 (reflexión/adaptación) y el dominio de INI-003/INI-004 para el Learning Report.
- Reutiliza el deploy de Netlify y `apps/client` de INI-007.
- No depende de INI-006 (IA real); el Learning Report puede operar en modo local-first/heurístico.

## Work Item Candidates

1. **WI-CANDIDATE-001** — Learning Report y ruta post-evento (Journey 6).
2. **WI-CANDIDATE-002** — Landing/demo pública dentro de `apps/client` para Builder Center.

(El antiguo candidato de observabilidad/costo de IA se trasladó a INI-006.)

## Open Questions

- [open] ¿El Learning Report entra en el MVP del hackathon o queda como extensión post-evento?
- [resolved] **Sitio público:** landing dentro de `apps/client` (no `apps/site` separado),
  porque Netlify ya despliega `apps/client`.

## Learning

_Captured on completion: what was delivered, what stayed out of scope, outcome reached._
