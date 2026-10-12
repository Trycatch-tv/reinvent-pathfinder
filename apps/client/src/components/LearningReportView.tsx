import React, { useState } from 'react'
import type { LearningReport, GapCoverage } from '@pathfinder/ai-knowledge'

export interface LearningReportViewProps {
  readonly report: LearningReport
}

const coverageVisuals: Record<GapCoverage, { label: string; bg: string; color: string }> = {
  covered: { label: 'Cubierto', bg: '#dcfce7', color: '#14532d' },
  partial: { label: 'Parcial', bg: '#fef9c3', color: '#713f12' },
  pending: { label: 'Pendiente', bg: '#fee2e2', color: '#7f1d1d' },
}

export const LearningReportView: React.FC<LearningReportViewProps> = ({ report }) => {
  const { counts, coveragePercentage, executiveSummary, gaps, nextRoute, reflectionsSummary } = report
  const [copied, setCopied] = useState(false)

  const handleCopyMarkdown = () => {
    const lines: string[] = [
      `# re:Invent Pathfinder — Learning Report`,
      ``,
      `**Fecha:** ${new Date(report.generatedAt).toLocaleDateString()}`,
      `**Cobertura Efectiva:** ${coveragePercentage}%`,
      `**Resumen Ejecutivo:** ${executiveSummary}`,
      ``,
      `## Métricas`,
      `- Cubiertos: ${counts.covered}`,
      `- Parciales: ${counts.partial}`,
      `- Pendientes: ${counts.pending}`,
      `- Total Brechas: ${counts.total}`,
      ``,
    ]

    if (reflectionsSummary.keyActionItems.length > 0) {
      lines.push(`## Compromisos de Implementación en el Proyecto`)
      reflectionsSummary.keyActionItems.forEach((item) => {
        lines.push(`- ${item}`)
      })
      lines.push(``)
    }

    if (reflectionsSummary.items.length > 0) {
      lines.push(`## Reflexiones Documentadas (${reflectionsSummary.totalReflections})`)
      reflectionsSummary.items.forEach((r, idx) => {
        lines.push(`### Sesión ${idx + 1}: ${r.sessionId} (★ ${r.rating}/5)`)
        lines.push(`- **Aprendizaje:** ${r.takeaways}`)
        if (r.actionItem) {
          lines.push(`- **Acción:** ${r.actionItem}`)
        }
      })
      lines.push(``)
    }

    lines.push(`## Detalle por Brecha`)
    gaps.forEach((g) => {
      lines.push(`- **${g.topic}** [${g.coverage.toUpperCase()}]: ${g.initialStatus} → ${g.finalStatus}`)
    })
    lines.push(``)

    if (nextRoute.length > 0) {
      lines.push(`## Ruta de Aprendizaje Posterior`)
      nextRoute.forEach((g) => {
        lines.push(`- **${g.topic}** (${g.severity}): ${g.recommendedAction ?? 'Estudio autodidacta'}`)
      })
    }

    const markdownText = lines.join('\n')
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(markdownText).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  return (
    <section
      aria-label="Learning Report"
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e1e4e8',
        borderRadius: '8px',
        padding: '1.5rem',
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #eee',
          paddingBottom: '1rem',
          marginBottom: '1.2rem',
          flexWrap: 'wrap',
          gap: '0.8rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#161e2e' }}>
            Learning Report
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Tu progreso de aprendizaje al cierre del evento
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyMarkdown}
          style={{
            padding: '6px 14px',
            backgroundColor: copied ? '#10b981' : '#f8fafc',
            color: copied ? '#ffffff' : '#334155',
            border: copied ? '1px solid #10b981' : '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? '✓ Copiado en Markdown' : '📋 Copiar Reporte en Markdown'}
        </button>
      </div>

      {/* Resumen Ejecutivo y Barra de Progreso */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.2rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
            Progreso de Cobertura Formativa
          </strong>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>
            {`${coveragePercentage}%`}
          </span>
        </div>
        <div
          style={{
            height: '10px',
            backgroundColor: '#e2e8f0',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '0.8rem',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${coveragePercentage}%`,
              backgroundColor: coveragePercentage >= 80 ? '#10b981' : coveragePercentage >= 40 ? '#0284c7' : '#f59e0b',
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
          {executiveSummary}
        </p>
      </div>

      {/* Métricas clave */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: '1 1 120px', background: coverageVisuals.covered.bg, color: coverageVisuals.covered.color, borderRadius: '8px', padding: '0.8rem 1rem', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Cubiertos:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts.covered}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: coverageVisuals.partial.bg, color: coverageVisuals.partial.color, borderRadius: '8px', padding: '0.8rem 1rem', border: '1px solid #fef08a' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Parciales:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts.partial}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: coverageVisuals.pending.bg, color: coverageVisuals.pending.color, borderRadius: '8px', padding: '0.8rem 1rem', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Pendientes:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts.pending}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: '#f1f5f9', color: '#334155', borderRadius: '8px', padding: '0.8rem 1rem', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts.total}</div>
        </div>
      </div>

      {/* Compromisos de Implementación */}
      {reflectionsSummary.keyActionItems.length > 0 && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🚀 Compromisos de Implementación en tu Proyecto</span>
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {reflectionsSummary.keyActionItems.map((item, idx) => (
              <li key={idx} style={{ fontSize: '0.88rem', color: '#1e3a8a' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reflexiones Registradas */}
      {reflectionsSummary.items.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#4b5563' }}>
              {`Reflexiones Documentadas (${reflectionsSummary.totalReflections})`}
            </h4>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
              {`★ ${reflectionsSummary.averageRating} / 5 promedio`}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {reflectionsSummary.items.map((r, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.8rem 1rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{r.sessionId}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                </div>
                <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.85rem', color: '#334155' }}>
                  {r.takeaways}
                </p>
                {r.actionItem && (
                  <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 500 }}>
                    {`↳ Acción: ${r.actionItem}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle por Brecha */}
      <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', color: '#4b5563' }}>
        Detalle por brecha
      </h4>
      {gaps.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>No hay brechas registradas en tu journey.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {gaps.map((gap) => {
            const visual = coverageVisuals[gap.coverage]
            return (
              <li key={gap.gapId} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.6rem 0.8rem', flexWrap: 'wrap' }}>
                <span style={{ background: visual.bg, color: visual.color, fontSize: '0.72rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                  {visual.label}
                </span>
                <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{gap.topic}</strong>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                  {`${gap.initialStatus} → ${gap.finalStatus}`}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Ruta Posterior */}
      <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', color: '#4b5563' }}>
        {`Ruta de aprendizaje posterior (${nextRoute.length})`}
      </h4>
      {nextRoute.length === 0 ? (
        <p style={{ color: '#15803d', fontWeight: 600 }}>¡Cerraste todas tus brechas! No queda ruta pendiente.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {nextRoute.map((gap) => (
            <div
              key={gap.gapId}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.8rem',
                backgroundColor: '#fef2f2',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.88rem', color: '#991b1b' }}>{gap.topic}</strong>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  {gap.severity}
                </span>
              </div>
              {gap.recommendedAction && (
                <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                  💡 {gap.recommendedAction}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
