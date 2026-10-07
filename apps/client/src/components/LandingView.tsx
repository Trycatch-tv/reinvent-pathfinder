import React from "react"

interface LandingViewProps {
  readonly onNavigateDemo: () => void
  readonly onNavigateHome: () => void
}

const GITHUB_URL = "https://github.com/Trycatch-tv/reinvent-pathfinder"
const BUILDER_CENTER_URL = "https://builder.aws.com/"

interface JourneyStep {
  readonly id: number
  readonly title: string
  readonly description: string
}

const JOURNEYS: readonly JourneyStep[] = [
  {
    id: 1,
    title: "Describe tu contexto",
    description:
      "Cuéntale a Pathfinder qué estás construyendo. Extrae tus competencias actuales a partir de la iniciativa o reto arquitectónico que describas.",
  },
  {
    id: 2,
    title: "Diagnóstico de brechas",
    description:
      "Pathfinder determina qué conocimientos necesitas profundizar y prioriza las brechas por severidad.",
  },
  {
    id: 3,
    title: "Recomendaciones de sesiones",
    description:
      "El reranker heurístico ordena el catálogo de re:Invent según tus brechas, local-first y sin depender de la nube.",
  },
  {
    id: 4,
    title: "Learning Path reconciliado",
    description:
      "Se construye una ruta de aprendizaje que concilia las recomendaciones con tu agenda de sesiones.",
  },
  {
    id: 5,
    title: "Reflexión adaptativa",
    description:
      "Registra lo aprendido tras cada sesión; Pathfinder recalcula brechas, recomendaciones y la ruta.",
  },
  {
    id: 6,
    title: "Learning Report",
    description:
      "Al cierre del evento, obtienes un reporte que contrasta tus brechas iniciales con las finales y la ruta pendiente.",
  },
]

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigateDemo,
  onNavigateHome,
}) => {
  return (
    <section
      aria-label="Qué es Pathfinder"
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "1.5rem",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1.5rem", color: "#0f172a" }}>
        Qué es re:Invent Pathfinder
      </h2>
      <p style={{ color: "#334155", fontSize: "1rem", lineHeight: 1.6 }}>
        Pathfinder es un AI companion local-first que transforma el catálogo de
        sesiones de AWS re:Invent en una ruta de aprendizaje adaptativa a partir
        de lo que estás construyendo. Diagnostica tus brechas de conocimiento,
        recomienda sesiones, concilia tu agenda y cierra el ciclo con un reporte
        de aprendizaje.
      </p>

      <h3 style={{ fontSize: "1.15rem", color: "#0f172a", marginTop: "1.6rem" }}>
        El ciclo de valor
      </h3>
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}
      >
        {JOURNEYS.map((journey) => (
          <li
            key={journey.id}
            style={{
              display: "flex",
              gap: "0.75rem",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "0.7rem 0.9rem",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                flex: "0 0 auto",
                width: "1.8rem",
                height: "1.8rem",
                borderRadius: "50%",
                backgroundColor: "#ea580c",
                color: "#fff",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
              }}
            >
              {journey.id}
            </span>
            <div>
              <strong style={{ color: "#111827", fontSize: "0.95rem" }}>
                {journey.title}
              </strong>
              <p
                style={{
                  margin: "0.2rem 0 0 0",
                  color: "#475569",
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                }}
              >
                {journey.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <h3 style={{ fontSize: "1.15rem", color: "#0f172a", marginTop: "1.6rem" }}>
        Cómo lanzar la experiencia local
      </h3>
      <p style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>
        El flujo autenticado con AWS Builder ID es local-first: lo ejecutas en tu
        propia máquina. Clona el repositorio, instala dependencias y arranca el
        entorno de desarrollo:
      </p>
      <pre
        style={{
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          padding: "0.9rem 1rem",
          borderRadius: "6px",
          fontSize: "0.85rem",
          overflowX: "auto",
          margin: 0,
        }}
      >
        <code>{"pnpm install\npnpm dev"}</code>
      </pre>
      <p
        style={{
          color: "#64748b",
          fontSize: "0.82rem",
          marginTop: "0.5rem",
        }}
      >
        El cliente queda disponible en el puerto de desarrollo de Vite y el
        callback de Builder ID se resuelve en <code>/callback</code>.
      </p>

      <h3 style={{ fontSize: "1.15rem", color: "#0f172a", marginTop: "1.6rem" }}>
        Explora
      </h3>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginTop: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={onNavigateDemo}
          style={{
            padding: "0.7rem 1.3rem",
            backgroundColor: "#0284c7",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "0.92rem",
            cursor: "pointer",
          }}
        >
          Ver demo de disponibilidad →
        </button>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "0.7rem 1.3rem",
            backgroundColor: "#fff",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "0.92rem",
            textDecoration: "none",
          }}
        >
          Repositorio en GitHub
        </a>
        <a
          href={BUILDER_CENTER_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "0.7rem 1.3rem",
            backgroundColor: "#fff",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "0.92rem",
            textDecoration: "none",
          }}
        >
          AWS Builder Center
        </a>
      </div>
      <p style={{ marginTop: "1.2rem" }}>
        <a
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigateHome()
          }}
          style={{ fontSize: "0.9rem" }}
        >
          ← Volver al inicio
        </a>
      </p>
    </section>
  )
}
