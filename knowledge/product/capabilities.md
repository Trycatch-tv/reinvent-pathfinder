---
type: capabilities
project_state: new
generated_by: kaddo-bootstrap
template_version: 1
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Capabilities

## Planned capabilities

Capacidades del MVP core, derivadas de los user journeys y el scope de producto. Todas en estado `planned`: el proyecto está en estado `new` y aún no existe implementación consolidada.

- [planned] **Captura de contexto del proyecto** — El usuario describe qué está construyendo, el reto que enfrenta o qué desea aprender. (Journey 1)
- [planned] **Generación del Knowledge Profile** — A partir del contexto se infieren tecnologías, dominios, AWS services y necesidades de aprendizaje, con posibilidad de revisión/edición por el usuario. (Journey 1)
- [planned] **Identificación y priorización de Knowledge Gaps** — Detectar y priorizar las brechas de conocimiento, revisables por el usuario. (Journey 1)
- [planned] **Ingesta y normalización del catálogo** — Obtener, paginar y normalizar el catálogo de AWS Events; representarlo semánticamente en Amazon Bedrock Managed Knowledge Bases. (Journey 2)
- [planned] **Recomendaciones explicables** — `Candidate Filtering` determinístico + scoring técnico + ranking contextual con Bedrock, con explicación de por qué cada sesión es relevante y qué gap cubre. (Journey 2)
- [planned] **Construcción del Learning Path** — Ruta priorizada que considera conocimiento, horario y conflictos; el usuario decide qué mantener, descartar o favoritar. (Journey 3)
- [planned] **Integración con la agenda de AWS Events** — OAuth 2.0 + PKCE con AWS Builder ID, lectura de agenda (`GetSchedule`), favoritos, detección de conflictos y reservas cuando la API lo habilite. (Journey 4)
- [planned] **Adaptación por reflexión post-sesión** — Capturar e interpretar reflexiones, actualizar estado/prioridad de los Knowledge Gaps y recalcular recomendaciones. (Journey 5)
- [planned] **Cierre del ciclo de aprendizaje** — Comparar perfil inicial vs. posterior al evento e identificar gaps cubiertos/parciales/pendientes. (Journey 6)

### Capacidades condicionadas / extendidas

- [planned] **Personal Time** — Reconciliación con bloques de tiempo personal del asistente.
- [planned] **Optimización básica por venue/horario** — Sujeta a validar que los datos de venue disponibles lo permitan.
- [planned] **Learning Report** — Reporte de aprendizaje y ruta post-evento; su inclusión en el MVP del hackathon está por decidir.
- [planned] **Demo / sitio público (Builder Center)** — `apps/site`; por definir si es app separada o vista dentro del frontend.

## Capability map

Las capacidades se encadenan en el ciclo de valor del producto:

```text
Captura de contexto
        ↓
Knowledge Profile ──► Knowledge Gaps
        ↓
Ingesta/normalización del catálogo (AWS Events + Managed KB)
        ↓
Recomendaciones explicables (filtros determinísticos → ranking Bedrock)
        ↓
Learning Path ◄──► Integración con agenda de AWS Events (conflictos, favoritos, reservas)
        ↓
Reflexión post-sesión
        ↓
Adaptación de recomendaciones  ──►  (repite el ciclo)
        ↓
Cierre del ciclo de aprendizaje (Learning Report)
```

Agrupación por área:

- **Experience** (client local-first): captura de contexto, visualización/edición de Knowledge Profile, Knowledge Gaps, Learning Path, captura de reflexiones.
- **AWS Events**: OAuth 2.0 + PKCE, catálogo + paginación, normalización, agenda, favoritos, conflictos, reservas.
- **Knowledge**: Knowledge Profile, Knowledge Gaps, ingesta semántica (Managed KB), persistencia operacional (DynamoDB).
- **Recommendations**: candidate filtering, scoring, ranking contextual, explicación, re-ranking tras cambios del journey.
- **Agentic / AI**: topología reducida (1–3 agentes) con tools para contexto, gaps, recomendaciones, schedule y adaptación.
- **Platform**: serverless (API Gateway + Lambda + DynamoDB), observabilidad, CI/CD, controles de costo y seguridad.

## Open questions

- [open] **Topología de capacidades agentic.** Cómo se agrupan las capacidades en 1–3 agentes (ver codebase: posible `Knowledge Agent`, `Recommendation/Journey Agent`, `Event Experience Agent`) sin crear un agente por capacidad.
- [open] **Learning Report en el MVP.** Si la capacidad de cierre de ciclo entra en el MVP del hackathon o queda como extensión post-evento.
- [open] **Optimización logística.** Si los datos de venue disponibles permiten una capacidad útil de optimización por desplazamiento.
- [open] **Public site.** Si la capacidad de demo pública (`apps/site`) es una app separada o una vista dentro del mismo frontend.
- [open] **Alcance de reservas.** Qué parte de la gestión de favoritos/reservas es viable según las ventanas y disponibilidad de AWS Events API durante el desarrollo.
