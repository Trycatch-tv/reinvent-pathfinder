import type {
  KnowledgeGap,
  LearningPath,
  Reflection,
  ScheduleConflict,
  SessionRecommendation,
} from "@pathfinder/domain"
import React, { useMemo, useState } from "react"
import { ReflectionForm } from "./ReflectionForm.js"

interface LearningPathViewProps {
  readonly learningPath: LearningPath
  readonly recommendations: readonly SessionRecommendation[]
  /** Permite al usuario descartar un ítem; mantiene el control sobre la ruta. */
  readonly onDiscardItem?: (sessionId: string) => void
  /** Gaps vigentes, para asociar reflexiones a los que cubre cada sesión. */
  readonly gaps?: readonly KnowledgeGap[]
  readonly userId?: string
  /** Cierra el ciclo adaptativo: aplica la reflexión y recalcula la ruta. */
  readonly onReflectionSubmit?: (reflection: Reflection) => void
}

function conflictsForSession(
  sessionId: string,
  conflicts: readonly ScheduleConflict[],
): readonly ScheduleConflict[] {
  return conflicts.filter(
    (c) => c.sessionAId === sessionId || c.sessionBId === sessionId,
  )
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  learningPath,
  recommendations,
  onDiscardItem,
  gaps = [],
  userId = "local-user",
  onReflectionSubmit,
}) => {
  const recById = useMemo(
    () => new Map(recommendations.map((r) => [r.sessionId, r])),
    [recommendations],
  )
  const gapById = useMemo(() => new Map(gaps.map((g) => [g.id, g])), [gaps])

  const [discarded, setDiscarded] = useState<ReadonlySet<string>>(new Set())
  const [reflectingSessionId, setReflectingSessionId] = useState<string | null>(
    null,
  )

  const handleDiscard = (sessionId: string) => {
    setDiscarded((prev) => new Set(prev).add(sessionId))
    onDiscardItem?.(sessionId)
  }

  const handleReflectionSubmit = (reflection: Reflection) => {
    setReflectingSessionId(null)
    onReflectionSubmit?.(reflection)
  }

  const visibleItems = learningPath.items.filter(
    (i) => !discarded.has(i.sessionId),
  )
  const totalConflicts = learningPath.conflicts.length

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e1e4e8",
        borderRadius: "8px",
        padding: "1.2rem",
        marginTop: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          borderBottom: "1px solid #eee",
          paddingBottom: "0.8rem",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#161e2e" }}>
            Tu Learning Path ({visibleItems.length})
          </h3>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            Ruta priorizada según tus Knowledge Gaps y reconciliada con tu
            agenda
          </span>
        </div>
        <span
          style={{
            fontSize: "0.8rem",
            backgroundColor: totalConflicts > 0 ? "#fef3c7" : "#e2f0d9",
            color: totalConflicts > 0 ? "#b45309" : "#385723",
            padding: "0.3rem 0.6rem",
            borderRadius: "12px",
            fontWeight: "bold",
          }}
        >
          {totalConflicts > 0
            ? `${totalConflicts} conflicto(s) de agenda`
            : "Sin conflictos"}
        </span>
      </div>

      {visibleItems.length === 0 ? (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          No hay sesiones en tu ruta. Ajusta tu contexto o gaps para generar
          recomendaciones.
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}
        >
          {visibleItems.map((item) => {
            const rec = recById.get(item.sessionId)
            const itemConflicts = conflictsForSession(
              item.sessionId,
              learningPath.conflicts,
            )
            const hasConflict = itemConflicts.length > 0

            const relatedGaps = item.targetGapIds
              .map((id) => gapById.get(id))
              .filter((g): g is NonNullable<typeof g> => g !== undefined)

            return (
              <React.Fragment key={item.sessionId}>
                <div
                  style={{
                    border: hasConflict
                      ? "1px solid #fcd34d"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "0.8rem",
                    backgroundColor: hasConflict ? "#fffbeb" : "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#0284c7",
                          color: "#fff",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "10px",
                          minWidth: "1.2rem",
                          textAlign: "center",
                        }}
                      >
                        {item.order}
                      </span>
                      <strong style={{ fontSize: "1rem", color: "#111827" }}>
                        {rec?.title ?? item.sessionId}
                      </strong>
                      {rec?.sessionCode && (
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          ({rec.sessionCode})
                        </span>
                      )}
                    </div>

                    {rec?.explanation && (
                      <p
                        style={{
                          margin: "0 0 0.4rem 0",
                          fontSize: "0.85rem",
                          color: "#4b5563",
                        }}
                      >
                        {rec.explanation}
                      </p>
                    )}

                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Cubre {item.targetGapIds.length} gap(s)
                      {rec &&
                        `  ·  relevancia ${(rec.relevanceScore * 100).toFixed(0)}%`}
                    </div>

                    {hasConflict && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.78rem",
                          color: "#b45309",
                        }}
                      >
                        ⚠ Conflicto de agenda:{" "}
                        {itemConflicts
                          .map((c) => `${c.reason} (${c.overlapMinutes} min)`)
                          .join("; ")}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.3rem",
                      alignItems: "flex-end",
                    }}
                  >
                    {onReflectionSubmit && (
                      <button
                        type="button"
                        onClick={() =>
                          setReflectingSessionId(
                            reflectingSessionId === item.sessionId
                              ? null
                              : item.sessionId,
                          )
                        }
                        title="Registrar reflexión tras asistir a esta sesión"
                        style={{
                          background: "none",
                          border: "1px solid #cbd5e1",
                          borderRadius: "4px",
                          color: "#0284c7",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.5rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reflectingSessionId === item.sessionId
                          ? "Cerrar"
                          : "Reflexionar"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDiscard(item.sessionId)}
                      title="Descartar esta sesión de tu ruta"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#9ca3af",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        padding: "0.2rem 0.5rem",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {onReflectionSubmit &&
                  reflectingSessionId === item.sessionId && (
                    <ReflectionForm
                      sessionId={item.sessionId}
                      sessionTitle={rec?.title ?? item.sessionId}
                      userId={userId}
                      relatedGaps={relatedGaps}
                      onSubmit={handleReflectionSubmit}
                      onCancel={() => setReflectingSessionId(null)}
                    />
                  )}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
