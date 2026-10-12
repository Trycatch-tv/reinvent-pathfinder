import React, { useState } from "react"
import {
  type ExecutionStage,
  type StageExecutionTrace,
  STAGE_DESCRIPTIONS,
} from "@pathfinder/domain"
import { Activity, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { colors, radii, spacing, typography } from "../theme/tokens.js"
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
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
        backgroundColor: colors.neutral.white,
        border: `1px solid ${colors.neutral.slate200}`,
        borderRadius: radii.lg,
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
          backgroundColor: colors.neutral.slate50,
          border: "none",
          cursor: "pointer",
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.neutral.slate700,
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={16} color={colors.brand.blue} />
          <span>Trazabilidad de Pipeline e IA</span>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              backgroundColor: colors.neutral.slate200,
              color: colors.neutral.slate700,
              padding: "1px 8px",
              borderRadius: radii.full,
              fontWeight: typography.fontWeight.normal,
            }}
          >
            {`${executedCount} / ${STAGES.length} etapas registradas`}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: typography.fontSize.xs, color: colors.neutral.slate500 }}>
          <span>{isExpanded ? "Ocultar" : "Expandir observabilidad"}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isExpanded && (
        <div style={{ padding: "1rem", backgroundColor: colors.neutral.white }}>
          <p
            style={{
              margin: "0 0 1rem 0",
              fontSize: typography.fontSize.xs,
              color: colors.neutral.slate600,
              lineHeight: 1.5,
            }}
          >
            Observabilidad técnica de los motores de inferencia ejecutados por etapa del Journey. Garantiza transparencia entre ejecución heurística y modelos reales de Amazon Bedrock.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {STAGES.map((stageKey) => {
              const trace = traces[stageKey]
              const info = STAGE_DESCRIPTIONS[stageKey]

              return (
                <div
                  key={stageKey}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.6rem 0.8rem",
                    backgroundColor: trace ? colors.neutral.slate50 : colors.neutral.white,
                    border: `1px solid ${trace ? colors.neutral.slate200 : colors.neutral.slate100}`,
                    borderRadius: radii.md,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ fontSize: typography.fontSize.xs, color: colors.brand.navy }}>
                        {info.name}
                      </strong>
                      <span style={{ fontSize: "0.7rem", color: colors.neutral.slate400 }}>
                        {`(${stageKey})`}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "3px 0 0 0",
                        fontSize: "0.72rem",
                        color: colors.neutral.slate600,
                        lineHeight: 1.4,
                      }}
                    >
                      {trace?.summary ?? info.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <AITraceBadge trace={trace} />
                    {trace?.executedAt && (
                      <span style={{ fontSize: "0.68rem", color: colors.neutral.slate400, display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={10} />
                        {new Date(trace.executedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
