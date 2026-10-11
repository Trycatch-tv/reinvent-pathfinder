import React, { useState } from "react"
import {
  type ExecutionStage,
  type StageExecutionTrace,
  STAGE_DESCRIPTIONS,
} from "@pathfinder/domain"
import { AITraceBadge } from "./AITraceBadge.js"

export interface AITracePanelProps {
  readonly traces: Partial<Record<ExecutionStage, StageExecutionTrace>>
  readonly defaultExpanded?: boolean
}

const STAGES: readonly ExecutionStage[] = [
  "context_analysis",
  "session_ranking",
  "path_construction",
  "reflection_adaptation",
  "report_generation",
]

export const AITracePanel: React.FC<AITracePanelProps> = ({
  traces,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const executedCount = Object.keys(traces).length

  return (
    <div
      style={{
        marginTop: "2rem",
        marginBottom: "2rem",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          backgroundColor: "#f1f5f9",
          border: "none",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "#334155",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🔍 Trazabilidad de Pipeline e IA</span>
          <span
            style={{
              fontSize: "0.75rem",
              backgroundColor: "#e2e8f0",
              color: "#475569",
              padding: "2px 8px",
              borderRadius: "9999px",
            }}
          >
            {`${executedCount} / ${STAGES.length} etapas registradas`}
          </span>
        </span>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          {isExpanded ? "▲ Ocultar auditoría" : "▼ Ver auditoría"}
        </span>
      </button>

      {isExpanded && (
        <div style={{ padding: "1rem" }}>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#64748b" }}>
            Auditabilidad transparente de qué etapas utilizan inferencia generativa con Amazon Bedrock,
            cuáles usan heurísticas locales de contingencia y cuáles son reglas determinísticas.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {STAGES.map((stage) => {
              const info = STAGE_DESCRIPTIONS[stage]
              const trace = traces[stage]
              const isExecuted = Boolean(trace)

              return (
                <div
                  key={stage}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    backgroundColor: isExecuted ? "#ffffff" : "rgba(241, 245, 249, 0.5)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>
                        {info.name}
                      </span>
                      {trace ? (
                        <AITraceBadge trace={trace} />
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>(Pendiente de ejecución)</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                      {trace ? trace.summary : info.description}
                    </p>
                  </div>

                  {trace && (
                    <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {trace.durationMs !== undefined && <div>{`${trace.durationMs}ms`}</div>}
                      <div>{new Date(trace.executedAt).toLocaleTimeString()}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
