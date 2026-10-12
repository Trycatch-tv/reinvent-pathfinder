import React, { useMemo, useState } from "react"
import {
  projectSessionAvailability,
  type AvailabilityProjection,
  type AvailabilityProjectionFilters,
  type SessionAvailability,
  type SessionCandidate,
} from "@pathfinder/domain"
import type { UserScheduleResult } from "@pathfinder/events-client"
import {
  Clock,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  X,
  Flame,
} from "lucide-react"
import { colors, radii, shadows, spacing, typography } from "../theme/tokens.js"
import { Badge } from "./ui/Badge.js"
import { Button } from "./ui/Button.js"
import { Card } from "./ui/Card.js"
import { Input } from "./ui/Input.js"
import { Select } from "./ui/Select.js"

const availabilityVisuals = {
  available: {
    label: "Disponible",
    background: "#dcfce7",
    border: "#86efac",
    color: "#166534",
    dot: "#22c55e",
  },
  limited: {
    label: "Limitada",
    background: "#fef9c3",
    border: "#fde047",
    color: "#854d0e",
    dot: "#eab308",
  },
  full: {
    label: "Completa",
    background: "#fee2e2",
    border: "#fca5a5",
    color: "#991b1b",
    dot: "#ef4444",
  },
  "walk-up": {
    label: "Solo walk-up",
    background: "#ffedd5",
    border: "#fdba74",
    color: "#9a3412",
    dot: "#f97316",
  },
  unavailable: {
    label: "No disponible",
    background: "#f1f5f9",
    border: "#cbd5e1",
    color: "#475569",
    dot: "#94a3b8",
  },
  unknown: {
    label: "Disponibilidad desconocida",
    background: "#f8fafc",
    border: "#e2e8f0",
    color: "#64748b",
    dot: "#cbd5e1",
  },
} as const

export interface AvailabilityHeatmapProps {
  readonly sessions: readonly SessionCandidate[]
  readonly availability: readonly SessionAvailability[]
  readonly initialSelectedSessionId?: string | null
  readonly source?: "fixture" | "live"
  readonly snapshotAt?: string
  readonly liveStatus?: string
  readonly isRefreshing?: boolean
  readonly canRefreshLive?: boolean
  readonly onRefreshLive?: () => void
  readonly onReturnHome?: () => void
  readonly schedule?: UserScheduleResult
  readonly isRefreshingSchedule?: boolean
  readonly canRefreshSchedule?: boolean
  readonly onRefreshSchedule?: () => void
  readonly onToggleFavorite?: (sessionId: string, isFavorite: boolean) => void
  readonly favoriteMutationSessionId?: string | null
  readonly onToggleReservation?: (
    sessionId: string,
    isReserved: boolean,
  ) => void
  readonly reservationMutationSessionId?: string | null
}

export function createAvailabilityProjection(
  sessions: readonly SessionCandidate[],
  availability: readonly SessionAvailability[],
  filters: AvailabilityProjectionFilters,
): AvailabilityProjection {
  return projectSessionAvailability(sessions, availability, filters)
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort()
}

function formatEventSchedule(day?: string, startTime?: string, endTime?: string): string {
  if (!day) return "Horario por definir"
  const dateParts = day.split("-")
  const dayNum = dateParts[2] ? parseInt(dateParts[2], 10) : day
  const monthName = "Dic"
  return `${dayNum} ${monthName} · ${startTime ?? ""} - ${endTime ?? ""} (PST / Las Vegas)`
}

export function AvailabilityHeatmap({
  sessions,
  availability,
  initialSelectedSessionId = null,
  source = "fixture",
  snapshotAt,
  liveStatus,
  isRefreshing = false,
  canRefreshLive = false,
  onRefreshLive,
  onReturnHome,
  schedule,
  isRefreshingSchedule = false,
  canRefreshSchedule = false,
  onRefreshSchedule,
  onToggleFavorite,
  favoriteMutationSessionId = null,
  onToggleReservation,
  reservationMutationSessionId = null,
}: AvailabilityHeatmapProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<AvailabilityProjectionFilters>({})
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSelectedSessionId,
  )

  const days = useMemo(
    () =>
      uniqueSorted(
        sessions.flatMap((s) => (s.schedule ? [s.schedule.day] : [])),
      ),
    [sessions],
  )
  const venues = useMemo(
    () =>
      uniqueSorted(
        sessions.flatMap((s) => (s.location ? [s.location.venue] : [])),
      ),
    [sessions],
  )
  const levels = useMemo(
    () => uniqueSorted(sessions.map((s) => String(s.level))),
    [sessions],
  )

  const projection = useMemo(
    () => createAvailabilityProjection(sessions, availability, filters),
    [sessions, availability, filters],
  )

  const rawProjected = useMemo(
    () => projection.groups.flatMap((g) => g.sessions),
    [projection],
  )

  // Filter by search term (code, title, topic)
  const projectedSessions = useMemo(() => {
    if (!searchTerm.trim()) return rawProjected
    const term = searchTerm.toLowerCase().trim()
    return rawProjected.filter(({ session }) => {
      const matchCode = session.code.toLowerCase().includes(term)
      const matchTitle = session.title.toLowerCase().includes(term)
      const matchTopic = session.topics.some((t) => t.toLowerCase().includes(term))
      return matchCode || matchTitle || matchTopic
    })
  }, [rawProjected, searchTerm])

  const selected = useMemo(() => {
    if (!selectedSessionId) return null
    const foundProjected = rawProjected.find(
      ({ session }) => session.id === selectedSessionId,
    )
    if (foundProjected) return foundProjected
    const foundSession = sessions.find((s) => s.id === selectedSessionId)
    if (!foundSession) return null
    const foundAvail = availability.find((a) => a.sessionId === selectedSessionId) ?? {
      sessionId: foundSession.id,
      status: "unknown" as const,
      capacityRemaining: 0,
    }
    return { session: foundSession, availability: foundAvail }
  }, [rawProjected, selectedSessionId, sessions, availability])

  const favoriteIds = useMemo(
    () => new Set(schedule?.favoriteSessionIds ?? []),
    [schedule],
  )
  const reservedIds = useMemo(
    () => new Set(schedule?.reservedSessionIds ?? []),
    [schedule],
  )

  const knownSessionIds = useMemo(() => new Set(sessions.map((s) => s.id)), [sessions])
  const unmatchedScheduleIds = useMemo(() => {
    const ids = new Set([
      ...(schedule?.reservedSessionIds ?? []),
      ...(schedule?.favoriteSessionIds ?? []),
    ])
    return Array.from(ids).filter((id) => !knownSessionIds.has(id))
  }, [schedule, knownSessionIds])

  // Metrics summary
  const metrics = useMemo(() => {
    let availableCount = 0
    let limitedCount = 0
    for (const item of rawProjected) {
      if (item.availability.status === "available") availableCount++
      if (item.availability.status === "limited") limitedCount++
    }
    return {
      available: availableCount,
      limited: limitedCount,
      reserved: reservedIds.size,
      favorites: favoriteIds.size,
    }
  }, [rawProjected, reservedIds, favoriteIds])

  const rowKeys = useMemo(
    () =>
      uniqueSorted(
        projection.groups.map((group) => `${group.day}\u0000${group.startTime}`),
      ),
    [projection],
  )

  const updateFilter = <Key extends keyof AvailabilityProjectionFilters>(
    key: Key,
    value: AvailabilityProjectionFilters[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({})
    setSearchTerm("")
    setSelectedSessionId(null)
  }

  return (
    <section aria-labelledby="availability-heading" style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      {/* Top Header Card */}
      <Card style={{ padding: spacing.lg }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: spacing.md,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: radii.md,
                  backgroundColor: colors.brand.orangeMuted,
                  color: colors.brand.orange,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flame size={18} />
              </div>
              <h2
                id="availability-heading"
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.brand.navy,
                }}
              >
                Disponibilidad de sesiones
              </h2>
              <Badge variant={source === "live" ? "orange" : "blue"}>
                {source === "live" ? "AWS Events Live" : "Modo fixture local"}
              </Badge>
            </div>
            <p style={{ margin: 0, color: colors.neutral.slate600, fontSize: typography.fontSize.xs }}>
              {source === "live"
                ? `Sincronizado con AWS Events en tiempo real. Última actualización: ${snapshotAt ? formatEventSchedule(snapshotAt.split("T")[0], snapshotAt.split("T")[1]?.slice(0, 5)) : "reciente"}.`
                : "Catálogo y proyecciones simuladas en modo local-first para exploración."}
            </p>
            {liveStatus && (
              <p
                role="status"
                style={{
                  margin: "6px 0 0 0",
                  fontSize: typography.fontSize.xs,
                  color: colors.brand.blue,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {liveStatus}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {onReturnHome && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onReturnHome}
                leftIcon={<ArrowLeft size={14} />}
              >
                Volver al Journey
              </Button>
            )}
            {onRefreshLive && (
              <Button
                variant="primary"
                size="sm"
                onClick={onRefreshLive}
                disabled={!canRefreshLive || isRefreshing}
                isLoading={isRefreshing}
                leftIcon={<RefreshCw size={14} />}
                title={
                  !canRefreshLive
                    ? "Inicia sesión con AWS Builder ID para actualizar en vivo."
                    : undefined
                }
              >
                {isRefreshing ? "Actualizando…" : "Actualizar disponibilidad"}
              </Button>
            )}
            {onRefreshSchedule && canRefreshSchedule && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefreshSchedule}
                disabled={isRefreshingSchedule}
                isLoading={isRefreshingSchedule}
                leftIcon={<RefreshCw size={14} />}
              >
                Actualizar agenda
              </Button>
            )}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: spacing.sm,
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.neutral.slate200}`,
          }}
        >
          <div style={{ padding: "0.6rem 0.8rem", backgroundColor: colors.neutral.slate50, borderRadius: radii.md, border: `1px solid ${colors.neutral.slate200}` }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500, fontWeight: typography.fontWeight.medium }}>Disponibles</span>
            <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.semantic.success }}>
              {metrics.available}
            </div>
          </div>
          <div style={{ padding: "0.6rem 0.8rem", backgroundColor: colors.neutral.slate50, borderRadius: radii.md, border: `1px solid ${colors.neutral.slate200}` }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500, fontWeight: typography.fontWeight.medium }}>Cupos Limitados</span>
            <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.semantic.warning }}>
              {metrics.limited}
            </div>
          </div>
          <div style={{ padding: "0.6rem 0.8rem", backgroundColor: colors.neutral.slate50, borderRadius: radii.md, border: `1px solid ${colors.neutral.slate200}` }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500, fontWeight: typography.fontWeight.medium }}>Mi agenda · Sesiones confirmadas</span>
            <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.brand.blue }}>
              {metrics.reserved}
            </div>
          </div>
          <div style={{ padding: "0.6rem 0.8rem", backgroundColor: colors.neutral.slate50, borderRadius: radii.md, border: `1px solid ${colors.neutral.slate200}` }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500, fontWeight: typography.fontWeight.medium }}>Favoritos</span>
            <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.brand.orange }}>
              {metrics.favorites}
            </div>
          </div>
        </div>

        {unmatchedScheduleIds.length > 0 && (
          <div style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.neutral.slate200}` }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.warning, fontWeight: typography.fontWeight.medium }}>
              {`${unmatchedScheduleIds.length} sesión(es) de tu agenda aún no aparecen en el catálogo cargado.`}
            </span>
          </div>
        )}
      </Card>

      {/* Filter Toolbar */}
      <Card style={{ padding: spacing.md }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.75rem" }}>
          <Filter size={15} color={colors.neutral.slate600} />
          <strong style={{ fontSize: typography.fontSize.xs, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.neutral.slate600 }}>
            Filtros de Búsqueda y Proyección
          </strong>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: spacing.sm,
            alignItems: "flex-end",
          }}
        >
          <Input
            label="Buscar sesión"
            placeholder="Código, título, tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={14} />}
          />

          <Select
            label="Día"
            aria-label="Filtrar por día"
            value={filters.day ?? ""}
            onChange={(e) => updateFilter("day", e.target.value || undefined)}
            options={[
              { value: "", label: "Todos los días" },
              ...days.map((d) => ({ value: d, label: formatEventSchedule(d) })),
            ]}
          />

          <Select
            label="Sede / Venue"
            aria-label="Filtrar por venue"
            value={filters.venue ?? ""}
            onChange={(e) => updateFilter("venue", e.target.value || undefined)}
            options={[
              { value: "", label: "Todas las sedes" },
              ...venues.map((v) => ({ value: v, label: v })),
            ]}
          />

          <Select
            label="Nivel Técnico"
            aria-label="Filtrar por nivel"
            value={filters.levels?.[0] ? String(filters.levels[0]) : ""}
            onChange={(e) =>
              updateFilter(
                "levels",
                e.target.value
                  ? [Number(e.target.value) as SessionCandidate["level"]]
                  : undefined,
              )
            }
            options={[
              { value: "", label: "Todos los niveles" },
              ...levels.map((l) => ({ value: l, label: `Nivel ${l}` })),
            ]}
          />

          <Select
            label="Disponibilidad"
            aria-label="Filtrar por disponibilidad"
            value={filters.availability?.[0] ?? ""}
            onChange={(e) =>
              updateFilter(
                "availability",
                e.target.value
                  ? [e.target.value as SessionAvailability["status"]]
                  : undefined,
              )
            }
            options={[
              { value: "", label: "Cualquier estado" },
              { value: "available", label: "Disponible" },
              { value: "limited", label: "Cupos limitados" },
              { value: "full", label: "Completa" },
              { value: "walk-up", label: "Solo walk-up" },
              { value: "unavailable", label: "No disponible" },
              { value: "unknown", label: "Desconocida" },
            ]}
          />

          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Restablecer
            </Button>
          </div>
        </div>
      </Card>

      {/* Leyenda Visual */}
      <div
        aria-label="Leyenda de disponibilidad"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "0.4rem 0.6rem",
          backgroundColor: colors.neutral.white,
          borderRadius: radii.md,
          border: `1px solid ${colors.neutral.slate200}`,
          fontSize: typography.fontSize.xs,
        }}
      >
        <span style={{ fontWeight: typography.fontWeight.semibold, color: colors.neutral.slate600 }}>
          Leyenda:
        </span>
        {Object.entries(availabilityVisuals).map(([key, visual]) => (
          <div
            key={key}
            data-availability-status={key}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: visual.dot,
              }}
            />
            <span style={{ color: colors.neutral.slate700 }}>{visual.label}</span>
          </div>
        ))}
      </div>

      {/* Main Heatmap Matrix */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: typography.fontSize.xs,
              textAlign: "left",
            }}
          >
            <caption style={{ textAlign: "left", padding: "1rem", fontWeight: typography.fontWeight.bold, color: colors.brand.navy }}>
              Matriz de disponibilidad por horario y venue ({projectedSessions.length} sesiones encontradas)
            </caption>
            <thead>
              <tr style={{ backgroundColor: colors.neutral.slate100, borderBottom: `2px solid ${colors.neutral.slate300}` }}>
                <th
                  scope="col"
                  style={{
                    padding: "0.75rem 1rem",
                    fontWeight: typography.fontWeight.bold,
                    color: colors.neutral.slate700,
                    width: "160px",
                  }}
                >
                  Horario (PST)
                </th>
                {venues.map((venue) => (
                  <th
                    key={venue}
                    scope="col"
                    style={{
                      padding: "0.75rem 1rem",
                      fontWeight: typography.fontWeight.bold,
                      color: colors.neutral.slate700,
                      minWidth: "180px",
                    }}
                  >
                    {venue}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowKeys.map((rowKey, rowIdx) => {
                const [day, startTime] = rowKey.split("\u0000")
                return (
                  <tr
                    key={rowKey}
                    style={{
                      backgroundColor: rowIdx % 2 === 0 ? colors.neutral.white : colors.neutral.slate50,
                      borderBottom: `1px solid ${colors.neutral.slate200}`,
                    }}
                  >
                    <th
                      scope="row"
                      style={{
                        padding: "0.75rem 1rem",
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.brand.navy,
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{day}</span>
                        <span style={{ color: colors.neutral.slate500, fontWeight: "normal" }}>{startTime}</span>
                      </div>
                    </th>
                    {venues.map((venue) => {
                      const group = projection.groups.find(
                        (c) =>
                          c.day === day &&
                          c.startTime === startTime &&
                          c.venue === venue,
                      )
                      const matchingInSearch = group?.sessions.filter((s) =>
                        projectedSessions.some((p) => p.session.id === s.session.id),
                      )

                      return (
                        <td
                          key={venue}
                          style={{
                            padding: "0.5rem 0.75rem",
                            verticalAlign: "top",
                          }}
                        >
                          {matchingInSearch && matchingInSearch.length > 0 ? (
                            matchingInSearch.map((item) => {
                              const isFav = favoriteIds.has(item.session.id)
                              const isRes = reservedIds.has(item.session.id)
                              const visual =
                                availabilityVisuals[item.availability.status]
                              const isSelected = selectedSessionId === item.session.id

                              return (
                                <button
                                  key={item.session.id}
                                  type="button"
                                  onClick={() => setSelectedSessionId(item.session.id)}
                                  aria-label={`${item.session.title}: ${visual.label}`}
                                  data-availability-status={item.availability.status}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    marginBottom: "0.4rem",
                                    padding: "0.5rem 0.6rem",
                                    backgroundColor: visual.background,
                                    border: isSelected ? `2px solid ${colors.brand.blue}` : `1px solid ${visual.border}`,
                                    borderRadius: radii.md,
                                    color: visual.color,
                                    textAlign: "left",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    boxShadow: isSelected ? shadows.sm : "none",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                                    <strong style={{ fontSize: typography.fontSize.xs }}>
                                      {item.session.code}
                                    </strong>
                                    <span style={{ fontSize: "0.7rem", fontWeight: typography.fontWeight.semibold }}>
                                      {visual.label}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: colors.neutral.slate700,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {item.session.title}
                                  </div>
                                  {(isRes || isFav) && (
                                    <div style={{ display: "flex", gap: "4px", marginTop: "3px" }}>
                                      {isRes && (
                                        <span style={{ fontSize: "0.65rem", backgroundColor: colors.brand.blue, color: colors.neutral.white, padding: "1px 4px", borderRadius: "3px" }}>
                                          Reservada
                                        </span>
                                      )}
                                      {isFav && (
                                        <span style={{ fontSize: "0.65rem", backgroundColor: colors.brand.orange, color: colors.neutral.white, padding: "1px 4px", borderRadius: "3px" }}>
                                          Favorita
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </button>
                              )
                            })
                          ) : (
                            <span style={{ color: colors.neutral.slate400 }}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drawer / Contextual Modal for Selected Session */}
      {selected && (
        <aside
          aria-live="polite"
          aria-label="Detalle de sesión seleccionada"
          style={{
            backgroundColor: colors.neutral.white,
            border: `2px solid ${colors.brand.blue}`,
            borderRadius: radii.xl,
            padding: spacing.lg,
            boxShadow: shadows.md,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Badge variant="blue">{selected.session.code}</Badge>
                <Badge variant={selected.availability.status === "available" ? "teal" : selected.availability.status === "limited" ? "orange" : "gray"}>
                  {availabilityVisuals[selected.availability.status].label}
                </Badge>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500 }}>
                  Nivel {selected.session.level} · {selected.session.format}
                </span>
              </div>
              <h3 style={{ margin: "4px 0", fontSize: typography.fontSize.lg, color: colors.brand.navy }}>
                {`${selected.session.code} — ${selected.session.title}`}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSessionId(null)}
              aria-label="Cerrar detalle"
              style={{
                border: "none",
                background: "transparent",
                color: colors.neutral.slate400,
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={18} />
            </button>
          </div>

          <p style={{ fontSize: typography.fontSize.sm, color: colors.neutral.slate700, lineHeight: 1.5, margin: "0 0 1rem 0" }}>
            {selected.session.description}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: spacing.sm,
              backgroundColor: colors.neutral.slate50,
              padding: spacing.md,
              borderRadius: radii.md,
              marginBottom: spacing.md,
              border: `1px solid ${colors.neutral.slate200}`,
            }}
          >
            <div>
              <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500, display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={12} /> Horario Oficial
              </span>
              <strong style={{ fontSize: typography.fontSize.xs, color: colors.brand.navy }}>
                {formatEventSchedule(selected.session.schedule?.day, selected.session.schedule?.startTime, selected.session.schedule?.endTime)}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500, display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={12} /> Sede y Sala
              </span>
              <strong style={{ fontSize: typography.fontSize.xs, color: colors.brand.navy }}>
                {selected.session.location?.venue} {selected.session.location?.room ? `· ${selected.session.location.room}` : ""}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500 }}>
                Temas Clave
              </span>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate700 }}>
                {selected.session.topics.join(", ") || "General"}
              </div>
            </div>

            <div>
              <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500 }}>
                Estado en tu Agenda
              </span>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.brand.navy, fontWeight: typography.fontWeight.semibold }}>
                {reservedIds.has(selected.session.id) ? "✓ Reservada" : "Sin reserva"}
                {favoriteIds.has(selected.session.id) ? " · ★ Favorita" : ""}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            {onToggleFavorite && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  onToggleFavorite(selected.session.id, favoriteIds.has(selected.session.id))
                }
                disabled={favoriteMutationSessionId === selected.session.id}
                leftIcon={<Bookmark size={14} />}
              >
                {favoriteMutationSessionId === selected.session.id
                  ? "Actualizando favorito…"
                  : favoriteIds.has(selected.session.id)
                    ? "Quitar de favoritos"
                    : "Guardar como favorita"}
              </Button>
            )}

            {onToggleReservation &&
              (selected.availability.status === "available" ||
              selected.availability.status === "limited" ? (
                <Button
                  variant={reservedIds.has(selected.session.id) ? "secondary" : "primary"}
                  size="sm"
                  onClick={() =>
                    onToggleReservation(selected.session.id, reservedIds.has(selected.session.id))
                  }
                  disabled={reservationMutationSessionId === selected.session.id}
                  leftIcon={<CheckCircle2 size={14} />}
                >
                  {reservationMutationSessionId === selected.session.id
                    ? "Actualizando reserva…"
                    : reservedIds.has(selected.session.id)
                      ? "Cancelar reserva"
                      : "Reservar cupo"}
                </Button>
              ) : (
                <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500 }}>
                  Reservas aún no disponibles para esta sesión.
                </span>
              ))}
          </div>
        </aside>
      )}
    </section>
  )
}
