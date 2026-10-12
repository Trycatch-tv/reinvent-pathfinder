import React, { useState } from 'react'
import type { LearningReport, GapCoverage } from '@pathfinder/ai-knowledge'
import {
  FileText,
  Copy,
  Check,
  Rocket,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { colors, radii, shadows, spacing, typography } from '../theme/tokens.js'
import { Button } from './ui/Button.js'
import { Badge } from './ui/Badge.js'

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
  const [expandedGapIds, setExpandedGapIds] = useState<Set<string>>(new Set())

  const toggleGapExpand = (gapId: string) => {
    setExpandedGapIds((prev) => {
      const next = new Set(prev)
      if (next.has(gapId)) {
        next.delete(gapId)
      } else {
        next.add(gapId)
      }
      return next
    })
  }

  const safeReflections = reflectionsSummary ?? {
    totalReflections: 0,
    averageRating: 0,
    items: [],
    keyActionItems: [],
  }
  const keyActionItems = safeReflections.keyActionItems ?? []
  const reflectionItems = safeReflections.items ?? []
  const safeCounts = counts ?? { covered: 0, partial: 0, pending: 0, total: 0 }
  const safeGaps = gaps ?? []
  const safeNextRoute = nextRoute ?? []

  const handleCopyMarkdown = () => {
    const lines: string[] = [
      `# re:Invent Pathfinder — Learning Report`,
      ``,
      `**Fecha:** ${new Date(report.generatedAt).toLocaleDateString()}`,
      `**Cobertura Efectiva:** ${coveragePercentage}%`,
      `**Resumen Ejecutivo:** ${executiveSummary}`,
      ``,
      `## Métricas`,
      `- Cubiertos: ${safeCounts.covered}`,
      `- Parciales: ${safeCounts.partial}`,
      `- Pendientes: ${safeCounts.pending}`,
      `- Total Brechas: ${safeCounts.total}`,
      ``,
    ]

    if (keyActionItems.length > 0) {
      lines.push(`## Compromisos de Implementación en el Proyecto`)
      keyActionItems.forEach((item) => {
        lines.push(`- ${item}`)
      })
      lines.push(``)
    }

    if (reflectionItems.length > 0) {
      lines.push(`## Reflexiones Documentadas (${safeReflections.totalReflections})`)
      reflectionItems.forEach((r, idx) => {
        lines.push(`### Sesión ${idx + 1}: ${r.sessionId} (★ ${r.rating}/5)`)
        lines.push(`- **Aprendizaje:** ${r.takeaways}`)
        if (r.actionItem) {
          lines.push(`- **Acción:** ${r.actionItem}`)
        }
      })
      lines.push(``)
    }

    lines.push(`## Detalle por Brecha`)
    safeGaps.forEach((g) => {
      lines.push(`- **${g.topic}** [${g.coverage.toUpperCase()}]: ${g.initialStatus} → ${g.finalStatus}`)
    })
    lines.push(``)

    if (safeNextRoute.length > 0) {
      lines.push(`## Ruta de Aprendizaje Posterior`)
      safeNextRoute.forEach((g) => {
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
        backgroundColor: colors.neutral.white,
        border: `1px solid ${colors.neutral.slate200}`,
        borderRadius: radii.xl,
        padding: spacing.xl,
        marginTop: spacing.lg,
        boxShadow: shadows.sm,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: `1px solid ${colors.neutral.slate200}`,
          paddingBottom: spacing.md,
          marginBottom: spacing.lg,
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <FileText size={20} color={colors.brand.navy} />
            <h3 style={{ margin: 0, fontSize: typography.fontSize.xl, color: colors.brand.navy, fontWeight: typography.fontWeight.bold }}>
              Learning Report
            </h3>
            <Badge variant="teal">{`${coveragePercentage}% Cobertura`}</Badge>
          </div>
          <span style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate500 }}>
            Tu progreso de aprendizaje al cierre del evento
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyMarkdown}
          leftIcon={copied ? <Check size={14} color={colors.semantic.success} /> : <Copy size={14} />}
        >
          {copied ? 'Copiado en Markdown' : 'Copiar Reporte en Markdown'}
        </Button>
      </div>

      {/* Resumen Ejecutivo y Barra de Progreso */}
      <div
        style={{
          backgroundColor: colors.neutral.slate50,
          border: `1px solid ${colors.neutral.slate200}`,
          borderRadius: radii.lg,
          padding: spacing.lg,
          marginBottom: spacing.lg,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <strong style={{ fontSize: typography.fontSize.sm, color: colors.brand.navy }}>
            Progreso de Cobertura Formativa
          </strong>
          <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.brand.blue }}>
            {`${coveragePercentage}%`}
          </span>
        </div>
        <div
          style={{
            height: '8px',
            backgroundColor: colors.neutral.slate200,
            borderRadius: radii.full,
            overflow: 'hidden',
            marginBottom: '0.8rem',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${coveragePercentage}%`,
              backgroundColor: coveragePercentage >= 80 ? colors.semantic.success : coveragePercentage >= 40 ? colors.brand.blue : colors.semantic.warning,
              borderRadius: radii.full,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.neutral.slate700, lineHeight: 1.5 }}>
          {executiveSummary}
        </p>
      </div>

      {/* Métricas clave */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: spacing.lg }}>
        <div style={{ flex: '1 1 120px', background: coverageVisuals.covered.bg, color: coverageVisuals.covered.color, borderRadius: radii.md, padding: '0.8rem 1rem', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Cubiertos:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{safeCounts.covered}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: coverageVisuals.partial.bg, color: coverageVisuals.partial.color, borderRadius: radii.md, padding: '0.8rem 1rem', border: '1px solid #fef08a' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Parciales:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{safeCounts.partial}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: coverageVisuals.pending.bg, color: coverageVisuals.pending.color, borderRadius: radii.md, padding: '0.8rem 1rem', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Pendientes:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{safeCounts.pending}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: '#f1f5f9', color: '#334155', borderRadius: radii.md, padding: '0.8rem 1rem', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total:</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{safeCounts.total}</div>
        </div>
      </div>

      {/* Compromisos de Implementación */}
      {keyActionItems.length > 0 && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: radii.md,
            padding: '1rem',
            marginBottom: spacing.lg,
          }}
        >
          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: typography.fontSize.sm, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Rocket size={15} />
            <span>Compromisos de Implementación en tu Proyecto</span>
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {keyActionItems.map((item, idx) => (
              <li key={idx} style={{ fontSize: typography.fontSize.xs, color: '#1e3a8a' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reflexiones Registradas */}
      {reflectionItems.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h4 style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.brand.navy }}>
              {`Reflexiones Documentadas (${safeReflections.totalReflections})`}
            </h4>
            <span style={{ fontSize: typography.fontSize.xs, color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Star size={13} fill="#f59e0b" />
              {`${safeReflections.averageRating} / 5 promedio`}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {reflectionItems.map((r, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${colors.neutral.slate200}`,
                  borderRadius: radii.md,
                  padding: '0.8rem 1rem',
                  backgroundColor: colors.neutral.white,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <strong style={{ fontSize: typography.fontSize.xs, color: colors.brand.navy }}>{r.sessionId}</strong>
                  <span style={{ fontSize: typography.fontSize.xs, color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                </div>
                <p style={{ margin: '0 0 0.3rem 0', fontSize: typography.fontSize.xs, color: colors.neutral.slate700 }}>
                  {r.takeaways}
                </p>
                {r.actionItem && (
                  <div style={{ fontSize: '0.75rem', color: colors.brand.blue, fontWeight: 500 }}>
                    {`↳ Acción: ${r.actionItem}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle por Brecha con secciones expandibles */}
      <h4 style={{ margin: '0 0 0.6rem 0', fontSize: typography.fontSize.sm, color: colors.brand.navy }}>
        Detalle por brecha
      </h4>
      {safeGaps.length === 0 ? (
        <p style={{ color: colors.neutral.slate500, fontStyle: 'italic', fontSize: typography.fontSize.xs }}>No hay brechas registradas en tu journey.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {safeGaps.map((gap) => {
            const visual = coverageVisuals[gap.coverage]
            const isExpanded = expandedGapIds.has(gap.gapId)
            return (
              <li
                key={gap.gapId}
                style={{
                  border: `1px solid ${colors.neutral.slate200}`,
                  borderRadius: radii.md,
                  padding: '0.6rem 0.8rem',
                  backgroundColor: colors.neutral.white,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', width: '100%' }}>
                  <span style={{ background: visual.bg, color: visual.color, fontSize: '0.72rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: radii.full }}>
                    {visual.label}
                  </span>
                  <strong style={{ fontSize: typography.fontSize.xs, color: colors.brand.navy }}>{gap.topic}</strong>
                  <span style={{ fontSize: '0.75rem', color: colors.neutral.slate500, marginLeft: 'auto' }}>
                    {`${gap.initialStatus} → ${gap.finalStatus}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleGapExpand(gap.gapId)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: colors.neutral.slate400,
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                {isExpanded && (
                  <div style={{ fontSize: '0.75rem', color: colors.neutral.slate600, borderTop: `1px solid ${colors.neutral.slate100}`, paddingTop: '4px', marginTop: '2px' }}>
                    <span>Severidad: <strong>{gap.severity}</strong></span>
                    {gap.recommendedAction && <span> · Acción recomendada: {gap.recommendedAction}</span>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Ruta Posterior */}
      <h4 style={{ margin: '0 0 0.6rem 0', fontSize: typography.fontSize.sm, color: colors.brand.navy }}>
        {`Ruta de aprendizaje posterior (${safeNextRoute.length})`}
      </h4>
      {safeNextRoute.length === 0 ? (
        <p style={{ color: colors.semantic.success, fontWeight: 600, fontSize: typography.fontSize.xs }}>¡Cerraste todas tus brechas! No queda ruta pendiente.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {safeNextRoute.map((gap) => (
            <div
              key={gap.gapId}
              style={{
                border: `1px solid ${colors.semantic.dangerBorder}`,
                borderRadius: radii.md,
                padding: '0.8rem',
                backgroundColor: colors.semantic.dangerBg,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: typography.fontSize.xs, color: colors.semantic.danger }}>{gap.topic}</strong>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: colors.semantic.danger, padding: '2px 6px', borderRadius: radii.sm, fontWeight: 600 }}>
                  {gap.severity}
                </span>
              </div>
              {gap.recommendedAction && (
                <div style={{ fontSize: typography.fontSize.xs, color: colors.neutral.slate600 }}>
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
