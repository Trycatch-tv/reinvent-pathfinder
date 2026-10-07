import React from 'react'
import type { LearningReport, GapCoverage } from '@pathfinder/ai-knowledge'

interface LearningReportViewProps {
  readonly report: LearningReport
}

const coverageVisuals: Record<GapCoverage, { label: string; bg: string; color: string }> = {
  covered: { label: 'Cubierto', bg: '#dcfce7', color: '#14532d' },
  partial: { label: 'Parcial', bg: '#fef9c3', color: '#713f12' },
  pending: { label: 'Pendiente', bg: '#fee2e2', color: '#7f1d1d' },
}

export const LearningReportView: React.FC<LearningReportViewProps> = ({ report }) => {
  const { counts, gaps, nextRoute } = report

  return (
    <section
      aria-label="Learning Report"
      style={{ backgroundColor: '#fff', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '1.2rem', marginTop: '1.5rem' }}
    >
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#161e2e' }}>Learning Report</h3>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>
          Tu progreso de aprendizaje al cierre del evento
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        <span style={{ background: coverageVisuals.covered.bg, color: coverageVisuals.covered.color, borderRadius: '8px', padding: '0.4rem 0.8rem', fontWeight: 'bold' }}>
          Cubiertos: {counts.covered}
        </span>
        <span style={{ background: coverageVisuals.partial.bg, color: coverageVisuals.partial.color, borderRadius: '8px', padding: '0.4rem 0.8rem', fontWeight: 'bold' }}>
          Parciales: {counts.partial}
        </span>
        <span style={{ background: coverageVisuals.pending.bg, color: coverageVisuals.pending.color, borderRadius: '8px', padding: '0.4rem 0.8rem', fontWeight: 'bold' }}>
          Pendientes: {counts.pending}
        </span>
        <span style={{ background: '#f1f5f9', color: '#334155', borderRadius: '8px', padding: '0.4rem 0.8rem', fontWeight: 'bold' }}>
          Total: {counts.total}
        </span>
      </div>

      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#4b5563' }}>Detalle por brecha</h4>
      {gaps.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>No hay brechas registradas en tu journey.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.2rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {gaps.map((gap) => {
            const visual = coverageVisuals[gap.coverage]
            return (
              <li key={gap.gapId} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 0.8rem' }}>
                <span style={{ background: visual.bg, color: visual.color, fontSize: '0.72rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                  {visual.label}
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{gap.topic}</strong>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: 'auto' }}>
                  {gap.initialStatus} → {gap.finalStatus}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#4b5563' }}>
        Ruta de aprendizaje posterior ({nextRoute.length})
      </h4>
      {nextRoute.length === 0 ? (
        <p style={{ color: '#15803d', fontWeight: 600 }}>¡Cerraste todas tus brechas! No queda ruta pendiente.</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {nextRoute.map((gap) => (
            <li key={gap.gapId} style={{ fontSize: '0.88rem', color: '#374151' }}>
              <strong>{gap.topic}</strong> <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>· {gap.severity}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
