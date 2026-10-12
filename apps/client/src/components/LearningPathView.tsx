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
import {
  Clock,
  MapPin,
  Star,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Trash2,
  Sparkles,
} from "lucide-react"
import { colors, radii, shadows, spacing, typography } from "../theme/tokens.js"
import { Badge } from "./ui/Badge.js"
import { Button } from "./ui/Button.js"
import { Card } from "./ui/Card.js"
import { Alert } from "./ui/Alert.js"
import { ReflectionForm } from "./ReflectionForm.js"

export interface LearningPathViewProps {
  readonly learningPath: LearningPath
  readonly recommendations: readonly SessionRecommendation[]
  readonly candidateSessions?: readonly SessionCandidate[]
  readonly onDiscardItem?: (sessionId: string) => void
  readonly gaps?: readonly KnowledgeGap[]
  readonly userId?: string
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

function formatScheduleTime(day?: string, startTime?: string, endTime?: string): string {
  if (!day) return "Horario a confirmar"
  const dateParts = day.split("-")
  const dayNum = dateParts[2] ? parseInt(dateParts[2], 10) : day
  return `${dayNum} Dic · ${startTime ?? ""} - ${endTime ?? ""} (PST)`
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
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())

  const toggleExpand = (sessionId: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

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
    <Card style={{ padding: spacing.lg, marginTop: spacing.lg }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.md,
          borderBottom: `1px solid ${colors.neutral.slate200}`,
          paddingBottom: spacing.md,
          flexWrap: "wrap",
          gap: spacing.sm,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <h3 style={{ margin: 0, fontSize: typography.fontSize.xl, color: colors.brand.navy, fontWeight: typography.fontWeight.bold }}>
              Tu Learning Path Personalizado
            </h3>
            <Badge variant="blue">{`${visibleItems.length} sesiones`}</Badge>
          </div>
          <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate600 }}>
            Ruta adaptativa priorizada por tus Knowledge Gaps y reconciliada con tu agenda oficial.
          </span>
        </div>

        <Badge
          variant={totalConflicts > 0 ? "warning" : "success"}
          style={{ fontSize: typography.fontSize.xs, padding: "4px 10px" }}
        >
          {totalConflicts > 0
            ? `${totalConflicts} conflicto(s) de agenda`
            : "Sin conflictos"}
        </Badge>
      </div>

      {/* Primary tier warning if 0 primary recommendations */}
      {primaryCount === 0 && (
        <Alert variant="warning" style={{ marginBottom: spacing.md }}>
          <strong>Aviso de Relevancia:</strong> No se encontraron sesiones en la <em>Ruta Principal</em> que aborden directamente brechas críticas con alta afinidad. Las sesiones disponibles se clasificaron como Alternativas o Exploratorias.
        </Alert>
      )}

      {/* Tabs de filtrado por categoría/tier */}
      <div
        role="tablist"
        aria-label="Filtro de relevancia"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: spacing.lg,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant={selectedTier === "all" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSelectedTier("all")}
          style={{ borderRadius: radii.full }}
        >
          {`Todas (${visibleItems.length})`}
        </Button>
        <Button
          variant={selectedTier === "primary" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSelectedTier("primary")}
          leftIcon={<Star size={13} />}
          style={{
            borderRadius: radii.full,
            backgroundColor: selectedTier === "primary" ? colors.semantic.success : undefined,
            borderColor: selectedTier === "primary" ? colors.semantic.success : undefined,
          }}
        >
          {`Principales (${primaryCount})`}
        </Button>
        <Button
          variant={selectedTier === "alternative" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSelectedTier("alternative")}
          style={{
            borderRadius: radii.full,
            backgroundColor: selectedTier === "alternative" ? colors.semantic.warning : undefined,
            borderColor: selectedTier === "alternative" ? colors.semantic.warning : undefined,
          }}
        >
          {`Alternativas (${alternativeCount})`}
        </Button>
        <Button
          variant={selectedTier === "exploratory" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSelectedTier("exploratory")}
          style={{ borderRadius: radii.full }}
        >
          {`Exploratorias (${exploratoryCount})`}
        </Button>
      </div>

      {/* Lista de Sesiones */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: colors.neutral.slate500, backgroundColor: colors.neutral.slate50, borderRadius: radii.md }}>
            No hay sesiones en la categoría seleccionada.
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const candidate = candidateById.get(item.sessionId)
            const rec = recById.get(item.sessionId)
            const itemConflicts = conflictsForSession(
              item.sessionId,
              learningPath.conflicts,
            )
            const hasConflict = itemConflicts.length > 0
            const tier = item.tier ?? "primary"
            const isExpanded = expandedCardIds.has(item.sessionId)

            const relatedGaps = item.targetGapIds
              .map((id) => gapById.get(id))
              .filter((g): g is KnowledgeGap => Boolean(g))

            const isFavorite = favoriteSet.has(item.sessionId)
            const isReserved = reservedSet.has(item.sessionId)
            const isMutatingFavorite = favoriteMutationSessionId === item.sessionId
            const isMutatingReservation = reservationMutationSessionId === item.sessionId

            const tierMeta = {
              primary: { label: "Principal", variant: "teal" as const, border: colors.semantic.successBorder },
              alternative: { label: "Alternativa", variant: "orange" as const, border: colors.semantic.warningBorder },
              exploratory: { label: "Exploratoria", variant: "gray" as const, border: colors.neutral.slate200 },
            }[tier]

            return (
              <div
                key={item.sessionId}
                style={{
                  border: `1px solid ${tierMeta.border}`,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  backgroundColor: colors.neutral.white,
                  boxShadow: shadows.sm,
                  transition: "all 0.15s ease",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm, flexWrap: "wrap", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: colors.brand.navyDark,
                        color: colors.neutral.white,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: typography.fontWeight.bold,
                      }}
                    >
                      {index + 1}
                    </span>
                    <Badge variant="blue">{rec?.sessionCode ?? candidate?.code ?? item.sessionId}</Badge>
                    <Badge variant={tierMeta.variant}>{tierMeta.label}</Badge>
                    {rec && (
                      <span style={{ fontSize: typography.fontSize.xs, color: colors.brand.blue, fontWeight: typography.fontWeight.semibold }}>
                        {`relevancia ${(rec.relevanceScore * 100).toFixed(0)}%`}
                      </span>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    {onToggleFavorite && (
                      <Button
                        variant={isFavorite ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onToggleFavorite(item.sessionId, isFavorite)}
                        disabled={isMutatingFavorite}
                        title={isFavorite ? "Quitar de favoritas" : "Marcar como favorita"}
                        leftIcon={<Bookmark size={13} />}
                        style={{
                          color: isFavorite ? colors.brand.orange : colors.neutral.slate600,
                          backgroundColor: isFavorite ? colors.brand.orangeMuted : undefined,
                        }}
                      >
                        {isFavorite ? "Favorita" : "Favorita"}
                      </Button>
                    )}

                    {onToggleReservation && (
                      <Button
                        variant={isReserved ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => onToggleReservation(item.sessionId, isReserved)}
                        disabled={isMutatingReservation}
                        leftIcon={<CheckCircle2 size={13} />}
                      >
                        {isReserved ? "Reservada" : "Reservar"}
                      </Button>
                    )}

                    {onReflectionSubmit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setReflectingSessionId(
                            reflectingSessionId === item.sessionId ? null : item.sessionId,
                          )
                        }
                        leftIcon={<MessageSquare size={13} />}
                      >
                        Reflexionar
                      </Button>
                    )}

                    {onDiscardItem && (
                      <button
                        type="button"
                        onClick={() => handleDiscard(item.sessionId)}
                        aria-label={`Descartar sesión ${candidate?.title ?? item.sessionId}`}
                        title="Descartar de la ruta"
                        style={{
                          border: "none",
                          background: "transparent",
                          color: colors.neutral.slate400,
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4 style={{ margin: "4px 0 8px 0", fontSize: typography.fontSize.base, color: colors.brand.navy, fontWeight: typography.fontWeight.bold }}>
                  {rec?.title ?? candidate?.title ?? item.sessionId}
                </h4>

                {/* Logistics & Gap Tags */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", fontSize: typography.fontSize.xs, color: colors.neutral.slate600, marginBottom: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} />
                    {formatScheduleTime(candidate?.schedule?.day, candidate?.schedule?.startTime, candidate?.schedule?.endTime)}
                  </span>
                  {candidate?.location && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={13} />
                      {`${candidate.location.venue}${candidate.location.room ? ` · ${candidate.location.room}` : ""}`}
                    </span>
                  )}
                  {candidate?.level && (
                    <span>{`Nivel ${candidate.level}`}</span>
                  )}
                  {candidate?.format && (
                    <span>{candidate.format}</span>
                  )}
                  {candidate?.capacityRemaining !== undefined && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {candidate.capacityRemaining > 0
                        ? `${candidate.capacityRemaining} cupos`
                        : "Lleno / Lista de espera"}
                    </span>
                  )}
                </div>

                {/* Covered Knowledge Gaps */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.neutral.slate500 }}>
                    {`Cubre ${item.targetGapIds.length} gap(s):`}
                  </span>
                    {relatedGaps.map((g) => (
                      <span
                        key={g.id}
                        style={{
                          backgroundColor: colors.brand.blueMuted,
                          color: colors.brand.blue,
                          fontSize: "0.72rem",
                          fontWeight: typography.fontWeight.medium,
                          padding: "2px 8px",
                          borderRadius: radii.sm,
                        }}
                      >
                        {g.topic}
                      </span>
                    ))}
                  </div>

                {/* Schedule conflict alert */}
                {hasConflict && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: colors.semantic.warningBg,
                      border: `1px solid ${colors.semantic.warningBorder}`,
                      color: colors.semantic.warning,
                      padding: "6px 10px",
                      borderRadius: radii.sm,
                      fontSize: typography.fontSize.xs,
                      marginBottom: "8px",
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>
                      Conflicto de horario:{" "}
                      {itemConflicts.map((c) => `${c.reason} (${c.overlapMinutes} min)`).join("; ")}
                    </span>
                  </div>
                )}

                {/* Visible Justification */}
                {rec?.explanation && (
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: typography.fontSize.xs,
                      color: colors.neutral.slate700,
                      lineHeight: 1.45,
                    }}
                  >
                    <strong style={{ color: colors.brand.navy }}>💡 Justificación: </strong>
                    {rec.explanation}
                  </p>
                )}

                {/* Toggle details disclosure */}
                <div style={{ borderTop: `1px solid ${colors.neutral.slate100}`, paddingTop: "6px", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.sessionId)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: colors.brand.blue,
                      cursor: "pointer",
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: 0,
                    }}
                  >
                    <span>{isExpanded ? "Ocultar justificación de IA y detalles" : "Ver justificación de IA y detalles técnicos"}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: "8px", backgroundColor: colors.neutral.slate50, padding: "0.75rem", borderRadius: radii.md, border: `1px solid ${colors.neutral.slate200}` }}>
                      {rec?.explanation && (
                        <div style={{ marginBottom: "6px" }}>
                          <strong style={{ fontSize: typography.fontSize.xs, color: colors.brand.navy, display: "flex", alignItems: "center", gap: "4px" }}>
                            <Sparkles size={12} color={colors.brand.orange} /> Justificación Contextual:
                          </strong>
                          <p style={{ margin: "2px 0 0 0", fontSize: typography.fontSize.xs, color: colors.neutral.slate700, lineHeight: 1.5 }}>
                            {rec.explanation}
                          </p>
                        </div>
                      )}
                      <p style={{ margin: "6px 0 0 0", fontSize: typography.fontSize.xs, color: colors.neutral.slate600, lineHeight: 1.4 }}>
                        <strong>Descripción:</strong> {candidate?.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Formulario de Reflexión */}
                {reflectingSessionId === item.sessionId && (
                  <div style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.neutral.slate200}` }}>
                    <ReflectionForm
                      sessionId={item.sessionId}
                      sessionTitle={candidate?.title ?? item.sessionId}
                      userId={userId}
                      relatedGaps={relatedGaps}
                      onSubmit={handleReflectionSubmit}
                      onCancel={() => setReflectingSessionId(null)}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
