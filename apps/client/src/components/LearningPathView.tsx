import type {
  KnowledgeGap,
  LearningPath,
  Reflection,
  RelevanceTier,
  ScheduleConflict,
  SessionCandidate,
  SessionRecommendation,
} from "@pathfinder/domain"
import React, { useMemo, useState } from "react"
import { ReflectionForm } from "./ReflectionForm.js"

export interface LearningPathViewProps {
  readonly learningPath: LearningPath
  readonly recommendations: readonly SessionRecommendation[]
  readonly candidateSessions?: readonly SessionCandidate[]
  /** Permite al usuario descartar un ítem; mantiene el control sobre la ruta. */
  readonly onDiscardItem?: (sessionId: string) => void
  /** Gaps vigentes, para asociar reflexiones a los que cubre cada sesión. */
  readonly gaps?: readonly KnowledgeGap[]
  readonly userId?: string
  /** Cierra el ciclo adaptativo: aplica la reflexión y recalcula la ruta. */
  readonly onReflectionSubmit?: (reflection: Reflection) => void
  readonly onToggleFavorite?: (sessionId: string, isFavorite: boolean) => void
  readonly favoriteSessionIds?: readonly string[]
  readonly favoriteMutationSessionId?: string | null
  readonly onToggleReservation?: (sessionId: string, isReserved: boolean) => void
  readonly reservedSessionIds?: readonly string[]
  readonly reservationMutationSessionId?: string | null
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
  candidateSessions = [],
  onDiscardItem,
  gaps = [],
  userId = "local-user",
  onReflectionSubmit,
  onToggleFavorite,
  favoriteSessionIds,
  favoriteMutationSessionId,
  onToggleReservation,
  reservedSessionIds,
  reservationMutationSessionId,
}) => {
  const recById = useMemo(
    () => new Map(recommendations.map((r) => [r.sessionId, r])),
    [recommendations],
  )
  const candidateById = useMemo(
    () => new Map(candidateSessions.map((c) => [c.id, c])),
    [candidateSessions],
  )
  const gapById = useMemo(() => new Map(gaps.map((g) => [g.id, g])), [gaps])
  const favoriteSet = useMemo(
    () => new Set(favoriteSessionIds ?? []),
    [favoriteSessionIds],
  )
  const reservedSet = useMemo(
    () => new Set(reservedSessionIds ?? []),
    [reservedSessionIds],
  )

  const [discarded, setDiscarded] = useState<ReadonlySet<string>>(new Set())
  const [reflectingSessionId, setReflectingSessionId] = useState<string | null>(
    null,
  )
  const [selectedTier, setSelectedTier] = useState<"all" | RelevanceTier>("all")

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

  const primaryCount = visibleItems.filter(
    (i) => (i.tier ?? "primary") === "primary",
  ).length
  const alternativeCount = visibleItems.filter(
    (i) => i.tier === "alternative",
  ).length
  const exploratoryCount = visibleItems.filter(
    (i) => i.tier === "exploratory",
  ).length

  const filteredItems = visibleItems.filter((i) => {
    if (selectedTier === "all") return true
    return (i.tier ?? "primary") === selectedTier
  })

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
          flexWrap: "wrap",
          gap: "0.5rem",
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

      {/* Tabs de filtrado por tier de relevancia */}
      <div
        role="tablist"
        aria-label="Filtro de relevancia"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "1.2rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedTier("all")}
          style={{
            padding: "5px 12px",
            fontSize: "0.85rem",
            borderRadius: "20px",
            border:
              selectedTier === "all"
                ? "1px solid #0284c7"
                : "1px solid #e2e8f0",
            backgroundColor: selectedTier === "all" ? "#0284c7" : "#f8fafc",
            color: selectedTier === "all" ? "#ffffff" : "#475569",
            fontWeight: selectedTier === "all" ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {`Todas (${visibleItems.length})`}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTier("primary")}
          style={{
            padding: "5px 12px",
            fontSize: "0.85rem",
            borderRadius: "20px",
            border:
              selectedTier === "primary"
                ? "1px solid #059669"
                : "1px solid #e2e8f0",
            backgroundColor:
              selectedTier === "primary" ? "#059669" : "#f8fafc",
            color: selectedTier === "primary" ? "#ffffff" : "#475569",
            fontWeight: selectedTier === "primary" ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {`⭐ Principales (${primaryCount})`}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTier("alternative")}
          style={{
            padding: "5px 12px",
            fontSize: "0.85rem",
            borderRadius: "20px",
            border:
              selectedTier === "alternative"
                ? "1px solid #d97706"
                : "1px solid #e2e8f0",
            backgroundColor:
              selectedTier === "alternative" ? "#d97706" : "#f8fafc",
            color: selectedTier === "alternative" ? "#ffffff" : "#475569",
            fontWeight: selectedTier === "alternative" ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {`🔄 Alternativas (${alternativeCount})`}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTier("exploratory")}
          style={{
            padding: "5px 12px",
            fontSize: "0.85rem",
            borderRadius: "20px",
            border:
              selectedTier === "exploratory"
                ? "1px solid #475569"
                : "1px solid #e2e8f0",
            backgroundColor:
              selectedTier === "exploratory" ? "#475569" : "#f8fafc",
            color: selectedTier === "exploratory" ? "#ffffff" : "#475569",
            fontWeight: selectedTier === "exploratory" ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {`🧭 Exploratorias (${exploratoryCount})`}
        </button>
      </div>

      {visibleItems.length === 0 ? (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          No hay sesiones en tu ruta. Ajusta tu contexto o gaps para generar
          recomendaciones.
        </p>
      ) : filteredItems.length === 0 ? (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          No hay sesiones en la categoría seleccionada.
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}
        >
          {filteredItems.map((item) => {
            const rec = recById.get(item.sessionId)
            const candidate = candidateById.get(item.sessionId)
            const itemConflicts = conflictsForSession(
              item.sessionId,
              learningPath.conflicts,
            )
            const hasConflict = itemConflicts.length > 0
            const tier = item.tier ?? "primary"

            const relatedGaps = item.targetGapIds
              .map((id) => gapById.get(id))
              .filter((g): g is NonNullable<typeof g> => g !== undefined)

            let tierBadgeColor = "#059669"
            let tierBadgeBg = "#ecfdf5"
            let tierBadgeBorder = "#a7f3d0"
            let tierLabel = "⭐ Principal"

            if (tier === "alternative") {
              tierBadgeColor = "#d97706"
              tierBadgeBg = "#fffbeb"
              tierBadgeBorder = "#fde68a"
              tierLabel = "🔄 Alternativa"
            } else if (tier === "exploratory") {
              tierBadgeColor = "#475569"
              tierBadgeBg = "#f8fafc"
              tierBadgeBorder = "#cbd5e1"
              tierLabel = "🧭 Exploratoria"
            }

            return (
              <React.Fragment key={item.sessionId}>
                <div
                  style={{
                    border: hasConflict
                      ? "1px solid #fcd34d"
                      : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "0.9rem",
                    backgroundColor: hasConflict ? "#fffbeb" : "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.4rem",
                        flexWrap: "wrap",
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
                        {rec?.title ?? candidate?.title ?? item.sessionId}
                      </strong>
                      {(rec?.sessionCode ?? candidate?.code) && (
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                          ({rec?.sessionCode ?? candidate?.code})
                        </span>
                      )}
                      <span
                        data-testid="relevance-tier-badge"
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: tierBadgeBg,
                          color: tierBadgeColor,
                          border: `1px solid ${tierBadgeBorder}`,
                          padding: "1px 8px",
                          borderRadius: "9999px",
                          fontWeight: 600,
                        }}
                      >
                        {tierLabel}
                      </span>
                    </div>

                    {/* Fila de información operativa */}
                    {(candidate || rec) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                          flexWrap: "wrap",
                          fontSize: "0.75rem",
                          color: "#475569",
                        }}
                      >
                        {candidate?.level && (
                          <span
                            style={{
                              backgroundColor: "#f1f5f9",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {`Nivel ${candidate.level}`}
                          </span>
                        )}
                        {candidate?.format && (
                          <span
                            style={{
                              backgroundColor: "#f1f5f9",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {candidate.format}
                          </span>
                        )}
                        {candidate?.schedule && (
                          <span
                            style={{
                              backgroundColor: "#f0fdf4",
                              color: "#166534",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {`📅 ${candidate.schedule.day} (${candidate.schedule.startTime} - ${candidate.schedule.endTime})`}
                          </span>
                        )}
                        {candidate?.location && (
                          <span
                            style={{
                              backgroundColor: "#f8fafc",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {`📍 ${candidate.location.venue}${candidate.location.room ? ` · ${candidate.location.room}` : ""}`}
                          </span>
                        )}
                        {candidate?.capacityRemaining !== undefined && (
                          <span
                            style={{
                              backgroundColor:
                                candidate.capacityRemaining > 0
                                  ? "#ecfdf5"
                                  : "#fef2f2",
                              color:
                                candidate.capacityRemaining > 0
                                  ? "#065f46"
                                  : "#991b1b",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            {candidate.capacityRemaining > 0
                              ? `🪑 ${candidate.capacityRemaining} cupos`
                              : "🚫 Lleno / Lista de espera"}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Justificación visible */}
                    {rec?.explanation && (
                      <p
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: "0.85rem",
                          color: "#334155",
                          lineHeight: 1.4,
                        }}
                      >
                        <strong style={{ color: "#0f172a" }}>💡 Justificación: </strong>
                        {rec.explanation}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        flexWrap: "wrap",
                        fontSize: "0.78rem",
                        color: "#6b7280",
                      }}
                    >
                      {rec && (
                        <span>
                          {`relevancia ${(rec.relevanceScore * 100).toFixed(0)}%`}
                        </span>
                      )}
                      <span>
                        <strong>Cubre:</strong> {item.targetGapIds.length} gap(s)
                      </span>
                      {relatedGaps.length > 0 && (
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          {relatedGaps.map((g) => (
                            <span
                              key={g.id}
                              style={{
                                backgroundColor: "#e0f2fe",
                                color: "#0369a1",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "0.72rem",
                              }}
                            >
                              {g.topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {hasConflict && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.78rem",
                          color: "#b45309",
                          backgroundColor: "#fef3c7",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        ⚠ Conflicto de agenda:{" "}
                        {itemConflicts
                          .map((c) => `${c.reason} (${c.overlapMinutes} min)`)
                          .join("; ")}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const isFavorite = favoriteSet.has(item.sessionId)
                    const isReserved = reservedSet.has(item.sessionId)
                    const isMutatingFavorite =
                      favoriteMutationSessionId === item.sessionId
                    const isMutatingReservation =
                      reservationMutationSessionId === item.sessionId

                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.4rem",
                          alignItems: "flex-end",
                          minWidth: "150px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "0.3rem",
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          {onToggleFavorite && (
                            <button
                              type="button"
                              onClick={() =>
                                onToggleFavorite(item.sessionId, isFavorite)
                              }
                              disabled={isMutatingFavorite}
                              title={
                                isFavorite
                                  ? "Quitar de tus favoritas"
                                  : "Marcar como favorita"
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                                background: isFavorite ? "#fef9c3" : "#f8fafc",
                                border: isFavorite
                                  ? "1px solid #facc15"
                                  : "1px solid #cbd5e1",
                                borderRadius: "4px",
                                color: isFavorite ? "#854d0e" : "#475569",
                                cursor: isMutatingFavorite ? "wait" : "pointer",
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.5rem",
                                fontWeight: isFavorite ? "600" : "normal",
                              }}
                            >
                              {isMutatingFavorite
                                ? "…"
                                : isFavorite
                                  ? "★ Favorita"
                                  : "☆ Favorita"}
                            </button>
                          )}

                          {onToggleReservation && (
                            <button
                              type="button"
                              onClick={() =>
                                onToggleReservation(item.sessionId, isReserved)
                              }
                              disabled={isMutatingReservation}
                              title={
                                isReserved
                                  ? "Cancelar tu reserva para esta sesión"
                                  : "Reservar asiento en AWS Events"
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                                background: isReserved ? "#dcfce7" : "#f0f9ff",
                                border: isReserved
                                  ? "1px solid #86efac"
                                  : "1px solid #bae6fd",
                                borderRadius: "4px",
                                color: isReserved ? "#166534" : "#0284c7",
                                cursor: isMutatingReservation
                                  ? "wait"
                                  : "pointer",
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.5rem",
                                fontWeight: isReserved ? "600" : "normal",
                              }}
                            >
                              {isMutatingReservation
                                ? "…"
                                : isReserved
                                  ? "✓ Reservada"
                                  : "🎟️ Reservar"}
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
                              padding: "0 0.2rem",
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </div>

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
                      </div>
                    )
                  })()}
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
