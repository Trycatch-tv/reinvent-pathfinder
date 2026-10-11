import React from "react"
import {
  type ExperienceMode,
  EXPERIENCE_MODE_POLICIES,
} from "@pathfinder/domain"

export interface ModeSelectorProps {
  readonly currentMode: ExperienceMode | null
  readonly onSelectMode: (mode: ExperienceMode) => void
  readonly isAuthenticated: boolean
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  isAuthenticated,
}) => {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px 0", color: "#f8fafc" }}>
          Elige tu Modo de Experiencia
        </h2>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>
          Define cómo Pathfinder obtendrá los datos, ejecutará el ciclo adaptativo y gestionará tus acciones.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Tarjeta Modo Demo */}
        <div
          onClick={() => onSelectMode("demo")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onSelectMode("demo")
            }
          }}
          style={{
            cursor: "pointer",
            background: currentMode === "demo" ? "rgba(56, 189, 248, 0.08)" : "#1e293b",
            border: currentMode === "demo" ? "2px solid #38bdf8" : "1px solid #334155",
            borderRadius: "10px",
            padding: "20px",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>
                🧪 {EXPERIENCE_MODE_POLICIES.demo.label}
              </span>
              {currentMode === "demo" && (
                <span
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  ACTIVO
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 12px 0", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {EXPERIENCE_MODE_POLICIES.demo.description}
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              <li>Sin credenciales ni llamadas reales a AWS</li>
              <li>12 sesiones y disponibilidad de muestra</li>
              <li>Favoritos y reservas simuladas en memoria</li>
              <li>Diagnóstico y ruta adaptativa inmediatos</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectMode("demo")
            }}
            style={{
              marginTop: "16px",
              background: currentMode === "demo" ? "#0284c7" : "#334155",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 16px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            {currentMode === "demo" ? "✓ Explorando en Demo" : "Comenzar en Demo"}
          </button>
        </div>

        {/* Tarjeta Modo Live */}
        <div
          onClick={() => onSelectMode("live")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onSelectMode("live")
            }
          }}
          style={{
            cursor: "pointer",
            background: currentMode === "live" ? "rgba(249, 115, 22, 0.08)" : "#1e293b",
            border: currentMode === "live" ? "2px solid #f97316" : "1px solid #334155",
            borderRadius: "10px",
            padding: "20px",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f97316" }}>
                🔴 {EXPERIENCE_MODE_POLICIES.live.label}
              </span>
              {currentMode === "live" && (
                <span
                  style={{
                    background: "#ea580c",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  ACTIVO
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 12px 0", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {EXPERIENCE_MODE_POLICIES.live.description}
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              <li>Requiere autenticación con AWS Builder ID</li>
              <li>Consulta disponibilidad oficial de AWS Events</li>
              <li>Sincroniza tu agenda personal real</li>
              <li>Reservas y favoritos confirmados en tiempo real</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectMode("live")
            }}
            style={{
              marginTop: "16px",
              background: currentMode === "live" ? "#ea580c" : "#334155",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 16px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            {currentMode === "live"
              ? isAuthenticated
                ? "✓ Conectado a Live"
                : "🔴 Activo (Iniciar Builder ID)"
              : "Iniciar en Live"}
          </button>
        </div>
      </div>
    </div>
  )
}
