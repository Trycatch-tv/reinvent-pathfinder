import React from "react"
import type { StageExecutionTrace } from "@pathfinder/domain"
import { Cpu, Sparkles, Activity, Clock } from "lucide-react"

export interface AITraceBadgeProps {
  readonly trace?: StageExecutionTrace
  readonly fallbackEngine?: "bedrock" | "heuristic" | "deterministic"
}

export const AITraceBadge: React.FC<AITraceBadgeProps> = ({
  trace,
  fallbackEngine,
}) => {
  const engine = trace?.engine ?? fallbackEngine

  if (!engine) {
    return (
      <span
        data-testid="ai-trace-badge"
        title="Pendiente de ejecución en el journey"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 600,
          backgroundColor: "#f1f5f9",
          color: "#64748b",
          border: "1px solid #cbd5e1",
          cursor: "default",
        }}
      >
        <Clock size={11} />
        <span>Pendiente</span>
      </span>
    )
  }

  let label = "Determinístico"
  let bg = "rgba(16, 185, 129, 0.12)"
  let color = "#059669"
  let border = "1px solid #10b981"
  let icon = <Activity size={12} />

  if (engine === "bedrock") {
    const modelName = trace?.modelId
      ? trace.modelId.replace("us.", "").replace("anthropic.", "")
      : undefined
    label = modelName ? `Bedrock (${modelName})` : "Amazon Bedrock"
    bg = "rgba(139, 92, 246, 0.12)"
    color = "#7c3aed"
    border = "1px solid #8b5cf6"
    icon = <Sparkles size={12} />
  } else if (engine === "heuristic") {
    label = trace?.fallbackReason ? "Heurístico Local (Fallback)" : "Heurístico Local"
    bg = "rgba(245, 158, 11, 0.12)"
    color = "#d97706"
    border = "1px solid #f59e0b"
    icon = <Cpu size={12} />
  }

  return (
    <span
      data-testid="ai-trace-badge"
      title={
        trace?.summary ??
        (engine === "bedrock"
          ? "Ejecutado con Amazon Bedrock"
          : engine === "heuristic"
            ? "Ejecutado con motor heurístico local"
            : "Lógica determinística de negocio")
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: bg,
        color,
        border,
        cursor: "default",
      }}
    >
      {icon}
      <span>{label}</span>
      {trace?.durationMs !== undefined && (
        <span
          style={{
            opacity: 0.8,
            fontSize: "0.68rem",
            marginLeft: "2px",
            borderLeft: "1px solid currentColor",
            paddingLeft: "4px",
          }}
        >
          {`${trace.durationMs}ms`}
        </span>
      )}
    </span>
  )
}
