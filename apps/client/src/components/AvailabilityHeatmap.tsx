import {
  projectSessionAvailability,
  type AvailabilityProjection,
  type AvailabilityProjectionFilters,
  type AvailabilityProjectedSession,
  type SessionAvailability,
  type SessionCandidate,
} from '@pathfinder/domain'
import React, { useMemo, useState } from 'react'

export interface AvailabilityHeatmapProps {
  readonly sessions: readonly SessionCandidate[]
  readonly availability: readonly SessionAvailability[]
  readonly initialSelectedSessionId?: string | null
}

export function createAvailabilityProjection(
  sessions: readonly SessionCandidate[],
  availability: readonly SessionAvailability[],
  filters: AvailabilityProjectionFilters,
): AvailabilityProjection {
  return projectSessionAvailability(sessions, availability, filters)
}

function statusLabel(status: AvailabilityProjectedSession['availability']['status']): string {
  const labels = {
    available: 'Disponible',
    limited: 'Disponibilidad limitada',
    full: 'Completa',
    'walk-up': 'Solo walk-up',
    unavailable: 'No disponible',
    unknown: 'Disponibilidad desconocida',
  } as const

  return labels[status]
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort()
}

function AvailabilityDetail({ selected }: { readonly selected: AvailabilityProjectedSession }) {
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
        <dt>Tipo</dt><dd>{session.format}</dd>
        <dt>Nivel</dt><dd>{session.level}</dd>
        <dt>Temas</dt><dd>{session.topics.join(', ') || 'Sin temas'}</dd>
        {availability.lastUpdatedAt && <><dt>Actualizado</dt><dd>{availability.lastUpdatedAt}</dd></>}
      </dl>
    </aside>
  )
}

export function AvailabilityHeatmap({
  sessions,
  availability,
  initialSelectedSessionId = null,
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

  const updateFilter = <Key extends keyof AvailabilityProjectionFilters>(key: Key, value: AvailabilityProjectionFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setSelectedSessionId(null)
  }

  return (
    <section aria-labelledby="availability-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 id="availability-heading" style={{ marginBottom: '0.25rem' }}>Disponibilidad de sesiones</h2>
          <p style={{ marginTop: 0, color: '#475569' }}>Demo local con datos de ejemplo; no consulta AWS Events.</p>
        </div>
        <a href="/">Volver a Pathfinder</a>
      </div>

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
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>Matriz de disponibilidad por horario y venue</caption>
          <thead><tr><th scope="col">Horario</th>{venues.map((venue) => <th key={venue} scope="col">{venue}</th>)}</tr></thead>
          <tbody>
            {rowKeys.map((rowKey) => {
              const [day, startTime] = rowKey.split('\u0000')
              return <tr key={rowKey}><th scope="row">{day} · {startTime}</th>{venues.map((venue) => {
                const group = projection.groups.find((candidate) => candidate.day === day && candidate.startTime === startTime && candidate.venue === venue)
                return <td key={venue}>{group?.sessions.map((item) => <button key={item.session.id} type="button" onClick={() => setSelectedSessionId(item.session.id)} aria-label={`${item.session.title}: ${statusLabel(item.availability.status)}`} style={{ display: 'block', marginBottom: '0.35rem' }}>{item.session.code} — {statusLabel(item.availability.status)}</button>) ?? '—'}</td>
              })}</tr>
            })}
          </tbody>
        </table>
      </div>
      {selected ? <AvailabilityDetail selected={selected} /> : <p>No hay sesiones que coincidan con los filtros.</p>}
    </section>
  )
}
