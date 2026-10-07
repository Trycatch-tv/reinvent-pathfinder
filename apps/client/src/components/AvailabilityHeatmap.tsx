import {
  projectSessionAvailability,
  type AvailabilityProjection,
  type AvailabilityProjectionFilters,
  type AvailabilityProjectedSession,
  type SessionAvailability,
  type SessionCandidate,
} from '@pathfinder/domain'
import type { UserScheduleResult } from '@pathfinder/events-client'
import React, { useMemo, useState } from 'react'

const availabilityVisuals = {
  available: { label: 'Disponible', background: '#dcfce7', border: '#15803d', color: '#14532d' },
  limited: { label: 'Disponibilidad limitada', background: '#fef9c3', border: '#ca8a04', color: '#713f12' },
  full: { label: 'Completa', background: '#fee2e2', border: '#b91c1c', color: '#7f1d1d' },
  'walk-up': { label: 'Solo walk-up', background: '#ffedd5', border: '#c2410c', color: '#7c2d12' },
  unavailable: { label: 'No disponible', background: '#e2e8f0', border: '#64748b', color: '#334155' },
  unknown: { label: 'Disponibilidad desconocida', background: '#f1f5f9', border: '#94a3b8', color: '#475569' },
} as const

export interface AvailabilityHeatmapProps {
  readonly sessions: readonly SessionCandidate[]
  readonly availability: readonly SessionAvailability[]
  readonly initialSelectedSessionId?: string | null
  readonly source?: 'fixture' | 'live'
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
  readonly onToggleReservation?: (sessionId: string, isReserved: boolean) => void
  readonly reservationMutationSessionId?: string | null
}

export function createAvailabilityProjection(
  sessions: readonly SessionCandidate[],
  availability: readonly SessionAvailability[],
  filters: AvailabilityProjectionFilters,
): AvailabilityProjection {
  return projectSessionAvailability(sessions, availability, filters)
}

function statusLabel(status: AvailabilityProjectedSession['availability']['status']): string {
  return availabilityVisuals[status].label
}

function AvailabilityLegend() {
  return (
    <section aria-label="Leyenda de disponibilidad" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.75rem 0' }}>
      {Object.entries(availabilityVisuals).map(([status, visual]) => (
        <span key={status} data-availability-status={status} style={{ background: visual.background, border: `1px solid ${visual.border}`, borderRadius: '999px', color: visual.color, fontSize: '0.85rem', padding: '0.2rem 0.5rem' }}>
          {visual.label}
        </span>
      ))}
    </section>
  )
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort()
}

function AvailabilityDetail({ selected, isFavorite, isReserved, onToggleFavorite, isMutatingFavorite, onToggleReservation, isMutatingReservation, reservationUnavailableMessage }: {
  readonly selected: AvailabilityProjectedSession
  readonly isFavorite: boolean
  readonly isReserved: boolean
  readonly onToggleFavorite?: () => void
  readonly isMutatingFavorite: boolean
  readonly onToggleReservation?: () => void
  readonly isMutatingReservation: boolean
  readonly reservationUnavailableMessage?: string
}) {
  const { session, availability } = selected

  return (
    <aside
      aria-live="polite"
      aria-label="Detalle de sesión"
      style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', marginTop: '1.5rem', background: '#fff' }}
    >
      <h3 style={{ marginTop: 0 }}>{session.code}: {session.title}</h3>
      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.4rem 1rem', margin: 0 }}>
        <dt>Horario</dt><dd>{session.schedule?.day} · {session.schedule?.startTime}–{session.schedule?.endTime}</dd>
        <dt>Ubicación</dt><dd>{session.location?.venue}{session.location?.room ? ` · ${session.location.room}` : ''}</dd>
        <dt>Disponibilidad</dt><dd>{statusLabel(availability.status)}</dd>
        <dt>Agenda</dt><dd>{isReserved ? 'Reservada' : 'Sin reserva'}{isFavorite ? ' · Favorita' : ''}</dd>
        <dt>Tipo</dt><dd>{session.format}</dd>
        <dt>Nivel</dt><dd>{session.level}</dd>
        <dt>Temas</dt><dd>{session.topics.join(', ') || 'Sin temas'}</dd>
        {availability.lastUpdatedAt && <><dt>Actualizado</dt><dd>{availability.lastUpdatedAt}</dd></>}
      </dl>
      {onToggleFavorite && <button type="button" onClick={onToggleFavorite} disabled={isMutatingFavorite}>{isMutatingFavorite ? 'Actualizando favorito…' : isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}</button>}
      {onToggleReservation && <button type="button" onClick={onToggleReservation} disabled={isMutatingReservation}>{isMutatingReservation ? 'Actualizando reserva…' : isReserved ? 'Cancelar reserva' : 'Reservar sesión'}</button>}
      {reservationUnavailableMessage && <p role="status">{reservationUnavailableMessage}</p>}
    </aside>
  )
}

export function AvailabilityHeatmap({
  sessions,
  availability,
  initialSelectedSessionId = null,
  source = 'fixture',
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
  const days = uniqueSorted(sessions.flatMap((session) => session.schedule ? [session.schedule.day] : []))
  const venues = uniqueSorted(sessions.flatMap((session) => session.location ? [session.location.venue] : []))
  const formats = uniqueSorted(sessions.map((session) => session.format))
  const levels = uniqueSorted(sessions.map((session) => String(session.level)))
  const [filters, setFilters] = useState<AvailabilityProjectionFilters>({})
  const projection = useMemo(
    () => createAvailabilityProjection(sessions, availability, filters),
    [sessions, availability, filters],
  )
  const projectedSessions = projection.groups.flatMap((group) => group.sessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSelectedSessionId)
  const selected = projectedSessions.find(({ session }) => session.id === selectedSessionId) ?? projectedSessions[0]
  const rowKeys = uniqueSorted(projection.groups.map((group) => `${group.day}\u0000${group.startTime}`))
  const favoriteIds = new Set(schedule?.favoriteSessionIds ?? [])
  const reservedIds = new Set(schedule?.reservedSessionIds ?? [])
  const scheduleEntries = sessions.flatMap((session) => {
    const isReserved = reservedIds.has(session.id)
    const isFavorite = favoriteIds.has(session.id)
    return isReserved || isFavorite ? [{ session, isReserved, isFavorite }] : []
  })
  const knownScheduleIds = new Set(scheduleEntries.map(({ session }) => session.id))
  const unresolvedScheduleCount = schedule
    ? [...new Set([...schedule.reservedSessionIds, ...schedule.favoriteSessionIds])].filter((id) => !knownScheduleIds.has(id)).length
    : 0

  const updateFilter = <Key extends keyof AvailabilityProjectionFilters>(key: Key, value: AvailabilityProjectionFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setSelectedSessionId(null)
  }

  return (
    <section aria-labelledby="availability-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 id="availability-heading" style={{ marginBottom: '0.25rem' }}>Disponibilidad de sesiones</h2>
          <p style={{ marginTop: 0, color: '#475569' }}>
            {source === 'live'
              ? `Snapshot live de AWS Events${snapshotAt ? ` observado el ${new Date(snapshotAt).toLocaleString()}` : ''}.`
              : 'Modo fixture local: configura el evento e inicia sesión para consultar AWS Events.'}
          </p>
          {liveStatus && <p aria-live="polite" role="status" style={{ marginBottom: 0, color: source === 'live' ? '#475569' : '#9f1239' }}>{liveStatus}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {onRefreshLive && <button type="button" onClick={onRefreshLive} disabled={!canRefreshLive || isRefreshing}>{isRefreshing ? 'Actualizando…' : 'Actualizar disponibilidad'}</button>}
          {onRefreshSchedule && <button type="button" onClick={onRefreshSchedule} disabled={!canRefreshSchedule || isRefreshingSchedule}>{isRefreshingSchedule ? 'Actualizando agenda…' : 'Actualizar mi agenda'}</button>}
          <button type="button" onClick={onReturnHome}>Volver a Pathfinder</button>
        </div>
      </div>

      {schedule && <section aria-label="Resumen de agenda" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', margin: '1rem 0' }}>
        <strong>Mi agenda</strong>: {schedule.reservedSessionIds.length} reserva(s), {schedule.favoriteSessionIds.length} favorito(s), {schedule.personalTime.length} bloque(s) personal(es). <span>Sincronizada el {new Date(schedule.lastSyncedAt).toLocaleString()}.</span>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Sesiones confirmadas</h3>
        {scheduleEntries.length ? <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {scheduleEntries.map(({ session, isReserved, isFavorite }) => <li key={session.id}><button type="button" onClick={() => setSelectedSessionId(session.id)}>{`${session.code} — ${session.title}`}</button> {isReserved ? '· Reservada' : ''}{isFavorite ? '· Favorita' : ''}</li>)}
        </ul> : <p style={{ marginBottom: 0 }}>No hay sesiones de tu agenda presentes en el catálogo cargado.</p>}
        {unresolvedScheduleCount > 0 && <p role="status" style={{ marginBottom: 0 }}>{`${unresolvedScheduleCount} sesión(es) de tu agenda aún no aparecen en el catálogo cargado.`}</p>}
      </section>}

      <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}>
        <legend>Filtros</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <label>Día <select aria-label="Filtrar por día" value={filters.day ?? ''} onChange={(event) => updateFilter('day', event.target.value || undefined)}><option value="">Todos</option>{days.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
          <label>Venue <select aria-label="Filtrar por venue" value={filters.venue ?? ''} onChange={(event) => updateFilter('venue', event.target.value || undefined)}><option value="">Todos</option>{venues.map((venue) => <option key={venue} value={venue}>{venue}</option>)}</select></label>
          <label>Tipo <select aria-label="Filtrar por tipo" value={filters.formats?.[0] ?? ''} onChange={(event) => updateFilter('formats', event.target.value ? [event.target.value as SessionCandidate['format']] : undefined)}><option value="">Todos</option>{formats.map((format) => <option key={format} value={format}>{format}</option>)}</select></label>
          <label>Nivel <select aria-label="Filtrar por nivel" value={filters.levels?.[0] ?? ''} onChange={(event) => updateFilter('levels', event.target.value ? [Number(event.target.value) as SessionCandidate['level']] : undefined)}><option value="">Todos</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
          <label>Estado <select aria-label="Filtrar por disponibilidad" value={filters.availability?.[0] ?? ''} onChange={(event) => updateFilter('availability', event.target.value ? [event.target.value as SessionAvailability['status']] : undefined)}><option value="">Todos</option><option value="available">Disponible</option><option value="limited">Disponibilidad limitada</option><option value="full">Completa</option><option value="walk-up">Solo walk-up</option><option value="unavailable">No disponible</option><option value="unknown">Desconocida</option></select></label>
          <button type="button" onClick={() => { setFilters({}); setSelectedSessionId(null) }}>Restablecer filtros</button>
        </div>
      </fieldset>

      <p aria-live="polite">{projectedSessions.length} sesión(es) visibles. Las sesiones sin señal confirmada muestran “Disponibilidad desconocida”.</p>
      <AvailabilityLegend />
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>Matriz de disponibilidad por horario y venue</caption>
          <thead><tr><th scope="col">Horario</th>{venues.map((venue) => <th key={venue} scope="col">{venue}</th>)}</tr></thead>
          <tbody>
            {rowKeys.map((rowKey) => {
              const [day, startTime] = rowKey.split('\u0000')
              return <tr key={rowKey}><th scope="row">{day} · {startTime}</th>{venues.map((venue) => {
                const group = projection.groups.find((candidate) => candidate.day === day && candidate.startTime === startTime && candidate.venue === venue)
                return <td key={venue}>{group?.sessions.map((item) => {
                  const isFavorite = favoriteIds.has(item.session.id)
                  const isReserved = reservedIds.has(item.session.id)
                  const agendaLabel = `${isReserved ? ' · Reservada' : ''}${isFavorite ? ' · Favorita' : ''}`
                  const visual = availabilityVisuals[item.availability.status]
                  return <button key={item.session.id} type="button" onClick={() => setSelectedSessionId(item.session.id)} aria-label={`${item.session.title}: ${statusLabel(item.availability.status)}${agendaLabel}`} data-availability-status={item.availability.status} style={{ background: visual.background, border: `1px solid ${visual.border}`, borderRadius: '4px', color: visual.color, display: 'block', fontWeight: 600, marginBottom: '0.35rem', minWidth: '8rem', padding: '0.35rem 0.5rem', textAlign: 'center' }}>{item.session.code} — {statusLabel(item.availability.status)}{isReserved ? ' · Reservada' : ''}{isFavorite ? ' · Favorita' : ''}</button>
                }) ?? '—'}</td>
              })}</tr>
            })}
          </tbody>
        </table>
      </div>
      {selected ? (() => {
        const isReserved = reservedIds.has(selected.session.id)
        const canReserve = selected.availability.isReservable === true && (selected.availability.status === 'available' || selected.availability.status === 'limited')
        return <AvailabilityDetail selected={selected} isFavorite={favoriteIds.has(selected.session.id)} isReserved={isReserved} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(selected.session.id, favoriteIds.has(selected.session.id)) : undefined} isMutatingFavorite={favoriteMutationSessionId === selected.session.id} onToggleReservation={onToggleReservation && (isReserved || canReserve) ? () => onToggleReservation(selected.session.id, isReserved) : undefined} isMutatingReservation={reservationMutationSessionId === selected.session.id} reservationUnavailableMessage={!isReserved && onToggleReservation && !canReserve ? 'Reservas aún no disponibles para esta sesión.' : undefined} />
      })() : <p>No hay sesiones que coincidan con los filtros.</p>}
    </section>
  )
}
