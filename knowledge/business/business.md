---
type: business
project_state: new
generated_by: kaddo-bootstrap
template_version: 1
---

> Idioma del proyecto: **español**. Escribe este conocimiento en español. Mantén en inglés el código, los nombres de archivo, los comandos y las claves de configuración.

# Business Context

## Problem

AWS re:Invent concentra una gran cantidad de sesiones, workshops, chalk talks y actividades. El reto para un asistente no es únicamente encontrar contenido por tema, sino decidir **qué debería aprender según lo que está construyendo, qué conocimiento le hace falta y cómo debería ajustar su agenda a medida que aprende durante el evento**.

Las herramientas tradicionales de catálogo y planificación parten principalmente de filtros, intereses, roles o palabras clave. Ese enfoque no conecta de forma explícita el contexto real del proyecto del usuario con sus necesidades de aprendizaje, ni adapta las recomendaciones cuando el conocimiento del usuario cambia durante el evento.

re:Invent Pathfinder busca cerrar esa brecha conectando:

```text
Lo que estoy construyendo
        ↓
Lo que necesito aprender
        ↓
Lo que re:Invent puede enseñarme
        ↓
Qué debería hacer después
```

El proyecto también busca demostrar una forma abierta y reproducible de construir software asistido por IA, usando Knowledge-Driven Development (KDD), Kaddo, Kiro y contribuciones de la comunidad.

## Users

### Usuarios principales

Asistentes registrados a AWS re:Invent que tienen un objetivo técnico concreto, por ejemplo:

- developers;
- software architects;
- solutions architects;
- cloud engineers;
- DevOps / platform engineers;
- AI/ML builders;
- technical leaders;
- personas que están construyendo o evaluando soluciones sobre AWS.

El usuario principal no necesita conocer de antemano qué sesiones debe tomar. Debe poder explicar su proyecto, reto o intención de aprendizaje y recibir una ruta contextualizada.

### Actores secundarios

- Contribuidores open source que participan en el desarrollo, pruebas, documentación y evolución del proyecto.
- Comunidad de TryCatch.tv, que participa en el proceso de construcción y aprendizaje en público.
- Maintainers del proyecto, responsables de arquitectura, seguridad, calidad y operación de la solución.

## Business goals

1. **Aumentar el valor de aprendizaje de re:Invent para cada asistente.** Convertir el catálogo del evento en una experiencia contextualizada alrededor de lo que la persona está construyendo.
2. **Reducir el esfuerzo para decidir qué aprender y qué sesión tomar.** Pasar de navegar manualmente cientos de sesiones a recibir recomendaciones priorizadas y explicadas.
3. **Crear una experiencia adaptativa.** Permitir que el learning path cambie cuando el usuario registra qué aprendió, qué quedó pendiente y qué Knowledge Gaps siguen abiertos.
4. **Mantener al usuario en control.** Pathfinder recomienda, explica y ayuda a organizar; el asistente decide qué favoritar, reservar, cambiar o descartar.
5. **Validar un uso práctico de IA sobre datos reales de AWS Events.** Combinar lógica determinística, conocimiento semántico y agentes para producir recomendaciones útiles sin depender de un único prompt o de búsqueda por keywords.
6. **Construir un proyecto open source reutilizable.** Dejar código, decisiones de arquitectura, documentación, pruebas y aprendizajes disponibles para que otras personas puedan estudiar, contribuir o extender la solución.
7. **Usar el proyecto como caso real de Knowledge-Driven Development.** Aplicar Kaddo durante el ciclo de desarrollo para mantener alineados contexto, decisiones, roadmap, capacidades, Vertical Slices, Work Items y código.
8. **Entregar una solución competitiva para el re:Invent Event Catalog API Hackathon.** El hackathon funciona como escenario de validación y exposición, pero no debe condicionar el producto a una demo desechable.

## Constraints

### Restricciones del evento y del API

- El catálogo y la agenda personal dependen de AWS Events API.
- Para acceder a capacidades protegidas del evento, el usuario debe autenticarse con AWS Builder ID y estar registrado en el evento correspondiente.
- La autenticación utiliza OAuth 2.0 Authorization Code + PKCE con callback local; la experiencia autenticada debe considerar un flujo `localhost`.
- Los tokens de AWS Events no deben enviarse al backend de Pathfinder ni persistirse de forma insegura.
- Operaciones como reservas dependen de la disponibilidad y ventanas habilitadas por AWS Events API.
- AWS Events API es la fuente de verdad para catálogo, agenda, favoritos, reservas y personal time.

### Restricciones de alcance

- El MVP debe priorizar el ciclo de valor: contexto → Knowledge Gaps → recomendaciones → Learning Path → reflexión → adaptación.
- No se debe convertir el proyecto en un sistema de agenda genérico ni en un chatbot genérico.
- Se evitará infraestructura que no aporte valor probado al MVP.

### Restricciones técnicas y operacionales

- TypeScript será el lenguaje principal del proyecto.
- El sistema tendrá una arquitectura serverless.
- El estado operacional se almacenará en Amazon DynamoDB cuando requiera persistencia central.
- La capa agentic utilizará Strands Agents SDK, Amazon Bedrock AgentCore Runtime y modelos de Amazon Bedrock.
- El conocimiento semántico se apoyará en Amazon Bedrock Managed Knowledge Bases.
- La infraestructura tradicional de aplicación se desplegará con Serverless Framework; la estrategia IaC del bloque agentic se definirá de forma explícita antes de su implementación.
- Las llamadas a IA deben ser costo-conscientes: primero se reducirá el espacio de búsqueda mediante filtros determinísticos y luego se aplicará ranking semántico.
- Deben existir observabilidad, límites de consumo y alertas de costo desde las primeras versiones desplegadas.

### Restricciones de privacidad y seguridad

- Aplicar minimización de datos.
- No registrar access tokens, refresh tokens, authorization codes ni secretos.
- No enviar a los modelos más contexto del necesario para realizar el análisis o ranking.
- El conocimiento privado del proyecto del usuario no debe convertirse automáticamente en conocimiento compartido o público.

### Restricciones de desarrollo

- El proyecto se desarrollará open source y en público.
- Las contribuciones deben mantener trazabilidad entre capacidades, componentes, Vertical Slices, Work Items y cambios de código.
- Las decisiones arquitectónicas relevantes deben quedar documentadas y actualizar el conocimiento de Kaddo cuando corresponda.
